<?php

namespace App\Http\Requests\Admin;

use App\Models\Loan;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLoanCollateralRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'loan_id' => [
                'required',
                'integer',
                Rule::exists('loans', 'id')->where(
                    fn ($query) => $query->where('item_type', 'alat')->where('borrow_scope', 'bawa_pulang')
                ),
            ],
            'student_id' => [
                'required',
                'integer',
                Rule::exists(User::class, 'id')->where('role', 'siswa'),
            ],
            'card_type' => ['required', Rule::in(array_keys(config('lab.collateral_card_types')))],
            'card_number' => ['nullable', 'string', 'max:50'],
            'status' => ['required', Rule::in(array_keys(config('lab.collateral_statuses')))],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function attributes(): array
    {
        return [
            'loan_id' => 'peminjaman',
            'student_id' => 'siswa',
            'card_type' => 'jenis kartu',
            'card_number' => 'nomor kartu',
            'status' => 'status',
            'notes' => 'catatan',
        ];
    }
}
