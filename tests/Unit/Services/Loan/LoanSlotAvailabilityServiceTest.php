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
use Illuminate\Validation\ValidationException;
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
            'loan_type' => 'praktikum',
            'borrow_scope' => 'lab',
            'borrow_reason' => 'reguler',
            'request_date' => '2026-09-14',
            'practicum_schedule_id' => $morning->id,
        ], $morning);
        $afternoonWindow = $this->slots->windowFromContext([
            'loan_type' => 'praktikum',
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
                'loan_type' => 'praktikum',
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
                'loan_type' => 'praktikum',
                'borrow_scope' => 'lab',
                'borrow_reason' => 'reguler',
                'request_date' => '2026-09-14',
                'practicum_schedule_id' => $afternoon->id,
            ],
        ));
    }

    public function test_full_slot_rejects_praktikum_and_queues_pribadi(): void
    {
        $this->travelTo(Carbon::parse('2026-09-09 10:00:00'));

        $equipment = $this->makeEquipment(20);
        $guru = $this->makeUser('guru', 'guru-slot-21');
        $morning = $this->makeSchedule($guru, '2026-09-14', '07:00:00', '09:30:00', 'JDW-21');

        $this->makeOccupyingLoan($equipment, 20, 'lab', 'reguler', '2026-09-14', $morning->id);

        try {
            $this->queue->resolveInitialStatus(
                [['equipment_id' => $equipment->id, 'quantity' => 1]],
                'alat',
                [
                    'loan_type' => 'praktikum',
                    'borrow_scope' => 'lab',
                    'borrow_reason' => 'reguler',
                    'request_date' => '2026-09-14',
                    'practicum_schedule_id' => $morning->id,
                ],
            );
            $this->fail('Praktik Lab seharusnya ditolak jika slot penuh.');
        } catch (ValidationException $e) {
            $this->assertNotEmpty($e->errors());
        }

        $this->assertSame('antrian', $this->queue->resolveInitialStatus(
            [['equipment_id' => $equipment->id, 'quantity' => 1]],
            'alat',
            [
                'loan_type' => 'pribadi',
                'borrow_scope' => 'lab',
                'borrow_reason' => 'lanjutan',
                'request_date' => '2026-09-14',
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

        // Satu booking praktikum: Reserved Campus = 6 → remaining pribadi = 14.
        $this->assertSame(14, $this->slots->remainingForDraft($equipment, [
            'loan_type' => 'pribadi',
            'borrow_scope' => 'lab',
            'borrow_reason' => 'lanjutan',
            'request_date' => '2026-09-14',
        ]));

        $this->assertSame('diminta', $this->queue->resolveInitialStatus(
            [['equipment_id' => $equipment->id, 'quantity' => 14]],
            'alat',
            [
                'loan_type' => 'pribadi',
                'borrow_scope' => 'lab',
                'borrow_reason' => 'lanjutan',
                'request_date' => '2026-09-14',
            ],
        ));

        $this->assertSame('antrian', $this->queue->resolveInitialStatus(
            [['equipment_id' => $equipment->id, 'quantity' => 15]],
            'alat',
            [
                'loan_type' => 'pribadi',
                'borrow_scope' => 'lab',
                'borrow_reason' => 'lanjutan',
                'request_date' => '2026-09-14',
            ],
        ));
    }

    public function test_pribadi_uses_reserved_campus_sum_not_peak_concurrent(): void
    {
        $this->travelTo(Carbon::parse('2026-09-09 10:00:00'));

        $equipment = $this->makeEquipment(10);
        $guru = $this->makeUser('guru', 'guru-slot-rc');
        $morning = $this->makeSchedule($guru, '2026-09-14', '08:00:00', '10:00:00', 'JDW-RC-A');
        $afternoon = $this->makeSchedule($guru, '2026-09-14', '10:00:00', '12:00:00', 'JDW-RC-B');

        $this->makeOccupyingLoan($equipment, 6, 'lab', 'reguler', '2026-09-14', $morning->id);
        $this->makeOccupyingLoan($equipment, 2, 'lab', 'reguler', '2026-09-14', $afternoon->id);

        // Peak Concurrent for personal window would still be 6 → remaining 4.
        $pribadiWindow = $this->slots->windowFromContext([
            'loan_type' => 'pribadi',
            'request_date' => '2026-09-14',
        ]);
        $this->assertSame(4, $this->slots->remaining($equipment, $pribadiWindow[0], $pribadiWindow[1]));

        // Reserved Campus = 8 → remaining pribadi = 2.
        $this->assertSame(2, $this->slots->remainingForDraft($equipment, [
            'loan_type' => 'pribadi',
            'borrow_scope' => 'lab',
            'borrow_reason' => 'lanjutan',
            'request_date' => '2026-09-14',
        ]));

        $this->assertSame('diminta', $this->queue->resolveInitialStatus(
            [['equipment_id' => $equipment->id, 'quantity' => 2]],
            'alat',
            [
                'loan_type' => 'pribadi',
                'borrow_scope' => 'lab',
                'borrow_reason' => 'lanjutan',
                'request_date' => '2026-09-14',
            ],
        ));

        $this->assertSame('antrian', $this->queue->resolveInitialStatus(
            [['equipment_id' => $equipment->id, 'quantity' => 3]],
            'alat',
            [
                'loan_type' => 'pribadi',
                'borrow_scope' => 'lab',
                'borrow_reason' => 'lanjutan',
                'request_date' => '2026-09-14',
            ],
        ));

        // Praktikum peak path unchanged: morning still sees only morning occupancy.
        $this->assertSame(4, $this->slots->remaining($equipment, $pribadiWindow[0], $pribadiWindow[1]));
        $morningWindow = $this->slots->windowFromContext([
            'loan_type' => 'praktikum',
            'request_date' => '2026-09-14',
            'practicum_schedule_id' => $morning->id,
        ], $morning);
        $this->assertSame(4, $this->slots->remaining($equipment, $morningWindow[0], $morningWindow[1]));
    }

    public function test_pribadi_reserved_campus_includes_lomba_loan_excludes_bawa_pulang(): void
    {
        $this->travelTo(Carbon::parse('2026-09-09 10:00:00'));

        $equipment = $this->makeEquipment(10);
        $guru = $this->makeUser('guru', 'guru-slot-lomba-rc');
        $morning = $this->makeSchedule($guru, '2026-09-14', '08:00:00', '10:00:00', 'JDW-RC-L');

        $this->makeOccupyingLoan($equipment, 4, 'lab', 'reguler', '2026-09-14', $morning->id);
        $this->makeOccupyingLoan(
            $equipment,
            3,
            'bawa_pulang',
            'lomba',
            '2026-09-14',
            dueAt: Carbon::parse('2026-09-15 17:00:00'),
        );
        $this->makeOccupyingLoan(
            $equipment,
            2,
            'bawa_pulang',
            'lanjutan',
            '2026-09-14',
            dueAt: Carbon::parse('2026-09-15 17:00:00'),
        );

        // Reserved Campus = praktikum 4 + lomba 3 = 7 (bawa_pulang ignored).
        $this->assertSame(3, $this->slots->remainingForDraft($equipment, [
            'loan_type' => 'pribadi',
            'borrow_scope' => 'lab',
            'borrow_reason' => 'lanjutan',
            'request_date' => '2026-09-14',
        ]));
    }

    public function test_pribadi_other_personal_reduces_remaining_without_double_count(): void
    {
        $this->travelTo(Carbon::parse('2026-09-09 10:00:00'));

        $equipment = $this->makeEquipment(10);
        $guru = $this->makeUser('guru', 'guru-slot-op');
        $morning = $this->makeSchedule($guru, '2026-09-14', '08:00:00', '10:00:00', 'JDW-RC-OP');

        $this->makeOccupyingLoan($equipment, 6, 'lab', 'reguler', '2026-09-14', $morning->id);
        $this->makeOccupyingLoan($equipment, 2, 'lab', 'lanjutan', '2026-09-14');

        // Reserved Campus 6 + otherPersonal 2 = 8 → remaining 2.
        $this->assertSame(2, $this->slots->remainingForDraft($equipment, [
            'loan_type' => 'pribadi',
            'borrow_scope' => 'lab',
            'borrow_reason' => 'lanjutan',
            'request_date' => '2026-09-14',
        ]));

        $this->assertSame(8, $this->slots->committedForPersonal(
            $equipment->id,
            '2026-09-14',
        ));
    }

    public function test_bawa_pulang_after_morning_does_not_block_morning_slot(): void
    {
        $this->travelTo(Carbon::parse('2026-09-14 10:00:00'));

        $equipment = $this->makeEquipment(20);
        $this->makeOccupyingLoan(
            $equipment,
            10,
            'bawa_pulang',
            'lanjutan',
            '2026-09-14',
            dueAt: Carbon::parse('2026-09-15 17:00:00'),
        );

        $guru = $this->makeUser('guru', 'guru-slot-bp');
        $morning = $this->makeSchedule($guru, '2026-09-14', '07:00:00', '09:30:00', 'JDW-BP');
        $morningWindow = $this->slots->windowFromContext([
            'loan_type' => 'praktikum',
            'borrow_scope' => 'lab',
            'borrow_reason' => 'reguler',
            'request_date' => '2026-09-14',
            'practicum_schedule_id' => $morning->id,
        ], $morning);

        $this->assertSame(20, $this->slots->remaining($equipment, $morningWindow[0], $morningWindow[1]));

        $nextMorning = $this->makeSchedule($guru, '2026-09-15', '07:00:00', '09:30:00', 'JDW-BP2');
        $nextWindow = $this->slots->windowFromContext([
            'loan_type' => 'praktikum',
            'borrow_scope' => 'lab',
            'borrow_reason' => 'reguler',
            'request_date' => '2026-09-15',
            'practicum_schedule_id' => $nextMorning->id,
        ], $nextMorning);

        $this->assertSame(10, $this->slots->remaining($equipment, $nextWindow[0], $nextWindow[1]));
    }

    public function test_same_day_bawa_pulang_starts_at_school_close_not_now(): void
    {
        $this->travelTo(Carbon::parse('2026-09-14 08:00:00'));

        $equipment = $this->makeEquipment(20);
        $this->makeOccupyingLoan(
            $equipment,
            10,
            'bawa_pulang',
            'lanjutan',
            '2026-09-14',
            dueAt: Carbon::parse('2026-09-15 17:00:00'),
        );

        $guru = $this->makeUser('guru', 'guru-slot-now');
        $morning = $this->makeSchedule($guru, '2026-09-14', '07:00:00', '09:30:00', 'JDW-NOW');
        $morningWindow = $this->slots->windowFromContext([
            'loan_type' => 'praktikum',
            'borrow_scope' => 'lab',
            'borrow_reason' => 'reguler',
            'request_date' => '2026-09-14',
            'practicum_schedule_id' => $morning->id,
        ], $morning);

        // Bawa Pulang mulai jam pulang sekolah → tidak makan slot praktik pagi.
        $this->assertSame(20, $this->slots->remaining($equipment, $morningWindow[0], $morningWindow[1]));

        [$start] = $this->slots->windowFromContext([
            'loan_type' => 'bawa_pulang',
            'borrow_scope' => 'bawa_pulang',
            'borrow_reason' => 'lanjutan',
            'request_date' => '2026-09-14',
            'due_at' => '2026-09-15 17:00:00',
        ]);
        $this->assertSame('17:00:00', $start->format('H:i:s'));
        $this->assertSame('2026-09-14', $start->toDateString());
    }

    public function test_full_after_school_slot_rejects_lomba_without_queue(): void
    {
        $this->travelTo(Carbon::parse('2026-09-14 08:00:00'));

        $equipment = $this->makeEquipment(20);
        // Loan take-home lain yang sudah mengisi penuh jendela setelah jam pulang.
        $this->makeOccupyingLoan(
            $equipment,
            20,
            'bawa_pulang',
            'lanjutan',
            '2026-09-14',
            dueAt: Carbon::parse('2026-09-15 17:00:00'),
        );

        $this->expectException(ValidationException::class);

        $this->queue->resolveInitialStatus(
            [['equipment_id' => $equipment->id, 'quantity' => 1]],
            'alat',
            [
                'loan_type' => 'lomba',
                'borrow_scope' => 'bawa_pulang',
                'borrow_reason' => 'lomba',
                'request_date' => '2026-09-14',
                'due_at' => '2026-09-15 17:00:00',
            ],
        );
    }

    public function test_approve_deducts_available_immediately(): void
    {
        $this->travelTo(Carbon::parse('2026-09-09 10:00:00'));

        $equipment = $this->makeEquipment(20);
        $admin = $this->makeUser('admin', 'admin-slot-future');
        $guru = $this->makeUser('guru', 'guru-slot-future');
        $morning = $this->makeSchedule($guru, '2026-09-14', '07:00:00', '09:30:00', 'JDW-FUT');
        $loan = $this->makeOccupyingLoan($equipment, 6, 'lab', 'reguler', '2026-09-14', $morning->id);

        $this->workflow->approve($loan->fresh(), $admin);

        $this->assertSame('disetujui', $loan->fresh()->status);
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
        $this->assertSame('Praktik Lab', $praktikum->queueTypeLabel());

        $pribadi = $this->makeOccupyingLoan($equipment, 1, 'lab', 'lanjutan', '2026-09-14');
        $this->assertSame('Pakai di lab sampai jam 17:00', $this->slots->slotLabel($pribadi));
        $this->assertSame('Pribadi', $pribadi->queueTypeLabel());
        $this->assertSame('lab_hours', $this->slots->slotPresentation($pribadi)['kind']);

        $lomba = $this->makeOccupyingLoan(
            $equipment,
            1,
            'bawa_pulang',
            'lomba',
            '2026-09-14',
            dueAt: Carbon::parse('2026-09-15 17:00:00'),
        );
        $this->assertSame('Kembali 15 Sep 17:00', $this->slots->slotLabel($lomba));
        $this->assertSame('Lomba', $lomba->queueTypeLabel());
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

        $loanType = Loan::resolveTypeFromLegacy($borrowScope, $borrowReason);
        $legacy = Loan::legacyFieldsForType($loanType);

        $loan = Loan::query()->create([
            'code' => Loan::generateCode(),
            'submission_id' => $submission->id,
            'borrower_id' => $borrower->id,
            'supervisor_id' => $guru->id,
            'item_type' => 'alat',
            'loan_type' => $loanType,
            'status' => $status,
            'request_date' => $requestDate,
            'purpose' => 'Tes slot',
            'borrow_scope' => $legacy['borrow_scope'],
            'borrow_reason' => $legacy['borrow_reason'],
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
            'schedule_kind' => 'praktikum',
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
