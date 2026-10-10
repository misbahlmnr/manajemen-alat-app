<?php

namespace App\Http\Requests\Admin;

use App\Models\Equipment;
use App\Models\User;
use App\Support\ClassOptions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StorePracticumScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    protected function prepareForValidation(): void
    {
        $kind = $this->input('schedule_kind', 'praktikum');
        $merge = [
            'schedule_kind' => $kind,
        ];

        if ($kind === 'lomba') {
            $merge['type'] = 'khusus';
            $merge['hari'] = null;
            $merge['priority'] = 'lomba';
            $merge['ruangan'] = null;
            $merge['mata_kuliah'] = $this->input('mata_kuliah') ?: ($this->input('title') ?: 'Lomba');
            $merge['kelas'] = $this->input('kelas') ?: (ClassOptions::names()[0] ?? 'XI TAV 1');

            $participantIds = array_values(array_unique(array_filter(array_map(
                'intval',
                (array) $this->input('participant_ids', []),
            ))));
            $ketuaId = (int) $this->input('penanggung_jawab_id');

            if ($ketuaId > 0 && ! in_array($ketuaId, $participantIds, true)) {
                $ketuaId = 0;
            }

            $merge['participant_ids'] = $participantIds;
            $merge['penanggung_jawab_id'] = $ketuaId > 0 ? $ketuaId : null;
            $merge['items'] = $this->normalizeItemRows($this->input('items', []));
            $merge['bahan_items'] = $this->normalizeItemRows($this->input('bahan_items', []));
        } else {
            $merge['penanggung_jawab_id'] = null;
            $merge['participant_ids'] = [];
            $merge['items'] = [];
            $merge['bahan_items'] = [];
            $merge['priority'] = 'normal';

            if ($this->input('type') === 'mingguan') {
                $merge['tanggal'] = null;
            }

            if ($this->input('type') === 'khusus') {
                $merge['hari'] = null;
            }
        }

        $this->merge($merge);
    }

    public function rules(): array
    {
        $type = $this->input('type', 'mingguan');
        $kind = $this->input('schedule_kind', 'praktikum');
        $isLomba = $kind === 'lomba';

        return [
            'schedule_kind' => ['required', Rule::in(['praktikum', 'lomba'])],
            'title' => ['required', 'string', 'max:255'],
            'mata_kuliah' => ['required', 'string', 'max:100'],
            'kelas' => [
                'required',
                'string',
                'max:50',
                Rule::in(ClassOptions::namesAllowing([
                    $this->route('schedule')?->kelas,
                ])),
            ],
            'type' => ['required', Rule::in(['mingguan', 'khusus'])],
            'hari' => [
                Rule::requiredIf(! $isLomba && $type === 'mingguan'),
                'nullable',
                Rule::in(array_keys(config('lab.schedule_days'))),
            ],
            'tanggal' => [
                Rule::requiredIf($isLomba || $type === 'khusus'),
                'nullable',
                'date',
            ],
            'jam_mulai' => ['required', 'date_format:H:i'],
            'jam_selesai' => ['required', 'date_format:H:i', 'after:jam_mulai'],
            'ruangan' => [
                'nullable',
                'string',
                'max:100',
                Rule::in(array_values(array_unique([
                    ...config('lab.lab_room_options', []),
                    ...array_filter([(string) $this->route('schedule')?->ruangan]),
                ]))),
            ],
            'guru_id' => [
                'required',
                'integer',
                Rule::exists(User::class, 'id')->where('role', 'guru'),
            ],
            'penanggung_jawab_id' => [
                Rule::requiredIf($isLomba),
                'nullable',
                'integer',
                Rule::exists(User::class, 'id')->where('role', 'siswa'),
            ],
            'participant_ids' => [$isLomba ? 'required' : 'exclude', 'array', 'min:1'],
            'participant_ids.*' => [
                'integer',
                Rule::exists(User::class, 'id')->where('role', 'siswa'),
            ],
            'items' => [$isLomba ? 'nullable' : 'exclude', 'array'],
            'items.*.equipment_id' => [
                'required',
                'integer',
                'exists:equipment,id',
            ],
            'items.*.quantity' => [
                'required',
                'integer',
                'min:1',
            ],
            'bahan_items' => [$isLomba ? 'nullable' : 'exclude', 'array'],
            'bahan_items.*.equipment_id' => [
                'required',
                'integer',
                'exists:equipment,id',
            ],
            'bahan_items.*.quantity' => [
                'required',
                'integer',
                'min:1',
            ],
            'priority' => ['required', Rule::in(['normal', 'tinggi', 'lomba'])],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($this->input('schedule_kind') !== 'lomba') {
                return;
            }

            $ketuaId = (int) $this->input('penanggung_jawab_id');
            $participantIds = array_map('intval', (array) $this->input('participant_ids', []));

            if ($ketuaId > 0 && ! in_array($ketuaId, $participantIds, true)) {
                $validator->errors()->add(
                    'penanggung_jawab_id',
                    'Ketua Tim harus dipilih dari daftar Peserta Lomba.',
                );
            }

            $alatItems = (array) $this->input('items', []);
            $bahanItems = (array) $this->input('bahan_items', []);

            if ($alatItems === [] && $bahanItems === []) {
                $validator->errors()->add(
                    'items',
                    'Event lomba harus memiliki minimal satu alat atau bahan.',
                );
            }

            $this->assertEquipmentTypes($validator, $alatItems, 'alat', 'items');
            $this->assertEquipmentTypes($validator, $bahanItems, 'bahan', 'bahan_items');
        });
    }

    public function attributes(): array
    {
        return [
            'schedule_kind' => 'jenis kegiatan',
            'title' => 'judul jadwal',
            'mata_kuliah' => 'mata pelajaran',
            'kelas' => 'kelas',
            'type' => 'jenis jadwal',
            'hari' => 'hari',
            'tanggal' => 'tanggal',
            'jam_mulai' => 'jam mulai',
            'jam_selesai' => 'jam selesai',
            'ruangan' => 'ruang/laboratorium',
            'guru_id' => 'guru pendamping',
            'penanggung_jawab_id' => 'ketua tim',
            'participant_ids' => 'peserta lomba',
            'items' => 'daftar alat',
            'bahan_items' => 'daftar bahan',
            'priority' => 'prioritas',
            'notes' => 'catatan',
        ];
    }

    /**
     * @param  mixed  $rows
     * @return list<array{equipment_id: int, quantity: int}>
     */
    private function normalizeItemRows(mixed $rows): array
    {
        $normalized = [];

        foreach ((array) $rows as $row) {
            if (! is_array($row)) {
                continue;
            }

            $equipmentId = (int) ($row['equipment_id'] ?? 0);
            if ($equipmentId <= 0) {
                continue;
            }

            $normalized[] = [
                'equipment_id' => $equipmentId,
                'quantity' => max(1, (int) ($row['quantity'] ?? 1)),
            ];
        }

        return $normalized;
    }

    /**
     * @param  list<array{equipment_id?: int}>  $rows
     */
    private function assertEquipmentTypes(
        Validator $validator,
        array $rows,
        string $expectedType,
        string $field,
    ): void {
        if ($rows === []) {
            return;
        }

        $ids = array_values(array_unique(array_map(
            fn ($row) => (int) ($row['equipment_id'] ?? 0),
            $rows,
        )));

        $types = Equipment::query()
            ->whereIn('id', $ids)
            ->pluck('item_type', 'id');

        foreach ($ids as $id) {
            if ((string) ($types[$id] ?? '') !== $expectedType) {
                $validator->errors()->add(
                    $field,
                    $expectedType === 'alat'
                        ? 'Daftar alat hanya boleh berisi peralatan (alat).'
                        : 'Daftar bahan hanya boleh berisi bahan.',
                );

                return;
            }
        }
    }
}
