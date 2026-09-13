<?php

namespace Tests\Unit\Support;

use App\Support\AcademicYear;
use Tests\TestCase;

class AcademicYearTest extends TestCase
{
    public function test_from_class_uses_current_year_2026_2027(): void
    {
        $this->assertSame('2026/2027', AcademicYear::fromClass('X TE 1'));
        $this->assertSame('2025/2026', AcademicYear::fromClass('XI TAV 1'));
        $this->assertSame('2024/2025', AcademicYear::fromClass('XII TAV 3'));
        $this->assertSame('2026/2027', AcademicYear::fromClass(null));
        $this->assertSame('2026/2027', AcademicYear::fromClass('Kelas Aneh'));
    }

    public function test_rejects_invalid_labels(): void
    {
        $this->assertTrue(AcademicYear::isValid('2026/2027'));
        $this->assertFalse(AcademicYear::isValid('2026/2028'));
        $this->assertFalse(AcademicYear::isValid('2026'));
        $this->assertFalse(AcademicYear::isValid('staf'));
    }
}
