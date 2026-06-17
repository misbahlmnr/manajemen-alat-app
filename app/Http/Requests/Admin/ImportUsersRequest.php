<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class ImportUsersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        $extensions = config('lab.user_import.allowed_extensions', ['xlsx', 'xls', 'csv']);
        $mimes = implode(',', $extensions);

        return [
            'file' => ['required', 'file', 'mimes:'.$mimes, 'max:5120'],
        ];
    }

    public function attributes(): array
    {
        return [
            'file' => 'file Excel',
        ];
    }

    public function messages(): array
    {
        return [
            'file.mimes' => 'File harus berformat .xlsx, .xls, atau .csv.',
            'file.max' => 'Ukuran file maksimal 5 MB.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $file = $this->file('file');

            if ($file === null) {
                return;
            }

            $extension = strtolower($file->getClientOriginalExtension());
            $allowed = config('lab.user_import.allowed_extensions', ['xlsx', 'xls', 'csv']);

            if (! in_array($extension, $allowed, true)) {
                $validator->errors()->add('file', 'Ekstensi file tidak didukung.');
            }
        });
    }
}
