import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // <-- Ubah Tipe Jadi Promise
) {
  try {
    const { id } = await params; // <-- WAJIB DI-AWAIT DI NEXT.JS 15

    // Cek admin
    const admin = await prisma.admin.findUnique({
      where: { id: id }, 
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin tidak ditemukan" }, { status: 404 });
    }

    await prisma.admin.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: "Admin berhasil dihapus" });
  } catch (error) {
    console.error("Delete Admin Error:", error);
    return NextResponse.json({ error: "Gagal menghapus admin" }, { status: 500 });
  }
}