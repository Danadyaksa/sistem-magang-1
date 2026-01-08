import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// --- DELETE: Hapus Bidang ---
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // <-- Ubah Tipe Jadi Promise
) {
  try {
    const { id } = await params; // <-- WAJIB DI-AWAIT
    const idInt = parseInt(id); 

    await prisma.position.delete({
      where: { id: idInt },
    });

    return NextResponse.json({ message: "Posisi berhasil dihapus" });
  } catch (error) {
    console.error("Delete Position Error:", error);
    return NextResponse.json({ error: "Gagal menghapus posisi" }, { status: 500 });
  }
}

// --- PUT: Edit Bidang ---
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // <-- Ubah Tipe Jadi Promise
) {
  try {
    const { id } = await params; // <-- WAJIB DI-AWAIT
    const idInt = parseInt(id);
    
    const body = await request.json();

    const updatedPosition = await prisma.position.update({
      where: { id: idInt },
      data: {
        title: body.title,
        quota: parseInt(body.quota),
        filled: parseInt(body.filled),
      },
    });

    return NextResponse.json(updatedPosition);
  } catch (error) {
    console.error("Update Position Error:", error);
    return NextResponse.json({ error: "Gagal mengupdate posisi" }, { status: 500 });
  }
}