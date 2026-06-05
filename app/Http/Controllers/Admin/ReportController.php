<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Report\AdminReportDataService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        $payload = app(AdminReportDataService::class)->forRequest($request);

        return Inertia::render('Admin/Report/Index', $payload);
    }
}
