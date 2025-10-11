<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('adaptive_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mapel_id')->constrained('mapel')->onDelete('cascade');
            $table->decimal('min_score', 5, 2);
            $table->string('kategori_rekomendasi');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('adaptive_rules');
    }
};
