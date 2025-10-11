<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MateriRekomendasi extends Model
{
    protected $table = 'materi_rekomendasi';
    protected $fillable = ['siswa_id', 'materi_id', 'alasan', 'status'];

    public function siswa()
    {
        return $this->belongsTo(User::class, 'siswa_id');
    }

    public function materi()
    {
        return $this->belongsTo(Materi::class);
    }
}
