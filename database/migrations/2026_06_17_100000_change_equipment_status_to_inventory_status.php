<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('equipment')) {
            return;
        }

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE equipment DROP CONSTRAINT IF EXISTS equipment_status_check');
            DB::statement('ALTER TABLE equipment ALTER COLUMN status DROP DEFAULT');
            DB::statement('ALTER TABLE equipment ALTER COLUMN status TYPE VARCHAR(20) USING status::text');
        } elseif ($driver === 'mysql') {
            DB::statement("ALTER TABLE equipment MODIFY status VARCHAR(20) NOT NULL DEFAULT 'active'");
        } else {
            DB::statement('ALTER TABLE equipment RENAME COLUMN status TO status_old');
            Schema::table('equipment', function ($table) {
                $table->string('status', 20)->default('active')->after('description');
            });
            DB::statement('UPDATE equipment SET status = status_old');
            Schema::table('equipment', function ($table) {
                $table->dropColumn('status_old');
            });
        }

        DB::table('equipment')->where('status', 'active')->update(['status' => 'tersedia']);
        DB::table('equipment')->where('status', 'inactive')->update(['status' => 'tidak_tersedia']);

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE equipment ALTER COLUMN status SET DEFAULT 'tersedia'");
        } elseif ($driver === 'mysql') {
            DB::statement("ALTER TABLE equipment MODIFY status VARCHAR(20) NOT NULL DEFAULT 'tersedia'");
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('equipment')) {
            return;
        }

        DB::table('equipment')->where('status', 'tersedia')->update(['status' => 'active']);
        DB::table('equipment')->where('status', 'tidak_tersedia')->update(['status' => 'inactive']);

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE equipment ALTER COLUMN status DROP DEFAULT');
            DB::statement('ALTER TABLE equipment ALTER COLUMN status TYPE VARCHAR(20) USING status::text');
            DB::statement("ALTER TABLE equipment ALTER COLUMN status SET DEFAULT 'active'");
        } elseif ($driver === 'mysql') {
            DB::statement("ALTER TABLE equipment MODIFY status VARCHAR(20) NOT NULL DEFAULT 'active'");
        }
    }
};
