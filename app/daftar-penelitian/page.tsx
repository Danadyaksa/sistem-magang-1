"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { 
  CalendarIcon, 
  ArrowLeft, 
  Loader2, 
  Send, 
  BookOpen
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // Untuk navigasi smooth
import { toast } from "sonner"; // Notifikasi Keren

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Textarea } from "@/components/ui/textarea";

// --- SKEMA VALIDASI ---
const formSchema = z.object({
  namaLengkap: z.string().min(2, "Nama minimal 2 karakter"),
  nomorInduk: z.string().min(1, "NIM/NIDN wajib diisi"),
  email: z.string().email("Format email tidak valid"),
  nomorHp: z.string().min(10, "Nomor HP tidak valid"),
  universitas: z.string().min(3, "Nama Kampus wajib diisi"),
  fakultas: z.string().optional(),
  jurusan: z.string().min(2, "Jurusan wajib diisi"),
  
  // Riset Details
  kategori: z.string({ required_error: "Pilih jenis penelitian" }),
  judul: z.string().min(5, "Judul penelitian terlalu pendek"),
  subjek: z.string().min(3, "Subjek penelitian wajib diisi"),
  
  // Surat Info
  pemohonSurat: z.string().min(2, "Pejabat penandatangan wajib diisi"),
  nomorSurat: z.string().min(1, "Nomor surat wajib diisi"),
  tanggalSurat: z.date({ required_error: "Tanggal surat wajib dipilih" }),
});

