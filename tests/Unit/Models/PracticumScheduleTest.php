<?php

namespace Tests\Unit\Models;

use App\Models\PracticumSchedule;
use Carbon\Carbon;
use Tests\TestCase;

class PracticumScheduleTest extends TestCase
{
    public function test_weekly_friday_schedule_matches_jakarta_early_morning(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-09-10 17:30:00', 'UTC'));

        $schedule = new PracticumSchedule([
            'type' => 'mingguan',
            'hari' => 'jumat',
            'jam_mulai' => '00:00:00',
            'jam_selesai' => '23:00:00',
        ]);

        $this->assertTrue($schedule->matchesRequestDate(now()));
        $this->assertTrue($schedule->isActive());

        Carbon::setTestNow();
    }
}
