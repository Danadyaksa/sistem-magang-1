import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export const dynamic = 'force-dynamic';

// 1. GET: Ambil data detail admin
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const admin = await prisma.admin.findUnique({
      where: { id },
      select: { 
        id: true, 
        username: true, 
        jabatan: true // Pastikan field ini ada di schema.prisma
      } 
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(admin);
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// 2. PUT: Update Profil & Password (Bisa sekaligus)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { username, jabatan, currentPassword, newPassword } = body;

    // Cek admin lama
    const admin = await prisma.admin.findUnique({ where: { id } });
    if (!admin) {
      return NextResponse.json({ error: "Admin tidak ditemukan" }, { status: 404 });
    }

    // Siapkan object penampung data yang akan diupdate
    const updateData: any = {};

    // --- LOGIKA 1: Update Info Dasar (Username/Jabatan) ---
    if (jabatan) {
      updateData.jabatan = jabatan;
    }

    if (username && username !== admin.username) {
      // Cek duplikat username hanya jika username berubah
      const exist = await prisma.admin.findUnique({ where: { username } });
      if (exist) {
        return NextResponse.json({ error: "Username sudah dipakai orang lain!" }, { status: 409 });
      }
      updateData.username = username;
    }

    // --- LOGIKA 2: Update Password (Jika diminta) ---
    if (newPassword) {
      // Validasi: Wajib kirim password lama
      if (!currentPassword) {
        return NextResponse.json({ error: "Untuk ganti password, masukkan password lama!" }, { status: 400 });
      }

      // Validasi: Cek password lama benar/salah
      const isMatch = await bcrypt.compare(currentPassword, admin.password);
      if (!isMatch) {
        return NextResponse.json({ error: "Password lama salah!" }, { status: 401 });
      }

      // Validasi: Password baru minimal 6 karakter
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "Password baru minimal 6 karakter!" }, { status: 400 });
      }

      // Hash password baru & masukkan ke updateData
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedPassword;
    }

    // --- EKSEKUSI UPDATE ---
    // Jika tidak ada data yang dikirim sama sekali
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "Tidak ada perubahan data" });
    }

    const updatedAdmin = await prisma.admin.update({
      where: { id },
      data: updateData,
      select: { id: true, username: true, jabatan: true } // Return data baru tanpa password
    });

    return NextResponse.json({ 
      message: "Data berhasil diperbarui", 
      admin: updatedAdmin 
    });

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

    // Cek dulu apakah admin ada
    const adminExist = await prisma.admin.findUnique({ where: { id } });
    if (!adminExist) {
        return NextResponse.json({ error: "Admin tidak ditemukan" }, { status: 404 });
    }

    await prisma.admin.delete({ where: { id } });
    
    return NextResponse.json({ message: "Admin berhasil dihapus" });
  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json({ error: "Gagal hapus admin" }, { status: 500 });
  }
}