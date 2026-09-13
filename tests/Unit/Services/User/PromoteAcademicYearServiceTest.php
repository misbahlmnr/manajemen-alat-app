<?php

namespace Tests\Unit\Services\User;

use App\Models\ClassOption;
use App\Models\User;
use App\Services\User\PromoteAcademicYearException;
use App\Services\User\PromoteAcademicYearService;
use App\Support\AcademicYear;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PromoteAcademicYearServiceTest extends TestCase
{
    use RefreshDatabase;

    private PromoteAcademicYearService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(PromoteAcademicYearService::class);
    }

    public function test_maps_rombel_number_x_te_to_xi_tav_and_xi_to_xii(): void
    {
        $this->assertSame('XI TAV 1', $this->service->targetClass(
            $this->service->parseClass('X TE 1'),
        ));
        $this->assertSame('XII TAV 1', $this->service->targetClass(
            $this->service->parseClass('XI TAV 1'),
        ));
        $this->assertNull($this->service->targetClass(
            $this->service->parseClass('XII TAV 1'),
        ));
    }

    public function test_preview_groups_rombel_and_blocks_missing_target(): void
    {
        $this->makeStudent('x-te-1', 'X TE 1');
        $this->makeStudent('xi-tav-1', 'XI TAV 1');
        $this->makeStudent('xii-tav-1', 'XII TAV 1');
        $this->makeStudent('x-te-4', 'X TE 4');
        $this->makeStudent('inactive-x', 'X TE 1', status: 'inactive');
        $this->makeGuru();

        $preview = $this->service->preview();

        $this->assertFalse($preview['can_promote']);
        $this->assertSame(1, $preview['totals']['graduate']);
        $this->assertSame(2, $preview['totals']['promote']);
        $this->assertSame(1, $preview['totals']['blocked']);
        $this->assertSame('X TE 4', $preview['blocked'][0]['from']);
        $this->assertSame('XI TAV 4', $preview['blocked'][0]['to']);
    }

    public function test_promote_moves_in_order_and_skips_inactive(): void
    {
        $x = $this->makeStudent('x-te-1', 'X TE 1');
        $xi = $this->makeStudent('xi-tav-1', 'XI TAV 1');
        $xii = $this->makeStudent('xii-tav-1', 'XII TAV 1');
        $stayed = $this->makeStudent('inactive-x', 'X TE 1', status: 'inactive');

        $totals = $this->service->promote();

        $this->assertSame(1, $totals['graduate']);
        $this->assertSame(2, $totals['promote']);
        $this->assertSame('XI TAV 1', $x->fresh()->class);
        $this->assertSame('active', $x->fresh()->status);
        $this->assertSame('XII TAV 1', $xi->fresh()->class);
        $this->assertSame('active', $xi->fresh()->status);
        $this->assertSame('XII TAV 1', $xii->fresh()->class);
        $this->assertSame('inactive', $xii->fresh()->status);
        $this->assertSame('X TE 1', $stayed->fresh()->class);
        $this->assertSame('inactive', $stayed->fresh()->status);
        $this->assertSame(AcademicYear::fromClass('X TE 1'), $x->fresh()->angkatan);
        $this->assertSame(AcademicYear::fromClass('XI TAV 1'), $xi->fresh()->angkatan);
        $this->assertSame(AcademicYear::fromClass('XII TAV 1'), $xii->fresh()->angkatan);
    }

    public function test_promote_rejects_when_target_class_option_missing(): void
    {
        $this->makeStudent('x-te-4', 'X TE 4');

        $this->expectException(PromoteAcademicYearException::class);
        $this->service->promote();
    }

    public function test_promote_succeeds_after_missing_option_is_added(): void
    {
        $siswa = $this->makeStudent('x-te-4', 'X TE 4');

        ClassOption::query()->create([
            'name' => 'XI TAV 4',
            'sort_order' => 99,
        ]);

        $this->service->promote();

        $this->assertSame('XI TAV 4', $siswa->fresh()->class);
        $this->assertSame('active', $siswa->fresh()->status);
    }

    private function makeStudent(string $username, string $class, string $status = 'active'): User
    {
        return User::query()->create([
            'name' => ucfirst($username),
            'username' => $username,
            'email' => $username.'@test.local',
            'password' => 'password',
            'role' => 'siswa',
            'status' => $status,
            'class' => $class,
            'angkatan' => AcademicYear::fromClass($class),
            'nisn' => '0088'.substr(md5($username), 0, 6),
        ]);
    }

    private function makeGuru(): User
    {
        return User::query()->create([
            'name' => 'Guru Dummy',
            'username' => 'guru-promote',
            'email' => 'guru-promote@test.local',
            'password' => 'password',
            'role' => 'guru',
            'status' => 'active',
            'nip' => 'GRUPROMOTE',
        ]);
    }
}
