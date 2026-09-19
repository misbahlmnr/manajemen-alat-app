<?php

namespace Tests\Unit\Services\Loan;

use App\Models\Equipment;
use App\Models\Loan;
use App\Models\LoanItem;
use App\Models\Submission;
use App\Models\User;
use App\Services\Loan\SubmissionDecisionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class SubmissionDecisionServiceTest extends TestCase
{
    use RefreshDatabase;

    private SubmissionDecisionService $decisions;

    protected function setUp(): void
    {
        parent::setUp();
        $this->decisions = app(SubmissionDecisionService::class);
    }

    public function test_can_approve_when_all_diminta_and_no_blocking_tool(): void
    {
        [$submission, $alat, $bahan] = $this->makePackage();
        $alat->update(['status' => 'diminta']);
        $bahan->update(['status' => 'diminta']);

        $submission->load('loans');

        $this->assertTrue($this->decisions->canApprove($submission));
        $this->assertTrue($this->decisions->canReject($submission));
        $this->assertFalse($submission->hasBlockingTool());
        $this->assertFalse($this->decisions->hasWaitingMaterial($submission));
    }

    public function test_cannot_approve_when_alat_queued_and_bahan_waiting(): void
    {
        [$submission, $alat, $bahan] = $this->makePackage();
        $alat->update(['status' => 'antrian', 'queued_at' => now()]);
        $bahan->update(['status' => 'menunggu_alat']);

        $submission->load('loans');

        $this->assertTrue($submission->hasBlockingTool());
        $this->assertTrue($this->decisions->hasWaitingMaterial($submission));
        $this->assertFalse($this->decisions->canApprove($submission));
        $this->assertTrue($this->decisions->canReject($submission));
        $this->assertSame('antrian', $submission->aggregateStatus());
    }

    public function test_needs_admin_action_excludes_blocking_tool(): void
    {
        [$waiting] = $this->makePackage('wait');
        $waiting->loans()->update(['status' => 'diminta']);

        [$queued, $queuedAlat, $queuedBahan] = $this->makePackage('queue');
        $queuedAlat->update(['status' => 'antrian', 'queued_at' => now()]);
        $queuedBahan->update(['status' => 'menunggu_alat']);

        $this->assertTrue(
            Submission::query()->needsAdminAction()->whereKey($waiting->id)->exists(),
        );
        $this->assertFalse(
            Submission::query()->needsAdminAction()->whereKey($queued->id)->exists(),
        );
        $this->assertTrue(
            Submission::query()->inLoanQueue()->whereKey($queued->id)->exists(),
        );
    }

    /**
     * @return array{0: Submission, 1: Loan, 2: Loan}
     */
    private function makePackage(string $suffix = 'pkg'): array
    {
        $siswa = User::query()->create([
            'name' => 'Siswa '.$suffix,
            'username' => 'siswa-'.$suffix,
            'email' => $suffix.'@test.local',
            'password' => 'password',
            'role' => 'siswa',
            'status' => 'active',
            'class' => 'X TE 1',
            'nisn' => '0077'.substr(md5($suffix), 0, 6),
        ]);
        $guru = User::query()->create([
            'name' => 'Guru '.$suffix,
            'username' => 'guru-'.$suffix,
            'email' => 'guru-'.$suffix.'@test.local',
            'password' => 'password',
            'role' => 'guru',
            'status' => 'active',
            'nip' => 'NIP'.$suffix,
        ]);

        $alatEq = Equipment::query()->create([
            'code' => 'ALAT-'.$suffix,
            'name' => 'Tool '.$suffix,
            'category' => 'Tools',
            'item_type' => 'alat',
            'stock' => 20,
            'available' => 20,
            'qty_baik' => 20,
            'qty_rusak_ringan' => 0,
            'qty_rusak_berat' => 0,
            'status' => 'tersedia',
            'unit' => 'pcs',
        ]);
        $bahanEq = Equipment::query()->create([
            'code' => 'BAHAN-'.$suffix,
            'name' => 'Supply '.$suffix,
            'category' => 'Tools',
            'item_type' => 'bahan',
            'stock' => 20,
            'available' => 20,
            'qty_baik' => 20,
            'qty_rusak_ringan' => 0,
            'qty_rusak_berat' => 0,
            'status' => 'tersedia',
            'unit' => 'pcs',
        ]);

        $groupId = (string) Str::uuid();
        $submission = Submission::createForBorrower($siswa, [
            'supervisor_id' => $guru->id,
            'purpose' => 'Tes',
            'request_date' => now()->toDateString(),
        ]);

        $alat = Loan::query()->create([
            'code' => Loan::generateCode(),
            'loan_group_id' => $groupId,
            'submission_id' => $submission->id,
            'borrower_id' => $siswa->id,
            'supervisor_id' => $guru->id,
            'item_type' => 'alat',
            'loan_type' => 'pribadi',
            'status' => 'diminta',
            'queue_priority' => 0,
            'request_date' => now()->toDateString(),
            'purpose' => 'Tes',
            'borrow_scope' => 'lab',
            'borrow_reason' => 'lanjutan',
            'due_at' => now()->addHours(2),
        ]);
        LoanItem::query()->create([
            'loan_id' => $alat->id,
            'equipment_id' => $alatEq->id,
            'quantity' => 1,
        ]);

        $bahan = Loan::query()->create([
            'code' => Loan::generateCode(),
            'loan_group_id' => $groupId,
            'submission_id' => $submission->id,
            'borrower_id' => $siswa->id,
            'supervisor_id' => $guru->id,
            'item_type' => 'bahan',
            'loan_type' => 'pribadi',
            'status' => 'diminta',
            'queue_priority' => 0,
            'request_date' => now()->toDateString(),
            'purpose' => 'Tes',
            'borrow_scope' => 'lab',
        ]);
        LoanItem::query()->create([
            'loan_id' => $bahan->id,
            'equipment_id' => $bahanEq->id,
            'quantity' => 1,
        ]);

        return [$submission->fresh(), $alat->fresh(), $bahan->fresh()];
    }
}
