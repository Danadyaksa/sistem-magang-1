import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // 1. Cari admin berdasarkan username
    const admin = await prisma.admin.findUnique({
      where: { username }
    });

    // 2. Cek apakah admin ada?
    if (!admin) {
      return NextResponse.json({ error: "Username tidak ditemukan." }, { status: 401 });
    }

    // 3. Cek Password (Manual / Tanpa Bcrypt sesuai requestmu)
    if (admin.password !== password) {
      return NextResponse.json({ error: "Password salah." }, { status: 401 });
    }

    // 4. Login Sukses
    return NextResponse.json({ 
      success: true, 
      user: { id: admin.id, username: admin.username } 
    });

  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}