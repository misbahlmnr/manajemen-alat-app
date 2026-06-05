<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class LabNotification extends Notification implements ShouldBroadcast, ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $eventType,
        public string $title,
        public string $message,
        public string $severity = 'info',
        public ?string $actionUrl = null,
        public ?int $loanId = null,
        public ?string $loanCode = null,
    ) {}

    public function via(object $notifiable): array
    {
        $channels = ['database', 'broadcast'];

        if (method_exists($notifiable, 'pushSubscriptions') && $notifiable->pushSubscriptions()->exists()) {
            $channels[] = WebPushChannel::class;
        }

        return $channels;
    }

    public function toArray(object $notifiable): array
    {
        return $this->payload();
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            ...$this->payload(),
            'unread_count' => $notifiable->unreadNotifications()->count(),
        ]);
    }

    public function toWebPush(object $notifiable, mixed $notification): WebPushMessage
    {
        return (new WebPushMessage)
            ->title($this->title)
            ->body($this->message)
            ->icon('/favicon.ico')
            ->data([
                'url' => $this->actionUrl ?? url('/dashboard'),
                'event_type' => $this->eventType,
            ])
            ->options(['TTL' => 86400]);
    }

    private function payload(): array
    {
        return [
            'event_type' => $this->eventType,
            'title' => $this->title,
            'message' => $this->message,
            'severity' => $this->severity,
            'action_url' => $this->actionUrl,
            'loan_id' => $this->loanId,
            'loan_code' => $this->loanCode,
        ];
    }
}
