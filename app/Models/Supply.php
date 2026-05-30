<?php

namespace App\Models;

class Supply extends Equipment
{
    protected static function booted(): void
    {
        static::addGlobalScope('bahan', function ($query) {
            $query->where('item_type', 'bahan');
        });

        static::creating(function (Supply $supply) {
            $supply->item_type = 'bahan';

            if (! $supply->condition) {
                $supply->condition = 'baik';
            }
        });
    }
}
