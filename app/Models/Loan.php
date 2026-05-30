<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Loan extends Model
{
    protected $fillable = [
        'code',
        'borrower_id',
        'supervisor_id',
        'practicum_schedule_id',
        'item_type',
        'status',
        'request_date',
        'borrowed_at',
        'due_at',
        'returned_at',
        'purpose',
        'notes',
        'rejection_reason',
        'borrow_scope',
    ];

    protected function casts(): array
    {
        return [
            'request_date' => 'date',
            'borrowed_at' => 'datetime',
            'due_at' => 'datetime',
            'returned_at' => 'datetime',
        ];
    }

    public function borrower(): BelongsTo
    {
        return $this->belongsTo(User::class, 'borrower_id');
    }

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(PracticumSchedule::class, 'practicum_schedule_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(LoanItem::class);
    }

    public function statusLogs(): HasMany
    {
        return $this->hasMany(LoanStatusLog::class)->orderBy('created_at');
    }

    public function collateral(): HasOne
    {
        return $this->hasOne(LoanCollateral::class);
    }

    public function inspection(): HasOne
    {
        return $this->hasOne(LoanReturnInspection::class);
    }

    public function compensation(): HasOne
    {
        return $this->hasOne(LoanCompensation::class);
    }

    public function requiresCollateral(): bool
    {
        return $this->isAlat() && $this->borrow_scope === 'bawa_pulang';
    }

    public static function generateCode(): string
    {
        $prefix = 'PINJAM';

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

    public function isAlat(): bool
    {
        return $this->item_type === 'alat';
    }
}
