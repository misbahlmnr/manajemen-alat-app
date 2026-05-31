<?php

namespace App\Policies;

use App\Models\Supply;
use App\Models\User;

class SupplyPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin() || $user->isSiswa();
    }

    public function view(User $user, Supply $supply): bool
    {
        return $user->isAdmin() || $user->isSiswa();
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, Supply $supply): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, Supply $supply): bool
    {
        return $user->isAdmin();
    }
}
