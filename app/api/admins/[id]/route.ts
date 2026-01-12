// app/api/admins/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt"; // Pastikan import bcrypt

// 1. GET: Ambil data detail admin
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await prisma.admin.findUnique({
      where: { id },
      select: { id: true, username: true, jabatan: true } // Password tidak dikirim
    });

    if (!admin) return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    return NextResponse.json(admin);
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// 2. PUT: Update Profil & Password
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { username, jabatan, currentPassword, newPassword } = body;

    // Cek admin ada atau tidak
    const admin = await prisma.admin.findUnique({ where: { id } });
    if (!admin) return NextResponse.json({ error: "Admin not found" }, { status: 404 });

    // --- CASE A: Ganti Password ---
    if (newPassword && currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, admin.password);
      if (!isMatch) {
        return NextResponse.json({ error: "Password lama salah!" }, { status: 400 });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await prisma.admin.update({
        where: { id },
        data: { password: hashedPassword },
      });
      return NextResponse.json({ message: "Password berhasil diganti" });
    }

    // --- CASE B: Update Info (Username/Jabatan) ---
    // Cek username duplikat kalau diganti
    if (username && username !== admin.username) {
      const exist = await prisma.admin.findUnique({ where: { username } });
      if (exist) return NextResponse.json({ error: "Username sudah dipakai" }, { status: 400 });
    }

    await prisma.admin.update({
      where: { id },
      data: {
        username: username || admin.username,
        jabatan: jabatan || admin.jabatan,
      },
    });

    return NextResponse.json({ message: "Profil berhasil diupdate" });

  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: "Gagal update data" }, { status: 500 });
  }
}

// 3. DELETE: Hapus Admin
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.admin.delete({ where: { id } });
    return NextResponse.json({ message: "Admin deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Gagal hapus admin" }, { status: 500 });
  }
}