<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'password' => 'required',
        ]);

        $login = trim($request->input('username', $request->input('email', '')));
        if (empty($login)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Username wajib diisi.',
            ], 422);
        }
        
        // Cek login murni via kolom username, name, atau email di database
        $user = User::where('username', $login)
            ->orWhere('name', $login)
            ->orWhere('email', $login)
            ->first();

        if ($user && \Illuminate\Support\Facades\Hash::check($request->input('password'), $user->password)) {
            Auth::login($user, $request->boolean('remember', true));
            $request->session()->regenerate();
            return response()->json([
                'status' => 'success',
                'message' => 'Login berhasil',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'email' => $user->email,
                ],
            ]);
        }

        return response()->json([
            'status' => 'error',
            'message' => 'Username atau password salah.',
        ], 401);
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'status' => 'success',
            'message' => 'Logout berhasil',
        ]);
    }

    public function me(Request $request)
    {
        if (Auth::check()) {
            $user = Auth::user();
            return response()->json([
                'authenticated' => true,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'email' => $user->email,
                ],
            ]);
        }

        return response()->json([
            'authenticated' => false,
            'user' => null,
        ]);
    }
}
