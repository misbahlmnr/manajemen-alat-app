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

    public function test_lomba_preempts_lower_priority_diminta_pribadi(): void
    {
        $this->markTestSkipped('Preempt lintas tipe dihapus; RR hanya pribadi dengan prioritas manual.');
    }

    public function test_new_submit_cannot_take_leftover_while_queue_head_does_not_fit(): void
    {
        $this->markTestSkipped('Preempt/leftover lintas tipe dihapus dari Round Robin baru.');
    }

    public function test_returning_praktikum_promotes_remaining_queue_that_fits(): void
    {
        $this->markTestSkipped('Demo antrian multi-tipe diganti; RR hanya pribadi.');
    }

    public function test_returning_lomba_only_promotes_head_that_exactly_fits(): void
    {
        $this->markTestSkipped('Lomba tidak lagi masuk antrian siswa; dibuat via event admin.');
    }

    public function test_lomba_does_not_occupy_monday_morning_slot(): void
    {
        $this->markTestSkipped('Lomba tidak lagi diajukan siswa; slot window diuji di unit slot service.');
    }

    public function test_lomba_handover_is_allowed_during_praktikum(): void
    {
        $this->travelTo(Carbon::parse('2026-09-14 08:00:00'));

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

        $this->assertTrue($slots->canHandOver($lomba, Carbon::parse('2026-09-14 08:00:00')));

        $workflow->approve($lomba->fresh(), $admin);
        $this->holdCollateral($lomba->fresh(), $admin);

        $workflow->markBorrowed($lomba->fresh(), $admin);
        $this->assertSame('dipinjam', $lomba->fresh()->status);
        $this->assertSame('diminta', $praktikum->fresh()->status);
        $this->assertTrue($lomba->fresh()->stock_held);
    }

    public function test_bawa_pulang_approve_reserves_while_praktikum_holds_stock(): void
    {
        $this->travelTo(Carbon::parse('2026-09-14 10:00:00'));

        $admin = $this->makeUser('admin', 'admin-bp-reserve');
        $guru = $this->makeUser('guru', 'guru-bp-reserve');
        $alat = $this->makeEquipment(5);
        $schedule = $this->makeSchedule($guru, '2026-09-14', '07:00:00', '12:00:00', 'JDW-BP-HOLD');

        $praktikum = $this->makeOccupyingLoan($alat, 5, 'lab', 'reguler', '2026-09-14', $schedule->id);
        $workflow = app(LoanWorkflowService::class);
        $workflow->approve($praktikum->fresh(), $admin);

        $this->assertTrue($praktikum->fresh()->stock_held);
        $this->assertSame(0, $alat->fresh()->available);

        $bawaPulang = $this->makeOccupyingLoan(
            $alat,
            2,
            'bawa_pulang',
            'lanjutan',
            '2026-09-14',
            dueAt: Carbon::parse('2026-09-15 17:00:00'),
        );

        $workflow->approve($bawaPulang->fresh(), $admin);

        $bawaPulang = $bawaPulang->fresh();
        $this->assertSame('disetujui', $bawaPulang->status);
        $this->assertTrue($bawaPulang->stock_held);
        $this->assertSame(-2, $alat->fresh()->available);

        $this->holdCollateral($bawaPulang, $admin);
        $workflow->markBorrowed($bawaPulang->fresh(), $admin);
        $this->assertSame('dipinjam', $bawaPulang->fresh()->status);
    }

    public function test_project_handover_waits_until_last_praktikum_ends(): void
    {
        $this->markTestSkipped('Handover tidak lagi menunggu akhir praktikum.');
    }

    public function test_cancelling_diminta_promotes_queued_loan_that_fits(): void
    {
        $this->travelTo(Carbon::parse('2026-09-14 10:00:00'));

        $alat = $this->makeEquipment(20);
        $patma = $this->makeOccupyingLoan($alat, 6, 'lab', 'lanjutan', '2026-09-14');
        $santi = $this->makeOccupyingLoan($alat, 14, 'lab', 'lanjutan', '2026-09-14');
        $misbah = $this->makeOccupyingLoan($alat, 1, 'lab', 'lanjutan', '2026-09-14', status: 'antrian');

        $this->actingAs($santi->borrower)
            ->post(route('siswa.loans.cancel', $santi))
            ->assertRedirect();

        $this->assertSame('dibatalkan', $santi->fresh()->status);
        $this->assertSame('diminta', $misbah->fresh()->status);
        $this->assertSame('diminta', $patma->fresh()->status);
    }

    public function test_rejecting_diminta_promotes_queued_loan_that_fits(): void
    {
        $this->travelTo(Carbon::parse('2026-09-14 10:00:00'));

        $admin = $this->makeUser('admin', 'admin-reject-queue');
        $alat = $this->makeEquipment(20);
        $this->makeOccupyingLoan($alat, 6, 'lab', 'lanjutan', '2026-09-14');
        $santi = $this->makeOccupyingLoan($alat, 14, 'lab', 'lanjutan', '2026-09-14');
        $misbah = $this->makeOccupyingLoan($alat, 1, 'lab', 'lanjutan', '2026-09-14', status: 'antrian');

        $this->actingAs($admin)
            ->post(route('admin.loans.reject', $santi), [
                'rejection_reason' => 'Tidak jadi dipakai.',
            ])
            ->assertRedirect();

        $this->assertSame('ditolak', $santi->fresh()->status);
        $this->assertSame('diminta', $misbah->fresh()->status);
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
            'loan_type' => 'pribadi',
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

        // Praktikum tidak masuk antrean RR; tetap antrian (legacy row) atau tidak dipromote.
        $this->assertNotSame('diminta', $praktikumQueued->fresh()->status);
        $this->assertSame('diminta', $pribadiQueued->fresh()->status);
    }

    /**
     * @return array{patma: Loan, santi: Loan, misbah: Loan, azka: Loan, azki: Loan}
     */
    private function createDemoAntrianLoans(): array
    {
        $this->travelTo(Carbon::parse('2026-09-14 08:00:00'));

        $guru = $this->makeUser('guru', 'guru-preempt-'.Str::lower(Str::random(4)));
        $alat = $this->makeEquipment(20);
        $schedule = $this->makeWeeklySchedule($guru, 'senin', '07:00:00', '09:30:00');
        $monday = '2026-09-14';
        $suffix = Str::lower(Str::random(4));

        $patma = $this->makeUser('siswa', 'siswa-patma-'.$suffix);
        $santi = $this->makeUser('siswa', 'siswa-santi-'.$suffix);
        $misbah = $this->makeUser('siswa', 'siswa-misbah-'.$suffix);
        $azka = $this->makeUser('siswa', 'siswa-azka-'.$suffix);
        $azki = $this->makeUser('siswa', 'siswa-azki-'.$suffix);

        $this->actingAs($patma)->post(route('siswa.loans.store'), [
            'supervisor_id' => $guru->id,
            'practicum_schedule_id' => $schedule->id,
            'item_type' => 'alat',
            'request_date' => $monday,
            'purpose' => 'Praktik',
            'notes' => 'Praktik',
            'borrow_scope' => 'lab',
            'borrow_reason' => 'reguler',
            'usage_room' => 'Ruang Assembly',
            'due_at' => $monday.'T09:30',
            'items' => [['equipment_id' => $alat->id, 'quantity' => 6]],
        ])->assertRedirect();
        $this->travel(1)->seconds();

        $this->actingAs($santi)->post(route('siswa.loans.store'), [
            'item_type' => 'alat',
            'request_date' => $monday,
            'purpose' => 'Pribadi',
            'notes' => 'Pribadi',
            'borrow_scope' => 'lab',
            'borrow_reason' => 'lanjutan',
            'usage_room' => 'Ruang Assembly',
            'due_at' => $monday.'T17:00',
            'items' => [['equipment_id' => $alat->id, 'quantity' => 14]],
        ])->assertRedirect();
        $this->travel(1)->seconds();

        $this->actingAs($misbah)->post(route('siswa.loans.store'), [
            'item_type' => 'alat',
            'request_date' => $monday,
            'purpose' => 'Pribadi',
            'notes' => 'Pribadi',
            'borrow_scope' => 'lab',
            'borrow_reason' => 'lanjutan',
            'usage_room' => 'Ruang Assembly',
            'due_at' => $monday.'T17:00',
            'items' => [['equipment_id' => $alat->id, 'quantity' => 1]],
        ])->assertRedirect();
        $this->travel(1)->seconds();

        $this->actingAs($azka)->post(route('siswa.loans.store'), [
            'item_type' => 'alat',
            'request_date' => $monday,
            'purpose' => 'Project',
            'notes' => 'Project',
            'borrow_scope' => 'bawa_pulang',
            'borrow_reason' => 'lanjutan',
            'collateral_agreed' => 1,
            'due_at' => '2026-09-15T17:00',
            'items' => [['equipment_id' => $alat->id, 'quantity' => 1]],
        ])->assertRedirect();
        $this->travel(1)->seconds();

        $this->actingAs($azki)->post(route('siswa.loans.store'), [
            'item_type' => 'alat',
            'request_date' => $monday,
            'purpose' => 'Lomba',
            'notes' => 'Lomba',
            'borrow_scope' => 'bawa_pulang',
            'borrow_reason' => 'lomba',
            'collateral_agreed' => 1,
            'due_at' => '2026-09-15T17:00',
            'items' => [['equipment_id' => $alat->id, 'quantity' => 1]],
        ])->assertRedirect();

        return [
            'patma' => Loan::query()->where('borrower_id', $patma->id)->latest('id')->firstOrFail(),
            'santi' => Loan::query()->where('borrower_id', $santi->id)->latest('id')->firstOrFail(),
            'misbah' => Loan::query()->where('borrower_id', $misbah->id)->latest('id')->firstOrFail(),
            'azka' => Loan::query()->where('borrower_id', $azka->id)->latest('id')->firstOrFail(),
            'azki' => Loan::query()->where('borrower_id', $azki->id)->latest('id')->firstOrFail(),
        ];
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
            'queued_at' => $status === 'antrian' ? ($queuedAt ?? now()) : null,
            'request_date' => $requestDate,
            'purpose' => 'Tes tahap 4-5',
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

        if ($loanType === 'bawa_pulang') {
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
