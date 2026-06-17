<?php

namespace Database\Seeders;

use App\Models\Equipment;
use App\Models\Loan;
use App\Models\PracticumSchedule;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class LoanSeeder extends Seeder
{
    public function run(): void
    {
        $siswa = User::query()->where('role', 'siswa')->first();
        $guru = User::query()->where('role', 'guru')->first();
        $alat = Equipment::query()->alat()->first();
        $bahan = Equipment::query()->bahan()->first();

        if (! $siswa || ! $guru || ! $alat) {
            return;
        }

        $schedule = PracticumSchedule::query()
            ->where('kelas', $siswa->class)
            ->first();

        $loan1 = Loan::create([
            'code' => Loan::generateCode(),
            'borrower_id' => $siswa->id,
            'supervisor_id' => $guru->id,
            'practicum_schedule_id' => $schedule?->id,
            'item_type' => 'alat',
            'status' => 'diminta',
            'borrow_scope' => 'lab',
            'borrow_reason' => 'reguler',
            'request_date' => Carbon::today(),
            'due_at' => Carbon::today()->setTime(15, 0),
            'purpose' => 'Praktik sesuai jadwal mapel',
            'notes' => 'Untuk praktikum hari ini',
        ]);
        $loan1->items()->create([
            'equipment_id' => $alat->id,
            'quantity' => 1,
        ]);
        $loan1->statusLogs()->create([
            'status' => 'diminta',
            'note' => 'Pengajuan peminjaman dibuat.',
            'created_at' => now(),
        ]);

        if ($schedule) {
            $loanCatchUp = Loan::create([
                'code' => Loan::generateCode(),
                'borrower_id' => $siswa->id,
                'supervisor_id' => $guru->id,
                'practicum_schedule_id' => $schedule->id,
                'item_type' => 'alat',
                'status' => 'diminta',
                'borrow_scope' => 'lab',
                'borrow_reason' => 'lanjutan',
                'request_date' => Carbon::tomorrow(),
                'due_at' => Carbon::tomorrow()->setTime(15, 0),
                'purpose' => 'Lanjutan praktikum — progress belum selesai',
                'notes' => 'Belum selesai saat jam mapel, melanjutkan di lab besok.',
            ]);
            $loanCatchUp->items()->create([
                'equipment_id' => $alat->id,
                'quantity' => 1,
            ]);
            $loanCatchUp->statusLogs()->create([
                'status' => 'diminta',
                'note' => 'Pengajuan lanjutan praktikum dibuat.',
                'created_at' => now(),
            ]);
        }

        if ($bahan) {
            $loan2 = Loan::create([
                'code' => Loan::generateCode(),
                'borrower_id' => $siswa->id,
                'supervisor_id' => $guru->id,
                'item_type' => 'bahan',
                'status' => 'dipinjam',
                'request_date' => Carbon::today()->subDays(1),
                'borrowed_at' => Carbon::today()->subDays(1),
                'purpose' => 'Praktik elektronika',
            ]);
            $loan2->items()->create([
                'equipment_id' => $bahan->id,
                'quantity' => 2,
            ]);
            $loan2->statusLogs()->create([
                'status' => 'diminta',
                'created_at' => now()->subDays(1),
            ]);
            $loan2->statusLogs()->create([
                'status' => 'dipinjam',
                'note' => 'Bahan disetujui.',
                'created_at' => now()->subDays(1),
            ]);
        }
    }
}
