<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('practicum_schedule_equipment', function (Blueprint $table) {
            $table->id();
            $table->foreignId('practicum_schedule_id')
                ->constrained('practicum_schedules')
                ->cascadeOnDelete();
            $table->foreignId('equipment_id')
                ->constrained('equipment')
                ->cascadeOnDelete();
            $table->unsignedInteger('quantity')->default(1);
            $table->timestamps();

            $table->unique(
                ['practicum_schedule_id', 'equipment_id'],
                'pse_schedule_equipment_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('practicum_schedule_equipment');
    }
};
