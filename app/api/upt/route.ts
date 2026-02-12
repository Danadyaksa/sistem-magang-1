import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // <--- INI YG BENER (Tanpa { })

// GET: Ambil semua data UPT
export async function GET() {
  try {
    const upts = await prisma.upt.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(upts);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data UPT" }, { status: 500 });
  }
}

// POST: Tambah UPT baru
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "Nama UPT wajib diisi" }, { status: 400 });
    }

    const newUpt = await prisma.upt.create({
      data: { name },
    });

    return NextResponse.json(newUpt, { status: 201 });
  } catch (error) {
    console.error("Error creating UPT:", error);
    return NextResponse.json({ error: "Gagal membuat UPT" }, { status: 500 });
  }
}