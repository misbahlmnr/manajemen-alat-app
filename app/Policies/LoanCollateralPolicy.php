<?php

namespace App\Policies;

use App\Models\LoanCollateral;
use App\Models\User;

class LoanCollateralPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    public function view(User $user, LoanCollateral $loanCollateral): bool
    {
        return $user->isAdmin();
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, LoanCollateral $loanCollateral): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, LoanCollateral $loanCollateral): bool
    {
        return $user->isAdmin();
    }

    public function hold(User $user, LoanCollateral $loanCollateral): bool
    {
        return $user->isAdmin();
    }

    public function returnCard(User $user, LoanCollateral $loanCollateral): bool
    {
        return $user->isAdmin();
    }

    public function completeCompensation(User $user, LoanCollateral $loanCollateral): bool
    {
        return $user->isAdmin();
    }

    public function inspect(User $user): bool
    {
        return $user->isAdmin();
    }
}
