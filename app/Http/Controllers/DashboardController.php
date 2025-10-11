<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Kelas;
use App\Models\Tugas;
use App\Models\Absensi;
use App\Models\MateriRekomendasi;
use App\Services\AdaptiveLearningService;

class DashboardController extends Controller
{
    protected $adaptiveService;

    public function __construct(AdaptiveLearningService $adaptiveService)
    {
        $this->adaptiveService = $adaptiveService;
    }

    public function index()
    {
        $user = auth()->user();

        $data = [];

        if ($user->isAdmin()) {
            $data = [
                'total_users' => User::count(),
                'total_kelas' => Kelas::count(),
                'total_guru' => User::where('role', 'guru')->count(),
                'total_siswa' => User::where('role', 'siswa')->count(),
                'total_tugas' => Tugas::count(),
                'total_absensi' => Absensi::count(),
                'chart_data' => $this->getAdminChartData(),
            ];
        } elseif ($user->isGuru()) {
            $data = [
                'total_kelas' => $user->mapel->pluck('kelas')->unique()->count(),
                'total_materi' => $user->materi->count(),
                'total_tugas' => $user->tugas->count(),
                'total_siswa' => $user->mapel->pluck('kelas.siswa')->flatten()->unique()->count(),
                'chart_data' => $this->getGuruChartData($user),
            ];
        } elseif ($user->isSiswa()) {
            // Generate recommendations if needed
            $this->adaptiveService->generateRecommendations($user);

            $data = [
                'total_materi' => $user->kelas ? $user->kelas->materi->count() : 0,
                'total_tugas' => $user->kelas ? $user->kelas->tugas->count() : 0,
                'total_nilai' => $user->nilai->count(),
                'total_rekomendasi' => $this->adaptiveService->getRecommendationsForStudent($user)->count(),
                'chart_data' => $this->getSiswaChartData($user),
                'rekomendasi' => $this->adaptiveService->getRecommendationsForStudent($user),
            ];
        }

        return inertia('Dashboard', $data);
    }

    private function getAdminChartData()
    {
        // Calculate real data from database
        $totalAbsensi = \App\Models\Absensi::count();
        $hadir = \App\Models\Absensi::where('status', 'hadir')->count();
        $izin = \App\Models\Absensi::where('status', 'izin')->count();
        $sakit = \App\Models\Absensi::where('status', 'sakit')->count();
        $alpa = \App\Models\Absensi::where('status', 'alpa')->count();

        // Average grades over time (simplified)
        $nilaiData = \App\Models\Nilai::selectRaw('DATE(created_at) as date, AVG(skor) as avg_nilai')
            ->groupBy('date')
            ->orderBy('date')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'name' => \Carbon\Carbon::parse($item->date)->format('M d'),
                    'nilai' => round($item->avg_nilai, 1)
                ];
            });

        return [
            'nilai' => $nilaiData->toArray(),
            'absensi' => [
                ['name' => 'Hadir', 'value' => $hadir, 'color' => '#16A34A'],
                ['name' => 'Izin', 'value' => $izin, 'color' => '#F59E0B'],
                ['name' => 'Sakit', 'value' => $sakit, 'color' => '#EF4444'],
                ['name' => 'Alpa', 'value' => $alpa, 'color' => '#6B7280'],
            ],
            'progres' => [
                ['name' => 'Materi', 'completed' => \App\Models\Materi::count()],
                ['name' => 'Tugas', 'completed' => \App\Models\Tugas::count()],
                ['name' => 'Nilai', 'completed' => \App\Models\Nilai::count()],
            ],
        ];
    }

    private function getGuruChartData(User $guru)
    {
        // Data filtered by guru's subjects
        $guruMapelIds = $guru->mapel->pluck('id');
        $totalAbsensi = \App\Models\Absensi::whereHas('jadwal', function($q) use ($guruMapelIds) {
            $q->whereIn('mapel_id', $guruMapelIds);
        })->count();

        $hadir = \App\Models\Absensi::where('status', 'hadir')
            ->whereHas('jadwal', function($q) use ($guruMapelIds) {
                $q->whereIn('mapel_id', $guruMapelIds);
            })->count();

        return [
            'nilai' => [
                ['name' => 'Kelas A', 'nilai' => 85],
                ['name' => 'Kelas B', 'nilai' => 88],
            ],
            'absensi' => [
                ['name' => 'Hadir', 'value' => $hadir, 'color' => '#16A34A'],
                ['name' => 'Tidak Hadir', 'value' => $totalAbsensi - $hadir, 'color' => '#EF4444'],
            ],
            'progres' => [
                ['name' => 'Materi', 'completed' => $guru->materi->count()],
                ['name' => 'Tugas', 'completed' => $guru->tugas->count()],
                ['name' => 'Nilai', 'completed' => \App\Models\Nilai::whereHas('tugas', function($q) use ($guru) {
                    $q->where('guru_id', $guru->id);
                })->count()],
            ],
        ];
    }

    private function getSiswaChartData(User $siswa)
    {
        // Get student's actual performance data
        $nilai = $siswa->nilai->pluck('skor')->avg() ?? 0;
        $absensi = $siswa->absensi->where('status', 'hadir')->count();
        $totalAbsensi = $siswa->absensi->count();

        // Get grades over time for this student
        $nilaiData = $siswa->nilai()
            ->join('tugas', 'nilai.tugas_id', '=', 'tugas.id')
            ->selectRaw('tugas.judul as name, nilai.skor as nilai')
            ->get()
            ->toArray();

        return [
            'nilai' => $nilaiData ?: [['name' => 'Rata-rata', 'nilai' => round($nilai, 1)]],
            'absensi' => [
                ['name' => 'Hadir', 'value' => $absensi, 'color' => '#16A34A'],
                ['name' => 'Tidak Hadir', 'value' => $totalAbsensi - $absensi, 'color' => '#EF4444'],
            ],
            'progres' => [
                ['name' => 'Materi', 'completed' => $siswa->kelas ? $siswa->kelas->materi->count() : 0],
                ['name' => 'Tugas', 'completed' => $siswa->kelas ? $siswa->kelas->tugas->count() : 0],
                ['name' => 'Rekomendasi', 'completed' => $siswa->materiRekomendasi->count()],
            ],
        ];
    }
}
