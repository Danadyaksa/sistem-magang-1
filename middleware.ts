import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 1. Ambil path yang sedang diakses user
  const path = request.nextUrl.pathname;
  
  // 2. Cek apakah user punya kue "admin_session" (tanda sudah login)
  const isLogged = request.cookies.get('admin_session')?.value;

  // 3. ATURAN PROTEKSI:
  // Jika user mau masuk ke halaman yang berawalan "/admin"...
  // TAPI bukan halaman login...
  // DAN user belum login...
  if (path.startsWith('/admin') && !path.includes('/login') && !isLogged) {
    // TENDANG ke halaman login
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // 4. ATURAN KEBALIKAN (Opsional tapi bagus):
  // Jika user SUDAH login tapi mau buka halaman login lagi...
  if (path.includes('/admin/login') && isLogged) {
    // Lempar langsung ke dashboard
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  return NextResponse.next();
}

// Tentukan halaman mana saja yang dijaga Satpam ini
export const config = {
  matcher: ['/admin/:path*'],
}