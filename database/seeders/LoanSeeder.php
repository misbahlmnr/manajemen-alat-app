<?php

namespace Database\Seeders;

use App\Models\Equipment;
use App\Models\Loan;
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

        $loan1 = Loan::create([
            'code' => Loan::generateCode(),
            'borrower_id' => $siswa->id,
            'supervisor_id' => $guru->id,
            'item_type' => 'alat',
            'status' => 'diminta',
            'request_date' => Carbon::today(),
            'due_at' => Carbon::today()->addDays(3),
            'purpose' => 'Praktik shooting video',
            'notes' => 'Untuk tugas dokumenter',
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
