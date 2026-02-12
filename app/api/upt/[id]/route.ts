import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // <--- INI YG BENER (Tanpa { })

// PUT: Edit nama UPT
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "Nama UPT wajib diisi" }, { status: 400 });
    }

    const updatedUpt = await prisma.upt.update({
      where: { id },
      data: { name },
    });

    return NextResponse.json(updatedUpt);
  } catch (error) {
    return NextResponse.json({ error: "Gagal update UPT" }, { status: 500 });
  }
}

// DELETE: Hapus UPT
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    await prisma.upt.delete({
      where: { id },
    });

    return NextResponse.json({ message: "UPT berhasil dihapus" });
  } catch (error) {
    return NextResponse.json({ error: "Gagal hapus UPT" }, { status: 500 });
  }
}