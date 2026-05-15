<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Admin\{DashboardController as AdminDashboardController};
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

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
