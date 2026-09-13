<?php

namespace Tests\Unit\Support;

use App\Support\AppClock;
use Carbon\Carbon;
use Tests\TestCase;

class AppClockTest extends TestCase
{
    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_empty_value_does_not_override(): void
    {
        $this->assertNull(AppClock::parse(null));
        $this->assertNull(AppClock::parse(''));
        $this->assertNull(AppClock::parse('   '));
    }

    public function test_invalid_value_does_not_override(): void
    {
        $this->assertNull(AppClock::parse('bukan-tanggal'));
    }

    public function test_datetime_is_parsed_in_app_timezone(): void
    {
        $parsed = AppClock::parse('2026-09-14 09:00:00');

        $this->assertNotNull($parsed);
        $this->assertTrue($parsed->isMonday());
        $this->assertSame('2026-09-14', $parsed->toDateString());
        $this->assertSame('09:00:00', $parsed->format('H:i:s'));
        $this->assertSame('Asia/Jakarta', $parsed->timezoneName);
    }

    public function test_share_payload_follows_fake_now_when_configured(): void
    {
        config(['lab.fake_now' => '2026-09-14 09:00:00']);
        Carbon::setTestNow(AppClock::parse('2026-09-14 09:00:00'));

        $share = AppClock::share();

        $this->assertTrue($share['is_fake']);
        $this->assertSame('2026-09-14', $share['today']);
        $this->assertStringContainsString('2026-09-14', $share['now']);
    }

    public function test_share_is_not_fake_when_env_empty(): void
    {
        config(['lab.fake_now' => null]);

        $this->assertFalse(AppClock::isActive());
        $this->assertFalse(AppClock::share()['is_fake']);
    }
}
