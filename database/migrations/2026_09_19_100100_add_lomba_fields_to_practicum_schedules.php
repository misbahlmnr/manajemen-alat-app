<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('practicum_schedules', function (Blueprint $table) {
            $table->string('schedule_kind', 20)->default('praktikum')->after('code');
            $table->foreignId('penanggung_jawab_id')
                ->nullable()
                ->after('guru_id')
                ->constrained('users')
                ->nullOnDelete();
        });

        DB::table('practicum_schedules')
            ->where('priority', 'lomba')
            ->update(['schedule_kind' => 'lomba']);
    }

    public function down(): void
    {
        Schema::table('practicum_schedules', function (Blueprint $table) {
            $table->dropConstrainedForeignId('penanggung_jawab_id');
            $table->dropColumn('schedule_kind');
        });
    }
};
