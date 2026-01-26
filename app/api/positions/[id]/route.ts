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

// 1. DELETE: Hapus Posisi
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params; // WAJIB AWAIT (Next.js 15)

  if (!(await checkAdminAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const positionId = parseInt(id); // Convert String -> Int

    await prisma.position.delete({
      where: { id: positionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus posisi" },
      { status: 500 },
    );
  }
}

// 2. PUT: Update Posisi (Biasanya dipake Dashboard admin buat edit full)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params; // WAJIB AWAIT

  if (!(await checkAdminAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const positionId = parseInt(id);
    const body = await request.json();

    const updated = await prisma.position.update({
      where: { id: positionId },
      data: {
        title: body.title,
        // Pastiin quota jadi integer, jaga-jaga kalo dari frontend dikirim string "5"
        quota: parseInt(body.quota),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PUT Error:", error);
    return NextResponse.json({ error: "Gagal update posisi" }, { status: 500 });
  }
}

// 3. PATCH: Update Parsial (Jaga-jaga kalo ada komponen lain yg pake PATCH)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params; // WAJIB AWAIT

  if (!(await checkAdminAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const positionId = parseInt(id);
    const body = await request.json();

    // Siapin data object, convert quota kalo ada
    const dataToUpdate: any = {};
    if (body.title) dataToUpdate.title = body.title;
    if (body.quota !== undefined) dataToUpdate.quota = parseInt(body.quota);

    const updated = await prisma.position.update({
      where: { id: positionId },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PATCH Error:", error);
    return NextResponse.json({ error: "Gagal update posisi" }, { status: 500 });
  }
}
