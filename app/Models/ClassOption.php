<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClassOption extends Model
{
    protected $fillable = [
        'name',
        'sort_order',
    ];

    public function isInUse(): bool
    {
        return User::query()->where('class', $this->name)->exists()
            || PracticumSchedule::query()->where('kelas', $this->name)->exists();
    }
}
