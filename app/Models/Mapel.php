<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Mapel extends Model
{
    protected $table = 'mapel';
    protected $fillable = ['nama', 'guru_id'];

    public function guru()
    {
        return $this->belongsTo(User::class, 'guru_id');
    }

    public function jadwal()
    {
        return $this->hasMany(Jadwal::class);
    }

    public function materi()
    {
        return $this->hasMany(Materi::class);
    }

    public function tugas()
    {
        return $this->hasMany(Tugas::class);
    }

    public function adaptiveRules()
    {
        return $this->hasMany(AdaptiveRule::class);
    }
}
