<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kelas extends Model
{
    protected $table = 'kelas';
    protected $fillable = ['nama', 'tingkat', 'wali_kelas_id'];

    public function waliKelas()
    {
        return $this->belongsTo(User::class, 'wali_kelas_id');
    }

    public function siswa()
    {
        return $this->hasMany(User::class, 'kelas_id');
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
}
