import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET: Ambil semua admin
export async function GET() {
  try {
    const admins = await prisma.admin.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        createdAt: true,
        // Password kita sembunyikan dari response biar ga muncul di tabel
      }
    });
    return NextResponse.json(admins);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}

// POST: Tambah admin baru (TANPA HASHING)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Cek duplikat username
    const existingUser = await prisma.admin.findUnique({
      where: { username }
    });

    if (existingUser) {
      return NextResponse.json({ error: "Username sudah dipakai!" }, { status: 400 });
    }

    // Simpan data (Password Polos)
    const newAdmin = await prisma.admin.create({
      data: {
        username,
        password, // Langsung simpan apa adanya
      },
    });

    return NextResponse.json({ 
      id: newAdmin.id, 
      username: newAdmin.username 
    });

  } catch (error) {
    console.error("Error Create Admin:", error);
    return NextResponse.json({ error: "Gagal membuat admin" }, { status: 500 });
  }
}