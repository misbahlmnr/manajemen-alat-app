<?php

namespace Database\Seeders;

use App\Models\Equipment;
use App\Models\Loan;
use App\Models\PracticumSchedule;
use App\Models\Submission;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

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

        foreach (['patmawati', 'misbah', 'santi'] as $username) {
            $siswa = User::query()->where('username', $username)->first();
            if (! $siswa) {
                continue;
            }

            $this->createPraktikPackage(
                borrower: $siswa,
                supervisor: $maryadi,
                alat: $alat,
                bahan: $bahan,
                schedule: $schedule,
                requestDate: $praktikDate,
                alatQty: 3,
                bahanQty: 10,
            );
        }

        foreach (['azka', 'azki'] as $username) {
            $siswa = User::query()->where('username', $username)->first();
            if (! $siswa) {
                continue;
            }

            $this->createPribadiLoan(
                borrower: $siswa,
                supervisor: $maryadi,
                alat: $alat,
                requestDate: $praktikDate,
                quantity: 1,
            );
        }
    }

    private function createPraktikPackage(
        User $borrower,
        User $supervisor,
        Equipment $alat,
        ?Equipment $bahan,
        ?PracticumSchedule $schedule,
        Carbon $requestDate,
        int $alatQty,
        int $bahanQty,
    ): void {
        $legacy = Loan::legacyFieldsForType('praktikum');
        $groupId = (string) Str::uuid();
        $date = $requestDate->toDateString();

        $submission = Submission::createForBorrower($borrower, [
            'supervisor_id' => $supervisor->id,
            'purpose' => 'Praktik Lab — Pembuatan Sound',
            'notes' => 'Paket alat dan bahan untuk praktik lab.',
            'request_date' => $date,
        ]);

        $alatLoan = Loan::query()->create([
            'code' => Loan::generateCode(),
            'loan_group_id' => $groupId,
            'submission_id' => $submission->id,
            'borrower_id' => $borrower->id,
            'borrower_class' => $borrower->class,
            'supervisor_id' => $supervisor->id,
            'practicum_schedule_id' => $schedule?->id,
            'item_type' => 'alat',
            'loan_type' => 'praktikum',
            'status' => 'diminta',
            'request_date' => $date,
            'due_at' => $requestDate->copy()->setTime(10, 0),
            'purpose' => 'Praktik Lab — Pembuatan Sound',
            'notes' => 'Alat toolset untuk praktik.',
            'borrow_scope' => $legacy['borrow_scope'],
            'borrow_reason' => $legacy['borrow_reason'],
            'usage_room' => 'Assembly',
            'group_member_count' => 1,
        ]);

        $alatLoan->items()->create([
            'equipment_id' => $alat->id,
            'quantity' => $alatQty,
        ]);

        $alatLoan->statusLogs()->create([
            'status' => 'diminta',
            'note' => 'Pengajuan praktik lab (alat) dibuat dari seeder.',
            'created_at' => now(),
        ]);

        if (! $bahan) {
            return;
        }

        $bahanLoan = Loan::query()->create([
            'code' => Loan::generateCode(),
            'loan_group_id' => $groupId,
            'submission_id' => $submission->id,
            'borrower_id' => $borrower->id,
            'borrower_class' => $borrower->class,
            'supervisor_id' => $supervisor->id,
            'practicum_schedule_id' => $schedule?->id,
            'item_type' => 'bahan',
            'loan_type' => 'praktikum',
            'status' => 'diminta',
            'request_date' => $date,
            'purpose' => 'Praktik Lab — Pembuatan Sound',
            'notes' => 'Bahan untuk praktik.',
            'borrow_scope' => 'lab',
            'borrow_reason' => null,
            'group_member_count' => 1,
        ]);

        $bahanLoan->items()->create([
            'equipment_id' => $bahan->id,
            'quantity' => $bahanQty,
        ]);

        $bahanLoan->statusLogs()->create([
            'status' => 'diminta',
            'note' => 'Pengajuan praktik lab (bahan) dibuat dari seeder.',
            'created_at' => now(),
        ]);
    }

    private function createPribadiLoan(
        User $borrower,
        User $supervisor,
        Equipment $alat,
        Carbon $requestDate,
        int $quantity,
    ): void {
        $legacy = Loan::legacyFieldsForType('pribadi');
        $date = $requestDate->toDateString();

        $submission = Submission::createForBorrower($borrower, [
            'supervisor_id' => $supervisor->id,
            'purpose' => 'Peminjaman pribadi',
            'notes' => 'Latihan mandiri di lab.',
            'request_date' => $date,
        ]);

        $loan = Loan::query()->create([
            'code' => Loan::generateCode(),
            'submission_id' => $submission->id,
            'borrower_id' => $borrower->id,
            'borrower_class' => $borrower->class,
            'supervisor_id' => $supervisor->id,
            'item_type' => 'alat',
            'loan_type' => 'pribadi',
            'status' => 'diminta',
            'request_date' => $date,
            'due_at' => $requestDate->copy()->setTime(15, 0),
            'purpose' => 'Peminjaman pribadi',
            'notes' => 'Latihan mandiri di lab.',
            'borrow_scope' => $legacy['borrow_scope'],
            'borrow_reason' => $legacy['borrow_reason'],
            'usage_room' => 'Assembly',
        ]);

        $loan->items()->create([
            'equipment_id' => $alat->id,
            'quantity' => $quantity,
        ]);

        $loan->statusLogs()->create([
            'status' => 'diminta',
            'note' => 'Pengajuan pribadi dibuat dari seeder.',
            'created_at' => now(),
        ]);
    }
}
