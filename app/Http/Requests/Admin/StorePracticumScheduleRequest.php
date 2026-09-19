<?php

namespace App\Http\Requests\Admin;

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
        } else {
            $merge['penanggung_jawab_id'] = null;
            $merge['participant_ids'] = [];
            $merge['items'] = [];
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
            'items' => [$isLomba ? 'required' : 'exclude', 'array', 'min:1'],
            'items.*.equipment_id' => [
                Rule::requiredIf($isLomba),
                'integer',
                'exists:equipment,id',
            ],
            'items.*.quantity' => [
                Rule::requiredIf($isLomba),
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
            'priority' => 'prioritas',
            'notes' => 'catatan',
        ];
    }
}
