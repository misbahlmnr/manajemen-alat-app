<?php

namespace App\Policies;

use App\Models\PracticumSchedule;
use App\Models\User;

class PracticumSchedulePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin() || $user->isGuru();
    }

    public function view(User $user, PracticumSchedule $practicumSchedule): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $user->isGuru()
            && $practicumSchedule->guru_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, PracticumSchedule $practicumSchedule): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, PracticumSchedule $practicumSchedule): bool
    {
        return $user->isAdmin();
    }
}
