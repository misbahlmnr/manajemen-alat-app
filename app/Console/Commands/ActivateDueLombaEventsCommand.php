<?php

namespace App\Console\Commands;

use App\Services\Loan\LombaEventLoanService;
use Illuminate\Console\Command;

class ActivateDueLombaEventsCommand extends Command
{
    protected $signature = 'lomba:activate-due';

    protected $description = 'Buat pengajuan peminjaman untuk Event Lomba yang sudah memasuki waktu aktivasi (H-1)';

    public function handle(LombaEventLoanService $lombaEvents): int
    {
        $activated = $lombaEvents->activateDueEvents();

        $this->info("Aktivasi Event Lomba selesai ({$activated} event).");

        return self::SUCCESS;
    }
}
