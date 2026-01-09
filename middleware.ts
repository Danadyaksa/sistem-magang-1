// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get("admin_session")?.value;
  const secret = new TextEncoder().encode(
    process.env.JWT_SECRET || "rahasia-negara-bos"
  );

  // Fungsi cek token valid atau nggak
  const isValidToken = async () => {
    if (!token) return false;
    try {
      await jwtVerify(token, secret);
      return true;
    } catch (e) {
      return false;
    }
  };

  const isAuth = await isValidToken();

  // PROTEKSI ROUTE ADMIN
  if (path.startsWith("/admin") && !path.includes("/login")) {
    if (!isAuth) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // KALAU UDAH LOGIN, JANGAN BOLEH MASUK HALAMAN LOGIN LAGI
  if (path.includes("/admin/login") && isAuth) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
