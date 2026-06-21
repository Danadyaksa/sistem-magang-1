"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, addDays, isWeekend } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";
import { 
  CalendarIcon, 
  Upload, 
  ArrowLeft, 
  Loader2, 
  Send,
  FileCheck,
  CalendarClock,
  Plus,
  Trash2,
  Users
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const baseSchema = z.object({
  namaLengkap: z.string().optional(),
  nomorInduk: z.string().optional(),
  email: z.string().optional(),
  instansi: z.string().min(3, "Nama Instansi Pendidikan wajib diisi"),
  fakultas: z.string().optional(),
  jurusan: z.string().min(2, "Jurusan wajib diisi"),
  lamaMagang: z.coerce.number(),
  tanggalMulai: z.date({ required_error: "Tanggal mulai wajib dipilih" }),
  tanggalSelesai: z.date({ required_error: "Tanggal selesai terhitung otomatis" }),
  pemohonSurat: z.string().min(2, "Nama pemohon surat wajib diisi"),
  nomorSurat: z.string().min(1, "Nomor surat wajib diisi"),
  tanggalSurat: z.date({ required_error: "Tanggal surat wajib dipilih" }),
  nomorHp: z.string().optional(),
});

type FormValues = z.infer<typeof baseSchema>;

export default function RegistrationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jenisPendaftaran, setJenisPendaftaran] = useState<"MAHASISWA" | "SMK">("MAHASISWA");
  const [positions, setPositions] = useState<any[]>([]);
  
  const [fileNames, setFileNames] = useState<{ cv: string | null; surat: string | null }>({ cv: null, surat: null });
  const [dbHolidays, setDbHolidays] = useState<string[]>([]);
  const [minMagangDays, setMinMagangDays] = useState<number>(44);

  // Array State Kolektif Data Siswa SMK (Opsi B)
  const [batchStudents, setBatchStudents] = useState<Array<{ namaLengkap: string; nomorHp: string; positionId: string }>>([
    { namaLengkap: "", nomorHp: "", positionId: "" }
  ]);

  const dynamicSchema = useMemo(() => {
    return baseSchema.extend({
      lamaMagang: z.coerce.number().min(minMagangDays, `Durasi magang minimal ${minMagangDays} hari kerja`),
    });
  }, [minMagangDays]);

  const form = useForm<FormValues>({
    resolver: zodResolver(dynamicSchema),
    mode: "onChange",
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
      lamaMagang: 44, 
      tanggalMulai: undefined,
      tanggalSelesai: undefined,
      tanggalSurat: undefined,
    } as any,
  });

  useEffect(() => {
    // Fetch data kuota posisi/bidang dari database
    fetch("/api/positions").then(res => res.json()).then(data => {
      if (Array.isArray(data)) setPositions(data);
    }).catch(err => console.error(err));

    fetch("/api/holidays").then(res => res.json()).then(data => {
      if (Array.isArray(data)) {
        const formatted = data.map((h: any) => format(new Date(h.date), "yyyy-MM-dd"));
        setDbHolidays(formatted);
      }
    });

    fetch("/api/settings?key=MIN_MAGANG_DAYS").then(res => res.json()).then(data => {
      if (data?.value) {
        const minDays = parseInt(data.value);
        setMinMagangDays(minDays);
        form.setValue("lamaMagang", minDays, { shouldValidate: true });
      }
    });
  }, [form]);

  const isHoliday = (date: Date) => {
    return dbHolidays.includes(format(date, "yyyy-MM-dd"));
  };

  const lamaMagang = useWatch({ control: form.control, name: "lamaMagang" });
  const tanggalMulai = useWatch({ control: form.control, name: "tanggalMulai" });

  useEffect(() => {
    if (tanggalMulai && lamaMagang > 0) {
      let count = 0;
      let currentDate = new Date(tanggalMulai);
      let lastWorkingDate = new Date(tanggalMulai);
      let safetyLoop = 0;

      while (count < lamaMagang && safetyLoop < 365) {
        if (!isWeekend(currentDate) && !isHoliday(currentDate)) {
          count++; 
          lastWorkingDate = currentDate; 
        }
        if (count < lamaMagang) currentDate = addDays(currentDate, 1);
        safetyLoop++;
      }
      form.setValue("tanggalSelesai", lastWorkingDate);
    }
  }, [lamaMagang, tanggalMulai, form, dbHolidays]);

  // Handle baris siswa SMK dinamis
  const addStudentField = () => {
    if (batchStudents.length >= 4) return toast.warning("Maksimal input kolektif 4 siswa bray!");
    setBatchStudents([...batchStudents, { namaLengkap: "", nomorHp: "", positionId: "" }]);
  };

  const removeStudentField = (idx: number) => {
    if (batchStudents.length === 1) return;
    setBatchStudents(batchStudents.filter((_, i) => i !== idx));
  };

  const updateStudent = (idx: number, field: string, val: string) => {
    const nextList = [...batchStudents];
    (nextList[idx] as any)[field] = val;
    setBatchStudents(nextList);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "cv" | "surat") => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 300 * 1024) {
        toast.error(`File ${type.toUpperCase()} Kebesaran! Max 300KB`);
        e.target.value = "";
        return;
      }
      setFileNames(prev => ({ ...prev, [type]: file.name }));
      toast.success(`${type.toUpperCase()} Terpilih: ${file.name}`);
    }
  };

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("jenisPendaftaran", jenisPendaftaran);

      // Packing data umum form
      Object.keys(values).forEach((key) => {
        const value = values[key as keyof typeof values];
        if (value instanceof Date) formData.append(key, value.toISOString());
        else if (value !== undefined && value !== null) formData.append(key, value.toString());
      });

      const suratFile = (document.getElementById("surat") as HTMLInputElement).files?.[0];
      if (!suratFile) {
        toast.warning("File Surat Pengantar wajib dilampirkan!");
        setIsSubmitting(false);
        return;
      }
      formData.append("surat", suratFile);

      // Packing spesifik alur SMK
      if (jenisPendaftaran === "SMK") {
        const isValidBatch = batchStudents.every(s => s.namaLengkap && s.nomorHp && s.positionId);
        if (!isValidBatch) {
          toast.warning("Lengkapi data nama, HP, dan bidang pilihan untuk seluruh baris siswa!");
          setIsSubmitting(false);
          return;
        }
        formData.append("students", JSON.stringify(batchStudents));
      } else {
        // Packing spesifik Mahasiswa
        const cvFile = (document.getElementById("cv") as HTMLInputElement).files?.[0];
        if (!cvFile || !values.namaLengkap || !values.nomorInduk || !values.email) {
          toast.warning("Data Diri & CV Mahasiswa wajib lengkap!");
          setIsSubmitting(false);
          return;
        }
        formData.append("cv", cvFile);
      }

      const res = await fetch("/api/pendaftaran", { method: "POST", body: formData });
      const result = await res.json();

      if (!res.ok) throw new Error(result.error || "Gagal mendaftarkan data");

      toast.success("Pendaftaran Sukses Dimasukkan, BHAP!", { duration: 5000 });
      router.push("/");
    } catch (error: any) {
      toast.error(error.message || "Gagal memproses data");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 relative overflow-hidden transition-colors">
      <div className="max-w-4xl mx-auto relative z-10">
        <Link href="/" className="inline-flex items-center text-slate-500 hover:text-blue-700 mb-6 font-medium">
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Beranda
        </Link>

        <Card className="border-slate-200 dark:border-slate-800 shadow-lg bg-white dark:bg-slate-900">
          <CardHeader className="bg-blue-700 dark:bg-blue-800 text-white rounded-t-lg px-6 py-6">
            <CardTitle className="text-xl md:text-2xl font-bold">Portal Formulir Pendaftaran Magang</CardTitle>
            <CardDescription className="text-blue-100 text-sm">Pilih jenis instansi pendaftar terlebih dahulu di bawah, pak.</CardDescription>
          </CardHeader>

          {/* CHOOSE DROPDOWN JENIS PENDAFTARAN UTAMA */}
          <div className="px-6 md:px-8 pt-6">
            <div className="space-y-2 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900">
              <Label className="font-semibold text-slate-700 dark:text-slate-300">Pilih Kategori Kualifikasi Instansi Magang <span className="text-red-500">*</span></Label>
              <Select value={jenisPendaftaran} onValueChange={(v: any) => setJenisPendaftaran(v)}>
                <SelectTrigger className="w-full bg-white dark:bg-slate-950"><SelectValue placeholder="Pilih Kategori" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAHASISWA">Perguruan Tinggi / Mahasiswa (S1/D3)</SelectItem>
                  <SelectItem value="SMK">Sekolah Menengah Kejuruan / Siswa SMK (Kolektif oleh Guru)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <CardContent className="p-6 md:p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                {/* --- RENDER KONDISIONAL 1: ALUR MAHASISWA --- */}
                {jenisPendaftaran === "MAHASISWA" && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <h3 className="text-lg font-semibold border-b pb-2 mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 flex items-center justify-center text-xs font-bold">1</span>
                      Data Diri Peserta Mahasiswa
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField control={form.control} name="namaLengkap" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Lengkap <span className="text-red-500">*</span></FormLabel>
                          <FormControl><Input placeholder="Sesuai KTM" {...field} className="dark:bg-slate-950" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="nomorInduk" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nomor Induk Mahasiswa (NIM) <span className="text-red-500">*</span></FormLabel>
                          <FormControl><Input placeholder="Masukkan NIM..." {...field} className="dark:bg-slate-950" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alamat Email <span className="text-red-500">*</span></FormLabel>
                          <FormControl><Input type="email" placeholder="mail@kampus.com" {...field} className="dark:bg-slate-950" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="nomorHp" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nomor HP (WhatsApp) <span className="text-red-500">*</span></FormLabel>
                          <FormControl><Input placeholder="'628..." {...field} className="dark:bg-slate-950" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="instansi" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Universitas <span className="text-red-500">*</span></FormLabel>
                          <FormControl><Input placeholder="Misal: UPN Veteran Yogyakarta" {...field} className="dark:bg-slate-950" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="fakultas" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fakultas</FormLabel>
                          <FormControl><Input placeholder="Fakultas Ilmu Komputer" {...field} className="dark:bg-slate-950" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="jurusan" render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Program Studi / Jurusan - Jenjang <span className="text-red-500">*</span></FormLabel>
                          <FormControl><Input placeholder="Contoh: Informatika - S1" {...field} className="dark:bg-slate-950" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </div>
                )}

                {/* --- RENDER KONDISIONAL 2: ALUR SISWA SMK MULTI-INPUT (OPSI B) --- */}
                {jenisPendaftaran === "SMK" && (
                  <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                    <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 flex items-center justify-center text-xs font-bold">1</span>
                      Informasi Kolektif Sekolah & Guru Pembimbing SMK
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-dashed">
                      <FormField control={form.control} name="instansi" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Asal Sekolah SMK <span className="text-red-500">*</span></FormLabel>
                          <FormControl><Input placeholder="Nama Sekolah SMK..." {...field} className="dark:bg-slate-950" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="jurusan" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kompetensi Keahlian / Jurusan <span className="text-red-500">*</span></FormLabel>
                          <FormControl><Input placeholder="Contoh: Teknik Komputer Jaringan (TKJ)" {...field} className="dark:bg-slate-950" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="pemohonSurat" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Guru Pembimbing SMK <span className="text-red-500">*</span></FormLabel>
                          <FormControl><Input placeholder="Nama Guru Operator Pembimbing..." {...field} className="dark:bg-slate-950" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="fakultas" render={({ field }) => (
                        <FormItem>
                          <FormLabel>No HP Guru Pembimbing <span className="text-red-500">*</span></FormLabel>
                          <FormControl><Input placeholder="Masukkan kontak aktif guru..." {...field} className="dark:bg-slate-950" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    {/* LOOPING INPUT BARIS SISWA SMK DARI OPSI B */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b pb-2">
                        <Label className="text-sm font-bold flex items-center gap-2 text-blue-600 dark:text-blue-400">
                          <Users className="h-4 w-4" /> Daftar Anggota Siswa Pemagang ({batchStudents.length}/4)
                        </Label>
                        <Button type="button" size="sm" variant="outline" onClick={addStudentField} className="h-8">
                          <Plus className="h-3 w-3 mr-1" /> Tambah Siswa
                        </Button>
                      </div>

                      {batchStudents.map((siswa, idx) => (
                        <div key={idx} className="p-4 border rounded-xl bg-slate-50/50 dark:bg-slate-900/20 relative group shadow-sm flex flex-col md:flex-row gap-4 items-center">
                          <div className="flex-none flex flex-col items-center justify-center w-12 h-12 bg-white dark:bg-slate-950 rounded-lg border font-bold text-slate-500 text-sm">
                            #{idx + 1}
                          </div>
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                            <div className="space-y-1">
                              <Label className="text-xs">Nama Lengkap Siswa <span className="text-red-500">*</span></Label>
                              <Input placeholder="Nama lengkap..." value={siswa.namaLengkap} onChange={(e) => updateStudent(idx, "namaLengkap", e.target.value)} className="h-9 bg-white dark:bg-slate-950 text-xs" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">No HP Siswa <span className="text-red-500">*</span></Label>
                              <Input placeholder="08..." value={siswa.nomorHp} onChange={(e) => updateStudent(idx, "nomorHp", e.target.value)} className="h-9 bg-white dark:bg-slate-950 text-xs" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Pilihan Bidang Magang <span className="text-red-500">*</span></Label>
                              <Select value={siswa.positionId} onValueChange={(v) => updateStudent(idx, "positionId", v)}>
                                <SelectTrigger className="h-9 text-xs w-full bg-white dark:bg-slate-950">
                                  <SelectValue placeholder="Pilih Posisi..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {positions.map((p) => (
                                    <SelectItem key={p.id} value={p.id.toString()} disabled={(p.quota - p.filled) <= 0}>
                                      {p.title} (Sisa Kuota: {p.quota - p.filled})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          {batchStudents.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeStudentField(idx)} className="text-red-500 hover:bg-red-50 h-8 w-8 mt-2 md:mt-0">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* --- BAGIAN 2: DETAIL WAKTU (SAMA BUAT DUA-DUANYA) --- */}
                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-semibold border-b pb-2 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 flex items-center justify-center text-xs font-bold">2</span>
                    Detail Waktu Kontrak Magang
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="lamaMagang" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lama Magang (Hari Kerja) <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input type="number" placeholder={`Min. ${minMagangDays}`} {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} className="dark:bg-slate-950" />
                        </FormControl>
                        <FormDescription className="text-xs text-blue-600 dark:text-blue-400">
                          *Minimal {minMagangDays} hari kerja. Sabtu, Minggu & Libur Nasional terhitung libur otomatis.
                        </FormDescription>
                        <FormMessage /> 
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="tanggalMulai" render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Tanggal Mulai Pelaksanaan <span className="text-red-500">*</span></FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal dark:bg-slate-950 dark:border-slate-700", !field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, "d MMMM yyyy", { locale: id }) : <span>Pilih tanggal mulai</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 dark:bg-slate-950 border-slate-800" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => isWeekend(date) || isHoliday(date)} initialFocus className="dark:bg-slate-950" />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="tanggalSelesai" render={({ field }) => (
                      <FormItem className="flex flex-col md:col-span-2">
                        <FormLabel>Estimasi Masa Selesai Kontrak</FormLabel>
                        <div className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-md border text-sm font-semibold text-slate-700 dark:text-slate-200">
                          <CalendarClock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          <span>{field.value ? format(field.value, "EEEE, d MMMM yyyy", { locale: id }) : "Pilih tanggal mulai & durasi kerja dulu..."}</span>
                        </div>
                        <input type="hidden" name="tanggalSelesai" value={field.value ? field.value.toISOString() : ""} />
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>

                {/* --- BAGIAN 3: DATA SURAT KAMPUS/SEKOLAH --- */}
                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-semibold border-b pb-2 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 flex items-center justify-center text-xs font-bold">3</span>
                    Legitimasi Surat Pengantar Instansi
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="pemohonSurat" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jabatan Pemohon Surat <span className="text-red-500">*</span></FormLabel>
                        <FormControl><Input placeholder="Contoh: Wakil Dekan / Kepala Sekolah" {...field} className="dark:bg-slate-950" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="nomorSurat" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nomor Surat Resmi <span className="text-red-500">*</span></FormLabel>
                        <FormControl><Input placeholder="Nomor surat keluar dari sekolah/kampus" {...field} className="dark:bg-slate-950" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="tanggalSurat" render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Tanggal Terbit Surat <span className="text-red-500">*</span></FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal dark:bg-slate-950", !field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, "d MMMM yyyy", { locale: id }) : <span>Pilih tanggal</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 dark:bg-slate-950" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date()} initialFocus className="dark:bg-slate-950" />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>

                {/* --- BAGIAN 4: UPLOAD BERKAS (DINAMIS SINKRON) --- */}
                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-semibold border-b pb-2 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 flex items-center justify-center text-xs font-bold">4</span>
                    Lampiran Berkas Kelengkapan (Format PDF Max 300KB)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* CV (HANYA MUNCUL DI MAHASISWA) */}
                    {jenisPendaftaran === "MAHASISWA" && (
                      <div className="space-y-2 animate-in fade-in duration-200">
                        <FormLabel>Curriculum Vitae (CV) <span className="text-red-500">*</span></FormLabel>
                        <label htmlFor="cv" className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${fileNames.cv ? "border-green-500 bg-green-50/30" : "border-slate-300 dark:border-slate-700 bg-slate-50 hover:bg-slate-100"}`}>
                          <div className="flex flex-col items-center justify-center text-center px-4">
                            {fileNames.cv ? (
                              <>
                                <FileCheck className="w-8 h-8 mb-1 text-green-600"/>
                                <p className="text-xs text-green-700 font-semibold break-all">{fileNames.cv}</p>
                              </>
                            ) : (
                              <>
                                <Upload className="w-5 h-5 mb-1 text-slate-400"/>
                                <p className="text-xs text-slate-500 font-semibold">Upload CV PDF</p>
                                <p className="text-[10px] text-slate-400 mt-1">Biodata, Pengalaman Kerja & Organisasi.</p>
                              </>
                            )}
                          </div>
                          <Input id="cv" type="file" accept=".pdf" className="hidden" onChange={(e) => handleFileChange(e, "cv")} />
                        </label>
                      </div>
                    )}

                    {/* SURAT PENGANTAR (MUNCUL DI DUA-DUANYA) */}
                    <div className={cn("space-y-2", jenisPendaftaran === "SMK" && "col-span-1 md:col-span-2")}>
                      <FormLabel>Surat Pengantar Instansi / Sekolah <span className="text-red-500">*</span></FormLabel>
                      <label htmlFor="surat" className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${fileNames.surat ? "border-green-500 bg-green-50/30" : "border-slate-300 dark:border-slate-700 bg-slate-50 hover:bg-slate-100"}`}>
                        <div className="flex flex-col items-center justify-center text-center px-4">
                          {fileNames.surat ? (
                            <>
                              <FileCheck className="w-8 h-8 mb-1 text-green-600"/>
                              <p className="text-xs text-green-700 font-semibold break-all">{fileNames.surat}</p>
                            </>
                          ) : (
                            <>
                              <Upload className="w-5 h-5 mb-1 text-slate-400"/>
                              <p className="text-xs text-slate-500 font-semibold">Upload Surat Pengantar Resmi (PDF)</p>
                              <p className="text-[10px] text-slate-400 mt-1">Surat resmi ber-ttd dan cap basah instansi bray.</p>
                            </>
                          )}
                        </div>
                        <Input id="surat" type="file" accept=".pdf" className="hidden" onChange={(e) => handleFileChange(e, "surat")} />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <Button type="submit" size="lg" className="w-full bg-blue-700 hover:bg-blue-800 text-white" disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sedang Mengirim Berkas...</> : <><Send className="mr-2 h-4 w-4" /> Daftarkan Permohonan</>}
                  </Button>
                  <p className="text-xs text-center text-slate-500 mt-3">Dengan mengirim form ini, Anda menyatakan data yang diisi adalah benar, valid, dan dapat dipertanggungjawabkan.</p>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}