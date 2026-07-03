<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->unsignedSmallInteger('queue_priority')->default(0)->after('status');
            $table->timestamp('queued_at')->nullable()->after('queue_priority');
            $table->string('queue_priority_note')->nullable()->after('queued_at');
            $table->foreignId('queue_priority_set_by')
                ->nullable()
                ->after('queue_priority_note')
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('queue_priority_set_at')->nullable()->after('queue_priority_set_by');
        });
    }

    public function down(): void
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->dropConstrainedForeignId('queue_priority_set_by');
            $table->dropColumn([
                'queue_priority',
                'queued_at',
                'queue_priority_note',
                'queue_priority_set_at',
            ]);
        });
    }
};
