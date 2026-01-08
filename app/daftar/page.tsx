"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { id } from "date-fns/locale"; 
import { CalendarIcon, Upload, ArrowLeft, Loader2, Send } from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// --- 1. SKEMA VALIDASI (ZOD) ---
const formSchema = z.object({
  namaLengkap: z.string().min(2, "Nama minimal 2 karakter"),
  nomorInduk: z.string().min(1, "NIS/NIM wajib diisi"),
  email: z.string().email("Format email tidak valid"),
  instansi: z.string().min(3, "Nama Sekolah/Universitas wajib diisi"),
  fakultas: z.string().optional(),
  jurusan: z.string().min(2, "Jurusan/Jenjang wajib diisi"),
  lamaMagang: z.coerce.number().min(44, "Durasi magang minimal 44 hari kerja"),
  
  tanggalMulai: z.date()
    .optional()
    .refine((date) => !!date, { message: "Tanggal mulai wajib dipilih" }),
    
  tanggalSelesai: z.date()
    .optional()
    .refine((date) => !!date, { message: "Tanggal selesai wajib dipilih" }),

  pemohonSurat: z.string().min(2, "Nama/Jabatan pemohon wajib diisi"),
  nomorSurat: z.string().min(1, "Nomor surat wajib diisi"),
  
  tanggalSurat: z.date()
    .optional()
    .refine((date) => !!date, { message: "Tanggal surat wajib dipilih" }),
    
  nomorHp: z.string().min(10, "Nomor HP tidak valid"),
});

