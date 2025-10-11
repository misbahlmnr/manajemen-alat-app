<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Jadwal extends Model
{
    protected $table = 'jadwal';
    protected $fillable = ['kelas_id', 'mapel_id', 'guru_id', 'hari', 'jam_mulai', 'jam_selesai'];

    public function kelas()
    {
        return $this->belongsTo(Kelas::class);
    }

    public function mapel()
    {
        return $this->belongsTo(Mapel::class);
    }

    public function guru()
    {
        return $this->belongsTo(User::class, 'guru_id');
    }

    public function absensi()
    {
        return $this->hasMany(Absensi::class);
    }
}
