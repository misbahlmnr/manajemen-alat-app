<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->enum('borrow_reason', ['reguler', 'lanjutan'])
                ->nullable()
                ->after('borrow_scope');
        });

        DB::table('loans')
            ->where('borrow_scope', 'lab')
            ->whereNull('borrow_reason')
            ->update(['borrow_reason' => 'reguler']);
    }

    public function down(): void
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->dropColumn('borrow_reason');
        });
    }
};
