<?php

namespace App\Services\Loan;

use App\Models\Loan;
use App\Models\Submission;
use App\Models\User;
use App\Services\Notification\LabNotificationService;
use Illuminate\Validation\ValidationException;

class StudentLoanSubmissionService
{
    public function __construct(
        private LoanQueueService $queue,
        private LoanWorkflowService $workflow,
        private CollateralWorkflowService $collateralWorkflow,
        private SubmissionMemberService $members,
    ) {}

    /**
     * Buat pengajuan siswa dengan validasi stok/slot dan status awal yang sama
     * seperti form Ajukan Peminjaman (diminta / antrian).
     *
     * @param  array<string, mixed>  $validated
     */
    public function create(array $validated, User $user, ?string $loanGroupId = null, ?Submission $submission = null): Loan
    {
        $items = $validated['items'];
        $memberIds = array_values(array_map('intval', $validated['member_ids'] ?? []));
        unset($validated['items'], $validated['collateral_agreed'], $validated['member_ids']);

        $loanType = $validated['loan_type']
            ?? ($validated['item_type'] === 'alat'
                ? Loan::resolveTypeFromLegacy(
                    $validated['borrow_scope'] ?? null,
                    $validated['borrow_reason'] ?? null,
                )
                : 'praktikum');

        if ($loanType === 'lomba') {
            throw ValidationException::withMessages([
                'loan_type' => 'Peminjaman lomba dibuat oleh admin melalui Event Lomba.',
            ]);
        }

        $legacy = Loan::legacyFieldsForType($loanType);
        $validated['loan_type'] = $loanType;
        if ($validated['item_type'] === 'alat') {
            $validated['borrow_scope'] = $legacy['borrow_scope'];
            $validated['borrow_reason'] = $legacy['borrow_reason'];
        }

        $creatingSubmission = $submission === null;
        $shouldManageMembers = $loanType === 'praktikum' && $validated['item_type'] === 'alat';

        // Always assert/sync for praktikum alat — callers may pre-create Submission
        // (store / createPackage) so $creatingSubmission alone is not enough.
        if ($shouldManageMembers) {
            $this->members->assertParticipantsAvailable($user, $memberIds, $submission);
        }

        $this->queue->validateItemsForSubmit(
            $items,
            $validated['item_type'],
            $user->id,
            $loanType,
        );

        $slotContext = $this->slotContextFromPayload($validated);

        $initialStatus = $this->queue->resolveInitialStatus(
            $items,
            $validated['item_type'],
            $slotContext,
        );

        $submission ??= Submission::createForBorrower($user, $validated);

        $loan = Loan::query()->create([
            ...$validated,
            'loan_group_id' => $loanGroupId,
            'submission_id' => $submission->id,
            'borrower_id' => $user->id,
            'borrower_class' => $user->class,
            'code' => Loan::generateCode(),
            'status' => $initialStatus,
            'queued_at' => $initialStatus === 'antrian' ? now() : null,
            'loan_type' => $loanType,
            'borrow_scope' => $validated['item_type'] === 'alat'
                ? ($validated['borrow_scope'] ?? 'lab')
                : 'lab',
            'borrow_reason' => $validated['item_type'] === 'alat'
                ? ($validated['borrow_reason'] ?? 'reguler')
                : null,
            'group_member_count' => null,
            'usage_room' => $validated['usage_room'] ?? null,
            'due_at' => $validated['item_type'] === 'alat' ? ($validated['due_at'] ?? null) : null,
        ]);
        $loan->setRelation('submission', $submission);

        $this->syncItems($loan, $items);

        if ($loan->isAlat()) {
            $this->queue->applyDueAtForLoan($loan);
        }

        if ($initialStatus === 'antrian') {
            $this->queue->enqueue($loan->fresh(), $user);
        } else {
            $this->workflow->logStatus($loan, 'diminta', 'Pengajuan peminjaman dibuat oleh siswa.', $user);
        }

        if ($loan->requiresCollateral()) {
            $this->collateralWorkflow->registerPendingCollateral($loan->fresh());
        }

        if ($shouldManageMembers) {
            $this->members->syncMembers($submission->fresh(['loans']), $memberIds, $user);
        } elseif ($creatingSubmission) {
            $this->members->syncMembers($submission->fresh(['loans']), [], $user);
        }

        app(LabNotificationService::class)->loanSubmitted(
            $loan->fresh(['borrower', 'supervisor', 'items.equipment', 'submission']),
        );

        if ($loan->submission_id) {
            $submission = $loan->submission()->with('loans.items.equipment')->first();
            if ($submission) {
                $this->queue->syncBahanGateForSubmission($submission, $user);
            }
        }

        return $loan->fresh();
    }

    /**
     * Paket alat + bahan satu submission (sama seperti storePackage siswa).
     *
     * @param  array<string, mixed>  $alatPayload
     * @param  array<string, mixed>  $bahanPayload
     * @return array{0: Loan, 1: Loan|null, 2: Submission}
     */
    public function createPackage(array $alatPayload, array $bahanPayload, User $user, ?string $loanGroupId = null): array
    {
        $groupId = $loanGroupId ?? (string) \Illuminate\Support\Str::uuid();
        $memberIds = array_values(array_map('intval', $alatPayload['member_ids'] ?? []));

        $loanType = $alatPayload['loan_type']
            ?? Loan::resolveTypeFromLegacy(
                $alatPayload['borrow_scope'] ?? null,
                $alatPayload['borrow_reason'] ?? null,
            );

        if ($loanType === 'praktikum') {
            $this->members->assertParticipantsAvailable($user, $memberIds);
        }

        $submission = Submission::createForBorrower($user, $alatPayload);
        $alatLoan = $this->create($alatPayload, $user, $groupId, $submission);

        $bahanLoan = null;
        if (($bahanPayload['items'] ?? []) !== []) {
            $bahanPayload['loan_type'] = $alatLoan->loan_type ?? 'praktikum';
            $bahanLoan = $this->create($bahanPayload, $user, $groupId, $submission);
        }

        if ($loanType === 'praktikum') {
            $this->members->syncMembers($submission->fresh(['loans']), $memberIds, $user);
        } else {
            $this->members->syncMembers($submission->fresh(['loans']), [], $user);
        }

        return [$alatLoan, $bahanLoan, $submission];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function slotContextFromPayload(array $payload, ?string $itemType = null): array
    {
        $type = $itemType ?? ($payload['item_type'] ?? 'alat');

        return [
            'item_type' => $type,
            'loan_type' => $payload['loan_type']
                ?? ($type === 'alat'
                    ? Loan::resolveTypeFromLegacy(
                        $payload['borrow_scope'] ?? null,
                        $payload['borrow_reason'] ?? null,
                    )
                    : null),
            'borrow_scope' => $payload['borrow_scope'] ?? 'lab',
            'borrow_reason' => $payload['borrow_reason'] ?? 'reguler',
            'request_date' => $payload['request_date'] ?? now()->toDateString(),
            'practicum_schedule_id' => $payload['practicum_schedule_id'] ?? null,
            'due_at' => $payload['due_at'] ?? null,
        ];
    }

    /**
     * @param  array<int, array{equipment_id: mixed, quantity: mixed}>  $rows
     */
    private function syncItems(Loan $loan, array $rows): void
    {
        $loan->items()->delete();
        foreach ($rows as $row) {
            $loan->items()->create([
                'equipment_id' => $row['equipment_id'],
                'quantity' => (int) $row['quantity'],
            ]);
        }
    }
}
