<?php

namespace App\Services\Notification;

use App\Models\Loan;
use App\Models\LoanCollateral;
use App\Models\User;
use App\Notifications\LabNotification;
use Illuminate\Support\Collection;

class LabNotificationService
{
    public function loanSubmitted(Loan $loan): void
    {
        $loan->loadMissing(['borrower', 'supervisor', 'items.equipment:id,name']);

        $summary = $this->loanSummary($loan);
        $borrower = $loan->borrower?->name ?? 'Siswa';
        $isQueued = $loan->status === 'antrian';

        $this->notifyUsers(
            $this->admins(),
            $isQueued ? 'loan_queued' : 'loan_submitted',
            $isQueued ? 'Pengajuan Masuk Antrian Stok' : 'Pengajuan Peminjaman Baru',
            $isQueued
                ? "{$borrower} masuk antrian {$loan->displayCode()} — {$summary}."
                : "{$borrower} mengajukan peminjaman {$loan->displayCode()} — {$summary}.",
            $isQueued ? 'warning' : 'info',
            route('admin.loans.show', $loan),
            $loan,
        );

        if ($loan->supervisor_id) {
            $this->notifyUser(
                $loan->supervisor,
                $isQueued ? 'loan_queued' : 'loan_submitted',
                $isQueued ? 'Siswa Masuk Antrian Stok' : 'Pengajuan Siswa Bimbingan',
                $isQueued
                    ? "{$borrower} masuk antrian {$loan->displayCode()} — {$summary}."
                    : "{$borrower} mengajukan peminjaman {$loan->displayCode()} — {$summary}.",
                $isQueued ? 'warning' : 'info',
                route('guru.loans.show', $loan),
                $loan,
            );
        }

        if ($loan->borrower) {
            $this->notifyUser(
                $loan->borrower,
                $isQueued ? 'loan_queued' : 'loan_submitted',
                $isQueued ? 'Pengajuan Masuk Antrian' : 'Pengajuan Terkirim',
                $isQueued
                    ? "Pengajuan {$loan->displayCode()} masuk antrian karena stok habis. Anda akan diberitahu saat stok tersedia."
                    : "Pengajuan {$loan->displayCode()} berhasil dikirim dan menunggu persetujuan.",
                $isQueued ? 'warning' : 'info',
                route('siswa.loans.show', $loan),
                $loan,
            );
        }
    }

    public function loanPromotedFromQueue(Loan $loan): void
    {
        $loan->loadMissing(['borrower', 'supervisor']);

        $this->notifyUser(
            $loan->borrower,
            'loan_promoted',
            'Stok Tersedia — Siap Ditinjau',
            "Pengajuan {$loan->displayCode()} keluar dari antrian. Menunggu persetujuan admin.",
            'success',
            route('siswa.loans.show', $loan),
            $loan,
        );

        $this->notifyUsers(
            $this->admins(),
            'loan_promoted',
            'Antrian Stok — Siap Ditinjau',
            "Pengajuan {$loan->displayCode()} dari {$loan->borrower?->name} siap ditinjau (stok tersedia).",
            'info',
            route('admin.loans.show', $loan),
            $loan,
        );
    }

    public function loanMovedToQueue(Loan $loan): void
    {
        $loan->loadMissing(['borrower', 'supervisor']);

        $this->notifyUser(
            $loan->borrower,
            'loan_queued',
            'Pengajuan Masuk Antrian',
            "Pengajuan {$loan->displayCode()} masuk antrian karena stok tidak mencukupi. Anda akan diberitahu saat stok tersedia.",
            'warning',
            route('siswa.loans.show', $loan),
            $loan,
        );

        $this->notifyUsers(
            $this->admins(),
            'loan_queued',
            'Pengajuan Dipindah ke Antrian Stok',
            "Pengajuan {$loan->displayCode()} dari {$loan->borrower?->name} masuk antrian karena stok tidak mencukupi.",
            'warning',
            route('admin.loans.show', $loan),
            $loan,
        );
    }

