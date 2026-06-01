<?php

namespace App\Policies;

use App\Models\Loan;
use App\Models\User;

class LoanPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin() || $user->isGuru() || $user->isSiswa();
    }

    public function view(User $user, Loan $loan): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if ($user->isGuru()) {
            return $loan->supervisor_id === $user->id;
        }

        return $loan->borrower_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->isSiswa();
    }

    public function update(User $user, Loan $loan): bool
    {
        return $user->isSiswa()
            && $loan->borrower_id === $user->id
            && in_array($loan->status, ['diminta', 'antrian', 'disetujui'], true);
    }

    public function delete(User $user, Loan $loan): bool
    {
        return $user->isAdmin();
    }

    public function approve(User $user, Loan $loan): bool
    {
        return $user->isAdmin();
    }

    public function reject(User $user, Loan $loan): bool
    {
        return $user->isAdmin();
    }

    public function markBorrowed(User $user, Loan $loan): bool
    {
        return $user->isAdmin();
    }

    public function processReturn(User $user, Loan $loan): bool
    {
        return $user->isAdmin();
    }

    public function cancel(User $user, Loan $loan): bool
    {
        return $user->isSiswa()
            && $loan->borrower_id === $user->id
            && in_array($loan->status, ['diminta', 'antrian', 'disetujui'], true);
    }

    public function requestReturn(User $user, Loan $loan): bool
    {
        return $user->isSiswa()
            && $loan->borrower_id === $user->id
            && $loan->isAlat()
            && in_array($loan->status, ['dipinjam', 'terlambat'], true);
    }
}
