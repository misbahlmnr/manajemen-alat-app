<?php

namespace App\Services\Loan;

use App\Models\Equipment;

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

    public function slots(): LoanSlotAvailabilityService
    {
        return $this->slots;
    }

    public function materials(): LoanMaterialAvailabilityService
    {
        return $this->materials;
    }
}
