import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { writeFile } from "fs/promises";
import { join } from "path";

// ==========================================
// --- GET: AMBIL SEMUA DATA (KHUSUS ADMIN) ---
// ==========================================
export async function GET(request: Request) {
  try {
    const data = await prisma.pendaftaran.findMany({
      orderBy: { createdAt: "desc" }, // Urutkan pendaftar pkl dari yang terbaru
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error ambil pendaftaran GET:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data pendaftaran applicants" },
      { status: 500 }
    );
  }
}

// ==========================================
// --- POST: SIMPAN PENDAFTARAN BARU ---
// ==========================================
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // Cek jenis tipe pendaftar
    const jenisPendaftaran = formData.get("jenisPendaftaran")?.toString() || "MAHASISWA";

    // Handler Berkas Surat Pengantar (Wajib buat dua-duanya)
    const suratFile = formData.get("surat") as File | null;
    if (!suratFile) {
      return NextResponse.json({ error: "Surat Pengantar wajib diupload!" }, { status: 400 });
    }
    const suratBytes = await suratFile.arrayBuffer();
    const suratName = `SURAT-${Date.now()}-${suratFile.name}`;
    const suratPath = join(process.cwd(), "public/uploads", suratName);
    await writeFile(suratPath, Buffer.from(suratBytes));

    // ==========================================
    // ALUR A: SISWA SMK KOLEKTIF (OPSI B)
    // ==========================================
    if (jenisPendaftaran === "SMK") {
      const instansi = formData.get("instansi")?.toString() || "";
      const jurusan = formData.get("jurusan")?.toString() || "";
      const pembimbing = formData.get("pembimbing")?.toString() || "";
      const kontakPembimbing = formData.get("kontakPembimbing")?.toString() || "";
      const lamaMagang = parseInt(formData.get("lamaMagang")?.toString() || "44");
      const tanggalMulai = new Date(formData.get("tanggalMulai")?.toString() || "");
      const tanggalSelesai = new Date(formData.get("tanggalSelesai")?.toString() || "");
      const pemohonSurat = formData.get("pemohonSurat")?.toString() || pembimbing;
      const nomorSurat = formData.get("nomorSurat")?.toString() || "-";
      const tanggalSurat = formData.get("tanggalSurat") ? new Date(formData.get("tanggalSurat")!.toString()) : new Date();

      // Parsing data array siswa dari client
      const studentsRaw = formData.get("students")?.toString() || "[]";
      const students = JSON.parse(studentsRaw);

      if (!Array.isArray(students) || students.length === 0) {
        return NextResponse.json({ error: "Data siswa belum diisi pak!" }, { status: 400 });
      }

      const createdRecords = [];
      for (const student of students) {
        const newRecord = await prisma.pendaftaran.create({
          data: {
            namaLengkap: student.namaLengkap,
            nomorInduk: student.nomorHp, 
            email: `${student.namaLengkap.toLowerCase().replace(/\s+/g, "")}@smk-entry.com`,
            nomorHp: student.nomorHp,
            instansi,
            jurusan,
            pembimbing,
            kontakPembimbing,
            lamaMagang,
            tanggalMulai,
            tanggalSelesai,
            pemohonSurat,
            nomorSurat,
            tanggalSurat,
            cvPath: "manual-entry-smk", 
            suratPath: suratName,
            fotoPath: "manual-entry-smk",
            status: "PENDING", 
            positionId: student.positionId ? parseInt(student.positionId) : null,
          },
        });
        createdRecords.push(newRecord);
      }

      return NextResponse.json({ success: true, count: createdRecords.length });
    }

    // ==========================================
    // ALUR B: MAHASISWA REGULER
    // ==========================================
    const cvFile = formData.get("cv") as File | null;
    if (!cvFile) return NextResponse.json({ error: "File CV wajib diupload bray!" }, { status: 400 });
    
    const cvBytes = await cvFile.arrayBuffer();
    const cvName = `CV-${Date.now()}-${cvFile.name}`;
    const cvPathLocation = join(process.cwd(), "public/uploads", cvName);
    await writeFile(cvPathLocation, Buffer.from(cvBytes));

    const newPendaftaran = await prisma.pendaftaran.create({
      data: {
        namaLengkap: formData.get("namaLengkap")!.toString(),
        nomorInduk: formData.get("nomorInduk")!.toString(),
        email: formData.get("email")!.toString(),
        nomorHp: formData.get("nomorHp")!.toString(),
        instansi: formData.get("instansi")!.toString(),
        fakultas: formData.get("fakultas")?.toString() || "-",
        jurusan: formData.get("jurusan")!.toString(),
        lamaMagang: parseInt(formData.get("lamaMagang")!.toString()),
        tanggalMulai: new Date(formData.get("tanggalMulai")!.toString()),
        tanggalSelesai: new Date(formData.get("tanggalSelesai")!.toString()),
        pemohonSurat: formData.get("pemohonSurat")!.toString(),
        nomorSurat: formData.get("nomorSurat")!.toString(),
        tanggalSurat: new Date(formData.get("tanggalSurat")!.toString()),
        cvPath: cvName,
        suratPath: suratName,
        fotoPath: "web-entry",
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, data: newPendaftaran });
  } catch (error: any) {
    console.error("Error pendaftaran API:", error);
    return NextResponse.json({ error: "Gagal memproses data pendaftaran." }, { status: 500 });
  }
}