<?php

use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\EquipmentController;
use App\Http\Controllers\Admin\LoanCollateralController;
use App\Http\Controllers\Admin\LoanController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\PracticumScheduleController;
use App\Http\Controllers\Admin\SupplyController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Guru\DashboardController as GuruDashboardController;
use App\Http\Controllers\Guru\InventarisController as GuruInventarisController;
use App\Http\Controllers\Guru\LoanController as GuruLoanController;
use App\Http\Controllers\Guru\ScheduleController as GuruScheduleController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Siswa\DashboardController as SiswaDashboardController;
use App\Http\Controllers\Siswa\EquipmentController as SiswaEquipmentController;
use App\Http\Controllers\Siswa\LoanController as SiswaLoanController;
use App\Http\Controllers\Siswa\SupplyController as SiswaSupplyController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::get('/dashboard', function () {
    if (auth()->user()->isAdmin()) {
        return app(AdminDashboardController::class)->index();
    }

    if (auth()->user()->isGuru()) {
        return app(GuruDashboardController::class)->index();
    }

    if (auth()->user()->isSiswa()) {
        return app(SiswaDashboardController::class)->index();
    }

    return abort(403, 'Unauthorized action.');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::resource('users', UserController::class);
    Route::post('users/{user}/reset-password', [UserController::class, 'resetPassword'])
        ->name('users.reset-password');
    Route::resource('equipment', EquipmentController::class);
    Route::resource('supplies', SupplyController::class);
    Route::resource('schedules', PracticumScheduleController::class);
    Route::resource('loans', LoanController::class)->except(['create', 'store', 'edit', 'update']);
    Route::post('loans/{loan}/approve', [LoanController::class, 'approve'])->name('loans.approve');
    Route::post('loans/{loan}/reject', [LoanController::class, 'reject'])->name('loans.reject');
    Route::post('loans/{loan}/mark-borrowed', [LoanController::class, 'markBorrowed'])->name('loans.mark-borrowed');
    Route::post('loans/{loan}/return', [LoanController::class, 'processReturn'])->name('loans.return');
    Route::resource('collaterals', LoanCollateralController::class);
    Route::post('collaterals/{collateral}/hold', [LoanCollateralController::class, 'hold'])->name('collaterals.hold');
    Route::post('collaterals/{collateral}/return-card', [LoanCollateralController::class, 'returnCard'])->name('collaterals.return-card');
    Route::post('collaterals/{collateral}/complete-compensation', [LoanCollateralController::class, 'completeCompensation'])->name('collaterals.complete-compensation');
    Route::post('loans/{loan}/inspect', [LoanCollateralController::class, 'inspect'])->name('loans.inspect');
    Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
});

Route::middleware(['auth', 'verified', 'role:guru'])->prefix('guru')->name('guru.')->group(function () {
    Route::get('inventaris', [GuruInventarisController::class, 'index'])->name('inventaris.index');
    Route::get('inventaris/alat/{equipment}', [GuruInventarisController::class, 'showAlat'])->name('inventaris.alat.show');
    Route::get('inventaris/bahan/{supply}', [GuruInventarisController::class, 'showBahan'])->name('inventaris.bahan.show');
    Route::get('schedules', [GuruScheduleController::class, 'index'])->name('schedules.index');
    Route::get('schedules/{schedule}', [GuruScheduleController::class, 'show'])->name('schedules.show');
    Route::get('loans', [GuruLoanController::class, 'index'])->name('loans.index');
    Route::get('loans/{loan}', [GuruLoanController::class, 'show'])->name('loans.show');
});

Route::middleware(['auth', 'verified', 'role:siswa'])->prefix('siswa')->name('siswa.')->group(function () {
    Route::get('equipment', [SiswaEquipmentController::class, 'index'])->name('equipment.index');
    Route::get('equipment/{equipment}', [SiswaEquipmentController::class, 'show'])->name('equipment.show');
    Route::get('supplies', [SiswaSupplyController::class, 'index'])->name('supplies.index');
    Route::get('supplies/{supply}', [SiswaSupplyController::class, 'show'])->name('supplies.show');
    Route::get('loans', [SiswaLoanController::class, 'index'])->name('loans.index');
    Route::get('loans/create', [SiswaLoanController::class, 'create'])->name('loans.create');
    Route::post('loans', [SiswaLoanController::class, 'store'])->name('loans.store');
    Route::get('loans/{loan}/edit', [SiswaLoanController::class, 'edit'])->name('loans.edit');
    Route::put('loans/{loan}', [SiswaLoanController::class, 'update'])->name('loans.update');
    Route::get('loans/{loan}', [SiswaLoanController::class, 'show'])->name('loans.show');
    Route::post('loans/{loan}/cancel', [SiswaLoanController::class, 'cancel'])->name('loans.cancel');
    Route::post('loans/{loan}/request-return', [SiswaLoanController::class, 'requestReturn'])->name('loans.request-return');
    Route::get('ajukan-peminjaman', function () {
        return redirect()->route('siswa.loans.create', array_merge(
            ['type' => 'alat'],
            request()->query(),
        ));
    });
    Route::get('ambil-bahan', function () {
        return redirect()->route('siswa.loans.create', array_merge(
            ['type' => 'bahan'],
            request()->query(),
        ));
    });
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