    public function loanApproved(Loan $loan): void
    {
        $loan->loadMissing(['borrower', 'supervisor']);

        $statusLabel = $loan->status === 'dipinjam' ? 'disetujui dan siap diambil' : 'disetujui';
        $borrowerName = $loan->borrower?->name ?? 'Siswa';

        $this->notifyUser(
            $loan->borrower,
            'loan_approved',
            'Pengajuan Disetujui',
            "Peminjaman {$loan->displayCode()} telah {$statusLabel}.",
            'success',
            route('siswa.loans.show', $loan),
            $loan,
        );

        if ($loan->supervisor_id) {
            $this->notifyUser(
                $loan->supervisor,
                'loan_approved',
                'Pengajuan Siswa Disetujui',
                "Peminjaman {$loan->displayCode()} milik {$borrowerName} telah {$statusLabel}.",
                'success',
                route('guru.loans.show', $loan),
                $loan,
            );
        }
    }

    public function loanRejected(Loan $loan, ?string $reason = null): void
    {
        $loan->loadMissing(['borrower', 'supervisor']);
        $detail = $reason ? " Alasan: {$reason}" : '';

        $this->notifyUser(
            $loan->borrower,
            'loan_rejected',
            'Pengajuan Ditolak',
            "Peminjaman {$loan->displayCode()} ditolak.{$detail}",
            'error',
            route('siswa.loans.show', $loan),
            $loan,
        );

        if ($loan->supervisor_id) {
            $this->notifyUser(
                $loan->supervisor,
                'loan_rejected',
                'Pengajuan Siswa Ditolak',
                "Peminjaman {$loan->displayCode()} milik {$loan->borrower?->name} ditolak.",
                'warning',
                route('guru.loans.show', $loan),
                $loan,
            );
        }
    }

    public function loanBorrowed(Loan $loan): void
    {
        $loan->loadMissing('borrower');

        $this->notifyUser(
            $loan->borrower,
            'loan_borrowed',
            'Alat Diserahkan',
            "Peminjaman {$loan->displayCode()} telah diserahkan. Pastikan pengembalian tepat waktu.",
            'success',
            route('siswa.loans.show', $loan),
            $loan,
        );
    }

    public function loanReturnRequested(Loan $loan): void
    {
        $loan->loadMissing(['borrower', 'supervisor']);
        $borrower = $loan->borrower?->name ?? 'Siswa';

        $this->notifyUser(
            $loan->borrower,
            'loan_return_requested',
            'Pengembalian Diajukan',
            "Pengajuan pengembalian {$loan->displayCode()} diterima. Menunggu inspeksi admin.",
            'info',
            route('siswa.loans.show', $loan),
            $loan,
        );

        $this->notifyUsers(
            $this->admins(),
            'loan_return_requested',
            'Permintaan Pengembalian',
            "{$borrower} meminta pengembalian {$loan->displayCode()}. Perlu inspeksi admin.",
            'warning',
            route('admin.loans.show', $loan),
            $loan,
        );

        if ($loan->supervisor_id) {
            $this->notifyUser(
                $loan->supervisor,
                'loan_return_requested',
                'Siswa Meminta Pengembalian',
                "{$borrower} mengajukan pengembalian {$loan->displayCode()}.",
                'info',
                route('guru.loans.show', $loan),
                $loan,
            );
        }
    }

    public function loanReturned(Loan $loan): void
    {
        $loan->loadMissing(['borrower', 'supervisor']);

        $this->notifyUser(
            $loan->borrower,
            'loan_returned',
            'Peminjaman Selesai',
            "Peminjaman {$loan->displayCode()} telah dikembalikan dan ditutup.",
            'success',
            route('siswa.loans.show', $loan),
            $loan,
        );

        if ($loan->supervisor_id) {
            $this->notifyUser(
                $loan->supervisor,
                'loan_returned',
                'Peminjaman Siswa Selesai',
                "Peminjaman {$loan->displayCode()} milik {$loan->borrower?->name} telah dikembalikan.",
                'success',
                route('guru.loans.show', $loan),
                $loan,
            );
        }
    }

