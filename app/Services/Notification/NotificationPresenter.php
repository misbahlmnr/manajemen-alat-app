<?php

namespace App\Services\Notification;

use App\Models\User;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Collection;

class NotificationPresenter
{
    public function recentForUser(User $user, int $limit = 10): array
    {
        return $user->notifications()
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn (DatabaseNotification $notification) => $this->format($notification))
            ->values()
            ->all();
    }

    public function paginatedForUser(User $user, int $perPage = 20)
    {
        return $user->notifications()
            ->latest()
            ->paginate($perPage)
            ->through(fn (DatabaseNotification $notification) => $this->format($notification));
    }

    public function unreadCount(User $user): int
    {
        return $user->unreadNotifications()->count();
    }

    public function format(DatabaseNotification $notification): array
    {
        $data = $notification->data;

        return [
            'id' => $notification->id,
            'event_type' => $data['event_type'] ?? 'info',
            'title' => $data['title'] ?? 'Notifikasi',
            'message' => $data['message'] ?? '',
            'type' => $data['severity'] ?? 'info',
            'read' => $notification->read_at !== null,
            'read_at' => $notification->read_at?->toIso8601String(),
            'created_at' => $notification->created_at?->translatedFormat('d M Y H:i'),
            'created_at_human' => $notification->created_at?->diffForHumans(),
            'action_url' => $data['action_url'] ?? null,
            'loan_id' => $data['loan_id'] ?? null,
            'loan_code' => $data['loan_code'] ?? null,
        ];
    }

    public function indexRouteFor(User $user): string
    {
        return match ($user->role) {
            'admin' => route('admin.notifications.index'),
            'guru' => route('guru.notifications.index'),
            default => route('siswa.notifications.index'),
        };
    }
}
