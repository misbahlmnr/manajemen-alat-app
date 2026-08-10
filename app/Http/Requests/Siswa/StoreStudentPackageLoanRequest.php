<?php

namespace App\Http\Requests\Siswa;

use Illuminate\Foundation\Http\FormRequest;

class StoreStudentPackageLoanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isSiswa() ?? false;
    }

    public function rules(): array
    {
        return [
            'alat' => ['required', 'array'],
            'bahan' => ['required', 'array'],
            'alat.items' => ['required', 'array', 'min:1'],
            'bahan.items' => ['required', 'array', 'min:1'],
        ];
    }

    public function attributes(): array
    {
        return [
            'alat' => 'pengajuan alat',
            'bahan' => 'pengajuan bahan',
            'alat.items' => 'item alat',
            'bahan.items' => 'item bahan',
        ];
    }
}
