// app/api/positions/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// DELETE
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.position.delete({
      where: { id: Number(params.id) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Gagal hapus" }, { status: 500 });
  }
}

// UPDATE (PUT)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const updated = await prisma.position.update({
      where: { id: Number(params.id) },
      data: {
        title: body.title,
        quota: parseInt(body.quota),
        filled: parseInt(body.filled),
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Gagal update" }, { status: 500 });
  }
}
