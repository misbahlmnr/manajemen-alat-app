<?php

namespace App\Http\Requests\Admin\Concerns;

use Illuminate\Validation\Validator;

trait ValidatesEquipmentConditionQuantities
{
    protected function addConditionQuantityRules(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $stock = (int) $this->input('stock');
            $available = (int) $this->input('available');
            $qtyBaik = (int) $this->input('qty_baik');
            $qtyRingan = (int) $this->input('qty_rusak_ringan');
            $qtyBerat = (int) $this->input('qty_rusak_berat');
            $total = $qtyBaik + $qtyRingan + $qtyBerat;

            if ($total !== $stock) {
                $validator->errors()->add(
                    'qty_baik',
                    "Jumlah kondisi ({$total}) harus sama dengan total stok ({$stock}).",
                );
            }

            if ($available > $qtyBaik) {
                $validator->errors()->add(
                    'available',
                    'Stok tersedia tidak boleh melebihi jumlah unit kondisi baik.',
                );
            }
        });
    }
}
