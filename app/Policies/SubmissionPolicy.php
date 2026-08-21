<?php

namespace App\Policies;

use App\Models\Submission;
use App\Models\User;

class SubmissionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin() || $user->isGuru() || $user->isSiswa();
    }

    public function view(User $user, Submission $submission): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if ($user->isGuru()) {
            return (int) $submission->supervisor_id === (int) $user->id
                || $submission->loans()->where('supervisor_id', $user->id)->exists();
        }

        return (int) $submission->borrower_id === (int) $user->id;
    }
}
