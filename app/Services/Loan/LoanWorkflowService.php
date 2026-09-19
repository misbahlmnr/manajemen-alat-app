<?php

namespace App\Services\Loan;

use App\Models\Equipment;
use App\Models\Loan;
use App\Models\LoanStatusLog;
use App\Models\User;
use App\Services\Notification\LabNotificationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LoanWorkflowService
{
    public function logStatus(Loan $loan, string $status, ?string $note, ?User $actor, bool $notify = true): void
    {
        LoanStatusLog::create([
            'loan_id' => $loan->id,
            'status' => $status,
            'note' => $note,
            'user_id' => $actor?->id,
            'created_at' => now(),
        ]);

        if ($notify) {
            app(LabNotificationService::class)->onStatusChange($loan->fresh(), $status, $note);
        }
    }

    public function approve(Loan $loan, User $actor): void
    {
        if ($loan->status !== 'diminta') {
            throw ValidationException::withMessages([
                'status' => $loan->status === 'antrian'
                    ? 'Pengajuan masih dalam antrian stok. Tunggu hingga stok tersedia atau atur prioritas antrian.'
                    : 'Hanya pengajuan menunggu yang dapat disetujui.',
            ]);
        }

        $queue = app(LoanQueueService::class);
        $loan->loadMissing('items.equipment');

        // Bawa Pulang: approve = reservasi (boleh meski available 0 karena Praktik Lab hold).
        if (! $loan->isBawaPulang() && ! $queue->allItemsAvailable($loan, includePending: false)) {
            if ($loan->allowsQueue()) {
                $queue->demoteToQueue($loan, $actor);

                throw ValidationException::withMessages([
                    'status' => 'Pengajuan masih dalam antrian stok. Tunggu hingga stok tersedia atau atur prioritas antrian.',
                ]);
            }

            throw ValidationException::withMessages([
                'status' => 'Stok alat tidak mencukupi. Pengajuan ini tidak menggunakan antrian.',
            ]);
        }

        try {
            DB::transaction(function () use ($loan, $actor, $queue) {
                // Alokasi stok segera saat disetujui. Force hanya untuk reservasi Bawa Pulang.
                $this->deductStock($loan, force: $loan->isBawaPulang());

                $loan->update(['status' => 'disetujui']);
                $this->logStatus($loan, 'disetujui', 'Pengajuan disetujui admin. Stok dialokasikan.', $actor);

                $equipmentIds = $loan->items->pluck('equipment_id')->all();
                $queue->demotePendingLoansForEquipments($equipmentIds, $actor, $loan->id);
            });
        } catch (ValidationException $e) {
            $loan->refresh();

            if ($loan->status === 'diminta' && $this->isInsufficientStockException($e)) {
                if ($loan->allowsQueue()) {
                    $queue->demoteToQueue($loan, $actor);

                    throw ValidationException::withMessages([
                        'status' => 'Pengajuan masih dalam antrian stok. Tunggu hingga stok tersedia atau atur prioritas antrian.',
                    ]);
                }

                throw ValidationException::withMessages([
                    'status' => 'Stok alat tidak mencukupi. Pengajuan ini tidak menggunakan antrian.',
                ]);
            }

            throw $e;
        }
    }

    public function reject(Loan $loan, string $reason, User $actor): void
    {
        if (! in_array($loan->status, ['diminta', 'antrian', 'menunggu_alat', 'disetujui'], true)) {
            throw ValidationException::withMessages([
                'status' => 'Pengajuan ini tidak dapat ditolak.',
            ]);
        }

        DB::transaction(function () use ($loan, $reason, $actor) {
            $loan->update([
                'status' => 'ditolak',
                'rejection_reason' => $reason,
                'queued_at' => null,
            ]);

            $this->restoreStock($loan);

            app(CollateralWorkflowService::class)->removePendingCollateralIfExists($loan->fresh());

            $this->logStatus($loan, 'ditolak', $reason, $actor);
        });
    }

    /**
     * Serah fisik: disetujui → dipinjam (alat) atau diambil (bahan).
     *
     * `borrowed_at` is reused as the outbound timestamp for both item types
     * (no separate taken_at column):
     * - alat: waktu mulai dipinjam
     * - bahan: waktu barang diambil/diserahkan dari laboratorium
     * Semantics differ by `status`, not by the timestamp column name.
     */
    public function markBorrowed(Loan $loan, User $actor): void
    {
        if ($loan->status !== 'disetujui') {
            throw ValidationException::withMessages([
                'status' => 'Hanya pengajuan yang sudah disetujui dapat diserahkan.',
            ]);
        }

        if ($loan->isAlat() && $loan->requiresCollateral()) {
            $loan->loadMissing('collateral');
            if ($loan->collateral?->status !== 'ditahan') {
                throw ValidationException::withMessages([
                    'status' => 'Terima kartu pelajar terlebih dahulu sebelum menyerahkan alat.',
                ]);
            }
        }

        DB::transaction(function () use ($loan, $actor) {
            // Stok sudah dialokasikan saat Disetujui; serah terima hanya mengubah status.
            if (! $loan->stock_held) {
                $this->deductStock($loan, force: true);
            }

            $borrowedAt = $loan->borrowed_at ?? now();

            if ($loan->isAlat()) {
                $dueAt = app(LoanQueueService::class)->clampDueAtToTimeSlice($loan, $borrowedAt);

                $loan->update([
                    'status' => 'dipinjam',
                    'borrowed_at' => $borrowedAt,
                    'due_at' => $dueAt,
                ]);
                $this->logStatus($loan, 'dipinjam', 'Alat diserahkan ke peminjam.', $actor);

                return;
            }

            $loan->update([
                'status' => 'diambil',
                'borrowed_at' => $borrowedAt,
            ]);
            $this->logStatus($loan, 'diambil', 'Bahan telah diambil.', $actor);
        });
    }

    public function processReturn(Loan $loan, ?string $note, User $actor): void
    {
        if (! $loan->isActivelyBorrowed()) {
            throw ValidationException::withMessages([
                'status' => 'Pengembalian hanya untuk peminjaman alat yang sedang dipinjam.',
            ]);
        }

        if ($loan->requiresReturnInspection()) {
            app(CollateralWorkflowService::class)->requestReturnInspection($loan, $note, $actor);

            return;
        }

        DB::transaction(function () use ($loan, $note, $actor) {
            $loan->update([
                'status' => 'dikembalikan',
                'returned_at' => now(),
            ]);
            $this->restoreStock($loan);
            $this->logStatus($loan, 'dikembalikan', $note ?? 'Alat telah dikembalikan.', $actor);
        });
    }

    public function cancel(Loan $loan, User $actor): void
    {
        if (in_array($loan->status, ['dikembalikan', 'ditolak', 'dibatalkan'], true)) {
            throw ValidationException::withMessages([
                'status' => 'Peminjaman ini sudah selesai.',
            ]);
        }

        DB::transaction(function () use ($loan, $actor) {
            app(CollateralWorkflowService::class)->removePendingCollateralIfExists($loan);

            $loan->update(['status' => 'dibatalkan']);

            $this->restoreStock($loan);

            $this->logStatus($loan, 'dibatalkan', 'Peminjaman dibatalkan.', $actor);
        });
    }

    public function syncOverdue(): void
    {
        $this->syncHeldStock();

        $loans = Loan::query()
            ->where('item_type', 'alat')
            ->where('status', 'dipinjam')
            ->whereNotNull('due_at')
            ->where('due_at', '<', now())
            ->with(['borrower', 'supervisor'])
            ->get();

        foreach ($loans as $loan) {
            $loan->update(['status' => 'terlambat']);
            $this->logStatus($loan, 'terlambat', 'Peminjaman melewati batas waktu.', null);
        }
    }

    /**
     * Safety net: pastikan stok sudah dipegang untuk loan yang sudah disetujui.
     */
    public function syncHeldStock(): void
    {
        $loans = Loan::query()
            ->where('item_type', 'alat')
            ->where('stock_held', false)
            ->whereIn('status', ['disetujui', 'dipinjam', 'terlambat', 'menunggu_inspeksi'])
            ->with(['items.equipment'])
            ->get();

        foreach ($loans as $loan) {
            try {
                $this->deductStock($loan, force: true);
            } catch (ValidationException) {
                // Stok fisik belum kembali.
            }
        }
    }

    public function deductStock(Loan $loan, bool $force = false): void
    {
        $loan->loadMissing('items.equipment');

        if ($loan->stock_held) {
            return;
        }

        foreach ($loan->items as $item) {
            $equipment = $item->equipment;

            if ($force) {
                // Reservasi Bawa Pulang: boleh available sementara negatif jika unit masih di Praktik Lab.
                // Batas keras: tidak melebihi kapasitas fisik inventaris.
                if ($item->quantity > $equipment->stock) {
                    throw ValidationException::withMessages([
                        'items' => "Stok {$equipment->name} tidak mencukupi (kapasitas: {$equipment->stock}).",
                    ]);
                }
            } elseif ($equipment->available < $item->quantity) {
                throw ValidationException::withMessages([
                    'items' => "Stok {$equipment->name} tidak mencukupi.",
                ]);
            }

            $equipment->decrement('available', $item->quantity);
        }

        $loan->update(['stock_held' => true]);
    }

    public function restoreStock(Loan $loan): void
    {
        $loan->loadMissing('items.equipment');

        if ($loan->stock_held) {
            foreach ($loan->items as $item) {
                $equipment = $item->equipment;
                $equipment->increment('available', min($item->quantity, $equipment->stock - $equipment->available));
            }

            $loan->update(['stock_held' => false]);
        }

        app(LoanQueueService::class)->processQueueAfterLoanItemsReleased($loan);
    }

    private function isInsufficientStockException(ValidationException $e): bool
    {
        $messages = $e->errors()['items'] ?? $e->errors()['status'] ?? [];

        foreach ($messages as $message) {
            if (str_contains((string) $message, 'tidak mencukupi')) {
                return true;
            }
        }

        return false;
    }

    public function validateStockForItems(array $items, string $itemType, ?int $borrowerId = null): void
    {
        foreach ($items as $row) {
            $equipment = Equipment::query()->find($row['equipment_id']);
            if (! $equipment || $equipment->item_type !== $itemType) {
                throw ValidationException::withMessages([
                    'items' => 'Barang tidak valid untuk jenis peminjaman ini.',
                ]);
            }
            if (! $equipment->isAvailableForInventory()) {
                throw ValidationException::withMessages([
                    'items' => "{$equipment->name} sedang tidak tersedia untuk dipinjam.",
                ]);
            }
            if ($equipment->available < (int) $row['quantity']) {
                if ($borrowerId) {
                    $activeLoan = Loan::query()
                        ->where('borrower_id', $borrowerId)
                        ->whereIn('status', ['dipinjam', 'terlambat', 'menunggu_inspeksi'])
                        ->whereHas('items', fn ($q) => $q->where('equipment_id', $equipment->id))
                        ->first(['id', 'code']);

                    if ($activeLoan) {
                        throw ValidationException::withMessages([
                            'items' => "{$equipment->name} masih dalam peminjaman aktif ({$activeLoan->code}). Ajukan pengembalian terlebih dahulu.",
                        ]);
                    }
                }

                throw ValidationException::withMessages([
                    'items' => "Stok {$equipment->name} tidak mencukupi (tersedia: {$equipment->available}).",
                ]);
            }
        }
    }
}