    public function loanCancelled(Loan $loan): void
    {
        $loan->loadMissing(['borrower', 'supervisor']);
        $borrower = $loan->borrower?->name ?? 'Siswa';

        $this->notifyUser(
            $loan->borrower,
            'loan_cancelled',
            'Peminjaman Dibatalkan',
            "Peminjaman {$loan->displayCode()} telah dibatalkan.",
            'warning',
            route('siswa.loans.show', $loan),
            $loan,
        );

        $this->notifyUsers(
            $this->admins(),
            'loan_cancelled',
            'Peminjaman Dibatalkan',
            "{$borrower} membatalkan peminjaman {$loan->displayCode()}.",
            'warning',
            route('admin.loans.show', $loan),
            $loan,
        );

        if ($loan->supervisor_id) {
            $this->notifyUser(
                $loan->supervisor,
                'loan_cancelled',
                'Peminjaman Siswa Dibatalkan',
                "{$borrower} membatalkan peminjaman {$loan->displayCode()}.",
                'warning',
                route('guru.loans.show', $loan),
                $loan,
            );
        }
    }

    public function loanOverdue(Loan $loan): void
    {
        $loan->loadMissing(['borrower', 'supervisor']);
        $borrower = $loan->borrower?->name ?? 'Siswa';

        $this->notifyUser(
            $loan->borrower,
            'loan_overdue',
            'Peminjaman Terlambat',
            "Peminjaman {$loan->displayCode()} melewati batas waktu. Segera kembalikan alat.",
            'error',
            route('siswa.loans.show', $loan),
            $loan,
        );

        $this->notifyUsers(
            $this->admins(),
            'loan_overdue',
            'Peminjaman Terlambat',
            "{$borrower} — peminjaman {$loan->displayCode()} terlambat dikembalikan.",
            'error',
            route('admin.loans.show', $loan),
            $loan,
        );

        if ($loan->supervisor_id) {
            $this->notifyUser(
                $loan->supervisor,
                'loan_overdue',
                'Siswa Bimbingan Terlambat',
                "{$borrower} — peminjaman {$loan->displayCode()} terlambat.",
                'error',
                route('guru.loans.show', $loan),
                $loan,
            );
        }
    }

    public function compensationRequired(Loan $loan, ?array $inspectionData = null): void
    {
        $loan->loadMissing(['borrower', 'supervisor', 'compensation', 'collateral', 'inspection']);

        $result = $inspectionData['result'] ?? $loan->inspection?->result;
        $damageDescription = $inspectionData['damage_description'] ?? $loan->inspection?->damage_description;
        $studentInstruction = $inspectionData['description'] ?? $loan->compensation?->description;

        $isDamaged = $result === 'rusak';

        if ($isDamaged) {
            $title = 'Alat Rusak';
            $message = $damageDescription
                ? "Alat rusak: {$damageDescription}."
                : "Alat peminjaman {$loan->displayCode()} dinyatakan rusak.";
            $message .= ' '.($studentInstruction ?: 'Segera datang ke kantor lab untuk penyelesaian.');
            $eventType = 'equipment_damaged';
        } else {
            $missingItems = $inspectionData['missing_items'] ?? $loan->inspection?->missing_items;
            $title = 'Pengembalian Tidak Lengkap';
            $message = $missingItems
                ? "Pengembalian {$loan->displayCode()} tidak lengkap: {$missingItems}."
                : "Pengembalian {$loan->displayCode()} tidak lengkap.";
            $message .= ' '.($studentInstruction ?: 'Segera datang ke kantor lab untuk penyelesaian.');
            $eventType = 'compensation_required';
        }

        $this->notifyUser(
            $loan->borrower,
            $eventType,
            $title,
            $message,
            'error',
            route('siswa.loans.show', $loan),
            $loan,
        );

        $this->notifyUsers(
            $this->admins(),
            $eventType,
            $isDamaged ? 'Alat Rusak' : 'Pengembalian Tidak Lengkap',
            "{$loan->borrower?->name} — {$message}",
            'warning',
            route('admin.loans.show', $loan),
            $loan,
        );

        if ($loan->supervisor_id) {
            $this->notifyUser(
                $loan->supervisor,
                $eventType,
                $isDamaged ? 'Alat Rusak — Siswa Bimbingan' : 'Pengembalian Tidak Lengkap',
                "{$loan->borrower?->name} — {$message}",
                'warning',
                route('guru.loans.show', $loan),
                $loan,
            );
        }
    }

