<?php

namespace Tests\Feature\Loan;

use App\Models\Equipment;
use App\Models\Loan;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class LoanBorrowerClassSnapshotTest extends TestCase
{
    use RefreshDatabase;

    public function test_loan_keeps_borrower_class_after_student_is_promoted(): void
    {
        $this->travelTo(Carbon::parse('2026-09-09 10:00:00'));

        $siswa = $this->makeUser('siswa', 'siswa-snapshot');
        $alat = $this->makeEquipment('alat', available: 5);

        $this->actingAs($siswa)->post(route('siswa.loans.store'), [
            'item_type' => 'alat',
            'request_date' => '2026-09-09',
            'purpose' => 'Pribadi',
            'notes' => 'Pribadi',
            'borrow_scope' => 'lab',
            'borrow_reason' => 'lanjutan',
            'usage_room' => 'Ruang Assembly',
            'due_at' => '2026-09-09T17:00',
            'items' => [
                ['equipment_id' => $alat->id, 'quantity' => 1],
            ],
        ])->assertRedirect(route('siswa.loans.index', ['scope' => 'active']));

        $loan = Loan::query()->where('borrower_id', $siswa->id)->latest('id')->first();
        $this->assertNotNull($loan);
        $this->assertSame('X TE 1', $loan->borrower_class);
        $this->assertSame('X TE 1', $loan->submission->borrower_class);

        $siswa->update(['class' => 'XII TAV 1']);

        $this->assertSame('XII TAV 1', $siswa->fresh()->class);
        $this->assertSame('X TE 1', $loan->fresh()->borrowerClassLabel());
        $this->assertSame('X TE 1', $loan->submission->fresh()->borrowerClassLabel());
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
            'qty_baik' => $itemType === 'alat' ? $available : max($available, 10),
            'qty_rusak_ringan' => 0,
            'qty_rusak_berat' => 0,
            'status' => 'tersedia',
            'unit' => 'pcs',
        ]);
    }
}
