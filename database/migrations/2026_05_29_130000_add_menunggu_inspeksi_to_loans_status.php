<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const STATUSES_WITH_INSPECTION = [
        'diminta',
        'antrian',
        'disetujui',
        'ditolak',
        'dipinjam',
        'terlambat',
        'menunggu_inspeksi',
        'dikembalikan',
        'dibatalkan',
    ];

    private const STATUSES_WITHOUT_INSPECTION = [
        'diminta',
        'antrian',
        'disetujui',
        'ditolak',
        'dipinjam',
        'terlambat',
        'dikembalikan',
        'dibatalkan',
    ];

    public function up(): void
    {
        $this->replaceStatusConstraint(self::STATUSES_WITH_INSPECTION);
    }

    public function down(): void
    {
        $this->replaceStatusConstraint(self::STATUSES_WITHOUT_INSPECTION);
    }

    /**
     * @param  list<string>  $allowed
     */
    private function replaceStatusConstraint(array $allowed): void
    {
        $driver = Schema::getConnection()->getDriverName();
        $quoted = implode(', ', array_map(fn (string $v) => "'{$v}'", $allowed));

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE loans DROP CONSTRAINT IF EXISTS loans_status_check');
            DB::statement("ALTER TABLE loans ADD CONSTRAINT loans_status_check CHECK (status IN ({$quoted}))");

            return;
        }

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE loans MODIFY COLUMN status ENUM({$quoted}) NOT NULL DEFAULT 'diminta'");

            return;
        }

        throw new RuntimeException("Unsupported database driver [{$driver}] for loans status migration.");
    }
};
