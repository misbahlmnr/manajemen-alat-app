<?php

use App\Models\User;
use App\Support\AcademicYear;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('angkatan', 9)->nullable()->after('class');
        });

        User::query()
            ->where('role', 'siswa')
            ->get(['id', 'class'])
            ->each(function (User $user): void {
                $user->forceFill([
                    'angkatan' => AcademicYear::fromClass($user->class),
                ])->saveQuietly();
            });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('angkatan');
        });
    }
};
