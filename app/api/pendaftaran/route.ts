import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    // Ambil data text
    const namaLengkap = formData.get("namaLengkap") as string;
    const nomorInduk = formData.get("nomorInduk") as string;
    const email = formData.get("email") as string;
    const nomorHp = formData.get("nomorHp") as string;
    const instansi = formData.get("instansi") as string;
    const fakultas = formData.get("fakultas") as string || ""; // Optional
    const jurusan = formData.get("jurusan") as string;
    const lamaMagang = parseInt(formData.get("lamaMagang") as string);
    const tanggalMulai = new Date(formData.get("tanggalMulai") as string);
    const tanggalSelesai = new Date(formData.get("tanggalSelesai") as string);
    const pemohonSurat = formData.get("pemohonSurat") as string;
    const nomorSurat = formData.get("nomorSurat") as string;
    const tanggalSurat = new Date(formData.get("tanggalSurat") as string);

    // Ambil file
    const cvFile = formData.get("cv") as File | null;
    const suratFile = formData.get("surat") as File | null;

    // --- VALIDASI: Cek file wajib (Cuma CV & Surat) ---
    if (!cvFile || !suratFile) {
      return NextResponse.json(
        { error: "File CV dan Surat Pengantar wajib diupload." },
        { status: 400 }
      );
    }

    // Fungsi helper simpan file
    const saveFile = async (file: File, prefix: string) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = path.extname(file.name);
      // Ganti spasi jadi underscore biar aman di URL
      const cleanName = file.name.replace(/\s+/g, "_");
      const filename = `${prefix}-${Date.now()}-${cleanName}`;
      
      // Pastikan folder uploads ada
      const uploadDir = path.join(process.cwd(), "public/uploads");
      await mkdir(uploadDir, { recursive: true });
      
      await writeFile(path.join(uploadDir, filename), buffer);
      return filename;
    };

    // Simpan file ke server
    const cvPath = await saveFile(cvFile, "CV");
    const suratPath = await saveFile(suratFile, "SURAT");
    
    // --- NOTE PENTING ---
    // Karena di Schema Prisma "fotoPath" itu Wajib (String), tapi di form gak ada upload foto,
    // Kita isi pake string kosong "" atau placeholder.
    // Nanti pas nampilin data, admin tau kalo string kosong brarti foto ada di CV.
    const fotoPath = ""; 

    // Simpan ke Database
    const pendaftaran = await prisma.pendaftaran.create({
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
        cvPath,
        suratPath,
        fotoPath, // <--- Diisi string kosong biar Prisma gak error
        status: "PENDING",
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Pendaftaran berhasil", 
      data: pendaftaran 
    });

  } catch (error: any) {
    console.error("Error pendaftaran:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server: " + error.message },
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
    return NextResponse.json(
      { error: "Gagal mengambil data" },
      { status: 500 }
    );
  }
}