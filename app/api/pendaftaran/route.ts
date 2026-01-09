// app/api/pendaftaran/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// GET: Biar Admin bisa fetch data pelamar (kalau nanti dashboard butuh)
export async function GET() {
  try {
    const data = await prisma.pendaftaran.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// POST: Handle Submit Form dari User
export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    // Fungsi helper buat upload file
    const uploadFile = async (file: File, prefix: string) => {
      if (!file) return "";
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Bikin nama file unik
      const filename = `${prefix}-${Date.now()}-${file.name.replace(
        /\s/g,
        "_"
      )}`;
      const uploadDir = path.join(process.cwd(), "public/uploads");

      // Pastikan folder ada
      await mkdir(uploadDir, { recursive: true });

      // Simpan file
      await writeFile(path.join(uploadDir, filename), buffer);
      return `/uploads/${filename}`; // Return path public
    };

    // Ambil File dari Form
    const cvFile = formData.get("cv") as File;
    const suratFile = formData.get("surat") as File;
    const fotoFile = formData.get("foto") as File;

    // Upload dulu
    const cvPath = await uploadFile(cvFile, "CV");
    const suratPath = await uploadFile(suratFile, "SURAT");
    const fotoPath = await uploadFile(fotoFile, "FOTO");

    // Simpan data teks ke DB
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
        // Path File
        cvPath,
        suratPath,
        fotoPath,
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, data: newPendaftaran });
  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json(
      { error: "Gagal memproses pendaftaran" },
      { status: 500 }
    );
  }
}
