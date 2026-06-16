<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('practicum_schedule_equipment');
    }

    public function down(): void
    {
        // Tabel dipulihkan oleh migrasi asli 2026_05_29_110001_create_practicum_schedule_equipment_table
    }
};
