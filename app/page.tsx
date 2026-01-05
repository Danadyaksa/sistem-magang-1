"use client"; // Wajib ada karena kita butuh mendeteksi scroll (animasi)

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, FileText, HelpCircle, GraduationCap, ChevronDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// --- KOMPONEN BANTUAN ANIMASI (Tanpa Library Tambahan) ---
function FadeInSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target); // Animasi cuma sekali saat pertama muncul
          }
        });
      },
      { threshold: 0.1 } // Muncul saat 10% elemen terlihat
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
      className={`transition-all duration-1000 ease-out transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const GOOGLE_FORM_URL = "https://forms.google.com/your-form-link";

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* --- NAVBAR --- */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-sm border-slate-200">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold text-xl text-slate-800">
            <Building2 className="h-6 w-6 text-blue-700" />
            <span>Magang Dikpora</span>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
            <Link href="#tentang" className="hover:text-blue-700 transition-colors">Tentang</Link>
            <Link href="#alur" className="hover:text-blue-700 transition-colors">Alur</Link>
            <Link href="#faq" className="hover:text-blue-700 transition-colors">FAQ</Link>
          </nav>
          <Button asChild className="bg-blue-700 hover:bg-blue-800 rounded-full px-6 shadow-sm">
            <Link href={GOOGLE_FORM_URL} target="_blank">Daftar Sekarang</Link>
          </Button>
        </div>
      </header>

      <main>
        {/* --- HERO SECTION (Clean Professional - No Blob) --- */}
        <section className="relative py-24 md:py-40 text-center container mx-auto px-4 overflow-hidden bg-slate-50 border-b border-slate-200">
          
          {/* Background decoration: DOT PATTERN (Ganti Blob biar tidak terlihat "AI") */}
          <div className="absolute inset-0 z-0 opacity-[0.8]" 
               style={{ 
                 backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', 
                 backgroundSize: '24px 24px' 
               }}>
          </div>
          {/* Overlay Gradient Halus */}
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-slate-50/50 to-slate-50"></div>

          <div className="relative z-10">
            <FadeInSection>
              <div className="space-y-6">
                <Badge variant="outline" className="px-4 py-1.5 text-sm font-medium border-blue-200 text-blue-700 bg-blue-50 mb-4">
                  <span className="flex h-2 w-2 rounded-full bg-blue-600 mr-2 animate-pulse"></span>
                  Pendaftaran Magang Periode 2026 Telah Dibuka
                </Badge>

                {/* FONT YANG DIGEDEIN DISINI */}
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-slate-900 leading-tight">
                  Sistem Informasi Magang <br />
                  <span className="text-blue-700">Dikpora DIY</span>
                </h1>
                
                <p className="text-lg md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                  Bergabunglah dalam program magang Dinas Pendidikan, Pemuda, dan Olahraga Daerah Istimewa Yogyakarta. 
                  Dapatkan pengalaman nyata dunia kerja sekarang juga.
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8">
                  <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-blue-700 hover:bg-blue-800 shadow-lg hover:shadow-xl transition-all" asChild>
                    <Link href={GOOGLE_FORM_URL} target="_blank">
                      Isi Formulir Pendaftaran
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full hover:bg-slate-100 bg-white" asChild>
                    <Link href="#faq">Pelajari Dulu</Link>
                  </Button>
                </div>
              </div>
            </FadeInSection>
            
            {/* Scroll Down Indicator */}
            <div className="absolute top-145 left-1/2 -translate-x-1/2 animate-bounce text-slate-400">
              <ChevronDown className="h-8 w-8" />
            </div>
          </div>
        </section>

        {/* --- PERSYARATAN / INFO (Alur) --- */}
        <section id="alur" className="py-24 bg-white border-y border-slate-100">
          <div className="container mx-auto px-4">
            <FadeInSection>
              <h2 className="text-3xl md:text-5xl font-bold text-center mb-16 text-slate-800">
                Alur Pendaftaran
              </h2>
            </FadeInSection>

            <div className="grid md:grid-cols-3 gap-8">
              <FadeInSection delay={100}>
                <Card className="h-full hover:shadow-md transition-shadow border-slate-200">
                  <CardHeader>
                    <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                      <FileText className="h-7 w-7 text-blue-700" />
                    </div>
                    <CardTitle className="text-xl">1. Siapkan Berkas</CardTitle>
                    <CardDescription className="text-base">
                      Scan surat pengantar resmi dari sekolah/kampus dan proposal kegiatan magang dalam format PDF.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </FadeInSection>

              <FadeInSection delay={200}>
                <Card className="h-full hover:shadow-md transition-shadow border-slate-200">
                  <CardHeader>
                    <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                      <GraduationCap className="h-7 w-7 text-blue-700" />
                    </div>
                    <CardTitle className="text-xl">2. Isi Formulir</CardTitle>
                    <CardDescription className="text-base">
                      Lengkapi data diri, durasi magang, dan upload berkas persyaratan melalui link Google Form yang tersedia.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </FadeInSection>

              <FadeInSection delay={300}>
                <Card className="h-full hover:shadow-md transition-shadow border-slate-200">
                  <CardHeader>
                    <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                      <HelpCircle className="h-7 w-7 text-blue-700" />
                    </div>
                    <CardTitle className="text-xl">3. Tunggu Konfirmasi</CardTitle>
                    <CardDescription className="text-base">
                      Tim kami akan memverifikasi berkas Anda. Konfirmasi penerimaan akan dikirim melalui WhatsApp/Email.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </FadeInSection>
            </div>
          </div>
        </section>

        {/* --- KUOTA POSISI MAGANG --- */}
        <section className="py-24 bg-slate-50 border-y border-slate-200">
          <div className="container mx-auto px-4">
            <FadeInSection>
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-5xl font-bold text-slate-800 mb-4">
                  Kuota Magang
                </h2>
                <p className="text-slate-600 max-w-2xl mx-auto">
                  Cek ketersediaan kuota magang di setiap divisi Dinas Pendidikan, Pemuda, dan Olahraga DIY update terbaru hari ini.
                </p>
              </div>
            </FadeInSection>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Kartu 1: Masih Luang */}
              <FadeInSection delay={100}>
                <Card className="bg-white hover:shadow-lg transition-all border-l-4 border-l-blue-600 shadow-sm">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl font-bold">Sub Bagian Umum</CardTitle>
                        <CardDescription>Administrasi & Persuratan</CardDescription>
                      </div>
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">
                        Dibuka
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>Terisi: 2 orang</span>
                        <span className="font-medium">Kuota: 5</span>
                      </div>
                      {/* Rumus value: (terisi / kuota) * 100 */}
                      <Progress value={(2/5)*100} className="h-3 bg-slate-100" /> 
                      <p className="text-xs text-slate-400 mt-2">
                        *Cocok untuk jurusan Administrasi Perkantoran / Manajemen
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </FadeInSection>

              {/* Kartu 2: Hampir Penuh */}
              <FadeInSection delay={200}>
                <Card className="bg-white hover:shadow-lg transition-all border-l-4 border-l-blue-600 shadow-sm">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl font-bold">Sub Bagian Perencanaan</CardTitle>
                        <CardDescription>Keuangan & Aset</CardDescription>
                      </div>
                      <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50">
                        Terbatas
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>Terisi: 3 orang</span>
                        <span className="font-medium">Kuota: 4</span>
                      </div>
                      <Progress value={(3/4)*100} className="h-3 bg-slate-100" />
                      <p className="text-xs text-slate-400 mt-2">
                        *Cocok untuk jurusan Akuntansi / Ekonomi
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </FadeInSection>

              {/* Kartu 3: Penuh */}
              <FadeInSection delay={300}>
                <Card className="bg-white opacity-80 border-l-4 border-l-blue-600 shadow-sm">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl font-bold text-slate-500">TIK / Data Center</CardTitle>
                        <CardDescription>Teknisi & Programmer</CardDescription>
                      </div>
                      <Badge variant="destructive">
                        Penuh
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>Terisi: 3 orang</span>
                        <span className="font-medium">Kuota: 3</span>
                      </div>
                      <Progress value={100} className="h-3 bg-slate-100" />
                      <p className="text-xs text-slate-400 mt-2">
                        *Pendaftaran ditutup sementara
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </FadeInSection>
            </div>
          </div>
        </section>
        
        {/* --- FAQ SECTION --- */}
        <section id="faq" className="py-24 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <FadeInSection>
              <h2 className="text-3xl md:text-5xl font-bold text-center mb-12 text-slate-800">
                Pertanyaan Umum (FAQ)
              </h2>
            </FadeInSection>
            
            <FadeInSection delay={200}>
              <Card className="border-none shadow-sm bg-slate-50">
                <CardContent className="pt-6">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger className="text-lg font-medium text-slate-700">
                        Berapa lama durasi minimal magang?
                      </AccordionTrigger>
                      <AccordionContent className="text-slate-600">
                        Durasi magang menyesuaikan dengan kebijakan kampus/sekolah, namun umumnya minimal 1 bulan dan maksimal 6 bulan. Pastikan jadwal tidak bentrok dengan hari libur nasional.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                      <AccordionTrigger className="text-lg font-medium text-slate-700">
                        Apakah magang ini berbayar/digaji?
                      </AccordionTrigger>
                      <AccordionContent className="text-slate-600">
                        Magang di Disdikpora DIY bersifat <strong>unpaid</strong> (tidak digaji). Program ini difokuskan untuk memberikan pengalaman kerja nyata, pemenuhan tugas akademik, dan sertifikat magang resmi dari dinas.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                      <AccordionTrigger className="text-lg font-medium text-slate-700">
                        Dokumen apa saja yang wajib diupload?
                      </AccordionTrigger>
                      <AccordionContent className="text-slate-600">
                        Anda wajib menyertakan <strong>Surat Pengantar Resmi</strong> dari Sekolah/Kampus (bertanda tangan & stempel) dan <strong>Proposal Kegiatan Magang</strong> (jika ada). Tanpa surat pengantar, pengajuan tidak akan diproses.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-4">
                      <AccordionTrigger className="text-lg font-medium text-slate-700">
                        Kapan saya dapat kepastian diterima?
                      </AccordionTrigger>
                      <AccordionContent className="text-slate-600">
                        Proses verifikasi berkas biasanya memakan waktu 3-7 hari kerja tergantung antrian pendaftar. Silakan cek email atau WhatsApp Anda secara berkala.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </FadeInSection>
          </div>
        </section>
      </main>

      {/* --- FOOTER --- */}
      {/* --- FOOTER (Versi Center) --- */}
      {/* --- FOOTER (Seimbang Kanan-Kiri) --- */}
      <footer className="py-12 bg-slate-900 text-slate-300 border-t border-slate-800 text-sm">
        <div className="container mx-auto px-4">
          
          {/* GUNAKAN FLEX JUSTIFY-BETWEEN */}
          {/* Mobile: Tumpuk (Col), Desktop: Sebar Kanan-Kiri (Row) */}
          <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8 mb-8">
            
            {/* KOLOM KIRI: Logo & Slogan */}
            {/* md:text-left artinya di layar besar rata kiri */}
            <div className="text-center md:text-left max-w-sm">
              <div className="flex items-center justify-center md:justify-start gap-2 font-bold text-white text-lg mb-4">
                <span>Disdikpora DIY</span>
              </div>
              <p className="leading-relaxed">
                Dinas Pendidikan, Pemuda, dan Olahraga Daerah Istimewa Yogyakarta.
              </p>
              
            </div>

            <div className="text-center md:text-right max-w-sm">
              <h4 className="font-bold text-white mb-4 text-base">Kontak Kami</h4>
              <div className="space-y-2">
                <p>Jl. Cendana No.9, Semaki, Kec. Umbulharjo, Kota Yogyakarta, Daerah Istimewa Yogyakarta 55166</p>
                <p>(0274) 513132</p>
                <p className="text-blue-400">disdikpora@jogjaprov.go.id</p>
              </div>
            </div>
            
          </div>

          <div className="border-t border-slate-800 pt-8 text-center text-slate-500">
            <p>© {new Date().getFullYear()} Dinas Pendidikan, Pemuda, dan Olahraga DIY.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}