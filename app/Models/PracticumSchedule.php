<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class PracticumSchedule extends Model
{
    protected $fillable = [
        'code',
        'title',
        'mata_kuliah',
        'jurusan',
        'kelas',
        'tanggal',
        'jam_mulai',
        'jam_selesai',
        'ruangan',
        'guru_id',
        'priority',
        'status',
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

    public function equipment(): BelongsToMany
    {
        return $this->belongsToMany(Equipment::class, 'practicum_schedule_equipment')
            ->withPivot('quantity')
            ->withTimestamps();
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

    public function resolveDisplayStatus(): string
    {
        if ($this->status !== 'aktif') {
            return $this->status;
        }

        $today = Carbon::today();
        $date = $this->tanggal->copy()->startOfDay();

        if ($date->lt($today)) {
            return 'selesai';
        }

        if ($date->gt($today)) {
            return 'terjadwal';
        }

        $start = Carbon::parse($this->tanggal->format('Y-m-d').' '.$this->formatTime($this->jam_mulai));
        $end = Carbon::parse($this->tanggal->format('Y-m-d').' '.$this->formatTime($this->jam_selesai));
        $now = Carbon::now();

        if ($now->between($start, $end)) {
            return 'berlangsung';
        }

        if ($now->lt($start)) {
            return 'terjadwal';
        }

        return 'selesai';
    }

    private function formatTime(string $time): string
    {
        return strlen($time) === 5 ? $time.':00' : $time;
    }
}
