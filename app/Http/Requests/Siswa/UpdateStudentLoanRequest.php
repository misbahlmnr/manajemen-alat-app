<?php

namespace App\Http\Requests\Siswa;

class UpdateStudentLoanRequest extends StoreStudentLoanRequest
{
    public function authorize(): bool
    {
        $loan = $this->route('loan');

        return $loan && ($this->user()?->can('update', $loan) ?? false);
    }

    protected function prepareForValidation(): void
    {
        $loan = $this->route('loan');

        $this->merge([
            'item_type' => $loan->item_type,
        ]);

        parent::prepareForValidation();
    }
}
