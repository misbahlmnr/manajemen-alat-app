<?php

namespace Tests\Feature\Loan;

use App\Models\Equipment;
use App\Models\Loan;
use App\Models\PracticumSchedule;
use App\Models\Submission;
use App\Models\User;
use App\Services\Loan\LoanWorkflowService;
use App\Services\Loan\LombaEventLoanService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class LombaEventMaterialsTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_store_with_alat_and_bahan_does_not_create_loan_before_activation(): void
    {
        [$admin, $guru, $ketua, $anggota, $alat, $bahan] = $this->seedActors();

        $this->actingAs($admin)
            ->post(route('admin.schedules.store'), $this->lombaPayload(
                $guru,
                $ketua,
                $anggota,
                items: [['equipment_id' => $alat->id, 'quantity' => 1]],
                bahanItems: [['equipment_id' => $bahan->id, 'quantity' => 2]],
            ))
            ->assertRedirect();

        $schedule = PracticumSchedule::query()->where('schedule_kind', 'lomba')->latest('id')->first();
        $this->assertNotNull($schedule);
        $this->assertSame(2, $schedule->equipmentItems()->count());
        $this->assertSame(0, Loan::query()->where('practicum_schedule_id', $schedule->id)->count());
        $this->assertSame(0, Submission::query()->where('borrower_id', $ketua->id)->count());
    }

    public function test_update_before_activation_changes_items_used_at_activation(): void
    {
        [$admin, $guru, $ketua, $anggota, $alat, $bahan] = $this->seedActors();
        $alat2 = $this->makeAlat('alat-2-'.uniqid());
        Carbon::setTestNow(Carbon::parse('2026-09-10 10:00:00', config('app.timezone')));

        $this->actingAs($admin)
            ->post(route('admin.schedules.store'), $this->lombaPayload(
                $guru,
                $ketua,
                $anggota,
                items: [['equipment_id' => $alat->id, 'quantity' => 1]],
            ))
            ->assertRedirect();

        $schedule = PracticumSchedule::query()->where('schedule_kind', 'lomba')->latest('id')->first();

        $this->actingAs($admin)
            ->put(route('admin.schedules.update', $schedule), $this->lombaPayload(
                $guru,
                $ketua,
                $anggota,
                items: [['equipment_id' => $alat2->id, 'quantity' => 1]],
                bahanItems: [['equipment_id' => $bahan->id, 'quantity' => 3]],
            ))
            ->assertRedirect();

        $this->assertSame(0, Loan::query()->where('practicum_schedule_id', $schedule->id)->count());

        Carbon::setTestNow(Carbon::parse('2026-09-21 17:00:00', config('app.timezone')));
        $this->artisan('lomba:activate-due')->assertSuccessful();

        $loans = Loan::query()->where('practicum_schedule_id', $schedule->id)->orderBy('item_type')->get();
        $this->assertCount(2, $loans);

        $alatLoan = $loans->firstWhere('item_type', 'alat');
        $bahanLoan = $loans->firstWhere('item_type', 'bahan');
        $this->assertNotNull($alatLoan);
        $this->assertNotNull($bahanLoan);
        $this->assertSame($alat2->id, $alatLoan->items()->value('equipment_id'));
        $this->assertSame($bahan->id, $bahanLoan->items()->value('equipment_id'));
        $this->assertSame(3, (int) $bahanLoan->items()->value('quantity'));
        $this->assertSame($alatLoan->loan_group_id, $bahanLoan->loan_group_id);
        $this->assertSame($alatLoan->submission_id, $bahanLoan->submission_id);
    }

    public function test_activation_alat_only_creates_one_alat_loan(): void
    {
        [, $guru, $ketua, $anggota, $alat] = $this->seedActors();
        Carbon::setTestNow(Carbon::parse('2026-09-21 17:00:00', config('app.timezone')));

        $schedule = $this->makeLombaEvent(
            $guru,
            $ketua,
            $anggota,
            alatItems: [['equipment_id' => $alat->id, 'quantity' => 1]],
        );

        app(LombaEventLoanService::class)->createLoanForEvent($schedule);

        $loans = Loan::query()->where('practicum_schedule_id', $schedule->id)->get();
        $this->assertCount(1, $loans);
        $this->assertSame('alat', $loans->first()->item_type);
        $this->assertSame(1, Submission::query()->where('borrower_id', $ketua->id)->count());
    }

    public function test_activation_bahan_only_creates_one_bahan_loan(): void
    {
        [, $guru, $ketua, $anggota, , $bahan] = $this->seedActors();
        Carbon::setTestNow(Carbon::parse('2026-09-21 17:00:00', config('app.timezone')));

        $schedule = $this->makeLombaEvent(
            $guru,
            $ketua,
            $anggota,
            bahanItems: [['equipment_id' => $bahan->id, 'quantity' => 2]],
        );

        app(LombaEventLoanService::class)->createLoanForEvent($schedule);

        $loans = Loan::query()->where('practicum_schedule_id', $schedule->id)->get();
        $this->assertCount(1, $loans);
        $this->assertSame('bahan', $loans->first()->item_type);
        $this->assertSame('lomba', $loans->first()->loan_type);
        $this->assertSame(1, Submission::query()->where('borrower_id', $ketua->id)->count());
    }

    public function test_activation_alat_and_bahan_creates_package(): void
    {
        [$admin, $guru, $ketua, $anggota, $alat, $bahan] = $this->seedActors();
        Carbon::setTestNow(Carbon::parse('2026-09-21 17:00:00', config('app.timezone')));

        $schedule = $this->makeLombaEvent(
            $guru,
            $ketua,
            $anggota,
            alatItems: [['equipment_id' => $alat->id, 'quantity' => 1]],
            bahanItems: [['equipment_id' => $bahan->id, 'quantity' => 2]],
        );

        app(LombaEventLoanService::class)->createLoanForEvent($schedule);

        $loans = Loan::query()->where('practicum_schedule_id', $schedule->id)->get();
        $this->assertCount(2, $loans);
        $this->assertSame(1, $loans->pluck('submission_id')->unique()->count());
        $this->assertSame(1, $loans->pluck('loan_group_id')->unique()->count());
        $this->assertTrue($loans->contains(fn (Loan $l) => $l->item_type === 'alat'));
        $this->assertTrue($loans->contains(fn (Loan $l) => $l->item_type === 'bahan'));

        $alatLoan = $loans->firstWhere('item_type', 'alat');
        app(LoanWorkflowService::class)->approve($alatLoan->fresh(), $admin);
        $this->assertSame('disetujui', $alatLoan->fresh()->status);
    }

    public function test_activation_fails_atomically_when_alat_stock_insufficient(): void
    {
        [, $guru, $ketua, $anggota, $alat, $bahan] = $this->seedActors();
        $alat->update(['available' => 0, 'qty_baik' => 0, 'stock' => 0]);
        Carbon::setTestNow(Carbon::parse('2026-09-21 17:00:00', config('app.timezone')));

        $schedule = $this->makeLombaEvent(
            $guru,
            $ketua,
            $anggota,
            alatItems: [['equipment_id' => $alat->id, 'quantity' => 1]],
            bahanItems: [['equipment_id' => $bahan->id, 'quantity' => 1]],
        );

        try {
            app(LombaEventLoanService::class)->createLoanForEvent($schedule);
            $this->fail('Expected ValidationException');
        } catch (ValidationException) {
            // expected
        }

        $this->assertSame(0, Loan::query()->where('practicum_schedule_id', $schedule->id)->count());
        $this->assertSame(0, Submission::query()->where('borrower_id', $ketua->id)->count());
    }

    /**
     * @return array{0: User, 1: User, 2: User, 3: User, 4: Equipment, 5: Equipment}
     */
    private function seedActors(): array
    {
        $admin = $this->makeUser('admin', 'admin-mat-'.uniqid());
        $guru = $this->makeUser('guru', 'guru-mat-'.uniqid());
        $ketua = $this->makeUser('siswa', 'ketua-mat-'.uniqid(), 'XI TAV 1');
        $anggota = $this->makeUser('siswa', 'anggota-mat-'.uniqid(), 'XI TAV 1');
        $alat = $this->makeAlat('alat-mat-'.uniqid());
        $bahan = $this->makeBahan('bahan-mat-'.uniqid());

        return [$admin, $guru, $ketua, $anggota, $alat, $bahan];
    }

    /**
     * @param  list<array{equipment_id: int, quantity: int}>  $alatItems
     * @param  list<array{equipment_id: int, quantity: int}>  $bahanItems
     */
    private function makeLombaEvent(
        User $guru,
        User $ketua,
        User $anggota,
        array $alatItems = [],
        array $bahanItems = [],
        string $tanggal = '2026-09-22',
    ): PracticumSchedule {
        $schedule = PracticumSchedule::query()->create([
            'code' => PracticumSchedule::generateCode(),
            'schedule_kind' => 'lomba',
            'title' => 'Lomba Bahan',
            'mata_kuliah' => 'Lomba Bahan',
            'jurusan' => config('lab.jurusan_default', 'Audio Video'),
            'kelas' => 'XI TAV 1',
            'type' => 'khusus',
            'hari' => null,
            'tanggal' => $tanggal,
            'jam_mulai' => '08:00',
            'jam_selesai' => '15:00',
            'ruangan' => null,
            'guru_id' => $guru->id,
            'penanggung_jawab_id' => $ketua->id,
            'priority' => 'lomba',
            'notes' => 'Tes bahan',
        ]);

        app(LombaEventLoanService::class)->syncEquipmentAndParticipants(
            $schedule,
            $alatItems,
            [$ketua->id, $anggota->id],
            $bahanItems,
        );

        return $schedule->fresh(['equipmentItems']);
    }

    /**
     * @param  list<array{equipment_id: int, quantity: int}>  $items
     * @param  list<array{equipment_id: int, quantity: int}>  $bahanItems
     * @return array<string, mixed>
     */
    private function lombaPayload(
        User $guru,
        User $ketua,
        User $anggota,
        array $items = [],
        array $bahanItems = [],
        string $tanggal = '2026-09-22',
        string $title = 'Lomba LKS',
    ): array {
        return [
            'schedule_kind' => 'lomba',
            'title' => $title,
            'mata_kuliah' => $title,
            'kelas' => 'XI TAV 1',
            'type' => 'khusus',
            'tanggal' => $tanggal,
            'jam_mulai' => '08:00',
            'jam_selesai' => '15:00',
            'guru_id' => $guru->id,
            'penanggung_jawab_id' => $ketua->id,
            'participant_ids' => [$ketua->id, $anggota->id],
            'items' => $items,
            'bahan_items' => $bahanItems,
            'priority' => 'lomba',
            'notes' => 'Event lomba',
        ];
    }

    private function makeAlat(string $suffix): Equipment
    {
        return Equipment::query()->create([
            'code' => 'EQ-'.$suffix,
            'name' => 'Alat '.$suffix,
            'category' => 'Tools',
            'item_type' => 'alat',
            'stock' => 10,
            'available' => 10,
            'qty_baik' => 10,
            'qty_rusak_ringan' => 0,
            'qty_rusak_berat' => 0,
            'status' => 'tersedia',
            'unit' => 'pcs',
        ]);
    }

    private function makeBahan(string $suffix): Equipment
    {
        return Equipment::query()->create([
            'code' => 'BH-'.$suffix,
            'name' => 'Bahan '.$suffix,
            'category' => 'Tools',
            'item_type' => 'bahan',
            'stock' => 20,
            'available' => 20,
            'qty_baik' => 20,
            'qty_rusak_ringan' => 0,
            'qty_rusak_berat' => 0,
            'status' => 'tersedia',
            'unit' => 'pcs',
        ]);
    }

    private function makeUser(string $role, string $username, ?string $class = null): User
    {
        return User::query()->create([
            'name' => ucfirst($username),
            'username' => $username,
            'email' => $username.'@test.local',
            'password' => 'password',
            'role' => $role,
            'status' => 'active',
            'class' => $role === 'siswa' ? ($class ?? 'XI TAV 1') : null,
            'nip' => $role !== 'siswa' ? strtoupper(substr($username, 0, 16)) : null,
            'nisn' => $role === 'siswa' ? '0077'.substr(md5($username), 0, 6) : null,
        ]);
    }
}
