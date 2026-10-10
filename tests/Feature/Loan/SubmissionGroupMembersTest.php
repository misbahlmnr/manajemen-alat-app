<?php

namespace Tests\Feature\Loan;

use App\Models\Equipment;
use App\Models\Loan;
use App\Models\PracticumSchedule;
use App\Models\Submission;
use App\Models\User;
use App\Services\Loan\SubmissionMemberService;
use App\Services\Loan\SubmissionPresenter;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class SubmissionGroupMembersTest extends TestCase
{
    use RefreshDatabase;

    private SubmissionMemberService $members;

    protected function setUp(): void
    {
        parent::setUp();
        $this->members = app(SubmissionMemberService::class);
        Carbon::setTestNow(Carbon::parse('2026-09-09 10:00:00', config('app.timezone')));
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_praktikum_individu_without_members_has_group_size_one(): void
    {
        [$leader, $guru, $alat, $schedule] = $this->seedPraktikumContext();

        $this->actingAs($leader)->post(route('siswa.loans.store'), $this->praktikumPayload(
            $leader,
            $guru,
            $alat,
            $schedule,
            [],
        ))->assertRedirect(route('siswa.loans.index', ['scope' => 'active']));

        $loan = Loan::query()->where('borrower_id', $leader->id)->latest('id')->first();
        $this->assertNotNull($loan?->submission_id);

        $submission = $loan->submission()->with('members')->first();
        $this->assertCount(0, $submission->members);
        $this->assertSame(1, $this->members->groupSize($submission));

        $row = app(SubmissionPresenter::class)->list(
            $submission,
            fn (Loan $l) => ['id' => $l->id, 'item_type' => $l->item_type, 'status' => $l->status],
            'siswa.loans.submission',
            $leader,
        );

        $this->assertSame([], $row['members']);
        $this->assertSame(1, $row['group_size']);
        $this->assertSame('leader', $row['group_role']);
        $this->assertTrue($row['is_praktikum']);
    }

    public function test_praktikum_kelompok_persists_members_and_group_size(): void
    {
        [$leader, $guru, $alat, $schedule] = $this->seedPraktikumContext();
        $peerA = $this->makeSiswa('peer-a', 'X TE 1');
        $peerB = $this->makeSiswa('peer-b', 'X TE 1');

        $this->actingAs($leader)->post(route('siswa.loans.store'), $this->praktikumPayload(
            $leader,
            $guru,
            $alat,
            $schedule,
            [$peerA->id, $peerB->id],
        ))->assertRedirect(route('siswa.loans.index', ['scope' => 'active']));

        $submission = Loan::query()
            ->where('borrower_id', $leader->id)
            ->latest('id')
            ->first()
            ->submission()
            ->with('members')
            ->first();

        $this->assertCount(2, $submission->members);
        $this->assertEqualsCanonicalizing(
            [$peerA->id, $peerB->id],
            $submission->members->pluck('id')->all(),
        );
        $this->assertSame(3, $this->members->groupSize($submission));

        $row = app(SubmissionPresenter::class)->list(
            $submission,
            fn (Loan $l) => ['id' => $l->id, 'item_type' => $l->item_type, 'status' => $l->status],
            'siswa.loans.submission',
            $peerA,
        );

        $this->assertSame(3, $row['group_size']);
        $this->assertSame('member', $row['group_role']);
        $this->assertCount(2, $row['members']);
    }

    public function test_cannot_select_student_already_in_active_praktikum(): void
    {
        [$leader, $guru, $alat, $schedule] = $this->seedPraktikumContext();
        $peer = $this->makeSiswa('busy-peer', 'X TE 1');
        $otherLeader = $this->makeSiswa('other-leader', 'X TE 1');

        $this->actingAs($leader)->post(route('siswa.loans.store'), $this->praktikumPayload(
            $leader,
            $guru,
            $alat,
            $schedule,
            [$peer->id],
        ))->assertRedirect();

        $this->actingAs($otherLeader)->post(route('siswa.loans.store'), $this->praktikumPayload(
            $otherLeader,
            $guru,
            $alat,
            $schedule,
            [$peer->id],
        ))->assertSessionHasErrors('member_ids');

        $this->assertTrue($this->members->isStudentInActiveSubmission($peer->id));
        $this->assertTrue($this->members->isStudentInActiveSubmission($leader->id));
    }

    public function test_student_can_join_again_after_submission_cancelled(): void
    {
        [$leader, $guru, $alat, $schedule] = $this->seedPraktikumContext();
        $peer = $this->makeSiswa('free-peer', 'X TE 1');
        $otherLeader = $this->makeSiswa('next-leader', 'X TE 1');

        $this->actingAs($leader)->post(route('siswa.loans.store'), $this->praktikumPayload(
            $leader,
            $guru,
            $alat,
            $schedule,
            [$peer->id],
        ))->assertRedirect();

        $loan = Loan::query()->where('borrower_id', $leader->id)->latest('id')->first();
        $this->actingAs($leader)
            ->post(route('siswa.loans.cancel', $loan))
            ->assertRedirect();

        $this->assertFalse($this->members->isStudentInActiveSubmission($peer->id));
        $this->assertFalse($this->members->isStudentInActiveSubmission($leader->id));

        $this->actingAs($otherLeader)->post(route('siswa.loans.store'), $this->praktikumPayload(
            $otherLeader,
            $guru,
            $alat,
            $schedule,
            [$peer->id],
        ))->assertRedirect(route('siswa.loans.index', ['scope' => 'active']));

        $submission = Loan::query()
            ->where('borrower_id', $otherLeader->id)
            ->latest('id')
            ->first()
            ->submission()
            ->with('members')
            ->first();

        $this->assertEqualsCanonicalizing([$peer->id], $submission->members->pluck('id')->all());
    }

    public function test_sync_members_empty_clears_all_peers(): void
    {
        [$leader, $guru, $alat, $schedule] = $this->seedPraktikumContext();
        $peer = $this->makeSiswa('clear-peer', 'X TE 1');

        $this->actingAs($leader)->post(route('siswa.loans.store'), $this->praktikumPayload(
            $leader,
            $guru,
            $alat,
            $schedule,
            [$peer->id],
        ))->assertRedirect();

        $submission = Loan::query()
            ->where('borrower_id', $leader->id)
            ->latest('id')
            ->first()
            ->submission()
            ->with(['loans', 'members'])
            ->first();

        $this->assertCount(1, $submission->members);

        $this->members->syncMembers($submission, [], $leader);
        $submission->load('members');

        $this->assertCount(0, $submission->members);
        $this->assertSame(1, $this->members->groupSize($submission));
    }

    public function test_cannot_edit_members_after_loan_processed(): void
    {
        [$leader, $guru, $alat, $schedule] = $this->seedPraktikumContext();
        $peer = $this->makeSiswa('locked-peer', 'X TE 1');
        $newPeer = $this->makeSiswa('new-peer', 'X TE 1');

        $this->actingAs($leader)->post(route('siswa.loans.store'), $this->praktikumPayload(
            $leader,
            $guru,
            $alat,
            $schedule,
            [$peer->id],
        ))->assertRedirect();

        $loan = Loan::query()->where('borrower_id', $leader->id)->latest('id')->first();
        $loan->update(['status' => 'disetujui']);

        $submission = $loan->submission()->with(['loans', 'members'])->first();
        $this->assertFalse($this->members->canEditMembers($submission));

        $this->actingAs($leader)->put(route('siswa.loans.update', $loan), $this->praktikumPayload(
            $leader,
            $guru,
            $alat,
            $schedule,
            [$newPeer->id],
        ))->assertSessionHasErrors('member_ids');
    }

    public function test_pivot_unique_prevents_duplicate_member_rows(): void
    {
        [$leader] = $this->seedPraktikumContext();
        $peer = $this->makeSiswa('uniq-peer', 'X TE 1');

        $submission = Submission::query()->create([
            'code' => 'SUB-UNIQ-1',
            'borrower_id' => $leader->id,
            'purpose' => 'Test',
            'request_date' => now()->toDateString(),
        ]);

        $submission->members()->attach($peer->id);

        $this->expectException(\Illuminate\Database\QueryException::class);
        $submission->members()->attach($peer->id);
    }

    public function test_sync_members_rejects_when_leader_already_active_elsewhere(): void
    {
        [$leader, $guru, $alat, $schedule] = $this->seedPraktikumContext();

        $this->actingAs($leader)->post(route('siswa.loans.store'), $this->praktikumPayload(
            $leader,
            $guru,
            $alat,
            $schedule,
            [],
        ))->assertRedirect();

        $this->expectException(ValidationException::class);
        $this->members->assertParticipantsAvailable($leader, []);
    }

    /**
     * @return array{0: User, 1: User, 2: Equipment, 3: PracticumSchedule}
     */
    private function seedPraktikumContext(): array
    {
        $leader = $this->makeSiswa('leader-'.Str::lower(Str::random(4)), 'X TE 1');
        $guru = $this->makeUser('guru', 'guru-'.Str::lower(Str::random(4)));
        $alat = $this->makeEquipment('alat', available: 20);
        $schedule = $this->makeWeeklySchedule($guru, 'senin', '07:00:00', '09:30:00');

        return [$leader, $guru, $alat, $schedule];
    }

    /**
     * @param  list<int>  $memberIds
     * @return array<string, mixed>
     */
    private function praktikumPayload(
        User $leader,
        User $guru,
        Equipment $alat,
        PracticumSchedule $schedule,
        array $memberIds,
    ): array {
        $monday = '2026-09-14';

        return [
            'supervisor_id' => $guru->id,
            'practicum_schedule_id' => $schedule->id,
            'item_type' => 'alat',
            'loan_type' => 'praktikum',
            'request_date' => $monday,
            'purpose' => 'Praktik kelompok',
            'notes' => 'Praktik kelompok',
            'borrow_scope' => 'lab',
            'borrow_reason' => 'reguler',
            'usage_room' => 'Ruang Assembly',
            'due_at' => $monday.'T09:30',
            'member_ids' => $memberIds,
            'items' => [
                ['equipment_id' => $alat->id, 'quantity' => 1],
            ],
        ];
    }

    private function makeWeeklySchedule(User $guru, string $hari, string $start, string $end): PracticumSchedule
    {
        return PracticumSchedule::query()->create([
            'code' => 'JDW-'.Str::upper(Str::random(4)),
            'title' => 'Praktik Booking',
            'mata_kuliah' => 'DTE (Dasar Teknik Elektronika)',
            'jurusan' => 'Audio Video',
            'kelas' => 'X TE 1',
            'type' => 'mingguan',
            'hari' => $hari,
            'jam_mulai' => $start,
            'jam_selesai' => $end,
            'ruangan' => 'Ruang Assembly',
            'guru_id' => $guru->id,
            'priority' => 'normal',
        ]);
    }

    private function makeSiswa(string $username, string $class): User
    {
        return User::query()->create([
            'name' => ucfirst($username),
            'username' => $username,
            'email' => $username.'@test.local',
            'password' => 'password',
            'role' => 'siswa',
            'status' => 'active',
            'class' => $class,
            'nisn' => '0077'.substr(md5($username), 0, 6),
        ]);
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
