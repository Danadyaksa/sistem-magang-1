import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// PATCH: Update Status, Posisi, ATAU Edit Data (Perpanjang/Stop)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // 1. Validasi ID
    if (!id) {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    // 2. Siapkan Data Update Dynamic
    // Kita gunakan object spread agar hanya field yang dikirim yang di-update
    const updateData: any = {};

    if (body.status) updateData.status = body.status;
    if (body.positionId) updateData.positionId = parseInt(body.positionId);
    if (body.namaLengkap) updateData.namaLengkap = body.namaLengkap;
    if (body.instansi) updateData.instansi = body.instansi;
    if (body.nomorHp) updateData.nomorHp = body.nomorHp;
    
    // Update Tanggal (Penting untuk Perpanjang / Stop Paksa)
    if (body.tanggalMulai) updateData.tanggalMulai = new Date(body.tanggalMulai);
    if (body.tanggalSelesai) updateData.tanggalSelesai = new Date(body.tanggalSelesai);

    // 3. Lakukan Update ke Database
    const updatedPelamar = await prisma.pendaftaran.update({
      where: { id },
      data: updateData,
    });

    // 4. (Optional) Update Kuota 'filled' jika status berubah jadi ACCEPTED baru
    // Note: Logic kuota kompleks sebaiknya dihandle hati-hati. 
    // Di sini kita asumsikan user hanya edit data peserta yang SUDAH diterima.

    return NextResponse.json(updatedPelamar);
  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: "Gagal update data" }, { status: 500 });
  }
}

// DELETE: Hapus Data
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