<?php

use App\Models\User;
use App\Support\AcademicYear;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('angkatan_options', function (Blueprint $table) {
            $table->id();
            $table->string('name', 9)->unique();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        $now = now();
        $names = collect(AcademicYear::generated())
            ->merge(
                Schema::hasColumn('users', 'angkatan')
                    ? User::query()->whereNotNull('angkatan')->distinct()->pluck('angkatan')
                    : []
            )
            ->filter(fn ($name) => AcademicYear::isValid((string) $name))
            ->unique()
            ->sort()
            ->values();

        $rows = $names
            ->map(fn (string $name, int $index) => [
                'name' => $name,
                'sort_order' => (int) substr($name, 0, 4),
                'created_at' => $now,
                'updated_at' => $now,
            ])
            ->all();

        if ($rows !== []) {
            DB::table('angkatan_options')->insert($rows);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('angkatan_options');
    }
};
