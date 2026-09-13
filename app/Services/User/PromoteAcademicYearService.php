<?php

namespace App\Services\User;

use App\Models\User;
use App\Support\ClassOptions;
use Illuminate\Support\Facades\DB;

class PromoteAcademicYearService
{
    /**
     * @return array{
     *     can_promote: bool,
     *     graduate: list<array{from: string, count: int, tingkat: string}>,
     *     promote: list<array{from: string, to: string, count: int, tingkat: string}>,
     *     blocked: list<array{from: string, to: ?string, count: int, reason: string}>,
     *     totals: array{graduate: int, promote: int, blocked: int}
     * }
     */
    public function preview(): array
    {
        $optionSet = array_fill_keys(ClassOptions::names(), true);

        $graduate = [];
        $promote = [];
        $blocked = [];

        $students = User::query()
            ->where('role', 'siswa')
            ->where('status', 'active')
            ->get(['id', 'class']);

        foreach ($students as $student) {
            $from = trim((string) $student->class);

            if ($from === '') {
                $this->bumpBlocked($blocked, '(kosong)', null, 'Kelas kosong. Isi kelas siswa ini terlebih dahulu.');

                continue;
            }

            $parsed = $this->parseClass($from);

            if ($parsed === null) {
                $this->bumpBlocked($blocked, $from, null, 'Format kelas tidak dikenali.');

                continue;
            }

            if ($parsed['tingkat'] === 'XII') {
                $this->bumpGraduate($graduate, $from);

                continue;
            }

            $target = $this->targetClass($parsed);

            if ($target === null) {
                $this->bumpBlocked($blocked, $from, null, 'Format kelas tidak dikenali.');

                continue;
            }

            if (! isset($optionSet[$target])) {
                $this->bumpBlocked(
                    $blocked,
                    $from,
                    $target,
                    "Opsi kelas {$target} belum ada.",
                );

                continue;
            }

            $this->bumpPromote($promote, $from, $target, $parsed['tingkat']);
        }

        $graduateRows = $this->sortedGraduate(array_values($graduate));
        $promoteRows = $this->sortedPromote(array_values($promote));
        $blockedRows = $this->sortedBlocked(array_values($blocked));

        $totals = [
            'graduate' => array_sum(array_column($graduateRows, 'count')),
            'promote' => array_sum(array_column($promoteRows, 'count')),
            'blocked' => array_sum(array_column($blockedRows, 'count')),
        ];

        return [
            'can_promote' => $totals['blocked'] === 0 && ($totals['graduate'] + $totals['promote']) > 0,
            'graduate' => $graduateRows,
            'promote' => $promoteRows,
            'blocked' => $blockedRows,
            'totals' => $totals,
        ];
    }

    /**
     * @return array{graduate: int, promote: int, blocked: int}
     */
    public function promote(): array
    {
        return DB::transaction(function () {
            User::query()
                ->where('role', 'siswa')
                ->where('status', 'active')
                ->orderBy('id')
                ->lockForUpdate()
                ->get(['id']);

            $preview = $this->preview();

            if ($preview['totals']['blocked'] > 0) {
                throw new PromoteAcademicYearException(
                    'Naik tahun ajaran dibatalkan. Ada siswa yang tidak bisa naik karena opsi kelas tujuan belum ada atau format kelas tidak dikenali.',
                );
            }

            if ($preview['totals']['graduate'] === 0 && $preview['totals']['promote'] === 0) {
                throw new PromoteAcademicYearException(
                    'Tidak ada siswa aktif yang bisa dinaikkan.',
                );
            }

            foreach ($preview['graduate'] as $row) {
                User::query()
                    ->where('role', 'siswa')
                    ->where('status', 'active')
                    ->where('class', $row['from'])
                    ->update(['status' => 'inactive']);
            }

            foreach ($preview['promote'] as $row) {
                User::query()
                    ->where('role', 'siswa')
                    ->where('status', 'active')
                    ->where('class', $row['from'])
                    ->update(['class' => $row['to']]);
            }

            return $preview['totals'];
        });
    }

    /**
     * @return array{tingkat: string, jurusan: string, nomor: int}|null
     */
    public function parseClass(?string $class): ?array
    {
        $class = trim((string) $class);

        if ($class === '') {
            return null;
        }

        if (! preg_match('/^(XII|XI|X)\s+(.+?)\s+(\d+)$/i', $class, $matches)) {
            return null;
        }

        return [
            'tingkat' => strtoupper($matches[1]),
            'jurusan' => strtoupper(trim($matches[2])),
            'nomor' => (int) $matches[3],
        ];
    }

    /**
     * @param  array{tingkat: string, jurusan: string, nomor: int}  $parsed
     */
    public function targetClass(array $parsed): ?string
    {
        return match ($parsed['tingkat']) {
            'XI' => 'XII TAV '.$parsed['nomor'],
            'X' => 'XI TAV '.$parsed['nomor'],
            default => null,
        };
    }

    /**
     * @param  array<string, array{from: string, count: int, tingkat: string}>  $rows
     */
    private function bumpGraduate(array &$rows, string $from): void
    {
        if (! isset($rows[$from])) {
            $rows[$from] = [
                'from' => $from,
                'count' => 0,
                'tingkat' => 'XII',
            ];
        }

        $rows[$from]['count']++;
    }

    /**
     * @param  array<string, array{from: string, to: string, count: int, tingkat: string}>  $rows
     */
    private function bumpPromote(array &$rows, string $from, string $to, string $tingkat): void
    {
        $key = $from.'|'.$to;

        if (! isset($rows[$key])) {
            $rows[$key] = [
                'from' => $from,
                'to' => $to,
                'count' => 0,
                'tingkat' => $tingkat,
            ];
        }

        $rows[$key]['count']++;
    }

    /**
     * @param  array<string, array{from: string, to: ?string, count: int, reason: string}>  $rows
     */
    private function bumpBlocked(array &$rows, string $from, ?string $to, string $reason): void
    {
        $key = $from.'|'.($to ?? '').'|'.$reason;

        if (! isset($rows[$key])) {
            $rows[$key] = [
                'from' => $from,
                'to' => $to,
                'count' => 0,
                'reason' => $reason,
            ];
        }

        $rows[$key]['count']++;
    }

    /**
     * @param  list<array{from: string, count: int, tingkat: string}>  $rows
     * @return list<array{from: string, count: int, tingkat: string}>
     */
    private function sortedGraduate(array $rows): array
    {
        usort($rows, fn ($a, $b) => strnatcasecmp($a['from'], $b['from']));

        return $rows;
    }

    /**
     * @param  list<array{from: string, to: string, count: int, tingkat: string}>  $rows
     * @return list<array{from: string, to: string, count: int, tingkat: string}>
     */
    private function sortedPromote(array $rows): array
    {
        $order = ['XI' => 0, 'X' => 1];

        usort($rows, function ($a, $b) use ($order) {
            $oa = $order[$a['tingkat']] ?? 9;
            $ob = $order[$b['tingkat']] ?? 9;

            if ($oa !== $ob) {
                return $oa <=> $ob;
            }

            return strnatcasecmp($a['from'], $b['from']);
        });

        return $rows;
    }

    /**
     * @param  list<array{from: string, to: ?string, count: int, reason: string}>  $rows
     * @return list<array{from: string, to: ?string, count: int, reason: string}>
     */
    private function sortedBlocked(array $rows): array
    {
        usort($rows, fn ($a, $b) => strnatcasecmp($a['from'], $b['from']));

        return $rows;
    }
}
