import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma"; // Pastiin path prisma client lo bener

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    // 1. Ambil Data Teks
    const namaLengkap = formData.get("namaLengkap") as string;
    const nomorInduk = formData.get("nomorInduk") as string;
    const email = formData.get("email") as string;
    const nomorHp = formData.get("nomorHp") as string;
    const instansi = formData.get("instansi") as string;
    const fakultas = formData.get("fakultas") as string;
    const jurusan = formData.get("jurusan") as string;

    // Parse angka & tanggal
    const lamaMagang = parseInt(formData.get("lamaMagang") as string);
    const tanggalMulai = new Date(formData.get("tanggalMulai") as string);
    const tanggalSelesai = new Date(formData.get("tanggalSelesai") as string);
    const tanggalSurat = new Date(formData.get("tanggalSurat") as string);

    const pemohonSurat = formData.get("pemohonSurat") as string;
    const nomorSurat = formData.get("nomorSurat") as string;

    // 2. Handle Upload File (CV, Surat, Foto)
    const files = [
      { field: "cv", prefix: "CV" },
      { field: "surat", prefix: "SURAT" },
      { field: "foto", prefix: "FOTO" },
    ];

    const filePaths: any = {};

    // Pastikan folder uploads ada
    const uploadDir = path.join(process.cwd(), "public/uploads");
    await mkdir(uploadDir, { recursive: true });

    for (const item of files) {
      const file: File | null = formData.get(item.field) as unknown as File;

      if (!file) {
        return NextResponse.json(
          { error: `File ${item.field} wajib diisi` },
          { status: 400 }
        );
      }

      // Bikin nama file unik: CV_123456789_NamaFile.pdf
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uniqueName = `${item.prefix}_${Date.now()}_${file.name.replaceAll(
        " ",
        "_"
      )}`;
      const savePath = path.join(uploadDir, uniqueName);

      await writeFile(savePath, buffer);

      // Simpan path relatif buat di DB (biar bisa diakses di frontend nanti)
      filePaths[`${item.field}Path`] = `/uploads/${uniqueName}`;
    }

    // 3. Simpan ke Database (Prisma)
    // NOTE: positionId dikosongin (null) karena nanti Admin yang isi
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
        cvPath: filePaths.cvPath,
        suratPath: filePaths.suratPath,
        fotoPath: filePaths.fotoPath,
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, data: pendaftaran });
  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json(
      { error: "Gagal memproses pendaftaran" },
      { status: 500 }
    );
  }
}
