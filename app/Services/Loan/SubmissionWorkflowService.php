<?php

namespace App\Services\Loan;

use App\Models\Submission;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SubmissionWorkflowService
{
    public function __construct(
        private SubmissionDecisionService $decisions,
        private LoanWorkflowService $loans,
    ) {}

    public function approve(Submission $submission, User $actor): void
    {
        $submission->loadMissing('loans.items.equipment');

        if (! $this->decisions->canApprove($submission)) {
            throw ValidationException::withMessages([
                'status' => $submission->hasBlockingTool()
                    ? 'Pengajuan masih menunggu alat tersedia. Tidak dapat disetujui.'
                    : 'Pengajuan belum siap untuk disetujui.',
            ]);
        }

        DB::transaction(function () use ($submission, $actor) {
            foreach ($submission->loans as $loan) {
                if ($loan->status !== 'diminta') {
                    continue;
                }

                $this->loans->approve($loan->fresh(['items.equipment']), $actor);
            }
        });
    }

    public function reject(Submission $submission, string $reason, User $actor): void
    {
        $submission->loadMissing('loans');

        if (! $this->decisions->canReject($submission)) {
            throw ValidationException::withMessages([
                'status' => 'Pengajuan ini tidak dapat ditolak.',
            ]);
        }

        DB::transaction(function () use ($submission, $reason, $actor) {
            foreach ($submission->loans as $loan) {
                if (! in_array($loan->status, SubmissionDecisionService::REJECTABLE_LOAN_STATUSES, true)) {
                    continue;
                }

                $this->loans->reject($loan->fresh(), $reason, $actor);
            }
        });
    }

    public function cancel(Submission $submission, User $actor): void
    {
        $submission->loadMissing('loans');

        if (! $this->decisions->canCancel($submission, $actor)) {
            throw ValidationException::withMessages([
                'status' => 'Pengajuan ini tidak dapat dibatalkan.',
            ]);
        }

        DB::transaction(function () use ($submission, $actor) {
            foreach ($submission->loans as $loan) {
                if (! in_array($loan->status, SubmissionDecisionService::CANCELLABLE_LOAN_STATUSES, true)) {
                    continue;
                }

                $this->loans->cancel($loan->fresh(), $actor);
            }
        });
    }

    /**
     * One-click handover for all approved children in the submission.
     */
    public function markBorrowed(Submission $submission, User $actor): void
    {
        $submission->loadMissing(['loans.collateral', 'loans.items.equipment']);

        $toHandOver = $submission->loans
            ->filter(fn ($loan) => $loan->status === 'disetujui')
            ->values();

        if ($toHandOver->isEmpty()) {
            throw ValidationException::withMessages([
                'status' => 'Tidak ada item disetujui yang siap diserahkan.',
            ]);
        }

        // Fail the whole submission before any update if an alat is blocked.
        foreach ($toHandOver as $loan) {
            if (! $loan->isAlat()) {
                continue;
            }

            if ($loan->requiresCollateral()) {
                $loan->loadMissing('collateral');
                if ($loan->collateral?->status !== 'ditahan') {
                    throw ValidationException::withMessages([
                        'status' => 'Terima kartu pelajar terlebih dahulu sebelum menyerahkan alat.',
                    ]);
                }
            }
        }

        DB::transaction(function () use ($toHandOver, $actor) {
            foreach ($toHandOver as $loan) {
                $this->loans->markBorrowed($loan->fresh(['items.equipment', 'collateral']), $actor);
            }
        });
    }
}