export default function ResearchRegistrationPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter(); // Hook navigasi

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      namaLengkap: "",
      nomorInduk: "",
      email: "",
      nomorHp: "'62",
      universitas: "",
      fakultas: "",
      jurusan: "",
      kategori: "",
      judul: "",
      subjek: "",
      pemohonSurat: "",
      nomorSurat: "",
      tanggalSurat: undefined,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      // Kirim Data JSON
      const response = await fetch("/api/penelitian", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values) 
      });
      
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Gagal mengirim data");

      // --- ALERT DIGANTI JADI TOAST ---
      toast.success("Permohonan Berhasil Dikirim!", {
        description: "Data Anda telah tersimpan. Silakan tunggu verifikasi admin via Email/WA.",
        duration: 5000, // Muncul selama 5 detik
      });

      // Redirect ke halaman utama
      router.push("/");
      
    } catch (error: any) {
      // --- ALERT ERROR DIGANTI JADI TOAST ---
      toast.error("Gagal Mengirim", {
        description: error.message || "Terjadi kesalahan sistem.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 relative overflow-hidden transition-colors duration-300">
      
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.6] dark:opacity-[0.2] pointer-events-none" 
           style={{ backgroundImage: "radial-gradient(#10b981 1px, transparent 1px)", backgroundSize: "24px 24px" }}>
      </div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        <Link href="/" className="inline-flex items-center text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 mb-6 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Beranda
        </Link>

        <Card className="border-slate-200 dark:border-slate-800 shadow-lg bg-white dark:bg-slate-900 transition-colors">
          <CardHeader className="bg-emerald-600 dark:bg-emerald-800 text-white rounded-t-lg px-6 py-8">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6"/> Formulir Izin Penelitian
            </CardTitle>
            <CardDescription className="text-emerald-50 text-base">
              Khusus Mahasiswa (Skripsi/Tesis) & Dosen
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 md:p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                {/* --- BAGIAN 1: DATA PENELITI --- */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 border-b dark:border-slate-800 pb-2 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs">1</span>
                    Identitas Peneliti
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="namaLengkap" render={({ field }) => (
                      <FormItem>
                          <FormLabel className="dark:text-slate-300">Nama Lengkap (Mahasiswa/Dosen) <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                              <Input placeholder="Sesuai KTP" {...field} className="dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100" />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="nomorInduk" render={({ field }) => (
                      <FormItem>
                          <FormLabel className="dark:text-slate-300">Nomor Induk (NIM / NIDN) <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                              <Input placeholder="Contoh: 1900012345" {...field} className="dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100" />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                          <FormLabel className="dark:text-slate-300">Email Aktif <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                              <Input type="email" placeholder="email@kampus.ac.id" {...field} className="dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100" />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="nomorHp" render={({ field }) => (
                      <FormItem>
                          <FormLabel className="dark:text-slate-300">Nomor HP (WhatsApp) <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                              <Input placeholder="'628123..." {...field} className="dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100" />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="universitas" render={({ field }) => (
                      <FormItem>
                          <FormLabel className="dark:text-slate-300">Universitas / Perguruan Tinggi <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                              <Input placeholder="Nama Kampus Asal" {...field} className="dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100" />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="fakultas" render={({ field }) => (
                      <FormItem>
                          <FormLabel className="dark:text-slate-300">Fakultas</FormLabel>
                          <FormControl>
                              <Input placeholder="Nama Fakultas" {...field} className="dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100" />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="jurusan" render={({ field }) => (
                      <FormItem className="md:col-span-2">
                          <FormLabel className="dark:text-slate-300">Jurusan / Prodi - Jenjang <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                              <Input placeholder="Contoh: Ilmu Komunikasi - S1" {...field} className="dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100" />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>

                {/* --- BAGIAN 2: DETAIL PENELITIAN --- */}
                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 border-b dark:border-slate-800 pb-2 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs">2</span>
                    Detail Penelitian
                  </h3>

                  <div className="grid grid-cols-1 gap-6">
                    <FormField control={form.control} name="kategori" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="dark:text-slate-300">Penelitian Dalam Rangka <span className="text-red-500">*</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100">
                              <SelectValue placeholder="Pilih Tujuan Penelitian" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="dark:bg-slate-950 dark:border-slate-800">
                            <SelectItem value="Skripsi">Penulisan Skripsi</SelectItem>
                            <SelectItem value="Tesis">Penulisan Tesis</SelectItem>
                            <SelectItem value="Disertasi">Penulisan Disertasi</SelectItem>
                            <SelectItem value="Lainnya">Lainnya (Tugas Kuliah/Dosen)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="judul" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="dark:text-slate-300">Judul Penelitian <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Textarea placeholder="Ketik judul lengkap penelitian Anda..." className="resize-none dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="subjek" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="dark:text-slate-300">Subjek Penelitian <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: Pegawai Sub Bagian Kepegawaian, Siswa SMK N 1, dll" {...field} className="dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100" />
                        </FormControl>
                        <FormDescription className="text-xs dark:text-slate-500">
                          Sebutkan target responden atau unit kerja yang dituju.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>

                {/* --- BAGIAN 3: SURAT KAMPUS --- */}
                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 border-b dark:border-slate-800 pb-2 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs">3</span>
                    Data Surat Pengantar
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="pemohonSurat" render={({ field }) => (
                      <FormItem>
                          <FormLabel className="dark:text-slate-300">Pejabat Penandatangan <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                              <Input placeholder="Contoh: Wakil Dekan Fakultas Ekonomi" {...field} className="dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100" />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="nomorSurat" render={({ field }) => (
                      <FormItem>
                          <FormLabel className="dark:text-slate-300">Nomor Surat Pengantar <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                              <Input placeholder="Nomor surat dari kampus" {...field} className="dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100" />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="tanggalSurat" render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="dark:text-slate-300">Tanggal Surat <span className="text-red-500">*</span></FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-900", !field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, "d MMMM yyyy", { locale: id }) : <span>Pilih tanggal</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 dark:bg-slate-950 dark:border-slate-800" align="start">
                            <Calendar 
                                mode="single" 
                                selected={field.value} 
                                onSelect={field.onChange} 
                                disabled={(date) => date > new Date()} 
                                initialFocus 
                                className="dark:bg-slate-950 dark:text-slate-100"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>

                <div className="pt-6">
                  <Button type="submit" size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-700/20" disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengirim...</> : <><Send className="mr-2 h-4 w-4" /> Ajukan Permohonan</>}
                  </Button>
                  <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-4">Pastikan data yang diisi sudah benar.</p>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}