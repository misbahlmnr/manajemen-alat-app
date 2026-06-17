<?php

namespace App\Services\Equipment;

use App\Models\Loan;

class EquipmentConditionService
{
    public function applyReturnDamage(Loan $loan, string $damageLevel): void
    {
        if (! in_array($damageLevel, ['rusak_ringan', 'rusak_berat'], true)) {
            return;
        }

        $loan->loadMissing('items.equipment');

        foreach ($loan->items as $item) {
            $equipment = $item->equipment;

            if (! $equipment || $equipment->item_type !== 'alat') {
                continue;
            }

            $quantity = min((int) $item->quantity, (int) $equipment->qty_baik, (int) $equipment->available);

            if ($quantity <= 0) {
                continue;
            }

            $equipment->qty_baik -= $quantity;
            $equipment->available -= $quantity;

            if ($damageLevel === 'rusak_ringan') {
                $equipment->qty_rusak_ringan += $quantity;
            } else {
                $equipment->qty_rusak_berat += $quantity;
            }

            $equipment->save();
        }
    }
}
