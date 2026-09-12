<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE loans DROP CONSTRAINT IF EXISTS loans_borrow_reason_check');
            DB::statement("ALTER TABLE loans ADD CONSTRAINT loans_borrow_reason_check CHECK (borrow_reason IS NULL OR borrow_reason IN ('reguler', 'lanjutan', 'lomba'))");

            return;
        }

        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE loans MODIFY borrow_reason ENUM('reguler', 'lanjutan', 'lomba') NULL");
        }
    }

    public function down(): void
    {
        DB::table('loans')->where('borrow_reason', 'lomba')->update(['borrow_reason' => 'lanjutan']);

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE loans DROP CONSTRAINT IF EXISTS loans_borrow_reason_check');
            DB::statement("ALTER TABLE loans ADD CONSTRAINT loans_borrow_reason_check CHECK (borrow_reason IS NULL OR borrow_reason IN ('reguler', 'lanjutan'))");

            return;
        }

        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE loans MODIFY borrow_reason ENUM('reguler', 'lanjutan') NULL");
        }
    }
};
