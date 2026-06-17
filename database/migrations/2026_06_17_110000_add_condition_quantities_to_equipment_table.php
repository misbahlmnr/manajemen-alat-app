<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('equipment', function (Blueprint $table) {
            $table->unsignedInteger('qty_baik')->default(0)->after('available');
            $table->unsignedInteger('qty_rusak_ringan')->default(0)->after('qty_baik');
            $table->unsignedInteger('qty_rusak_berat')->default(0)->after('qty_rusak_ringan');
        });

        DB::table('equipment')->orderBy('id')->lazy()->each(function ($row) {
            $stock = (int) $row->stock;
            $condition = $row->condition ?? 'baik';

            $qtyBaik = 0;
            $qtyRingan = 0;
            $qtyBerat = 0;

            match ($condition) {
                'rusak_ringan' => $qtyRingan = $stock,
                'rusak_berat' => $qtyBerat = $stock,
                default => $qtyBaik = $stock,
            };

            if ($row->item_type === 'bahan') {
                $qtyBaik = $stock;
                $qtyRingan = 0;
                $qtyBerat = 0;
            }

            DB::table('equipment')->where('id', $row->id)->update([
                'qty_baik' => $qtyBaik,
                'qty_rusak_ringan' => $qtyRingan,
                'qty_rusak_berat' => $qtyBerat,
            ]);
        });

        Schema::table('equipment', function (Blueprint $table) {
            $table->dropColumn('condition');
        });
    }

    public function down(): void
    {
        Schema::table('equipment', function (Blueprint $table) {
            $table->enum('condition', ['baik', 'rusak_ringan', 'rusak_berat'])->default('baik')->after('available');
        });

        DB::table('equipment')->orderBy('id')->lazy()->each(function ($row) {
            $condition = 'baik';

            if ((int) $row->qty_rusak_berat > 0 && (int) $row->qty_baik === 0 && (int) $row->qty_rusak_ringan === 0) {
                $condition = 'rusak_berat';
            } elseif ((int) $row->qty_rusak_ringan > 0 && (int) $row->qty_baik === 0) {
                $condition = 'rusak_ringan';
            } elseif ((int) $row->qty_rusak_berat >= (int) $row->qty_rusak_ringan && (int) $row->qty_rusak_berat > 0) {
                $condition = 'rusak_berat';
            } elseif ((int) $row->qty_rusak_ringan > 0) {
                $condition = 'rusak_ringan';
            }

            DB::table('equipment')->where('id', $row->id)->update(['condition' => $condition]);
        });

        Schema::table('equipment', function (Blueprint $table) {
            $table->dropColumn(['qty_baik', 'qty_rusak_ringan', 'qty_rusak_berat']);
        });
    }
};
