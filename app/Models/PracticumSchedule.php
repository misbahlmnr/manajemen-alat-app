<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PracticumSchedule extends Model
{
    public const HARI_ORDER = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];

    protected $fillable = [
        'code',
        'title',
        'mata_kuliah',
        'jurusan',
        'kelas',
        'type',
        'hari',
        'tanggal',
        'jam_mulai',
        'jam_selesai',
        'ruangan',
        'guru_id',
        'priority',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
        ];
    }

    public function guru(): BelongsTo
    {
        return $this->belongsTo(User::class, 'guru_id');
    }

    public function isMingguan(): bool
    {
        return $this->type === 'mingguan';
    }

    public function isKhusus(): bool
    {
        return $this->type === 'khusus';
    }

    public function hariLabel(): ?string
    {
        if (! $this->hari) {
            return null;
        }

        return config("lab.schedule_days.{$this->hari}");
    }

    public function jadwalLabel(): string
    {
        if ($this->isMingguan()) {
            return 'Setiap '.($this->hariLabel() ?? '—');
        }

        return $this->tanggal?->translatedFormat('d M Y') ?? '—';
    }

    public function scopeVisibleInWeek(Builder $query, Carbon $weekStart, Carbon $weekEnd): Builder
    {
        $isoDays = collect(self::HARI_ORDER)
            ->filter(fn (string $hari) => self::weekContainsHari($weekStart, $weekEnd, $hari))
            ->values()
            ->all();

        return $query->where(function (Builder $q) use ($weekStart, $weekEnd, $isoDays) {
            $q->where(function (Builder $weekly) use ($isoDays) {
                $weekly->where('type', 'mingguan');
                if ($isoDays !== []) {
                    $weekly->whereIn('hari', $isoDays);
                }
            })->orWhere(function (Builder $special) use ($weekStart, $weekEnd) {
                $special->where('type', 'khusus')
                    ->whereBetween('tanggal', [$weekStart->toDateString(), $weekEnd->toDateString()]);
            });
        });
    }

    public function scopeForStudentSelection(Builder $query, bool $futureOnly = true): Builder
    {
        return $query->where(function (Builder $q) use ($futureOnly) {
            $q->where('type', 'mingguan');

            $q->orWhere(function (Builder $special) use ($futureOnly) {
                $special->where('type', 'khusus');

                if ($futureOnly) {
                    $special->whereDate('tanggal', '>=', now()->toDateString());
                } else {
                    $special->whereDate('tanggal', '>=', now()->subDays(60)->toDateString());
                }
            });
        });
    }

    public function scopeOrderByHari(Builder $query): Builder
    {
        $cases = collect(self::HARI_ORDER)
            ->map(fn (string $hari, int $index) => "WHEN '{$hari}' THEN ".($index + 1))
            ->implode(' ');

        return $query->orderByRaw("CASE hari {$cases} ELSE 99 END");
    }

    public static function generateCode(): string
    {
        $prefix = 'JADWAL';

        $last = static::query()
            ->where('code', 'like', $prefix.'-%')
            ->orderByDesc('id')
            ->value('code');

        $number = 1;
        if ($last && preg_match('/-(\d+)$/', $last, $matches)) {
            $number = (int) $matches[1] + 1;
        }

        return sprintf('%s-%04d', $prefix, $number);
    }

    private static function weekContainsHari(Carbon $weekStart, Carbon $weekEnd, string $hari): bool
    {
        $cursor = $weekStart->copy();
        while ($cursor->lte($weekEnd)) {
            if ((self::HARI_BY_ISO[$cursor->dayOfWeekIso] ?? null) === $hari) {
                return true;
            }
            $cursor->addDay();
        }

        return false;
    }

    private const HARI_BY_ISO = [
        1 => 'senin',
        2 => 'selasa',
        3 => 'rabu',
        4 => 'kamis',
        5 => 'jumat',
        6 => 'sabtu',
        7 => 'minggu',
    ];
}
