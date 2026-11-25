<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

class UserController extends Controller
{
    public function index()
    {
        $users = User::select('id', 'name', 'username', 'email', 'created_at')
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $users,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'username' => 'required|string|max:50|unique:users,username',
            'name' => 'required|string|max:100',
            'email' => 'nullable|string|max:150',
            'password' => 'required|string|min:4',
        ], [
            'username.required' => 'Username wajib diisi.',
            'username.unique' => 'Username tersebut sudah digunakan oleh user lain.',
            'name.required' => 'Nama lengkap wajib diisi.',
            'password.required' => 'Password wajib diisi.',
            'password.min' => 'Password minimal 4 karakter.',
        ]);

        $user = User::create([
            'username' => trim($validated['username']),
            'name' => trim($validated['name']),
            'email' => !empty($validated['email']) ? trim($validated['email']) : trim($validated['username']) . '@sipd.local',
            'password' => Hash::make($validated['password']),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Pengguna baru berhasil ditambahkan.',
            'data' => [
                'id' => $user->id,
                'username' => $user->username,
                'name' => $user->name,
                'email' => $user->email,
                'created_at' => $user->created_at,
            ],
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'username' => 'required|string|max:50|unique:users,username,' . $id,
            'name' => 'required|string|max:100',
            'email' => 'nullable|string|max:150',
            'password' => 'nullable|string|min:4',
        ], [
            'username.required' => 'Username wajib diisi.',
            'username.unique' => 'Username sudah digunakan oleh user lain.',
            'name.required' => 'Nama lengkap wajib diisi.',
            'password.min' => 'Password baru minimal 4 karakter.',
        ]);

        $user->username = trim($validated['username']);
        $user->name = trim($validated['name']);
        if (!empty($validated['email'])) {
            $user->email = trim($validated['email']);
        }

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Data pengguna berhasil diperbarui.',
            'data' => [
                'id' => $user->id,
                'username' => $user->username,
                'name' => $user->name,
                'email' => $user->email,
                'created_at' => $user->created_at,
            ],
        ]);
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);

        if (Auth::check() && Auth::id() == $id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Anda tidak dapat menghapus akun yang sedang Anda gunakan saat ini.',
            ], 422);
        }

        if (User::count() <= 1) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak dapat menghapus user terakhir. Sistem harus memiliki minimal satu akun administrator.',
            ], 422);
        }

        $user->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Pengguna berhasil dihapus.',
        ]);
    }
}
