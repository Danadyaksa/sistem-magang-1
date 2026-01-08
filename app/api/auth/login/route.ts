// app/api/auth/login/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validasi input
    if (!username || !password) {
      return NextResponse.json({ error: "Isi username dan password" }, { status: 400 });
    }

    // --- LOGIKA CEK USERNAME & PASSWORD ---
    // (Ganti bagian ini dengan cek database beneran nanti)
    if (username !== "admin" || password !== "admin123") {
      return NextResponse.json({ error: "Username atau password salah!" }, { status: 401 });
    }

    // Buat response sukses
    const response = NextResponse.json(
      { success: true, message: "Login berhasil" },
      { status: 200 }
    );

    // --- BAGIAN PENTING: SET COOKIE ---
    // Nama cookie DI SINI harus sama dengan DI MIDDLEWARE
    // Middleware kamu cari: 'admin_session'
    response.cookies.set({
      name: "admin_session", // <--- SUDAH DISAMAKAN
      value: "token-rahasia-admin-disdikpora", 
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/", 
      maxAge: 60 * 60 * 24, // 1 hari
    });

    return response;

  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}