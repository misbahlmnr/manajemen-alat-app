<?php

namespace App\Services\Loan;

use App\Models\Equipment;
use App\Models\Loan;
use Illuminate\Support\Facades\DB;

/**
 * Ketersediaan bahan untuk pengajuan siswa (bukan stok gudang mentah).
 *
 * remaining = equipment.available − qty pengajuan pending yang belum di-deduct.
 * Pengajuan disetujui/diambil sudah tercermin di equipment.available lewat deductStock.
 */
class LoanMaterialAvailabilityService
{
    /** Pending: mengunci kuota pengajuan tanpa mengurangi available gudang. */
    public const PENDING_STATUSES = [
        'diminta',
        'antrian',
    ];

    public function remaining(
        Equipment $equipment,
        int|array|null $exceptLoanIds = null,
        bool $includePending = true,
    ): int {
        if ($equipment->item_type !== 'bahan') {
            return max(0, (int) $equipment->available);
        }

        $base = max(0, (int) $equipment->available);

        if (! $includePending) {
            return $base;
        }

        $pending = $this->pendingQuantity($equipment->id, $exceptLoanIds);

        return max(0, $base - $pending);
    }

    public function pendingQuantity(
        int $equipmentId,
        int|array|null $exceptLoanIds = null,
    ): int {
        $except = $this->normalizeExceptIds($exceptLoanIds);

        $query = Loan::query()
            ->where('item_type', 'bahan')
            ->whereIn('status', self::PENDING_STATUSES)
            ->where('stock_held', false)
            ->whereHas('items', fn ($q) => $q->where('equipment_id', $equipmentId))
            ->when($except !== [], fn ($q) => $q->whereNotIn('id', $except));

        return (int) DB::table('loan_items')
            ->where('equipment_id', $equipmentId)
            ->whereIn('loan_id', $query->select('loans.id'))
            ->sum('quantity');
    }

    public function hasShortage(
        Equipment $equipment,
        int $quantity,
        int|array|null $exceptLoanIds = null,
        bool $includePending = true,
    ): bool {
        return $this->remaining($equipment, $exceptLoanIds, $includePending) < $quantity;
    }

    /**
     * @return array<int, int>
     */
    private function normalizeExceptIds(int|array|null $exceptLoanIds): array
    {
        $ids = is_array($exceptLoanIds)
            ? $exceptLoanIds
            : ($exceptLoanIds !== null ? [$exceptLoanIds] : []);

        return array_values(array_unique(array_filter(array_map('intval', $ids))));
    }
}
