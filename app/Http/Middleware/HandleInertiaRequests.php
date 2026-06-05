<?php

namespace App\Http\Middleware;

use App\Services\Notification\NotificationPresenter;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $presenter = app(NotificationPresenter::class);

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'notifications' => fn () => $user
                ? $presenter->recentForUser($user, 10)
                : [],
            'unreadNotifications' => fn () => $user
                ? $presenter->unreadCount($user)
                : 0,
            'notificationsIndexUrl' => fn () => $user
                ? $presenter->indexRouteFor($user)
                : null,
            'broadcasting' => fn () => [
                'enabled' => config('broadcasting.default') === 'pusher'
                    && filled(config('broadcasting.connections.pusher.key')),
                'key' => config('broadcasting.connections.pusher.key'),
                'cluster' => config('broadcasting.connections.pusher.options.cluster'),
                'user_id' => $user?->id,
            ],
            'webPush' => fn () => [
                'enabled' => filled(config('webpush.vapid.public_key')),
                'publicKey' => config('webpush.vapid.public_key'),
            ],
        ];
    }
}
