<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
        ];
    }
}
