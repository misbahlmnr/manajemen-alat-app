<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AngkatanOption;
use App\Models\ClassOption;
use App\Support\AcademicYear;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ClassOptionController extends Controller
{
    public function index(): Response
    {
        $this->authorize('create', \App\Models\User::class);

        $options = ClassOption::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (ClassOption $option) => [
                'id' => $option->id,
                'name' => $option->name,
                'in_use' => $option->isInUse(),
            ]);

        $angkatanOptions = AngkatanOption::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (AngkatanOption $option) => [
                'id' => $option->id,
                'name' => $option->name,
                'in_use' => $option->isInUse(),
            ]);

        return Inertia::render('Admin/User/ClassOptions', [
            'options' => $options,
            'angkatanOptions' => $angkatanOptions,
            'scope' => 'siswa',
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', \App\Models\User::class);

        $request->merge([
            'name' => trim((string) $request->input('name')),
        ]);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:50',
                Rule::unique(ClassOption::class, 'name'),
            ],
        ], [], [
            'name' => 'nama kelas',
        ]);

        $name = trim($validated['name']);
        $nextOrder = (int) ClassOption::query()->max('sort_order') + 1;

        ClassOption::query()->create([
            'name' => $name,
            'sort_order' => $nextOrder,
        ]);

        return back()->with('success', "Kelas {$name} ditambahkan.");
    }

    public function destroy(ClassOption $classOption): RedirectResponse
    {
        $this->authorize('create', \App\Models\User::class);

        if ($classOption->isInUse()) {
            return back()->with('error', 'Kelas masih dipakai siswa atau jadwal, tidak dapat dihapus.');
        }

        $name = $classOption->name;
        $classOption->delete();

        return back()->with('success', "Kelas {$name} dihapus dari daftar opsi.");
    }

    public function storeAngkatan(Request $request): RedirectResponse
    {
        $this->authorize('create', \App\Models\User::class);

        $request->merge([
            'angkatan' => trim((string) $request->input('angkatan')),
        ]);

        $validated = $request->validate([
            'angkatan' => [
                'required',
                'string',
                'max:9',
                AcademicYear::assertValid(),
                Rule::unique(AngkatanOption::class, 'name'),
            ],
        ], [], [
            'angkatan' => 'angkatan',
        ]);

        $name = $validated['angkatan'];

        AngkatanOption::query()->create([
            'name' => $name,
            'sort_order' => (int) substr($name, 0, 4),
        ]);

        return back()->with('success', "Angkatan {$name} ditambahkan.");
    }

    public function destroyAngkatan(AngkatanOption $angkatanOption): RedirectResponse
    {
        $this->authorize('create', \App\Models\User::class);

        if ($angkatanOption->isInUse()) {
            return back()->with('error', 'Angkatan masih dipakai siswa, tidak dapat dihapus.');
        }

        $name = $angkatanOption->name;
        $angkatanOption->delete();

        return back()->with('success', "Angkatan {$name} dihapus dari daftar opsi.");
    }
}
