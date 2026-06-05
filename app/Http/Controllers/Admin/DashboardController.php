<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Dashboard\AdminDashboardDataService;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();
        $payload = app(AdminDashboardDataService::class)->forUser($user);

        return Inertia::render('Admin/Dashboard/Index', $payload);
    }
}
