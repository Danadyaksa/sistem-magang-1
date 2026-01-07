import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // <--- GANTI INI (Import dari file yang baru dibuat)

export const dynamic = 'force-dynamic'; 

export async function GET() {
  try {
    const positions = await prisma.position.findMany({
      orderBy: { id: 'asc' }
    });
    return NextResponse.json(positions);
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}

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
    console.error("Create Error:", error);
    return NextResponse.json({ error: "Gagal menyimpan data" }, { status: 500 });
  }
}