    public function compensationCompleted(Loan $loan): void
    {
        $loan->loadMissing('borrower');

        $this->notifyUser(
            $loan->borrower,
            'compensation_completed',
            'Kompensasi Selesai',
            "Kompensasi peminjaman {$loan->displayCode()} telah diselesaikan. Kartu dapat diambil.",
            'success',
            route('siswa.loans.show', $loan),
            $loan,
        );
    }

    public function collateralHeld(LoanCollateral $collateral): void
    {
        $collateral->loadMissing(['loan.borrower', 'loan']);
        $loan = $collateral->loan;

        if (! $loan?->borrower) {
            return;
        }

        $this->notifyUser(
            $loan->borrower,
            'collateral_held',
            'Kartu Pelajar Diterima',
            "Kartu pelajar diterima sebagai jaminan peminjaman {$loan->displayCode()}.",
            'warning',
            route('siswa.loans.show', $loan),
            $loan,
        );
    }

    public function onStatusChange(Loan $loan, string $status, ?string $note = null): void
    {
        match ($status) {
            'disetujui' => $this->loanApproved($loan),
            'ditolak' => $this->loanRejected($loan, $note),
            'dipinjam' => str_contains($note ?? '', 'diserahkan')
                ? $this->loanBorrowed($loan)
                : $this->loanApproved($loan),
            'terlambat' => $this->loanOverdue($loan),
            'dikembalikan' => $this->loanReturned($loan),
            'dibatalkan' => $this->loanCancelled($loan),
            'menunggu_inspeksi' => $this->loanReturnRequested($loan),
            default => null,
        };
    }

    private function notifyUser(
        ?User $user,
        string $eventType,
        string $title,
        string $message,
        string $severity,
        ?string $actionUrl,
        ?Loan $loan = null,
    ): void {
        $user = $this->resolveActiveUser($user);
        if (! $user) {
            return;
        }

        $user->notify(new LabNotification(
            eventType: $eventType,
            title: $title,
            message: $message,
            severity: $severity,
            actionUrl: $actionUrl,
            loanId: $loan?->id,
            loanCode: $loan?->code,
        ));
    }

    private function notifyUsers(
        Collection $users,
        string $eventType,
        string $title,
        string $message,
        string $severity,
        ?string $actionUrl,
        ?Loan $loan = null,
    ): void {
        foreach ($users as $user) {
            $this->notifyUser($user, $eventType, $title, $message, $severity, $actionUrl, $loan);
        }
    }

    private function admins(): Collection
    {
        return User::query()
            ->where('role', 'admin')
            ->where('status', 'active')
            ->get();
    }

    private function resolveActiveUser(?User $user): ?User
    {
        if (! $user?->id) {
            return null;
        }

        if ($user->status === 'active') {
            return $user;
        }

        return User::query()
            ->where('id', $user->id)
            ->where('status', 'active')
            ->first();
    }

    private function loanSummary(Loan $loan): string
    {
        $items = $loan->relationLoaded('items')
            ? $loan->items->map(fn ($item) => $item->equipment?->name)->filter()->join(', ')
            : '';

        $type = $loan->item_type === 'alat' ? 'Alat' : 'Bahan';

        return trim("{$type}".($items ? " — {$items}" : ''));
    }
}
