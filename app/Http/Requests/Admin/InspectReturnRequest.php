<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class InspectReturnRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'result' => ['required', Rule::in(['lengkap', 'tidak_lengkap', 'rusak'])],
            'notes' => ['nullable', 'string', 'max:2000'],
            'missing_items' => ['nullable', 'string', 'max:2000'],
            'damage_description' => ['nullable', 'string', 'max:2000'],
            'amount' => ['nullable', 'integer', 'min:0'],
            'description' => ['nullable', 'string', 'max:2000'],
            'damage_level' => ['nullable', Rule::in(['rusak_ringan', 'rusak_berat'])],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($this->input('result') === 'rusak' && blank($this->input('damage_level'))) {
                $validator->errors()->add('damage_level', 'Tingkat kerusakan wajib dipilih jika hasil inspeksi rusak.');
            }
        });
    }
}
