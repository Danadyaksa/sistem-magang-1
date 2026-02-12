import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { dates } = body; // Menerima array 'dates'

    if (!dates || !Array.isArray(dates)) {
      return NextResponse.json({ error: "Data tanggal tidak valid" }, { status: 400 });
    }

    // Simpan semua tanggal sekaligus menggunakan createMany
    const result = await prisma.holiday.createMany({
      data: dates.map((d: string) => ({
        date: new Date(d),
      })),
      skipDuplicates: true, // Agar tidak error jika ada tanggal yang sama (duplikat)
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal menyimpan data" }, { status: 500 });
  }
}

// Tambahkan juga fungsi GET untuk fetch data (jika belum ada)
export async function GET() {
  const holidays = await prisma.holiday.findMany({
    orderBy: { date: 'asc' }
  });
  return NextResponse.json(holidays);
}