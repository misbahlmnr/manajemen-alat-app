<?php

namespace App\Services\User;

class UserImportResult
{
    /**
     * @param  array<int, string>  $errors
     */
    public function __construct(
        public int $imported = 0,
        public int $failed = 0,
        public array $errors = [],
    ) {}

    public function hasFailures(): bool
    {
        return $this->failed > 0;
    }
}
