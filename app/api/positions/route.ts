// app/api/positions/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic"; // Biar ga di-cache static sama Next.js

// GET: Buat Landing Page & Admin Dashboard
export async function GET() {
  try {
    const positions = await prisma.position.findMany({
      orderBy: { id: "asc" },
    });
    return NextResponse.json(positions);
  } catch (error) {
    return NextResponse.json({ error: "Gagal ambil data" }, { status: 500 });
  }
}

// POST: Buat Admin Tambah Bidang
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newPosition = await prisma.position.create({
      data: {
        title: body.title,
        quota: parseInt(body.quota),
        filled: parseInt(body.filled) || 0,
      },
    });
    return NextResponse.json(newPosition);
  } catch (error) {
    return NextResponse.json({ error: "Gagal simpan" }, { status: 500 });
  }
}
