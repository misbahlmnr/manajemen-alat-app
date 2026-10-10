<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('practicum_schedule_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('practicum_schedule_id')
                ->constrained('practicum_schedules')
                ->cascadeOnDelete();
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->timestamps();

            $table->unique(
                ['practicum_schedule_id', 'user_id'],
                'psp_schedule_user_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('practicum_schedule_participants');
    }
};
