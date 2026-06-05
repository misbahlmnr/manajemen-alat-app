<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Services\Report\GuruReportDataService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        $payload = app(GuruReportDataService::class)->forRequest($request);

        return Inertia::render('Guru/Report/Index', $payload);
    }
}
