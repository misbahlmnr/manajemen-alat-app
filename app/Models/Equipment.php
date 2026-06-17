<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

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
        'qty_baik',
        'qty_rusak_ringan',
        'qty_rusak_berat',
        'location',
        'description',
        'image_path',
        'status',
        'unit',
        'min_stock',
    ];

    protected $appends = [
        'availability_label',
        'condition_breakdown',
        'primary_condition_label',
        'image_url',
    ];

    protected function casts(): array
    {
        return [
            'stock' => 'integer',
            'available' => 'integer',
            'qty_baik' => 'integer',
            'qty_rusak_ringan' => 'integer',
            'qty_rusak_berat' => 'integer',
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

    public function isAvailableForInventory(): bool
    {
        return $this->status === 'tersedia';
    }

    public function getStockLabelAttribute(): string
    {
        if ($this->item_type !== 'bahan') {
            return '';
        }

        if ($this->status === 'tidak_tersedia') {
            return 'tidak_tersedia';
        }

        if ($this->available <= 0) {
            return 'habis';
        }

        if ($this->is_low_stock) {
            return 'menipis';
        }

        return 'tersedia';
    }

    public function scopeStockStatus($query, string $value): void
    {
        if ($value === '' || $value === 'all') {
            return;
        }

        match ($value) {
            'tidak_tersedia', 'nonaktif' => $query->where('status', 'tidak_tersedia'),
            'habis' => $query->where('status', 'tersedia')->where('available', '<=', 0),
            'menipis' => $query->where('status', 'tersedia')
                ->where('available', '>', 0)
                ->whereNotNull('min_stock')
                ->whereColumn('available', '<=', 'min_stock'),
            'tersedia' => $query->where('status', 'tersedia')
                ->where('available', '>', 0)
                ->where(function ($q) {
                    $q->whereNull('min_stock')
                        ->orWhereColumn('available', '>', 'min_stock');
                }),
            default => null,
        };
    }

    public function scopeAvailability($query, string $value): void
    {
        if ($value === '' || $value === 'all') {
            return;
        }

        match ($value) {
            'tidak_tersedia', 'nonaktif' => $query->where('status', 'tidak_tersedia'),
            'habis' => $query->where('status', 'tersedia')->where('available', '<=', 0),
            'rusak' => $query->where('status', 'tersedia')
                ->where('qty_baik', '<=', 0)
                ->where('qty_rusak_berat', '>', 0),
            'dipinjam' => $query->where('status', 'tersedia')
                ->where('available', '>', 0)
                ->whereColumn('available', '<', 'qty_baik'),
            'tersedia' => $query->where('status', 'tersedia')
                ->where('available', '>', 0)
                ->where('qty_baik', '>', 0),
            default => null,
        };
    }

    public function scopeConditionFilter($query, string $value): void
    {
        if ($value === '' || $value === 'all') {
            return;
        }

        match ($value) {
            'baik' => $query->where('qty_baik', '>', 0),
            'rusak_ringan' => $query->where('qty_rusak_ringan', '>', 0),
            'rusak_berat' => $query->where('qty_rusak_berat', '>', 0),
            default => null,
        };
    }

    public function getIsLowStockAttribute(): bool
    {
        if ($this->item_type !== 'bahan' || $this->status !== 'tersedia') {
            return false;
        }

        if ($this->min_stock === null) {
            return false;
        }

        return $this->available <= $this->min_stock;
    }

    public function getAvailabilityLabelAttribute(): string
    {
        if ($this->status === 'tidak_tersedia') {
            return 'tidak_tersedia';
        }

        if ($this->available <= 0 || $this->qty_baik <= 0) {
            if ($this->qty_rusak_berat > 0 && $this->qty_baik <= 0) {
                return 'rusak';
            }

            return 'habis';
        }

        if ($this->available < $this->qty_baik) {
            return 'dipinjam';
        }

        return 'tersedia';
    }

    public function getConditionBreakdownAttribute(): array
    {
        return [
            'baik' => (int) $this->qty_baik,
            'rusak_ringan' => (int) $this->qty_rusak_ringan,
            'rusak_berat' => (int) $this->qty_rusak_berat,
        ];
    }

    public function getPrimaryConditionLabelAttribute(): string
    {
        $breakdown = $this->condition_breakdown;

        if ($breakdown['baik'] >= $breakdown['rusak_ringan'] && $breakdown['baik'] >= $breakdown['rusak_berat']) {
            return 'baik';
        }

        if ($breakdown['rusak_berat'] >= $breakdown['rusak_ringan']) {
            return 'rusak_berat';
        }

        return 'rusak_ringan';
    }

    protected function imageUrl(): Attribute
    {
        return Attribute::get(function (): ?string {
            if (! $this->image_path) {
                return null;
            }

            return Storage::disk('public')->url($this->image_path);
        });
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

    public function syncSupplyConditionQuantities(): void
    {
        if ($this->item_type !== 'bahan') {
            return;
        }

        $this->qty_baik = $this->stock;
        $this->qty_rusak_ringan = 0;
        $this->qty_rusak_berat = 0;
    }
}
