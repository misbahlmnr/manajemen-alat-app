<?php

namespace Database\Seeders;

use App\Models\Equipment;
use App\Models\Loan;
use App\Models\PracticumSchedule;
use App\Models\User;
use App\Services\Loan\StudentLoanSubmissionService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class LoanSeeder extends Seeder
{
    public function run(): void
    {
        $maryadi = User::query()->where('username', 'maryadi')->first();
        $alat = Equipment::query()->alat()->where('name', 'Toolset')->first();
        $bahan = Equipment::query()->bahan()->first();
        $schedule = PracticumSchedule::query()
            ->where('code', 'JADWAL-0001')
            ->first();

        if (! $maryadi || ! $alat) {
            return;
        }

        $praktikDate = Carbon::parse('2026-09-21');
        $submissions = app(StudentLoanSubmissionService::class);

        // 15 peer pool — 4 anggota per ketua (kelompok 5 orang).
        $peerPool = User::query()
            ->where('role', 'siswa')
            ->where('class', 'XI TAV 1')
            ->whereIn('username', [
                'andi', 'budi', 'candra', 'dina', 'eko',
                'fajar', 'gita', 'hadi', 'indra', 'joko',
                'kartika', 'lina', 'maya', 'nanda', 'omar',
            ])
            ->orderBy('id')
            ->pluck('id')
            ->values()
            ->all();

        $groups = [
            ['username' => 'patmawati', 'peers' => array_slice($peerPool, 0, 4)],
            ['username' => 'misbah', 'peers' => array_slice($peerPool, 4, 4)],
            ['username' => 'santi', 'peers' => array_slice($peerPool, 8, 4)],
        ];

        foreach ($groups as $row) {
            $siswa = User::query()->where('username', $row['username'])->first();
            if (! $siswa) {
                continue;
            }

            $date = $praktikDate->toDateString();
            $legacy = Loan::legacyFieldsForType('praktikum');
            $memberIds = array_map('intval', $row['peers']);

            $alatPayload = [
                'item_type' => 'alat',
                'loan_type' => 'praktikum',
                'supervisor_id' => $maryadi->id,
                'practicum_schedule_id' => $schedule?->id,
                'request_date' => $date,
                'purpose' => 'Praktik Lab — Pembuatan Sound',
                'notes' => 'Paket alat dan bahan untuk praktik lab.',
                'borrow_scope' => $legacy['borrow_scope'],
                'borrow_reason' => $legacy['borrow_reason'],
                'usage_room' => $schedule?->ruangan ?: 'Assembly',
                'member_ids' => $memberIds,
                'due_at' => $praktikDate->copy()->setTime(10, 0)->format('Y-m-d H:i:s'),
                'items' => [
                    ['equipment_id' => $alat->id, 'quantity' => 3],
                ],
            ];

            $bahanPayload = $bahan ? [
                'item_type' => 'bahan',
                'loan_type' => 'praktikum',
                'supervisor_id' => $maryadi->id,
                'practicum_schedule_id' => $schedule?->id,
                'request_date' => $date,
                'purpose' => 'Praktik Lab — Pembuatan Sound',
                'notes' => 'Bahan untuk praktik.',
                'items' => [
                    ['equipment_id' => $bahan->id, 'quantity' => 10],
                ],
            ] : ['items' => []];

            $submissions->createPackage($alatPayload, $bahanPayload, $siswa);
        }

        foreach (['azka', 'azki'] as $username) {
            $siswa = User::query()->where('username', $username)->first();
            if (! $siswa) {
                continue;
            }

            $legacy = Loan::legacyFieldsForType('pribadi');

            $submissions->create([
                'item_type' => 'alat',
                'loan_type' => 'pribadi',
                'request_date' => $praktikDate->toDateString(),
                'purpose' => 'Peminjaman pribadi',
                'notes' => 'Latihan mandiri di lab.',
                'borrow_scope' => $legacy['borrow_scope'],
                'borrow_reason' => $legacy['borrow_reason'],
                'usage_room' => 'Assembly',
                'due_at' => $praktikDate->copy()->setTime(15, 0)->format('Y-m-d H:i:s'),
                'items' => [
                    ['equipment_id' => $alat->id, 'quantity' => 1],
                ],
            ], $siswa);
        }
    }
}
