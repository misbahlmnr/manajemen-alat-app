<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use App\Support\AcademicYear;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AngkatanAndUserScopeTest extends TestCase
{
    use RefreshDatabase;

    public function test_backfill_maps_existing_students_from_class(): void
    {
        $x = $this->makeStudent('siswa-x', 'X TE 1', angkatan: null);
        $xi = $this->makeStudent('siswa-xi', 'XI TAV 1', angkatan: null);
        $xii = $this->makeStudent('siswa-xii', 'XII TAV 1', angkatan: null);
        $guru = $this->makeGuru();

        User::query()
            ->where('role', 'siswa')
            ->whereNull('angkatan')
            ->get()
            ->each(fn (User $user) => $user->forceFill([
                'angkatan' => AcademicYear::fromClass($user->class),
            ])->saveQuietly());

        $this->assertSame('2026/2027', $x->fresh()->angkatan);
        $this->assertSame('2025/2026', $xi->fresh()->angkatan);
        $this->assertSame('2024/2025', $xii->fresh()->angkatan);
        $this->assertNull($guru->fresh()->angkatan);
    }

    public function test_index_without_scope_redirects_to_siswa(): void
    {
        $admin = $this->makeAdmin();

        $this->actingAs($admin)
            ->get(route('admin.users.index'))
            ->assertRedirect(route('admin.users.index', ['scope' => 'siswa']));
    }

    public function test_siswa_index_excludes_admin_and_guru(): void
    {
        $admin = $this->makeAdmin();
        $guru = $this->makeGuru();
        $siswa = $this->makeStudent('siswa-scope', 'XI TAV 1');

        $this->actingAs($admin)
            ->get(route('admin.users.index', ['scope' => 'siswa']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/User/Index')
                ->where('scope', 'siswa')
                ->has('users.data', 1)
                ->where('users.data.0.id', $siswa->id)
                ->where('users.data.0.angkatan', '2025/2026')
            );

        $this->actingAs($admin)
            ->get(route('admin.users.index', ['scope' => 'pengguna']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/User/Index')
                ->where('scope', 'pengguna')
                ->has('users.data', 2)
            );

        $this->assertDatabaseMissing('users', [
            'id' => $admin->id,
            'role' => 'staf',
        ]);
        $this->assertSame('admin', $admin->fresh()->role);
        $this->assertSame('guru', $guru->fresh()->role);
        $this->assertSame('siswa', $siswa->fresh()->role);
    }

    public function test_store_siswa_requires_angkatan(): void
    {
        $admin = $this->makeAdmin();

        $payload = [
            'name' => 'Siswa Baru',
            'email' => 'siswa-baru@test.local',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'siswa',
            'status' => 'active',
            'class' => 'X TE 1',
            'nisn' => '0099000099',
        ];

        $this->actingAs($admin)
            ->post(route('admin.users.store'), $payload)
            ->assertSessionHasErrors('angkatan');

        $this->actingAs($admin)
            ->post(route('admin.users.store'), [
                ...$payload,
                'angkatan' => '2026/2027',
            ])
            ->assertRedirect(route('admin.users.index', ['scope' => 'siswa']));

        $this->assertDatabaseHas('users', [
            'email' => 'siswa-baru@test.local',
            'role' => 'siswa',
            'angkatan' => '2026/2027',
            'class' => 'X TE 1',
        ]);
    }

    public function test_store_guru_does_not_set_angkatan(): void
    {
        $admin = $this->makeAdmin();

        $this->actingAs($admin)
            ->post(route('admin.users.store'), [
                'name' => 'Guru Baru',
                'email' => 'guru-baru@test.local',
                'password' => 'password',
                'password_confirmation' => 'password',
                'role' => 'guru',
                'status' => 'active',
                'nip' => 'GRUBARU01',
                'angkatan' => '2026/2027',
                'class' => 'X TE 1',
            ])
            ->assertRedirect(route('admin.users.index', ['scope' => 'pengguna']));

        $guru = User::query()->where('email', 'guru-baru@test.local')->first();
        $this->assertNotNull($guru);
        $this->assertSame('guru', $guru->role);
        $this->assertNull($guru->angkatan);
        $this->assertNull($guru->class);
    }

    private function makeAdmin(): User
    {
        return User::query()->create([
            'name' => 'Admin Scope',
            'username' => 'admin-scope',
            'email' => 'admin-scope@test.local',
            'password' => 'password',
            'role' => 'admin',
            'status' => 'active',
            'nip' => 'ADMSCOPE',
        ]);
    }

    private function makeGuru(): User
    {
        return User::query()->create([
            'name' => 'Guru Scope',
            'username' => 'guru-scope',
            'email' => 'guru-scope@test.local',
            'password' => 'password',
            'role' => 'guru',
            'status' => 'active',
            'nip' => 'GRUSCOPE',
        ]);
    }

    private function makeStudent(string $username, string $class, ?string $angkatan = 'auto'): User
    {
        return User::query()->create([
            'name' => ucfirst($username),
            'username' => $username,
            'email' => $username.'@test.local',
            'password' => 'password',
            'role' => 'siswa',
            'status' => 'active',
            'class' => $class,
            'angkatan' => $angkatan === 'auto' ? AcademicYear::fromClass($class) : $angkatan,
            'nisn' => '0088'.substr(md5($username), 0, 6),
        ]);
    }
}
