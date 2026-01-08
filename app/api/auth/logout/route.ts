// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  // Kita siapkan response sukses
  const response = NextResponse.json(
    { success: true, message: "Berhasil logout" },
    { status: 200 }
  );

  // HAPUS COOKIE
  // Caranya adalah menimpa cookie lama dengan cookie kosong yang langsung expired
  response.cookies.set({
    name: "admin_session", // Harus sama persis dengan nama saat login
    value: "",
    expires: new Date(0), // Set tanggal kedaluwarsa ke masa lalu (tahun 1970)
    path: "/", 
  });

  return response;
}