// app/api/positions/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// DELETE
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Type-nya harus Promise
) {
  try {
    const { id } = await params; // <--- WAJIB DI-AWAIT DULU BRO!

    await prisma.position.delete({
      where: { id: Number(id) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Gagal hapus" }, { status: 500 });
  }
}

// UPDATE (PUT)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Ini juga sama
) {
  try {
    const { id } = await params; // <--- Await juga disini
    const body = await request.json();

    const updated = await prisma.position.update({
      where: { id: Number(id) },
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
