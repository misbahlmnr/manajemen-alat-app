<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loans', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->foreignId('borrower_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('supervisor_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('practicum_schedule_id')->nullable()->constrained('practicum_schedules')->nullOnDelete();
            $table->enum('item_type', ['alat', 'bahan']);
            $table->enum('status', [
                'diminta',
                'antrian',
                'disetujui',
                'ditolak',
                'dipinjam',
                'terlambat',
                'dikembalikan',
                'dibatalkan',
            ])->default('diminta');
            $table->date('request_date');
            $table->dateTime('borrowed_at')->nullable();
            $table->dateTime('due_at')->nullable();
            $table->dateTime('returned_at')->nullable();
            $table->string('purpose')->nullable();
            $table->text('notes')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->enum('borrow_scope', ['lab', 'bawa_pulang'])->default('lab');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loans');
    }
};
