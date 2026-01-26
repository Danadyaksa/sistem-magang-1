import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// --- KONFIGURASI ---
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const WA_API_URL = "https://api.fonnte.com/send"; // Atau URL provider WA kamu
const WA_API_KEY = process.env.WA_API_KEY;

// Helper untuk format tanggal Indonesia (contoh: 26 Januari 2026)
const formatDateIndo = (dateString: string | Date) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export async function POST(request: Request) {
  try {
    // 1. TERIMA DATA BARU DARI BODY REQUEST
    const { 
      email, 
      nomorHp, 
      namaLengkap, 
      status, 
      instansi,
      tanggalMulai,   // Data baru
      tanggalSelesai, // Data baru
      position        // Data baru (Nama Bidang)
    } = await request.json();

    if (!email && !nomorHp) {
      return NextResponse.json(
        { error: "Email atau No HP wajib ada" },
        { status: 400 },
      );
    }

    // --- 2. SIAPKAN PESAN ---
    const isAccepted = status === "ACCEPTED";
    const subject = isAccepted
      ? "SELAMAT! Anda Diterima Magang - Dinas DIKPORA DIY"
      : "Update Status Pendaftaran Magang";

    let messageBody = "";

    if (isAccepted) {
      // Format Tanggal
      const tglMulaiStr = formatDateIndo(tanggalMulai);
      const tglSelesaiStr = formatDateIndo(tanggalSelesai);
      const periode = `${tglMulaiStr} s.d. ${tglSelesaiStr}`;
      const namaBidang = position || "Menunggu Penempatan";

      // Template Pesan DITERIMA (Sesuai request kamu)
      messageBody = 
`Halo *${namaLengkap}*,

Selamat! Anda *DITERIMA* magang di Dinas DIKPORA DIY.

*Detail Penerimaan:*
Nama: ${namaLengkap}
Asal: ${instansi}
Bidang: ${namaBidang}
Tanggal Magang: ${periode}

Silakan balas email ini untuk konfirmasi atau cek dashboard website untuk informasi lebih lanjut.
Terima kasih.`;

    } else {
      // Template Pesan DITOLAK
      messageBody = 
`Halo *${namaLengkap}*,

Mohon maaf, pendaftaran magang kamu di *Dinas DIKPORA DIY* belum dapat kami terima saat ini.

Tetap semangat dan terima kasih telah mendaftar.`;
    }

    const results = { email: "skipped", wa: "skipped" };

    // --- 3. KIRIM EMAIL (Nodemailer) ---
    if (email) {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: EMAIL_USER, pass: EMAIL_PASS },
        });

        // Convert newlines to <br> for HTML email
        const htmlBody = messageBody.replace(/\n/g, "<br>");

        await transporter.sendMail({
          from: `"Admin Magang DIKPORA" <${EMAIL_USER}>`,
          to: email,
          subject: subject,
          text: messageBody, 
          html: `
            <h3>${isAccepted ? "Pemberitahuan Penerimaan Magang" : "Status Pendaftaran"}</h3>
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <p>${htmlBody}</p>
            </div>
            <br/>
            <hr/>
            <p style="font-size: 12px; color: #888;">Pesan ini dikirim otomatis oleh sistem.</p>
          `,
        });
        results.email = "sent";
      } catch (err) {
        console.error("Gagal kirim email:", err);
        results.email = "failed";
      }
    }

    // --- 4. KIRIM WHATSAPP (Via API) ---
    if (nomorHp && WA_API_KEY) {
      try {
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

        // Cek response text untuk debugging jika perlu
        // const textRes = await resWa.text();
        // console.log("WA Response:", textRes);

        if (!resWa.ok) throw new Error("WA API Error");
        results.wa = "sent";
      } catch (err) {
        console.error("Gagal kirim WA:", err);
        results.wa = "failed";
      }
    } else {
      console.log("Mocking WA Send (No API Key or Phone) to:", nomorHp);
      console.log("Isi Pesan:", messageBody);
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