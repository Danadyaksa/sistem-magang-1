import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    await prisma.admin.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Berhasil dihapus" });

  } catch (error) {
    return NextResponse.json({ error: "Gagal menghapus admin" }, { status: 500 });
  }
}