<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', User::class);

        $search = $request->string('search')->trim();
        $role = $request->string('role')->toString() ?: 'all';

        $users = User::query()
            ->when($search->isNotEmpty(), function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('username', 'like', "%{$search}%")
                        ->orWhere('nisn', 'like', "%{$search}%")
                        ->orWhere('nip', 'like', "%{$search}%");
                });
            })
            ->when($role !== 'all', fn ($query) => $query->where('role', $role))
            ->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(fn (User $user) => $this->formatUser($user));

        $counts = [
            'all' => User::count(),
            'siswa' => User::where('role', 'siswa')->count(),
            'guru' => User::where('role', 'guru')->count(),
            'admin' => User::where('role', 'admin')->count(),
        ];

        return Inertia::render('Admin/User/Index', [
            'users' => $users,
            'filters' => [
                'search' => $search->toString(),
                'role' => $role,
            ],
            'roleCounts' => $counts,
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', User::class);

        return Inertia::render('Admin/User/Create', [
            'classOptions' => config('lab.class_options'),
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['username'] = $data['username']
            ?? User::generateUsername($data['email'], $data['name']);
        $data['password'] = Hash::make($data['password']);

        if ($data['role'] !== 'siswa') {
            $data['class'] = null;
            $data['nisn'] = null;
        }

        if (! in_array($data['role'], ['guru', 'admin'], true)) {
            $data['nip'] = null;
        }

        User::create($data);

        return redirect()
            ->route('admin.users.index')
            ->with('success', 'Pengguna berhasil ditambahkan.');
    }

    public function show(User $user): Response
    {
        $this->authorize('view', $user);

        return Inertia::render('Admin/User/Show', [
            'user' => $this->formatUser($user),
        ]);
    }

    public function edit(User $user): Response
    {
        $this->authorize('update', $user);

        return Inertia::render('Admin/User/Edit', [
            'user' => $this->formatUser($user),
            'classOptions' => config('lab.class_options'),
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $data = $request->validated();

        if (empty($data['password'])) {
            unset($data['password']);
        } else {
            $data['password'] = Hash::make($data['password']);
        }

        if ($data['role'] !== 'siswa') {
            $data['class'] = null;
            $data['nisn'] = null;
        }

        if (! in_array($data['role'], ['guru', 'admin'], true)) {
            $data['nip'] = null;
        }

        $user->update($data);

        return redirect()
            ->route('admin.users.show', $user)
            ->with('success', 'Pengguna berhasil diperbarui.');
    }

    public function destroy(User $user): RedirectResponse
    {
        $this->authorize('delete', $user);

        $user->delete();

        return redirect()
            ->route('admin.users.index')
            ->with('success', 'Pengguna berhasil dihapus.');
    }

    public function resetPassword(Request $request, User $user): RedirectResponse
    {
        $this->authorize('resetPassword', $user);

        $request->validate([
            'password' => ['required', 'confirmed', 'min:8'],
        ]);

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return back()->with('success', 'Kata sandi berhasil direset.');
    }

    private function formatUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'role' => $user->role,
            'status' => $user->status ?? 'active',
            'phone' => $user->phone,
            'class' => $user->class,
            'nisn' => $user->nisn,
            'nip' => $user->nip,
            'identifier_label' => $user->identifier_label,
            'created_at' => $user->created_at?->toIso8601String(),
            'created_at_formatted' => $user->created_at?->translatedFormat('d M Y'),
            'updated_at_formatted' => $user->updated_at?->translatedFormat('d M Y H:i'),
        ];
    }
}
