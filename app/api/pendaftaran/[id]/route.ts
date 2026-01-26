// app/api/pendaftaran/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

// Helper Auth
async function checkAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;
  if (!token) return false;
  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "rahasia-negara-bos",
    );
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

// UPDATE DATA (PATCH)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // 1. Await params (WAJIB DI NEXT.JS 15)
  const { id } = await params;

  if (!(await checkAdminAuth()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();

    // 2. Cegah error prisma karena tipe data string masuk ke field Int
    if (body.positionId && typeof body.positionId === "string") {
      body.positionId = parseInt(body.positionId);
    }

    // Cegah error tanggal string masuk ke DateTime (kalo formatnya kacau)
    if (body.tanggalMulai) body.tanggalMulai = new Date(body.tanggalMulai);
    if (body.tanggalSelesai)
      body.tanggalSelesai = new Date(body.tanggalSelesai);

    const updated = await prisma.pendaftaran.update({
      where: { id },
      data: body,
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: "Gagal update data" }, { status: 500 });
  }
}

// DELETE DATA
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params; // Await params juga disini

  if (!(await checkAdminAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const existing = await prisma.pendaftaran.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Data tidak ditemukan" },
        { status: 404 },
      );
    }

    await prisma.pendaftaran.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Berhasil dihapus" });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal menghapus data" },
      { status: 500 },
    );
  }
}
