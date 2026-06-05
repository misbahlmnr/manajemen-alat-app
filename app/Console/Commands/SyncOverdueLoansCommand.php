<?php

namespace App\Console\Commands;

use App\Services\Loan\LoanWorkflowService;
use Illuminate\Console\Command;

class SyncOverdueLoansCommand extends Command
{
    protected $signature = 'loans:sync-overdue';

    protected $description = 'Tandai peminjaman terlambat dan kirim notifikasi';

    public function handle(LoanWorkflowService $workflow): int
    {
        $workflow->syncOverdue();
        $this->info('Sinkronisasi keterlambatan selesai.');

        return self::SUCCESS;
    }
}
