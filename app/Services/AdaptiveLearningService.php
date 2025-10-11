<?php

namespace App\Services;

use App\Models\User;
use App\Models\Nilai;
use App\Models\Materi;
use App\Models\MateriRekomendasi;
use App\Models\AdaptiveRule;

class AdaptiveLearningService
{
    public function generateRecommendations(User $siswa)
    {
        // Get student's grades
        $nilaiSiswa = Nilai::where('siswa_id', $siswa->id)->get();

        $recommendations = [];

        foreach ($nilaiSiswa as $nilai) {
            $tugas = $nilai->tugas;
            $mapel = $tugas->mapel;

            // Check adaptive rules
            $rules = AdaptiveRule::where('mapel_id', $mapel->id)->get();

            foreach ($rules as $rule) {
                if ($nilai->skor < $rule->min_score) {
                    // Find related materials
                    $relatedMaterials = Materi::where('mapel_id', $mapel->id)
                        ->where('tingkat_kesulitan', 'mudah') // Recommend easier materials
                        ->where('kelas_id', $siswa->kelas_id)
                        ->get();

                    foreach ($relatedMaterials as $materi) {
                        // Check if recommendation already exists
                        $existing = MateriRekomendasi::where('siswa_id', $siswa->id)
                            ->where('materi_id', $materi->id)
                            ->where('status', 'aktif')
                            ->first();

                        if (!$existing) {
                            MateriRekomendasi::create([
                                'siswa_id' => $siswa->id,
                                'materi_id' => $materi->id,
                                'alasan' => "Nilai rendah pada {$tugas->judul} ({$nilai->skor}), direkomendasikan materi {$materi->judul}",
                                'status' => 'aktif',
                            ]);
                        }
                    }
                }
            }
        }

        return $recommendations;
    }

    public function getRecommendationsForStudent(User $siswa)
    {
        return MateriRekomendasi::where('siswa_id', $siswa->id)
            ->where('status', 'aktif')
            ->with('materi')
            ->get();
    }

    public function markRecommendationAsCompleted(MateriRekomendasi $recommendation)
    {
        $recommendation->update(['status' => 'selesai']);
    }
}