<?php

namespace App\Http\Controllers\Siswa;

use App\Http\Controllers\Controller;
use App\Services\Dashboard\SiswaDashboardDataService;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();
        $payload = app(SiswaDashboardDataService::class)->forUser($user);

        return Inertia::render('Siswa/Dashboard/Index', [
            ...$payload,
            'kelasName' => $user->class ?? null,
        ]);
    }
}
