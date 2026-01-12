import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export const dynamic = 'force-dynamic';

// GET: Ambil semua admin
export async function GET() {
  try {
    const admins = await prisma.admin.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        jabatan: true, // <--- TAMBAHKAN INI! (Biar jabatannya keambil)
        createdAt: true,
      }
    });
    return NextResponse.json(admins);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}

// POST: Tambah admin baru
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Tambahkan 'jabatan' di sini biar waktu tambah user baru, jabatannya ikut tersimpan
    const { username, password, jabatan } = body; 

    // Validasi input
    if (!username || !password) {
      return NextResponse.json({ error: "Username & Password wajib diisi" }, { status: 400 });
    }

    // Cek duplikat username
    const existingUser = await prisma.admin.findUnique({
      where: { username }
    });

    if (existingUser) {
      return NextResponse.json({ error: "Username sudah dipakai!" }, { status: 409 });
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan data
    const newAdmin = await prisma.admin.create({
      data: {
        username,
        password: hashedPassword,
        jabatan: jabatan || "", // <--- Simpan jabatan ke database
      },
    });

    return NextResponse.json(newAdmin, { status: 201 });

  } catch (error) {
    console.error("Error Create Admin:", error);
    return NextResponse.json({ error: "Gagal membuat admin" }, { status: 500 });
  }
}