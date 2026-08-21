<?php

namespace Tests\Feature\Loan;

use App\Models\Equipment;
use App\Models\Loan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class LoanQueueFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_siswa_can_submit_bahan_into_queue_when_stock_short(): void
    {
        $siswa = $this->makeUser('siswa', 'siswa-bahan');
        $guru = $this->makeUser('guru', 'guru-bahan');
        $bahan = $this->makeEquipment('bahan', available: 0);

        $response = $this->actingAs($siswa)->post(route('siswa.loans.store'), [
            'supervisor_id' => $guru->id,
            'item_type' => 'bahan',
            'request_date' => now()->toDateString(),
            'purpose' => 'Ambil bahan',
            'notes' => 'Butuh solder',
            'items' => [
                ['equipment_id' => $bahan->id, 'quantity' => 1],
            ],
        ]);

        $response->assertRedirect(route('siswa.loans.index', ['scope' => 'active']));

        $loan = Loan::query()->where('borrower_id', $siswa->id)->latest('id')->first();
        $this->assertNotNull($loan);
        $this->assertSame('antrian', $loan->status);
        $this->assertSame('bahan', $loan->item_type);
        $this->assertNotNull($loan->queued_at);
    }

    public function test_siswa_can_submit_package_alat_and_bahan(): void
    {
        $siswa = $this->makeUser('siswa', 'siswa-pkg2');
        $guru = $this->makeUser('guru', 'guru-pkg2');
        $alat = $this->makeEquipment('alat', available: 5);
        $bahan = $this->makeEquipment('bahan', available: 5);
        $today = now()->toDateString();

        $response = $this->actingAs($siswa)->post(route('siswa.loans.store-package'), [
            'alat' => [
                'supervisor_id' => $guru->id,
                'item_type' => 'alat',
                'request_date' => $today,
                'purpose' => 'Paket praktikum',
                'notes' => 'Paket praktikum',
                'borrow_scope' => 'lab',
                'borrow_reason' => 'lanjutan',
                'usage_room' => 'Lab AV 1',
                'due_at' => now()->setTime(17, 0)->format('Y-m-d\TH:i'),
                'items' => [
                    ['equipment_id' => $alat->id, 'quantity' => 1],
                ],
            ],
            'bahan' => [
                'supervisor_id' => $guru->id,
                'item_type' => 'bahan',
                'request_date' => $today,
                'purpose' => 'Paket praktikum',
                'notes' => 'Paket praktikum',
                'items' => [
                    ['equipment_id' => $bahan->id, 'quantity' => 1],
                ],
            ],
        ]);

        $response->assertRedirect(route('siswa.loans.index', ['scope' => 'active']));

        $loans = Loan::query()->where('borrower_id', $siswa->id)->orderBy('item_type')->get();
        $loans->load('submission');
        $this->assertCount(2, $loans);
        $this->assertNotNull($loans[0]->loan_group_id);
        $this->assertSame($loans[0]->loan_group_id, $loans[1]->loan_group_id);
        $this->assertNotNull($loans[0]->submission_id);
        $this->assertSame($loans[0]->submission_id, $loans[1]->submission_id);
        $this->assertMatchesRegularExpression('/^SUB-\d{4}$/', $loans[0]->submission->code);
        $this->assertEqualsCanonicalizing(['alat', 'bahan'], $loans->pluck('item_type')->all());

        $admin = $this->makeUser('admin', 'admin-sub-list');
        $this->actingAs($admin)
            ->get(route('admin.loans.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Loan/Index')
                ->has('loans.data', 1)
                ->where('loans.data.0.code', $loans[0]->submission->code)
                ->where('loans.data.0.alat_count', 1)
                ->where('loans.data.0.bahan_count', 1)
            );
    }

    public function test_admin_approve_deducts_stock_for_alat_and_bahan(): void
    {
        $siswa = $this->makeUser('siswa', 'siswa-approve');
        $guru = $this->makeUser('guru', 'guru-approve');
        $admin = $this->makeUser('admin', 'admin-approve');
        $alat = $this->makeEquipment('alat', available: 10);
        $bahan = $this->makeEquipment('bahan', available: 10);
        $workflow = app(\App\Services\Loan\LoanWorkflowService::class);

        $this->actingAs($siswa)->post(route('siswa.loans.store'), [
            'supervisor_id' => $guru->id,
            'item_type' => 'alat',
            'request_date' => now()->toDateString(),
            'purpose' => 'Pinjam alat',
            'notes' => 'Pinjam alat',
            'borrow_scope' => 'lab',
            'borrow_reason' => 'lanjutan',
            'usage_room' => 'Lab AV 1',
            'due_at' => now()->setTime(17, 0)->format('Y-m-d\TH:i'),
            'items' => [
                ['equipment_id' => $alat->id, 'quantity' => 3],
            ],
        ])->assertRedirect();

        $this->actingAs($siswa)->post(route('siswa.loans.store'), [
            'supervisor_id' => $guru->id,
            'item_type' => 'bahan',
            'request_date' => now()->toDateString(),
            'purpose' => 'Ambil bahan',
            'notes' => 'Ambil bahan',
            'items' => [
                ['equipment_id' => $bahan->id, 'quantity' => 4],
            ],
        ])->assertRedirect();

        $this->assertSame(10, (int) $alat->fresh()->available);
        $this->assertSame(10, (int) $bahan->fresh()->available);

        $alatLoan = Loan::query()->where('borrower_id', $siswa->id)->where('item_type', 'alat')->latest('id')->first();
        $bahanLoan = Loan::query()->where('borrower_id', $siswa->id)->where('item_type', 'bahan')->latest('id')->first();

        $workflow->approve($alatLoan->fresh(), $admin);
        $this->assertSame('disetujui', $alatLoan->fresh()->status);
        $this->assertSame(7, (int) $alat->fresh()->available);

        $workflow->approve($bahanLoan->fresh(), $admin);
        $this->assertSame('dipinjam', $bahanLoan->fresh()->status);
        $this->assertSame(6, (int) $bahan->fresh()->available);

        $workflow->markBorrowed($alatLoan->fresh(), $admin);
        $this->assertSame('dipinjam', $alatLoan->fresh()->status);
        $this->assertSame(7, (int) $alat->fresh()->available);
    }

    public function test_two_siswa_queue_positions_follow_queued_at_fifo(): void
    {
        $siswaA = $this->makeUser('siswa', 'siswa-fifo-a');
        $siswaB = $this->makeUser('siswa', 'siswa-fifo-b');
        $guru = $this->makeUser('guru', 'guru-fifo');
        $alat = $this->makeEquipment('alat', available: 0);
        $queue = app(\App\Services\Loan\LoanQueueService::class);

        $payload = fn () => [
            'supervisor_id' => $guru->id,
            'item_type' => 'alat',
            'request_date' => now()->toDateString(),
            'purpose' => 'Antre toolset',
            'notes' => 'Antre toolset',
            'borrow_scope' => 'lab',
            'borrow_reason' => 'lanjutan',
            'usage_room' => 'Lab AV 1',
            'due_at' => now()->setTime(17, 0)->format('Y-m-d\TH:i'),
            'items' => [
                ['equipment_id' => $alat->id, 'quantity' => 2],
            ],
        ];

        $this->actingAs($siswaA)->post(route('siswa.loans.store'), $payload())->assertRedirect();
        $this->actingAs($siswaB)->post(route('siswa.loans.store'), $payload())->assertRedirect();

        $loanA = Loan::query()->where('borrower_id', $siswaA->id)->latest('id')->first();
        $loanB = Loan::query()->where('borrower_id', $siswaB->id)->latest('id')->first();

        $this->assertSame('antrian', $loanA->status);
        $this->assertSame('antrian', $loanB->status);
        $this->assertNotNull($loanA->queued_at);
        $this->assertNotNull($loanB->queued_at);
        $this->assertTrue($loanA->queued_at->lte($loanB->queued_at));
        $this->assertSame(1, $queue->getQueuePosition($loanA));
        $this->assertSame(2, $queue->getQueuePosition($loanB));
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
            'nisn' => $role === 'siswa' ? '0088'.substr(md5($username), 0, 6) : null,
        ]);
    }

    private function makeEquipment(string $itemType, int $available = 0): Equipment
    {
        return Equipment::query()->create([
            'code' => strtoupper($itemType).'-'.Str::upper(Str::random(4)),
            'name' => 'Item '.$itemType,
            'category' => 'Tools',
            'item_type' => $itemType,
            'stock' => max($available, 10),
            'available' => $available,
            'qty_baik' => max($available, 10),
            'qty_rusak_ringan' => 0,
            'qty_rusak_berat' => 0,
            'status' => 'tersedia',
            'unit' => 'pcs',
        ]);
    }
}
