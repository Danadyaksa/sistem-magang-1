import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { unlink } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

// DELETE: Hapus Data Pelamar & File Fisik
export async function DELETE(
  req: Request,
  // Perbaiki tipe params jadi Promise
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // WAJIB AWAIT PARAMS DI NEXT.JS 15+
    const { id } = await params;

    const pendaftaran = await prisma.pendaftaran.findUnique({
      where: { id },
    });

    if (!pendaftaran) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }

    const deleteFile = async (filename: string) => {
      if (filename) {
        const filepath = path.join(process.cwd(), "public/uploads", filename);
        try {
          await unlink(filepath);
        } catch (err) {
          // ignore error
        }
      }
    };

    await deleteFile(pendaftaran.cvPath);
    await deleteFile(pendaftaran.suratPath);
    if(pendaftaran.fotoPath) await deleteFile(pendaftaran.fotoPath);

    await prisma.pendaftaran.delete({ where: { id } });

    return NextResponse.json({ message: "Data berhasil dihapus" });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menghapus data" }, { status: 500 });
  }
}

// PATCH: Update Status & Posisi
export async function PATCH(
  req: Request,
  // Perbaiki tipe params jadi Promise
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // WAJIB AWAIT PARAMS DI NEXT.JS 15+
    const { id } = await params;
    
    const body = await req.json();
    const { status, positionId } = body;

    const updateData: any = { status };
    
    // Update posisi kalo dikirim
    if (positionId !== undefined) {
        updateData.positionId = positionId ? parseInt(positionId) : null;
    }

    // Update DB Pendaftaran
    const updated = await prisma.pendaftaran.update({
      where: { id },
      data: updateData,
    });

    // Update Kuota 'filled' di Tabel Position
    if (status === "ACCEPTED" && positionId) {
        await prisma.position.update({
            where: { id: parseInt(positionId) },
            data: { filled: { increment: 1 } }
        });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal update status" }, { status: 500 });
  }
}