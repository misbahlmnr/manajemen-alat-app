<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\LoadsDashboardData;
use App\Http\Controllers\Controller;

class DashboardController extends Controller
{
    use LoadsDashboardData;

    public function index()
    {
        return $this->dashboardIndex('Admin/Dashboard/Index');
    }
}
