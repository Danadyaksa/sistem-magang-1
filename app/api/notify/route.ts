import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// --- KONFIGURASI ---
// Ganti pake kredensial email pengirim lo
const EMAIL_USER = process.env.EMAIL_USER || "email_lo@gmail.com";
const EMAIL_PASS = process.env.EMAIL_PASS || "app_password_lo"; // Pake App Password Google ya

// Ganti pake API Key WhatsApp lo (misal Fonnte/Wablas/Twilio)
// Kalo belum ada, kosongin dulu gapapa, lognya bakal muncul di terminal.
const WA_API_URL = "https://api.fonnte.com/send";
const WA_API_KEY = process.env.WA_API_KEY || "TOKEN_WA_LO";

export async function POST(request: Request) {
  try {
    const { email, nomorHp, namaLengkap, status, instansi } =
      await request.json();

    if (!email && !nomorHp) {
      return NextResponse.json(
        { error: "Email atau No HP wajib ada" },
        { status: 400 },
      );
    }

    // --- 1. SIAPKAN PESAN ---
    const isAccepted = status === "ACCEPTED";
    const subject = isAccepted
      ? "SELAMAT! Anda Diterima Magang"
      : "Update Status Pendaftaran Magang";

    // Template Pesan (Bisa lo custom lagi)
    const messageBody = isAccepted
      ? `Halo *${namaLengkap}*,\n\nSelamat! Pendaftaran magang kamu di *Dinas DIKPORA DIY* telah *DITERIMA*.\n\nSilakan cek dashboard website untuk detail penempatan dan jadwal.\nTerima kasih.`
      : `Halo *${namaLengkap}*,\n\nMohon maaf, pendaftaran magang kamu di *Dinas DIKPORA DIY* belum dapat kami terima saat ini.\n\nTetap semangat dan terima kasih telah mendaftar.`;

    const results = { email: "skipped", wa: "skipped" };

    // --- 2. KIRIM EMAIL (Nodemailer) ---
    if (email) {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: EMAIL_USER, pass: EMAIL_PASS },
        });

        await transporter.sendMail({
          from: `"Admin Magang" <${EMAIL_USER}>`,
          to: email,
          subject: subject,
          text: messageBody, // Versi text biasa
          html: `
            <h3>Halo ${namaLengkap},</h3>
            <p>${messageBody.replace(/\n/g, "<br>")}</p>
            <br/>
            <p><small>Pesan ini dikirim otomatis oleh sistem.</small></p>
          `,
        });
        results.email = "sent";
      } catch (err) {
        console.error("Gagal kirim email:", err);
        results.email = "failed";
      }
    }

    // --- 3. KIRIM WHATSAPP (Via API) ---
    if (nomorHp && WA_API_KEY !== "TOKEN_WA_LO") {
      try {
        // Format nomor HP (Ganti 08 jadi 628)
        let formattedHp = nomorHp.replace(/\D/g, "");
        if (formattedHp.startsWith("0"))
          formattedHp = "62" + formattedHp.slice(1);

        const formData = new FormData();
        formData.append("target", formattedHp);
        formData.append("message", messageBody);

        const resWa = await fetch(WA_API_URL, {
          method: "POST",
          headers: { Authorization: WA_API_KEY },
          body: formData,
        });

        if (!resWa.ok) throw new Error("WA API Error");
        results.wa = "sent";
      } catch (err) {
        console.error("Gagal kirim WA:", err);
        results.wa = "failed";
      }
    } else {
      console.log("Mocking WA Send to:", nomorHp, messageBody);
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Notify Error:", error);
    return NextResponse.json(
      { error: "Gagal mengirim notifikasi" },
      { status: 500 },
    );
  }
}
