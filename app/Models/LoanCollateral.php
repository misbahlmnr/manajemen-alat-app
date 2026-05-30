<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoanCollateral extends Model
{
    protected $fillable = [
        'code',
        'loan_id',
        'student_id',
        'card_type',
        'card_number',
        'status',
        'held_at',
        'returned_at',
        'held_by_admin_id',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'held_at' => 'datetime',
            'returned_at' => 'datetime',
        ];
    }

    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function heldByAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'held_by_admin_id');
    }

    public static function generateCode(): string
    {
        $prefix = 'JAMINAN';

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
}
