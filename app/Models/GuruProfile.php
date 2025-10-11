<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GuruProfile extends Model
{
    protected $table = 'guru_profiles';
    protected $fillable = [
        'user_id', 'nip', 'jenis_kelamin', 'tempat_lahir', 'tanggal_lahir',
        'alamat', 'no_hp', 'status_kepegawaian'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
