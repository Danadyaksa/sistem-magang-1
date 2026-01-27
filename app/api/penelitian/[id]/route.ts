import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// --- PATCH: UPDATE STATUS (TERIMA/TOLAK) ---
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // 1. Ubah tipe params jadi Promise
) {
  try {
    const { status } = await request.json();
    
    // 2. Await params untuk ambil ID
    const { id } = await params; 

    // Cek dulu apakah data ada (opsional, untuk debugging)
    const existing = await prisma.penelitian.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }

    // Update Status
    const updated = await prisma.penelitian.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error Update:", error); // Log error ke terminal biar ketahuan
    return NextResponse.json(
      { error: "Gagal update status" },
      { status: 500 }
    );
  }
}

// --- DELETE: HAPUS DATA ---
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Ubah tipe jadi Promise
) {
  try {
    const { id } = await params; // Await params
    await prisma.penelitian.delete({ where: { id } });
    return NextResponse.json({ message: "Data dihapus" });
  } catch (error) {
    return NextResponse.json({ error: "Gagal hapus data" }, { status: 500 });
  }
}