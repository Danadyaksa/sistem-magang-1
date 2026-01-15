  // app/api/pendaftaran/route.ts
  import { NextResponse } from "next/server";
  import prisma from "@/lib/prisma";
  import { createClient } from "@supabase/supabase-js";
  import { cookies } from "next/headers"; // Buat ambil cookie
  import { jwtVerify } from "jose"; // Buat verifikasi token admin

  // Inisialisasi Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // --- HELPER: CEK ADMIN SESSION ---
  // Kita pake ini buat mastiin yang request adalah admin beneran
  async function checkAdminAuth() {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_session")?.value;

    if (!token) return false;

    try {
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || "rahasia-negara-bos"
      );
      await jwtVerify(token, secret);
      return true;
    } catch (error) {
      return false;
    }
  }

  // --- HELPER: VALIDASI FILE ---
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_DOC_TYPES = ["application/pdf"];
  const ALLOWED_IMG_TYPES = ["image/jpeg", "image/png", "image/jpg"];

  function validateFile(file: File, type: "doc" | "image") {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File ${file.name} terlalu besar (Maks 5MB)`);
    }

    if (type === "doc" && !ALLOWED_DOC_TYPES.includes(file.type)) {
      throw new Error(`File ${file.name} harus format PDF`);
    }

    if (type === "image" && !ALLOWED_IMG_TYPES.includes(file.type)) {
      throw new Error(`File ${file.name} harus format Gambar (JPG/PNG)`);
    }
  }

  export async function POST(request: Request) {
    try {
      const formData = await request.formData();

      // --- 1. AMBIL FILE ---
      const cvFile = formData.get("cv") as File | null;
      const suratFile = formData.get("surat") as File | null;
      const fotoFile = formData.get("foto") as File | null;

      // Cek apakah ini input manual dari Admin
      // LOGIC BARU: Cek nama file DAN pastikan dia punya sesi Admin
      const isManualEntryFile = cvFile?.name === "manual-entry.txt";
      const isAdmin = await checkAdminAuth();

      // Kalau mau pakai fitur manual entry tapi bukan admin -> TOLAK
      if (isManualEntryFile && !isAdmin) {
        return NextResponse.json(
          { error: "Unauthorized: Manual Entry hanya untuk Admin!" },
          { status: 401 }
        );
      }

      const isManualEntry = isManualEntryFile && isAdmin;

      // Validasi: Jika BUKAN manual (Pendaftaran Web), file wajib ada & valid
      if (!isManualEntry) {
        if (!cvFile || !suratFile || !fotoFile) {
          return NextResponse.json(
            { error: "Semua berkas wajib diupload untuk pendaftaran web" },
            { status: 400 }
          );
        }

        // VALIDASI TIPE FILE (Fix Celah Upload Shell/Script)
        try {
          validateFile(cvFile, "doc");
          validateFile(suratFile, "doc");
          validateFile(fotoFile, "image");
        } catch (validationError: any) {
          return NextResponse.json(
            { error: validationError.message },
            { status: 400 }
          );
        }
      }

      // --- 2. FUNGSI UPLOAD (DENGAN BYPASS MANUAL) ---
      const uploadToSupabase = async (file: File | null, folder: string) => {
        if (isManualEntry || !file) {
          return "-";
        }

        // Sanitasi nama file biar gak aneh-aneh
        const fileExt = file.name.split(".").pop();
        const safeName = file.name.replace(/[^a-zA-Z0-9]/g, "_");
        const fileName = `${folder}-${Date.now()}-${safeName}.${fileExt}`;
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
      const [cvUrl, suratUrl, fotoUrl] = await Promise.all([
        uploadToSupabase(cvFile, "cv"),
        uploadToSupabase(suratFile, "surat"),
        uploadToSupabase(fotoFile, "foto"),
      ]);

      // --- 4. PERSIAPAN DATA ---
      const namaLengkap = formData.get("namaLengkap") as string;
      const instansi = formData.get("instansi") as string;

      const nomorInduk = (formData.get("nomorInduk") as string) || "-";
      const email = (formData.get("email") as string) || "-";
      const nomorHp = (formData.get("nomorHp") as string) || "-";
      const fakultas = (formData.get("fakultas") as string) || "-";
      const jurusan = (formData.get("jurusan") as string) || "-";

      const rawLama = formData.get("lamaMagang");
      const lamaMagang = rawLama ? parseInt(rawLama as string) : 0;

      const rawTglMulai = formData.get("tanggalMulai") as string;
      const tanggalMulai = rawTglMulai ? new Date(rawTglMulai) : new Date();

      const rawTglSelesai = formData.get("tanggalSelesai") as string;
      const tanggalSelesai = rawTglSelesai ? new Date(rawTglSelesai) : new Date();

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
      // --- SECURITY CHECK: CUMA ADMIN YANG BOLEH LIHAT DATA ---
      const isAdmin = await checkAdminAuth();
      if (!isAdmin) {
        return NextResponse.json(
          { error: "Unauthorized: Silakan login sebagai admin." },
          { status: 401 }
        );
      }

      const data = await prisma.pendaftaran.findMany({
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(data);
    } catch (error) {
      return NextResponse.json(
        { error: "Gagal mengambil data" },
        { status: 500 }
      );
    }
  }
