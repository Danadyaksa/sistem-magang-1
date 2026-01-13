// app/api/admins/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export const dynamic = 'force-dynamic';

// GET: Ambil detail admin (Tetap sama)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await prisma.admin.findUnique({
      where: { id },
      select: { id: true, username: true, jabatan: true }
    });
    if (!admin) return NextResponse.json({ error: "Admin tidak ditemukan" }, { status: 404 });
    return NextResponse.json(admin);
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// PUT: Update Profil & Password (LOGIKA BARU 3 KOLOM)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { username, jabatan, currentPassword, newPassword } = body;

    // 1. Cek User di Database
    const admin = await prisma.admin.findUnique({ where: { id } });
    if (!admin) {
      return NextResponse.json({ error: "Admin tidak ditemukan" }, { status: 404 });
    }

    const updateData: any = {};

    // 2. Update Info Dasar (Username / Jabatan)
    if (jabatan !== undefined) updateData.jabatan = jabatan;
    
    if (username && username !== admin.username) {
      const exist = await prisma.admin.findUnique({ where: { username } });
      if (exist) return NextResponse.json({ error: "Username sudah dipakai!" }, { status: 409 });
      updateData.username = username;
    }

    // 3. Update Password (WAJIB Ada Password Lama)
    if (newPassword) {
      // Validasi: Password lama wajib diisi
      if (!currentPassword) {
        return NextResponse.json({ error: "Mohon masukkan password lama untuk verifikasi!" }, { status: 400 });
      }

      // Validasi: Cek kecocokan password lama
      const isMatch = await bcrypt.compare(currentPassword, admin.password);
      if (!isMatch) {
        return NextResponse.json({ error: "Password lama salah!" }, { status: 401 });
      }

      // Validasi: Password baru minimal 6 karakter
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "Password baru minimal 6 karakter!" }, { status: 400 });
      }

      // Hash password baru
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedPassword;
    }

    // 4. Eksekusi Update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "Tidak ada perubahan data" });
    }

    await prisma.admin.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ message: "Data berhasil diperbarui" });

  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: "Gagal update data" }, { status: 500 });
  }
}

// DELETE: Hapus Admin (Tetap sama)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.admin.delete({ where: { id } });
    return NextResponse.json({ message: "Admin berhasil dihapus" });
  } catch (error) {
    return NextResponse.json({ error: "Gagal hapus admin" }, { status: 500 });
  }
}