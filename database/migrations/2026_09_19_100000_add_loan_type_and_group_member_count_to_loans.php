<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->string('loan_type', 20)->nullable()->after('item_type');
            $table->unsignedSmallInteger('group_member_count')->nullable()->after('usage_room');
        });

        DB::table('loans')->orderBy('id')->lazy()->each(function ($row) {
            $type = match (true) {
                ($row->borrow_scope ?? null) === 'bawa_pulang' && ($row->borrow_reason ?? null) === 'lomba' => 'lomba',
                ($row->borrow_scope ?? null) === 'bawa_pulang' => 'bawa_pulang',
                ($row->borrow_reason ?? null) === 'lanjutan' => 'pribadi',
                default => 'praktikum',
            };

            DB::table('loans')->where('id', $row->id)->update(['loan_type' => $type]);
        });

        $driver = Schema::getConnection()->getDriverName();

        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE loans MODIFY loan_type ENUM('praktikum', 'lomba', 'pribadi', 'bawa_pulang') NOT NULL DEFAULT 'praktikum'");
        } elseif ($driver === 'pgsql') {
            DB::statement('ALTER TABLE loans ALTER COLUMN loan_type SET NOT NULL');
            DB::statement("ALTER TABLE loans ALTER COLUMN loan_type SET DEFAULT 'praktikum'");
        } else {
            // SQLite: keep string column; app enforces values.
            DB::table('loans')->whereNull('loan_type')->update(['loan_type' => 'praktikum']);
        }
    }

    public function down(): void
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->dropColumn(['loan_type', 'group_member_count']);
        });
    }
};
