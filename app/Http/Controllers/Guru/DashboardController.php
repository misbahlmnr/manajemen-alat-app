<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Services\Dashboard\GuruDashboardDataService;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();
        $payload = app(GuruDashboardDataService::class)->forUser($user);

        return Inertia::render('Guru/Dashboard/Index', $payload);
    }
}
