<?php

namespace App\Http\Requests\Siswa;

use App\Models\Equipment;
use App\Models\PracticumSchedule;
use App\Models\User;
use Carbon\Carbon;
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

        $isAlat = $this->input('item_type') === 'alat';
        $bawaPulang = $this->input('borrow_scope') === 'bawa_pulang';

        $merge = [
            'items' => $items,
            'borrower_id' => $this->user()->id,
        ];

        if (! $isAlat || ! $bawaPulang) {
            $merge['collateral_agreed'] = null;
        }

        if (! $this->filled('practicum_schedule_id')) {
            $merge['practicum_schedule_id'] = null;
        }

        if (! $isAlat || $bawaPulang) {
            $merge['borrow_reason'] = null;
        } elseif (! $this->filled('borrow_reason')) {
            $merge['borrow_reason'] = 'reguler';
        }

        $this->merge($merge);
    }

    public function rules(): array
    {
        $isAlat = $this->input('item_type') === 'alat';
        $bawaPulang = $this->input('borrow_scope') === 'bawa_pulang';
        $isLab = $isAlat && ! $bawaPulang;

        return [
            'supervisor_id' => [
                'required',
                'integer',
                Rule::exists(User::class, 'id')->where('role', 'guru'),
            ],
            'practicum_schedule_id' => [
                $isLab ? 'required' : 'nullable',
                'integer',
                Rule::exists('practicum_schedules', 'id'),
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
            'borrow_reason' => [
                $isLab ? 'required' : 'nullable',
                Rule::in(['reguler', 'lanjutan']),
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
            'borrow_reason' => 'jenis peminjaman lab',
            'collateral_agreed' => 'persetujuan jaminan kartu',
            'items' => 'item peminjaman',
        ];
    }

    public function messages(): array
    {
        return [
            'collateral_agreed.accepted' => 'Anda harus menyetujui penyerahan kartu pelajar sebagai jaminan.',
            'practicum_schedule_id.required' => 'Pilih mapel/jadwal referensi yang sesuai dengan kelas Anda.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $itemType = $this->input('item_type');

            foreach ($this->input('items', []) as $row) {
                $equipment = Equipment::query()->find($row['equipment_id'] ?? null);

                if (! $equipment || $equipment->item_type !== $itemType) {
                    $validator->errors()->add(
                        'items',
                        'Barang tidak valid untuk jenis pengajuan ini.',
                    );

                    break;
                }
            }

            if ($itemType !== 'alat') {
                return;
            }

            $bawaPulang = $this->input('borrow_scope') === 'bawa_pulang';
            $borrowReason = $this->input('borrow_reason');
            $isCatchUp = ! $bawaPulang && $borrowReason === 'lanjutan';

            if ($isCatchUp) {
                $explanation = trim((string) ($this->input('notes') ?: $this->input('purpose') ?: ''));
                if (strlen($explanation) < 10) {
                    $validator->errors()->add(
                        'notes',
                        'Jelaskan alasan lanjutan praktikum (minimal 10 karakter).',
                    );
                }

                if ($this->filled('due_at') && $this->filled('request_date')) {
                    $requestDate = Carbon::parse($this->input('request_date'))->toDateString();
                    $dueDate = Carbon::parse($this->input('due_at'))->toDateString();

                    if ($dueDate !== $requestDate) {
                        $validator->errors()->add(
                            'due_at',
                            'Peminjaman lanjutan di lab harus dikembalikan pada hari yang sama.',
                        );
                    }
                }
            }

            if (! $this->filled('practicum_schedule_id')) {
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

            if (
                ! $bawaPulang
                && $borrowReason === 'reguler'
                && $schedule
                && $this->filled('request_date')
                && ! $schedule->matchesRequestDate($this->input('request_date'))
            ) {
                $validator->errors()->add(
                    'request_date',
                    'Tanggal pinjam harus sesuai hari jadwal mapel. Pilih mode lanjutan praktikum jika pinjam di luar hari mapel.',
                );
            }
        });
    }
}
