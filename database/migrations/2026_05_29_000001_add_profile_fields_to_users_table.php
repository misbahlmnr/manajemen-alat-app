<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('status', ['active', 'inactive'])->default('active')->after('role');
            $table->string('phone', 20)->nullable()->after('status');
            $table->string('nisn', 20)->nullable()->unique()->after('phone');
            $table->string('nip', 30)->nullable()->after('nisn');
            $table->string('class', 50)->nullable()->after('nip');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['status', 'phone', 'nisn', 'nip', 'class']);
        });
    }
};
