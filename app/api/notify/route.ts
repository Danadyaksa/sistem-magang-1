import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const { to, subject, html } = await request.json();

    // 1. Konfigurasi Transporter (Kurir Email)
    // SANGAT DISARANKAN: Simpan user & pass di .env jangan hardcode
    const transporter = nodemailer.createTransport({
      service: "gmail", // Atau sesuaikan SMTP instansi
      auth: {
        user: process.env.SMTP_EMAIL, // Masukin di .env: SMTP_EMAIL=emailmu@gmail.com
        pass: process.env.SMTP_PASSWORD, // Masukin di .env: SMTP_PASSWORD=password_app_gmail
      },
    });

    // 2. Kirim Email
    await transporter.sendMail({
      from: '"Admin Magang Disdikpora" <no-reply@disdikpora.go.id>',
      to,
      subject,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Gagal kirim email:", error);
    return NextResponse.json(
      { error: "Gagal mengirim email" },
      { status: 500 }
    );
  }
}
