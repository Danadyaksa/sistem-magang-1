"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, addDays, isWeekend, isSameDay } from "date-fns";
import { id } from "date-fns/locale";
import { 
  CalendarIcon, 
  Upload, 
  ArrowLeft, 
  Loader2, 
  Send,
  FileCheck,
  CalendarClock // Icon baru
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// --- DAFTAR HARI LIBUR NASIONAL (Contoh 2025) ---
// Format: "YYYY-MM-DD"
// Kamu bisa update list ini sesuai kalender akademik/nasional
// --- DAFTAR LIBUR NASIONAL & CUTI BERSAMA 2026 (SKB 3 Menteri) ---
const HOLIDAYS = [
  // Januari
  "2026-01-01", // Tahun Baru 2026
  "2026-01-16", // Isra Mikraj

  // Februari
  "2026-02-16", // Cuti Bersama Imlek
  "2026-02-17", // Tahun Baru Imlek 2577

  // Maret
  "2026-03-18", // Cuti Bersama Nyepi
  "2026-03-19", // Hari Suci Nyepi
  "2026-03-20", // Cuti Bersama Idul Fitri
  "2026-03-21", // Idul Fitri 1447H
  "2026-03-22", // Idul Fitri 1447H
  "2026-03-23", // Cuti Bersama Idul Fitri
  "2026-03-24", // Cuti Bersama Idul Fitri

  // April
  "2026-04-03", // Wafat Isa Almasih
  "2026-04-05", // Paskah (Minggu)

  // Mei
  "2026-05-01", // Hari Buruh
  "2026-05-14", // Kenaikan Isa Almasih
  "2026-05-15", // Cuti Bersama Kenaikan Isa Almasih
  "2026-05-27", // Idul Adha 1447H
  "2026-05-28", // Cuti Bersama Idul Adha
  "2026-05-31", // Waisak

  // Juni
  "2026-06-01", // Hari Lahir Pancasila
  "2026-06-16", // Tahun Baru Islam 1448H

  // Agustus
  "2026-08-17", // Kemerdekaan RI
  "2026-08-25", // Maulid Nabi Muhammad SAW

  // Desember
  "2026-12-24", // Cuti Bersama Natal
  "2026-12-25", // Hari Raya Natal
];

const isHoliday = (date: Date) => {
  const dateString = format(date, "yyyy-MM-dd");
  return HOLIDAYS.includes(dateString);
};

// --- SKEMA VALIDASI ---
const formSchema = z.object({
  namaLengkap: z.string().min(2, "Nama minimal 2 karakter"),
  nomorInduk: z.string().min(1, "NIS/NIM wajib diisi"),
  email: z.string().email("Format email tidak valid"),
  instansi: z.string().min(3, "Nama Sekolah/Universitas wajib diisi"),
  fakultas: z.string().optional(),
  jurusan: z.string().min(2, "Jurusan/Jenjang wajib diisi"),
  
  // Lama magang minimal 1 hari (validasi logic bisa disesuaikan)
  lamaMagang: z.coerce.number().min(1, "Minimal 1 hari kerja"),

  tanggalMulai: z.date({ required_error: "Tanggal mulai wajib dipilih" }),
  tanggalSelesai: z.date({ required_error: "Tanggal selesai akan terhitung otomatis" }),

  pemohonSurat: z.string().min(2, "Nama/Jabatan pemohon wajib diisi"),
  nomorSurat: z.string().min(1, "Nomor surat wajib diisi"),
  tanggalSurat: z.date({ required_error: "Tanggal surat wajib dipilih" }),
  nomorHp: z.string().min(10, "Nomor HP tidak valid"),
});

export default function RegistrationPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileNames, setFileNames] = useState<{
    cv: string | null;
    surat: string | null;
    foto: string | null;
  }>({ cv: null, surat: null, foto: null });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      namaLengkap: "",
      nomorInduk: "",
      email: "",
      instansi: "",
      fakultas: "",
      jurusan: "",
      pemohonSurat: "",
      nomorSurat: "",
      nomorHp: "'62",
      lamaMagang: 44, // Default 44 hari
      tanggalMulai: undefined,
      tanggalSelesai: undefined,
      tanggalSurat: undefined,
    },
  });

  // --- LOGIC HITUNG TANGGAL ---
  // Pantau perubahan pada 'lamaMagang' dan 'tanggalMulai'
  const lamaMagang = useWatch({ control: form.control, name: "lamaMagang" });
  const tanggalMulai = useWatch({ control: form.control, name: "tanggalMulai" });

  useEffect(() => {
    if (tanggalMulai && lamaMagang > 0) {
      let count = 0;
      let currentDate = new Date(tanggalMulai);
      let lastWorkingDate = new Date(tanggalMulai);

      // Loop sampai jumlah hari kerja terpenuhi
      // (Algoritma: Kita cari HARI KE-n yang merupakan hari kerja)
      while (count < lamaMagang) {
        // Cek apakah hari ini Sabtu (6) atau Minggu (0) atau Libur Nasional
        const isWeekendDay = isWeekend(currentDate);
        const isNationalHoliday = isHoliday(currentDate);

        if (!isWeekendDay && !isNationalHoliday) {
          count++; // Tambah counter hari kerja
          lastWorkingDate = currentDate; // Simpan ini sebagai potensi tanggal terakhir
        }

        // Pindah ke hari berikutnya untuk pengecekan selanjutnya
        if (count < lamaMagang) {
           currentDate = addDays(currentDate, 1);
        }
      }
      
      // Set hasil ke form
      form.setValue("tanggalSelesai", lastWorkingDate);
    }
  }, [lamaMagang, tanggalMulai, form]);


  // Handle File Input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "cv" | "surat" | "foto") => {
    const file = e.target.files?.[0];
    setFileNames(prev => ({ ...prev, [type]: file ? file.name : null }));
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.keys(values).forEach((key) => {
        const value = values[key as keyof typeof values];
        if (value instanceof Date) formData.append(key, value.toISOString());
        else if (value !== undefined && value !== null) formData.append(key, value.toString());
      });

      const cvFile = (document.getElementById("cv") as HTMLInputElement).files?.[0];
      const suratFile = (document.getElementById("surat") as HTMLInputElement).files?.[0];
      const fotoFile = (document.getElementById("foto") as HTMLInputElement).files?.[0];

      if (!cvFile || !suratFile || !fotoFile) {
        alert("Mohon lengkapi semua file!");
        setIsSubmitting(false);
        return;
      }

      formData.append("cv", cvFile);
      formData.append("surat", suratFile);
      formData.append("foto", fotoFile);

      const response = await fetch("/api/pendaftaran", { method: "POST", body: formData });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Gagal mengirim data");

      alert("Pendaftaran Berhasil! Silahkan tunggu info selanjutnya.");
      window.location.href = "/";
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-[0.6] pointer-events-none" style={{ backgroundImage: "radial-gradient(#94a3b8 1px, transparent 1px)", backgroundSize: "24px 24px" }}></div>
      <div className="max-w-4xl mx-auto relative z-10">
        <Link href="/" className="inline-flex items-center text-slate-500 hover:text-blue-700 mb-6 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Beranda
        </Link>

        <Card className="border-slate-200 shadow-lg">
          <CardHeader className="bg-blue-700 text-white rounded-t-lg px-6 py-8">
            <CardTitle className="text-2xl font-bold">Formulir Pendaftaran Magang</CardTitle>
            <CardDescription className="text-blue-100 text-base">Silahkan lengkapi data diri dan berkas persyaratan.</CardDescription>
          </CardHeader>

          <CardContent className="p-6 md:p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                {/* --- BAGIAN 1: DATA DIRI --- */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">1</span>
                    Data Diri Peserta
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="namaLengkap" render={({ field }) => (
                      <FormItem><FormLabel>Nama Lengkap <span className="text-red-500">*</span></FormLabel><FormControl><Input placeholder="Sesuai KTP/KTM" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="nomorInduk" render={({ field }) => (
                      <FormItem><FormLabel>Nomor Induk (NIS/NIM) <span className="text-red-500">*</span></FormLabel><FormControl><Input placeholder="Contoh: 21.11.1234" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem><FormLabel>Alamat Email <span className="text-red-500">*</span></FormLabel><FormControl><Input type="email" placeholder="email@contoh.com" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="nomorHp" render={({ field }) => (
                      <FormItem><FormLabel>Nomor HP (WhatsApp) <span className="text-red-500">*</span></FormLabel><FormControl><Input placeholder="'62812345678" {...field} /></FormControl><FormDescription className="text-xs">Diawali tanda petik satu (') dan kode negara 62.</FormDescription><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="instansi" render={({ field }) => (
                      <FormItem><FormLabel>Sekolah / Universitas <span className="text-red-500">*</span></FormLabel><FormControl><Input placeholder="Nama Instansi Pendidikan" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="fakultas" render={({ field }) => (
                      <FormItem><FormLabel>Fakultas</FormLabel><FormControl><Input placeholder="Kosongkan jika siswa SMK/SMA" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="jurusan" render={({ field }) => (
                      <FormItem className="md:col-span-2"><FormLabel>Jurusan/Prodi - Jenjang <span className="text-red-500">*</span></FormLabel><FormControl><Input placeholder="Contoh: Pendidikan Administrasi - S1" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                </div>

                {/* --- BAGIAN 2: DETAIL MAGANG (OTOMATIS) --- */}
                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">2</span>
                    Detail Magang
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* INPUT: LAMA MAGANG */}
                    <FormField control={form.control} name="lamaMagang" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lama Magang (Hari Kerja) <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Min. 44" {...field} 
                            onChange={e => field.onChange(parseInt(e.target.value) || 0)} 
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-blue-600">
                          *Sabtu, Minggu & Libur Nasional tidak dihitung.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* INPUT: TANGGAL MULAI */}
                    <FormField control={form.control} name="tanggalMulai" render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Tanggal Mulai Magang <span className="text-red-500">*</span></FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, "d MMMM yyyy", { locale: id }) : <span>Pilih tanggal mulai</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar 
                              mode="single" 
                              selected={field.value} 
                              onSelect={field.onChange} 
                              disabled={(date) => isWeekend(date) || isHoliday(date)} // Disable weekend di kalender juga
                              initialFocus 
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* OUTPUT: TANGGAL SELESAI (READ ONLY) */}
                    <FormField control={form.control} name="tanggalSelesai" render={({ field }) => (
                      <FormItem className="flex flex-col md:col-span-2">
                        <FormLabel>Estimasi Tanggal Selesai</FormLabel>
                        <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-md border border-slate-200 text-slate-700">
                          <CalendarClock className="h-5 w-5 text-blue-600" />
                          <span className="font-semibold">
                            {field.value 
                              ? format(field.value, "EEEE, d MMMM yyyy", { locale: id }) 
                              : "Pilih tanggal mulai & durasi dulu..."}
                          </span>
                        </div>
                        <FormDescription className="text-xs">
                          Tanggal ini dihitung otomatis berdasarkan hari kerja (Senin-Jumat).
                        </FormDescription>
                        {/* Hidden input agar tetap terkirim saat submit */}
                        <input type="hidden" name="tanggalSelesai" value={field.value ? field.value.toISOString() : ""} />
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>

                {/* --- BAGIAN 3: SURAT PENGANTAR --- */}
                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">3</span>
                    Data Surat Pengantar
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="pemohonSurat" render={({ field }) => (
                      <FormItem><FormLabel>Pemohon Surat <span className="text-red-500">*</span></FormLabel><FormControl><Input placeholder="Contoh: Wakil Dekan" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="nomorSurat" render={({ field }) => (
                      <FormItem><FormLabel>Nomor Surat <span className="text-red-500">*</span></FormLabel><FormControl><Input placeholder="Nomor surat resmi" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="tanggalSurat" render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Tanggal Surat <span className="text-red-500">*</span></FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, "d MMMM yyyy", { locale: id }) : <span>Pilih tanggal</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date()} initialFocus />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>

                {/* --- BAGIAN 4: UPLOAD BERKAS --- */}
                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">4</span>
                    Upload Berkas
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* CV */}
                    <div className="space-y-2">
                      <FormLabel>Curriculum Vitae (CV) <span className="text-red-500">*</span></FormLabel>
                      <label htmlFor="cv" className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${fileNames.cv ? "border-green-500 bg-green-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100"}`}>
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 px-2 text-center">
                          {fileNames.cv ? <><FileCheck className="w-8 h-8 mb-2 text-green-600"/><p className="text-sm text-green-700 font-semibold break-all px-4">{fileNames.cv}</p></> : <><Upload className="w-6 h-6 mb-2 text-slate-400"/><p className="text-xs text-slate-500 font-semibold">Upload PDF</p><p className="text-[10px] text-slate-400">Max. 300KB</p></>}
                        </div>
                        <Input id="cv" type="file" accept=".pdf" className="hidden" onChange={(e) => handleFileChange(e, "cv")} />
                      </label>
                    </div>
                    {/* SURAT */}
                    <div className="space-y-2">
                      <FormLabel>Surat Pengantar <span className="text-red-500">*</span></FormLabel>
                      <label htmlFor="surat" className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${fileNames.surat ? "border-green-500 bg-green-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100"}`}>
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 px-2 text-center">
                          {fileNames.surat ? <><FileCheck className="w-8 h-8 mb-2 text-green-600"/><p className="text-sm text-green-700 font-semibold break-all px-4">{fileNames.surat}</p></> : <><Upload className="w-6 h-6 mb-2 text-slate-400"/><p className="text-xs text-slate-500 font-semibold">Upload PDF</p><p className="text-[10px] text-slate-400">Max. 300KB</p></>}
                        </div>
                        <Input id="surat" type="file" accept=".pdf" className="hidden" onChange={(e) => handleFileChange(e, "surat")} />
                      </label>
                    </div>
                    {/* FOTO */}
                    <div className="space-y-2">
                      <FormLabel>Pas Foto 3x4 <span className="text-red-500">*</span></FormLabel>
                      <label htmlFor="foto" className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${fileNames.foto ? "border-green-500 bg-green-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100"}`}>
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 px-2 text-center">
                          {fileNames.foto ? <><FileCheck className="w-8 h-8 mb-2 text-green-600"/><p className="text-sm text-green-700 font-semibold break-all px-4">{fileNames.foto}</p></> : <><Upload className="w-6 h-6 mb-2 text-slate-400"/><p className="text-xs text-slate-500 font-semibold">Upload JPG/PNG</p><p className="text-[10px] text-slate-400">Max. 300KB</p></>}
                        </div>
                        <Input id="foto" type="file" accept="image/png, image/jpeg, image/jpg" className="hidden" onChange={(e) => handleFileChange(e, "foto")} />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <Button type="submit" size="lg" className="w-full bg-blue-700 hover:bg-blue-800" disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengirim...</> : <><Send className="mr-2 h-4 w-4" /> Kirim Pendaftaran</>}
                  </Button>
                  <p className="text-xs text-center text-slate-500 mt-4">Dengan mengirim form ini, Anda menyatakan data yang diisi adalah benar.</p>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}