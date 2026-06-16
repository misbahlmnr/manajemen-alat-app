<?php

namespace App\Services\Dashboard;

use App\Models\User;
use Carbon\Carbon;

class DashboardDataService
{
    public function forUser(User $user): array
    {
        $loans = $this->loansForUser($user);
        $equipment = $this->equipment();
        $schedules = $this->schedules();
        $notifications = $this->notificationsForUser($user);

        $userId = (string) $user->id;
        $unread = collect($notifications)
            ->filter(fn ($n) => (string) $n['userId'] === $userId && ! $n['read'])
            ->values()
            ->all();

        return [
            'loans' => $loans,
            'equipment' => $equipment,
            'schedules' => $schedules,
            'notifications' => $notifications,
            'unreadNotifications' => count($unread),
            'stats' => $this->buildStats($loans, $equipment, $schedules),
            'upcomingSchedules' => $this->upcomingSchedulesForUser($user, $schedules),
        ];
    }

    private function buildStats(array $loans, array $equipment, array $schedules): array
    {
        $alat = collect($equipment)->where('itemType', 'alat');
        $bahan = collect($equipment)->where('itemType', 'bahan');

        $today = Carbon::today();
        $weekEnd = $today->copy()->addDays(7);
        $weekAgo = $today->copy()->subDays(7);

        $activeAlat = collect($loans)->filter(
            fn ($l) => in_array($l['status'], ['dipinjam', 'terlambat'], true)
        );

        $lowStock = collect($equipment)->filter(function ($e) {
            if (($e['itemType'] ?? '') !== 'bahan') {
                return false;
            }
            $remaining = $e['stockRemaining'] ?? $e['available'] ?? 0;
            $min = $e['minStock'] ?? null;

            return $min !== null && $remaining <= $min;
        });

        return [
            'totalAlat' => $alat->count(),
            'totalBahan' => $bahan->count(),
            'alatTersedia' => $alat->sum('available'),
            'alatDipinjam' => $activeAlat->count(),
            'totalPeminjaman' => count($loans),
            'totalPengembalian' => collect($loans)->where('status', 'dikembalikan')->count(),
            'pendingAlat' => collect($loans)->where('status', 'diminta')->where('itemType', 'alat')->count(),
            'queueAlat' => collect($loans)->where('status', 'antrian')->where('itemType', 'alat')->count(),
            'overdue' => collect($loans)->where('status', 'terlambat')->count(),
            'heldCards' => collect($loans)->filter(
                fn ($l) => ($l['collateral']['status'] ?? null) === 'ditahan'
            )->count(),
            'lowStockBahan' => $lowStock->count(),
            'activeSchedulesWeek' => collect($schedules)->filter(function ($s) use ($today, $weekEnd) {
                return ($s['status'] ?? '') === 'aktif'
                    && ($s['tanggal'] ?? '') >= $today->toDateString()
                    && ($s['tanggal'] ?? '') <= $weekEnd->toDateString();
            })->count(),
            'bahanThisWeek' => collect($loans)->filter(function ($l) use ($weekAgo) {
                return ($l['itemType'] ?? '') === 'bahan'
                    && ! empty($l['requestDate'])
                    && Carbon::parse($l['requestDate'])->gte($weekAgo);
            })->count(),
        ];
    }

    private function upcomingSchedulesForUser(User $user, array $schedules): array
    {
        $today = Carbon::today()->toDateString();
        $class = $user->class ?? 'XII TAV 1';

        return collect($schedules)
            ->filter(function ($s) use ($user, $today, $class) {
                if (($s['tanggal'] ?? '') < $today || ($s['status'] ?? '') !== 'aktif') {
                    return false;
                }
                if ($user->isSiswa()) {
                    return ($s['kelas'] ?? '') === $class;
                }
                if ($user->isGuru()) {
                    return (string) ($s['guruId'] ?? '') === (string) $user->id
                        || ($s['guruId'] ?? '') === '2';
                }

                return true;
            })
            ->sortBy(fn ($s) => ($s['tanggal'] ?? '').($s['jamMulai'] ?? ''))
            ->take(3)
            ->values()
            ->all();
    }

    private function loansForUser(User $user): array
    {
        $loans = $this->loans();

        if (! $user->isSiswa()) {
            return $loans;
        }

        $userId = (string) $user->id;
        $name = $user->name;
        $class = $user->class ?? 'XII TAV 1';

        $demoLoanIds = ['1', '5', '7'];

        return array_map(function (array $loan) use ($userId, $name, $class, $demoLoanIds) {
            if (in_array($loan['id'], $demoLoanIds, true)) {
                $loan['borrowerId'] = $userId;
                $loan['borrowerName'] = $name;
                $loan['borrowerClass'] = $class;
            }

            return $loan;
        }, $loans);
    }

    private function notificationsForUser(User $user): array
    {
        $notifications = $this->notifications();
        $userId = (string) $user->id;

        $demoNotificationIds = ['1', '2'];

        return array_map(function (array $n) use ($userId, $user, $demoNotificationIds) {
            if ($user->isSiswa() && in_array($n['id'], $demoNotificationIds, true)) {
                $n['userId'] = $userId;
            }

            return $n;
        }, $notifications);
    }

