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
}
