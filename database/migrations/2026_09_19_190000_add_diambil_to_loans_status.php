<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const STATUSES_WITH_DIAMBIL = [
        'diminta',
        'antrian',
        'menunggu_alat',
        'disetujui',
        'ditolak',
        'dipinjam',
        'diambil',
        'terlambat',
        'menunggu_inspeksi',
        'dikembalikan',
        'dibatalkan',
    ];

    private const STATUSES_WITHOUT_DIAMBIL = [
        'diminta',
        'antrian',
        'menunggu_alat',
        'disetujui',
        'ditolak',
        'dipinjam',
        'terlambat',
        'menunggu_inspeksi',
        'dikembalikan',
        'dibatalkan',
    ];

    public function up(): void
    {
        $this->replaceStatusConstraint(self::STATUSES_WITH_DIAMBIL);

        DB::table('loans')
            ->where('item_type', 'bahan')
            ->where('status', 'dipinjam')
            ->update(['status' => 'diambil']);
    }

    public function down(): void
    {
        DB::table('loans')
            ->where('item_type', 'bahan')
            ->where('status', 'diambil')
            ->update(['status' => 'dipinjam']);

        $this->replaceStatusConstraint(self::STATUSES_WITHOUT_DIAMBIL);
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

        if ($driver === 'sqlite') {
            return;
        }

        throw new RuntimeException("Unsupported database driver [{$driver}] for loans status migration.");
    }
};
