<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loan_collaterals', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->foreignId('loan_id')->constrained('loans')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->enum('card_type', ['kartu_pelajar', 'kartu_siswa', 'lainnya'])->default('kartu_pelajar');
            $table->string('card_number')->nullable();
            $table->enum('status', [
                'dititipkan',
                'ditahan',
                'menunggu_kompensasi',
                'dikembalikan',
                'dibatalkan',
            ])->default('dititipkan');
            $table->dateTime('held_at')->nullable();
            $table->dateTime('returned_at')->nullable();
            $table->foreignId('held_by_admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loan_collaterals');
    }
};
