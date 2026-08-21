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

        // Prioritas: Antrian > Dibatalkan > Selesai > Menunggu > Diproses
        if ($loans->contains(fn (Loan $loan) => $loan->status === 'antrian')) {
            return 'antrian';
        }

        if ($loans->every(fn (Loan $loan) => in_array($loan->status, ['dibatalkan', 'ditolak'], true))) {
            return 'dibatalkan';
        }

        if ($loans->every(fn (Loan $loan) => $this->loanIsFinishedForSubmission($loan))) {
            return 'selesai';
        }

        if ($loans->every(fn (Loan $loan) => $loan->status === 'diminta')) {
            return 'diminta';
        }

        return 'diproses';
    }

    public function statusSummary(): string
    {
        /** @var Collection<int, Loan> $loans */
        $loans = $this->relationLoaded('loans') ? $this->loans : $this->loans()->get();

        $parts = [];

        foreach (['alat', 'bahan'] as $itemType) {
            $loan = $loans->firstWhere('item_type', $itemType);
            if (! $loan) {
                continue;
            }

            $label = $itemType === 'alat' ? 'Alat' : 'Bahan';
            $parts[] = "{$label}: {$this->loanStatusLabelForSummary($loan)}";
        }

        return implode(' · ', $parts);
    }

    /**
     * Filter submission list by aggregated progress status (not raw loan status).
     */
    public function scopeWhereAggregateStatus($query, string $status)
    {
        return match ($status) {
            'antrian' => $query->whereHas('loans', fn ($q) => $q->where('status', 'antrian')),
            'diminta' => $query
                ->whereHas('loans')
                ->whereDoesntHave('loans', fn ($q) => $q->where('status', '!=', 'diminta')),
            'dibatalkan' => $query
                ->whereHas('loans')
                ->whereDoesntHave('loans', fn ($q) => $q->whereNotIn('status', ['dibatalkan', 'ditolak'])),
            'selesai' => $query
                ->whereHas('loans')
                ->whereDoesntHave('loans', fn ($q) => $q->where('status', 'antrian'))
                ->whereDoesntHave('loans', function ($q) {
                    $q->where(function ($inner) {
                        $inner->where(function ($alat) {
                            $alat->where('item_type', 'alat')
                                ->where('status', '!=', 'dikembalikan');
                        })->orWhere(function ($bahan) {
                            $bahan->where('item_type', 'bahan')
                                ->whereNotIn('status', ['dipinjam', 'dikembalikan']);
                        });
                    });
                }),
            'diproses' => $query
                ->whereHas('loans')
                ->whereDoesntHave('loans', fn ($q) => $q->where('status', 'antrian'))
                ->whereHas('loans', fn ($q) => $q->where('status', '!=', 'diminta'))
                ->whereHas('loans', fn ($q) => $q->whereNotIn('status', ['dibatalkan', 'ditolak']))
                ->whereHas('loans', function ($q) {
                    $q->where(function ($inner) {
                        $inner->where(function ($alat) {
                            $alat->where('item_type', 'alat')
                                ->where('status', '!=', 'dikembalikan');
                        })->orWhere(function ($bahan) {
                            $bahan->where('item_type', 'bahan')
                                ->whereNotIn('status', ['dipinjam', 'dikembalikan']);
                        });
                    });
                }),
            default => $query,
        };
    }

    private function loanIsFinishedForSubmission(Loan $loan): bool
    {
        if ($loan->item_type === 'bahan') {
            return in_array($loan->status, ['dipinjam', 'dikembalikan'], true);
        }

        return $loan->status === 'dikembalikan';
    }

    private function loanStatusLabelForSummary(Loan $loan): string
    {
        if ($loan->item_type === 'bahan') {
            return match ($loan->status) {
                'dipinjam' => 'Diambil',
                'dikembalikan' => 'Selesai',
                default => config("lab.loan_statuses.{$loan->status}", $loan->status),
            };
        }

        return config("lab.loan_statuses.{$loan->status}", $loan->status);
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
