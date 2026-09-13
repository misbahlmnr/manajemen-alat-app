<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_forgot_password_page_shows_admin_help_without_email_form(): void
    {
        $this->get('/forgot-password')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Auth/ForgotPassword')
            );
    }

    public function test_forgot_password_post_does_not_send_reset_email(): void
    {
        Notification::fake();

        $user = User::factory()->create(['username' => 'reset-help']);

        $this->post('/forgot-password', ['email' => $user->email])
            ->assertRedirect(route('password.request'));

        Notification::assertNothingSent();
        Notification::assertNotSentTo($user, ResetPassword::class);
    }
}
