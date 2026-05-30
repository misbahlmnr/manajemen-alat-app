<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLoanCollateralRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'card_type' => ['required', Rule::in(array_keys(config('lab.collateral_card_types')))],
            'card_number' => ['nullable', 'string', 'max:50'],
            'status' => ['required', Rule::in(array_keys(config('lab.collateral_statuses')))],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function attributes(): array
    {
        return (new StoreLoanCollateralRequest)->attributes();
    }
}
