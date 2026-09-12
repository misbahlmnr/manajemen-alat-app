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

class LoanSlotStockTest extends TestCase
{
    use RefreshDatabase;

    public function test_pribadi_can_submit_leftover_after_class_uses_six(): void
    {
        $this->travelTo(Carbon::parse('2026-09-09 10:00:00'));

        $ketua = $this->makeUser('siswa', 'siswa-ketua');
        $pribadi = $this->makeUser('siswa', 'siswa-pribadi');
        $guru = $this->makeUser('guru', 'guru-sisa');
        $alat = $this->makeEquipment(20);
        $schedule = $this->makeWeeklySchedule($guru, 'senin', '07:00:00', '09:30:00');
        $monday = '2026-09-14';

        $this->actingAs($ketua)->post(route('siswa.loans.store'), [
            'supervisor_id' => $guru->id,
            'practicum_schedule_id' => $schedule->id,
            'item_type' => 'alat',
            'request_date' => $monday,
            'purpose' => 'Praktik XI TAV 1',
            'notes' => 'Praktik XI TAV 1',
            'borrow_scope' => 'lab',
            'borrow_reason' => 'reguler',
            'usage_room' => 'Ruang Assembly',
            'due_at' => $monday.'T09:30',
            'items' => [
                ['equipment_id' => $alat->id, 'quantity' => 6],
            ],
        ])->assertRedirect(route('siswa.loans.index', ['scope' => 'active']));

        $this->actingAs($pribadi)->post(route('siswa.loans.store'), [
            'item_type' => 'alat',
            'request_date' => $monday,
            'purpose' => 'Pribadi sisa stok',
            'notes' => 'Pribadi sisa stok',
            'borrow_scope' => 'lab',
            'borrow_reason' => 'lanjutan',
            'usage_room' => 'Ruang Assembly',
            'due_at' => $monday.'T17:00',
            'items' => [
                ['equipment_id' => $alat->id, 'quantity' => 14],
            ],
        ])->assertRedirect(route('siswa.loans.index', ['scope' => 'active']));

        $ketuaLoan = Loan::query()->where('borrower_id', $ketua->id)->latest('id')->first();
        $pribadiLoan = Loan::query()->where('borrower_id', $pribadi->id)->latest('id')->first();

        $this->assertSame('diminta', $ketuaLoan?->status);
        $this->assertSame('diminta', $pribadiLoan?->status);

        $this->actingAs($pribadi)->post(route('siswa.loans.store'), [
            'item_type' => 'alat',
            'request_date' => $monday,
            'purpose' => 'Pribadi kelebihan',
            'notes' => 'Pribadi kelebihan',
            'borrow_scope' => 'lab',
            'borrow_reason' => 'lanjutan',
            'usage_room' => 'Ruang Assembly',
            'due_at' => $monday.'T17:00',
            'items' => [
                ['equipment_id' => $alat->id, 'quantity' => 1],
            ],
        ])->assertRedirect(route('siswa.loans.index', ['scope' => 'active']));

        $overflow = Loan::query()->where('borrower_id', $pribadi->id)->latest('id')->first();
        $this->assertSame('antrian', $overflow?->status);
        $this->assertSame(20, (int) $alat->fresh()->available);
    }

    public function test_slot_availability_endpoint_returns_leftover(): void
    {
        $this->travelTo(Carbon::parse('2026-09-09 10:00:00'));

        $siswa = $this->makeUser('siswa', 'siswa-slot-api');
        $guru = $this->makeUser('guru', 'guru-slot-api');
        $alat = $this->makeEquipment(20);
        $schedule = $this->makeWeeklySchedule($guru, 'senin', '07:00:00', '09:30:00');
        $monday = '2026-09-14';

        $this->actingAs($siswa)->post(route('siswa.loans.store'), [
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
            'items' => [
                ['equipment_id' => $alat->id, 'quantity' => 6],
            ],
        ])->assertRedirect();

        $this->actingAs($siswa)
            ->getJson(route('siswa.loans.slot-availability', [
                'item_type' => 'alat',
                'request_date' => $monday,
                'borrow_scope' => 'lab',
                'borrow_reason' => 'lanjutan',
                'equipment_ids' => [$alat->id],
            ]))
            ->assertOk()
            ->assertJsonPath('remaining.'.$alat->id, 14);
    }

    public function test_loan_detail_exposes_category_booking_date_and_slot(): void
    {
        $this->travelTo(Carbon::parse('2026-09-09 10:00:00'));

        $siswa = $this->makeUser('siswa', 'siswa-detail-slot');
        $admin = $this->makeUser('admin', 'admin-detail-slot');
        $guru = $this->makeUser('guru', 'guru-detail-slot');
        $alat = $this->makeEquipment(20);
        $schedule = $this->makeWeeklySchedule($guru, 'senin', '07:00:00', '09:30:00');
        $monday = '2026-09-14';

        $this->actingAs($siswa)->post(route('siswa.loans.store'), [
            'supervisor_id' => $guru->id,
            'practicum_schedule_id' => $schedule->id,
            'item_type' => 'alat',
            'request_date' => $monday,
            'purpose' => 'Praktik detail',
            'notes' => 'Praktik detail',
            'borrow_scope' => 'lab',
            'borrow_reason' => 'reguler',
            'usage_room' => 'Ruang Assembly',
            'due_at' => $monday.'T09:30',
            'items' => [
                ['equipment_id' => $alat->id, 'quantity' => 6],
            ],
        ])->assertRedirect();

        $loan = Loan::query()->where('borrower_id', $siswa->id)->latest('id')->first();
        $this->assertNotNull($loan);

        $this->actingAs($siswa)
            ->get(route('siswa.loans.show', $loan))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('loan.queue_type_label', 'Praktik lab')
                ->where('loan.slot_label', '07:00–09:30')
                ->where('loan.request_date', $monday)
            );

        $this->actingAs($admin)
            ->get(route('admin.loans.show', $loan))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('loan.queue_type_label', 'Praktik lab')
                ->where('loan.slot_label', '07:00–09:30')
                ->where('loan.request_date', $monday)
            );
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
            'nisn' => $role === 'siswa' ? '0055'.substr(md5($username), 0, 6) : null,
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
