<?php

namespace Tests\Unit\Services\Loan;

use App\Models\Equipment;
use App\Models\Loan;
use App\Models\LoanItem;
use App\Models\Submission;
use App\Models\User;
use App\Services\Loan\LoanMaterialAvailabilityService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class LoanMaterialAvailabilityServiceTest extends TestCase
{
    use RefreshDatabase;

    private LoanMaterialAvailabilityService $materials;

    protected function setUp(): void
    {
        parent::setUp();
        $this->materials = app(LoanMaterialAvailabilityService::class);
    }

    public function test_remaining_subtracts_pending_bahan_requests_from_warehouse_available(): void
    {
        $bahan = $this->makeBahan(stock: 100, available: 100);
        $this->makeBahanLoan($bahan, 30, 'diminta');
        $this->makeBahanLoan($bahan, 20, 'diminta');
        $this->makeBahanLoan($bahan, 40, 'antrian');

        $this->assertSame(100, (int) $bahan->fresh()->available);
        $this->assertSame(10, $this->materials->remaining($bahan));
    }

    public function test_approved_bahan_already_reflected_in_available_is_not_double_counted(): void
    {
        // Setelah approve 30, available gudang = 70; pending diminta 50.
        $bahan = $this->makeBahan(stock: 100, available: 70);
        $this->makeBahanLoan($bahan, 30, 'dipinjam', stockHeld: true);
        $this->makeBahanLoan($bahan, 50, 'diminta');

        $this->assertSame(20, $this->materials->remaining($bahan));
    }

    public function test_empty_warehouse_with_no_pending_is_zero(): void
    {
        $bahan = $this->makeBahan(stock: 10, available: 0);

        $this->assertSame(0, $this->materials->remaining($bahan));
    }

    public function test_except_loan_id_is_ignored_from_pending(): void
    {
        $bahan = $this->makeBahan(stock: 50, available: 50);
        $loan = $this->makeBahanLoan($bahan, 20, 'diminta');

        $this->assertSame(30, $this->materials->remaining($bahan));
        $this->assertSame(50, $this->materials->remaining($bahan, $loan->id));
    }

    private function makeBahan(int $stock, int $available): Equipment
    {
        return Equipment::query()->create([
            'code' => 'BHN-'.Str::upper(Str::random(4)),
            'name' => 'Bahan Tes',
            'category' => 'Komponen',
            'item_type' => 'bahan',
            'stock' => $stock,
            'available' => $available,
            'qty_baik' => $available,
            'qty_rusak_ringan' => 0,
            'qty_rusak_berat' => 0,
            'unit' => 'pcs',
            'status' => 'tersedia',
            'min_stock' => 0,
        ]);
    }

    private function makeBahanLoan(
        Equipment $bahan,
        int $quantity,
        string $status,
        bool $stockHeld = false,
    ): Loan {
        $siswa = User::query()->create([
            'name' => 'Siswa '.Str::random(4),
            'username' => 'siswa-'.Str::lower(Str::random(6)),
            'email' => Str::lower(Str::random(6)).'@test.local',
            'password' => 'password',
            'role' => 'siswa',
            'status' => 'active',
            'nisn' => '00'.substr(md5((string) microtime(true)), 0, 8),
            'class' => 'X TE 1',
        ]);

        $submission = Submission::createForBorrower($siswa, [
            'purpose' => 'Tes bahan',
            'request_date' => now()->toDateString(),
        ]);

        $loan = Loan::query()->create([
            'code' => Loan::generateCode(),
            'submission_id' => $submission->id,
            'borrower_id' => $siswa->id,
            'item_type' => 'bahan',
            'loan_type' => 'praktikum',
            'status' => $status,
            'queued_at' => $status === 'antrian' ? now() : null,
            'request_date' => now()->toDateString(),
            'purpose' => 'Tes bahan',
            'borrow_scope' => 'lab',
            'stock_held' => $stockHeld,
        ]);

        LoanItem::query()->create([
            'loan_id' => $loan->id,
            'equipment_id' => $bahan->id,
            'quantity' => $quantity,
        ]);

        return $loan->fresh();
    }
}
