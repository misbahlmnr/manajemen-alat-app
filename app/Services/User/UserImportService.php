<?php

namespace App\Services\User;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class UserImportService
{
    private const HEADER_ALIASES = [
        'nama' => 'name',
        'name' => 'name',
        'email' => 'email',
        'role' => 'role',
        'status' => 'status',
        'telepon' => 'phone',
        'phone' => 'phone',
        'no_telepon' => 'phone',
        'nisn' => 'nisn',
        'nip' => 'nip',
        'kelas' => 'class',
        'class' => 'class',
        'password' => 'password',
        'kata_sandi' => 'password',
    ];

    public function importFromFile(UploadedFile $file): UserImportResult
    {
        try {
            $rows = $this->parseRows($file);
        } catch (\Throwable $exception) {
            return new UserImportResult(errors: [
                0 => 'File tidak dapat dibaca: '.$exception->getMessage(),
            ], failed: 1);
        }

        if ($rows === []) {
            return new UserImportResult(errors: [
                0 => 'File tidak memiliki data pengguna. Pastikan ada baris data selain header.',
            ], failed: 1);
        }

        $maxRows = (int) config('lab.user_import.max_rows', 500);

        if (count($rows) > $maxRows) {
            return new UserImportResult(errors: [
                0 => "Maksimal {$maxRows} baris data per import.",
            ], failed: 1);
        }

        return $this->importRows($rows);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function parseRows(UploadedFile $file): array
    {
        $spreadsheet = IOFactory::load($file->getRealPath());
        $sheet = $spreadsheet->getActiveSheet();
        $matrix = $sheet->toArray(null, true, true, false);

        if ($matrix === []) {
            return [];
        }

        $headerRow = array_shift($matrix);
        $columnMap = $this->mapHeaders($headerRow);

        if (! in_array('name', $columnMap, true) || ! in_array('email', $columnMap, true)) {
            throw new \RuntimeException('Kolom wajib "nama" dan "email" tidak ditemukan pada baris header.');
        }

        $rows = [];
        $excelRowNumber = 2;

        foreach ($matrix as $row) {
            if ($this->isEmptyRow($row)) {
                $excelRowNumber++;

                continue;
            }

            $parsed = [];

            foreach ($columnMap as $columnIndex => $field) {
                $parsed[$field] = $this->normalizeCellValue($row[$columnIndex] ?? null);
            }

            $parsed['_row'] = $excelRowNumber;
            $rows[] = $parsed;
            $excelRowNumber++;
        }

        return $rows;
    }

    /**
     * @param  array<int, string|null>  $headerRow
     * @return array<int, string>
     */
    private function mapHeaders(array $headerRow): array
    {
        $map = [];

        foreach ($headerRow as $index => $header) {
            $normalized = $this->normalizeHeader((string) $header);

            if ($normalized === '' || ! isset(self::HEADER_ALIASES[$normalized])) {
                continue;
            }

            $map[$index] = self::HEADER_ALIASES[$normalized];
        }

        return $map;
    }

    private function normalizeHeader(string $header): string
    {
        $header = Str::lower(trim($header));
        $header = str_replace([' ', '.'], ['_', ''], $header);

        return $header;
    }

    private function normalizeCellValue(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $string = trim((string) $value);

        return $string === '' ? null : $string;
    }

    /**
     * @param  array<int, mixed>  $row
     */
    private function isEmptyRow(array $row): bool
    {
        foreach ($row as $cell) {
            if ($this->normalizeCellValue($cell) !== null) {
                return false;
            }
        }

        return true;
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     */
    private function importRows(array $rows): UserImportResult
    {
        $result = new UserImportResult;
        $seenEmails = [];
        $seenNisn = [];

        foreach ($rows as $row) {
            $rowNumber = (int) ($row['_row'] ?? 0);
            unset($row['_row']);

            $role = Str::lower($row['role'] ?? 'siswa');
            $row['role'] = $role;
            $row['status'] = Str::lower($row['status'] ?? 'active');
            $row['email'] = Str::lower($row['email'] ?? '');

            if (isset($seenEmails[$row['email']])) {
                $result->failed++;
                $result->errors[$rowNumber] = 'Email duplikat di file (sama dengan baris '.$seenEmails[$row['email']].').';

                continue;
            }

            if ($role === 'siswa' && filled($row['nisn'] ?? null)) {
                if (isset($seenNisn[$row['nisn']])) {
                    $result->failed++;
                    $result->errors[$rowNumber] = 'NISN duplikat di file (sama dengan baris '.$seenNisn[$row['nisn']].').';

                    continue;
                }

                $seenNisn[$row['nisn']] = $rowNumber;
            }

            $seenEmails[$row['email']] = $rowNumber;

            $password = $row['password'] ?? null;
            unset($row['password']);

            $validationData = $row;

            if (filled($password)) {
                $validationData['password'] = $password;
            }

            $validator = Validator::make(
                $validationData,
                $this->rulesForRow($role, $password),
                [],
                $this->attributeLabels(),
            );

            if ($validator->fails()) {
                $result->failed++;
                $result->errors[$rowNumber] = collect($validator->errors()->all())->implode(' ');

                continue;
            }

            $validated = $validator->validated();
            $validated['password'] = $this->resolvePassword($role, $validated, $password);
            $validated['username'] = User::generateUsername($validated['email'], $validated['name']);

            if ($validated['role'] !== 'siswa') {
                $validated['class'] = null;
                $validated['nisn'] = null;
            }

            if (! in_array($validated['role'], ['guru', 'admin'], true)) {
                $validated['nip'] = null;
            }

            User::create($validated);
            $result->imported++;
        }

        return $result;
    }

    /**
     * @return array<string, mixed>
     */
    private function rulesForRow(string $role, ?string $password): array
    {
        $classOptions = config('lab.class_options', []);

        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:'.User::class],
            'role' => ['required', Rule::in(['admin', 'guru', 'siswa'])],
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'phone' => ['nullable', 'string', 'max:20'],
            'class' => [Rule::requiredIf($role === 'siswa'), 'nullable', 'string', 'max:50', Rule::in($classOptions)],
            'nisn' => [Rule::requiredIf($role === 'siswa'), 'nullable', 'string', 'max:20', 'unique:users,nisn'],
            'nip' => [Rule::requiredIf(in_array($role, ['guru', 'admin'], true)), 'nullable', 'string', 'max:30'],
        ];

        if (filled($password)) {
            $rules['password'] = ['string', Password::defaults()];
        }

        return $rules;
    }

    /**
     * @return array<string, string>
     */
    private function attributeLabels(): array
    {
        return [
            'name' => 'nama',
            'email' => 'email',
            'role' => 'role',
            'status' => 'status',
            'phone' => 'telepon',
            'class' => 'kelas',
            'nisn' => 'NISN',
            'nip' => 'NIP',
            'password' => 'kata sandi',
        ];
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function resolvePassword(string $role, array $validated, ?string $providedPassword): string
    {
        if (filled($providedPassword)) {
            return $providedPassword;
        }

        if ($role === 'siswa' && filled($validated['nisn'] ?? null)) {
            return (string) $validated['nisn'];
        }

        if (in_array($role, ['guru', 'admin'], true) && filled($validated['nip'] ?? null)) {
            return (string) $validated['nip'];
        }

        return (string) config('lab.user_import.default_password', 'Password123');
    }

    public function downloadTemplate(): StreamedResponse
    {
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Template Import');

        $headers = [
            'nama',
            'email',
            'role',
            'status',
            'telepon',
            'nisn',
            'nip',
            'kelas',
            'password',
        ];

        $sheet->fromArray($headers, null, 'A1');
        $sheet->fromArray([
            [
                'Budi Santoso',
                'budi.santoso@smkn7bekasi.sch.id',
                'siswa',
                'active',
                '081234567890',
                '0051234567',
                '',
                'XII TAV 1',
                '',
            ],
            [
                'Siti Nurhaliza, S.Pd',
                'siti.nurhaliza@smkn7bekasi.sch.id',
                'guru',
                'active',
                '081298765432',
                '',
                '198501152010011001',
                '',
                '',
            ],
        ], null, 'A2');

        $referenceSheet = $spreadsheet->createSheet();
        $referenceSheet->setTitle('Referensi Kelas');
        $referenceSheet->setCellValue('A1', 'Kelas Valid');
        $classOptions = config('lab.class_options', []);

        foreach ($classOptions as $index => $class) {
            $referenceSheet->setCellValue('A'.($index + 2), $class);
        }

        $referenceSheet->setCellValue('C1', 'Role Valid');
        $referenceSheet->fromArray([['siswa'], ['guru'], ['admin']], null, 'C2');
        $referenceSheet->setCellValue('E1', 'Status Valid');
        $referenceSheet->fromArray([['active'], ['inactive']], null, 'E2');

        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(function () use ($writer): void {
            $writer->save('php://output');
        }, 'template-import-pengguna.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }
}
