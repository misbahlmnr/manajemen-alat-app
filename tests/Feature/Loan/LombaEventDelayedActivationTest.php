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
use Tests\TestCase;

class LombaEventDelayedActivationTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_store_lomba_event_does_not_create_submission_or_loan(): void
    {
        [$admin, $guru, $ketua, $anggota, $alat] = $this->seedActors();

        $this->actingAs($admin)
            ->post(route('admin.schedules.store'), $this->lombaPayload(
                $guru,
                $ketua,
                $anggota,
                $alat,
                tanggal: '2026-09-22',
            ))
            ->assertRedirect();

        $schedule = PracticumSchedule::query()->where('schedule_kind', 'lomba')->latest('id')->first();
        $this->assertNotNull($schedule);
        $this->assertSame(0, Loan::query()->where('practicum_schedule_id', $schedule->id)->count());
        $this->assertSame(0, Submission::query()->where('borrower_id', $ketua->id)->count());
    }

    public function test_update_before_activation_does_not_create_loan(): void
    {
        [$admin, $guru, $ketua, $anggota, $alat] = $this->seedActors();
        Carbon::setTestNow(Carbon::parse('2026-09-10 10:00:00', config('app.timezone')));

        $this->actingAs($admin)
            ->post(route('admin.schedules.store'), $this->lombaPayload(
                $guru,
                $ketua,
                $anggota,
                $alat,
                tanggal: '2026-09-22',
            ))
            ->assertRedirect();

        $schedule = PracticumSchedule::query()->where('schedule_kind', 'lomba')->latest('id')->first();

        $this->actingAs($admin)
            ->put(route('admin.schedules.update', $schedule), $this->lombaPayload(
                $guru,
                $ketua,
                $anggota,
                $alat,
                tanggal: '2026-09-22',
                title: 'Lomba Updated',
            ))
            ->assertRedirect();

        $this->assertSame(0, Loan::query()->where('practicum_schedule_id', $schedule->id)->count());
    }

    public function test_activation_before_activation_time_creates_nothing(): void
    {
        [, $guru, $ketua, $anggota, $alat] = $this->seedActors();
        Carbon::setTestNow(Carbon::parse('2026-09-21 16:59:00', config('app.timezone')));

        $schedule = $this->makeLombaEvent($guru, $ketua, $anggota, $alat, '2026-09-22');

        $this->artisan('lomba:activate-due')->assertSuccessful();

        $this->assertSame(0, Loan::query()->where('practicum_schedule_id', $schedule->id)->count());
    }

    public function test_activation_after_activation_time_creates_one_submission_and_loan(): void
    {
        [$admin, $guru, $ketua, $anggota, $alat] = $this->seedActors();
        Carbon::setTestNow(Carbon::parse('2026-09-21 17:00:00', config('app.timezone')));

        $schedule = $this->makeLombaEvent($guru, $ketua, $anggota, $alat, '2026-09-22');

        $this->artisan('lomba:activate-due')->assertSuccessful();

        $loan = Loan::query()->where('practicum_schedule_id', $schedule->id)->first();
        $this->assertNotNull($loan);
        $this->assertSame('diminta', $loan->status);
        $this->assertSame('lomba', $loan->loan_type);
        $this->assertSame($ketua->id, $loan->borrower_id);
        $this->assertSame(1, Loan::query()->where('practicum_schedule_id', $schedule->id)->count());
        $this->assertSame(1, Submission::query()->where('borrower_id', $ketua->id)->count());

        $this->artisan('lomba:activate-due')->assertSuccessful();
        $this->assertSame(1, Loan::query()->where('practicum_schedule_id', $schedule->id)->count());

        app(LoanWorkflowService::class)->approve($loan->fresh(), $admin);
        $this->assertSame('disetujui', $loan->fresh()->status);
    }

    public function test_deleted_event_before_activation_is_not_activated(): void
    {
        [, $guru, $ketua, $anggota, $alat] = $this->seedActors();
        Carbon::setTestNow(Carbon::parse('2026-09-21 18:00:00', config('app.timezone')));

        $schedule = $this->makeLombaEvent($guru, $ketua, $anggota, $alat, '2026-09-22');
        $scheduleId = $schedule->id;
        $schedule->delete();

        $this->artisan('lomba:activate-due')->assertSuccessful();

        $this->assertSame(0, Loan::query()->where('practicum_schedule_id', $scheduleId)->count());
    }

    public function test_catch_up_activation_on_event_day_morning(): void
    {
        [, $guru, $ketua, $anggota, $alat] = $this->seedActors();
        // Missed H-1 17:00; run on event morning.
        Carbon::setTestNow(Carbon::parse('2026-09-22 08:00:00', config('app.timezone')));

        $schedule = $this->makeLombaEvent($guru, $ketua, $anggota, $alat, '2026-09-22');

        $this->artisan('lomba:activate-due')->assertSuccessful();

        $this->assertSame(1, Loan::query()->where('practicum_schedule_id', $schedule->id)->count());
        $this->assertSame('diminta', Loan::query()->where('practicum_schedule_id', $schedule->id)->value('status'));
    }

    /**
     * @return array{0: User, 1: User, 2: User, 3: User, 4: Equipment}
     */
    private function seedActors(): array
    {
        $admin = $this->makeUser('admin', 'admin-lomba-'.uniqid());
        $guru = $this->makeUser('guru', 'guru-lomba-'.uniqid());
        $ketua = $this->makeUser('siswa', 'ketua-lomba-'.uniqid(), 'XI TAV 1');
        $anggota = $this->makeUser('siswa', 'anggota-lomba-'.uniqid(), 'XI TAV 1');
        $alat = Equipment::query()->create([
            'code' => 'EQ-LOMBA-'.uniqid(),
            'name' => 'Alat Lomba',
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

        return [$admin, $guru, $ketua, $anggota, $alat];
    }

    private function makeLombaEvent(
        User $guru,
        User $ketua,
        User $anggota,
        Equipment $alat,
        string $tanggal,
    ): PracticumSchedule {
        $schedule = PracticumSchedule::query()->create([
            'code' => PracticumSchedule::generateCode(),
            'schedule_kind' => 'lomba',
            'title' => 'Lomba Tes',
            'mata_kuliah' => 'Lomba Tes',
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
            'notes' => 'Tes aktivasi',
        ]);

        app(LombaEventLoanService::class)->syncEquipmentAndParticipants(
            $schedule,
            [['equipment_id' => $alat->id, 'quantity' => 1]],
            [$ketua->id, $anggota->id],
        );

        return $schedule->fresh();
    }

    /**
     * @return array<string, mixed>
     */
    private function lombaPayload(
        User $guru,
        User $ketua,
        User $anggota,
        Equipment $alat,
        string $tanggal,
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
            'items' => [
                ['equipment_id' => $alat->id, 'quantity' => 1],
            ],
            'priority' => 'lomba',
            'notes' => 'Event lomba',
        ];
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
