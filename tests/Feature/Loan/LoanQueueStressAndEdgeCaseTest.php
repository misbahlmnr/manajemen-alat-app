<?php

namespace Tests\Feature\Loan;

use App\Models\Equipment;
use App\Models\Loan;
use App\Models\PracticumSchedule;
use App\Models\User;
use App\Services\Loan\LoanQueueService;
use App\Services\Loan\LoanSlotAvailabilityService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class LoanQueueStressAndEdgeCaseTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private LoanQueueService $queue;

    private LoanSlotAvailabilityService $slots;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(Carbon::parse('2026-09-14 10:00:00'));
        $this->admin = $this->makeUser('admin', 'admin-stress');
        $this->queue = app(LoanQueueService::class);
        $this->slots = app(LoanSlotAvailabilityService::class);
    }

    public function test_approve_refreshes_available_without_promoting_unfit_queue(): void
    {
        $alat = $this->makeEquipment(20);
        $loanA = $this->submitPribadi($this->makeSiswa('a'), $alat, 10);
        $loanB = $this->submitPribadi($this->makeSiswa('b'), $alat, 5);
        $loanC = $this->submitPribadi($this->makeSiswa('c'), $alat, 6);

        $this->assertSame('diminta', $loanA->status);
        $this->assertSame('diminta', $loanB->status);
        $this->assertSame('antrian', $loanC->status);
        $this->assertEquipment($alat, available: 20, remaining: 5);

        $this->approve($loanA);
        $this->assertSame('disetujui', $loanA->fresh()->status);
        $this->assertSame('diminta', $loanB->fresh()->status);
        $this->assertSame('antrian', $loanC->fresh()->status);
        $this->assertSame(1, $this->queue->getQueuePosition($loanC->fresh()));
        $this->assertEquipment($alat, available: 10, remaining: 5);

        $this->borrow($loanA);
        $this->assertSame(10, (int) $alat->fresh()->available);

        $this->approve($loanB);
        $this->borrow($loanB);

        $this->assertSame('dipinjam', $loanA->fresh()->status);
        $this->assertSame('dipinjam', $loanB->fresh()->status);
        $this->assertSame('antrian', $loanC->fresh()->status);
        $this->assertSame(1, $this->queue->getQueuePosition($loanC->fresh()));
        $this->assertEquipment($alat, available: 5, remaining: 5);
    }

    public function test_full_return_promotes_queue_head_that_fits(): void
    {
        $alat = $this->makeEquipment(20);
        $loanA = $this->submitPribadi($this->makeSiswa('a'), $alat, 20);
        $loanB = $this->submitPribadi($this->makeSiswa('b'), $alat, 10);

        $this->approve($loanA);
        $this->borrow($loanA);

        $this->assertSame('dipinjam', $loanA->fresh()->status);
        $this->assertSame('antrian', $loanB->fresh()->status);
        $this->assertEquipment($alat, available: 0, remaining: 0);

        $this->actingAs($this->admin)
            ->post(route('admin.loans.return', $loanA), ['note' => 'Kembali'])
            ->assertRedirect();

        $this->assertSame('menunggu_inspeksi', $loanA->fresh()->status);
        $this->assertSame('antrian', $loanB->fresh()->status);
        $this->assertEquipment($alat, available: 0, remaining: 0);

        $this->inspectReturn($loanA);

        $this->assertSame('dikembalikan', $loanA->fresh()->status);
        $this->assertSame('diminta', $loanB->fresh()->status);
        $this->assertNull($this->queue->getQueuePosition($loanB->fresh()));
        $this->assertEquipment($alat, available: 20, remaining: 10);
    }

    public function test_partial_release_keeps_fifo_when_head_does_not_fit(): void
    {
        $alat = $this->makeEquipment(20);
        $loanA = $this->submitPribadi($this->makeSiswa('a'), $alat, 20);
        $loanB = $this->submitPribadi($this->makeSiswa('b'), $alat, 15);
        $loanC = $this->submitPribadi($this->makeSiswa('c'), $alat, 5);

        $this->approve($loanA);
        $this->borrow($loanA);

        $loanA->items()->where('equipment_id', $alat->id)->update(['quantity' => 10]);
        $alat->increment('available', 10);

        $this->queue->processQueueForEquipment($alat->id);

        $this->assertSame('dipinjam', $loanA->fresh()->status);
        $this->assertSame('antrian', $loanB->fresh()->status);
        $this->assertSame('antrian', $loanC->fresh()->status);
        $this->assertSame(1, $this->queue->getQueuePosition($loanB->fresh()));
        $this->assertSame(2, $this->queue->getQueuePosition($loanC->fresh()));
        $this->assertEquipment($alat, available: 10, remaining: 10);
    }

    public function test_cancelling_queue_head_shifts_positions(): void
    {
        $alat = $this->makeEquipment(20);
        $loanA = $this->submitPribadi($this->makeSiswa('a'), $alat, 20);
        $loanB = $this->submitPribadi($this->makeSiswa('b'), $alat, 10);
        $loanC = $this->submitPribadi($this->makeSiswa('c'), $alat, 5);
        $loanD = $this->submitPribadi($this->makeSiswa('d'), $alat, 3);

        $this->assertSame([1, 2, 3], [
            $this->queue->getQueuePosition($loanB),
            $this->queue->getQueuePosition($loanC),
            $this->queue->getQueuePosition($loanD),
        ]);

        $this->actingAs($loanB->borrower)
            ->post(route('siswa.loans.cancel', $loanB))
            ->assertRedirect();

        $this->assertSame('dibatalkan', $loanB->fresh()->status);
        $this->assertSame('diminta', $loanA->fresh()->status);
        $this->assertSame('antrian', $loanC->fresh()->status);
        $this->assertSame('antrian', $loanD->fresh()->status);
        $this->assertSame(1, $this->queue->getQueuePosition($loanC->fresh()));
        $this->assertSame(2, $this->queue->getQueuePosition($loanD->fresh()));
        $this->assertSame(
            [$loanC->id, $loanD->id],
            $this->queue->queuedLoansForEquipment($alat->id)->pluck('id')->all(),
        );
        $this->assertEquipment($alat, available: 20, remaining: 0);
    }

    public function test_rejecting_queue_head_shifts_positions(): void
    {
        $alat = $this->makeEquipment(20);
        $loanA = $this->submitPribadi($this->makeSiswa('a'), $alat, 20);
        $loanB = $this->submitPribadi($this->makeSiswa('b'), $alat, 10);
        $loanC = $this->submitPribadi($this->makeSiswa('c'), $alat, 5);
        $loanD = $this->submitPribadi($this->makeSiswa('d'), $alat, 3);

        $this->actingAs($this->admin)
            ->post(route('admin.loans.reject', $loanB), [
                'rejection_reason' => 'Tidak jadi dipakai.',
            ])
            ->assertRedirect();

        $this->assertSame('ditolak', $loanB->fresh()->status);
        $this->assertSame('diminta', $loanA->fresh()->status);
        $this->assertSame('antrian', $loanC->fresh()->status);
        $this->assertSame('antrian', $loanD->fresh()->status);
        $this->assertSame(1, $this->queue->getQueuePosition($loanC->fresh()));
        $this->assertSame(2, $this->queue->getQueuePosition($loanD->fresh()));
        $this->assertSame(
            [$loanC->id, $loanD->id],
            $this->queue->queuedLoansForEquipment($alat->id)->pluck('id')->all(),
        );
        $this->assertEquipment($alat, available: 20, remaining: 0);
    }

    public function test_sequential_returns_process_queue_until_stock_is_used(): void
    {
        $alat = $this->makeEquipment(20);
        $loanA = $this->submitPribadi($this->makeSiswa('a'), $alat, 10);
        $loanB = $this->submitPribadi($this->makeSiswa('b'), $alat, 10);
        $loanC = $this->submitPribadi($this->makeSiswa('c'), $alat, 15);
        $loanD = $this->submitPribadi($this->makeSiswa('d'), $alat, 5);

        $this->approve($loanA);
        $this->borrow($loanA);
        $this->approve($loanB);
        $this->borrow($loanB);

        $this->assertSame('antrian', $loanC->fresh()->status);
        $this->assertSame('antrian', $loanD->fresh()->status);
        $this->assertEquipment($alat, available: 0, remaining: 0);

        $this->completeReturn($loanA);

        $this->assertSame('dikembalikan', $loanA->fresh()->status);
        $this->assertSame('dipinjam', $loanB->fresh()->status);
        $this->assertSame('antrian', $loanC->fresh()->status);
        $this->assertSame('antrian', $loanD->fresh()->status);
        $this->assertSame(1, $this->queue->getQueuePosition($loanC->fresh()));
        $this->assertSame(2, $this->queue->getQueuePosition($loanD->fresh()));
        $this->assertEquipment($alat, available: 10, remaining: 10);

        $this->completeReturn($loanB);

        $this->assertSame('dikembalikan', $loanB->fresh()->status);
        $this->assertSame('diminta', $loanC->fresh()->status);
        $this->assertSame('diminta', $loanD->fresh()->status);
        $this->assertNull($this->queue->getQueuePosition($loanC->fresh()));
        $this->assertNull($this->queue->getQueuePosition($loanD->fresh()));
        $this->assertEquipment($alat, available: 20, remaining: 0);
    }

    public function test_unfit_queue_head_blocks_smaller_loans_behind(): void
    {
        $alat = $this->makeEquipment(8);
        $loanA = $this->submitPribadi($this->makeSiswa('a'), $alat, 10);
        $loanB = $this->submitPribadi($this->makeSiswa('b'), $alat, 2);
        $loanC = $this->submitPribadi($this->makeSiswa('c'), $alat, 2);

        $this->assertSame('antrian', $loanA->status);
        $this->assertSame('antrian', $loanB->status);
        $this->assertSame('antrian', $loanC->status);
        $this->assertSame([1, 2, 3], [
            $this->queue->getQueuePosition($loanA),
            $this->queue->getQueuePosition($loanB),
            $this->queue->getQueuePosition($loanC),
        ]);

        $this->queue->processQueueForEquipment($alat->id);

        $this->assertSame('antrian', $loanA->fresh()->status);
        $this->assertSame('antrian', $loanB->fresh()->status);
        $this->assertSame('antrian', $loanC->fresh()->status);
        $this->assertEquipment($alat, available: 8, remaining: 8, capacity: 8);
    }

    public function test_process_queue_after_return_is_not_applied_twice(): void
    {
        $alat = $this->makeEquipment(20);
        $loanA = $this->submitPribadi($this->makeSiswa('a'), $alat, 20);
        $loanB = $this->submitPribadi($this->makeSiswa('b'), $alat, 15);
        $loanC = $this->submitPribadi($this->makeSiswa('c'), $alat, 10);

        $this->approve($loanA);
        $this->borrow($loanA);
        $this->completeReturn($loanA);

        $this->assertSame('diminta', $loanB->fresh()->status);
        $this->assertSame('antrian', $loanC->fresh()->status);
        $this->assertEquipment($alat, available: 20, remaining: 5);

        $this->queue->processQueueAfterLoanItemsReleased($loanA->fresh());
        $this->queue->processQueueForEquipment($alat->id);

        $this->assertSame('diminta', $loanB->fresh()->status);
        $this->assertSame('antrian', $loanC->fresh()->status);
        $this->assertSame(1, $this->queue->getQueuePosition($loanC->fresh()));
        $this->assertEquipment($alat, available: 20, remaining: 5);
    }

    public function test_simultaneous_submits_keep_fifo_by_queued_at_and_id(): void
    {
        $alat = $this->makeEquipment(0);
        $siswa = [];
        for ($i = 0; $i < 5; $i++) {
            $siswa[] = $this->makeSiswa('same-'.$i);
        }

        $this->freezeTime();

        $loans = [];
        foreach ($siswa as $user) {
            $loans[] = $this->submitPribadi($user, $alat, 4);
        }

        $queuedAt = $loans[0]->queued_at?->toDateTimeString();
        foreach ($loans as $index => $loan) {
            $this->assertSame('antrian', $loan->status);
            $this->assertSame($queuedAt, $loan->queued_at?->toDateTimeString());
            $this->assertSame($index + 1, $this->queue->getQueuePosition($loan));
        }

        $this->assertTrue($loans[0]->id < $loans[1]->id);
        $this->assertSame(
            collect($loans)->pluck('id')->all(),
            $this->queue->queuedLoansForEquipment($alat->id)->pluck('id')->all(),
        );
    }

    public function test_returning_one_equipment_does_not_touch_other_equipment_queue(): void
    {
        $multimeter = $this->makeEquipment(10, 'Multimeter');
        $solder = $this->makeEquipment(5, 'Solder');

        $loanMeterA = $this->submitPribadi($this->makeSiswa('ma'), $multimeter, 10);
        $loanMeterB = $this->submitPribadi($this->makeSiswa('mb'), $multimeter, 5);
        $loanSolderA = $this->submitPribadi($this->makeSiswa('sa'), $solder, 5);
        $loanSolderB = $this->submitPribadi($this->makeSiswa('sb'), $solder, 3);

        $this->approve($loanMeterA);
        $this->borrow($loanMeterA);
        $this->approve($loanSolderA);
        $this->borrow($loanSolderA);

        $this->assertSame('antrian', $loanMeterB->fresh()->status);
        $this->assertSame('antrian', $loanSolderB->fresh()->status);

        $this->completeReturn($loanMeterA);

        $this->assertSame('diminta', $loanMeterB->fresh()->status);
        $this->assertSame('antrian', $loanSolderB->fresh()->status);
        $this->assertSame('dipinjam', $loanSolderA->fresh()->status);
        $this->assertSame(1, $this->queue->getQueuePosition($loanSolderB->fresh()));
        $this->assertEquipment($multimeter, available: 10, remaining: 5, capacity: 10);
        $this->assertEquipment($solder, available: 0, remaining: 0, capacity: 5);
    }

    public function test_multi_item_loan_still_occupies_all_items_until_loan_finishes(): void
    {
        $multimeter = $this->makeEquipment(5, 'Multimeter');
        $solder = $this->makeEquipment(5, 'Solder');

        $loanA = $this->submitPribadi($this->makeSiswa('a'), [
            ['equipment_id' => $multimeter->id, 'quantity' => 5],
            ['equipment_id' => $solder->id, 'quantity' => 5],
        ]);
        $loanB = $this->submitPribadi($this->makeSiswa('b'), $multimeter, 5);

        $this->assertSame('diminta', $loanA->status);
        $this->assertSame('antrian', $loanB->status);

        $this->approve($loanA);
        $this->borrow($loanA);

        $this->assertSame('dipinjam', $loanA->fresh()->status);
        $this->assertSame('antrian', $loanB->fresh()->status);
        $this->assertEquipment($multimeter, available: 0, remaining: 0, capacity: 5);
        $this->assertEquipment($solder, available: 0, remaining: 0, capacity: 5);

        $multimeter->increment('available', 5);
        $this->queue->processQueueForEquipment($multimeter->id);

        $this->assertSame('antrian', $loanB->fresh()->status);
        $this->assertSame('dipinjam', $loanA->fresh()->status);
        $this->assertSame(0, $this->remaining($multimeter->fresh()));

        $multimeter->decrement('available', 5);
        $this->completeReturn($loanA);

        $this->assertSame('dikembalikan', $loanA->fresh()->status);
        $this->assertSame('diminta', $loanB->fresh()->status);
        $this->assertEquipment($multimeter, available: 5, remaining: 0, capacity: 5);
        $this->assertEquipment($solder, available: 5, remaining: 5, capacity: 5);
    }

    public function test_process_queue_is_idempotent(): void
    {
        $alat = $this->makeEquipment(8);
        $loanA = $this->submitPribadi($this->makeSiswa('a'), $alat, 10);
        $loanB = $this->submitPribadi($this->makeSiswa('b'), $alat, 2);
        $loanC = $this->submitPribadi($this->makeSiswa('c'), $alat, 2);

        $snapshot = $this->queueSnapshot($alat, $loanA, $loanB, $loanC);

        $this->queue->processQueueForEquipment($alat->id);
        $this->queue->processQueueForEquipment($alat->id);
        $this->queue->processQueueForEquipment($alat->id);

        $this->assertSame($snapshot, $this->queueSnapshot($alat, $loanA, $loanB, $loanC));
    }

    public function test_azka_cannot_skip_queue_after_lomba_preempts_santi_during_praktikum(): void
    {
        $this->travelTo(Carbon::parse('2026-09-14 08:00:00'));
        $state = $this->submitDemoThroughAzki();
        $this->assertAzkaJoinsQueueBehindSantiAndMisbah($state, Carbon::parse('2026-09-14 08:00:00'));
    }

    public function test_azka_cannot_skip_queue_after_lomba_preempts_santi_once_praktikum_ended(): void
    {
        $this->travelTo(Carbon::parse('2026-09-14 08:00:00'));
        $state = $this->submitDemoThroughAzki();
        $this->assertAzkaJoinsQueueBehindSantiAndMisbah($state, Carbon::parse('2026-09-14 10:00:00'));
    }

    public function test_approve_does_not_create_second_diminta_when_stock_is_exhausted(): void
    {
        $alat = $this->makeEquipment(10);
        $loanA = $this->submitPribadi($this->makeSiswa('a'), $alat, 10);
        $loanB = $this->submitPribadi($this->makeSiswa('b'), $alat, 10);

        $this->assertSame('diminta', $loanA->status);
        $this->assertSame('antrian', $loanB->status);

        $this->approve($loanA);
        $this->borrow($loanA);

        $this->assertSame('dipinjam', $loanA->fresh()->status);
        $this->assertSame('antrian', $loanB->fresh()->status);
        $this->assertSame(1, $this->queue->getQueuePosition($loanB->fresh()));
        $this->assertEquipment($alat, available: 0, remaining: 0, capacity: 10);

        $this->queue->processQueueForEquipment($alat->id);

        $this->assertSame('antrian', $loanB->fresh()->status);
        $this->assertEquipment($alat, available: 0, remaining: 0, capacity: 10);
    }

    /**
     * Urutan demo: Patma 6 praktik → Santi 14 → Misbah 1 antrian → Azki lomba 1
     * menggusur Santi. Sisa toolset dikunci karena kepala antrian Santi butuh 14.
     *
     * @return array{alat: Equipment, bahan: Equipment, patma: Loan, santi: Loan, misbah: Loan, azki: Loan}
     */
    private function submitDemoThroughAzki(): array
    {
        $guru = $this->makeUser('guru', 'guru-demo-'.Str::lower(Str::random(4)));
        $alat = $this->makeEquipment(20, 'Toolset');
        $bahan = $this->makeEquipment(100, 'Solder');
        $bahan->update(['item_type' => 'bahan', 'unit' => 'pcs']);
        $schedule = $this->makeWeeklySchedule($guru, 'senin', '07:00:00', '09:30:00');

        $patmaLoan = $this->submitPraktikum($this->makeSiswa('patma'), $guru, $schedule, $alat, 6);
        $this->assertSame('diminta', $patmaLoan->status);
        $this->travel(1)->seconds();

        $santiLoan = $this->submitPribadi($this->makeSiswa('santi'), $alat, 14);
        $this->assertSame('diminta', $santiLoan->status);
        $this->travel(1)->seconds();

        $misbahLoan = $this->submitPribadi($this->makeSiswa('misbah'), $alat, 1);
        $this->assertSame('antrian', $misbahLoan->status);
        $this->assertSame(1, $this->queue->getQueuePosition($misbahLoan));
        $this->travel(1)->seconds();

        $azkiLoan = $this->submitLomba($this->makeSiswa('azki'), $alat, 1);
        $this->assertSame('diminta', $azkiLoan->fresh()->status);
        $this->assertSame('diminta', $patmaLoan->fresh()->status);
        $this->assertSame('antrian', $santiLoan->fresh()->status);
        $this->assertSame('antrian', $misbahLoan->fresh()->status);
        $this->assertSame(1, $this->queue->getQueuePosition($santiLoan->fresh()));
        $this->assertSame(2, $this->queue->getQueuePosition($misbahLoan->fresh()));

        return [
            'alat' => $alat,
            'bahan' => $bahan,
            'patma' => $patmaLoan,
            'santi' => $santiLoan,
            'misbah' => $misbahLoan,
            'azki' => $azkiLoan,
        ];
    }

    /**
     * @param  array{alat: Equipment, bahan: Equipment, patma: Loan, santi: Loan, misbah: Loan, azki: Loan}  $state
     */
    private function assertAzkaJoinsQueueBehindSantiAndMisbah(array $state, Carbon $azkaSubmitAt): void
    {
        $this->travelTo($azkaSubmitAt);

        $remainingBeforeAzka = $this->remaining($state['alat']);
        $this->assertGreaterThanOrEqual(
            3,
            $remainingBeforeAzka,
            'Sisa slot kelihatan cukup untuk Azka jika antrian di depan diabaikan.',
        );

        $azkaLoan = $this->submitProject($this->makeSiswa('azka'), $state['alat'], 3);

        $this->assertSame('diminta', $state['patma']->fresh()->status, 'Patmawati harus tetap menunggu persetujuan');
        $this->assertSame('diminta', $state['azki']->fresh()->status, 'Azki lomba harus tetap menunggu persetujuan');
        $this->assertSame('antrian', $state['santi']->fresh()->status, 'Santi harus tetap kepala antrian');
        $this->assertSame('antrian', $state['misbah']->fresh()->status, 'Misbah tidak boleh nyalip Santi');
        $this->assertSame('antrian', $azkaLoan->fresh()->status, 'Azka tidak boleh mengambil sisa sementara Santi belum dapat');
        $this->assertSame(1, $this->queue->getQueuePosition($state['santi']->fresh()));
        $this->assertSame(2, $this->queue->getQueuePosition($state['misbah']->fresh()));
        $this->assertSame(3, $this->queue->getQueuePosition($azkaLoan->fresh()));
        $this->assertEquipment($state['alat'], available: 20, remaining: $remainingBeforeAzka);
        $this->assertSame(100, (int) $state['bahan']->fresh()->available);
    }

    /**
     * @param  Equipment|array<int, array{equipment_id: int, quantity: int}>  $items
     */
    private function submitPribadi(User $siswa, Equipment|array $items, int $quantity = 1): Loan
    {
        $rows = $items instanceof Equipment
            ? [['equipment_id' => $items->id, 'quantity' => $quantity]]
            : $items;

        $this->actingAs($siswa)->post(route('siswa.loans.store'), [
            'item_type' => 'alat',
            'request_date' => '2026-09-14',
            'purpose' => 'Stress antrian',
            'notes' => 'Stress antrian',
            'borrow_scope' => 'lab',
            'borrow_reason' => 'lanjutan',
            'usage_room' => 'Ruang Assembly',
            'due_at' => '2026-09-14T17:00',
            'items' => $rows,
        ])->assertRedirect();

        return $this->latestLoan($siswa);
    }

    private function submitPraktikum(
        User $siswa,
        User $guru,
        PracticumSchedule $schedule,
        Equipment $alat,
        int $quantity,
    ): Loan {
        $this->actingAs($siswa)->post(route('siswa.loans.store'), [
            'supervisor_id' => $guru->id,
            'practicum_schedule_id' => $schedule->id,
            'item_type' => 'alat',
            'request_date' => '2026-09-14',
            'purpose' => 'Praktik',
            'notes' => 'Praktik',
            'borrow_scope' => 'lab',
            'borrow_reason' => 'reguler',
            'usage_room' => 'Ruang Assembly',
            'due_at' => '2026-09-14T09:30',
            'items' => [['equipment_id' => $alat->id, 'quantity' => $quantity]],
        ])->assertRedirect();

        return $this->latestLoan($siswa);
    }

    private function submitLomba(User $siswa, Equipment $alat, int $quantity): Loan
    {
        $this->actingAs($siswa)->post(route('siswa.loans.store'), [
            'item_type' => 'alat',
            'request_date' => '2026-09-14',
            'purpose' => 'Lomba',
            'notes' => 'Lomba',
            'borrow_scope' => 'bawa_pulang',
            'borrow_reason' => 'lomba',
            'collateral_agreed' => 1,
            'due_at' => '2026-09-15T17:00',
            'items' => [['equipment_id' => $alat->id, 'quantity' => $quantity]],
        ])->assertRedirect();

        return $this->latestLoan($siswa);
    }

    private function submitProject(User $siswa, Equipment $alat, int $quantity): Loan
    {
        $this->actingAs($siswa)->post(route('siswa.loans.store'), [
            'item_type' => 'alat',
            'request_date' => '2026-09-14',
            'purpose' => 'Project',
            'notes' => 'Project',
            'borrow_scope' => 'bawa_pulang',
            'borrow_reason' => 'lanjutan',
            'collateral_agreed' => 1,
            'due_at' => '2026-09-15T17:00',
            'items' => [['equipment_id' => $alat->id, 'quantity' => $quantity]],
        ])->assertRedirect();

        return $this->latestLoan($siswa);
    }

    private function approve(Loan $loan): void
    {
        $this->actingAs($this->admin)
            ->post(route('admin.loans.approve', $loan))
            ->assertRedirect()
            ->assertSessionHasNoErrors();
    }

    private function borrow(Loan $loan): void
    {
        $this->actingAs($this->admin)
            ->post(route('admin.loans.mark-borrowed', $loan))
            ->assertRedirect()
            ->assertSessionHasNoErrors();
    }

    private function inspectReturn(Loan $loan): void
    {
        $this->actingAs($this->admin)
            ->post(route('admin.loans.inspect', $loan), ['result' => 'lengkap'])
            ->assertRedirect()
            ->assertSessionHasNoErrors();
    }

    private function completeReturn(Loan $loan): void
    {
        $this->actingAs($this->admin)
            ->post(route('admin.loans.return', $loan), ['note' => 'Kembali'])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->inspectReturn($loan);
    }

    private function latestLoan(User $user): Loan
    {
        return Loan::query()
            ->where('borrower_id', $user->id)
            ->latest('id')
            ->firstOrFail()
            ->load(['items.equipment', 'borrower']);
    }

    private function remaining(Equipment $equipment): int
    {
        return $this->slots->remaining(
            $equipment->fresh(),
            Carbon::parse('2026-09-14 07:00:00'),
            Carbon::parse('2026-09-14 17:00:00'),
        );
    }

    private function assertEquipment(
        Equipment $equipment,
        int $available,
        int $remaining,
        int $capacity = 20,
    ): void {
        $equipment->refresh();

        $this->assertSame($capacity, (int) $equipment->stock, 'stock berubah');
        $this->assertSame($capacity, (int) $equipment->qty_baik, 'qty_baik berubah');
        $this->assertSame($available, (int) $equipment->available, 'available tidak sinkron');
        $this->assertGreaterThanOrEqual(0, (int) $equipment->available, 'available negatif');
        $this->assertSame($remaining, $this->remaining($equipment), 'sisa slot tidak sinkron');
    }

    /**
     * @return array{statuses: array<int, string>, positions: array<int, int|null>, available: int, remaining: int}
     */
    private function queueSnapshot(Equipment $equipment, Loan ...$loans): array
    {
        return [
            'statuses' => collect($loans)->map(fn (Loan $loan) => $loan->fresh()->status)->all(),
            'positions' => collect($loans)->map(
                fn (Loan $loan) => $this->queue->getQueuePosition($loan->fresh())
            )->all(),
            'available' => (int) $equipment->fresh()->available,
            'remaining' => $this->remaining($equipment),
        ];
    }

    private function makeSiswa(string $suffix): User
    {
        return $this->makeUser('siswa', 'siswa-'.$suffix.'-'.Str::lower(Str::random(4)));
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
            'nisn' => $role === 'siswa' ? '0077'.substr(md5($username), 0, 6) : null,
        ]);
    }

    private function makeEquipment(int $qtyBaik, string $name = 'Toolset RR'): Equipment
    {
        return Equipment::query()->create([
            'code' => 'ALAT-'.Str::upper(Str::random(4)),
            'name' => $name,
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
}
