<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePracticumScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    protected function prepareForValidation(): void
    {
        $merge = [];

        if ($this->input('type') === 'mingguan') {
            $merge['tanggal'] = null;
        }

        if ($this->input('type') === 'khusus') {
            $merge['hari'] = null;
        }

        $this->merge($merge);
    }

    public function rules(): array
    {
        $type = $this->input('type', 'mingguan');

        return [
            'title' => ['required', 'string', 'max:255'],
            'mata_kuliah' => ['required', 'string', 'max:100'],
            'kelas' => ['required', 'string', 'max:50'],
            'type' => ['required', Rule::in(['mingguan', 'khusus'])],
            'hari' => [
                Rule::requiredIf($type === 'mingguan'),
                'nullable',
                Rule::in(array_keys(config('lab.schedule_days'))),
            ],
            'tanggal' => [
                Rule::requiredIf($type === 'khusus'),
                'nullable',
                'date',
            ],
            'jam_mulai' => ['required', 'date_format:H:i'],
            'jam_selesai' => ['required', 'date_format:H:i', 'after:jam_mulai'],
            'ruangan' => ['nullable', 'string', 'max:100'],
            'guru_id' => [
                'required',
                'integer',
                Rule::exists(User::class, 'id')->where('role', 'guru'),
            ],
            'priority' => ['required', Rule::in(['normal', 'tinggi', 'lomba'])],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function attributes(): array
    {
        return [
            'title' => 'judul jadwal',
            'mata_kuliah' => 'mata pelajaran',
            'kelas' => 'kelas',
            'type' => 'jenis jadwal',
            'hari' => 'hari',
            'tanggal' => 'tanggal',
            'jam_mulai' => 'jam mulai',
            'jam_selesai' => 'jam selesai',
            'ruangan' => 'ruang/laboratorium',
            'guru_id' => 'guru pengampu',
            'priority' => 'prioritas',
            'notes' => 'catatan',
        ];
    }
}