    private function loans(): array
    {
        return [
            [
                'id' => '1',
                'equipmentId' => 'A1',
                'equipmentName' => 'Kamera DSLR Canon EOS 80D',
                'borrowerId' => '3',
                'borrowerName' => 'Rina Permata',
                'borrowerClass' => 'XII TAV 1',
                'itemType' => 'alat',
                'quantity' => 1,
                'status' => 'dipinjam',
                'requestDate' => '2026-01-05',
                'borrowDate' => '2026-01-06',
                'dueDate' => '2026-01-10',
                'notes' => 'Untuk tugas akhir dokumentasi',
            ],
            [
                'id' => '2',
                'equipmentId' => 'A2',
                'equipmentName' => 'Microphone Condenser Rode NT1',
                'borrowerId' => '4',
                'borrowerName' => 'Budi Santoso',
                'borrowerClass' => 'XI TAV 2',
                'itemType' => 'alat',
                'quantity' => 2,
                'status' => 'terlambat',
                'requestDate' => '2026-01-08',
                'borrowDate' => '2026-01-08',
                'dueDate' => '2026-01-08',
                'notes' => 'Rekaman podcast sekolah',
            ],
            [
                'id' => '3',
                'equipmentId' => 'A3',
                'equipmentName' => 'Tripod Video Manfrotto',
                'borrowerId' => '5',
                'borrowerName' => 'Dewi Anggraini',
                'borrowerClass' => 'XII TAV 1',
                'itemType' => 'alat',
                'quantity' => 1,
                'status' => 'diminta',
                'requestDate' => '2026-01-08',
                'notes' => 'Untuk praktik videografi',
            ],
            [
                'id' => '4',
                'equipmentId' => 'A4',
                'equipmentName' => 'Audio Mixer Yamaha MG12XU',
                'borrowerId' => '6',
                'borrowerName' => 'Andi Pratama',
                'borrowerClass' => 'XI TAV 1',
                'itemType' => 'alat',
                'quantity' => 1,
                'status' => 'disetujui',
                'requestDate' => '2026-01-07',
                'dueDate' => '2026-01-12',
            ],
            [
                'id' => '5',
                'equipmentId' => 'A5',
                'equipmentName' => 'LED Panel Light YN600',
                'borrowerId' => '3',
                'borrowerName' => 'Rina Permata',
                'borrowerClass' => 'XII TAV 1',
                'itemType' => 'alat',
                'quantity' => 2,
                'status' => 'dikembalikan',
                'requestDate' => '2025-12-20',
                'borrowDate' => '2025-12-21',
                'dueDate' => '2025-12-25',
                'returnDate' => '2025-12-24',
            ],
            [
                'id' => '6',
                'equipmentId' => 'A1',
                'equipmentName' => 'Kamera DSLR Canon EOS 80D',
                'borrowerId' => '4',
                'borrowerName' => 'Budi Santoso',
                'borrowerClass' => 'XI TAV 2',
                'itemType' => 'alat',
                'quantity' => 1,
                'status' => 'antrian',
                'requestDate' => Carbon::today()->toDateString(),
                'notes' => 'Menunggu stok tersedia',
            ],
            [
                'id' => '7',
                'equipmentId' => 'B8',
                'equipmentName' => 'Kabel Jumper Male-Male 20cm',
                'borrowerId' => '3',
                'borrowerName' => 'Rina Permata',
                'borrowerClass' => 'XII TAV 1',
                'itemType' => 'bahan',
                'quantity' => 2,
                'status' => 'dipinjam',
                'requestDate' => Carbon::today()->subDays(2)->toDateString(),
            ],
            [
                'id' => '8',
                'equipmentId' => 'A3',
                'equipmentName' => 'Tripod Video Manfrotto',
                'borrowerId' => '6',
                'borrowerName' => 'Andi Pratama',
                'borrowerClass' => 'XI TAV 1',
                'itemType' => 'alat',
                'quantity' => 1,
                'status' => 'dikembalikan',
                'requestDate' => '2025-12-28',
                'borrowDate' => '2025-12-29',
                'dueDate' => '2026-01-02',
                'returnDate' => '2026-01-03',
                'collateral' => ['type' => 'kartu_pelajar', 'status' => 'ditahan'],
                'compensation' => [
                    'required' => true,
                    'status' => 'pending',
                    'amount' => 150000,
                    'description' => 'Ganti plate quick release dalam 7 hari.',
                ],
            ],
        ];
    }

