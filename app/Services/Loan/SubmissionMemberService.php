<?php

namespace App\Services\Loan;

use App\Models\Loan;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Group-member metadata for Praktikum Lab submissions (not loan workflow).
 */
class SubmissionMemberService
{
    /**
     * Loan statuses that mean a praktikum submission is still "active"
     * for student involvement (ketua or peer). Single source of truth.
     *
     * @var list<string>
     */
    public const ACTIVE_LOAN_STATUSES = [
        'diminta',
        'antrian',
        'menunggu_alat',
        'disetujui',
        'dipinjam',
        'terlambat',
        'menunggu_inspeksi',
    ];

    /**
     * Statuses where peers may still be edited (pre-process).
     *
     * @var list<string>
     */
    public const EDITABLE_LOAN_STATUSES = [
        'diminta',
        'antrian',
        'menunggu_alat',
    ];

    public function canEditMembers(Submission $submission): bool
    {
        $submission->loadMissing('loans');

        if ($submission->loans->isEmpty()) {
            return false;
        }

        if (! $this->isPraktikumSubmission($submission)) {
            return false;
        }

        return $submission->loans->every(
            fn (Loan $loan) => in_array($loan->status, self::EDITABLE_LOAN_STATUSES, true),
        );
    }

    public function isStudentInActiveSubmission(int $studentId, ?Submission $ignoreSubmission = null): bool
    {
        $asBorrower = Submission::query()
            ->where('borrower_id', $studentId)
            ->when(
                $ignoreSubmission,
                fn ($q) => $q->whereKeyNot($ignoreSubmission->id),
            )
            ->whereHas('loans', function ($q) {
                $q->where('loan_type', 'praktikum')
                    ->whereIn('status', self::ACTIVE_LOAN_STATUSES);
            })
            ->exists();

        if ($asBorrower) {
            return true;
        }

        return Submission::query()
            ->whereHas('members', fn ($q) => $q->where('users.id', $studentId))
            ->when(
                $ignoreSubmission,
                fn ($q) => $q->whereKeyNot($ignoreSubmission->id),
            )
            ->whereHas('loans', function ($q) {
                $q->where('loan_type', 'praktikum')
                    ->whereIn('status', self::ACTIVE_LOAN_STATUSES);
            })
            ->exists();
    }

    /**
     * @param  list<int|string>  $memberIds
     */
    public function syncMembers(Submission $submission, array $memberIds, User $leader): void
    {
        $memberIds = array_values(array_unique(array_map('intval', $memberIds)));

        if (! $this->isPraktikumSubmission($submission) && $submission->loans()->exists()) {
            // Non-praktikum: ensure empty.
            $submission->members()->sync([]);

            return;
        }

        if ($memberIds === []) {
            $submission->members()->sync([]);

            return;
        }

        $this->assertMembersValid($submission, $memberIds, $leader);

        DB::transaction(function () use ($submission, $memberIds) {
            $submission->members()->sync($memberIds);
        });
    }

    /**
     * Validate leader (+ members when present) are not in another active praktikum.
     *
     * @param  list<int>  $memberIds
     */
    public function assertParticipantsAvailable(
        User $leader,
        array $memberIds,
        ?Submission $ignoreSubmission = null,
    ): void {
        if ($this->isStudentInActiveSubmission((int) $leader->id, $ignoreSubmission)) {
            throw ValidationException::withMessages([
                'member_ids' => "Siswa {$leader->name} masih terlibat pada Submission Praktikum lain yang sedang berlangsung.",
            ]);
        }

        foreach ($memberIds as $id) {
            if ($this->isStudentInActiveSubmission((int) $id, $ignoreSubmission)) {
                $name = User::query()->whereKey($id)->value('name') ?? 'terpilih';

                throw ValidationException::withMessages([
                    'member_ids' => "Siswa {$name} masih terlibat pada Submission Praktikum lain yang sedang berlangsung.",
                ]);
            }
        }
    }

    /**
     * @param  list<int>  $memberIds
     */
    private function assertMembersValid(Submission $submission, array $memberIds, User $leader): void
    {
        if (count($memberIds) > 10) {
            throw ValidationException::withMessages([
                'member_ids' => 'Maksimal 10 anggota kelompok.',
            ]);
        }

        if (in_array((int) $leader->id, $memberIds, true)) {
            throw ValidationException::withMessages([
                'member_ids' => 'Ketua kelompok tidak boleh dipilih sebagai anggota.',
            ]);
        }

        $leaderClass = $leader->class;
        $students = User::query()
            ->whereIn('id', $memberIds)
            ->get(['id', 'name', 'role', 'status', 'class']);

        if ($students->count() !== count($memberIds)) {
            throw ValidationException::withMessages([
                'member_ids' => 'Satu atau lebih anggota tidak valid.',
            ]);
        }

        foreach ($students as $student) {
            if ($student->role !== 'siswa' || $student->status !== 'active') {
                throw ValidationException::withMessages([
                    'member_ids' => "Siswa {$student->name} tidak dapat dipilih sebagai anggota.",
                ]);
            }

            if ($student->class !== $leaderClass) {
                throw ValidationException::withMessages([
                    'member_ids' => "Siswa {$student->name} harus satu kelas dengan ketua kelompok.",
                ]);
            }
        }

        $this->assertParticipantsAvailable($leader, $memberIds, $submission);
    }

    public function isPraktikumSubmission(Submission $submission): bool
    {
        $submission->loadMissing('loans');

        return $submission->loans->contains(
            fn (Loan $loan) => $loan->item_type === 'alat'
                && ($loan->loan_type === 'praktikum' || $loan->resolvedLoanType() === 'praktikum'),
        );
    }

    /**
     * @return list<array{id: int, name: string, nis: ?string, class_name: ?string}>
     */
    public function formatMembers(Submission $submission): array
    {
        $submission->loadMissing('members:id,name,nisn,class');

        return $submission->members->map(fn (User $user) => [
            'id' => $user->id,
            'name' => $user->name,
            'nis' => $user->nisn,
            'class_name' => $user->class,
        ])->values()->all();
    }

    public function groupSize(Submission $submission): int
    {
        $submission->loadMissing('members');

        return $submission->members->count() + 1;
    }

    public function groupRole(Submission $submission, ?User $actor): string
    {
        if (! $actor) {
            return 'none';
        }

        if ((int) $submission->borrower_id === (int) $actor->id) {
            return 'leader';
        }

        $submission->loadMissing('members');

        if ($submission->members->contains('id', $actor->id)) {
            return 'member';
        }

        return 'none';
    }
}
