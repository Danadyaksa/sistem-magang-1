import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (key) {
      const setting = await prisma.setting.findUnique({ where: { key } });
      return NextResponse.json({ value: setting ? setting.value : null });
    }

    const settings = await prisma.setting.findMany();
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil pengaturan" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { key, value } = body;

    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });

    return NextResponse.json({ success: true, setting });
  } catch (error) {
    console.error("Error saving setting:", error);
    return NextResponse.json({ error: "Gagal menyimpan pengaturan" }, { status: 500 });
  }
}