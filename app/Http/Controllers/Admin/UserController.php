<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\GuruProfile;
use App\Models\SiswaProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $role = $request->get('role', 'admin');

        $users = User::where('role', $role)
            ->with($role === 'guru' ? 'guruProfile' : ($role === 'siswa' ? 'siswaProfile' : []))
            ->paginate(10);

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'role' => $role,
        ]);
    }

    public function create(Request $request)
    {
        $role = $request->get('role', 'admin');
        return Inertia::render('Admin/Users/Create', ['role' => $role]);
    }

    public function store(Request $request)
    {
        $role = $request->input('role');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|in:admin,guru,siswa',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
        ]);

        // Create profile based on role
        if ($role === 'guru') {
            $profileData = $request->validate([
                'nip' => 'required|string|unique:guru_profiles',
                'jenis_kelamin' => 'required|in:Laki-laki,Perempuan',
                'tempat_lahir' => 'required|string',
                'tanggal_lahir' => 'required|date',
                'alamat' => 'required|string',
                'no_hp' => 'required|string',
                'status_kepegawaian' => 'required|in:pns,honorer',
            ]);

            GuruProfile::create(array_merge($profileData, ['user_id' => $user->id]));
        } elseif ($role === 'siswa') {
            $profileData = $request->validate([
                'nis' => 'required|string|unique:siswa_profiles',
                'nisn' => 'required|string|unique:siswa_profiles',
                'jenis_kelamin' => 'required|in:Laki-laki,Perempuan',
                'tempat_lahir' => 'required|string',
                'tanggal_lahir' => 'required|date',
                'no_hp' => 'nullable|string',
                'angkatan' => 'required|string',
                'nama_ortu' => 'nullable|string',
                'kontak_ortu' => 'nullable|string',
            ]);

            SiswaProfile::create(array_merge($profileData, ['user_id' => $user->id]));
        }

        return redirect()->route('admin.users.index', ['role' => $role])
            ->with('message', 'User created successfully');
    }

    public function edit(User $user)
    {
        $user->load($user->role === 'guru' ? 'guruProfile' : ($user->role === 'siswa' ? 'siswaProfile' : []));

        return Inertia::render('Admin/Users/Edit', [
            'user' => $user,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
        ]);

        $user->update($validated);

        // Update profile
        if ($user->role === 'guru' && $user->guruProfile) {
            $profileData = $request->validate([
                'nip' => 'required|string|unique:guru_profiles,nip,' . $user->guruProfile->id,
                'jenis_kelamin' => 'required|in:Laki-laki,Perempuan',
                'tempat_lahir' => 'required|string',
                'tanggal_lahir' => 'required|date',
                'alamat' => 'required|string',
                'no_hp' => 'required|string',
                'status_kepegawaian' => 'required|in:pns,honorer',
            ]);

            $user->guruProfile->update($profileData);
        } elseif ($user->role === 'siswa' && $user->siswaProfile) {
            $profileData = $request->validate([
                'nis' => 'required|string|unique:siswa_profiles,nis,' . $user->siswaProfile->id,
                'nisn' => 'required|string|unique:siswa_profiles,nisn,' . $user->siswaProfile->id,
                'jenis_kelamin' => 'required|in:Laki-laki,Perempuan',
                'tempat_lahir' => 'required|string',
                'tanggal_lahir' => 'required|date',
                'no_hp' => 'nullable|string',
                'angkatan' => 'required|string',
                'nama_ortu' => 'nullable|string',
                'kontak_ortu' => 'nullable|string',
            ]);

            $user->siswaProfile->update($profileData);
        }

        return redirect()->route('admin.users.index', ['role' => $user->role])
            ->with('message', 'User updated successfully');
    }

    public function destroy(User $user)
    {
        $role = $user->role;
        $user->delete();

        return redirect()->route('admin.users.index', ['role' => $role])
            ->with('message', 'User deleted successfully');
    }
}
