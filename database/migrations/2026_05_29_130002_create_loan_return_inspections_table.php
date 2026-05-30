<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loan_return_inspections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained('loans')->cascadeOnDelete();
            $table->enum('result', ['belum', 'lengkap', 'tidak_lengkap', 'rusak'])->default('belum');
            $table->text('notes')->nullable();
            $table->text('missing_items')->nullable();
            $table->text('damage_description')->nullable();
            $table->foreignId('checked_by_admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('checked_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loan_return_inspections');
    }
};
