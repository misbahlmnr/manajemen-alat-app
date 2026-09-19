<?php

namespace App\Services\Loan;

use App\Models\Loan;
use App\Models\Submission;
use App\Models\User;

/**
 * Business rules for submission-level decisions (not UI aggregate).
 */
class SubmissionDecisionService
{
    /** @var list<string> */
    public const REJECTABLE_LOAN_STATUSES = [
        'diminta',
        'antrian',
        'menunggu_alat',
        'disetujui',
    ];

    /** @var list<string> */
    public const CANCELLABLE_LOAN_STATUSES = [
        'diminta',
        'antrian',
        'menunggu_alat',
        'disetujui',
    ];

    public function hasWaitingMaterial(Submission $submission): bool
    {
        return $this->loans($submission)
            ->contains(fn (Loan $loan) => $loan->item_type === 'bahan'
                && $loan->status === 'menunggu_alat');
    }

    public function needsApproval(Submission $submission): bool
    {
        return $this->loans($submission)
            ->contains(fn (Loan $loan) => $loan->status === 'diminta');
    }

    public function needsOperationalAction(Submission $submission): bool
    {
        return $this->loans($submission)
            ->contains(fn (Loan $loan) => in_array($loan->status, [
                'disetujui',
                'menunggu_inspeksi',
                'terlambat',
            ], true));
    }

    public function canApprove(Submission $submission): bool
    {
        if ($submission->hasBlockingTool()) {
            return false;
        }

        if ($this->hasWaitingMaterial($submission)) {
            return false;
        }

        if (! $this->needsApproval($submission)) {
            return false;
        }

        // Every non-terminal loan must be ready for a joint decision.
        return $this->loans($submission)
            ->filter(fn (Loan $loan) => ! $this->isTerminal($loan))
            ->every(fn (Loan $loan) => $loan->status === 'diminta');
    }

    public function canReject(Submission $submission): bool
    {
        if ($submission->isCompleted() || $submission->isRejected() || $submission->isCancelled()) {
            return false;
        }

        return $this->loans($submission)
            ->contains(fn (Loan $loan) => in_array($loan->status, self::REJECTABLE_LOAN_STATUSES, true));
    }

    public function canCancel(Submission $submission, ?User $actor = null): bool
    {
        if ($actor && (int) $submission->borrower_id !== (int) $actor->id) {
            return false;
        }

        if ($submission->isCompleted() || $submission->isRejected() || $submission->isCancelled()) {
            return false;
        }

        return $this->loans($submission)
            ->contains(fn (Loan $loan) => in_array($loan->status, self::CANCELLABLE_LOAN_STATUSES, true));
    }

    private function isTerminal(Loan $loan): bool
    {
        return in_array($loan->status, ['ditolak', 'dibatalkan', 'dikembalikan'], true)
            || ($loan->item_type === 'bahan' && $loan->status === 'dipinjam');
    }

    /**
     * @return \Illuminate\Support\Collection<int, Loan>
     */
    private function loans(Submission $submission)
    {
        $submission->loadMissing('loans');

        return $submission->loans;
    }
}
