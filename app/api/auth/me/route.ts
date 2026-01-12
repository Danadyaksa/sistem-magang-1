// app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose"; // Pastikan library ini ada
import prisma from "@/lib/prisma";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Buka segel token (Decrypt)
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "rahasia-negara-bos");
    const { payload } = await jwtVerify(token, secret);

    // 2. Ambil data terbaru dari DB berdasarkan ID di token
    const admin = await prisma.admin.findUnique({
      where: { id: payload.id as string },
      select: { id: true, username: true, jabatan: true }
    });

    if (!admin) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Kirim data admin yang valid ke frontend
    return NextResponse.json(admin);

  } catch (error) {
    return NextResponse.json({ error: "Invalid Token" }, { status: 401 });
  }
}