<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSupplyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    protected function prepareForValidation(): void
    {
        if ($this->input('min_stock') === '' || $this->input('min_stock') === null) {
            $this->merge(['min_stock' => null]);
        }
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:100'],
            'stock' => ['required', 'integer', 'min:1'],
            'available' => ['required', 'integer', 'min:0', 'lte:stock'],
            'unit' => ['required', Rule::in(config('lab.supply_units'))],
            'min_stock' => ['nullable', 'integer', 'min:0'],
            'location' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:2000'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => 'nama bahan',
            'category' => 'kategori',
            'stock' => 'total stok',
            'available' => 'stok tersisa',
            'unit' => 'satuan',
            'min_stock' => 'stok minimum',
            'location' => 'lokasi gudang',
            'description' => 'deskripsi',
            'status' => 'status',
        ];
    }
}
