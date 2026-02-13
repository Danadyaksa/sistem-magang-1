import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// PUT: Edit nama UPT & Address
export async function PUT(
  req: Request,
  // Perhatikan tipe datanya, params adalah Promise
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Await params dulu sebelum ambil ID
    const { id: idStr } = await params; 
    const id = parseInt(idStr);

    const body = await req.json();
    const { name, address } = body;

    if (!name) {
      return NextResponse.json({ error: "Nama UPT wajib diisi" }, { status: 400 });
    }

    const updatedUpt = await prisma.upt.update({
      where: { id },
      data: { name, address },
    });

    return NextResponse.json(updatedUpt);
  } catch (error) {
    return NextResponse.json({ error: "Gagal update UPT" }, { status: 500 });
  }
}

// DELETE: Hapus UPT
export async function DELETE(
  req: Request,
  // Perhatikan tipe datanya, params adalah Promise
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Await params dulu sebelum ambil ID
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    await prisma.upt.delete({
      where: { id },
    });

    return NextResponse.json({ message: "UPT berhasil dihapus" });
  } catch (error) {
    return NextResponse.json({ error: "Gagal hapus UPT" }, { status: 500 });
  }
}