export default function RegistrationPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- PERBAIKAN UTAMA DI SINI ---
  // Hapus <z.infer<typeof formSchema>> agar TypeScript otomatis mendeteksi tipe
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
      lamaMagang: undefined,
      tanggalMulai: undefined, 
      tanggalSelesai: undefined,
      tanggalSurat: undefined,
    },
  });

  const validateFileSize = (file: File | undefined, maxSizeKB: number) => {
    if (!file) return false;
    const fileSizeKB = file.size / 1024;
    return fileSizeKB <= maxSizeKB;
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    const cvFile = (document.getElementById("cv") as HTMLInputElement).files?.[0];
    const suratFile = (document.getElementById("surat") as HTMLInputElement).files?.[0];
    const fotoFile = (document.getElementById("foto") as HTMLInputElement).files?.[0];

    if (!cvFile || !suratFile || !fotoFile) {
      alert("Harap lengkapi semua berkas (CV, Surat Pengantar, dan Pas Foto)!");
      setIsSubmitting(false);
      return;
    }

    if (!validateFileSize(cvFile, 300)) {
      alert(`Ukuran CV terlalu besar (${(cvFile.size/1024).toFixed(0)}KB). Maksimal 300KB.`);
      setIsSubmitting(false);
      return;
    }
    if (!validateFileSize(suratFile, 300)) {
      alert(`Ukuran Surat Pengantar terlalu besar (${(suratFile.size/1024).toFixed(0)}KB). Maksimal 300KB.`);
      setIsSubmitting(false);
      return;
    }
    if (!validateFileSize(fotoFile, 300)) { 
      alert(`Ukuran Foto terlalu besar (${(fotoFile.size/1024).toFixed(0)}KB). Maksimal 300KB.`);
      setIsSubmitting(false);
      return;
    }

    console.log("Data Teks:", values);
    console.log("File CV:", cvFile.name);
    console.log("File Surat:", suratFile.name);
    console.log("File Foto:", fotoFile.name);

    setTimeout(() => {
      alert("Formulir Valid! (Data belum disimpan ke database karena mode preview)");
      setIsSubmitting(false);
    }, 1500);
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-[0.6] pointer-events-none" 
           style={{ 
             backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', 
             backgroundSize: '24px 24px' 
           }}>
      </div>
      <div className="max-w-4xl mx-auto relative z-10">
        
        <Link href="/" className="inline-flex items-center text-slate-500 hover:text-blue-700 mb-6 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Beranda
        </Link>

        <Card className="border-slate-200 shadow-lg">
          <CardHeader className="bg-blue-700 text-white rounded-t-lg px-6 py-8">
            <CardTitle className="text-2xl font-bold">Formulir Pendaftaran Magang</CardTitle>
            <CardDescription className="text-blue-100 text-base">
              Silahkan lengkapi data diri dan berkas persyaratan.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6 md:p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                {/* BAGIAN 1: DATA DIRI */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">1</span>
                    Data Diri Peserta
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="namaLengkap" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Lengkap <span className="text-red-500">*</span></FormLabel>
                        <FormControl><Input placeholder="Sesuai KTP/KTM" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    
                    <FormField control={form.control} name="nomorInduk" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nomor Induk (NIS/NIM) <span className="text-red-500">*</span></FormLabel>
                        <FormControl><Input placeholder="Contoh: 21.11.1234" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alamat Email <span className="text-red-500">*</span></FormLabel>
                        <FormControl><Input type="email" placeholder="email@contoh.com" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="nomorHp" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nomor HP (WhatsApp) <span className="text-red-500">*</span></FormLabel>
                        <FormControl><Input placeholder="'62812345678" {...field} /></FormControl>
                        <FormDescription className="text-xs">Diawali tanda petik satu (') dan kode negara 62.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="instansi" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sekolah / Universitas <span className="text-red-500">*</span></FormLabel>
                        <FormControl><Input placeholder="Nama Instansi Pendidikan" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="fakultas" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fakultas</FormLabel>
                        <FormControl><Input placeholder="Kosongkan jika siswa SMK/SMA" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="jurusan" render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Jurusan/Prodi - Jenjang <span className="text-red-500">*</span></FormLabel>
                        <FormControl><Input placeholder="Contoh: Pendidikan Administrasi - S1" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>

                {/* BAGIAN 2: DETAIL MAGANG */}
                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">2</span>
                    Detail Magang
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="lamaMagang"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Lama Magang (Hari Kerja) <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Min. 44"

                              name={field.name}
                              ref={field.ref}
                              onBlur={field.onBlur}
                              disabled={field.disabled}
                              
                              value={field.value ? String(field.value) : ""}
                              
                              onChange={(e) => {
                                const val = e.target.value === "" ? undefined : parseInt(e.target.value);
                                field.onChange(val);
                              }}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Minimal 44 hari kerja (Senin-Jumat).
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="tanggalSelesai" render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Tanggal Selesai Magang <span className="text-red-500">*</span></FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, "d MMMM yyyy", { locale: id }) : <span>Pilih tanggal selesai</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar 
                              mode="single" 
                              selected={field.value} 
                              onSelect={field.onChange} 
                              initialFocus 
                              disabled={(date) => {
                                // Cek apakah tanggal mulai sudah dipilih
                                const start = form.getValues("tanggalMulai");
                                // Disable jika tanggal kurang dari tanggal mulai (atau hari ini jika belum dipilih)
                                return date < (start || new Date());
                              }} 
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>

                {/* BAGIAN 3: SURAT PENGANTAR */}
                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">3</span>
                    Data Surat Pengantar
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="pemohonSurat" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pemohon Surat Izin Magang <span className="text-red-500">*</span></FormLabel>
                        <FormControl><Input placeholder="Contoh: Wakil Dekan Bidang Akademik" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="nomorSurat" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nomor Surat Izin Magang <span className="text-red-500">*</span></FormLabel>
                        <FormControl><Input placeholder="Nomor surat resmi dari kampus" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="tanggalSurat" render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Tanggal Surat Izin Magang<span className="text-red-500">*</span></FormLabel>
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

                {/* BAGIAN 4: UPLOAD BERKAS */}
                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">4</span>
                    Upload Berkas
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* INPUT CV */}
                    <div className="space-y-2">
                      <FormLabel>Curriculum Vitae (CV) <span className="text-red-500">*</span></FormLabel>
                      <div className="flex items-center justify-center w-full">
                        <label htmlFor="cv" className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6 px-2 text-center">
                            <Upload className="w-6 h-6 mb-2 text-slate-400" />
                            <p className="text-xs text-slate-500 font-semibold">Upload PDF</p>
                            <p className="text-[10px] text-slate-400">Max. 300KB</p>
                          </div>
                          <Input id="cv" type="file" accept=".pdf" className="hidden" />
                        </label>
                      </div>
                    </div>

                    {/* INPUT SURAT */}
                    <div className="space-y-2">
                      <FormLabel>Surat Pengantar <span className="text-red-500">*</span></FormLabel>
                      <div className="flex items-center justify-center w-full">
                        <label htmlFor="surat" className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6 px-2 text-center">
                            <Upload className="w-6 h-6 mb-2 text-slate-400" />
                            <p className="text-xs text-slate-500 font-semibold">Upload PDF</p>
                            <p className="text-[10px] text-slate-400">Max. 300KB</p>
                          </div>
                          <Input id="surat" type="file" accept=".pdf" className="hidden" />
                        </label>
                      </div>
                    </div>

                    {/* INPUT PAS FOTO */}
                    <div className="space-y-2">
                      <FormLabel>Pas Foto 3x4 <span className="text-red-500">*</span></FormLabel>
                      <div className="flex items-center justify-center w-full">
                        <label htmlFor="foto" className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6 px-2 text-center">
                            <Upload className="w-6 h-6 mb-2 text-slate-400" />
                            <p className="text-xs text-slate-500 font-semibold">Upload JPG/PNG</p>
                            <p className="text-[10px] text-slate-400">Max. 300KB</p>
                          </div>
                          <Input id="foto" type="file" accept="image/png, image/jpeg, image/jpg" className="hidden" />
                        </label>
                      </div>
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