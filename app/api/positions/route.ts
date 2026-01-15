import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Ambil semua posisi
    const positions = await prisma.position.findMany({
      orderBy: { id: "asc" },
    });

    // 2. Hitung jumlah "Terisi" secara Real-time dari tabel Pendaftaran
    // Syarat Terhitung: Status ACCEPTED & Belum Lewat Tanggal Selesai
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset jam biar fair

    const positionsWithCount = await Promise.all(
      positions.map(async (pos) => {
        const activeCount = await prisma.pendaftaran.count({
          where: {
            positionId: pos.id,
            status: "ACCEPTED",
            tanggalSelesai: {
              gte: today, // Tanggal Selesai LEBIH DARI ATAU SAMA DENGAN Hari Ini
            },
          },
        });

        // Return data gabungan (Data Posisi + Hitungan Real)
        return {
          ...pos,
          filled: activeCount, // Override nilai 'filled' dari DB dengan hitungan asli
        };
      })
    );

    return NextResponse.json(positionsWithCount);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, quota } = body;

    const newPosition = await prisma.position.create({
      data: {
        title,
        quota: parseInt(quota),
        filled: 0, // Default 0, nanti di-override saat GET
      },
    });

    return NextResponse.json(newPosition);
  } catch (error) {
    return NextResponse.json({ error: "Gagal menambah posisi" }, { status: 500 });
  }
}