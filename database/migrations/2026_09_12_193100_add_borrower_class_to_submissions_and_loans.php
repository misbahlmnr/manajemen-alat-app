<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('submissions', function (Blueprint $table) {
            $table->string('borrower_class', 50)->nullable()->after('borrower_id');
        });

        Schema::table('loans', function (Blueprint $table) {
            $table->string('borrower_class', 50)->nullable()->after('borrower_id');
        });

        if (Schema::hasTable('users')) {
            $driver = Schema::getConnection()->getDriverName();

            if ($driver === 'mysql') {
                DB::statement('
                    UPDATE submissions
                    INNER JOIN users ON users.id = submissions.borrower_id
                    SET submissions.borrower_class = users.class
                    WHERE submissions.borrower_class IS NULL
                ');
                DB::statement('
                    UPDATE loans
                    INNER JOIN users ON users.id = loans.borrower_id
                    SET loans.borrower_class = users.class
                    WHERE loans.borrower_class IS NULL
                ');
            } else {
                foreach (DB::table('submissions')->orderBy('id')->get() as $submission) {
                    $class = DB::table('users')->where('id', $submission->borrower_id)->value('class');
                    if ($class) {
                        DB::table('submissions')->where('id', $submission->id)->update([
                            'borrower_class' => $class,
                        ]);
                    }
                }

                foreach (DB::table('loans')->orderBy('id')->get() as $loan) {
                    $class = DB::table('users')->where('id', $loan->borrower_id)->value('class');
                    if ($class) {
                        DB::table('loans')->where('id', $loan->id)->update([
                            'borrower_class' => $class,
                        ]);
                    }
                }
            }
        }
    }

    public function down(): void
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->dropColumn('borrower_class');
        });

        Schema::table('submissions', function (Blueprint $table) {
            $table->dropColumn('borrower_class');
        });
    }
};
