import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// PUT: Update / Edit Data
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const updatedPosition = await prisma.position.update({
      where: { id: parseInt(params.id) },
      data: {
        title: body.title,
        quota: parseInt(body.quota),
        filled: parseInt(body.filled),
      },
    });
    return NextResponse.json(updatedPosition);
  } catch (error) {
    return NextResponse.json({ error: "Gagal update data" }, { status: 500 });
  }
}

// DELETE: Hapus Data
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.position.delete({
      where: { id: parseInt(params.id) },
    });
    return NextResponse.json({ message: "Berhasil dihapus" });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menghapus data" }, { status: 500 });
  }
}