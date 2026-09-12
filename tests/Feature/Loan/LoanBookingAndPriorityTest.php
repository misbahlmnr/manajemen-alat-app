<?php

namespace Tests\Feature\Loan;

use App\Models\Equipment;
use App\Models\Loan;
use App\Models\PracticumSchedule;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class LoanBookingAndPriorityTest extends TestCase
{
    use RefreshDatabase;

    public function test_siswa_can_book_praktikum_on_matching_weekday_within_horizon(): void
    {
        $this->travelTo(Carbon::parse('2026-09-09 10:00:00'));

        $siswa = $this->makeUser('siswa', 'siswa-book');
        $guru = $this->makeUser('guru', 'guru-book');
        $alat = $this->makeEquipment('alat', available: 5);
        $schedule = $this->makeWeeklySchedule($guru, 'senin', '07:00:00', '09:30:00');
        $monday = '2026-09-14';

        $this->actingAs($siswa)->post(route('siswa.loans.store'), [
            'supervisor_id' => $guru->id,
            'practicum_schedule_id' => $schedule->id,
            'item_type' => 'alat',
            'request_date' => $monday,
            'purpose' => 'Praktik booking',
            'notes' => 'Praktik booking',
            'borrow_scope' => 'lab',
            'borrow_reason' => 'reguler',
            'usage_room' => 'Ruang Assembly',
            'due_at' => $monday.'T09:30',
            'items' => [
                ['equipment_id' => $alat->id, 'quantity' => 1],
            ],
        ])->assertRedirect(route('siswa.loans.index', ['scope' => 'active']));

        $loan = Loan::query()->where('borrower_id', $siswa->id)->latest('id')->first();
        $this->assertNotNull($loan);
        $this->assertSame($monday, $loan->request_date?->toDateString());
        $this->assertSame('reguler', $loan->borrow_reason);
        $this->assertSame($schedule->id, $loan->practicum_schedule_id);
    }

    public function test_booking_rejects_date_outside_horizon(): void
    {
        $this->travelTo(Carbon::parse('2026-09-09 10:00:00'));

        $siswa = $this->makeUser('siswa', 'siswa-horizon');
        $alat = $this->makeEquipment('alat', available: 5);

        $this->actingAs($siswa)->post(route('siswa.loans.store'), [
            'item_type' => 'alat',
            'request_date' => Carbon::parse('2026-09-09')->addDays(8)->toDateString(),
            'purpose' => 'Pribadi',
            'notes' => 'Pribadi',
            'borrow_scope' => 'lab',
            'borrow_reason' => 'lanjutan',
            'usage_room' => 'Ruang Assembly',
            'due_at' => Carbon::parse('2026-09-17')->setTime(17, 0)->format('Y-m-d\TH:i'),
            'items' => [
                ['equipment_id' => $alat->id, 'quantity' => 1],
            ],
        ])->assertSessionHasErrors('request_date');
    }

    public function test_praktikum_rejects_schedule_that_does_not_match_booking_date(): void
    {
        $this->travelTo(Carbon::parse('2026-09-09 10:00:00'));

        $siswa = $this->makeUser('siswa', 'siswa-mismatch');
        $guru = $this->makeUser('guru', 'guru-mismatch');
        $alat = $this->makeEquipment('alat', available: 5);
        $schedule = $this->makeWeeklySchedule($guru, 'senin', '07:00:00', '09:30:00');

        $this->actingAs($siswa)->post(route('siswa.loans.store'), [
            'supervisor_id' => $guru->id,
            'practicum_schedule_id' => $schedule->id,
            'item_type' => 'alat',
            'request_date' => '2026-09-10',
            'purpose' => 'Praktik',
            'notes' => 'Praktik',
            'borrow_scope' => 'lab',
            'borrow_reason' => 'reguler',
            'usage_room' => 'Ruang Assembly',
            'due_at' => '2026-09-10T09:30',
            'items' => [
                ['equipment_id' => $alat->id, 'quantity' => 1],
            ],
        ])->assertSessionHasErrors('request_date');
    }

    public function test_praktikum_today_rejects_schedule_that_already_ended(): void
    {
        $this->travelTo(Carbon::parse('2026-09-14 16:00:00'));

        $siswa = $this->makeUser('siswa', 'siswa-ended');
        $guru = $this->makeUser('guru', 'guru-ended');
        $alat = $this->makeEquipment('alat', available: 5);
        $schedule = $this->makeWeeklySchedule($guru, 'senin', '07:00:00', '09:30:00');

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
            'items' => [
                ['equipment_id' => $alat->id, 'quantity' => 1],
            ],
        ])->assertSessionHasErrors('practicum_schedule_id');
    }

    public function test_bawa_pulang_lomba_persists_borrow_reason(): void
    {
        $this->travelTo(Carbon::parse('2026-09-09 10:00:00'));

        $siswa = $this->makeUser('siswa', 'siswa-lomba');
        $alat = $this->makeEquipment('alat', available: 5);

        $this->actingAs($siswa)->post(route('siswa.loans.store'), [
            'item_type' => 'alat',
            'request_date' => '2026-09-09',
            'purpose' => 'Lomba speaker',
            'notes' => 'Lomba speaker',
            'borrow_scope' => 'bawa_pulang',
            'borrow_reason' => 'lomba',
            'collateral_agreed' => 1,
            'due_at' => '2026-09-10T17:00',
            'items' => [
                ['equipment_id' => $alat->id, 'quantity' => 1],
            ],
        ])->assertRedirect(route('siswa.loans.index', ['scope' => 'active']));

        $loan = Loan::query()->where('borrower_id', $siswa->id)->latest('id')->first();
        $this->assertSame('bawa_pulang', $loan->borrow_scope);
        $this->assertSame('lomba', $loan->borrow_reason);
        $this->assertSame('bawa_pulang_lomba', $loan->queueTypeKey());
    }

    private function makeWeeklySchedule(User $guru, string $hari, string $start, string $end): PracticumSchedule
    {
        return PracticumSchedule::query()->create([
            'code' => 'JDW-'.Str::upper(Str::random(4)),
            'title' => 'Praktik Booking',
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
}
