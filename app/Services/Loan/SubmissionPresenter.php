<?php

namespace App\Services\Loan;

use App\Models\Loan;
use App\Models\Submission;

class SubmissionPresenter
{
    public function __construct(
        private SubmissionDecisionService $decisions,
    ) {}

    /**
     * @param  callable(Loan): array  $loanFormatter
     * @return array<string, mixed>
     */
    public function list(Submission $submission, callable $loanFormatter, string $showRouteName): array
    {
        $submission->loadMissing([
            'borrower:id,name,role,class',
            'supervisor:id,name',
            'loans.items.equipment:id,code,name,item_type,unit,image_path',
        ]);

        $members = $submission->loans->map(function (Loan $loan) use ($submission, $loanFormatter) {
            $loan->setRelation('submission', $submission);

            return $loanFormatter($loan);
        })->values();
        $alat = $members->firstWhere('item_type', 'alat');
        $bahan = $members->firstWhere('item_type', 'bahan');

        $handoverMembers = $members->filter(
            fn ($m) => ($m['status'] ?? null) === 'disetujui',
        );
        $markBorrowedBlockedReason = $handoverMembers
            ->pluck('mark_borrowed_blocked_reason')
            ->first(fn ($reason) => filled($reason));
        $canMarkBorrowed = $handoverMembers->isNotEmpty()
            && $handoverMembers->every(fn ($m) => ($m['can_mark_borrowed'] ?? false) === true);
        $requiresCollateral = $members->contains(
            fn ($m) => ($m['requires_collateral'] ?? false) === true,
        );
        $collateralReceived = $requiresCollateral
            && ! $members->contains(fn ($m) => ($m['can_receive_card'] ?? false) === true)
            && $members
                ->filter(fn ($m) => ($m['requires_collateral'] ?? false) === true)
                ->every(fn ($m) => ($m['collateral_status'] ?? null) === 'ditahan');

        return [
            'id' => $submission->id,
            'code' => $submission->code,
            'is_submission' => true,
            'is_package' => $members->count() > 1,
            'show_url' => route($showRouteName, $submission),
            'borrower_id' => $submission->borrower_id,
            'borrower_name' => $submission->borrower?->name,
            'borrower_role' => $submission->borrower?->role,
            'borrower_class' => $submission->borrowerClassLabel(),
            'supervisor_id' => $submission->supervisor_id,
            'supervisor_name' => $submission->supervisor?->name,
            'purpose' => $submission->purpose,
            'notes' => $submission->notes,
            'request_date' => $submission->request_date?->format('Y-m-d'),
            'request_date_formatted' => $submission->request_date?->translatedFormat('d M Y'),
            'created_at_formatted' => $submission->created_at?->translatedFormat('d M Y'),
            'status' => $submission->aggregateStatus(),
            'status_summary' => $submission->statusSummary(),
            'has_blocking_tool' => $submission->hasBlockingTool(),
            'can_approve' => $this->decisions->canApprove($submission),
            'can_reject' => $this->decisions->canReject($submission),
            'can_mark_borrowed' => $canMarkBorrowed,
            'mark_borrowed_blocked_reason' => $markBorrowedBlockedReason,
            'requires_collateral' => $requiresCollateral,
            'collateral_received' => $collateralReceived,
            'alat_count' => $submission->alatItemCount(),
            'bahan_count' => $submission->bahanItemCount(),
            'has_alat' => (bool) $alat,
            'has_bahan' => (bool) $bahan,
            'package_members' => $members->all(),
            'package_codes' => [$submission->code],
            'alat' => $alat,
            'bahan' => $bahan,
        ];
    }

    /**
     * @param  callable(Loan): array  $loanFormatter
     * @return array<string, mixed>
     */
    public function detail(Submission $submission, callable $loanFormatter, string $showRouteName): array
    {
        $row = $this->list($submission, $loanFormatter, $showRouteName);
        $row['loans'] = $row['package_members'];

        return $row;
    }
}
