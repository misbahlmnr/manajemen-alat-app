<?php

use App\Support\InventoryCategories;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('equipment')
            ->select('id', 'name', 'category', 'item_type')
            ->orderBy('id')
            ->get()
            ->each(function (object $row): void {
                $next = $row->item_type === 'bahan'
                    ? InventoryCategories::remapBahan($row->category, $row->name ?? '')
                    : InventoryCategories::remapAlat($row->category, $row->name ?? '');

                if ($next !== $row->category) {
                    DB::table('equipment')->where('id', $row->id)->update([
                        'category' => $next,
                    ]);
                }
            });
    }

    public function down(): void
    {
        //
    }
};
