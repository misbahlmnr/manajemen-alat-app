<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use App\Support\AcademicYear;
use App\Support\ClassOptions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        $role = $this->input('role', 'siswa');

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:'.User::class],
            'username' => ['nullable', 'string', 'max:255', 'unique:'.User::class],
            'password' => ['required', 'confirmed', Password::defaults()],
            'role' => ['required', Rule::in(['admin', 'guru', 'siswa'])],
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'phone' => ['nullable', 'string', 'max:20'],
            'class' => [
                Rule::requiredIf($role === 'siswa'),
                'nullable',
                'string',
                'max:50',
                Rule::in(ClassOptions::namesAllowing()),
            ],
            'angkatan' => [
                Rule::requiredIf($role === 'siswa'),
                'nullable',
                'string',
                'max:9',
                AcademicYear::assertValid(),
                Rule::in(AcademicYear::namesAllowing()),
            ],
            'nisn' => [Rule::requiredIf($role === 'siswa'), 'nullable', 'string', 'max:20', 'unique:users,nisn'],
            'nip' => [Rule::requiredIf(in_array($role, ['guru', 'admin'], true)), 'nullable', 'string', 'max:30'],
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => 'nama lengkap',
            'email' => 'email',
            'username' => 'username',
            'password' => 'kata sandi',
            'role' => 'role',
            'status' => 'status',
            'phone' => 'telepon',
            'class' => 'kelas',
            'angkatan' => 'angkatan',
            'nisn' => 'NISN',
            'nip' => 'NIP',
        ];
    }
}
