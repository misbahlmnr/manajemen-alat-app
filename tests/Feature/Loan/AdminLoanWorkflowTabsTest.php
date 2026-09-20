<?php

namespace Tests\Feature\Loan;

use App\Models\Equipment;
use App\Models\Loan;
use App\Models\LoanItem;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class AdminLoanWorkflowTabsTest extends TestCase
{
    use RefreshDatabase;

    public function test_workflow_tabs_have_single_home_per_stage(): void
    {
        $admin = $this->makeUser('admin', 'admin-tabs');
        $siswa = $this->makeUser('siswa', 'siswa-tabs');
        $guru = $this->makeUser('guru', 'guru-tabs');

        $waiting = $this->makeSubmissionWithLoan($siswa, $guru, 'diminta', 'wait');
        $queuedAlat = $this->makeSubmissionWithLoan($siswa, $guru, 'antrian', 'queue', queued: true);
        $handover = $this->makeSubmissionWithLoan($siswa, $guru, 'disetujui', 'hand');
        $borrowed = $this->makeSubmissionWithLoan($siswa, $guru, 'dipinjam', 'borrow', borrowedAt: now());
        $takenBahan = $this->makeBahanTakenSubmission($siswa, $guru, 'taken');
        $returns = $this->makeSubmissionWithLoan($siswa, $guru, 'menunggu_inspeksi', 'ret');

        $this->assertTrue(Submission::query()->needingApproval()->whereKey($waiting->id)->exists());
        $this->assertFalse(Submission::query()->needingApproval()->whereKey($queuedAlat->id)->exists());
        $this->assertTrue(Submission::query()->inLoanQueue()->whereKey($queuedAlat->id)->exists());
        $this->assertTrue(Submission::query()->needingHandover()->whereKey($handover->id)->exists());
        $this->assertTrue(Submission::query()->currentlyBorrowed()->whereKey($borrowed->id)->exists());
        $this->assertTrue(Submission::query()->currentlyBorrowed()->whereKey($takenBahan->id)->exists());
        $this->assertFalse(Submission::query()->currentlyBorrowed()->whereKey($returns->id)->exists());
        $this->assertTrue(Submission::query()->needingReturnInspection()->whereKey($returns->id)->exists());
        $this->assertFalse(Submission::query()->needingReturnInspection()->whereKey($takenBahan->id)->exists());

        $this->assertSingleWorkflowHome($waiting, 'needingApproval');
        $this->assertSingleWorkflowHome($queuedAlat, 'inLoanQueue');
        $this->assertSingleWorkflowHome($handover, 'needingHandover');
        $this->assertSingleWorkflowHome($borrowed, 'currentlyBorrowed');
        $this->assertSingleWorkflowHome($takenBahan, 'currentlyBorrowed');
        $this->assertSingleWorkflowHome($returns, 'needingReturnInspection');

        $this->actingAs($admin)
            ->get(route('admin.loans.index', ['scope' => 'borrowed']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('filters.scope', 'borrowed')
                ->has('loans.data', 2)
            );

        $this->actingAs($admin)
            ->get(route('admin.loans.index', ['scope' => 'returns']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('filters.scope', 'returns')
                ->has('loans.data', 1)
                ->where('loans.data.0.code', $returns->code)
            );

        $this->actingAs($admin)
            ->get(route('admin.loans.index', ['scope' => 'today']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('filters.scope', 'borrowed'));
    }

    public function test_package_and_status_combinations_have_single_workflow_home(): void
    {
        $siswa = $this->makeUser('siswa', 'siswa-pkg');
        $guru = $this->makeUser('guru', 'guru-pkg');

        // 1. Alat dipinjam
        $alatDipinjam = $this->makeSubmissionWithLoan($siswa, $guru, 'dipinjam', 'a1', borrowedAt: now());
        $this->assertSingleWorkflowHome($alatDipinjam, 'currentlyBorrowed');

        // 2. Alat dipinjam + bahan diambil
        $paketDipinjam = $this->makePackageSubmission($siswa, $guru, 'a2', 'dipinjam', 'diambil');
        $this->assertSingleWorkflowHome($paketDipinjam, 'currentlyBorrowed');

        // 3. Alat menunggu inspeksi + bahan diambil
        $paketInspeksi = $this->makePackageSubmission($siswa, $guru, 'a3', 'menunggu_inspeksi', 'diambil');
        $this->assertSingleWorkflowHome($paketInspeksi, 'needingReturnInspection');
        $this->assertFalse(Submission::query()->currentlyBorrowed()->whereKey($paketInspeksi->id)->exists());

        // 4. Alat dikembalikan + bahan diambil
        $paketReturned = $this->makePackageSubmission($siswa, $guru, 'a4', 'dikembalikan', 'diambil');
        $this->assertFalse(Submission::query()->currentlyBorrowed()->whereKey($paketReturned->id)->exists());
        $this->assertFalse(Submission::query()->needingReturnInspection()->whereKey($paketReturned->id)->exists());
        $this->assertCount(0, $this->workflowHomesFor($paketReturned));

        // 5. Bahan-only diambil
        $bahanOnly = $this->makeBahanTakenSubmission($siswa, $guru, 'a5');
        $this->assertSingleWorkflowHome($bahanOnly, 'currentlyBorrowed');

        // 6. Alat terlambat
        $terlambat = $this->makeSubmissionWithLoan($siswa, $guru, 'terlambat', 'a6', borrowedAt: now()->subDay());
        $this->assertSingleWorkflowHome($terlambat, 'currentlyBorrowed');

        // 7. Return inspection murni
        $returnMurni = $this->makeSubmissionWithLoan($siswa, $guru, 'menunggu_inspeksi', 'a7');
        $this->assertSingleWorkflowHome($returnMurni, 'needingReturnInspection');
    }

    /**
     * @return list<string>
     */
    private function workflowHomesFor(Submission $submission): array
    {
        $homes = [];

        if (Submission::query()->needingApproval()->whereKey($submission->id)->exists()) {
            $homes[] = 'needingApproval';
        }
        if (Submission::query()->inLoanQueue()->whereKey($submission->id)->exists()) {
            $homes[] = 'inLoanQueue';
        }
        if (Submission::query()->needingHandover()->whereKey($submission->id)->exists()) {
            $homes[] = 'needingHandover';
        }
        if (Submission::query()->currentlyBorrowed()->whereKey($submission->id)->exists()) {
            $homes[] = 'currentlyBorrowed';
        }
        if (Submission::query()->needingReturnInspection()->whereKey($submission->id)->exists()) {
            $homes[] = 'needingReturnInspection';
        }

        return $homes;
    }

    private function assertSingleWorkflowHome(Submission $submission, string $expectedHome): void
    {
        $homes = $this->workflowHomesFor($submission);

        $this->assertSame(
            [$expectedHome],
            $homes,
            "Submission {$submission->code} expected sole home [{$expectedHome}], got [".implode(', ', $homes).']',
        );
    }

    private function makePackageSubmission(
        User $siswa,
        User $guru,
        string $suffix,
        string $alatStatus,
        string $bahanStatus,
    ): Submission {
        $alatEq = Equipment::query()->create([
            'code' => 'EQ-'.$suffix,
            'name' => 'Alat '.$suffix,
            'category' => 'Tools',
            'item_type' => 'alat',
            'stock' => 10,
            'available' => 10,
            'qty_baik' => 10,
            'qty_rusak_ringan' => 0,
            'qty_rusak_berat' => 0,
            'status' => 'tersedia',
            'unit' => 'pcs',
        ]);

        $bahanEq = Equipment::query()->create([
            'code' => 'BH-'.$suffix,
            'name' => 'Bahan '.$suffix,
            'category' => 'Tools',
            'item_type' => 'bahan',
            'stock' => 10,
            'available' => 5,
            'qty_baik' => 10,
            'qty_rusak_ringan' => 0,
            'qty_rusak_berat' => 0,
            'status' => 'tersedia',
            'unit' => 'pcs',
        ]);

        $submission = Submission::createForBorrower($siswa, [
            'supervisor_id' => $guru->id,
            'purpose' => 'Tes paket '.$suffix,
            'request_date' => now()->toDateString(),
        ]);

        $groupId = (string) Str::uuid();

        $alatLoan = Loan::query()->create([
            'code' => Loan::generateCode(),
            'loan_group_id' => $groupId,
            'submission_id' => $submission->id,
            'borrower_id' => $siswa->id,
            'supervisor_id' => $guru->id,
            'item_type' => 'alat',
            'loan_type' => 'praktikum',
            'status' => $alatStatus,
            'queue_priority' => 0,
            'request_date' => now()->toDateString(),
            'purpose' => 'Tes paket',
            'borrow_scope' => 'lab',
            'borrow_reason' => 'lanjutan',
            'borrowed_at' => now(),
            'due_at' => now()->addHours(2),
            'returned_at' => $alatStatus === 'dikembalikan' ? now() : null,
        ]);

        LoanItem::query()->create([
            'loan_id' => $alatLoan->id,
            'equipment_id' => $alatEq->id,
            'quantity' => 1,
        ]);

        $bahanLoan = Loan::query()->create([
            'code' => Loan::generateCode(),
            'loan_group_id' => $groupId,
            'submission_id' => $submission->id,
            'borrower_id' => $siswa->id,
            'supervisor_id' => $guru->id,
            'item_type' => 'bahan',
            'loan_type' => 'praktikum',
            'status' => $bahanStatus,
            'queue_priority' => 0,
            'stock_held' => true,
            'request_date' => now()->toDateString(),
            'purpose' => 'Tes paket',
            'borrowed_at' => now(),
        ]);

        LoanItem::query()->create([
            'loan_id' => $bahanLoan->id,
            'equipment_id' => $bahanEq->id,
            'quantity' => 1,
        ]);

        return $submission->fresh();
    }

    private function makeSubmissionWithLoan(
        User $siswa,
        User $guru,
        string $status,
        string $suffix,
        bool $queued = false,
        $borrowedAt = null,
    ): Submission {
        $eq = Equipment::query()->create([
            'code' => 'EQ-'.$suffix,
            'name' => 'Item '.$suffix,
            'category' => 'Tools',
            'item_type' => 'alat',
            'stock' => 10,
            'available' => 10,
            'qty_baik' => 10,
            'qty_rusak_ringan' => 0,
            'qty_rusak_berat' => 0,
            'status' => 'tersedia',
            'unit' => 'pcs',
        ]);

        $submission = Submission::createForBorrower($siswa, [
            'supervisor_id' => $guru->id,
            'purpose' => 'Tes tab '.$suffix,
            'request_date' => now()->toDateString(),
        ]);

        $loan = Loan::query()->create([
            'code' => Loan::generateCode(),
            'loan_group_id' => (string) Str::uuid(),
            'submission_id' => $submission->id,
            'borrower_id' => $siswa->id,
            'supervisor_id' => $guru->id,
            'item_type' => 'alat',
            'loan_type' => 'pribadi',
            'status' => $status,
            'queue_priority' => 0,
            'queued_at' => $queued ? now() : null,
            'request_date' => now()->toDateString(),
            'purpose' => 'Tes tab',
            'borrow_scope' => 'lab',
            'borrow_reason' => 'lanjutan',
            'borrowed_at' => $borrowedAt,
            'due_at' => now()->addHours(2),
        ]);

        LoanItem::query()->create([
            'loan_id' => $loan->id,
            'equipment_id' => $eq->id,
            'quantity' => 1,
        ]);

        return $submission->fresh();
    }

    private function makeBahanTakenSubmission(User $siswa, User $guru, string $suffix): Submission
    {
        $eq = Equipment::query()->create([
            'code' => 'BH-'.$suffix,
            'name' => 'Bahan '.$suffix,
            'category' => 'Tools',
            'item_type' => 'bahan',
            'stock' => 10,
            'available' => 5,
            'qty_baik' => 10,
            'qty_rusak_ringan' => 0,
            'qty_rusak_berat' => 0,
            'status' => 'tersedia',
            'unit' => 'pcs',
        ]);

        $submission = Submission::createForBorrower($siswa, [
            'supervisor_id' => $guru->id,
            'purpose' => 'Tes bahan '.$suffix,
            'request_date' => now()->toDateString(),
        ]);

        $loan = Loan::query()->create([
            'code' => Loan::generateCode(),
            'loan_group_id' => (string) Str::uuid(),
            'submission_id' => $submission->id,
            'borrower_id' => $siswa->id,
            'supervisor_id' => $guru->id,
            'item_type' => 'bahan',
            'loan_type' => 'praktikum',
            'status' => 'diambil',
            'queue_priority' => 0,
            'stock_held' => true,
            'request_date' => now()->toDateString(),
            'purpose' => 'Tes bahan',
            'borrowed_at' => now(),
        ]);

        LoanItem::query()->create([
            'loan_id' => $loan->id,
            'equipment_id' => $eq->id,
            'quantity' => 1,
        ]);

        return $submission->fresh();
    }

    private function makeUser(string $role, string $username): User
    {
        return User::query()->create([
            'name' => ucfirst($username),
            'username' => $username,
            'email' => $username.'@test.local',
            'password' => 'password',
            'role' => $role,
            'status' => 'active',
            'class' => $role === 'siswa' ? 'X TE 1' : null,
            'nip' => $role !== 'siswa' ? strtoupper($username) : null,
            'nisn' => $role === 'siswa' ? '0077'.substr(md5($username), 0, 6) : null,
        ]);
    }
}
