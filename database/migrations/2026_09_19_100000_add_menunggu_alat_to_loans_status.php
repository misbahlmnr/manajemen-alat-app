<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const STATUSES_WITH_MENUNGGU_ALAT = [
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

    private const STATUSES_WITHOUT_MENUNGGU_ALAT = [
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

    public function up(): void
    {
        $this->replaceStatusConstraint(self::STATUSES_WITH_MENUNGGU_ALAT);

        $blockingAlatIds = DB::table('loans')
            ->where('item_type', 'alat')
            ->whereIn('status', ['antrian'])
            ->whereNotNull('submission_id')
            ->pluck('submission_id');

        if ($blockingAlatIds->isNotEmpty()) {
            DB::table('loans')
                ->where('item_type', 'bahan')
                ->whereIn('status', ['diminta', 'antrian'])
                ->whereIn('submission_id', $blockingAlatIds)
                ->update([
                    'status' => 'menunggu_alat',
                    'queued_at' => null,
                ]);
        }
    }

    public function down(): void
    {
        DB::table('loans')
            ->where('item_type', 'bahan')
            ->where('status', 'menunggu_alat')
            ->update(['status' => 'diminta']);

        $this->replaceStatusConstraint(self::STATUSES_WITHOUT_MENUNGGU_ALAT);
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
