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
        $loan->loadMissing(['borrower:id,name,class', 'supervisor:id,name', 'items.equipment:id,name']);

        $summary = $this->loanSummary($loan);
        $borrower = $loan->borrower?->name ?? 'Siswa';

        $this->notifyUsers(
            $this->admins(),
            'loan_submitted',
            'Pengajuan Peminjaman Baru',
            "{$borrower} mengajukan peminjaman {$loan->code} — {$summary}.",
            'info',
            route('admin.loans.show', $loan),
            $loan,
        );

        if ($loan->supervisor_id) {
            $this->notifyUser(
                $loan->supervisor,
                'loan_submitted',
                'Pengajuan Siswa Bimbingan',
                "{$borrower} mengajukan peminjaman {$loan->code} — {$summary}.",
                'info',
                route('guru.loans.show', $loan),
                $loan,
            );
        }
    }

    public function loanApproved(Loan $loan): void
    {
        $loan->loadMissing('borrower:id,name');

        $statusLabel = $loan->status === 'dipinjam' ? 'disetujui dan siap diambil' : 'disetujui';

        $this->notifyUser(
            $loan->borrower,
            'loan_approved',
            'Pengajuan Disetujui',
            "Peminjaman {$loan->code} telah {$statusLabel}.",
            'success',
            route('siswa.loans.show', $loan),
            $loan,
        );
    }

    public function loanRejected(Loan $loan, ?string $reason = null): void
    {
        $loan->loadMissing(['borrower:id,name', 'supervisor:id,name']);
        $detail = $reason ? " Alasan: {$reason}" : '';

        $this->notifyUser(
            $loan->borrower,
            'loan_rejected',
            'Pengajuan Ditolak',
            "Peminjaman {$loan->code} ditolak.{$detail}",
            'error',
            route('siswa.loans.show', $loan),
            $loan,
        );

        if ($loan->supervisor_id) {
            $this->notifyUser(
                $loan->supervisor,
                'loan_rejected',
                'Pengajuan Siswa Ditolak',
                "Peminjaman {$loan->code} milik {$loan->borrower?->name} ditolak.",
                'warning',
                route('guru.loans.show', $loan),
                $loan,
            );
        }
    }

    public function loanBorrowed(Loan $loan): void
    {
        $loan->loadMissing('borrower:id,name');

        $this->notifyUser(
            $loan->borrower,
            'loan_borrowed',
            'Alat Diserahkan',
            "Peminjaman {$loan->code} telah diserahkan. Pastikan pengembalian tepat waktu.",
            'success',
            route('siswa.loans.show', $loan),
            $loan,
        );
    }

    public function loanReturnRequested(Loan $loan): void
    {
        $loan->loadMissing(['borrower:id,name', 'supervisor:id,name']);
        $borrower = $loan->borrower?->name ?? 'Siswa';

        $this->notifyUsers(
            $this->admins(),
            'loan_return_requested',
            'Permintaan Pengembalian',
            "{$borrower} meminta pengembalian {$loan->code}. Perlu inspeksi admin.",
            'warning',
            route('admin.loans.show', $loan),
            $loan,
        );

        if ($loan->supervisor_id) {
            $this->notifyUser(
                $loan->supervisor,
                'loan_return_requested',
                'Siswa Meminta Pengembalian',
                "{$borrower} mengajukan pengembalian {$loan->code}.",
                'info',
                route('guru.loans.show', $loan),
                $loan,
            );
        }
    }

    public function loanReturned(Loan $loan): void
    {
        $loan->loadMissing(['borrower:id,name', 'supervisor:id,name']);

        $this->notifyUser(
            $loan->borrower,
            'loan_returned',
            'Peminjaman Selesai',
            "Peminjaman {$loan->code} telah dikembalikan dan ditutup.",
            'success',
            route('siswa.loans.show', $loan),
            $loan,
        );

        if ($loan->supervisor_id) {
            $this->notifyUser(
                $loan->supervisor,
                'loan_returned',
                'Peminjaman Siswa Selesai',
                "Peminjaman {$loan->code} milik {$loan->borrower?->name} telah dikembalikan.",
                'success',
                route('guru.loans.show', $loan),
                $loan,
            );
        }
    }

    public function loanCancelled(Loan $loan): void
    {
        $loan->loadMissing(['borrower:id,name', 'supervisor:id,name']);
        $borrower = $loan->borrower?->name ?? 'Siswa';

        $this->notifyUsers(
            $this->admins(),
            'loan_cancelled',
            'Peminjaman Dibatalkan',
            "{$borrower} membatalkan peminjaman {$loan->code}.",
            'warning',
            route('admin.loans.show', $loan),
            $loan,
        );

        if ($loan->supervisor_id) {
            $this->notifyUser(
                $loan->supervisor,
                'loan_cancelled',
                'Peminjaman Siswa Dibatalkan',
                "{$borrower} membatalkan peminjaman {$loan->code}.",
                'warning',
                route('guru.loans.show', $loan),
                $loan,
            );
        }
    }

    public function loanOverdue(Loan $loan): void
    {
        $loan->loadMissing(['borrower:id,name', 'supervisor:id,name']);
        $borrower = $loan->borrower?->name ?? 'Siswa';

        $this->notifyUser(
            $loan->borrower,
            'loan_overdue',
            'Peminjaman Terlambat',
            "Peminjaman {$loan->code} melewati batas waktu. Segera kembalikan alat.",
            'error',
            route('siswa.loans.show', $loan),
            $loan,
        );

        $this->notifyUsers(
            $this->admins(),
            'loan_overdue',
            'Peminjaman Terlambat',
            "{$borrower} — peminjaman {$loan->code} terlambat dikembalikan.",
            'error',
            route('admin.loans.show', $loan),
            $loan,
        );

        if ($loan->supervisor_id) {
            $this->notifyUser(
                $loan->supervisor,
                'loan_overdue',
                'Siswa Bimbingan Terlambat',
                "{$borrower} — peminjaman {$loan->code} terlambat.",
                'error',
                route('guru.loans.show', $loan),
                $loan,
            );
        }
    }

    public function compensationRequired(Loan $loan): void
    {
        $loan->loadMissing(['borrower:id,name', 'supervisor:id,name']);

        $this->notifyUser(
            $loan->borrower,
            'compensation_required',
            'Kompensasi Diperlukan',
            "Pengembalian {$loan->code} memerlukan kompensasi. Kartu pelajar ditahan.",
            'error',
            route('siswa.loans.show', $loan),
            $loan,
        );

        if ($loan->supervisor_id) {
            $this->notifyUser(
                $loan->supervisor,
                'compensation_required',
                'Kompensasi Siswa Bimbingan',
                "Peminjaman {$loan->code} memerlukan kompensasi dari {$loan->borrower?->name}.",
                'warning',
                route('guru.loans.show', $loan),
                $loan,
            );
        }
    }

    public function compensationCompleted(Loan $loan): void
    {
        $loan->loadMissing('borrower:id,name');

        $this->notifyUser(
            $loan->borrower,
            'compensation_completed',
            'Kompensasi Selesai',
            "Kompensasi peminjaman {$loan->code} telah diselesaikan. Kartu dapat diambil.",
            'success',
            route('siswa.loans.show', $loan),
            $loan,
        );
    }

    public function collateralHeld(LoanCollateral $collateral): void
    {
        $collateral->loadMissing(['loan.borrower:id,name', 'loan:id,code']);
        $loan = $collateral->loan;

        if (! $loan?->borrower) {
            return;
        }

        $this->notifyUser(
            $loan->borrower,
            'collateral_held',
            'Kartu Pelajar Ditahan',
            "Kartu pelajar ditahan untuk jaminan peminjaman {$loan->code}.",
            'warning',
            route('siswa.loans.show', $loan),
            $loan,
        );
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
        if (! $user || $user->status !== 'active') {
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

    private function loanSummary(Loan $loan): string
    {
        $items = $loan->relationLoaded('items')
            ? $loan->items->map(fn ($item) => $item->equipment?->name)->filter()->join(', ')
            : '';

        $type = $loan->item_type === 'alat' ? 'Alat' : 'Bahan';

        return trim("{$type}".($items ? " — {$items}" : ''));
    }
}
