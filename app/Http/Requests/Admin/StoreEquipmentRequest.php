<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEquipmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:100'],
            'stock' => ['required', 'integer', 'min:1'],
            'available' => ['required', 'integer', 'min:0', 'lte:stock'],
            'condition' => ['required', Rule::in(['baik', 'rusak_ringan', 'rusak_berat'])],
            'location' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:2000'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => 'nama alat',
            'category' => 'kategori',
            'stock' => 'total stok',
            'available' => 'stok tersedia',
            'condition' => 'kondisi',
            'location' => 'lokasi',
            'description' => 'deskripsi',
            'status' => 'status',
        ];
    }
}
