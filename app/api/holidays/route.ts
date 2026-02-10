import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Import default sesuai perbaikan sebelumnya

export async function GET() {
  try {
    const holidays = await prisma.holiday.findMany({
      orderBy: { date: 'asc' }
    });
    return NextResponse.json(holidays);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date } = body; // Cuma ambil date

    if (!date) {
      return NextResponse.json({ error: "Tanggal wajib diisi" }, { status: 400 });
    }

    const newHoliday = await prisma.holiday.create({
      data: {
        date: new Date(date),
        // Tidak ada description
      },
    });

    return NextResponse.json(newHoliday);
  } catch (error) {
    return NextResponse.json({ error: "Gagal menyimpan (mungkin tanggal sudah ada)" }, { status: 500 });
  }
}