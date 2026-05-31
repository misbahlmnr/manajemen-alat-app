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

    public function scopeBahan($query)
    {
        return $query->where('item_type', 'bahan');
    }

    public function scopeAvailability($query, string $value): void
    {
        if ($value === '' || $value === 'all') {
            return;
        }

        match ($value) {
            'nonaktif' => $query->where('status', 'inactive'),
            'habis' => $query->where('status', 'active')->where('available', '<=', 0),
            'rusak' => $query->where('status', 'active')->where('condition', 'rusak_berat'),
            'dipinjam' => $query->where('status', 'active')
                ->where('available', '>', 0)
                ->whereColumn('available', '<', 'stock'),
            'tersedia' => $query->where('status', 'active')
                ->where('available', '>', 0)
                ->where('condition', '!=', 'rusak_berat')
                ->whereColumn('available', '=', 'stock'),
            default => null,
        };
    }

    public function getIsLowStockAttribute(): bool
    {
        if ($this->item_type !== 'bahan' || $this->status !== 'active') {
            return false;
        }

        if ($this->min_stock === null) {
            return false;
        }

        return $this->available <= $this->min_stock;
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
