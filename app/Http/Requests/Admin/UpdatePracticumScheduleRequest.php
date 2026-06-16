<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePracticumScheduleRequest extends FormRequest
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
        return (new StorePracticumScheduleRequest)->rules();
    }

    public function attributes(): array
    {
        return (new StorePracticumScheduleRequest)->attributes();
    }
}
