// app/api/pendaftaran/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

// Inisialisasi Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    // --- 1. AMBIL FILE ---
    const cvFile = formData.get("cv") as File | null;
    const suratFile = formData.get("surat") as File | null;
    const fotoFile = formData.get("foto") as File | null;

    // Cek apakah ini input manual dari Admin (File bernama "manual-entry.txt")
    // Ini sinkron dengan frontend yang kita buat tadi
    const isManualEntry = cvFile?.name === "manual-entry.txt";

    // Validasi: Jika BUKAN manual (Pendaftaran Web), file wajib ada semua
    if (!isManualEntry) {
      if (!cvFile || !suratFile || !fotoFile) {
        return NextResponse.json(
          { error: "Semua berkas wajib diupload untuk pendaftaran web" },
          { status: 400 }
        );
      }
    }

    // --- 2. FUNGSI UPLOAD (DENGAN BYPASS MANUAL) ---
    const uploadToSupabase = async (file: File | null, folder: string) => {
      // JIKA MANUAL atau FILE KOSONG -> Langsung return tanda strip "-"
      // Tidak perlu upload ke Supabase, jadi cepat & hemat storage
      if (isManualEntry || !file) {
        return "-";
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${folder}-${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error } = await supabase.storage
        .from("berkas-magang")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      const { data } = supabase.storage
        .from("berkas-magang")
        .getPublicUrl(filePath);

      return data.publicUrl;
    };

    // --- 3. PROSES UPLOAD PARALEL ---
    // Jika manual, fungsi ini akan selesai instan karena cuma return string "-"
    const [cvUrl, suratUrl, fotoUrl] = await Promise.all([
      uploadToSupabase(cvFile, "cv"),
      uploadToSupabase(suratFile, "surat"),
      uploadToSupabase(fotoFile, "foto"),
    ]);

    // --- 4. PERSIAPAN DATA (HANDLING NULL / DEFAULT VALUE) ---
    // PENTING: Karena input manual tidak mengirim semua field, kita beri nilai default
    // supaya database tidak error karena data kosong/null.
    
    const namaLengkap = formData.get("namaLengkap") as string;
    const instansi = formData.get("instansi") as string;
    
    // Default strip "-" jika kosong
    const nomorInduk = (formData.get("nomorInduk") as string) || "-"; 
    const email = (formData.get("email") as string) || "-"; 
    const nomorHp = (formData.get("nomorHp") as string) || "-";
    const fakultas = (formData.get("fakultas") as string) || "-";
    const jurusan = (formData.get("jurusan") as string) || "-";
    
    // Default Angka 0 jika kosong (Mencegah NaN)
    const rawLama = formData.get("lamaMagang");
    const lamaMagang = rawLama ? parseInt(rawLama as string) : 0; 

    // Default Tanggal Hari Ini jika kosong (Mencegah Invalid Date)
    const rawTglMulai = formData.get("tanggalMulai") as string;
    const tanggalMulai = rawTglMulai ? new Date(rawTglMulai) : new Date();

    const rawTglSelesai = formData.get("tanggalSelesai") as string;
    const tanggalSelesai = rawTglSelesai ? new Date(rawTglSelesai) : new Date();

    // Field Surat Pengantar (Manual biasanya tidak pakai ini di awal)
    const pemohonSurat = (formData.get("pemohonSurat") as string) || "-";
    const nomorSurat = (formData.get("nomorSurat") as string) || "-";
    
    const rawTglSurat = formData.get("tanggalSurat") as string;
    const tanggalSurat = rawTglSurat ? new Date(rawTglSurat) : new Date();

    // --- 5. SIMPAN KE DATABASE ---
    const newPendaftaran = await prisma.pendaftaran.create({
      data: {
        namaLengkap,
        nomorInduk,
        email,
        nomorHp,
        instansi,
        fakultas,
        jurusan,
        lamaMagang,
        tanggalMulai,
        tanggalSelesai,
        pemohonSurat,
        nomorSurat,
        tanggalSurat,
        cvPath: cvUrl,      // Akan berisi "-" jika manual
        suratPath: suratUrl, // Akan berisi "-" jika manual
        fotoPath: fotoUrl,   // Akan berisi "-" jika manual
        status: "PENDING",   // Nanti di frontend Admin langsung di-PATCH jadi ACCEPTED
      },
    });

    return NextResponse.json({ success: true, data: newPendaftaran });

  } catch (error: any) {
    console.error("Error Pendaftaran:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memproses pendaftaran" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const data = await prisma.pendaftaran.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}