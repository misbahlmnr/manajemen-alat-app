<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;

class Submission extends Model
{
    protected $fillable = [
        'code',
        'borrower_id',
        'borrower_class',
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

    /**
     * Tool loan statuses that block the whole submission (extension point).
     *
     * @return list<string>
     */
    public static function blockingToolStatuses(): array
    {
        return ['antrian'];
    }

    public function getRouteKeyName(): string
    {
        return 'code';
    }

    public function borrower(): BelongsTo
    {
        return $this->belongsTo(User::class, 'borrower_id');
    }

    public function borrowerClassLabel(): ?string
    {
        return filled($this->borrower_class)
            ? $this->borrower_class
            : $this->borrower?->class;
    }

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    public function loans(): HasMany
    {
        return $this->hasMany(Loan::class)->orderBy('item_type')->orderBy('id');
    }

    /**
     * Peer group members only (ketua = borrower_id, not in pivot).
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'submission_members', 'submission_id', 'student_id')
            ->withTimestamps();
    }

    public function alatLoan(): ?Loan
    {
        return $this->loansCollection()->firstWhere('item_type', 'alat');
    }

    public function bahanLoan(): ?Loan
    {
        return $this->loansCollection()->firstWhere('item_type', 'bahan');
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
            'borrower_class' => $borrower->class,
            'supervisor_id' => $payload['supervisor_id'] ?? null,
            'purpose' => $payload['purpose'] ?? $payload['notes'] ?? 'Pengajuan',
            'notes' => $payload['notes'] ?? null,
            'request_date' => $payload['request_date'] ?? now()->toDateString(),
        ]);
    }

    /**
     * True when any alat loan is in a blocking status (queue, future maintenance, etc.).
     */
    public function hasBlockingTool(): bool
    {
        return $this->loansCollection()
            ->contains(fn (Loan $loan) => $loan->item_type === 'alat'
                && in_array($loan->status, static::blockingToolStatuses(), true));
    }

    public function isCompleted(): bool
    {
        $loans = $this->loansCollection();

        return $loans->isNotEmpty()
            && $loans->every(fn (Loan $loan) => $this->loanIsFinishedForSubmission($loan));
    }

    public function isRejected(): bool
    {
        $loans = $this->loansCollection();

        return $loans->isNotEmpty()
            && $loans->every(fn (Loan $loan) => $loan->status === 'ditolak');
    }

    public function isCancelled(): bool
    {
        $loans = $this->loansCollection();

        return $loans->isNotEmpty()
            && $loans->every(fn (Loan $loan) => in_array($loan->status, ['dibatalkan', 'ditolak'], true));
    }

    /**
     * UI-only aggregate label. Must not drive workflow guards.
     */
    public function aggregateStatus(): string
    {
        $loans = $this->loansCollection();

        if ($loans->isEmpty()) {
            return 'diminta';
        }

        if ($this->hasBlockingTool()
            || $loans->contains(fn (Loan $loan) => $loan->status === 'antrian')) {
            return 'antrian';
        }

        if ($this->isCancelled() && ! $this->isRejected()) {
            return 'dibatalkan';
        }

        if ($this->isRejected()) {
            return 'dibatalkan';
        }

        if ($loans->every(fn (Loan $loan) => in_array($loan->status, ['dibatalkan', 'ditolak'], true))) {
            return 'dibatalkan';
        }

        if ($this->isCompleted()) {
            return 'selesai';
        }

        if ($loans->every(fn (Loan $loan) => $loan->status === 'diminta')) {
            return 'diminta';
        }

        return 'diproses';
    }

    public function statusSummary(): string
    {
        $loans = $this->loansCollection();
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
     * Filter submission list by aggregated progress status (UI / archive only).
     */
    public function scopeWhereAggregateStatus($query, string $status)
    {
        return match ($status) {
            'antrian' => $query->where(function ($q) {
                $q->whereHasBlockingTool()
                    ->orWhereHas('loans', fn ($l) => $l->where('status', 'antrian'));
            }),
            'diminta' => $query
                ->whereHas('loans')
                ->whereDoesntHave('loans', fn ($q) => $q->where('status', '!=', 'diminta')),
            'dibatalkan' => $query
                ->whereHas('loans')
                ->whereDoesntHave('loans', fn ($q) => $q->whereNotIn('status', ['dibatalkan', 'ditolak'])),
            'selesai' => $query
                ->whereHas('loans')
                ->whereDoesntHaveBlockingTool()
                ->whereDoesntHave('loans', fn ($q) => $q->where('status', 'antrian'))
                ->whereDoesntHave('loans', function ($q) {
                    $q->where(function ($inner) {
                        $inner->where(function ($alat) {
                            $alat->where('item_type', 'alat')
                                ->where('status', '!=', 'dikembalikan');
                        })->orWhere(function ($bahan) {
                            $bahan->where('item_type', 'bahan')
                                ->whereNotIn('status', ['diambil', 'dikembalikan']);
                        });
                    });
                }),
            'diproses' => $query
                ->whereHas('loans')
                ->whereDoesntHaveBlockingTool()
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
                                ->whereNotIn('status', ['diambil', 'dikembalikan', 'menunggu_alat']);
                        });
                    });
                }),
            default => $query,
        };
    }

    public function scopeWhereHasBlockingTool($query)
    {
        return $query->whereHas('loans', function ($q) {
            $q->where('item_type', 'alat')
                ->whereIn('status', static::blockingToolStatuses());
        });
    }

    public function scopeWhereDoesntHaveBlockingTool($query)
    {
        return $query->whereDoesntHave('loans', function ($q) {
            $q->where('item_type', 'alat')
                ->whereIn('status', static::blockingToolStatuses());
        });
    }

    public function scopeNeedsAdminAction($query)
    {
        return $query
            ->whereDoesntHaveBlockingTool()
            ->whereHas('loans', fn ($q) => $q->whereIn('status', [
                'diminta',
                'disetujui',
                'menunggu_inspeksi',
                'terlambat',
            ]));
    }

    /** Submission waiting for admin decision (not blocked by tool queue). */
    public function scopeNeedingApproval($query)
    {
        return $query
            ->whereDoesntHaveBlockingTool()
            ->whereHas('loans', fn ($q) => $q->where('status', 'diminta'));
    }

    /** Approved tools not yet handed over. */
    public function scopeNeedingHandover($query)
    {
        return $query->whereHas('loans', fn ($q) => $q->where('status', 'disetujui'));
    }

    /**
     * Barang di luar laboratorium (fase penggunaan):
     * alat dipinjam/terlambat, atau bahan-only yang sudah diambil.
     * Paket dengan alat sudah menunggu inspeksi / dikembalikan tidak ikut
     * hanya karena bahan masih berstatus diambil (hindari overlap tab Pengembalian).
     */
    public function scopeCurrentlyBorrowed($query)
    {
        return $query->where(function ($q) {
            $q->whereHas('loans', fn ($l) => $l->whereIn('status', [
                'dipinjam',
                'terlambat',
            ]))->orWhere(function ($bahanOnly) {
                $bahanOnly
                    ->whereHas('loans', fn ($l) => $l->where('item_type', 'bahan')->where('status', 'diambil'))
                    ->whereDoesntHave('loans', fn ($l) => $l->where('item_type', 'alat'));
            });
        });
    }

    /** Student requested return; awaiting inspection. */
    public function scopeNeedingReturnInspection($query)
    {
        return $query->whereHas('loans', fn ($q) => $q->where('status', 'menunggu_inspeksi'));
    }

    public function scopeInLoanQueue($query)
    {
        return $query->where(function ($q) {
            $q->whereHasBlockingTool()
                ->orWhereHas('loans', fn ($l) => $l->whereIn('status', [
                    'antrian',
                    'menunggu_alat',
                ]));
        });
    }

    public function scopeBookedOn($query, string $date)
    {
        return $query->whereDate('request_date', $date);
    }

    public function scopeOrderByAdminUrgency($query)
    {
        return $query->orderByRaw("
            (
                SELECT MIN(CASE
                    WHEN loans.status = 'terlambat' THEN 0
                    ELSE 1
                END)
                FROM loans
                WHERE loans.submission_id = submissions.id
            ) ASC
        ")->latest('id');
    }

    public function scopeOrderByLatestLoanActivity($query)
    {
        return $query->orderByRaw("
            (
                SELECT MAX(loans.updated_at)
                FROM loans
                WHERE loans.submission_id = submissions.id
            ) DESC
        ")->orderByDesc('submissions.id');
    }

    public function scopeOrderByLatestBorrowedAt($query)
    {
        return $query->orderByRaw("
            (
                SELECT MAX(loans.borrowed_at)
                FROM loans
                WHERE loans.submission_id = submissions.id
                  AND loans.status IN ('dipinjam', 'terlambat', 'diambil')
            ) DESC
        ")->orderByDesc('submissions.id');
    }

    private function loanIsFinishedForSubmission(Loan $loan): bool
    {
        if ($loan->item_type === 'bahan') {
            return in_array($loan->status, ['diambil', 'dikembalikan'], true);
        }

        return $loan->status === 'dikembalikan';
    }

    private function loanStatusLabelForSummary(Loan $loan): string
    {
        if ($loan->item_type === 'bahan') {
            return match ($loan->status) {
                'diambil' => 'Diambil',
                'dikembalikan' => 'Selesai',
                'menunggu_alat' => 'Menunggu Alat',
                default => config("lab.loan_statuses.{$loan->status}", $loan->status),
            };
        }

        return config("lab.loan_statuses.{$loan->status}", $loan->status);
    }

    /**
     * @return Collection<int, Loan>
     */
    private function loansCollection(): Collection
    {
        return $this->relationLoaded('loans') ? $this->loans : $this->loans()->get();
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
