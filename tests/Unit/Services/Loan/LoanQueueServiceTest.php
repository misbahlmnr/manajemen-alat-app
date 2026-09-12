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

    public function test_queue_sort_is_fifo_when_types_match(): void
    {
        $equipment = $this->makeEquipment('alat', available: 0);
        $siswaA = $this->makeUser('siswa', 'siswa-a');
        $siswaB = $this->makeUser('siswa', 'siswa-b');

        $first = $this->makeQueuedLoan($siswaA, $equipment, queuedAt: now()->subMinutes(5));
        $second = $this->makeQueuedLoan($siswaB, $equipment, queuedAt: now()->subMinutes(1));

        $ordered = $this->queue->queuedLoansForEquipment($equipment->id);
        $this->assertSame([$first->id, $second->id], $ordered->pluck('id')->all());
    }

    public function test_queue_sorts_by_loan_type_score(): void
    {
        $equipment = $this->makeEquipment('alat', available: 0);
        $siswa = $this->makeUser('siswa', 'siswa-type');

        $project = $this->makeQueuedLoan($siswa, $equipment, queuedAt: now()->subMinutes(8), borrowScope: 'bawa_pulang', borrowReason: 'lanjutan');
        $pribadi = $this->makeQueuedLoan($siswa, $equipment, queuedAt: now()->subMinutes(6), borrowScope: 'lab', borrowReason: 'lanjutan');
        $praktikum = $this->makeQueuedLoan($siswa, $equipment, queuedAt: now()->subMinutes(4), borrowScope: 'lab', borrowReason: 'reguler');
        $lomba = $this->makeQueuedLoan($siswa, $equipment, queuedAt: now()->subMinutes(1), borrowScope: 'bawa_pulang', borrowReason: 'lomba');

        $ordered = $this->queue->queuedLoansForEquipment($equipment->id);
        $this->assertSame(
            [$lomba->id, $praktikum->id, $pribadi->id, $project->id],
            $ordered->pluck('id')->all(),
        );
        $this->assertSame('Bawa pulang lomba', $lomba->queueTypeLabel());
        $this->assertSame('Praktik lab', $praktikum->queueTypeLabel());
        $this->assertSame('Pribadi', $pribadi->queueTypeLabel());
        $this->assertSame('Bawa pulang project', $project->queueTypeLabel());
    }

    public function test_praktikum_queue_prefers_closest_schedule(): void
    {
        $equipment = $this->makeEquipment('alat', available: 0);
        $siswa = $this->makeUser('siswa', 'siswa-sched');
        $guru = $this->makeUser('guru', 'guru-sched');
        $today = now()->toDateString();

        $morning = PracticumSchedule::query()->create([
            'code' => 'JDW-MORNING',
            'title' => 'Pagi',
            'mata_kuliah' => 'DTE',
            'jurusan' => 'Audio Video',
            'kelas' => 'X TE 1',
            'type' => 'khusus',
            'tanggal' => $today,
            'jam_mulai' => '07:00:00',
            'jam_selesai' => '09:30:00',
            'ruangan' => 'Ruang Assembly',
            'guru_id' => $guru->id,
            'priority' => 'normal',
        ]);
        $afternoon = PracticumSchedule::query()->create([
            'code' => 'JDW-AFTERNOON',
            'title' => 'Siang',
            'mata_kuliah' => 'PMM',
            'jurusan' => 'Audio Video',
            'kelas' => 'X TE 1',
            'type' => 'khusus',
            'tanggal' => $today,
            'jam_mulai' => '13:00:00',
            'jam_selesai' => '15:30:00',
            'ruangan' => 'Ruang Assembly',
            'guru_id' => $guru->id,
            'priority' => 'normal',
        ]);

        $laterQueued = $this->makeQueuedLoan(
            $siswa,
            $equipment,
            queuedAt: now()->subMinutes(1),
            borrowScope: 'lab',
            borrowReason: 'reguler',
            scheduleId: $morning->id,
            requestDate: $today,
        );
        $earlierQueued = $this->makeQueuedLoan(
            $siswa,
            $equipment,
            queuedAt: now()->subMinutes(10),
            borrowScope: 'lab',
            borrowReason: 'reguler',
            scheduleId: $afternoon->id,
            requestDate: $today,
        );

        $this->travelTo(Carbon::parse($today.' 06:00:00'));
        $ordered = $this->queue->queuedLoansForEquipment($equipment->id);
        $this->assertSame([$laterQueued->id, $earlierQueued->id], $ordered->pluck('id')->all());

        $this->travelTo(Carbon::parse($today.' 12:00:00'));
        $ordered = $this->queue->queuedLoansForEquipment($equipment->id);
        $this->assertSame([$earlierQueued->id, $laterQueued->id], $ordered->pluck('id')->all());
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
            $from->copy()->addDay()->format('Y-m-d').' 17:00:00',
            $this->queue->resolveTimeSliceDueAt($bawaPulang, $from)->format('Y-m-d H:i:s'),
        );

        // Jam pengajuan tidak mempengaruhi batas maksimal bawa pulang.
        $lateFrom = Carbon::parse(now()->toDateString().' 16:45:00');
        $this->assertSame(
            $lateFrom->copy()->addDay()->format('Y-m-d').' 17:00:00',
            $this->queue->resolveTimeSliceDueAt($bawaPulang, $lateFrom)->format('Y-m-d H:i:s'),
        );
    }

    public function test_apply_due_at_forces_schedule_end_for_pakai_di_lab(): void
    {
        $guru = $this->makeUser('guru', 'guru-due');
        $siswa = $this->makeUser('siswa', 'siswa-due');
        $equipment = $this->makeEquipment('alat', available: 3);
        $schedule = PracticumSchedule::query()->create([
            'code' => 'JDW-TEST-DUE',
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

        $loan = $this->makeQueuedLoan($siswa, $equipment);
        $loan->update([
            'status' => 'diminta',
            'borrow_scope' => 'lab',
            'borrow_reason' => 'reguler',
            'practicum_schedule_id' => $schedule->id,
            'due_at' => now()->setTime(9, 15),
        ]);
        $loan->setRelation('schedule', $schedule);

        $this->queue->applyDueAtForLoan($loan->fresh()->load('schedule'));

        $this->assertSame(
            now()->toDateString().' 10:00:00',
            $loan->fresh()->due_at->format('Y-m-d H:i:s'),
        );
    }

    public function test_apply_due_at_forces_lab_close_for_pribadi(): void
    {
        $siswa = $this->makeUser('siswa', 'siswa-pribadi-due');
        $equipment = $this->makeEquipment('alat', available: 3);
        $loan = $this->makeQueuedLoan($siswa, $equipment, borrowReason: 'lanjutan');
        $loan->update([
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
            'qty_baik' => $itemType === 'alat' ? $available : max($available, 10),
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
            'request_date' => $requestDate ?? now()->toDateString(),
            'purpose' => 'Tes antrian',
            'borrow_scope' => $borrowScope,
            'borrow_reason' => $itemType === 'alat'
                ? ($borrowReason ?? ($borrowScope === 'bawa_pulang' ? 'lanjutan' : 'lanjutan'))
                : null,
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
