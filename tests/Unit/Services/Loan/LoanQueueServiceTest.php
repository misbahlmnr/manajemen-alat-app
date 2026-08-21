<?php

namespace Tests\Unit\Services\Loan;

use App\Models\Equipment;
use App\Models\Loan;
use App\Models\LoanItem;
use App\Models\PracticumSchedule;
use App\Models\Submission;
use App\Models\User;
use App\Services\Loan\LoanQueueService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
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

    public function test_resolve_initial_status_queues_alat_and_bahan_when_stock_short(): void
    {
        $alat = $this->makeEquipment('alat', available: 0);
        $bahan = $this->makeEquipment('bahan', available: 0);

        $this->assertSame('antrian', $this->queue->resolveInitialStatus([
            ['equipment_id' => $alat->id, 'quantity' => 1],
        ], 'alat'));

        $this->assertSame('antrian', $this->queue->resolveInitialStatus([
            ['equipment_id' => $bahan->id, 'quantity' => 1],
        ], 'bahan'));
    }

    public function test_queue_sort_is_fifo_then_admin_priority(): void
    {
        $equipment = $this->makeEquipment('alat', available: 0);
        $siswaA = $this->makeUser('siswa', 'siswa-a');
        $siswaB = $this->makeUser('siswa', 'siswa-b');
        $admin = $this->makeUser('admin', 'admin-q');

        $first = $this->makeQueuedLoan($siswaA, $equipment, queuedAt: now()->subMinutes(5));
        $second = $this->makeQueuedLoan($siswaB, $equipment, queuedAt: now()->subMinutes(1));

        $ordered = $this->queue->queuedLoansForEquipment($equipment->id);
        $this->assertSame([$first->id, $second->id], $ordered->pluck('id')->all());

        $this->queue->setAdminPriority($second, 150, 'urgent', $admin);

        $ordered = $this->queue->queuedLoansForEquipment($equipment->id);
        $this->assertSame([$second->id, $first->id], $ordered->pluck('id')->all());
    }

    public function test_admin_priority_syncs_to_package_siblings(): void
    {
        $alatEq = $this->makeEquipment('alat', available: 0);
        $bahanEq = $this->makeEquipment('bahan', available: 0);
        $siswa = $this->makeUser('siswa', 'siswa-pkg');
        $admin = $this->makeUser('admin', 'admin-pkg');
        $groupId = (string) Str::uuid();

        $alatLoan = $this->makeQueuedLoan($siswa, $alatEq, loanGroupId: $groupId);
        $bahanLoan = $this->makeQueuedLoan($siswa, $bahanEq, itemType: 'bahan', loanGroupId: $groupId);

        $this->queue->setAdminPriority($alatLoan, 200, 'lomba', $admin);

        $this->assertSame(200, (int) $alatLoan->fresh()->queue_priority);
        $this->assertSame(200, (int) $bahanLoan->fresh()->queue_priority);
    }

    public function test_time_slice_reguler_pribadi_and_bawa_pulang(): void
    {
        $guru = $this->makeUser('guru', 'guru-slice');
        $schedule = PracticumSchedule::query()->create([
            'code' => 'JDW-TEST-1',
            'title' => 'Praktikum',
            'mata_kuliah' => 'DTE',
            'jurusan' => 'Audio Video',
            'kelas' => 'X TE 1',
            'type' => 'khusus',
            'tanggal' => now()->toDateString(),
            'jam_mulai' => '08:00:00',
            'jam_selesai' => '10:00:00',
            'ruangan' => 'Lab AV',
            'guru_id' => $guru->id,
            'priority' => 'normal',
        ]);

        $reguler = new Loan([
            'borrow_scope' => 'lab',
            'borrow_reason' => 'reguler',
            'request_date' => now()->toDateString(),
            'practicum_schedule_id' => $schedule->id,
            'item_type' => 'alat',
        ]);
        $reguler->setRelation('schedule', $schedule);

        $pribadi = new Loan([
            'borrow_scope' => 'lab',
            'borrow_reason' => 'lanjutan',
            'request_date' => now()->toDateString(),
            'item_type' => 'alat',
        ]);

        $bawaPulang = new Loan([
            'borrow_scope' => 'bawa_pulang',
            'request_date' => now()->toDateString(),
            'item_type' => 'alat',
        ]);

        $from = Carbon::parse(now()->toDateString().' 09:00:00');

        $this->assertSame(
            $from->toDateString().' 10:00:00',
            $this->queue->resolveTimeSliceDueAt($reguler, $from)->format('Y-m-d H:i:s'),
        );

        $this->assertSame(
            $from->toDateString().' 17:00:00',
            $this->queue->resolveTimeSliceDueAt($pribadi, $from)->format('Y-m-d H:i:s'),
        );

        $this->assertSame(
            $from->copy()->addDay()->format('Y-m-d H:i:s'),
            $this->queue->resolveTimeSliceDueAt($bawaPulang, $from)->format('Y-m-d H:i:s'),
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
        return Equipment::query()->create([
            'code' => strtoupper($itemType).'-'.Str::upper(Str::random(4)),
            'name' => 'Item '.$itemType,
            'category' => 'Tools',
            'item_type' => $itemType,
            'stock' => max($available, 10),
            'available' => $available,
            'qty_baik' => max($available, 10),
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

        $loan = Loan::query()->create([
            'code' => Loan::generateCode(),
            'loan_group_id' => $loanGroupId,
            'submission_id' => $submissionId,
            'borrower_id' => $borrower->id,
            'supervisor_id' => $guru->id,
            'item_type' => $itemType,
            'status' => 'antrian',
            'queue_priority' => 0,
            'queued_at' => $queuedAt ?? now(),
            'request_date' => now()->toDateString(),
            'purpose' => 'Tes antrian',
            'borrow_scope' => 'lab',
            'borrow_reason' => $itemType === 'alat' ? 'lanjutan' : null,
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
