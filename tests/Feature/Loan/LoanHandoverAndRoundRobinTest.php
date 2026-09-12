<?php

namespace Tests\Feature\Loan;

use App\Models\Equipment;
use App\Models\Loan;
use App\Models\LoanCollateral;
use App\Models\LoanItem;
use App\Models\PracticumSchedule;
use App\Models\Submission;
use App\Models\User;
use App\Services\Loan\CollateralWorkflowService;
use App\Services\Loan\LoanQueueService;
use App\Services\Loan\LoanSlotAvailabilityService;
use App\Services\Loan\LoanWorkflowService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class LoanHandoverAndRoundRobinTest extends TestCase
{
    use RefreshDatabase;

    public function test_lomba_does_not_occupy_monday_morning_slot(): void
    {
        $this->travelTo(Carbon::parse('2026-09-09 10:00:00'));

        $ketua = $this->makeUser('siswa', 'siswa-xi');
        $lombaSiswa = $this->makeUser('siswa', 'siswa-lomba-slot');
        $guru = $this->makeUser('guru', 'guru-lomba-slot');
        $alat = $this->makeEquipment(20);
        $schedule = $this->makeWeeklySchedule($guru, 'senin', '07:00:00', '09:30:00');
        $monday = '2026-09-14';

        $this->actingAs($ketua)->post(route('siswa.loans.store'), [
            'supervisor_id' => $guru->id,
            'practicum_schedule_id' => $schedule->id,
            'item_type' => 'alat',
            'request_date' => $monday,
            'purpose' => 'Praktik XI',
            'notes' => 'Praktik XI',
            'borrow_scope' => 'lab',
            'borrow_reason' => 'reguler',
            'usage_room' => 'Ruang Assembly',
            'due_at' => $monday.'T09:30',
            'items' => [
                ['equipment_id' => $alat->id, 'quantity' => 6],
            ],
        ])->assertRedirect();

        $this->actingAs($lombaSiswa)->post(route('siswa.loans.store'), [
            'item_type' => 'alat',
            'request_date' => $monday,
            'purpose' => 'Lomba speaker',
            'notes' => 'Lomba speaker',
            'borrow_scope' => 'bawa_pulang',
            'borrow_reason' => 'lomba',
            'collateral_agreed' => 1,
            'due_at' => '2026-09-15T17:00',
            'items' => [
                ['equipment_id' => $alat->id, 'quantity' => 1],
            ],
        ])->assertRedirect();

        $praktikum = Loan::query()->where('borrower_id', $ketua->id)->latest('id')->first();
        $lomba = Loan::query()->where('borrower_id', $lombaSiswa->id)->latest('id')->first();

        $this->assertSame('diminta', $praktikum?->status);
        $this->assertSame('diminta', $lomba?->status);

        $slots = app(LoanSlotAvailabilityService::class);
        $morning = $slots->windowFromContext([
            'borrow_scope' => 'lab',
            'borrow_reason' => 'reguler',
            'request_date' => $monday,
            'practicum_schedule_id' => $schedule->id,
        ], $schedule);

        $this->assertSame(14, $slots->remaining($alat->fresh(), $morning[0], $morning[1]));
    }

    public function test_lomba_handover_waits_until_last_praktikum_ends(): void
    {
        $this->travelTo(Carbon::parse('2026-09-09 10:00:00'));

        $admin = $this->makeUser('admin', 'admin-handover');
        $guru = $this->makeUser('guru', 'guru-handover');
        $alat = $this->makeEquipment(20);
        $morning = $this->makeSchedule($guru, '2026-09-14', '07:00:00', '09:30:00', 'JDW-HO-PAGI');
        $praktikum = $this->makeOccupyingLoan($alat, 6, 'lab', 'reguler', '2026-09-14', $morning->id);
        $lomba = $this->makeOccupyingLoan(
            $alat,
            1,
            'bawa_pulang',
            'lomba',
            '2026-09-14',
            dueAt: Carbon::parse('2026-09-15 17:00:00'),
        );

        $slots = app(LoanSlotAvailabilityService::class);
        $workflow = app(LoanWorkflowService::class);

        $this->assertSame(
            '2026-09-14 09:30:00',
            $slots->lastPraktikumEndFor($lomba->fresh())?->format('Y-m-d H:i:s'),
        );
        $this->assertFalse($slots->canHandOver($lomba, Carbon::parse('2026-09-14 08:00:00')));
        $this->assertTrue($slots->canHandOver($lomba, Carbon::parse('2026-09-14 09:30:00')));

        $workflow->approve($lomba->fresh(), $admin);
        $this->holdCollateral($lomba->fresh(), $admin);

        $this->travelTo(Carbon::parse('2026-09-14 08:00:00'));

        try {
            $workflow->markBorrowed($lomba->fresh(), $admin);
            $this->fail('Serah terima lomba pagi seharusnya ditolak.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            $this->assertStringContainsString('09:30', $e->errors()['status'][0] ?? '');
        }

        $this->actingAs($admin)
            ->get(route('admin.loans.show', $lomba))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('loan.can_mark_borrowed', false)
                ->where('loan.mark_borrowed_blocked_reason', fn ($reason) => str_contains((string) $reason, '09:30'))
            );

        $this->travelTo(Carbon::parse('2026-09-14 09:30:00'));
        $workflow->markBorrowed($lomba->fresh(), $admin);
        $this->assertSame('dipinjam', $lomba->fresh()->status);
        $this->assertSame($praktikum->status, 'diminta');
    }

    public function test_handover_allowed_when_no_praktikum_uses_the_item(): void
    {
        $this->travelTo(Carbon::parse('2026-09-14 08:00:00'));

        $admin = $this->makeUser('admin', 'admin-no-mapel');
        $alat = $this->makeEquipment(20);
        $lomba = $this->makeOccupyingLoan(
            $alat,
            1,
            'bawa_pulang',
            'lomba',
            '2026-09-14',
            dueAt: Carbon::parse('2026-09-15 17:00:00'),
        );

        $slots = app(LoanSlotAvailabilityService::class);
        $this->assertNull($slots->lastPraktikumEndFor($lomba));
        $this->assertTrue($slots->canHandOver($lomba));

        app(LoanWorkflowService::class)->approve($lomba->fresh(), $admin);
        $this->holdCollateral($lomba->fresh(), $admin);
        app(LoanWorkflowService::class)->markBorrowed($lomba->fresh(), $admin);

        $this->assertSame('dipinjam', $lomba->fresh()->status);
    }

    public function test_four_pribadi_two_toolsets_fifo_and_reapply_goes_to_tail(): void
    {
        $this->travelTo(Carbon::parse('2026-09-14 10:00:00'));

        $admin = $this->makeUser('admin', 'admin-rr');
        $alat = $this->makeEquipment(2);
        $siswa = [];
        for ($i = 1; $i <= 4; $i++) {
            $siswa[$i] = $this->makeUser('siswa', 'siswa-rr-'.$i);
        }

        $payload = fn () => [
            'item_type' => 'alat',
            'request_date' => '2026-09-14',
            'purpose' => 'Pribadi RR',
            'notes' => 'Pribadi RR',
            'borrow_scope' => 'lab',
            'borrow_reason' => 'lanjutan',
            'usage_room' => 'Ruang Assembly',
            'due_at' => '2026-09-14T17:00',
            'items' => [
                ['equipment_id' => $alat->id, 'quantity' => 1],
            ],
        ];

        foreach ($siswa as $user) {
            $this->actingAs($user)->post(route('siswa.loans.store'), $payload())->assertRedirect();
            $this->travel(1)->seconds();
        }

        $loans = collect($siswa)->map(
            fn (User $user) => Loan::query()->where('borrower_id', $user->id)->latest('id')->first()
        )->values();

        $this->assertSame('diminta', $loans[0]->status);
        $this->assertSame('diminta', $loans[1]->status);
        $this->assertSame('antrian', $loans[2]->status);
        $this->assertSame('antrian', $loans[3]->status);

        $queue = app(LoanQueueService::class);
        $this->assertSame(1, $queue->getQueuePosition($loans[2]));
        $this->assertSame(2, $queue->getQueuePosition($loans[3]));

        $workflow = app(LoanWorkflowService::class);
        $workflow->approve($loans[0]->fresh(), $admin);
        $workflow->markBorrowed($loans[0]->fresh(), $admin);

        $workflow->processReturn($loans[0]->fresh(), 'Kembali', $admin);
        app(CollateralWorkflowService::class)->inspectReturn($loans[0]->fresh(), [
            'result' => 'lengkap',
        ], $admin);

        $this->assertSame('dikembalikan', $loans[0]->fresh()->status);
        $this->assertSame('diminta', $loans[2]->fresh()->status);
        $this->assertSame('antrian', $loans[3]->fresh()->status);
        $this->assertSame(1, $queue->getQueuePosition($loans[3]->fresh()));

        $this->travel(1)->seconds();
        $this->actingAs($siswa[1])->post(route('siswa.loans.store'), $payload())->assertRedirect();
        $reapplied = Loan::query()->where('borrower_id', $siswa[1]->id)->latest('id')->first();

        $this->assertSame('antrian', $reapplied->status);
        $this->assertSame(1, $queue->getQueuePosition($loans[3]->fresh()));
        $this->assertSame(2, $queue->getQueuePosition($reapplied));
    }

    public function test_returning_pribadi_does_not_promote_queued_praktikum(): void
    {
        $this->travelTo(Carbon::parse('2026-09-14 10:00:00'));

        $admin = $this->makeUser('admin', 'admin-skip-prak');
        $guru = $this->makeUser('guru', 'guru-skip-prak');
        $alat = $this->makeEquipment(1);
        $afternoon = $this->makeSchedule($guru, '2026-09-14', '13:00:00', '15:30:00', 'JDW-SKIP');

        $pribadi = $this->makeOccupyingLoan($alat, 1, 'lab', 'lanjutan', '2026-09-14');
        $praktikumQueued = $this->makeOccupyingLoan(
            $alat,
            1,
            'lab',
            'reguler',
            '2026-09-14',
            $afternoon->id,
            status: 'antrian',
            queuedAt: now()->subMinutes(10),
        );
        $pribadiQueued = $this->makeOccupyingLoan(
            $alat,
            1,
            'lab',
            'lanjutan',
            '2026-09-14',
            status: 'antrian',
            queuedAt: now()->subMinutes(1),
        );

        $workflow = app(LoanWorkflowService::class);
        $workflow->approve($pribadi->fresh(), $admin);
        $workflow->markBorrowed($pribadi->fresh(), $admin);
        $workflow->processReturn($pribadi->fresh(), 'Kembali', $admin);
        app(CollateralWorkflowService::class)->inspectReturn($pribadi->fresh(), [
            'result' => 'lengkap',
        ], $admin);

        $this->assertSame('antrian', $praktikumQueued->fresh()->status);
        $this->assertSame('diminta', $pribadiQueued->fresh()->status);
    }

    private function holdCollateral(Loan $loan, User $admin): void
    {
        $collateral = $loan->collateral ?? LoanCollateral::query()->create([
            'code' => LoanCollateral::generateCode(),
            'loan_id' => $loan->id,
            'student_id' => $loan->borrower_id,
            'card_type' => 'kartu_pelajar',
            'status' => 'dititipkan',
        ]);

        $collateral->update([
            'status' => 'ditahan',
            'held_at' => now(),
            'held_by_admin_id' => $admin->id,
        ]);
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
        ?Carbon $queuedAt = null,
    ): Loan {
        $borrower = $this->makeUser('siswa', 'siswa-'.Str::lower(Str::random(6)));
        $guru = User::query()->where('role', 'guru')->first()
            ?? $this->makeUser('guru', 'guru-'.Str::lower(Str::random(4)));

        $submission = Submission::createForBorrower($borrower, [
            'supervisor_id' => $guru->id,
            'purpose' => 'Tes tahap 4-5',
            'request_date' => $requestDate,
        ]);

        $loan = Loan::query()->create([
            'code' => Loan::generateCode(),
            'submission_id' => $submission->id,
            'borrower_id' => $borrower->id,
            'supervisor_id' => $guru->id,
            'item_type' => 'alat',
            'status' => $status,
            'queued_at' => $status === 'antrian' ? ($queuedAt ?? now()) : null,
            'request_date' => $requestDate,
            'purpose' => 'Tes tahap 4-5',
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

        if ($borrowScope === 'bawa_pulang') {
            LoanCollateral::query()->create([
                'code' => LoanCollateral::generateCode(),
                'loan_id' => $loan->id,
                'student_id' => $borrower->id,
                'card_type' => 'kartu_pelajar',
                'status' => 'dititipkan',
            ]);
        }

        return $loan->fresh(['items.equipment', 'schedule', 'collateral']);
    }

    private function makeWeeklySchedule(User $guru, string $hari, string $start, string $end): PracticumSchedule
    {
        return PracticumSchedule::query()->create([
            'code' => 'JDW-'.Str::upper(Str::random(4)),
            'title' => 'Praktik Slot',
            'mata_kuliah' => 'DTE (Dasar Teknik Elektronika)',
            'jurusan' => 'Audio Video',
            'kelas' => 'X TE 1',
            'type' => 'mingguan',
            'hari' => $hari,
            'jam_mulai' => $start,
            'jam_selesai' => $end,
            'ruangan' => 'Ruang Assembly',
            'guru_id' => $guru->id,
            'priority' => 'normal',
        ]);
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
            'nisn' => $role === 'siswa' ? '0044'.substr(md5($username), 0, 6) : null,
        ]);
    }

    private function makeEquipment(int $qtyBaik): Equipment
    {
        return Equipment::query()->create([
            'code' => 'ALAT-'.Str::upper(Str::random(4)),
            'name' => 'Toolset RR',
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
