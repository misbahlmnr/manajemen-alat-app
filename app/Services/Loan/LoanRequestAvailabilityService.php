<?php

namespace App\Services\Loan;

use App\Models\Equipment;
use App\Models\Loan;
use Illuminate\Http\Request;

/**
 * Facade ketersediaan pengajuan untuk siswa: alat (slot) vs bahan (request lock).
 */
class LoanRequestAvailabilityService
{
    public function __construct(
        private LoanSlotAvailabilityService $slots,
        private LoanMaterialAvailabilityService $materials,
    ) {}

    /**
     * Sisa yang masih bisa diajukan siswa untuk item katalog/form.
     *
     * @param  array<string, mixed>  $context
     */
    public function remainingForSubmit(
        Equipment $equipment,
        array $context = [],
        int|array|null $exceptLoanIds = null,
        bool $includePending = true,
    ): int {
        if ($equipment->item_type === 'bahan') {
            return $this->materials->remaining($equipment, $exceptLoanIds, $includePending);
        }

        return $this->slots->remainingForDraft($equipment, $context, $exceptLoanIds);
    }

    /**
     * Konteks slot katalog alat siswa (sama default halaman Ajukan / EquipmentController).
     *
     * @return array<string, mixed>
     */
    public function catalogSlotContext(?Request $request = null, ?string $requestDate = null): array
    {
        $request ??= request();
        $requestDate ??= now()->toDateString();

        $loanType = $request->string('loan_type')->toString() ?: 'praktikum';
        if (! in_array($loanType, ['praktikum', 'pribadi', 'bawa_pulang'], true)) {
            $loanType = 'praktikum';
        }

        $legacy = Loan::legacyFieldsForType($loanType);

        return [
            'item_type' => 'alat',
            'loan_type' => $loanType,
            'borrow_scope' => $legacy['borrow_scope'],
            'borrow_reason' => $legacy['borrow_reason'],
            'request_date' => $requestDate,
            'practicum_schedule_id' => $request->integer('practicum_schedule_id') ?: null,
            'due_at' => $request->input('due_at'),
        ];
    }

    public function availabilityLabel(Equipment $equipment, int $requestable): string
    {
        if ($equipment->status === 'tidak_tersedia') {
            return 'tidak_tersedia';
        }

        if ($equipment->qty_baik <= 0 && $equipment->qty_rusak_berat > 0) {
            return 'rusak';
        }

        if ($requestable <= 0) {
            return 'habis';
        }

        if ($requestable < (int) $equipment->qty_baik) {
            return 'dipinjam';
        }

        return 'tersedia';
    }

    public function slots(): LoanSlotAvailabilityService
    {
        return $this->slots;
    }

    public function materials(): LoanMaterialAvailabilityService
    {
        return $this->materials;
    }
}
