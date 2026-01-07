import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Ambil semua data dari Database
export async function GET() {
  try {
    const positions = await prisma.position.findMany({
      orderBy: { id: 'asc' } // Urutkan dari id terkecil
    });
    return NextResponse.json(positions);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}

// POST: Tambah data baru
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newPosition = await prisma.position.create({
      data: {
        title: body.title,
        quota: parseInt(body.quota),
        filled: parseInt(body.filled),
      },
    });
    return NextResponse.json(newPosition);
  } catch (error) {
    return NextResponse.json({ error: "Gagal menyimpan data" }, { status: 500 });
  }
}