    private function equipment(): array
    {
        return [
            ['id' => 'A1', 'name' => 'Kamera DSLR Canon EOS 80D', 'category' => 'Kamera', 'itemType' => 'alat', 'stock' => 5, 'available' => 3, 'condition' => 'baik', 'location' => 'Rak A1', 'description' => 'Kamera DSLR profesional untuk rekaman video dan fotografi'],
            ['id' => 'A2', 'name' => 'Microphone Condenser Rode NT1', 'category' => 'Mikrofon', 'itemType' => 'alat', 'stock' => 8, 'available' => 6, 'condition' => 'baik', 'location' => 'Rak B2', 'description' => 'Mikrofon condenser berkualitas studio'],
            ['id' => 'A3', 'name' => 'Tripod Video Manfrotto', 'category' => 'Tripod', 'itemType' => 'alat', 'stock' => 10, 'available' => 7, 'condition' => 'baik', 'location' => 'Rak C1', 'description' => 'Tripod video profesional dengan fluid head'],
            ['id' => 'A4', 'name' => 'Audio Mixer Yamaha MG12XU', 'category' => 'Mixer', 'itemType' => 'alat', 'stock' => 3, 'available' => 2, 'condition' => 'baik', 'location' => 'Rak D1', 'description' => 'Mixer audio 12 channel dengan efek built-in'],
            ['id' => 'A5', 'name' => 'LED Panel Light YN600', 'category' => 'Lighting', 'itemType' => 'alat', 'stock' => 6, 'available' => 4, 'condition' => 'baik', 'location' => 'Rak F1', 'description' => 'Lampu LED panel untuk video production'],
            ['id' => 'B1', 'name' => 'Resistor 1/4W (Mix Pack)', 'category' => 'Komponen Elektro', 'itemType' => 'bahan', 'stock' => 500, 'available' => 320, 'stockRemaining' => 320, 'minStock' => 100, 'unit' => 'pcs', 'description' => 'Resistor karbon berbagai nilai'],
            ['id' => 'B8', 'name' => 'Kabel Jumper Male-Male 20cm', 'category' => 'Konsumabel', 'itemType' => 'bahan', 'stock' => 30, 'available' => 8, 'stockRemaining' => 8, 'minStock' => 10, 'unit' => 'pack', 'description' => 'Kabel jumper breadboard, 40 pcs per pack'],
            ['id' => 'B6', 'name' => 'Relay 5V SPDT', 'category' => 'Komponen Elektro', 'itemType' => 'bahan', 'stock' => 40, 'available' => 18, 'stockRemaining' => 18, 'minStock' => 10, 'unit' => 'pcs', 'description' => 'Relay 5V single pole double throw'],
        ];
    }

    private function schedules(): array
    {
        $date = fn (int $offset) => Carbon::today()->addDays($offset)->toDateString();

        return [
            [
                'id' => 'S1',
                'title' => 'Praktik Shooting Video Dokumenter',
                'mataKuliah' => 'PRE (Penerapan Rangkaian Elektronika)',
                'kelas' => 'XII TAV 1',
                'tanggal' => $date(1),
                'jamMulai' => '08:00',
                'jamSelesai' => '11:00',
                'ruangan' => 'Lab AV-1',
                'guruId' => '2',
                'guruName' => 'Bpk. Ahmad Wijaya',
                'priority' => 'normal',
                'status' => 'aktif',
            ],
            [
                'id' => 'S2',
                'title' => 'Praktik Rekaman Podcast',
                'mataKuliah' => 'PAM (Pembelajaran Alat Mikrokontroler)',
                'kelas' => 'XII TAV 1',
                'tanggal' => $date(2),
                'jamMulai' => '10:00',
                'jamSelesai' => '12:00',
                'ruangan' => 'Lab AV-2',
                'guruId' => '2',
                'guruName' => 'Bpk. Ahmad Wijaya',
                'priority' => 'tinggi',
                'status' => 'aktif',
            ],
            [
                'id' => 'S3',
                'title' => 'Praktik Lighting Studio',
                'mataKuliah' => 'PSRT (Penerapan Sistem Radio Televisi)',
                'kelas' => 'XI TAV 2',
                'tanggal' => $date(3),
                'jamMulai' => '13:00',
                'jamSelesai' => '15:00',
                'ruangan' => 'Lab AV-1',
                'guruId' => '2',
                'guruName' => 'Bpk. Ahmad Wijaya',
                'priority' => 'normal',
                'status' => 'aktif',
            ],
        ];
    }

    private function notifications(): array
    {
        return [
            [
                'id' => '1',
                'userId' => '3',
                'title' => 'Pengingat Pengembalian',
                'message' => 'Kamera DSLR Canon EOS 80D harus dikembalikan pada 10 Jan 2026 pukul 16:00',
                'type' => 'warning',
                'read' => false,
            ],
            [
                'id' => '2',
                'userId' => '3',
                'title' => 'Permintaan Disetujui',
                'message' => 'Permintaan peminjaman Tripod telah disetujui',
                'type' => 'success',
                'read' => true,
            ],
            [
                'id' => '3',
                'userId' => '1',
                'title' => 'Keterlambatan Pengembalian',
                'message' => 'Budi Santoso terlambat mengembalikan Microphone Rode NT1',
                'type' => 'error',
                'read' => false,
            ],
            [
                'id' => '4',
                'userId' => '4',
                'title' => 'PERINGATAN: Keterlambatan',
                'message' => 'Segera kembalikan Microphone Condenser Rode NT1.',
                'type' => 'error',
                'read' => false,
            ],
        ];
    }
}
