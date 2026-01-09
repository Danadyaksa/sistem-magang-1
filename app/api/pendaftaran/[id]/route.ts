import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// PATCH: Buat Admin Update Status & Assign Posisi
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Fix structure for Next.js 15+
) {
  try {
    const { id } = await params; // Await params in newer Next.js
    const body = await request.json();

    // Body yang diharapkan dari frontend admin:
    // { status: "ACCEPTED", positionId: 1 } atau { status: "REJECTED" }

    // 1. Validasi ID
    if (!id) {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    // 2. Cek apakah pelamar ada
    const pelamar = await prisma.pendaftaran.findUnique({
      where: { id },
    });

    if (!pelamar) {
      return NextResponse.json(
        { error: "Pelamar tidak ditemukan" },
        { status: 404 }
      );
    }

    // 3. Logic Update
    // Kalau diterima, pastikan positionId ada
    if (body.status === "ACCEPTED" && !body.positionId) {
      return NextResponse.json(
        { error: "Harus pilih posisi jika diterima" },
        { status: 400 }
      );
    }

    // Lakukan Update
    const updatedPelamar = await prisma.pendaftaran.update({
      where: { id },
      data: {
        status: body.status,
        positionId: body.positionId ? parseInt(body.positionId) : null, // Masukin ID bidang
      },
    });

    // 4. (Optional) Update Quota 'filled' di tabel Position kalau diterima
    if (body.status === "ACCEPTED" && body.positionId) {
      await prisma.position.update({
        where: { id: parseInt(body.positionId) },
        data: { filled: { increment: 1 } },
      });
    }

    return NextResponse.json(updatedPelamar);
  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: "Gagal update data" }, { status: 500 });
  }
}

// DELETE: Buat Admin Hapus Pelamar (Kali aja iseng/spam)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.pendaftaran.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Data deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Gagal hapus" }, { status: 500 });
  }
}
