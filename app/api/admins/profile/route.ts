// app/api/admins/profile/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, username, jabatan, currentPassword, newPassword } = body;

    // 1. Cek Admin
    const admin = await prisma.admin.findUnique({
      where: { id: String(id) }, 
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin tidak ditemukan" }, { status: 404 });
    }

    // 2. Update Profil (Username & Jabatan saja)
    if (username || jabatan) {
      await prisma.admin.update({
        where: { id: String(id) },
        data: {
          username: username || admin.username,
          jabatan: jabatan || admin.jabatan,
        },
      });
    }

    // 3. Update Password (Jika diisi)
    if (newPassword && currentPassword) {
        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch) {
            return NextResponse.json({ error: "Password lama salah!" }, { status: 400 });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.admin.update({
            where: { id: String(id) },
            data: { password: hashedPassword },
        });
    }

    return NextResponse.json({ message: "Update berhasil" });
  } catch (error) {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}