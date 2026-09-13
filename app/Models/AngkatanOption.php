<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AngkatanOption extends Model
{
    protected $fillable = [
        'name',
        'sort_order',
    ];

    public function isInUse(): bool
    {
        return User::query()->where('angkatan', $this->name)->exists();
    }
}
