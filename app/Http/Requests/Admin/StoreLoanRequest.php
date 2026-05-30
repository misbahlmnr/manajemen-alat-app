<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLoanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    protected function prepareForValidation(): void
    {
        $items = $this->input('items', []);
        if (is_array($items)) {
            $items = array_values(array_filter($items, fn ($row) => ! empty($row['equipment_id'])));
        }
        $this->merge(['items' => $items]);
    }

    public function rules(): array
    {
        $isAlat = $this->input('item_type') === 'alat';

        return [
            'borrower_id' => [
                'required',
                'integer',
                Rule::exists(User::class, 'id')->where('role', 'siswa'),
            ],
            'supervisor_id' => [
                'required',
                'integer',
                Rule::exists(User::class, 'id')->where('role', 'guru'),
            ],
            'practicum_schedule_id' => ['nullable', 'integer', 'exists:practicum_schedules,id'],
            'item_type' => ['required', Rule::in(['alat', 'bahan'])],
            'request_date' => ['required', 'date'],
            'due_at' => [$isAlat ? 'required' : 'nullable', 'date', 'after_or_equal:request_date'],
            'purpose' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'borrow_scope' => ['nullable', Rule::in(['lab', 'bawa_pulang'])],
            'items' => ['required', 'array', 'min:1'],
            'items.*.equipment_id' => ['required', 'integer', 'exists:equipment,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ];
    }

    public function attributes(): array
    {
        return [
            'borrower_id' => 'peminjam',
            'supervisor_id' => 'guru pembimbing',
            'practicum_schedule_id' => 'jadwal praktikum',
            'item_type' => 'jenis barang',
            'request_date' => 'tanggal pengajuan',
            'due_at' => 'batas pengembalian',
            'purpose' => 'tujuan',
            'notes' => 'catatan',
            'items' => 'item peminjaman',
        ];
    }
}
