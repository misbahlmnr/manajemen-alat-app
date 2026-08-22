<?php

namespace App\Http\Requests\Siswa;

use App\Models\Equipment;
use App\Models\Loan;
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
        $isPribadi = $isAlat && ! $bawaPulang && $this->input('borrow_reason') === 'lanjutan';

        $merge = [
            'items' => $items,
            'borrower_id' => $this->user()->id,
        ];

        if (! $isAlat || ! $bawaPulang) {
            $merge['collateral_agreed'] = null;
        }

        if (! $this->filled('practicum_schedule_id') || $isPribadi) {
            $merge['practicum_schedule_id'] = null;
        }

        if (! $isAlat || $bawaPulang) {
            $merge['borrow_reason'] = null;
        } elseif (! $this->filled('borrow_reason')) {
            $merge['borrow_reason'] = 'reguler';
        }

        if (! $isAlat || $bawaPulang) {
            $merge['usage_room'] = null;
        } elseif (! $this->filled('usage_room')) {
            $merge['usage_room'] = null;
        }

        if ($isPribadi) {
            $merge['supervisor_id'] = null;
        }

        if (
            $isAlat
            && ! $isPribadi
            && $this->filled('practicum_schedule_id')
        ) {
            $schedule = PracticumSchedule::query()->find($this->input('practicum_schedule_id'));

            if ($schedule?->guru_id) {
                $merge['supervisor_id'] = $schedule->guru_id;
            }

            if (! $bawaPulang && filled($schedule?->ruangan)) {
                $merge['usage_room'] = $schedule->ruangan;
            }
        }

        $this->merge($merge);
    }

    public function rules(): array
    {
        $isAlat = $this->input('item_type') === 'alat';
        $bawaPulang = $this->input('borrow_scope') === 'bawa_pulang';
        $isLab = $isAlat && ! $bawaPulang;
        $isLabReguler = $isLab && $this->input('borrow_reason') === 'reguler';
        $isPribadi = $isLab && $this->input('borrow_reason') === 'lanjutan';
        $roomOptions = config('lab.lab_room_options', []);

        if ($this->filled('practicum_schedule_id')) {
            $scheduleRoom = PracticumSchedule::query()
                ->whereKey($this->input('practicum_schedule_id'))
                ->value('ruangan');

            if (filled($scheduleRoom)) {
                $roomOptions = array_values(array_unique([...$roomOptions, $scheduleRoom]));
            }
        }

        return [
            'supervisor_id' => [
                $isPribadi ? 'nullable' : 'required',
                'integer',
                Rule::exists(User::class, 'id')->where('role', 'guru'),
            ],
            'practicum_schedule_id' => [
                $isLabReguler ? 'required' : 'nullable',
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
            'usage_room' => [
                Rule::requiredIf($isLab),
                'nullable',
                'string',
                'max:100',
                Rule::in($roomOptions),
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
            'practicum_schedule_id' => 'mata pelajaran',
            'item_type' => 'jenis barang',
            'request_date' => 'tanggal pengajuan',
            'due_at' => 'batas pengembalian',
            'purpose' => 'catatan',
            'notes' => 'catatan',
            'borrow_scope' => 'kebutuhan penggunaan',
            'borrow_reason' => 'kebutuhan penggunaan',
            'usage_room' => 'lokasi ruang/lab',
            'collateral_agreed' => 'pemahaman jaminan kartu',
            'items' => 'item peminjaman',
        ];
    }

    public function messages(): array
    {
        return [
            'collateral_agreed.accepted' => 'Anda harus memahami bahwa peminjaman ini memerlukan jaminan kartu pelajar.',
            'practicum_schedule_id.required' => 'Pilih mata pelajaran dari jadwal hari ini.',
            'usage_room.required' => 'Pilih lokasi ruang/lab.',
            'usage_room.in' => 'Lokasi ruang/lab tidak valid.',
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

            if ($this->filled('practicum_schedule_id')) {
                $schedule = PracticumSchedule::query()->find($this->input('practicum_schedule_id'));
                $class = $this->user()?->class;

                if ($schedule && $class && $schedule->kelas !== $class) {
                    $validator->errors()->add(
                        'practicum_schedule_id',
                        'Jadwal praktikum harus sesuai dengan kelas Anda.',
                    );
                }

                if (
                    $bawaPulang
                    && $schedule
                    && ! $schedule->matchesRequestDate(now())
                ) {
                    $validator->errors()->add(
                        'practicum_schedule_id',
                        'Mata pelajaran harus dari jadwal hari ini.',
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
                        'Tanggal pengajuan harus sesuai jadwal mata pelajaran hari ini.',
                    );
                }

                if (
                    $bawaPulang
                    && $schedule
                    && $this->filled('request_date')
                    && ! $schedule->matchesRequestDate($this->input('request_date'))
                ) {
                    $validator->errors()->add(
                        'request_date',
                        'Tanggal pengajuan harus sesuai jadwal mata pelajaran hari ini.',
                    );
                }

                if (
                    $schedule
                    && $this->filled('supervisor_id')
                    && $schedule->guru_id
                    && (int) $schedule->guru_id !== (int) $this->input('supervisor_id')
                    && ($bawaPulang || $borrowReason === 'reguler')
                ) {
                    $validator->errors()->add(
                        'supervisor_id',
                        'Guru pembimbing harus sesuai dengan guru mata pelajaran yang dipilih.',
                    );
                }

                if (
                    $schedule
                    && ! $bawaPulang
                    && $borrowReason === 'reguler'
                    && filled($schedule->ruangan)
                    && $this->filled('usage_room')
                    && $schedule->ruangan !== $this->input('usage_room')
                ) {
                    $validator->errors()->add(
                        'usage_room',
                        'Lokasi ruang/lab harus sesuai dengan jadwal mata pelajaran yang dipilih.',
                    );
                }
            }

            if (
                $this->isMethod('post')
                && $this->filled('due_at')
                && Carbon::parse($this->input('due_at'))->lte(now())
            ) {
                $validator->errors()->add(
                    'due_at',
                    'Batas pengembalian harus setelah waktu sekarang.',
                );
            }

            if ($this->filled('due_at')) {
                $loan = new Loan([
                    'borrow_scope' => $this->input('borrow_scope', 'lab'),
                    'borrow_reason' => $this->input('borrow_reason'),
                    'request_date' => $this->input('request_date'),
                    'due_at' => $this->input('due_at'),
                    'practicum_schedule_id' => $this->input('practicum_schedule_id'),
                    'item_type' => 'alat',
                ]);

                if ($loan->practicum_schedule_id) {
                    $loan->setRelation(
                        'schedule',
                        PracticumSchedule::query()->find($loan->practicum_schedule_id),
                    );
                }

                $sliceEnd = app(\App\Services\Loan\LoanQueueService::class)
                    ->resolveTimeSliceDueAt($loan, now());

                if (Carbon::parse($this->input('due_at'))->gt($sliceEnd)) {
                    $validator->errors()->add(
                        'due_at',
                        $this->timeSliceExceededMessage($bawaPulang, $sliceEnd),
                    );
                }
            }
        });
    }

    private function timeSliceExceededMessage(bool $bawaPulang, Carbon $sliceEnd): string
    {
        if ($bawaPulang) {
            $days = max(1, (int) config('lab.queue.bawa_pulang_max_days', 1));
            $dayLabel = $days === 1 ? '1 hari' : "{$days} hari";

            return 'Batas pengembalian untuk peminjaman bawa pulang maksimal '.$dayLabel
                .' setelah tanggal pengajuan, yaitu hingga '
                .$sliceEnd->translatedFormat('d F Y')
                .' pukul '.$sliceEnd->format('H.i')
                .' sesuai jam operasional laboratorium.';
        }

        return 'Batas pengembalian melebihi time slice (maksimal '
            .$sliceEnd->translatedFormat('d M Y H:i').').';
    }
}
