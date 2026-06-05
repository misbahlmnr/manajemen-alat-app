<?php

namespace App\Http\Requests\Siswa;

use App\Models\Equipment;
use App\Models\PracticumSchedule;
use App\Models\User;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStudentLoanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isSiswa() ?? false;
    }

    protected function prepareForValidation(): void
    {
        $items = $this->input('items', []);
        if (is_array($items)) {
            $items = array_values(array_filter($items, fn ($row) => ! empty($row['equipment_id'])));
        }

        $merge = [
            'items' => $items,
            'borrower_id' => $this->user()->id,
        ];

        $isAlat = $this->input('item_type') === 'alat';
        $bawaPulang = $this->input('borrow_scope') === 'bawa_pulang';

        if (! $isAlat || ! $bawaPulang) {
            $merge['collateral_agreed'] = null;
        }

        if (! $this->filled('practicum_schedule_id')) {
            $merge['practicum_schedule_id'] = null;
        }

        $this->merge($merge);
    }

    public function rules(): array
    {
        $isAlat = $this->input('item_type') === 'alat';
        $bawaPulang = $this->input('borrow_scope') === 'bawa_pulang';
        $user = $this->user();

        return [
            'supervisor_id' => [
                'required',
                'integer',
                Rule::exists(User::class, 'id')->where('role', 'guru'),
            ],
            'practicum_schedule_id' => [
                ($isAlat && ! $bawaPulang) ? 'required' : 'nullable',
                'integer',
                Rule::exists('practicum_schedules', 'id')->where(
                    fn ($query) => $query->where('status', 'aktif'),
                ),
            ],
            'item_type' => ['required', Rule::in(['alat', 'bahan'])],
            'request_date' => ['required', 'date'],
            'due_at' => [$isAlat ? 'required' : 'nullable', 'date', 'after_or_equal:request_date'],
            'purpose' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'borrow_scope' => [
                $isAlat ? 'required' : 'nullable',
                Rule::in(['lab', 'bawa_pulang']),
            ],
            'collateral_agreed' => [
                Rule::excludeIf(fn () => ! $isAlat || ! $bawaPulang),
                Rule::requiredIf($isAlat && $bawaPulang),
                'accepted',
            ],
            'items' => ['required', 'array', 'min:1'],
            'items.*.equipment_id' => ['required', 'integer', 'exists:equipment,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ];
    }

    public function attributes(): array
    {
        return [
            'supervisor_id' => 'guru pembimbing',
            'practicum_schedule_id' => 'jadwal praktikum',
            'item_type' => 'jenis barang',
            'request_date' => 'tanggal pengajuan',
            'due_at' => 'batas pengembalian',
            'purpose' => 'tujuan peminjaman',
            'notes' => 'catatan',
            'borrow_scope' => 'lokasi penggunaan',
            'collateral_agreed' => 'persetujuan jaminan kartu',
            'items' => 'item peminjaman',
        ];
    }

    public function messages(): array
    {
        return [
            'collateral_agreed.accepted' => 'Anda harus menyetujui penyerahan kartu pelajar sebagai jaminan.',
            'practicum_schedule_id.required' => 'Pilih jadwal praktikum yang sesuai dengan kelas Anda.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $itemType = $this->input('item_type');

            foreach ($this->input('items', []) as $index => $row) {
                $equipment = Equipment::query()->find($row['equipment_id'] ?? null);

                if (! $equipment || $equipment->item_type !== $itemType) {
                    $validator->errors()->add(
                        'items',
                        'Barang tidak valid untuk jenis pengajuan ini.',
                    );

                    break;
                }
            }

            if ($itemType !== 'alat' || ! $this->filled('practicum_schedule_id')) {
                return;
            }

            $schedule = PracticumSchedule::query()->find($this->input('practicum_schedule_id'));
            $class = $this->user()?->class;

            if ($schedule && $class && $schedule->kelas !== $class) {
                $validator->errors()->add(
                    'practicum_schedule_id',
                    'Jadwal praktikum harus sesuai dengan kelas Anda.',
                );
            }
        });
    }
}
