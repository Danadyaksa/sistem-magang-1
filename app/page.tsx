"use client";

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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SquarePen, FileText, CalendarCheck, ChevronDown, Menu, X, Loader2, Search, Filter, Square } from "lucide-react";
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

// TIPE DATA DARI DATABASE
type Position = {
  id: number;
  title: string;
  filled: number;
  quota: number;
};

// RESET SAAT SCROLL
function FadeInSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
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
      { threshold: 0.15 }
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
        const res = await fetch('/api/positions', { cache: 'no-store' });
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
  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, id: string) => {
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

  // LOGIC FILTERING & SORTING
  const filteredPositions = positions
    .filter((pos) => 
      pos.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
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

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 text-sm">
      
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
      `}</style>

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-sm border-slate-200">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link 
            href="/" 
            onClick={(e) => {
              e.preventDefault(); // Mencegah reload halaman
              window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll ke paling atas
            }}
          className="flex items-center gap-2 font-bold text-lg text-slate-800">
            <Image
              src="/logo-disdikpora.png"
              alt="Logo Disdikpora DIY"
              width={28}
              height={28}
              className="object-contain"
            />
            <span>Magang Disdikpora</span>
          </Link>
          
          <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
            {["tentang", "alur", "kuota", "faq"].map((item) => (
              <Link 
                key={item}
                href={`#${item}`} 
                onClick={(e) => handleScroll(e, item)}
                className="hover:text-blue-700 transition-colors capitalize"
              >
                {item}
              </Link>
            ))}
          </nav>

          <div className="hidden md:block">
            <Button asChild size="sm" className="bg-blue-700 hover:bg-blue-800 rounded-full px-6 shadow-sm">
              <Link href="/daftar">Daftar Sekarang</Link>
            </Button>
          </div>

          <button 
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-md"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white absolute w-full left-0 shadow-lg animate-in slide-in-from-top-5 duration-200">
            <div className="flex flex-col p-4 space-y-4 font-medium text-slate-600">
              {["tentang", "alur", "kuota", "faq"].map((item) => (
                <Link 
                  key={item}
                  href={`#${item}`} 
                  onClick={(e) => handleScroll(e, item)}
                  className="hover:text-blue-700 hover:bg-slate-50 p-2 rounded-md transition-colors capitalize"
                >
                  {item}
                </Link>
              ))}
              <Button asChild className="w-full bg-blue-700 hover:bg-blue-800 rounded-full">
                <Link href="/daftar">Daftar Sekarang</Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* HERO SECTION */}
        <section id="tentang" className="relative py-24 md:py-32 text-center container mx-auto px-4 overflow-hidden bg-slate-50 border-b border-slate-200">
          <div className="absolute inset-0 z-0 opacity-[0.8]" 
               style={{ 
                 backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', 
                 backgroundSize: '24px 24px' 
               }}>
          </div>
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-slate-50/50 to-slate-50"></div>

          <div className="relative z-10">
            <FadeInSection>
              <div className="space-y-6">
                <Badge variant="outline" className="px-4 py-1.5 text-xs font-medium border-blue-200 text-blue-700 bg-blue-50 mb-4 inline-flex">
                  <span className="flex h-2 w-2 rounded-full bg-blue-600 mr-2 animate-pulse"></span>
                  Pendaftaran Magang Periode 2026 Telah Dibuka
                </Badge>

                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-tight">
                  Sistem Informasi Magang <br />
                  <span className="text-blue-700">Dinas Dikpora DIY</span>
                </h1>
                
                <p className="text-base md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                  Bergabunglah dalam program magang Dinas Pendidikan, Pemuda, dan Olahraga Daerah Istimewa Yogyakarta. 
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8 w-full max-w-md mx-auto sm:max-w-none">
                  <Button size="lg" className="h-12 w-full sm:w-auto px-8 text-base rounded-full bg-blue-700 hover:bg-blue-800 shadow-lg hover:shadow-xl transition-all" asChild>
                    <Link href="/daftar">
                      Isi Formulir Pendaftaran
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="h-12 w-full sm:w-auto px-8 text-base rounded-full hover:bg-slate-100 bg-white" asChild>
                    <Link href="#alur" onClick={(e) => handleScroll(e, "alur")}>Pelajari Dulu</Link>
                  </Button>
                </div>
              </div>
            </FadeInSection>
            
            <div className="absolute top-125 left-1/2 -translate-x-1/2 animate-bounce text-slate-400">
              <ChevronDown className="h-6 w-6" />
            </div>
          </div>
        </section>

        {/* ALUR PENDAFTARAN */}
        <section id="alur" className="py-20 bg-white border-y border-slate-100 scroll-mt-20">
          <div className="container mx-auto px-4">
            <FadeInSection>
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-slate-800">
                Alur Pendaftaran
              </h2>
            </FadeInSection>

            <div className="grid md:grid-cols-3 gap-6">
              <FadeInSection delay={100}>
                <Card className="h-full hover:shadow-md transition-shadow border-slate-200">
                  <CardHeader>
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                      <FileText className="h-6 w-6 text-blue-700" />
                    </div>
                    <CardTitle className="text-lg">1. Siapkan Berkas</CardTitle>
                    <CardDescription className="text-sm">
                      Scan surat pengantar resmi dari sekolah/kampus dan proposal kegiatan magang dalam format PDF.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </FadeInSection>

              <FadeInSection delay={200}>
                <Card className="h-full hover:shadow-md transition-shadow border-slate-200">
                  <CardHeader>
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                      <SquarePen className="h-6 w-6 text-blue-700" />
                    </div>
                    <CardTitle className="text-lg">2. Isi Formulir</CardTitle>
                    <CardDescription className="text-sm">
                      Lengkapi data diri, durasi magang, dan upload berkas persyaratan melalui link Google Form yang tersedia.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </FadeInSection>

              <FadeInSection delay={300}>
                <Card className="h-full hover:shadow-md transition-shadow border-slate-200">
                  <CardHeader>
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                      <CalendarCheck className="h-6 w-6 text-blue-700" />
                    </div>
                    <CardTitle className="text-lg">3. Tunggu Konfirmasi</CardTitle>
                    <CardDescription className="text-sm">
                      Tim kami akan memverifikasi berkas Anda. Konfirmasi penerimaan akan dikirim melalui WhatsApp/Email.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </FadeInSection>
            </div>
          </div>
        </section>

        {/* KUOTA MAGANG (DYNAMIC & FILTERABLE) */}
        <section id="kuota" className="py-20 bg-slate-50 border-y border-slate-200 scroll-mt-20">
          <div className="container mx-auto px-4">
            <FadeInSection>
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
                  Kuota Magang
                </h2>
                <p className="text-slate-600 max-w-2xl mx-auto text-sm md:text-base">
                  Cek ketersediaan kuota magang di setiap divisi Dinas Pendidikan, Pemuda, dan Olahraga DIY update terbaru hari ini.
                </p>
              </div>
            </FadeInSection>

            {/* FILTER & SEARCH */}
            <div className="max-w-3xl mx-auto mb-6">
              <FadeInSection delay={50}>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="Cari nama bidang..." 
                      className="pl-9 bg-white" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full sm:w-[200px] bg-white border-slate-200 text-slate-700 shadow-sm">
                      <Filter className="w-4 h-4 mr-0 text-slate-500" />
                      <SelectValue placeholder="Urutkan" />
                    </SelectTrigger>
                    
                    <SelectContent className="bg-white border-slate-200 text-slate-900">
                      {/* Timpa hijau default */}
                      <SelectItem 
                        value="default" 
                        className="cursor-pointer focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 data-[state=checked]:text-slate-900"
                      >
                        Default
                      </SelectItem>
                      
                      <SelectItem 
                        value="quota-high" 
                        className="cursor-pointer focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 data-[state=checked]:text-slate-900"
                      >
                        Sisa Kuota Terbanyak
                      </SelectItem>
                      <SelectItem 
                        value="quota-low" 
                        className="cursor-pointer focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 data-[state=checked]:text-slate-900"
                      >
                        Sisa Kuota Sedikit
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </FadeInSection>
            </div>

            {/*GRID DATA*/}
            <div className="grid grid-cols-1 gap-4 max-w-3xl mx-auto">
              {isLoading ? (
                <div className="text-center py-10">
                  <div className="inline-flex items-center justify-center gap-2 text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Memuat data kuota...</span>
                  </div>
                </div>
              ) : filteredPositions.length > 0 ? (
                filteredPositions.map((pos, index) => {
                  const status = getStatus(pos.filled, pos.quota);
                  return (
                    <FadeInSection key={pos.id} delay={index * 50}>
                      <Card className={`w-full border border-slate-200 shadow-sm hover:border-slate-400 transition-colors bg-white ${pos.filled >= pos.quota ? 'opacity-70 bg-slate-50' : ''}`}>
                        <CardHeader className="py-2 px-3 sm:px-4">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div className="flex-1">
                              <CardTitle className="text-base md:text-lg font-bold text-slate-800">
                                {pos.title}
                              </CardTitle>
                            </div>
                            <Badge variant="secondary" 
                              className={`
                                border shrink-0 text-xs 
                                ${status === 'Dibuka' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                                ${status === 'Terbatas' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
                                ${status === 'Penuh' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                              `}
                            >
                              {status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-4 pt-0 px-3 sm:px-4">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm text-slate-600">
                              <span>Terisi: {pos.filled} orang</span>
                              <span className="font-medium">Kuota: {pos.quota}</span>
                            </div>
                            <Progress value={(pos.filled / pos.quota) * 100} className="h-2.5 bg-slate-100" />
                            <div className="text-[10px] text-slate-400 mt-1">
                               *Update Real-time
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </FadeInSection>
                  );
                })
              ) : (
                <div className="text-center py-10 text-slate-500 bg-white border border-slate-200 rounded-lg">
                  {searchTerm ? "Tidak ditemukan bidang dengan nama tersebut." : "Belum ada data posisi magang."}
                </div>
              )}
            </div>
            
          </div>
        </section>
        
        {/* FAQ SECTION */}
        <section id="faq" className="py-20 bg-white scroll-mt-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <FadeInSection>
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 text-slate-800">
                Pertanyaan Umum (FAQ)
              </h2>
            </FadeInSection>
            
            <FadeInSection delay={200}>
              <Card className="border-none shadow-sm bg-slate-50">
                <CardContent className="pt-6">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger className="text-base font-medium text-slate-700 text-left">
                        Berapa lama durasi minimal magang?
                      </AccordionTrigger>
                      <AccordionContent className="text-slate-600 text-sm">
                        Durasi magang menyesuaikan dengan kebijakan kampus/sekolah, namun umumnya minimal 1 bulan dan maksimal 6 bulan.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                      <AccordionTrigger className="text-base font-medium text-slate-700 text-left">
                        Apakah magang ini berbayar/digaji?
                      </AccordionTrigger>
                      <AccordionContent className="text-slate-600 text-sm">
                        Magang di Disdikpora DIY bersifat <strong>unpaid</strong> (tidak digaji). Program ini difokuskan untuk memberikan pengalaman kerja nyata.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                      <AccordionTrigger className="text-base font-medium text-slate-700 text-left">
                        Dokumen apa saja yang wajib diupload?
                      </AccordionTrigger>
                      <AccordionContent className="text-slate-600 text-sm">
                        Anda wajib menyertakan <strong>Surat Pengantar Resmi</strong> dari Sekolah/Kampus dan <strong>Proposal Kegiatan</strong>.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-4">
                      <AccordionTrigger className="text-base font-medium text-slate-700 text-left">
                        Kapan saya dapat kepastian diterima?
                      </AccordionTrigger>
                      <AccordionContent className="text-slate-600 text-sm">
                        Proses verifikasi berkas biasanya memakan waktu 3-7 hari kerja tergantung antrian pendaftar.
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
                  Dinas Pendidikan, Pemuda, dan Olahraga Daerah Istimewa Yogyakarta.
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
                  Jl. Cendana No.9, Semaki, Kec. Umbulharjo, Kota Yogyakarta, Daerah Istimewa Yogyakarta 55166
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
            <p>© {new Date().getFullYear()} Dinas Pendidikan, Pemuda, dan Olahraga Daerah Istimewa Yogyakarta.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}