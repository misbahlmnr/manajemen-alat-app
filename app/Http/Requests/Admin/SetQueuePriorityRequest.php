<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class SetQueuePriorityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        $max = (int) config('lab.queue.max_admin_priority', 1000);

        return [
            'queue_priority' => ['nullable', 'integer', 'min:0', 'max:'.$max],
            'note' => ['nullable', 'string', 'max:500'],
            'use_default' => ['sometimes', 'boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'queue_priority' => 'prioritas antrian',
            'note' => 'catatan prioritas',
        ];
    }
}
