<?php

namespace App\Support;

use Carbon\Carbon;
use Throwable;

class AppClock
{
    public static function apply(): void
    {
        if (app()->runningUnitTests()) {
            return;
        }

        $parsed = self::parse(config('lab.fake_now'));

        if ($parsed instanceof Carbon) {
            Carbon::setTestNow($parsed);
        }
    }

    public static function isActive(): bool
    {
        return self::parse(config('lab.fake_now')) instanceof Carbon;
    }

    public static function parse(mixed $value): ?Carbon
    {
        if (! is_string($value)) {
            return null;
        }

        $value = trim($value);

        if ($value === '') {
            return null;
        }

        $timezone = (string) config('app.timezone', 'Asia/Jakarta');

        try {
            return Carbon::parse($value, $timezone);
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * @return array{now: string, today: string, is_fake: bool, label: string}
     */
    public static function share(): array
    {
        $now = now();

        return [
            'now' => $now->toIso8601String(),
            'today' => $now->toDateString(),
            'is_fake' => self::isActive(),
            'label' => $now->locale('id')->translatedFormat('l, d F Y H:i'),
        ];
    }
}
