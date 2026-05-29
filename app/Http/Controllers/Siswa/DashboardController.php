<?php

namespace App\Http\Controllers\Siswa;

use App\Http\Controllers\Concerns\LoadsDashboardData;
use App\Http\Controllers\Controller;

class DashboardController extends Controller
{
    use LoadsDashboardData;

    public function index()
    {
        return $this->dashboardIndex('Siswa/Dashboard/Index');
    }
}
