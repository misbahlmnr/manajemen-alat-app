<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiswaProfile extends Model
{
    protected $table = 'siswa_profiles';
    protected $fillable = [
        'user_id', 'nis', 'nisn', 'jenis_kelamin', 'tempat_lahir', 'tanggal_lahir',
        'no_hp', 'angkatan', 'status', 'nama_ortu', 'kontak_ortu'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
