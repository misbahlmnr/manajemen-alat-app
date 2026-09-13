<?php

namespace App\Support;

use App\Models\ClassOption;
use Illuminate\Support\Facades\Schema;

class ClassOptions
{
    /**
     * @return list<string>
     */
    public static function names(): array
    {
        if (! Schema::hasTable('class_options')) {
            return array_values(config('lab.class_options', []));
        }

        $names = ClassOption::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->pluck('name')
            ->all();

        return $names !== []
            ? $names
            : array_values(config('lab.class_options', []));
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
        ], fn ($name) => filled($name))));
    }
}
