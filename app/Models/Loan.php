<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Loan extends Model
{
    public const LOAN_TYPES = ['praktikum', 'lomba', 'pribadi', 'bawa_pulang'];

    public const SLOT_OCCUPYING_STATUSES = [
        'diminta',
        'disetujui',
        'dipinjam',
        'terlambat',
        'menunggu_inspeksi',
    ];

    public const SLOT_FIRM_STATUSES = [
        'disetujui',
        'dipinjam',
        'terlambat',
        'menunggu_inspeksi',
    ];

    protected $fillable = [
        'code',
        'submission_id',
        'loan_group_id',
        'borrower_id',
        'borrower_class',
        'supervisor_id',
        'practicum_schedule_id',
        'item_type',
        'loan_type',
        'status',
        'queue_priority',
        'queued_at',
        'stock_held',
        'queue_priority_note',
        'queue_priority_set_by',
        'queue_priority_set_at',
        'request_date',
        'borrowed_at',
        'due_at',
        'returned_at',
        'purpose',
        'notes',
        'rejection_reason',
        'borrow_scope',
        'borrow_reason',
        'usage_room',
        'group_member_count',
    ];

    protected function casts(): array
    {
        return [
            'request_date' => 'date',
            'borrowed_at' => 'datetime',
            'due_at' => 'datetime',
            'returned_at' => 'datetime',
            'queued_at' => 'datetime',
            'stock_held' => 'boolean',
            'queue_priority_set_at' => 'datetime',
            'group_member_count' => 'integer',
        ];
    }

    /**
     * Map loan_type to legacy borrow_scope / borrow_reason for compatibility.
     *
     * @return array{borrow_scope: string, borrow_reason: string}
     */
    public static function legacyFieldsForType(string $loanType): array
    {
        return match ($loanType) {
            'bawa_pulang' => ['borrow_scope' => 'bawa_pulang', 'borrow_reason' => 'lanjutan'],
            'lomba' => ['borrow_scope' => 'bawa_pulang', 'borrow_reason' => 'lomba'],
            'pribadi' => ['borrow_scope' => 'lab', 'borrow_reason' => 'lanjutan'],
            default => ['borrow_scope' => 'lab', 'borrow_reason' => 'reguler'],
        };
    }

    public static function resolveTypeFromLegacy(?string $scope, ?string $reason): string
    {
        return match (true) {
            $scope === 'bawa_pulang' && $reason === 'lomba' => 'lomba',
            $scope === 'bawa_pulang' => 'bawa_pulang',
            $reason === 'lanjutan' => 'pribadi',
            default => 'praktikum',
        };
    }

    public function submission(): BelongsTo
    {
        return $this->belongsTo(Submission::class);
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

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(PracticumSchedule::class, 'practicum_schedule_id');
    }

    public function queuePrioritySetBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'queue_priority_set_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(LoanItem::class);
    }

    public function statusLogs(): HasMany
    {
        return $this->hasMany(LoanStatusLog::class)->orderBy('created_at');
    }

    public function collateral(): HasOne
    {
        return $this->hasOne(LoanCollateral::class);
    }

    public function inspection(): HasOne
    {
        return $this->hasOne(LoanReturnInspection::class);
    }

    public function compensation(): HasOne
    {
        return $this->hasOne(LoanCompensation::class);
    }

    public function resolvedLoanType(): string
    {
        if (filled($this->loan_type) && in_array($this->loan_type, self::LOAN_TYPES, true)) {
            return $this->loan_type;
        }

        return self::resolveTypeFromLegacy($this->borrow_scope, $this->borrow_reason);
    }

    public function isPraktikum(): bool
    {
        return $this->isAlat() && $this->resolvedLoanType() === 'praktikum';
    }

    public function isLomba(): bool
    {
        return $this->isAlat() && $this->resolvedLoanType() === 'lomba';
    }

    public function isPribadi(): bool
    {
        return $this->isAlat() && $this->resolvedLoanType() === 'pribadi';
    }

    public function isBawaPulang(): bool
    {
        return $this->isAlat() && $this->resolvedLoanType() === 'bawa_pulang';
    }

    public function allowsQueue(): bool
    {
        return $this->isPribadi();
    }

    public function requiresCollateral(): bool
    {
        return $this->isBawaPulang();
    }

    public function requiresReturnInspection(): bool
    {
        return $this->isAlat();
    }

    /** @deprecated Use isPribadi() */
    public function isCatchUp(): bool
    {
        return $this->isPribadi();
    }

    /** @deprecated Use isPraktikum() */
    public function isPakaiDiLab(): bool
    {
        return $this->isPraktikum();
    }

    /** @deprecated Use isLomba() */
    public function isBawaPulangLomba(): bool
    {
        return $this->isLomba();
    }

    public function queueTypeKey(): ?string
    {
        if (! $this->isAlat()) {
            return null;
        }

        return match ($this->resolvedLoanType()) {
            'lomba' => 'lomba',
            'praktikum' => 'praktikum',
            'pribadi' => 'pribadi',
            'bawa_pulang' => 'bawa_pulang',
            default => null,
        };
    }

    public function queueTypeLabel(): string
    {
        if (! $this->isAlat()) {
            return 'Bahan';
        }

        return config('lab.loan_types.'.$this->resolvedLoanType())
            ?? match ($this->resolvedLoanType()) {
                'lomba' => 'Lomba',
                'praktikum' => 'Praktik Lab',
                'pribadi' => 'Pribadi',
                'bawa_pulang' => 'Bawa pulang',
                default => 'Peminjaman',
            };
    }

    public function loanTypeLabel(): string
    {
        return $this->queueTypeLabel();
    }

    public function borrowReasonLabel(): ?string
    {
        return $this->loanTypeLabel();
    }

    public function borrowScopeLabel(): string
    {
        return $this->isBawaPulang() || $this->isLomba()
            ? 'Bawa pulang'
            : 'Praktik Lab';
    }

    public function borrowLocationLabel(): string
    {
        return $this->loanTypeLabel();
    }

    public static function generateCode(): string
    {
        $prefix = 'PINJAM';

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

    public function isAlat(): bool
    {
        return $this->item_type === 'alat';
    }

    public function isActivelyBorrowed(): bool
    {
        return $this->isAlat()
            && in_array($this->status, ['dipinjam', 'terlambat'], true);
    }

    public function isOverdue(): bool
    {
        if (! $this->isAlat()) {
            return false;
        }

        if ($this->status === 'terlambat') {
            return true;
        }

        return $this->status === 'dipinjam'
            && $this->due_at !== null
            && $this->due_at->isPast();
    }

    public function isQueued(): bool
    {
        return $this->status === 'antrian';
    }

    public function isPackaged(): bool
    {
        return filled($this->loan_group_id);
    }

    public function displayCode(): string
    {
        if ($this->relationLoaded('submission') && $this->submission) {
            return $this->submission->code;
        }

        if ($this->submission_id) {
            return $this->submission()->value('code') ?? $this->code;
        }

        return $this->code;
    }

    /**
     * @return \Illuminate\Database\Eloquent\Collection<int, Loan>
     */
    public function packageSiblings(bool $includeSelf = false)
    {
        if ($this->submission_id) {
            $query = static::query()->where('submission_id', $this->submission_id);
        } elseif (filled($this->loan_group_id)) {
            $query = static::query()->where('loan_group_id', $this->loan_group_id);
        } else {
            return static::query()->whereKey([])->get();
        }

        if (! $includeSelf) {
            $query->whereKeyNot($this->id);
        }

        return $query->orderBy('item_type')->orderBy('id')->get();
    }
}
