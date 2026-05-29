<?php

namespace App\Http\Controllers\Concerns;

use App\Services\Dashboard\DashboardDataService;
use Inertia\Inertia;
use Inertia\Response;

trait LoadsDashboardData
{
    protected function dashboardIndex(string $page): Response
    {
        $user = auth()->user();
        $payload = app(DashboardDataService::class)->forUser($user);

        return Inertia::render($page, [
            ...$payload,
            'kelasName' => $user->class ?? null,
        ]);
    }
}
