<?php

namespace Tests\Feature\Admin;

use App\Models\Equipment;
use App\Models\Loan;
use App\Models\PracticumSchedule;
use App\Models\User;
use App\Support\AcademicYear;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class PromoteAcademicYearTest extends TestCase
{
    use RefreshDatabase;

    public function test_preview_and_promote_moves_active_students_and_keeps_loan_snapshot(): void
    {
        $this->travelTo(Carbon::parse('2026-09-09 10:00:00'));

        $admin = $this->makeAdmin();
        $x = $this->makeStudent('siswa-x', 'X TE 1');
        $xi = $this->makeStudent('siswa-xi', 'XI TAV 1');
        $xii = $this->makeStudent('siswa-xii', 'XII TAV 1');
        $alat = $this->makeEquipment('alat', available: 5);

        $this->actingAs($x)->post(route('siswa.loans.store'), [
            'item_type' => 'alat',
            'request_date' => '2026-09-09',
            'purpose' => 'Pribadi',
            'notes' => 'Pribadi',
            'borrow_scope' => 'lab',
            'borrow_reason' => 'lanjutan',
            'usage_room' => 'Ruang Assembly',
            'due_at' => '2026-09-09T17:00',
            'items' => [
                ['equipment_id' => $alat->id, 'quantity' => 1],
            ],
        ])->assertRedirect(route('siswa.loans.index', ['scope' => 'active']));

        $loan = Loan::query()->where('borrower_id', $x->id)->latest('id')->first();
        $this->assertNotNull($loan);
        $this->assertSame('X TE 1', $loan->borrower_class);

        $schedule = PracticumSchedule::query()->create([
            'code' => 'JDW-PROM1',
            'title' => 'Praktik',
            'mata_kuliah' => 'DTE',
            'jurusan' => 'Audio Video',
            'kelas' => 'XII TAV 1',
            'type' => 'mingguan',
            'hari' => 'senin',
            'jam_mulai' => '07:00:00',
            'jam_selesai' => '09:30:00',
            'guru_id' => $this->makeGuru()->id,
            'priority' => 'normal',
        ]);

        $this->actingAs($admin)
            ->getJson(route('admin.users.promote-year'))
            ->assertOk()
            ->assertJsonPath('can_promote', true)
            ->assertJsonPath('totals.graduate', 1)
            ->assertJsonPath('totals.promote', 2)
            ->assertJsonPath('totals.blocked', 0);

        $this->actingAs($admin)
            ->get(route('admin.users.index', ['scope' => 'siswa']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/User/Index')
                ->where('scope', 'siswa')
                ->where('promotePreview.can_promote', true)
                ->where('promotePreview.totals.graduate', 1)
                ->where('promotePreview.totals.promote', 2)
            );

        $this->actingAs($admin)
            ->post(route('admin.users.promote-year.store'))
            ->assertRedirect(route('admin.users.index', ['scope' => 'siswa']))
            ->assertSessionHas('success');

        $this->assertSame('XI TAV 1', $x->fresh()->class);
        $this->assertSame('2026/2027', $x->fresh()->angkatan);
        $this->assertSame('active', $x->fresh()->status);
        $this->assertSame('XII TAV 1', $xi->fresh()->class);
        $this->assertSame('2025/2026', $xi->fresh()->angkatan);
        $this->assertSame('active', $xi->fresh()->status);
        $this->assertSame('XII TAV 1', $xii->fresh()->class);
        $this->assertSame('2024/2025', $xii->fresh()->angkatan);
        $this->assertSame('inactive', $xii->fresh()->status);
        $this->assertSame('X TE 1', $loan->fresh()->borrower_class);
        $this->assertSame('X TE 1', $loan->fresh()->borrowerClassLabel());
        $this->assertSame('X TE 1', $loan->submission->fresh()->borrower_class);
        $this->assertSame('XII TAV 1', $schedule->fresh()->kelas);
    }

    public function test_promote_is_rejected_when_target_class_option_is_missing(): void
    {
        $admin = $this->makeAdmin();
        $siswa = $this->makeStudent('siswa-x4', 'X TE 4');

        $this->actingAs($admin)
            ->getJson(route('admin.users.promote-year'))
            ->assertOk()
            ->assertJsonPath('can_promote', false)
            ->assertJsonPath('blocked.0.from', 'X TE 4')
            ->assertJsonPath('blocked.0.to', 'XI TAV 4');

        $this->actingAs($admin)
            ->from(route('admin.users.index', ['scope' => 'siswa']))
            ->post(route('admin.users.promote-year.store'))
            ->assertRedirect(route('admin.users.index', ['scope' => 'siswa']))
            ->assertSessionHas('error');

        $this->assertSame('X TE 4', $siswa->fresh()->class);
        $this->assertSame('active', $siswa->fresh()->status);
    }

    public function test_non_admin_cannot_promote_year(): void
    {
        $guru = $this->makeGuru();

        $this->actingAs($guru)
            ->getJson(route('admin.users.promote-year'))
            ->assertForbidden();

        $this->actingAs($guru)
            ->post(route('admin.users.promote-year.store'))
            ->assertForbidden();
    }

    private function makeAdmin(): User
    {
        return User::query()->create([
            'name' => 'Admin Promote',
            'username' => 'admin-promote',
            'email' => 'admin-promote@test.local',
            'password' => 'password',
            'role' => 'admin',
            'status' => 'active',
            'nip' => 'ADMPROMOTE',
        ]);
    }

    private function makeGuru(): User
    {
        return User::query()->create([
            'name' => 'Guru Promote',
            'username' => 'guru-promote-feat',
            'email' => 'guru-promote-feat@test.local',
            'password' => 'password',
            'role' => 'guru',
            'status' => 'active',
            'nip' => 'GRUPROMFEAT',
        ]);
    }

    private function makeStudent(string $username, string $class): User
    {
        return User::query()->create([
            'name' => ucfirst($username),
            'username' => $username,
            'email' => $username.'@test.local',
            'password' => 'password',
            'role' => 'siswa',
            'status' => 'active',
            'class' => $class,
            'angkatan' => AcademicYear::fromClass($class),
            'nisn' => '0088'.substr(md5($username), 0, 6),
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
