<?php

namespace App\Support;

use App\Models\AngkatanOption;
use Illuminate\Support\Facades\Schema;

class AcademicYear
{
    public static function currentStart(): int
    {
        return (int) config('lab.academic_year.current_start', 2026);
    }

    public static function label(int $start): string
    {
        return $start.'/'.($start + 1);
    }

    public static function current(): string
    {
        return static::label(static::currentStart());
    }

    public static function isValid(?string $value): bool
    {
        if (! is_string($value) || ! preg_match('/^(\d{4})\/(\d{4})$/', $value, $matches)) {
            return false;
        }

        return (int) $matches[2] === ((int) $matches[1]) + 1;
    }

    /**
     * @return list<string>
     */
    public static function generated(): array
    {
        $start = static::currentStart();
        $years = [];

        for ($year = $start - 4; $year <= $start + 1; $year++) {
            $years[] = static::label($year);
        }

        return $years;
    }

    /**
     * @return list<string>
     */
    public static function names(): array
    {
        if (! Schema::hasTable('angkatan_options')) {
            return static::generated();
        }

        $names = AngkatanOption::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->pluck('name')
            ->all();

        return $names !== []
            ? $names
            : static::generated();
    }

    /**
     * @param  list<string|null>  $extra
     * @return list<string>
     */
    public static function namesAllowing(array $extra = []): array
    {
        return array_values(array_unique(array_filter([
            ...static::names(),
            ...$extra,
        ], fn ($name) => filled($name) && static::isValid((string) $name))));
    }

    /**
     * @return list<string>
     */
    public static function options(?string $current = null): array
    {
        return static::namesAllowing($current ? [$current] : []);
    }

    public static function fromClass(?string $class): string
    {
        $class = trim((string) $class);
        $start = static::currentStart();

        if ($class !== '' && preg_match('/^(XII|XI|X)\b/i', $class, $matches)) {
            $offset = match (strtoupper($matches[1])) {
                'XII' => 2,
                'XI' => 1,
                default => 0,
            };

            return static::label($start - $offset);
        }

        return static::current();
    }

    public static function ensure(string $label): void
    {
        $label = trim($label);

        if (! static::isValid($label) || ! Schema::hasTable('angkatan_options')) {
            return;
        }

        AngkatanOption::query()->firstOrCreate(
            ['name' => $label],
            ['sort_order' => (int) substr($label, 0, 4)],
        );
    }

    public static function assertValid(): \Closure
    {
        return function (string $attribute, mixed $value, \Closure $fail): void {
            if (! filled($value)) {
                return;
            }

            if (! static::isValid((string) $value)) {
                $fail('Format angkatan harus YYYY/YYYY, misalnya 2026/2027.');
            }
        };
    }
}
