<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;

class Submission extends Model
{
    protected $fillable = [
        'code',
        'borrower_id',
        'supervisor_id',
        'purpose',
        'notes',
        'request_date',
    ];

    protected function casts(): array
    {
        return [
            'request_date' => 'date',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'code';
    }

    public function borrower(): BelongsTo
    {
        return $this->belongsTo(User::class, 'borrower_id');
    }

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    public function loans(): HasMany
    {
        return $this->hasMany(Loan::class)->orderBy('item_type')->orderBy('id');
    }

    public function alatLoan(): ?Loan
    {
        return $this->loans->firstWhere('item_type', 'alat');
    }

    public function bahanLoan(): ?Loan
    {
        return $this->loans->firstWhere('item_type', 'bahan');
    }

    public static function generateCode(): string
    {
        $prefix = 'SUB';

        $last = static::query()
            ->where('code', 'like', $prefix.'-%')
            ->orderByDesc('id')
            ->value('code');

        $number = 1;
        if ($last && preg_match('/-(\d+)$/', $last, $matches)) {
            $number = (int) $matches[1] + 1;
        }

        return sprintf('%s-%04d', $prefix, $number);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public static function createForBorrower(User $borrower, array $payload): self
    {
        return static::query()->create([
            'code' => static::generateCode(),
            'borrower_id' => $borrower->id,
            'supervisor_id' => $payload['supervisor_id'] ?? null,
            'purpose' => $payload['purpose'] ?? $payload['notes'] ?? 'Pengajuan',
            'notes' => $payload['notes'] ?? null,
            'request_date' => $payload['request_date'] ?? now()->toDateString(),
        ]);
    }

    public function aggregateStatus(): string
    {
        /** @var Collection<int, Loan> $loans */
        $loans = $this->relationLoaded('loans') ? $this->loans : $this->loans()->get();

        if ($loans->isEmpty()) {
            return 'diminta';
        }

        // Bahan yang sudah diambil (dipinjam) dianggap selesai untuk status pengajuan,
        // karena bahan habis pakai tidak melalui pengembalian seperti alat.
        $effective = $loans->map(function (Loan $loan) {
            if ($loan->item_type === 'bahan' && $loan->status === 'dipinjam') {
                return 'dikembalikan';
            }

            return $loan->status;
        });

        $unique = $effective->unique()->values();
        if ($unique->count() === 1) {
            $status = (string) $unique->first();

            return $status === 'dikembalikan' ? 'selesai' : $status;
        }

        $open = ['diminta', 'antrian', 'disetujui', 'dipinjam', 'terlambat', 'menunggu_inspeksi'];
        if ($effective->contains(fn (string $status) => in_array($status, $open, true))) {
            return 'diproses';
        }

        foreach (['terlambat', 'dikembalikan', 'ditolak', 'dibatalkan'] as $status) {
            if ($effective->contains($status)) {
                return $status === 'dikembalikan' ? 'selesai' : $status;
            }
        }

        $fallback = (string) $unique->first();

        return $fallback === 'dikembalikan' ? 'selesai' : $fallback;
    }

    public function alatItemCount(): int
    {
        return (int) ($this->alatLoan()?->items?->count() ?? 0);
    }

    public function bahanItemCount(): int
    {
        return (int) ($this->bahanLoan()?->items?->count() ?? 0);
    }
}
