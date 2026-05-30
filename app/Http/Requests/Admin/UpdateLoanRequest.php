<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLoanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('items')) {
            $items = $this->input('items', []);
            if (is_array($items)) {
                $items = array_values(array_filter($items, fn ($row) => ! empty($row['equipment_id'])));
            }
            $this->merge(['items' => $items]);
        }
    }

    public function rules(): array
    {
        return (new StoreLoanRequest)->rules();
    }

    public function attributes(): array
    {
        return (new StoreLoanRequest)->attributes();
    }
}
