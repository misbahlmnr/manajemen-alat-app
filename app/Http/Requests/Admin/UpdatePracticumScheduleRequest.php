<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePracticumScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('required_equipment')) {
            $equipment = $this->input('required_equipment', []);
            if (is_array($equipment)) {
                $equipment = array_values(array_filter($equipment, function ($row) {
                    return ! empty($row['equipment_id']);
                }));
            }
            $this->merge(['required_equipment' => $equipment]);
        }
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
