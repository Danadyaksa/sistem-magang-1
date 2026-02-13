import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const upts = await prisma.upt.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(upts);
  } catch (error) {
    return NextResponse.json({ error: "Gagal ambil data" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, address } = await req.json(); // <--- Tangkep address
    if (!name) return NextResponse.json({ error: "Nama wajib" }, { status: 400 });

    const newUpt = await prisma.upt.create({
      data: { name, address }, // <--- Save address
    });
    return NextResponse.json(newUpt, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal create" }, { status: 500 });
  }
}