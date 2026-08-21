<?php

namespace Tests\Unit\Models;

use App\Models\Equipment;
use App\Models\Loan;
use App\Models\LoanItem;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class SubmissionAggregateStatusTest extends TestCase
{
    use RefreshDatabase;

    public function test_all_diminta_is_menunggu_persetujuan(): void
    {
        [$submission, $alat, $bahan] = $this->makePackageSubmission();
        $alat->update(['status' => 'diminta']);
        $bahan->update(['status' => 'diminta']);

        $this->assertSame('diminta', $submission->fresh()->load('loans')->aggregateStatus());
        $this->assertSame(
            'Alat: Menunggu Persetujuan · Bahan: Menunggu Persetujuan',
            $submission->fresh()->load('loans')->statusSummary(),
        );
    }

    public function test_antrian_takes_priority_even_if_bahan_approved(): void
    {
        [$submission, $alat, $bahan] = $this->makePackageSubmission();
        $alat->update(['status' => 'antrian', 'queued_at' => now()]);
        $bahan->update(['status' => 'disetujui']);

        $this->assertSame('antrian', $submission->fresh()->load('loans')->aggregateStatus());
        $this->assertStringContainsString('Alat: Antrian', $submission->fresh()->load('loans')->statusSummary());
        $this->assertStringContainsString('Bahan: Disetujui', $submission->fresh()->load('loans')->statusSummary());
    }

    public function test_mixed_progress_is_diproses(): void
    {
        [$submission, $alat, $bahan] = $this->makePackageSubmission();
        $alat->update(['status' => 'diminta']);
        $bahan->update(['status' => 'disetujui']);

        $this->assertSame('diproses', $submission->fresh()->load('loans')->aggregateStatus());
    }

    public function test_both_approved_still_diproses(): void
    {
        [$submission, $alat, $bahan] = $this->makePackageSubmission();
        $alat->update(['status' => 'disetujui']);
        $bahan->update(['status' => 'disetujui']);

        $this->assertSame('diproses', $submission->fresh()->load('loans')->aggregateStatus());
    }

    public function test_alat_dikembalikan_and_bahan_diambil_is_selesai(): void
    {
        [$submission, $alat, $bahan] = $this->makePackageSubmission();
        $alat->update(['status' => 'dikembalikan']);
        $bahan->update(['status' => 'dipinjam']);

        $this->assertSame('selesai', $submission->fresh()->load('loans')->aggregateStatus());
        $this->assertSame(
            'Alat: Dikembalikan · Bahan: Diambil',
            $submission->fresh()->load('loans')->statusSummary(),
        );
    }

    public function test_all_cancelled_is_dibatalkan(): void
    {
        [$submission, $alat, $bahan] = $this->makePackageSubmission();
        $alat->update(['status' => 'dibatalkan']);
        $bahan->update(['status' => 'ditolak']);

        $this->assertSame('dibatalkan', $submission->fresh()->load('loans')->aggregateStatus());
    }

    public function test_scope_filters_match_aggregate_status(): void
    {
        [$waiting] = $this->makePackageSubmission('wait');
        $waiting->loans()->update(['status' => 'diminta']);

        [$queued, $queuedAlat, $queuedBahan] = $this->makePackageSubmission('queue');
        $queuedAlat->update(['status' => 'antrian', 'queued_at' => now()]);
        $queuedBahan->update(['status' => 'disetujui']);

        [$done, $doneAlat, $doneBahan] = $this->makePackageSubmission('done');
        $doneAlat->update(['status' => 'dikembalikan']);
        $doneBahan->update(['status' => 'dipinjam']);

        $this->assertTrue(
            Submission::query()->whereAggregateStatus('diminta')->whereKey($waiting->id)->exists(),
        );
        $this->assertTrue(
            Submission::query()->whereAggregateStatus('antrian')->whereKey($queued->id)->exists(),
        );
        $this->assertTrue(
            Submission::query()->whereAggregateStatus('selesai')->whereKey($done->id)->exists(),
        );
        $this->assertFalse(
            Submission::query()->whereAggregateStatus('antrian')->whereKey($waiting->id)->exists(),
        );
    }

    /**
     * @return array{0: Submission, 1: Loan, 2: Loan}
     */
    private function makePackageSubmission(string $suffix = 'pkg'): array
    {
        $siswa = $this->makeUser('siswa', 'siswa-'.$suffix);
        $guru = $this->makeUser('guru', 'guru-'.$suffix);
        $alatEq = $this->makeEquipment('alat', 'ALAT-'.$suffix);
        $bahanEq = $this->makeEquipment('bahan', 'BAHAN-'.$suffix);
        $groupId = (string) Str::uuid();

        $submission = Submission::createForBorrower($siswa, [
            'supervisor_id' => $guru->id,
            'purpose' => 'Tes status submission',
            'request_date' => now()->toDateString(),
        ]);

        $alat = $this->makeLoan($submission, $siswa, $guru, $alatEq, 'alat', $groupId);
        $bahan = $this->makeLoan($submission, $siswa, $guru, $bahanEq, 'bahan', $groupId);

        return [$submission->fresh(), $alat, $bahan];
    }

    private function makeLoan(
        Submission $submission,
        User $borrower,
        User $guru,
        Equipment $equipment,
        string $itemType,
        string $groupId,
    ): Loan {
        $loan = Loan::query()->create([
            'code' => Loan::generateCode(),
            'loan_group_id' => $groupId,
            'submission_id' => $submission->id,
            'borrower_id' => $borrower->id,
            'supervisor_id' => $guru->id,
            'item_type' => $itemType,
            'status' => 'diminta',
            'queue_priority' => 0,
            'request_date' => now()->toDateString(),
            'purpose' => 'Tes status submission',
            'borrow_scope' => 'lab',
            'borrow_reason' => $itemType === 'alat' ? 'lanjutan' : null,
            'due_at' => $itemType === 'alat' ? now()->addHours(2) : null,
        ]);

        LoanItem::query()->create([
            'loan_id' => $loan->id,
            'equipment_id' => $equipment->id,
            'quantity' => 1,
        ]);

        return $loan->fresh();
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

    private function makeEquipment(string $itemType, string $code): Equipment
    {
        return Equipment::query()->create([
            'code' => $code,
            'name' => 'Item '.$itemType,
            'category' => 'Tools',
            'item_type' => $itemType,
            'stock' => 20,
            'available' => 20,
            'qty_baik' => 20,
            'qty_rusak_ringan' => 0,
            'qty_rusak_berat' => 0,
            'status' => 'tersedia',
            'unit' => 'pcs',
        ]);
    }
}
