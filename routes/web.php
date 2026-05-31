<?php

use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\EquipmentController;
use App\Http\Controllers\Admin\LoanCollateralController;
use App\Http\Controllers\Admin\LoanController;
use App\Http\Controllers\Admin\PracticumScheduleController;
use App\Http\Controllers\Admin\SupplyController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Guru\DashboardController as GuruDashboardController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Siswa\DashboardController as SiswaDashboardController;
use App\Http\Controllers\Siswa\EquipmentController as SiswaEquipmentController;
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
    Route::resource('loans', LoanController::class);
    Route::post('loans/{loan}/approve', [LoanController::class, 'approve'])->name('loans.approve');
    Route::post('loans/{loan}/reject', [LoanController::class, 'reject'])->name('loans.reject');
    Route::post('loans/{loan}/mark-borrowed', [LoanController::class, 'markBorrowed'])->name('loans.mark-borrowed');
    Route::post('loans/{loan}/return', [LoanController::class, 'processReturn'])->name('loans.return');
    Route::resource('collaterals', LoanCollateralController::class);
    Route::post('collaterals/{collateral}/hold', [LoanCollateralController::class, 'hold'])->name('collaterals.hold');
    Route::post('collaterals/{collateral}/return-card', [LoanCollateralController::class, 'returnCard'])->name('collaterals.return-card');
    Route::post('collaterals/{collateral}/complete-compensation', [LoanCollateralController::class, 'completeCompensation'])->name('collaterals.complete-compensation');
    Route::post('loans/{loan}/inspect', [LoanCollateralController::class, 'inspect'])->name('loans.inspect');
});

Route::middleware(['auth', 'verified', 'role:siswa'])->prefix('siswa')->name('siswa.')->group(function () {
    Route::get('equipment', [SiswaEquipmentController::class, 'index'])->name('equipment.index');
    Route::get('equipment/{equipment}', [SiswaEquipmentController::class, 'show'])->name('equipment.show');
    Route::get('supplies', [SiswaSupplyController::class, 'index'])->name('supplies.index');
    Route::get('supplies/{supply}', [SiswaSupplyController::class, 'show'])->name('supplies.show');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
