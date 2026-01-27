import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// --- GET: AMBIL SEMUA DATA (KHUSUS ADMIN) ---
export async function GET(request: Request) {
  try {
    const data = await prisma.penelitian.findMany({
      orderBy: { createdAt: "desc" }, // Urutkan dari yang terbaru
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal mengambil data penelitian" },
      { status: 500 }
    );
  }
}

// --- POST: SIMPAN PENDAFTARAN BARU ---
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const newPenelitian = await prisma.penelitian.create({
      data: {
        namaLengkap: body.namaLengkap,
        nomorInduk: body.nomorInduk,
        email: body.email,
        nomorHp: body.nomorHp,
        universitas: body.universitas,
        fakultas: body.fakultas || "-",
        jurusan: body.jurusan,
        kategori: body.kategori,
        judul: body.judul,
        subjek: body.subjek,
        pemohonSurat: body.pemohonSurat,
        nomorSurat: body.nomorSurat,
        tanggalSurat: new Date(body.tanggalSurat),
        fileSuratPath: "-", 
        fileProposalPath: "-", 
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, data: newPenelitian });
  } catch (error: any) {
    console.error("Error Penelitian:", error);
    return NextResponse.json(
      { error: "Gagal memproses pendaftaran" },
      { status: 500 },
    );
  }
}