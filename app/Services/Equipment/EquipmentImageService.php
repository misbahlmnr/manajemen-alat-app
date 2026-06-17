<?php

namespace App\Services\Equipment;

use App\Models\Equipment;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class EquipmentImageService
{
    public function store(Equipment $equipment, UploadedFile $file): string
    {
        $this->delete($equipment);

        return $file->store("equipment/{$equipment->id}", 'public');
    }

    public function delete(Equipment $equipment): void
    {
        if (! $equipment->image_path) {
            return;
        }

        Storage::disk('public')->delete($equipment->image_path);
    }
}
