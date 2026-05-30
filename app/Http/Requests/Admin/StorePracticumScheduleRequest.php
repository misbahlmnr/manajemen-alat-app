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
        $equipment = $this->input('required_equipment', []);
        if (is_array($equipment)) {
            $equipment = array_values(array_filter($equipment, function ($row) {
                return ! empty($row['equipment_id']);
            }));
        }

        $this->merge(['required_equipment' => $equipment]);
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'mata_kuliah' => ['required', 'string', 'max:100'],
            'kelas' => ['required', 'string', 'max:50'],
            'tanggal' => ['required', 'date'],
            'jam_mulai' => ['required', 'date_format:H:i'],
            'jam_selesai' => ['required', 'date_format:H:i', 'after:jam_mulai'],
            'ruangan' => ['nullable', 'string', 'max:100'],
            'guru_id' => [
                'required',
                'integer',
                Rule::exists(User::class, 'id')->where('role', 'guru'),
            ],
            'priority' => ['required', Rule::in(['normal', 'tinggi', 'lomba'])],
            'status' => ['required', Rule::in(['draft', 'aktif', 'selesai', 'dibatalkan'])],
            'notes' => ['nullable', 'string', 'max:2000'],
            'required_equipment' => ['nullable', 'array'],
            'required_equipment.*.equipment_id' => ['required', 'integer', 'exists:equipment,id'],
            'required_equipment.*.quantity' => ['required', 'integer', 'min:1'],
        ];
    }

    public function attributes(): array
    {
        return [
            'title' => 'judul jadwal',
            'mata_kuliah' => 'mata pelajaran',
            'kelas' => 'kelas',
            'tanggal' => 'tanggal',
            'jam_mulai' => 'jam mulai',
            'jam_selesai' => 'jam selesai',
            'ruangan' => 'ruang/laboratorium',
            'guru_id' => 'guru pengampu',
            'priority' => 'prioritas',
            'status' => 'status',
            'notes' => 'catatan',
        ];
    }
}
