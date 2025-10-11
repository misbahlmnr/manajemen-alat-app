<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Materi extends Model
{
    protected $table = 'materi';
    protected $fillable = ['mapel_id', 'guru_id', 'kelas_id', 'judul', 'deskripsi', 'tingkat_kesulitan', 'file_path'];

    public function mapel()
    {
        return $this->belongsTo(Mapel::class);
    }

    public function guru()
    {
        return $this->belongsTo(User::class, 'guru_id');
    }

    public function kelas()
    {
        return $this->belongsTo(Kelas::class);
    }

    public function rekomendasi()
    {
        return $this->hasMany(MateriRekomendasi::class);
    }
}
