<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\Admin\Concerns\ValidatesEquipmentConditionQuantities;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateEquipmentRequest extends FormRequest
{
    use ValidatesEquipmentConditionQuantities;

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
            'qty_baik' => ['required', 'integer', 'min:0'],
            'qty_rusak_ringan' => ['required', 'integer', 'min:0'],
            'qty_rusak_berat' => ['required', 'integer', 'min:0'],
            'location' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:2000'],
            'status' => ['required', Rule::in(['tersedia', 'tidak_tersedia'])],
            'image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $this->addConditionQuantityRules($validator);
    }

    public function attributes(): array
    {
        return (new StoreEquipmentRequest)->attributes();
    }
}
