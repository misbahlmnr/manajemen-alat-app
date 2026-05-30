<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoanCompensation extends Model
{
    protected $fillable = [
        'loan_id',
        'required',
        'status',
        'amount',
        'description',
        'completed_at',
        'completed_by_admin_id',
    ];

    protected function casts(): array
    {
        return [
            'required' => 'boolean',
            'completed_at' => 'datetime',
        ];
    }

    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class);
    }

    public function completedByAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by_admin_id');
    }
}
