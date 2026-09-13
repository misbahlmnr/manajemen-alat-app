<?php

namespace Tests\Feature\Admin;

use App\Models\AngkatanOption;
use App\Models\ClassOption;
use App\Models\PracticumSchedule;
use App\Models\User;
use App\Support\AcademicYear;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClassOptionTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_add_and_delete_unused_class_option(): void
    {
        $admin = $this->makeAdmin();

        $this->actingAs($admin)->post(route('admin.users.class-options.store'), [
            'name' => 'XI TAV 4',
        ])->assertRedirect();

        $this->assertDatabaseHas('class_options', ['name' => 'XI TAV 4']);

        $option = ClassOption::query()->where('name', 'XI TAV 4')->first();

        $this->actingAs($admin)->delete(
            route('admin.users.class-options.destroy', $option),
        )->assertRedirect();

        $this->assertDatabaseMissing('class_options', ['name' => 'XI TAV 4']);
    }

    public function test_admin_cannot_delete_class_option_in_use(): void
    {
        $admin = $this->makeAdmin();
        $option = ClassOption::query()->where('name', 'XI TAV 1')->first();
        $this->assertNotNull($option);

        User::query()->create([
            'name' => 'Siswa Pakai',
            'username' => 'siswa-pakai',
            'email' => 'siswa-pakai@test.local',
            'password' => 'password',
            'role' => 'siswa',
            'status' => 'active',
            'class' => 'XI TAV 1',
            'nisn' => '0099000001',
        ]);

        $this->actingAs($admin)->delete(
            route('admin.users.class-options.destroy', $option),
        )->assertRedirect();

        $this->assertDatabaseHas('class_options', ['name' => 'XI TAV 1']);
    }

    public function test_admin_cannot_delete_class_option_used_by_schedule(): void
    {
        $admin = $this->makeAdmin();
        $guru = User::query()->create([
            'name' => 'Guru Jadwal',
            'username' => 'guru-jadwal',
            'email' => 'guru-jadwal@test.local',
            'password' => 'password',
            'role' => 'guru',
            'status' => 'active',
            'nip' => 'GRUTEST1',
        ]);

        PracticumSchedule::query()->create([
            'code' => 'JDW-OPT1',
            'title' => 'Praktik',
            'mata_kuliah' => 'DTE',
            'jurusan' => 'Audio Video',
            'kelas' => 'XII TAV 2',
            'type' => 'mingguan',
            'hari' => 'senin',
            'jam_mulai' => '07:00:00',
            'jam_selesai' => '09:30:00',
            'guru_id' => $guru->id,
            'priority' => 'normal',
        ]);

        $option = ClassOption::query()->where('name', 'XII TAV 2')->first();

        $this->actingAs($admin)->delete(
            route('admin.users.class-options.destroy', $option),
        )->assertRedirect();

        $this->assertDatabaseHas('class_options', ['name' => 'XII TAV 2']);
    }

    public function test_admin_can_add_and_delete_unused_angkatan(): void
    {
        $admin = $this->makeAdmin();

        $this->actingAs($admin)->post(route('admin.users.class-options.angkatan.store'), [
            'angkatan' => '2028/2029',
        ])->assertRedirect();

        $this->assertDatabaseHas('angkatan_options', ['name' => '2028/2029']);
        $this->assertContains('2028/2029', AcademicYear::names());

        $option = AngkatanOption::query()->where('name', '2028/2029')->first();

        $this->actingAs($admin)->delete(
            route('admin.users.class-options.angkatan.destroy', $option),
        )->assertRedirect();

        $this->assertDatabaseMissing('angkatan_options', ['name' => '2028/2029']);
    }

    public function test_admin_cannot_delete_angkatan_in_use(): void
    {
        $admin = $this->makeAdmin();
        $option = AngkatanOption::query()->where('name', '2025/2026')->first();
        $this->assertNotNull($option);

        User::query()->create([
            'name' => 'Siswa Angkatan',
            'username' => 'siswa-angkatan',
            'email' => 'siswa-angkatan@test.local',
            'password' => 'password',
            'role' => 'siswa',
            'status' => 'active',
            'class' => 'XI TAV 1',
            'angkatan' => '2025/2026',
            'nisn' => '0099000002',
        ]);

        $this->actingAs($admin)->delete(
            route('admin.users.class-options.angkatan.destroy', $option),
        )->assertRedirect();

        $this->assertDatabaseHas('angkatan_options', ['name' => '2025/2026']);
    }

    public function test_import_adds_new_angkatan_to_options(): void
    {
        AcademicYear::ensure('2030/2031');

        $this->assertDatabaseHas('angkatan_options', ['name' => '2030/2031']);
        $this->assertContains('2030/2031', AcademicYear::names());
    }

    public function test_admin_cannot_add_invalid_angkatan(): void
    {
        $admin = $this->makeAdmin();

        $this->actingAs($admin)
            ->from(route('admin.users.class-options'))
            ->post(route('admin.users.class-options.angkatan.store'), [
                'angkatan' => '2026/2028',
            ])
            ->assertRedirect()
            ->assertSessionHasErrors('angkatan');
    }

    private function makeAdmin(): User
    {
        return User::query()->create([
            'name' => 'Admin Test',
            'username' => 'admin-class',
            'email' => 'admin-class@test.local',
            'password' => 'password',
            'role' => 'admin',
            'status' => 'active',
            'nip' => 'ADMCLASS',
        ]);
    }
}
