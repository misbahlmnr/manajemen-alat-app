<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Allow temporary negative available for Bawa Pulang reservation
     * while units are still held by an overlapping Praktik Lab loan.
     */
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE equipment MODIFY available INT NOT NULL DEFAULT 0');
        } elseif ($driver === 'pgsql') {
            DB::statement('ALTER TABLE equipment ALTER COLUMN available TYPE INTEGER USING available::integer');
            DB::statement('ALTER TABLE equipment ALTER COLUMN available SET DEFAULT 0');
            DB::statement('ALTER TABLE equipment ALTER COLUMN available SET NOT NULL');
        } else {
            // sqlite / others: recreate is not needed for tests that already allow signed ints
        }
    }

    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE equipment MODIFY available INT UNSIGNED NOT NULL DEFAULT 0');
        } elseif ($driver === 'pgsql') {
            DB::statement('ALTER TABLE equipment ALTER COLUMN available TYPE INTEGER USING GREATEST(available, 0)::integer');
            DB::statement('ALTER TABLE equipment ALTER COLUMN available SET DEFAULT 0');
            DB::statement('ALTER TABLE equipment ALTER COLUMN available SET NOT NULL');
        }
    }
};
