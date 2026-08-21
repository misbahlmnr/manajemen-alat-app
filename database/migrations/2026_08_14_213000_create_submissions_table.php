<?php

use App\Models\Loan;
use App\Models\Submission;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('submissions', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->foreignId('borrower_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('supervisor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('purpose');
            $table->text('notes')->nullable();
            $table->date('request_date');
            $table->timestamps();
        });

        Schema::table('loans', function (Blueprint $table) {
            $table->foreignId('submission_id')
                ->nullable()
                ->after('code')
                ->constrained('submissions')
                ->nullOnDelete();
        });

        $this->backfillSubmissions();
    }

    public function down(): void
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->dropConstrainedForeignId('submission_id');
        });

        Schema::dropIfExists('submissions');
    }

    private function backfillSubmissions(): void
    {
        if (! Schema::hasTable('loans')) {
            return;
        }

        $seenGroups = [];

        Loan::query()
            ->orderBy('id')
            ->each(function (Loan $loan) use (&$seenGroups) {
                if ($loan->loan_group_id && isset($seenGroups[$loan->loan_group_id])) {
                    $loan->forceFill([
                        'submission_id' => $seenGroups[$loan->loan_group_id],
                    ])->saveQuietly();

                    return;
                }

                $submission = Submission::query()->create([
                    'code' => Submission::generateCode(),
                    'borrower_id' => $loan->borrower_id,
                    'supervisor_id' => $loan->supervisor_id,
                    'purpose' => $loan->purpose ?: 'Pengajuan',
                    'notes' => $loan->notes,
                    'request_date' => $loan->request_date?->toDateString() ?? now()->toDateString(),
                    'created_at' => $loan->created_at,
                    'updated_at' => $loan->updated_at,
                ]);

                if ($loan->loan_group_id) {
                    $seenGroups[$loan->loan_group_id] = $submission->id;
                }

                $loan->forceFill(['submission_id' => $submission->id])->saveQuietly();
            });
    }
};
