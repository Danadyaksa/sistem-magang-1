"use client";

import { ModeToggle } from "@/components/mode-toggle";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  SquarePen,
  FileText,
  CalendarCheck,
  ChevronDown,
  Menu,
  X,
  Loader2,
  Search,
  Filter,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// TIPE DATA DARI DATABASE
type Position = {
  id: number;
  title: string;
  filled: number;
  quota: number;
};

// RESET SAAT SCROLL
function FadeInSection({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          } else {
            setIsVisible(false);
          }
        });
      },
      { threshold: 0.15 },
    );

    const { current } = domRef;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, []);

  return (
    <div
      ref={domRef}
      className={`transition-all duration-700 ease-out transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // STATE UNTUK FILTER & SORT
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("default");

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const res = await fetch("/api/positions", { cache: "no-store" });
        const data = await res.json();

        if (Array.isArray(data)) {
          setPositions(data);
        } else {
          console.error("API Error:", data);
          setPositions([]);
        }
      } catch (error) {
        console.error("Network Error:", error);
        setPositions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPositions();
  }, []);

  // FUNGSI SCROLL HALUS
  const handleScroll = (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
    id: string,
  ) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMobileMenuOpen(false);
    }
  };

  // Helper status badge
  const getStatus = (filled: number, quota: number) => {
    if (filled >= quota) return "Penuh";
    if (quota - filled <= 1) return "Terbatas";
    return "Dibuka";
  };

  // --- LOGIC GUA BALIKIN (HITUNG TOTAL KUOTA) ---
  const totalQuota = positions.reduce((acc, curr) => acc + curr.quota, 0);
  const totalFilled = positions.reduce((acc, curr) => acc + curr.filled, 0);
  const availableSlots = Math.max(0, totalQuota - totalFilled);

  // LOGIC FILTERING & SORTING
  const filteredPositions = positions
    .filter((pos) => pos.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const remainingA = a.quota - a.filled;
      const remainingB = b.quota - b.filled;

      switch (sortBy) {
        case "quota-high":
          return remainingB - remainingA;
        case "quota-low":
          return remainingA - remainingB;
        default:
          return 0;
      }
    });

  // --- KOMPONEN TOMBOL PILIHAN (DIALOG) ---
  const TombolDaftar = ({ mobile = false }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size={mobile ? "default" : "lg"}
          className={`${mobile ? "w-full" : "h-12 w-full sm:w-auto px-8"} text-base rounded-full bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all text-white`}
        >
          Daftar Sekarang
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            Pilih Layanan
          </DialogTitle>
          <DialogDescription className="text-center">
            Silakan pilih jenis pengajuan yang ingin Anda lakukan.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          {/* PILIHAN 1: MAGANG */}
          <Link href="/daftar" className="group">
            <div className="flex flex-col items-center justify-center p-6 border-2 border-slate-100 dark:border-slate-800 rounded-xl hover:border-blue-600 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all cursor-pointer h-full group-hover:shadow-md duration-300">
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                <GraduationCap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1 text-center">
                Magang / PKL
              </h3>
              <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                Mahasiswa & Siswa SMK
              </p>
            </div>
          </Link>

          {/* PILIHAN 2: PENELITIAN */}
          <Link href="/daftar-penelitian" className="group">
            <div className="flex flex-col items-center justify-center p-6 border-2 border-slate-100 dark:border-slate-800 rounded-xl hover:border-emerald-600 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all cursor-pointer h-full group-hover:shadow-md duration-300">
              <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                <Search className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1 text-center">
                Izin Penelitian
              </h3>
              <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                Skripsi, Tesis, & Riset
              </p>
            </div>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    // WRAPPER UTAMA
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 text-sm transition-colors duration-300">
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
      `}</style>

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center gap-2 font-bold text-lg text-slate-800 dark:text-slate-100"
          >
            <Image
              src="/logo-disdikpora.png"
              alt="Logo Disdikpora DIY"
              width={28}
              height={28}
              className="object-contain"
            />
            <span>Dinas DIKPORA</span>
          </Link>

          <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            {["tentang", "alur", "kuota", "faq"].map((item) => (
              <Link
                key={item}
                href={`#${item}`}
                onClick={(e) => handleScroll(e, item)}
                className="hover:text-blue-700 dark:hover:text-blue-400 transition-colors capitalize"
              >
                {item}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <ModeToggle />
            <div className="hidden md:block">
              <TombolDaftar mobile={false} />
            </div>
          </div>

          <div className="flex items-center gap-4 md:hidden">
            <ModeToggle />
            <button
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 absolute w-full left-0 shadow-lg animate-in slide-in-from-top-5 duration-200">
            <div className="flex flex-col p-4 space-y-4 font-medium text-slate-600 dark:text-slate-300">
              {["tentang", "alur", "kuota", "faq"].map((item) => (
                <Link
                  key={item}
                  href={`#${item}`}
                  onClick={(e) => handleScroll(e, item)}
                  className="hover:text-blue-700 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-900 p-2 rounded-md transition-colors capitalize"
                >
                  {item}
                </Link>
              ))}
              <TombolDaftar mobile={true} />
            </div>
          </div>
        )}
      </header>

      <main>
        {/* HERO SECTION */}
        <section
          id="tentang"
          className="relative py-24 md:py-32 text-center container mx-auto px-4 overflow-hidden bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300"
        >
          <div
            className="absolute inset-0 z-0 opacity-[0.8] dark:opacity-[0.2]"
            style={{
              backgroundImage: "radial-gradient(#94a3b8 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          ></div>
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-slate-50/50 to-slate-50 dark:via-slate-950/50 dark:to-slate-950"></div>

          <div className="relative z-10">
            <FadeInSection>
              <div className="space-y-6">
                {/* --- BAGIAN BADGE (GUA UPDATE PAKE LOGIC TOTAL KUOTA) --- */}
                <Badge
                  variant="outline"
                  className="px-4 py-1.5 text-xs font-medium border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 mb-4 inline-flex"
                >
                  <span className="flex h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 mr-2 animate-pulse"></span>
                  {isLoading
                    ? "Memuat Data Kuota..."
                    : `Tersedia ${availableSlots} dari Total ${totalQuota} Kuota Magang`}
                </Badge>

                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
                  Sistem Informasi Magang & Penelitian
                  <br />
                  <span className="text-blue-700 dark:text-blue-500">
                    Dinas Dikpora DIY
                  </span>
                  <p className="text-bold md:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
                  (SIMPEL DIKPORA DIY)
                </p>
                </h1>

                <p className="text-base md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
                  Layanan terintegrasi untuk pendaftaran Magang/PKL dan
                  pengajuan Izin Penelitian mahasiswa/dosen secara online.
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8 w-full max-w-md mx-auto sm:max-w-none">
                  <TombolDaftar mobile={false} />

                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 w-full sm:w-auto px-8 text-base rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 bg-white dark:bg-slate-950 dark:text-slate-200 dark:border-slate-700"
                    asChild
                  >
                    <Link href="#alur" onClick={(e) => handleScroll(e, "alur")}>
                      Lihat Prosedur
                    </Link>
                  </Button>
                </div>
              </div>
            </FadeInSection>

            <div className="absolute top-125 left-1/2 -translate-x-1/2 animate-bounce text-slate-400 dark:text-slate-600">
              <ChevronDown className="h-6 w-6" />
            </div>
          </div>
        </section>

        {/* ALUR PENDAFTARAN (DENGAN TABS DARI TEMEN LU) */}
        <section
          id="alur"
          className="py-20 bg-white dark:bg-slate-950 border-y border-slate-100 dark:border-slate-800 scroll-mt-20 transition-colors"
        >
          <div className="container mx-auto px-4">
            <FadeInSection>
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-slate-800 dark:text-slate-100">
                Alur & Prosedur
              </h2>
            </FadeInSection>

            <Tabs defaultValue="magang" className="max-w-4xl mx-auto">
              <div className="flex justify-center mb-8">
                <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 h-12 rounded-full">
                  <TabsTrigger
                    value="magang"
                    className="rounded-full px-6 text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm"
                  >
                    Magang / PKL
                  </TabsTrigger>
                  <TabsTrigger
                    value="penelitian"
                    className="rounded-full px-6 text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm"
                  >
                    Izin Penelitian
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* TAB CONTENT: MAGANG */}
              <TabsContent value="magang">
                <div className="grid md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-2 duration-300">
                  <Card className="h-full hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <CardHeader>
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4">
                        <FileText className="h-6 w-6 text-blue-700 dark:text-blue-400" />
                      </div>
                      <CardTitle className="text-lg dark:text-slate-100">
                        1. Siapkan Berkas
                      </CardTitle>
                      <CardDescription className="text-sm dark:text-slate-400">
                        Scan surat pengantar resmi dari sekolah/kampus dan
                        proposal kegiatan magang dalam format PDF.
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card className="h-full hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <CardHeader>
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4">
                        <SquarePen className="h-6 w-6 text-blue-700 dark:text-blue-400" />
                      </div>
                      <CardTitle className="text-lg dark:text-slate-100">
                        2. Isi Formulir
                      </CardTitle>
                      <CardDescription className="text-sm dark:text-slate-400">
                        Lengkapi data diri, durasi magang, dan upload berkas
                        persyaratan melalui website ini.
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card className="h-full hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <CardHeader>
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4">
                        <CalendarCheck className="h-6 w-6 text-blue-700 dark:text-blue-400" />
                      </div>
                      <CardTitle className="text-lg dark:text-slate-100">
                        3. Tunggu Konfirmasi
                      </CardTitle>
                      <CardDescription className="text-sm dark:text-slate-400">
                        Konfirmasi penerimaan akan dikirim melalui
                        WhatsApp/Email maksimal 3-7 hari kerja.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              </TabsContent>

              {/* TAB CONTENT: PENELITIAN (DARI TEMEN LU) */}
              <TabsContent value="penelitian">
                <div className="grid md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-2 duration-300">
                  <Card className="h-full hover:shadow-md transition-shadow border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10">
                    <CardHeader>
                      <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-4">
                        <FileText className="h-6 w-6 text-emerald-700 dark:text-emerald-400" />
                      </div>
                      <CardTitle className="text-lg dark:text-slate-100">
                        1. Surat Pengantar
                      </CardTitle>
                      <CardDescription className="text-sm dark:text-slate-400">
                        Wajib memiliki surat pengantar izin penelitian dari
                        Kampus/Instansi asal yang ditujukan ke Dinas.
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card className="h-full hover:shadow-md transition-shadow border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10">
                    <CardHeader>
                      <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-4">
                        <Search className="h-6 w-6 text-emerald-700 dark:text-emerald-400" />
                      </div>
                      <CardTitle className="text-lg dark:text-slate-100">
                        2. Ajukan Online
                      </CardTitle>
                      <CardDescription className="text-sm dark:text-slate-400">
                        Klik tombol "Daftar Sekarang", pilih Izin Penelitian,
                        dan isi detail judul serta subjek penelitian.
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card className="h-full hover:shadow-md transition-shadow border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10">
                    <CardHeader>
                      <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-4">
                        <BookOpen className="h-6 w-6 text-emerald-700 dark:text-emerald-400" />
                      </div>
                      <CardTitle className="text-lg dark:text-slate-100">
                        3. Ambil Surat Izin
                      </CardTitle>
                      <CardDescription className="text-sm dark:text-slate-400">
                        Jika disetujui, Anda akan diminta mengambil Surat
                        Keterangan Izin Penelitian fisik di kantor.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* KUOTA MAGANG */}
        <section
          id="kuota"
          className="py-20 bg-slate-50 dark:bg-slate-950 border-y border-slate-200 dark:border-slate-800 scroll-mt-20 transition-colors"
        >
          <div className="container mx-auto px-4">
            <FadeInSection>
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                  Kuota Magang
                </h2>
                <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-sm md:text-base">
                  Cek ketersediaan kuota magang di setiap divisi Dinas
                  Pendidikan, Pemuda, dan Olahraga DIY update terbaru hari ini.
                </p>
              </div>
            </FadeInSection>

            <div className="max-w-3xl mx-auto mb-6">
              <FadeInSection delay={50}>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Cari nama bidang..."
                      className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 dark:text-slate-100"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full sm:w-[200px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 shadow-sm">
                      <Filter className="w-4 h-4 mr-0 text-slate-500" />
                      <SelectValue placeholder="Urutkan" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="quota-high">
                        Sisa Kuota Terbanyak
                      </SelectItem>
                      <SelectItem value="quota-low">
                        Sisa Kuota Sedikit
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </FadeInSection>
            </div>

            <div className="grid grid-cols-1 gap-4 max-w-3xl mx-auto">
              {isLoading ? (
                <div className="text-center py-10">
                  <div className="inline-flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Memuat data kuota...</span>
                  </div>
                </div>
              ) : filteredPositions.length > 0 ? (
                filteredPositions.map((pos, index) => {
                  const status = getStatus(pos.filled, pos.quota);
                  return (
                    <FadeInSection key={pos.id} delay={index * 50}>
                      <Card
                        className={`w-full border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-400 dark:hover:border-slate-600 transition-colors bg-white dark:bg-slate-900 ${pos.filled >= pos.quota ? "opacity-70 bg-slate-50 dark:bg-slate-950" : ""}`}
                      >
                        <CardHeader className="py-2 px-3 sm:px-4">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div className="flex-1">
                              <CardTitle className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100">
                                {pos.title}
                              </CardTitle>
                            </div>
                            <Badge
                              variant="secondary"
                              className={`
                                border shrink-0 text-xs 
                                ${status === "Dibuka" ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800" : ""}
                                ${status === "Terbatas" ? "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800" : ""}
                                ${status === "Penuh" ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800" : ""}
                              `}
                            >
                              {status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-4 pt-0 px-3 sm:px-4">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                              <span>Terisi: {pos.filled} orang</span>
                              <span className="font-medium">
                                Kuota: {pos.quota}
                              </span>
                            </div>
                            <Progress
                              value={(pos.filled / pos.quota) * 100}
                              className="h-2.5 bg-slate-100 dark:bg-slate-800"
                            />
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                              *Update Real-time
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </FadeInSection>
                  );
                })
              ) : (
                <div className="text-center py-10 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                  {searchTerm
                    ? "Tidak ditemukan bidang dengan nama tersebut."
                    : "Belum ada data posisi magang."}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section
          id="faq"
          className="py-20 bg-white dark:bg-slate-950 scroll-mt-20 transition-colors"
        >
          <div className="container mx-auto px-4 max-w-3xl">
            <FadeInSection>
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 text-slate-800 dark:text-slate-100">
                Pertanyaan Umum (FAQ)
              </h2>
            </FadeInSection>

            <FadeInSection delay={200}>
              <Card className="border-none shadow-sm bg-slate-50 dark:bg-slate-900">
                <CardContent className="pt-6">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem
                      value="item-1"
                      className="border-b-slate-200 dark:border-b-slate-800"
                    >
                      <AccordionTrigger className="text-base font-medium text-slate-700 dark:text-slate-200 text-left">
                        Berapa lama durasi minimal magang?
                      </AccordionTrigger>
                      <AccordionContent className="text-slate-600 dark:text-slate-400 text-sm">
                        Minimal durasi magang di Dinas DIKPORA DIY adalah 44 hari kerja.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem
                      value="item-2"
                      className="border-b-slate-200 dark:border-b-slate-800"
                    >
                      <AccordionTrigger className="text-base font-medium text-slate-700 dark:text-slate-200 text-left">
                        Apakah magang ini berbayar/digaji?
                      </AccordionTrigger>
                      <AccordionContent className="text-slate-600 dark:text-slate-400 text-sm">
                        Magang di Disdikpora DIY bersifat{" "}
                        <strong>unpaid</strong> (tidak digaji). Program ini
                        difokuskan untuk memberikan pengalaman kerja nyata.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem
                      value="item-3"
                      className="border-b-slate-200 dark:border-b-slate-800"
                    >
                      <AccordionTrigger className="text-base font-medium text-slate-700 dark:text-slate-200 text-left">
                        Dokumen apa saja yang wajib diupload?
                      </AccordionTrigger>
                      <AccordionContent className="text-slate-600 dark:text-slate-400 text-sm">
                        Anda wajib menyertakan{" "}
                        <strong>Surat Pengantar Resmi</strong> dari
                        Sekolah/Kampus dan <strong>Proposal Kegiatan</strong>.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem
                      value="item-4"
                      className="border-b-slate-200 dark:border-b-slate-800"
                    >
                      <AccordionTrigger className="text-base font-medium text-slate-700 dark:text-slate-200 text-left">
                        Kapan saya dapat kepastian diterima?
                      </AccordionTrigger>
                      <AccordionContent className="text-slate-600 dark:text-slate-400 text-sm">
                        Proses verifikasi berkas biasanya memakan waktu 3-7 hari
                        kerja tergantung antrian pendaftar.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </FadeInSection>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="py-5 bg-slate-900 text-slate-300 border-t border-slate-800 text-xs md:text-sm">
        <div className="container mx-auto px-10">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8 mb-8">
            <div className="text-center md:text-left max-w-sm">
              <div className="flex items-center justify-center md:justify-start gap-2 font-bold text-white text-base mb-4">
                <span>Disdikpora DIY</span>
              </div>
              <div className="space-y-2 text-slate-400">
                <p>
                  Dinas Pendidikan, Pemuda, dan Olahraga Daerah Istimewa
                  Yogyakarta.
                </p>
                <a
                  href="https://dikpora.jogjaprov.go.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  dikpora.jogjaprov.go.id
                </a>
              </div>
            </div>

            <div className="text-center md:text-right max-w-sm">
              <h4 className="font-bold text-white mb-4 text-sm">Kontak Kami</h4>
              <div className="space-y-2 text-slate-400">
                <a
                  href="https://maps.app.goo.gl/N6XssWVfCqDph8uk9"
                  target="_blank"

                  
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 hover:underline block"
                >
                  Jl. Cendana No.9, Semaki, Kec. Umbulharjo, Kota Yogyakarta,
                  Daerah Istimewa Yogyakarta 55166
                </a>

                <p>(0274) 513132</p>
                <a
                  href="mailto:disdikpora@jogjaprov.go.id"
                  className="text-blue-400 hover:underline"
                >
                  disdikpora@jogjaprov.go.id
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 text-center text-slate-500">
            <p>
              © {new Date().getFullYear()} Dinas Pendidikan, Pemuda, dan
              Olahraga Daerah Istimewa Yogyakarta.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}