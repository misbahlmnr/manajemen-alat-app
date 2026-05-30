<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('practicum_schedules', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('title');
            $table->string('mata_kuliah');
            $table->string('jurusan')->default('Audio Video');
            $table->string('kelas');
            $table->date('tanggal');
            $table->time('jam_mulai');
            $table->time('jam_selesai');
            $table->string('ruangan')->nullable();
            $table->foreignId('guru_id')->constrained('users')->cascadeOnDelete();
            $table->enum('priority', ['normal', 'tinggi', 'lomba'])->default('normal');
            $table->enum('status', ['draft', 'aktif', 'selesai', 'dibatalkan'])->default('draft');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('practicum_schedules');
    }
};
