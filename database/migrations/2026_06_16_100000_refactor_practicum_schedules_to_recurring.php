<?php

use Carbon\Carbon;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const HARI_BY_ISO = [
        1 => 'senin',
        2 => 'selasa',
        3 => 'rabu',
        4 => 'kamis',
        5 => 'jumat',
        6 => 'sabtu',
        7 => 'minggu',
    ];

    public function up(): void
    {
        Schema::table('practicum_schedules', function (Blueprint $table) {
            $table->enum('type', ['mingguan', 'khusus'])->default('mingguan')->after('priority');
            $table->enum('hari', ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'])
                ->nullable()
                ->after('type');
        });

        Schema::table('practicum_schedules', function (Blueprint $table) {
            $table->date('tanggal')->nullable()->change();
        });

        $this->migrateExistingRows();

        Schema::table('practicum_schedules', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }

    public function down(): void
    {
        Schema::table('practicum_schedules', function (Blueprint $table) {
            $table->enum('status', ['draft', 'aktif', 'selesai', 'dibatalkan'])->default('aktif')->after('priority');
        });

        DB::table('practicum_schedules')->orderBy('id')->get()->each(function ($row) {
            $tanggal = $row->tanggal;

            if (! $tanggal && $row->hari) {
                $tanggal = Carbon::now()->next(self::hariToCarbonConstant($row->hari))->toDateString();
            }

            DB::table('practicum_schedules')->where('id', $row->id)->update([
                'tanggal' => $tanggal ?? Carbon::today()->toDateString(),
                'status' => 'aktif',
            ]);
        });

        Schema::table('practicum_schedules', function (Blueprint $table) {
            $table->date('tanggal')->nullable(false)->change();
            $table->dropColumn(['type', 'hari']);
        });
    }

    private function migrateExistingRows(): void
    {
        foreach (DB::table('practicum_schedules')->orderBy('id')->get() as $row) {
            $isKhusus = $row->priority === 'lomba';
            $tanggal = $row->tanggal ? Carbon::parse($row->tanggal) : null;
            $hari = $tanggal
                ? (self::HARI_BY_ISO[$tanggal->dayOfWeekIso] ?? 'senin')
                : 'senin';

            if (in_array($row->status, ['dibatalkan', 'selesai'], true) && ! $isKhusus) {
                DB::table('practicum_schedules')->where('id', $row->id)->delete();

                continue;
            }

            DB::table('practicum_schedules')->where('id', $row->id)->update([
                'type' => $isKhusus ? 'khusus' : 'mingguan',
                'hari' => $isKhusus ? null : $hari,
                'tanggal' => $isKhusus ? $row->tanggal : null,
            ]);
        }
    }

    private function hariToCarbonConstant(string $hari): int
    {
        return match ($hari) {
            'senin' => Carbon::MONDAY,
            'selasa' => Carbon::TUESDAY,
            'rabu' => Carbon::WEDNESDAY,
            'kamis' => Carbon::THURSDAY,
            'jumat' => Carbon::FRIDAY,
            'sabtu' => Carbon::SATURDAY,
            default => Carbon::SUNDAY,
        };
    }
};
