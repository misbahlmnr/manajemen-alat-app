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
            $table->dropForeign(['supervisor_id']);
        });

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE loans MODIFY supervisor_id BIGINT UNSIGNED NULL');
        } elseif ($driver === 'pgsql') {
            DB::statement('ALTER TABLE loans ALTER COLUMN supervisor_id DROP NOT NULL');
        } elseif ($driver === 'sqlite') {
            // SQLite column nullability is not strictly enforced the same way;
            // foreign key is re-added as nullable-compatible.
        }

        Schema::table('loans', function (Blueprint $table) {
            $table->foreign('supervisor_id')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->dropForeign(['supervisor_id']);
        });

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE loans MODIFY supervisor_id BIGINT UNSIGNED NOT NULL');
        } elseif ($driver === 'pgsql') {
            DB::statement('ALTER TABLE loans ALTER COLUMN supervisor_id SET NOT NULL');
        }

        Schema::table('loans', function (Blueprint $table) {
            $table->foreign('supervisor_id')
                ->references('id')
                ->on('users')
                ->cascadeOnDelete();
        });
    }
};
