<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ImportUsersRequest;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\User;
use App\Services\User\PromoteAcademicYearException;
use App\Services\User\PromoteAcademicYearService;
use App\Services\User\UserImportService;
use App\Support\AcademicYear;
use App\Support\ClassOptions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class UserController extends Controller
{
    public function index(Request $request, PromoteAcademicYearService $promoteService): Response|RedirectResponse
    {
        $this->authorize('viewAny', User::class);

        $scope = $request->string('scope')->toString();

        if (! in_array($scope, ['siswa', 'pengguna'], true)) {
            return redirect()->route('admin.users.index', ['scope' => 'siswa']);
        }

        $search = $request->string('search')->trim();
        $status = $request->string('status')->toString() ?: 'all';
        $class = $request->string('class')->toString() ?: 'all';
        $angkatan = $request->string('angkatan')->toString() ?: 'all';
        $staffRole = $request->string('staff_role')->toString() ?: 'all';

        $users = User::query()
            ->when($scope === 'siswa', fn ($query) => $query->where('role', 'siswa'))
            ->when($scope === 'pengguna', function ($query) use ($staffRole) {
                $query->whereIn('role', ['admin', 'guru']);

                if (in_array($staffRole, ['admin', 'guru'], true)) {
                    $query->where('role', $staffRole);
                }
            })
            ->when($search->isNotEmpty(), function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('username', 'like', "%{$search}%")
                        ->orWhere('nisn', 'like', "%{$search}%")
                        ->orWhere('nip', 'like', "%{$search}%");
                });
            })
            ->when($status !== 'all', fn ($query) => $query->where('status', $status))
            ->when($scope === 'siswa' && $class !== 'all', fn ($query) => $query->where('class', $class))
            ->when($scope === 'siswa' && $angkatan !== 'all', fn ($query) => $query->where('angkatan', $angkatan))
            ->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(fn (User $user) => $this->formatUser($user));

        return Inertia::render('Admin/User/Index', [
            'users' => $users,
            'scope' => $scope,
            'filters' => [
                'search' => $search->toString(),
                'status' => $status,
                'class' => $class,
                'angkatan' => $angkatan,
                'staff_role' => $staffRole,
            ],
            'classOptions' => $scope === 'siswa' ? ClassOptions::names() : [],
            'angkatanOptions' => $scope === 'siswa' ? AcademicYear::options() : [],
            'promotePreview' => $scope === 'siswa' ? $promoteService->preview() : null,
        ]);
    }

    public function promoteYearPreview(PromoteAcademicYearService $promoteService): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        return response()->json($promoteService->preview());
    }

    public function promoteYear(PromoteAcademicYearService $promoteService): RedirectResponse
    {
        $this->authorize('create', User::class);

        try {
            $totals = $promoteService->promote();
        } catch (PromoteAcademicYearException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        $parts = [];

        if ($totals['graduate'] > 0) {
            $parts[] = "{$totals['graduate']} siswa diluluskan";
        }

        if ($totals['promote'] > 0) {
            $parts[] = "{$totals['promote']} siswa naik kelas";
        }

        $message = $parts === []
            ? 'Tahun ajaran dinaikkan.'
            : 'Tahun ajaran dinaikkan: '.implode(', ', $parts).'.';

        return redirect()
            ->route('admin.users.index', ['scope' => 'siswa'])
            ->with('success', $message);
    }

    public function create(Request $request): Response
    {
        $this->authorize('create', User::class);

        $scope = $this->listScope($request->string('scope')->toString() ?: 'siswa');

        return Inertia::render('Admin/User/Create', [
            'scope' => $scope,
            'classOptions' => ClassOptions::names(),
            'angkatanOptions' => AcademicYear::options(),
        ]);
    }

    public function importForm(): Response
    {
        $this->authorize('create', User::class);

        return Inertia::render('Admin/User/Import', [
            'classOptions' => ClassOptions::names(),
            'defaultPasswordHint' => (string) config('lab.user_import.default_password', 'Password123'),
            'importErrors' => session('import_errors', []),
            'importSummary' => session('import_summary'),
            'scope' => 'siswa',
        ]);
    }

    public function import(ImportUsersRequest $request, UserImportService $importService): RedirectResponse
    {
        $this->authorize('create', User::class);

        $result = $importService->importFromFile($request->file('file'));

        if ($result->errors !== [] && $result->imported === 0 && isset($result->errors[0])) {
            return redirect()
                ->route('admin.users.import')
                ->with('error', $result->errors[0])
                ->with('import_errors', $result->errors)
                ->with('import_summary', [
                    'imported' => $result->imported,
                    'failed' => max($result->failed, count($result->errors)),
                ]);
        }

        $summary = [
            'imported' => $result->imported,
            'failed' => $result->failed,
        ];

        if ($result->hasFailures()) {
            $message = $result->imported > 0
                ? "{$result->imported} pengguna berhasil diimpor. {$result->failed} baris gagal."
                : "Import gagal. {$result->failed} baris memiliki error.";

            return redirect()
                ->route('admin.users.import')
                ->with($result->imported > 0 ? 'success' : 'error', $message)
                ->with('import_errors', $result->errors)
                ->with('import_summary', $summary);
        }

        return redirect()
            ->route('admin.users.index', ['scope' => 'siswa'])
            ->with('success', "{$result->imported} pengguna berhasil diimpor.");
    }

    public function downloadImportTemplate(UserImportService $importService): StreamedResponse
    {
        $this->authorize('create', User::class);

        return $importService->downloadTemplate();
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
            $data['angkatan'] = null;
        }

        if (! in_array($data['role'], ['guru', 'admin'], true)) {
            $data['nip'] = null;
        }

        $user = User::create($data);

        return redirect()
            ->route('admin.users.index', ['scope' => $this->scopeFor($user)])
            ->with('success', $user->role === 'siswa' ? 'Siswa berhasil ditambahkan.' : 'Pengguna berhasil ditambahkan.');
    }

    public function show(User $user): Response
    {
        $this->authorize('view', $user);

        return Inertia::render('Admin/User/Show', [
            'user' => $this->formatUser($user),
            'scope' => $this->scopeFor($user),
        ]);
    }

    public function edit(User $user): Response
    {
        $this->authorize('update', $user);

        return Inertia::render('Admin/User/Edit', [
            'user' => $this->formatUser($user),
            'scope' => $this->scopeFor($user),
            'classOptions' => ClassOptions::names(),
            'angkatanOptions' => AcademicYear::options($user->angkatan),
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
            $data['angkatan'] = null;
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

        $scope = $this->scopeFor($user);
        $user->delete();

        return redirect()
            ->route('admin.users.index', ['scope' => $scope])
            ->with('success', $scope === 'siswa' ? 'Siswa berhasil dihapus.' : 'Pengguna berhasil dihapus.');
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
            'angkatan' => $user->angkatan,
            'nisn' => $user->nisn,
            'nip' => $user->nip,
            'identifier_label' => $user->identifier_label,
            'created_at' => $user->created_at?->toIso8601String(),
            'created_at_formatted' => $user->created_at?->translatedFormat('d M Y'),
            'updated_at_formatted' => $user->updated_at?->translatedFormat('d M Y H:i'),
        ];
    }

    private function listScope(string $scope): string
    {
        return in_array($scope, ['siswa', 'pengguna'], true) ? $scope : 'siswa';
    }

    private function scopeFor(User $user): string
    {
        return $user->role === 'siswa' ? 'siswa' : 'pengguna';
    }
}
