import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Ambil semua posisi
    const positions = await prisma.position.findMany({
      orderBy: { id: "asc" },
    });

    // 2. Hitung jumlah "Terisi" & Ambil Jadwal secara Real-time
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset jam biar fair

    const positionsWithData = await Promise.all(
      positions.map(async (pos) => {
        // UBAH DISINI: Pakai findMany, bukan count
        // Kita ambil data pendaftar yang statusnya ACCEPTED & Masih Aktif
        const activeInterns = await prisma.pendaftaran.findMany({
          where: {
            positionId: pos.id,
            status: "ACCEPTED",
            tanggalSelesai: {
              gte: today, // Tanggal Selesai LEBIH DARI ATAU SAMA DENGAN Hari Ini
            },
          },
          select: {
            tanggalMulai: true,
            tanggalSelesai: true,
            // Kita TIDAK ambil namaLengkap demi privasi
          },
          orderBy: {
            tanggalSelesai: 'asc', // Yang mau selesai duluan ditaruh atas
          },
        });

        // Return data gabungan
        return {
          ...pos,
          filled: activeInterns.length, // Jumlah terisi diambil dari panjang array data
          pendaftar: activeInterns,     // Sertakan data jadwal untuk dropdown di frontend
        };
      })
    );

    return NextResponse.json(positionsWithData);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, quota, description } = body; // Tambahkan description jika ada

    const newPosition = await prisma.position.create({
      data: {
        title,
        quota: parseInt(quota),
        description: description || "", // Handle description
        filled: 0, 
      },
    });

    return NextResponse.json(newPosition);
  } catch (error) {
    return NextResponse.json({ error: "Gagal menambah posisi" }, { status: 500 });
  }
}