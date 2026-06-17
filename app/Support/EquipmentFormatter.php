<?php

namespace App\Support;

use App\Models\Equipment;

class EquipmentFormatter
{
    public static function format(Equipment $equipment, bool $includeTimestamps = true): array
    {
        $data = [
            'id' => $equipment->id,
            'code' => $equipment->code,
            'name' => $equipment->name,
            'category' => $equipment->category,
            'item_type' => $equipment->item_type,
            'stock' => $equipment->stock,
            'available' => $equipment->available,
            'qty_baik' => $equipment->qty_baik,
            'qty_rusak_ringan' => $equipment->qty_rusak_ringan,
            'qty_rusak_berat' => $equipment->qty_rusak_berat,
            'condition_breakdown' => $equipment->condition_breakdown,
            'primary_condition_label' => $equipment->primary_condition_label,
            'location' => $equipment->location,
            'description' => $equipment->description,
            'status' => $equipment->status,
            'availability_label' => $equipment->availability_label,
            'stock_label' => $equipment->stock_label,
            'image_url' => $equipment->image_url,
            'unit' => $equipment->unit,
            'min_stock' => $equipment->min_stock,
            'is_low_stock' => $equipment->is_low_stock,
        ];

        if ($includeTimestamps) {
            $data['created_at_formatted'] = $equipment->created_at?->translatedFormat('d M Y');
            $data['updated_at_formatted'] = $equipment->updated_at?->translatedFormat('d M Y H:i');
        }

        return $data;
    }
}
