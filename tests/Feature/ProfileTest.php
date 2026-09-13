<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_page_is_displayed(): void
    {
        $user = User::factory()->create([
            'role' => 'guru',
            'nip' => 'GRU01',
            'username' => 'guru-profile',
        ]);

        $this->actingAs($user)->get('/profile')->assertOk();
    }

    public function test_staff_profile_information_can_be_updated(): void
    {
        $user = User::factory()->create([
            'role' => 'guru',
            'nip' => 'GRU01',
            'username' => 'guru-profile',
        ]);

        $this->actingAs($user)
            ->patch('/profile', [
                'name' => 'Test User',
                'email' => 'test@example.com',
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $user->refresh();

        $this->assertSame('Test User', $user->name);
        $this->assertSame('test@example.com', $user->email);
        $this->assertNull($user->email_verified_at);
    }

    public function test_email_verification_status_is_unchanged_when_the_email_address_is_unchanged(): void
    {
        $user = User::factory()->create([
            'role' => 'guru',
            'nip' => 'GRU01',
            'username' => 'guru-profile',
        ]);

        $this->actingAs($user)
            ->patch('/profile', [
                'name' => 'Test User',
                'email' => $user->email,
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $this->assertNotNull($user->refresh()->email_verified_at);
    }

    public function test_siswa_cannot_update_profile_information(): void
    {
        $siswa = User::factory()->create([
            'role' => 'siswa',
            'username' => 'siswa-profile',
            'class' => 'XI TAV 1',
            'angkatan' => '2025/2026',
            'nisn' => '0012345678',
        ]);

        $this->actingAs($siswa)
            ->patch('/profile', [
                'name' => 'Nama Diubah',
                'email' => 'baru@example.com',
            ])
            ->assertForbidden();

        $siswa->refresh();
        $this->assertNotSame('Nama Diubah', $siswa->name);
        $this->assertNotSame('baru@example.com', $siswa->email);
    }

    public function test_siswa_profile_shows_password_form_without_delete_account(): void
    {
        $siswa = User::factory()->create([
            'role' => 'siswa',
            'username' => 'siswa-profile',
            'class' => 'XI TAV 1',
            'angkatan' => '2025/2026',
            'nisn' => '0012345678',
        ]);

        $this->actingAs($siswa)
            ->get('/profile')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Profile/Edit')
            );
    }

    public function test_siswa_can_update_password(): void
    {
        $siswa = User::factory()->create([
            'role' => 'siswa',
            'username' => 'siswa-password',
            'class' => 'XI TAV 1',
            'angkatan' => '2025/2026',
            'nisn' => '0012345678',
        ]);

        $this->actingAs($siswa)
            ->from('/profile')
            ->put('/password', [
                'current_password' => 'password',
                'password' => 'new-password',
                'password_confirmation' => 'new-password',
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $this->assertTrue(Hash::check('new-password', $siswa->refresh()->password));
    }

    public function test_user_cannot_delete_their_account_from_profile(): void
    {
        $user = User::factory()->create([
            'role' => 'guru',
            'nip' => 'GRU01',
            'username' => 'guru-profile',
        ]);

        $this->actingAs($user)
            ->delete('/profile', [
                'password' => 'password',
            ])
            ->assertForbidden();

        $this->assertAuthenticated();
        $this->assertNotNull($user->fresh());
    }
}
