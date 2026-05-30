<?php

namespace Database\Seeders;

use App\Models\Loan;
use App\Models\LoanCollateral;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class CollateralSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::query()->where('role', 'admin')->first();

        $loanHeld = Loan::query()
            ->where('borrow_scope', 'bawa_pulang')
            ->where('item_type', 'alat')
            ->whereDoesntHave('collateral')
            ->first();

        if ($loanHeld) {
            LoanCollateral::create([
                'code' => LoanCollateral::generateCode(),
                'loan_id' => $loanHeld->id,
                'student_id' => $loanHeld->borrower_id,
                'card_type' => 'kartu_pelajar',
                'card_number' => $loanHeld->borrower?->nisn,
                'status' => 'ditahan',
                'held_at' => Carbon::now()->subDays(2),
                'held_by_admin_id' => $admin?->id,
                'notes' => 'Kartu ditahan untuk peminjaman bawa pulang.',
            ]);
            $loanHeld->update(['borrow_scope' => 'bawa_pulang']);
        }
    }
}
