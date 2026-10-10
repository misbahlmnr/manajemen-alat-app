<?php

namespace Tests\Unit\Services\Loan;

use App\Models\Equipment;
use App\Models\Loan;
use App\Models\LoanItem;
use App\Models\Submission;
use App\Models\User;
use App\Services\Loan\LoanQueueService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class LoanQueueServiceTest extends TestCase
{
    use RefreshDatabase;

    private LoanQueueService $queue;

    protected function setUp(): void
    {
        parent::setUp();
        $this->queue = app(LoanQueueService::class);
    }

    public function test_resolve_initial_status_queues_pribadi_and_bahan_when_stock_short(): void
    {
        $alat = $this->makeEquipment('alat', available: 0);
        $bahan = $this->makeEquipment('bahan', available: 0);

        $this->assertSame('antrian', $this->queue->resolveInitialStatus([
            ['equipment_id' => $alat->id, 'quantity' => 1],
        ], 'alat', ['loan_type' => 'pribadi', 'borrow_scope' => 'lab', 'borrow_reason' => 'lanjutan']));

        $this->assertSame('antrian', $this->queue->resolveInitialStatus([
            ['equipment_id' => $bahan->id, 'quantity' => 1],
        ], 'bahan'));
    }

    public function test_resolve_initial_status_rejects_non_pribadi_when_stock_short(): void
    {
        $alat = $this->makeEquipment('alat', available: 0);

        $this->expectException(ValidationException::class);

        $this->queue->resolveInitialStatus([
            ['equipment_id' => $alat->id, 'quantity' => 1],
        ], 'alat', ['loan_type' => 'praktikum', 'borrow_scope' => 'lab', 'borrow_reason' => 'reguler']);
    }

    public function test_bawa_pulang_submit_skips_stock_and_stays_diminta(): void
    {
        $alat = $this->makeEquipment('alat', available: 0);

        $this->queue->validateItemsForSubmit(
            [['equipment_id' => $alat->id, 'quantity' => 1]],
            'alat',
            loanType: 'bawa_pulang',
        );

        $this->assertSame('diminta', $this->queue->resolveInitialStatus(
            [['equipment_id' => $alat->id, 'quantity' => 1]],
            'alat',
            ['loan_type' => 'bawa_pulang', 'borrow_scope' => 'bawa_pulang', 'borrow_reason' => 'lanjutan'],
        ));
    }

    public function test_queue_sort_is_fifo_when_priority_matches(): void
    {
        $equipment = $this->makeEquipment('alat', available: 0);
        $siswaA = $this->makeUser('siswa', 'siswa-a');
        $siswaB = $this->makeUser('siswa', 'siswa-b');

        $first = $this->makeQueuedLoan($siswaA, $equipment, queuedAt: now()->subMinutes(5));
        $second = $this->makeQueuedLoan($siswaB, $equipment, queuedAt: now()->subMinutes(1));

        $ordered = $this->queue->queuedLoansForEquipment($equipment->id);
        $this->assertSame([$first->id, $second->id], $ordered->pluck('id')->all());
    }

    public function test_queue_sorts_by_manual_priority_then_queued_at(): void
    {
        $equipment = $this->makeEquipment('alat', available: 0);
        $siswa = $this->makeUser('siswa', 'siswa-prio');

        $low = $this->makeQueuedLoan($siswa, $equipment, queuedAt: now()->subMinutes(8), queuePriority: 0);
        $highLater = $this->makeQueuedLoan($siswa, $equipment, queuedAt: now()->subMinutes(1), queuePriority: 10);
        $highEarlier = $this->makeQueuedLoan($siswa, $equipment, queuedAt: now()->subMinutes(5), queuePriority: 10);

        $ordered = $this->queue->queuedLoansForEquipment($equipment->id);
        $this->assertSame(
            [$highEarlier->id, $highLater->id, $low->id],
            $ordered->pluck('id')->all(),
        );
    }

    public function test_non_pribadi_alat_not_listed_in_queue(): void
    {
        $equipment = $this->makeEquipment('alat', available: 0);
        $siswa = $this->makeUser('siswa', 'siswa-skip');

        $this->makeQueuedLoan(
            $siswa,
            $equipment,
            loanType: 'praktikum',
            borrowScope: 'lab',
            borrowReason: 'reguler',
        );
        $pribadi = $this->makeQueuedLoan($siswa, $equipment, loanType: 'pribadi');

        $ordered = $this->queue->queuedLoansForEquipment($equipment->id);
        $this->assertSame([$pribadi->id], $ordered->pluck('id')->all());
    }

    public function test_loan_type_labels(): void
    {
        $equipment = $this->makeEquipment('alat', available: 1);
        $siswa = $this->makeUser('siswa', 'siswa-label');

        $pribadi = $this->makeQueuedLoan($siswa, $equipment, loanType: 'pribadi');
        $this->assertSame('Pribadi', $pribadi->loanTypeLabel());
        $this->assertTrue($pribadi->allowsQueue());
    }

    public function test_time_slice_reguler_pribadi_and_bawa_pulang(): void
    {
        $this->travelTo(Carbon::parse('2026-09-14 10:00:00'));

        $equipment = $this->makeEquipment('alat', available: 5);
        $siswa = $this->makeUser('siswa', 'siswa-slice');
        $guru = $this->makeUser('guru', 'guru-slice');

        $pribadi = Loan::query()->create([
            'code' => Loan::generateCode(),
            'submission_id' => Submission::createForBorrower($siswa, [
                'purpose' => 'Pribadi',
                'request_date' => '2026-09-14',
            ])->id,
            'borrower_id' => $siswa->id,
            'supervisor_id' => $guru->id,
            'item_type' => 'alat',
            'loan_type' => 'pribadi',
            'status' => 'diminta',
            'borrow_scope' => 'lab',
            'borrow_reason' => 'lanjutan',
            'request_date' => '2026-09-14',
        ]);

        $this->assertSame(
            '2026-09-14 17:00:00',
            $this->queue->resolveTimeSliceDueAt($pribadi)->format('Y-m-d H:i:s'),
        );

        $bawaPulang = Loan::query()->create([
            'code' => Loan::generateCode(),
            'submission_id' => Submission::createForBorrower($siswa, [
                'purpose' => 'Bawa pulang',
                'request_date' => '2026-09-14',
            ])->id,
            'borrower_id' => $siswa->id,
            'item_type' => 'alat',
            'loan_type' => 'bawa_pulang',
            'status' => 'diminta',
            'borrow_scope' => 'bawa_pulang',
            'borrow_reason' => 'lanjutan',
            'request_date' => '2026-09-14',
        ]);

        $this->assertSame(
            '2026-09-15 17:00:00',
            $this->queue->resolveTimeSliceDueAt($bawaPulang)->format('Y-m-d H:i:s'),
        );

        unset($equipment);
    }

    public function test_apply_due_at_forces_lab_close_for_pribadi(): void
    {
        $this->travelTo(Carbon::parse('2026-09-14 10:00:00'));

        $siswa = $this->makeUser('siswa', 'siswa-due');
        $guru = $this->makeUser('guru', 'guru-due');

        $loan = Loan::query()->create([
            'code' => Loan::generateCode(),
            'submission_id' => Submission::createForBorrower($siswa, [
                'purpose' => 'Pribadi',
                'request_date' => now()->toDateString(),
            ])->id,
            'borrower_id' => $siswa->id,
            'supervisor_id' => $guru->id,
            'item_type' => 'alat',
            'loan_type' => 'pribadi',
            'status' => 'diminta',
            'borrow_scope' => 'lab',
            'borrow_reason' => 'lanjutan',
            'request_date' => now()->toDateString(),
            'due_at' => now()->setTime(14, 0),
        ]);

        $this->queue->applyDueAtForLoan($loan->fresh());

        $this->assertSame(
            now()->toDateString().' 17:00:00',
            $loan->fresh()->due_at->format('Y-m-d H:i:s'),
        );
    }

    public function test_process_queue_promotes_when_stock_available(): void
    {
        $equipment = $this->makeEquipment('bahan', available: 0);
        $siswa = $this->makeUser('siswa', 'siswa-prom');
        $loan = $this->makeQueuedLoan($siswa, $equipment, itemType: 'bahan');

        $equipment->update(['available' => 5]);
        $promoted = $this->queue->processQueueForEquipment($equipment->id);

        $this->assertCount(1, $promoted);
        $this->assertSame('diminta', $loan->fresh()->status);
    }

    public function test_set_queue_priority_updates_order(): void
    {
        $equipment = $this->makeEquipment('alat', available: 0);
        $admin = $this->makeUser('admin', 'admin-prio');
        $siswa = $this->makeUser('siswa', 'siswa-set-prio');

        $first = $this->makeQueuedLoan($siswa, $equipment, queuedAt: now()->subMinutes(5));
        $second = $this->makeQueuedLoan($siswa, $equipment, queuedAt: now()->subMinutes(1));

        $this->queue->setQueuePriority($second, 50, $admin, 'Urgent');

        $ordered = $this->queue->queuedLoansForEquipment($equipment->id);
        $this->assertSame([$second->id, $first->id], $ordered->pluck('id')->all());
        $this->assertSame(50, $second->fresh()->queue_priority);
    }

    private function makeUser(string $role, string $username): User
    {
        return User::query()->create([
            'name' => ucfirst($username),
            'username' => $username,
            'email' => $username.'@test.local',
            'password' => 'password',
            'role' => $role,
            'status' => 'active',
            'class' => $role === 'siswa' ? 'X TE 1' : null,
            'nip' => $role !== 'siswa' ? strtoupper($username) : null,
            'nisn' => $role === 'siswa' ? '0099'.substr(md5($username), 0, 6) : null,
        ]);
    }

    private function makeEquipment(string $itemType, int $available = 0): Equipment
    {
        $qty = max(0, $available);

        return Equipment::query()->create([
            'code' => strtoupper($itemType).'-'.Str::upper(Str::random(4)),
            'name' => 'Item '.$itemType,
            'category' => 'Tools',
            'item_type' => $itemType,
            'stock' => max($qty, 1),
            'available' => $qty,
            'qty_baik' => $qty,
            'qty_rusak_ringan' => 0,
            'qty_rusak_berat' => 0,
            'status' => 'tersedia',
            'unit' => 'pcs',
        ]);
    }

    private function makeQueuedLoan(
        User $borrower,
        Equipment $equipment,
        ?Carbon $queuedAt = null,
        string $itemType = 'alat',
        ?string $loanGroupId = null,
        string $borrowScope = 'lab',
        ?string $borrowReason = null,
        ?string $loanType = null,
        int $queuePriority = 0,
        ?int $scheduleId = null,
        ?string $requestDate = null,
    ): Loan {
        $guru = User::query()->where('role', 'guru')->first()
            ?? $this->makeUser('guru', 'guru-'.Str::lower(Str::random(4)));

        $submissionId = null;
        if ($loanGroupId) {
            $submissionId = Loan::query()
                ->where('loan_group_id', $loanGroupId)
                ->value('submission_id');
        }

        if (! $submissionId) {
            $submissionId = Submission::createForBorrower($borrower, [
                'supervisor_id' => $guru->id,
                'purpose' => 'Tes antrian',
                'request_date' => now()->toDateString(),
            ])->id;
        }

        $resolvedType = $loanType
            ?? ($itemType === 'alat'
                ? Loan::resolveTypeFromLegacy(
                    $borrowScope,
                    $borrowReason ?? 'lanjutan',
                )
                : 'praktikum');

        $legacy = Loan::legacyFieldsForType($resolvedType);

        $loan = Loan::query()->create([
            'code' => Loan::generateCode(),
            'loan_group_id' => $loanGroupId,
            'submission_id' => $submissionId,
            'borrower_id' => $borrower->id,
            'supervisor_id' => $guru->id,
            'item_type' => $itemType,
            'loan_type' => $resolvedType,
            'status' => 'antrian',
            'queue_priority' => $queuePriority,
            'queued_at' => $queuedAt ?? now(),
            'request_date' => $requestDate ?? now()->toDateString(),
            'purpose' => 'Tes antrian',
            'borrow_scope' => $legacy['borrow_scope'],
            'borrow_reason' => $itemType === 'alat' ? $legacy['borrow_reason'] : null,
            'practicum_schedule_id' => $scheduleId,
            'due_at' => $itemType === 'alat' ? now()->addHours(2) : null,
        ]);

        LoanItem::query()->create([
            'loan_id' => $loan->id,
            'equipment_id' => $equipment->id,
            'quantity' => 1,
        ]);

        return $loan->fresh();
    }
}
