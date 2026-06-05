<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use NotificationChannels\WebPush\HasPushSubscriptions;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, HasPushSubscriptions, Notifiable;

    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'role',
        'status',
        'phone',
        'nisn',
        'nip',
        'class',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $appends = [
        'identifier_label',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isGuru(): bool
    {
        return $this->role === 'guru';
    }

    public function isSiswa(): bool
    {
        return $this->role === 'siswa';
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function getIdentifierLabelAttribute(): ?string
    {
        return match ($this->role) {
            'siswa' => $this->nisn,
            'guru', 'admin' => $this->nip,
            default => null,
        };
    }

    public static function generateUsername(string $email, ?string $name = null): string
    {
        $base = Str::slug(Str::before($email, '@'), '_');
        if ($base === '') {
            $base = Str::slug($name ?? 'user', '_');
        }

        $username = $base;
        $counter = 1;

        while (static::where('username', $username)->exists()) {
            $username = $base.'_'.$counter;
            $counter++;
        }

        return $username;
    }
}
