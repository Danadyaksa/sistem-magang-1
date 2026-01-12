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

    // 1. Ambil File
    const cvFile = formData.get("cv") as File | null;
    const suratFile = formData.get("surat") as File | null;
    const fotoFile = formData.get("foto") as File | null;

    if (!cvFile || !suratFile || !fotoFile) {
      return NextResponse.json(
        { error: "Semua berkas wajib diupload" },
        { status: 400 }
      );
    }

    // 2. Fungsi Upload ke Supabase Storage
    const uploadToSupabase = async (file: File, folder: string) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `${folder}-${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error } = await supabase.storage
        .from("berkas-magang") // Pastikan nama bucket ini sudah dibuat di Supabase
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      // Ambil Public URL
      const { data } = supabase.storage
        .from("berkas-magang")
        .getPublicUrl(filePath);

      return data.publicUrl;
    };

    // 3. Upload File secara Paralel (Biar Cepat)
    const [cvUrl, suratUrl, fotoUrl] = await Promise.all([
      uploadToSupabase(cvFile, "cv"),
      uploadToSupabase(suratFile, "surat"),
      uploadToSupabase(fotoFile, "foto"),
    ]);

    // 4. Simpan Data Text & URL File ke Database
    const newPendaftaran = await prisma.pendaftaran.create({
      data: {
        namaLengkap: formData.get("namaLengkap") as string,
        nomorInduk: formData.get("nomorInduk") as string,
        email: formData.get("email") as string,
        nomorHp: formData.get("nomorHp") as string,
        instansi: formData.get("instansi") as string,
        fakultas: (formData.get("fakultas") as string) || "",
        jurusan: formData.get("jurusan") as string,
        lamaMagang: parseInt(formData.get("lamaMagang") as string),
        tanggalMulai: new Date(formData.get("tanggalMulai") as string),
        tanggalSelesai: new Date(formData.get("tanggalSelesai") as string),
        pemohonSurat: formData.get("pemohonSurat") as string,
        nomorSurat: formData.get("nomorSurat") as string,
        tanggalSurat: new Date(formData.get("tanggalSurat") as string),
        // Simpan Link Supabase
        cvPath: cvUrl,
        suratPath: suratUrl,
        fotoPath: fotoUrl,
        status: "PENDING",
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