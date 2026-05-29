<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Equipment extends Model
{
    use HasFactory;

    protected $table = 'equipment';

    protected $fillable = [
        'code',
        'name',
        'category',
        'item_type',
        'stock',
        'available',
        'condition',
        'location',
        'description',
        'status',
        'unit',
        'min_stock',
    ];

    protected $appends = [
        'availability_label',
    ];

    protected function casts(): array
    {
        return [
            'stock' => 'integer',
            'available' => 'integer',
            'min_stock' => 'integer',
        ];
    }

    public function scopeAlat($query)
    {
        return $query->where('item_type', 'alat');
    }

    public function getAvailabilityLabelAttribute(): string
    {
        if ($this->status === 'inactive') {
            return 'nonaktif';
        }

        if ($this->available <= 0) {
            return 'habis';
        }

        if ($this->condition === 'rusak_berat') {
            return 'rusak';
        }

        if ($this->available < $this->stock) {
            return 'dipinjam';
        }

        return 'tersedia';
    }

    public static function generateCode(string $itemType = 'alat'): string
    {
        $prefix = $itemType === 'bahan' ? 'BAHAN' : 'ALAT';

        $last = static::query()
            ->where('item_type', $itemType)
            ->where('code', 'like', $prefix.'-%')
            ->orderByDesc('id')
            ->value('code');

        $number = 1;
        if ($last && preg_match('/-(\d+)$/', $last, $matches)) {
            $number = (int) $matches[1] + 1;
        }

        return sprintf('%s-%04d', $prefix, $number);
    }
}
