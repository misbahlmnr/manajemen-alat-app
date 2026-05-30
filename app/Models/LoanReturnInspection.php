<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoanReturnInspection extends Model
{
    protected $fillable = [
        'loan_id',
        'result',
        'notes',
        'missing_items',
        'damage_description',
        'checked_by_admin_id',
        'checked_at',
    ];

    protected function casts(): array
    {
        return [
            'checked_at' => 'datetime',
        ];
    }

    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class);
    }

    public function checkedByAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'checked_by_admin_id');
    }
}
