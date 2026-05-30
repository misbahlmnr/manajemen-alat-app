<?php

namespace App\Policies;

use App\Models\PracticumSchedule;
use App\Models\User;

class PracticumSchedulePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    public function view(User $user, PracticumSchedule $practicumSchedule): bool
    {
        return $user->isAdmin();
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
