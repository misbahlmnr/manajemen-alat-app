<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        $user = $this->route('user');
        $role = $this->input('role', $user?->role ?? 'siswa');

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique(User::class)->ignore($user)],
            'username' => ['required', 'string', 'max:255', Rule::unique(User::class)->ignore($user)],
            'password' => ['nullable', 'confirmed', Password::defaults()],
            'role' => ['required', Rule::in(['admin', 'guru', 'siswa'])],
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'phone' => ['nullable', 'string', 'max:20'],
            'class' => [Rule::requiredIf($role === 'siswa'), 'nullable', 'string', 'max:50'],
            'nisn' => [
                Rule::requiredIf($role === 'siswa'),
                'nullable',
                'string',
                'max:20',
                Rule::unique('users', 'nisn')->ignore($user),
            ],
            'nip' => [Rule::requiredIf(in_array($role, ['guru', 'admin'], true)), 'nullable', 'string', 'max:30'],
        ];
    }

    public function attributes(): array
    {
        return (new StoreUserRequest)->attributes();
    }
}
