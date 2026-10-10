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
        $loanType = $this->resolveIncomingLoanType($isAlat);

        $merge = [
            'items' => $items,
            'borrower_id' => $this->user()->id,
            'loan_type' => $isAlat ? $loanType : null,
        ];

        if ($isAlat && $loanType) {
            $legacy = Loan::legacyFieldsForType($loanType);
            $merge['borrow_scope'] = $legacy['borrow_scope'];
            $merge['borrow_reason'] = $legacy['borrow_reason'];
        }

        $isPribadi = $loanType === 'pribadi';
        $isBawaPulang = $loanType === 'bawa_pulang';
        $isPraktikum = $loanType === 'praktikum';

        if (! $isAlat || ! $isBawaPulang) {
            $merge['collateral_agreed'] = null;
        }

        if (! $this->filled('practicum_schedule_id') || $isPribadi || $isBawaPulang) {
            $merge['practicum_schedule_id'] = null;
        }

        if (! $isAlat) {
            $merge['borrow_reason'] = null;
            $merge['borrow_scope'] = 'lab';
            $merge['group_member_count'] = null;
        }

        if (! $isPraktikum) {
            $merge['group_member_count'] = null;
            $merge['member_ids'] = [];
        }

        if (! $isAlat || $isBawaPulang) {
            $merge['usage_room'] = null;
        }

        if (! $isAlat || $isPribadi || ($isBawaPulang && ! $this->filled('practicum_schedule_id'))) {
            $merge['supervisor_id'] = null;
        }

        if ($isAlat && $isPraktikum && $this->filled('practicum_schedule_id')) {
            $schedule = PracticumSchedule::query()->find($this->input('practicum_schedule_id'));

            if ($schedule?->guru_id) {
                $merge['supervisor_id'] = $schedule->guru_id;
            }

            if (filled($schedule?->ruangan)) {
                $merge['usage_room'] = $schedule->ruangan;
            }
        }

        $this->merge($merge);
    }

    private function resolveIncomingLoanType(bool $isAlat): ?string
    {
        if (! $isAlat) {
            return null;
        }

        $explicit = $this->input('loan_type');
        if (in_array($explicit, ['praktikum', 'pribadi', 'bawa_pulang'], true)) {
            return $explicit;
        }

        // Reject legacy lomba submits from students.
        if ($this->input('borrow_scope') === 'bawa_pulang' && $this->input('borrow_reason') === 'lomba') {
            return 'lomba';
        }

        return Loan::resolveTypeFromLegacy(
            $this->input('borrow_scope'),
            $this->input('borrow_reason'),
        );
    }

    public function rules(): array
    {
        $isAlat = $this->input('item_type') === 'alat';
        $loanType = $this->input('loan_type');
        $isBawaPulang = $loanType === 'bawa_pulang';
        $isPraktikum = $loanType === 'praktikum';
        $isPribadi = $loanType === 'pribadi';
        $supervisorRequired = $isPraktikum;
        $roomOptions = config('lab.lab_room_options', []);

        if ($this->filled('practicum_schedule_id')) {
            $scheduleRoom = PracticumSchedule::query()
                ->whereKey($this->input('practicum_schedule_id'))
                ->value('ruangan');

            if (filled($scheduleRoom)) {
                $roomOptions = array_values(array_unique([...$roomOptions, $scheduleRoom]));
            }
        }

        $horizon = max(1, (int) config('lab.queue.booking_horizon_days', 7));
        $today = now()->toDateString();
        $maxDate = now()->addDays($horizon)->toDateString();

        return [
            'supervisor_id' => [
                $supervisorRequired ? 'required' : 'nullable',
                'integer',
                Rule::exists(User::class, 'id')->where('role', 'guru'),
            ],
            'practicum_schedule_id' => [
                $isPraktikum ? 'required' : 'nullable',
                'integer',
                Rule::exists('practicum_schedules', 'id'),
            ],
            'item_type' => ['required', Rule::in(['alat', 'bahan'])],
            'loan_type' => [
                $isAlat ? 'required' : 'nullable',
                Rule::in(['praktikum', 'pribadi', 'bawa_pulang']),
            ],
            'request_date' => ['required', 'date', 'after_or_equal:'.$today, 'before_or_equal:'.$maxDate],
            'due_at' => [$isAlat ? 'required' : 'nullable', 'date', 'after_or_equal:request_date'],
            'purpose' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'borrow_scope' => [
                $isAlat ? 'required' : 'nullable',
                Rule::in(['lab', 'bawa_pulang']),
            ],
            'borrow_reason' => [
                $isAlat ? 'required' : 'nullable',
                Rule::in(['reguler', 'lanjutan']),
            ],
            'group_member_count' => [
                'nullable',
                'integer',
                'min:1',
                'max:50',
            ],
            'member_ids' => [
                Rule::excludeIf(fn () => ! $isPraktikum),
                'nullable',
                'array',
                'max:10',
            ],
            'member_ids.*' => [
                Rule::excludeIf(fn () => ! $isPraktikum),
                'integer',
                'distinct',
                Rule::exists(User::class, 'id')
                    ->where('role', 'siswa')
                    ->where('status', 'active')
                    ->where('class', $this->user()?->class),
                Rule::notIn([(int) $this->user()->id]),
            ],
            'usage_room' => [
                Rule::requiredIf($isPraktikum || $isPribadi),
                'nullable',
                'string',
                'max:100',
                Rule::in($roomOptions),
            ],
            'collateral_agreed' => [
                Rule::excludeIf(fn () => ! $isAlat || ! $isBawaPulang),
                Rule::requiredIf($isAlat && $isBawaPulang),
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
            'loan_type' => 'jenis peminjaman',
            'request_date' => $this->input('borrow_scope') === 'bawa_pulang'
                ? 'tanggal pengambilan'
                : 'tanggal pemakaian',
            'due_at' => 'batas pengembalian',
            'purpose' => 'catatan',
            'notes' => 'catatan',
            'borrow_scope' => 'kebutuhan penggunaan',
            'borrow_reason' => 'kebutuhan penggunaan',
            'group_member_count' => 'jumlah anggota kelompok',
            'member_ids' => 'anggota kelompok',
            'member_ids.*' => 'anggota kelompok',
            'usage_room' => 'lokasi ruang/lab',
            'collateral_agreed' => 'pemahaman jaminan kartu',
            'items' => 'item peminjaman',
        ];
    }

    public function messages(): array
    {
        return [
            'collateral_agreed.accepted' => 'Anda harus memahami bahwa peminjaman ini memerlukan jaminan kartu pelajar.',
            'practicum_schedule_id.required' => 'Pilih mata pelajaran dari jadwal di tanggal yang dipilih.',
            'usage_room.required' => 'Pilih lokasi ruang/lab.',
            'usage_room.in' => 'Lokasi ruang/lab tidak valid.',
            'loan_type.in' => 'Jenis peminjaman tidak valid. Lomba diajukan melalui event admin.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $itemType = $this->input('item_type');
            $loanType = $this->input('loan_type');

            if ($itemType === 'alat' && $loanType === 'lomba') {
                $validator->errors()->add(
                    'loan_type',
                    'Peminjaman lomba dibuat oleh admin melalui Event Lomba.',
                );
            }

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

            $isBawaPulang = $loanType === 'bawa_pulang';
            $isPraktikum = $loanType === 'praktikum';

            if ($this->filled('practicum_schedule_id')) {
                $schedule = PracticumSchedule::query()->find($this->input('practicum_schedule_id'));
                $class = $this->user()?->class;

                if ($schedule && ($schedule->schedule_kind ?? 'praktikum') === 'lomba') {
                    $validator->errors()->add(
                        'practicum_schedule_id',
                        'Jadwal event lomba tidak dapat dipilih dari pengajuan siswa.',
                    );
                }

                if ($schedule && $class && $schedule->kelas !== $class) {
                    $validator->errors()->add(
                        'practicum_schedule_id',
                        'Jadwal praktikum harus sesuai dengan kelas Anda.',
                    );
                }

                if (
                    $isPraktikum
                    && $schedule
                    && $this->filled('request_date')
                    && ! $schedule->matchesRequestDate($this->input('request_date'))
                ) {
                    $validator->errors()->add(
                        'request_date',
                        'Tanggal pemakaian harus sesuai jadwal mata pelajaran yang dipilih.',
                    );
                }

                if (
                    $isPraktikum
                    && $schedule
                    && $this->filled('request_date')
                    && Carbon::parse($this->input('request_date'))->isToday()
                    && ! $schedule->isActive()
                ) {
                    $validator->errors()->add(
                        'practicum_schedule_id',
                        'Jadwal mata pelajaran ini sudah selesai. Pilih jadwal yang masih berlangsung, atau gunakan tipe Pribadi.',
                    );
                }

                if (
                    $schedule
                    && $this->filled('supervisor_id')
                    && $schedule->guru_id
                    && (int) $schedule->guru_id !== (int) $this->input('supervisor_id')
                    && $isPraktikum
                ) {
                    $validator->errors()->add(
                        'supervisor_id',
                        'Guru pembimbing harus sesuai dengan guru mata pelajaran yang dipilih.',
                    );
                }

                if (
                    $schedule
                    && $isPraktikum
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
                && ! $isPraktikum
                && Carbon::parse($this->input('due_at'))->lte(now())
            ) {
                $validator->errors()->add(
                    'due_at',
                    'Batas pengembalian harus setelah waktu sekarang.',
                );
            }

            if ($this->filled('due_at') && ! $isPraktikum) {
                $loan = new Loan([
                    'loan_type' => $loanType,
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
                        $this->timeSliceExceededMessage($isBawaPulang, $sliceEnd),
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
