<?php

namespace Tests\Unit\Services\Loan;

use App\Models\Equipment;
use App\Models\Loan;
use App\Models\LoanItem;
use App\Models\PracticumSchedule;
use App\Models\Submission;
use App\Models\User;
use App\Services\Loan\LoanQueueService;
use App\Services\Loan\LoanSlotAvailabilityService;
use App\Services\Loan\LoanWorkflowService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class LoanSlotAvailabilityServiceTest extends TestCase
{
    use RefreshDatabase;

    private LoanSlotAvailabilityService $slots;

    private LoanQueueService $queue;

    private LoanWorkflowService $workflow;

    protected function setUp(): void
    {
        parent::setUp();
        $this->slots = app(LoanSlotAvailabilityService::class);
        $this->queue = app(LoanQueueService::class);
        $this->workflow = app(LoanWorkflowService::class);
    }

    public function test_morning_and_afternoon_praktikum_do_not_share_capacity(): void
    {
        $this->travelTo(Carbon::parse('2026-09-09 10:00:00'));

        $equipment = $this->makeEquipment(20);
        $guru = $this->makeUser('guru', 'guru-slot-1');
        $morning = $this->makeSchedule($guru, '2026-09-14', '07:00:00', '09:30:00', 'JDW-PAGI');
        $afternoon = $this->makeSchedule($guru, '2026-09-14', '13:00:00', '15:30:00', 'JDW-SIANG');

        $this->makeOccupyingLoan($equipment, 6, 'lab', 'reguler', '2026-09-14', $morning->id);
        $this->makeOccupyingLoan($equipment, 6, 'lab', 'reguler', '2026-09-14', $afternoon->id);

        $morningWindow = $this->slots->windowFromContext([
            'borrow_scope' => 'lab',
            'borrow_reason' => 'reguler',
            'request_date' => '2026-09-14',
            'practicum_schedule_id' => $morning->id,
        ], $morning);
        $afternoonWindow = $this->slots->windowFromContext([
            'borrow_scope' => 'lab',
            'borrow_reason' => 'reguler',
            'request_date' => '2026-09-14',
            'practicum_schedule_id' => $afternoon->id,
        ], $afternoon);

        $this->assertSame(14, $this->slots->remaining($equipment, $morningWindow[0], $morningWindow[1]));
        $this->assertSame(14, $this->slots->remaining($equipment, $afternoonWindow[0], $afternoonWindow[1]));

        $this->assertSame('diminta', $this->queue->resolveInitialStatus(
            [['equipment_id' => $equipment->id, 'quantity' => 6]],
            'alat',
            [
                'borrow_scope' => 'lab',
                'borrow_reason' => 'reguler',
                'request_date' => '2026-09-14',
                'practicum_schedule_id' => $morning->id,
            ],
        ));
        $this->assertSame('diminta', $this->queue->resolveInitialStatus(
            [['equipment_id' => $equipment->id, 'quantity' => 6]],
            'alat',
            [
                'borrow_scope' => 'lab',
                'borrow_reason' => 'reguler',
                'request_date' => '2026-09-14',
                'practicum_schedule_id' => $afternoon->id,
            ],
        ));
    }

    public function test_twenty_first_booking_in_same_slot_goes_to_queue(): void
    {
        $this->travelTo(Carbon::parse('2026-09-09 10:00:00'));

        $equipment = $this->makeEquipment(20);
        $guru = $this->makeUser('guru', 'guru-slot-21');
        $morning = $this->makeSchedule($guru, '2026-09-14', '07:00:00', '09:30:00', 'JDW-21');

        $this->makeOccupyingLoan($equipment, 20, 'lab', 'reguler', '2026-09-14', $morning->id);

        $this->assertSame('antrian', $this->queue->resolveInitialStatus(
            [['equipment_id' => $equipment->id, 'quantity' => 1]],
            'alat',
            [
                'borrow_scope' => 'lab',
                'borrow_reason' => 'reguler',
                'request_date' => '2026-09-14',
                'practicum_schedule_id' => $morning->id,
            ],
        ));
    }

    public function test_pribadi_can_use_leftover_after_class_books_six(): void
    {
        $this->travelTo(Carbon::parse('2026-09-09 10:00:00'));

        $equipment = $this->makeEquipment(20);
        $guru = $this->makeUser('guru', 'guru-slot-sisa');
        $morning = $this->makeSchedule($guru, '2026-09-14', '07:00:00', '09:30:00', 'JDW-SISA');

        $this->makeOccupyingLoan($equipment, 6, 'lab', 'reguler', '2026-09-14', $morning->id);

        $pribadiWindow = $this->slots->windowFromContext([
            'borrow_scope' => 'lab',
            'borrow_reason' => 'lanjutan',
            'request_date' => '2026-09-14',
        ]);

        $this->assertSame(14, $this->slots->remaining($equipment, $pribadiWindow[0], $pribadiWindow[1]));

        $this->assertSame('diminta', $this->queue->resolveInitialStatus(
            [['equipment_id' => $equipment->id, 'quantity' => 14]],
            'alat',
            [
                'borrow_scope' => 'lab',
                'borrow_reason' => 'lanjutan',
                'request_date' => '2026-09-14',
            ],
        ));

        $this->assertSame('antrian', $this->queue->resolveInitialStatus(
            [['equipment_id' => $equipment->id, 'quantity' => 15]],
            'alat',
            [
                'borrow_scope' => 'lab',
                'borrow_reason' => 'lanjutan',
                'request_date' => '2026-09-14',
            ],
        ));
    }

    public function test_bawa_pulang_does_not_occupy_pickup_morning(): void
    {
        $this->travelTo(Carbon::parse('2026-09-14 10:00:00'));

        $equipment = $this->makeEquipment(20);
        $this->makeOccupyingLoan(
            $equipment,
            10,
            'bawa_pulang',
            'lomba',
            '2026-09-14',
            dueAt: Carbon::parse('2026-09-15 17:00:00'),
        );

        $guru = $this->makeUser('guru', 'guru-slot-bp');
        $morning = $this->makeSchedule($guru, '2026-09-14', '07:00:00', '09:30:00', 'JDW-BP');
        $morningWindow = $this->slots->windowFromContext([
            'borrow_scope' => 'lab',
            'borrow_reason' => 'reguler',
            'request_date' => '2026-09-14',
            'practicum_schedule_id' => $morning->id,
        ], $morning);

        $this->assertSame(20, $this->slots->remaining($equipment, $morningWindow[0], $morningWindow[1]));

        $nextMorning = $this->makeSchedule($guru, '2026-09-15', '07:00:00', '09:30:00', 'JDW-BP2');
        $nextWindow = $this->slots->windowFromContext([
            'borrow_scope' => 'lab',
            'borrow_reason' => 'reguler',
            'request_date' => '2026-09-15',
            'practicum_schedule_id' => $nextMorning->id,
        ], $nextMorning);

        $this->assertSame(10, $this->slots->remaining($equipment, $nextWindow[0], $nextWindow[1]));
    }

    public function test_approve_future_booking_does_not_deduct_available_until_slot_starts(): void
    {
        $this->travelTo(Carbon::parse('2026-09-09 10:00:00'));

        $equipment = $this->makeEquipment(20);
        $admin = $this->makeUser('admin', 'admin-slot-future');
        $guru = $this->makeUser('guru', 'guru-slot-future');
        $morning = $this->makeSchedule($guru, '2026-09-14', '07:00:00', '09:30:00', 'JDW-FUT');
        $loan = $this->makeOccupyingLoan($equipment, 6, 'lab', 'reguler', '2026-09-14', $morning->id);

        $this->workflow->approve($loan->fresh(), $admin);

        $this->assertSame('disetujui', $loan->fresh()->status);
        $this->assertFalse((bool) $loan->fresh()->stock_held);
        $this->assertSame(20, (int) $equipment->fresh()->available);

        $this->travelTo(Carbon::parse('2026-09-14 07:00:00'));
        $this->workflow->syncOverdue();

        $this->assertTrue((bool) $loan->fresh()->stock_held);
        $this->assertSame(14, (int) $equipment->fresh()->available);
    }

    public function test_slot_label_matches_booking_window(): void
    {
        $this->travelTo(Carbon::parse('2026-09-09 10:00:00'));

        $equipment = $this->makeEquipment(20);
        $guru = $this->makeUser('guru', 'guru-slot-label');
        $morning = $this->makeSchedule($guru, '2026-09-14', '07:00:00', '09:30:00', 'JDW-LABEL');
        $praktikum = $this->makeOccupyingLoan($equipment, 6, 'lab', 'reguler', '2026-09-14', $morning->id);

        $this->assertSame('07:00–09:30', $this->slots->slotLabel($praktikum));
        $this->assertSame('Praktik lab', $praktikum->queueTypeLabel());

        $pribadi = $this->makeOccupyingLoan($equipment, 1, 'lab', 'lanjutan', '2026-09-14');
        $this->assertSame('07:00–17:00', $this->slots->slotLabel($pribadi));
        $this->assertSame('Pribadi', $pribadi->queueTypeLabel());

        $lomba = $this->makeOccupyingLoan(
            $equipment,
            1,
            'bawa_pulang',
            'lomba',
            '2026-09-14',
            dueAt: Carbon::parse('2026-09-15 17:00:00'),
        );
        $this->assertSame('17:00–17:00 (+1 hari)', $this->slots->slotLabel($lomba));
        $this->assertSame('Bawa pulang lomba', $lomba->queueTypeLabel());
    }

    private function makeOccupyingLoan(
        Equipment $equipment,
        int $quantity,
        string $borrowScope,
        string $borrowReason,
        string $requestDate,
        ?int $scheduleId = null,
        ?Carbon $dueAt = null,
        string $status = 'diminta',
    ): Loan {
        $borrower = $this->makeUser('siswa', 'siswa-'.Str::lower(Str::random(6)));
        $guru = User::query()->where('role', 'guru')->first()
            ?? $this->makeUser('guru', 'guru-'.Str::lower(Str::random(4)));

        $submission = Submission::createForBorrower($borrower, [
            'supervisor_id' => $guru->id,
            'purpose' => 'Tes slot',
            'request_date' => $requestDate,
        ]);

        $loan = Loan::query()->create([
            'code' => Loan::generateCode(),
            'submission_id' => $submission->id,
            'borrower_id' => $borrower->id,
            'supervisor_id' => $guru->id,
            'item_type' => 'alat',
            'status' => $status,
            'request_date' => $requestDate,
            'purpose' => 'Tes slot',
            'borrow_scope' => $borrowScope,
            'borrow_reason' => $borrowReason,
            'practicum_schedule_id' => $scheduleId,
            'due_at' => $dueAt,
            'usage_room' => 'Ruang Assembly',
        ]);

        LoanItem::query()->create([
            'loan_id' => $loan->id,
            'equipment_id' => $equipment->id,
            'quantity' => $quantity,
        ]);

        return $loan->fresh(['items.equipment', 'schedule']);
    }

    private function makeSchedule(
        User $guru,
        string $date,
        string $start,
        string $end,
        string $code,
    ): PracticumSchedule {
        return PracticumSchedule::query()->create([
            'code' => $code,
            'title' => 'Praktik Slot',
            'mata_kuliah' => 'DTE (Dasar Teknik Elektronika)',
            'jurusan' => 'Audio Video',
            'kelas' => 'X TE 1',
            'type' => 'khusus',
            'tanggal' => $date,
            'jam_mulai' => $start,
            'jam_selesai' => $end,
            'ruangan' => 'Ruang Assembly',
            'guru_id' => $guru->id,
            'priority' => 'normal',
        ]);
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
            'nisn' => $role === 'siswa' ? '0066'.substr(md5($username), 0, 6) : null,
        ]);
    }

    private function makeEquipment(int $qtyBaik): Equipment
    {
        return Equipment::query()->create([
            'code' => 'ALAT-'.Str::upper(Str::random(4)),
            'name' => 'Toolset Slot',
            'category' => 'Tools',
            'item_type' => 'alat',
            'stock' => $qtyBaik,
            'available' => $qtyBaik,
            'qty_baik' => $qtyBaik,
            'qty_rusak_ringan' => 0,
            'qty_rusak_berat' => 0,
            'status' => 'tersedia',
            'unit' => 'set',
        ]);
    }
}
