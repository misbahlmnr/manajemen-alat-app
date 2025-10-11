<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdaptiveRule extends Model
{
    protected $table = 'adaptive_rules';
    protected $fillable = ['mapel_id', 'min_score', 'kategori_rekomendasi'];

    public function mapel()
    {
        return $this->belongsTo(Mapel::class);
    }
}
