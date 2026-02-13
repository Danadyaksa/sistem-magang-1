"use client";

import Image from "next/image";
import { ModeToggle } from "@/components/mode-toggle";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  LayoutDashboard, Users, LogOut, Menu, X, Search, Eye, CheckCircle,
  XCircle, Clock, User, FileText, RefreshCcw, Image as ImageIcon,
  Loader2, Settings, AlertTriangle, PanelLeftClose, PanelLeftOpen,
  ChevronLeft, ChevronRight, Filter, Download, ArrowUpDown,
  ArrowUp, ArrowDown, CalendarClock, MessageCircle, Mail,
  BookOpen, MoreHorizontal, ThumbsUp, MapPin
} from "lucide-react";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip, TooltipProvider, TooltipTrigger, TooltipContent,
} from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- TIPE DATA ---
type Pendaftaran = {
  id: string;
  namaLengkap: string;
  nomorHp: string;
  email: string;
  instansi: string;
  jurusan: string;
  nomorInduk: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "RECOMMENDED";
  cvPath: string;
  suratPath: string;
  fotoPath: string;
  positionId: number | null;
  createdAt: string;
};

type Position = {
  id: number;
  title: string;
  quota: number;
  filled: number;
};

// Tipe UPT sesuai Schema baru (ada address)
type Upt = {
  id: number;
  name: string;
  address?: string;
};

// CONSTANT BULAN
const MONTHS = [
  { value: "0", label: "Januari" }, { value: "1", label: "Februari" },
  { value: "2", label: "Maret" }, { value: "3", label: "April" },
  { value: "4", label: "Mei" }, { value: "5", label: "Juni" },
  { value: "6", label: "Juli" }, { value: "7", label: "Agustus" },
  { value: "8", label: "September" }, { value: "9", label: "Oktober" },
  { value: "10", label: "November" }, { value: "11", label: "Desember" },
];

export default function ApplicantsPage() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [pendaftar, setPendaftar] = useState<Pendaftaran[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [upts, setUpts] = useState<Upt[]>([]); // State buat nampung UPT dari DB
  const [loading, setLoading] = useState(true);

  // --- STATE FILTER, SORT & PAGINATION ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc"; } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // State Lainnya
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [admin, setAdmin] = useState({ username: "...", jabatan: "..." });
  const [selectedPelamar, setSelectedPelamar] = useState<Pendaftaran | null>(null);
  
  // State Form Keputusan
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // State Dropdown Dinamis
  const [actionStatus, setActionStatus] = useState<string>(""); 
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [selectedUpt, setSelectedUpt] = useState<string>(""); 

  // --- 1. CEK LOCAL STORAGE ---
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState === "true") setIsSidebarCollapsed(true);
  }, []);

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", String(newState));
  };

  // --- 2. FETCH DATA (UPDATED: Include UPT) ---
  const fetchData = async () => {
    try {
      const [resPendaftar, resPositions, resUpt] = await Promise.all([
        fetch("/api/pendaftaran", { cache: "no-store" }),
        fetch("/api/positions", { cache: "no-store" }),
        fetch("/api/upt", { cache: "no-store" }), // Fetch UPT dari API
      ]);

      const dataPendaftar = await resPendaftar.json();
      const dataPositions = await resPositions.json();
      const dataUpt = await resUpt.json();

      if (Array.isArray(dataPendaftar)) setPendaftar(dataPendaftar);
      if (Array.isArray(dataPositions)) setPositions(dataPositions);
      if (Array.isArray(dataUpt)) setUpts(dataUpt); // Set state UPT
    } catch (error) {
      console.error("Gagal ambil data:", error);
      toast.error("Gagal mengambil data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (res.ok) {
        setAdmin({
          username: data.username,
          jabatan: data.jabatan || "Administrator",
        });
      } else {
        router.push("/admin/login");
      }
    } catch (error) {
      console.error("Auth error:", error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchAdminSession();
  }, []);

  // --- HELPER DATE INDONESIA ---
  const formatDateIndo = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric",
    });
  };

  const getPositionName = (id: number | null) => {
    if (!id) return "-";
    return positions.find((p) => p.id === id)?.title || "Posisi Tidak Ditemukan";
  };

  // --- 3. NOTIFICATION LOGIC (Dynamic Address) ---
  const openWhatsApp = (p: Pendaftaran, overrideUpt?: string) => {
    if (!p.nomorHp) return toast.error("Nomor HP tidak tersedia");

    let hp = p.nomorHp.replace(/\D/g, "");
    if (hp.startsWith("0")) hp = "62" + hp.slice(1);

    const tglMulai = formatDateIndo(p.tanggalMulai);
    const tglSelesai = formatDateIndo(p.tanggalSelesai);
    let message = "";

    if (p.status === "ACCEPTED") {
      const posName = getPositionName(p.positionId);
      message = 
`Halo *${p.namaLengkap}*,

Selamat! Anda *DITERIMA* magang di Dinas DIKPORA DIY.

*Detail Penerimaan:*
Nama: ${p.namaLengkap}
Asal: ${p.instansi}
Bidang: ${posName}
Tanggal Magang: ${tglMulai} s.d. ${tglSelesai}

Mohon balas pesan ini untuk konfirmasi kesediaannya. Terima kasih.`;

    } else if (p.status === "REJECTED") {
      message = 
`Halo *${p.namaLengkap}*,

Terima kasih sudah mendaftar magang di Dinas DIKPORA DIY (Asal: ${p.instansi}).

Mohon maaf, berdasarkan hasil seleksi berkas, saat ini kami belum bisa menerima permohonan magang Anda di Dinas DIKPORA DIY. Tetap semangat dan sukses selalu untuk studinya!`;

    } else if (p.status === "RECOMMENDED") {
      const targetUptName = overrideUpt || selectedUpt;

      if (!targetUptName) {
        toast.warning("Mohon pilih UPT terlebih dahulu di dropdown sebelum kirim WA.");
        return; 
      }

      // FIND ADDRESS DARI STATE UPT
      const uptDetail = upts.find(u => u.name === targetUptName);
      const alamatUpt = uptDetail?.address || "Alamat belum tersedia (Hubungi Admin)";

      message = 
`Halo, *${p.namaLengkap}*

Menindaklanjuti permohonan magang Anda di Dinas DIKPORA DIY, dengan ini kami informasikan hasil verifikasi berkas:

*Data Pelamar:*
Nama: ${p.namaLengkap}
NIM/NIS: ${p.nomorInduk || "-"}
Jurusan: ${p.jurusan}
Asal Sekolah/Kampus: ${p.instansi}

Berdasarkan ketersediaan kuota di kantor induk, kami *MEREKOMENDASIKAN* Anda untuk melaksanakan magang di Unit Pelaksana Teknis (UPT) kami:

*Unit Tujuan: ${targetUptName}*
Alamat: ${alamatUpt}

Silakan datang atau menghubungi pihak UPT terkait dengan membawa surat pengantar ini untuk proses administrasi lebih lanjut.

Terima kasih.`;
    }

    const url = `https://wa.me/${hp}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const openEmail = (p: Pendaftaran, overrideUpt?: string) => {
    if (!p.email) return toast.error("Email tidak tersedia");

    let subject = "";
    let body = "";

    const tglMulai = formatDateIndo(p.tanggalMulai);
    const tglSelesai = formatDateIndo(p.tanggalSelesai);

    if (p.status === "ACCEPTED") {
        const posName = getPositionName(p.positionId);
        subject = "SELAMAT! Anda Diterima Magang - Dinas DIKPORA DIY";
        body = 
`Halo ${p.namaLengkap},

Selamat! Anda DITERIMA magang di Dinas DIKPORA DIY.

Detail Penerimaan:
Nama: ${p.namaLengkap}
Asal: ${p.instansi}
Bidang: ${posName}
Tanggal Magang: ${tglMulai} s.d. ${tglSelesai}

Silakan balas email ini untuk konfirmasi.`;

    } else if (p.status === "REJECTED") {
      subject = "Update Status Pendaftaran Magang - Dinas DIKPORA DIY";
      body = 
`Halo ${p.namaLengkap},

Terima kasih telah mendaftar di Dinas DIKPORA DIY.

Mohon maaf, lamaran magang Anda belum dapat kami terima di periode ini karena keterbatasan kuota/ketidaksesuaian kualifikasi.

Terima kasih.`;

    } else if (p.status === "RECOMMENDED") {
      const targetUptName = overrideUpt || selectedUpt;
      if (!targetUptName) {
        toast.warning("Pilih UPT terlebih dahulu sebelum kirim Email.");
        return;
      }

      // FIND ADDRESS DARI STATE UPT
      const uptDetail = upts.find(u => u.name === targetUptName);
      const alamatUpt = uptDetail?.address || "Alamat belum tersedia (Hubungi Admin)";

      subject = "Rekomendasi Penempatan Magang - Dinas DIKPORA DIY";
      body = 
`Halo ${p.namaLengkap},

Menindaklanjuti permohonan magang Anda, kami informasikan status pendaftaran Anda:

Data Pelamar:
Nama: ${p.namaLengkap}
NIM/NIS: ${p.nomorInduk || "-"}
Jurusan: ${p.jurusan}
Asal: ${p.instansi}

Status: DIREKOMENDASIKAN (PINDAH LOKASI)

Kami merekomendasikan Anda untuk melanjutkan proses magang di Unit Pelaksana Teknis (UPT) kami berikut ini:

Nama UPT : ${targetUptName}
Alamat   : ${alamatUpt}

Silakan berkoordinasi langsung dengan pihak UPT terkait menggunakan surat rekomendasi ini.

Terima kasih,
Admin Dinas DIKPORA DIY`;
    }

    const url = `mailto:${p.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, "_blank");
  };

  // --- LOGIC FILTERING & SORTING ---
  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const availableYears = useMemo(() => {
    const years = new Set(pendaftar.map((p) => new Date(p.createdAt).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [pendaftar]);

  const filteredData = useMemo(() => {
    let data = pendaftar.filter((item) => {
      const date = new Date(item.createdAt);
      const matchesSearch = item.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) || item.instansi.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesYear = filterYear === "all" || date.getFullYear().toString() === filterYear;
      const matchesMonth = filterMonth === "all" || date.getMonth().toString() === filterMonth;
      return matchesSearch && matchesYear && matchesMonth;
    });

    if (sortConfig !== null) {
      data.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof Pendaftaran];
        let bValue: any = b[sortConfig.key as keyof Pendaftaran];
        if (sortConfig.key === "createdAt") {
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
        } else if (typeof aValue === "string") {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [pendaftar, searchTerm, filterYear, filterMonth, sortConfig]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterYear, filterMonth, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // --- ACTION HANDLERS ---
  const handleLogoutConfirm = async () => {
    setIsLogoutOpen(false);
    const promise = fetch("/api/auth/logout", { method: "POST" });
    toast.promise(promise, {
      loading: "Sedang keluar...",
      success: () => {
        router.push("/admin/login");
        return "Berhasil logout";
      },
      error: "Gagal logout",
    });
  };

  // --- LOGIC PROSES KEPUTUSAN ---
  const handleProcess = async () => {
    if (!selectedPelamar || !actionStatus) {
      toast.warning("Pilih status keputusan terlebih dahulu!");
      return;
    }

    if (actionStatus === "ACCEPTED" && !selectedPosition) {
      toast.warning("Wajib pilih posisi/bidang penempatan!");
      return;
    }
    
    // Validasi UPT
    if (actionStatus === "RECOMMENDED" && !selectedUpt) {
      toast.warning("Wajib pilih UPT tujuan untuk rekomendasi!");
      return;
    }

    try {
      setIsProcessing(true);
      
      const payload = {
        status: actionStatus,
        positionId: actionStatus === "ACCEPTED" ? parseInt(selectedPosition) : null,
      };

      const res = await fetch(`/api/pendaftaran/${selectedPelamar.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        fetchData(); 
        
        let msg = "Status berhasil diperbarui.";
        if (actionStatus === "ACCEPTED") msg = "Sukses! Pelamar DITERIMA.";
        if (actionStatus === "REJECTED") msg = "Sukses! Pelamar DITOLAK.";
        if (actionStatus === "RECOMMENDED") msg = `Sukses! Pelamar DIREKOMENDASIKAN ke ${selectedUpt}.`;
        
        toast.success(msg);
      } else {
        toast.error("Gagal update status.");
      }
    } catch (error) {
      toast.error("Server error, coba lagi nanti.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin hapus data ini? File fisik juga akan dihapus.")) return;
    try {
        const res = await fetch(`/api/pendaftaran/${id}`, { method: "DELETE" });
        if(res.ok){
            toast.success("Data berhasil dihapus");
            fetchData(); 
        } else {
            toast.error("Gagal menghapus");
        }
    } catch (err) {
        toast.error("Terjadi kesalahan server");
    }
  };

  // --- EXPORT EXCEL (Masih aman pake logic lama) ---
  const handleExportExcel = async () => {
    if (filteredData.length === 0) {
      toast.warning("Tidak ada data untuk diexport.");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data Pelamar");

    let titleText = "LAPORAN PENDAFTAR MAGANG - DINAS DIKPORA DIY";
    if (filterMonth !== "all" && filterYear !== "all") {
        const monthName = MONTHS.find(m => m.value === filterMonth)?.label;
        titleText += ` (PERIODE: ${monthName?.toUpperCase()} ${filterYear})`;
    } else if (filterYear !== "all") {
        titleText += ` (TAHUN: ${filterYear})`;
    } else if (filterMonth !== "all") {
        const monthName = MONTHS.find(m => m.value === filterMonth)?.label;
        titleText += ` (BULAN: ${monthName?.toUpperCase()})`;
    } else {
        titleText += " (SEMUA DATA)";
    }

    worksheet.mergeCells('A1:J1');
    const titleRow = worksheet.getCell('A1');
    titleRow.value = titleText;
    titleRow.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
    titleRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1e3a8a' }
    };
    worksheet.getRow(1).height = 40;

    const headerRow = worksheet.getRow(3);
    headerRow.values = [
      "No", "Nama Lengkap", "Instansi", "Jurusan", "Nomor HP", 
      "Tgl Daftar", "Mulai Magang", "Selesai Magang", "Status", "Penempatan"
    ];
    headerRow.font = { bold: true, color: { argb: "FF000000" }, size: 11 };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFbfdbfe" } };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 25;
    
    worksheet.getColumn(1).width = 5;
    worksheet.getColumn(2).width = 30;
    worksheet.getColumn(3).width = 25;
    worksheet.getColumn(4).width = 25;
    worksheet.getColumn(5).width = 18;
    worksheet.getColumn(6).width = 15;
    worksheet.getColumn(7).width = 15;
    worksheet.getColumn(8).width = 15;
    worksheet.getColumn(9).width = 15;
    worksheet.getColumn(10).width = 25;

    filteredData.forEach((item, index) => {
      const posisi = positions.find((p) => p.id === item.positionId)?.title || "-";
      let statusLabel = "PENDING";
      if (item.status === "ACCEPTED") statusLabel = "DITERIMA";
      if (item.status === "REJECTED") statusLabel = "DITOLAK";
      if (item.status === "RECOMMENDED") statusLabel = "DIREKOMENDASIKAN";

      const row = worksheet.addRow([
        index + 1, item.namaLengkap, item.instansi, item.jurusan, item.nomorHp || "-",
        new Date(item.createdAt).toLocaleDateString("id-ID"),
        new Date(item.tanggalMulai).toLocaleDateString("id-ID"),
        new Date(item.tanggalSelesai).toLocaleDateString("id-ID"),
        statusLabel, posisi,
      ]);
      row.eachCell((cell) => {
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      });
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(6).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(7).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(8).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(9).alignment = { vertical: 'middle', horizontal: 'center' };
    });

    let fileName = "Rekap_Magang";
    if (filterMonth !== "all" && filterYear !== "all") {
        const monthName = MONTHS.find(m => m.value === filterMonth)?.label;
        fileName += `_${monthName}_${filterYear}`;
    } else if (filterYear !== "all") {
        fileName += `_Tahun_${filterYear}`;
    } else {
        fileName += `_All_Data`;
    }
    fileName += ".xlsx";

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, fileName);
    toast.success("Data berhasil diexport!");
  };

  const SidebarItem = ({ icon: Icon, label, active = false, onClick, className = "" }: any) => (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button variant="ghost" onClick={onClick} className={`w-full flex items-center transition-all duration-200 ${isSidebarCollapsed ? "justify-center px-2" : "justify-start px-4"} ${active ? "bg-slate-800 text-white shadow-md shadow-slate-900/20" : "text-slate-300 hover:text-white hover:bg-slate-800"} ${className}`}>
            <Icon className={`h-5 w-5 ${isSidebarCollapsed ? "" : "mr-3"}`} />
            {!isSidebarCollapsed && <span>{label}</span>}
          </Button>
        </TooltipTrigger>
        {isSidebarCollapsed && (
          <TooltipContent side="right" className="bg-slate-800 text-white border-slate-700 ml-2">
            {label}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className="h-screen w-full bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300 overflow-hidden">
      {/* SIDEBAR SAMA */}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-slate-900 text-white shadow-xl flex flex-col h-full transition-all duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 ${isSidebarCollapsed ? "w-20" : "w-64"}`}>
        <div className={`h-16 flex items-center border-b border-slate-800 flex-none ${isSidebarCollapsed ? "justify-center px-0" : "px-6 gap-3"}`}>
          <div className="flex items-center justify-center">
            <Image src="/logo-disdikpora.png" alt="Logo Disdikpora" width={isSidebarCollapsed ? 28 : 32} height={isSidebarCollapsed ? 28 : 32} className="object-contain transition-all duration-300" />
          </div>
          {!isSidebarCollapsed && <h1 className="font-bold text-xl tracking-wider truncate animate-in fade-in duration-300">Dinas DIKPORA</h1>}
          <button className="ml-auto md:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="p-3 space-y-2 flex-1 overflow-y-auto overflow-x-hidden">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" onClick={() => router.push("/admin/dashboard")} />
          <SidebarItem icon={FileText} label="Applicants" active={true} />
          <SidebarItem icon={CalendarClock} label="Daftar PKL" onClick={() => router.push("/admin/pkl")} />
          <SidebarItem icon={BookOpen} label="Penelitian" onClick={() => router.push("/admin/penelitian")} />
          <SidebarItem icon={Users} label="Admin Users" onClick={() => router.push("/admin/users")} />
          <SidebarItem icon={Settings} label="Settings" onClick={() => router.push("/admin/pengaturan")} />
          <div className={`pt-4 mt-4 border-t border-slate-800 ${isSidebarCollapsed ? "mx-2" : ""}`}>
            <SidebarItem icon={LogOut} label="Keluar" className="text-red-400 hover:text-red-300 hover:bg-red-900/20" onClick={() => setIsLogoutOpen(true)} />
          </div>
        </nav>
      </aside>

      {/* CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="bg-white dark:bg-slate-950 border-b dark:border-slate-800 h-16 flex items-center px-4 md:px-8 justify-between shadow-sm transition-colors duration-300 flex-none z-40">
           {/* HEADER SAMA */}
           <div className="flex items-center gap-4">
            <button className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-6 w-6 text-slate-600 dark:text-slate-200" />
            </button>
            <button className="hidden md:flex p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors" onClick={toggleSidebar} title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}>
              {isSidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Review Pelamar</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{admin.username}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{admin.jabatan}</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800">
              <User className="h-6 w-6" />
            </div>
            <ModeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Data Pelamar Masuk</h1>
              <p className="text-slate-500 dark:text-slate-400">Cek berkas dan tentukan siapa yang layak magang.</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleExportExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Download className="h-4 w-4 mr-2" /> Export Excel
              </Button>
              <Button onClick={() => { setLoading(true); fetchData(); }} className="bg-blue-700 hover:bg-blue-800 text-white">
                <RefreshCcw className="h-4 w-4 mr-2" /> Refresh Data
              </Button>
            </div>
          </div>

          <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden transition-colors flex flex-col h-full max-h-[calc(100vh-14rem)]">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 py-4 space-y-4">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input placeholder="Cari nama / instansi..." className="pl-9 bg-white dark:bg-slate-950" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                  <Select value={filterMonth} onValueChange={setFilterMonth}>
                    <SelectTrigger className="w-[130px] bg-white dark:bg-slate-950">
                        <SelectValue placeholder="Bulan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Bulan</SelectItem>
                      {MONTHS.map((m) => (<SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <Select value={filterYear} onValueChange={setFilterYear}>
                    <SelectTrigger className="w-[130px] bg-white dark:bg-slate-950">
                        <SelectValue placeholder="Tahun" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Tahun</SelectItem>
                      {availableYears.map((year) => (<SelectItem key={year} value={year.toString()}>{year}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0 overflow-auto flex-1">
              <Table>
                <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-800 z-10">
                  <TableRow className="border-b border-slate-200 dark:border-slate-700">
                    <TableHead className="w-[50px] text-center h-10">No</TableHead>
                    <TableHead className="h-10 cursor-pointer group" onClick={() => requestSort("namaLengkap")}>
                        <div className="flex items-center gap-2">Nama Pelamar <ArrowUpDown className="h-3 w-3" /></div>
                    </TableHead>
                    <TableHead className="h-10 cursor-pointer group" onClick={() => requestSort("instansi")}>
                        <div className="flex items-center gap-2">Instansi <ArrowUpDown className="h-3 w-3" /></div>
                    </TableHead>
                    <TableHead className="h-10 cursor-pointer group" onClick={() => requestSort("createdAt")}>
                        <div className="flex items-center gap-2">Tgl Daftar <ArrowUpDown className="h-3 w-3" /></div>
                    </TableHead>
                    <TableHead className="h-10 cursor-pointer group" onClick={() => requestSort("status")}>
                        <div className="flex items-center gap-2">Status <ArrowUpDown className="h-3 w-3" /></div>
                    </TableHead>
                    <TableHead className="text-right pr-6 h-10">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="h-24 text-center text-slate-500"><Loader2 className="animate-spin h-4 w-4 inline mr-2" /> Memuat data...</TableCell></TableRow>
                  ) : currentData.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="h-32 text-center text-slate-500"><div className="flex flex-col items-center gap-2"><FileText className="h-8 w-8 text-slate-300" /><p>Data tidak ditemukan.</p></div></TableCell></TableRow>
                  ) : (
                    currentData.map((item, idx) => (
                      <TableRow key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                        <TableCell className="text-center text-slate-500 py-3">{startIndex + idx + 1}</TableCell>
                        <TableCell className="font-medium py-3">
                          <div className="flex flex-col">
                            <span className="text-slate-900 dark:text-slate-100 text-sm">{item.namaLengkap}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px]">{item.jurusan}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-300 text-sm py-3">{item.instansi}</TableCell>
                        <TableCell className="text-slate-500 text-sm py-3">{new Date(item.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</TableCell>
                        <TableCell className="py-3">
                          {item.status === "PENDING" && <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Pending</Badge>}
                          {item.status === "ACCEPTED" && <Badge className="bg-green-100 text-green-700">Diterima</Badge>}
                          {item.status === "REJECTED" && <Badge variant="outline" className="bg-red-50 text-red-700">Ditolak</Badge>}
                          {item.status === "RECOMMENDED" && <Badge variant="outline" className="bg-blue-50 text-blue-700">Direkomendasikan</Badge>}
                        </TableCell>
                        <TableCell className="text-right pr-4 py-3">
                          <Dialog
                            open={isDialogOpen && selectedPelamar?.id === item.id}
                            onOpenChange={(open) => {
                              setIsDialogOpen(open);
                              if (open) {
                                setSelectedPelamar(item);
                                setActionStatus(""); 
                                setSelectedPosition("");
                                setSelectedUpt(""); 

                                if (item.status === "ACCEPTED" && item.positionId) {
                                   setActionStatus("ACCEPTED");
                                   setSelectedPosition(item.positionId.toString());
                                } else if (item.status === "RECOMMENDED") {
                                   setActionStatus("RECOMMENDED");
                                } else if (item.status === "REJECTED") {
                                   setActionStatus("REJECTED");
                                }
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-50 text-slate-400 hover:text-blue-600">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl bg-white dark:bg-slate-950 p-0 overflow-hidden">
                              <DialogHeader className="p-6 pb-2">
                                <DialogTitle>Detail Pendaftaran</DialogTitle>
                                <DialogDescription>Tinjau kelengkapan berkas kandidat.</DialogDescription>
                              </DialogHeader>
                              
                              <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* ... Data Diri Sama ... */}
                                <div className="space-y-4">
                                  <div className="space-y-1">
                                    <Label className="text-xs text-slate-500 uppercase font-semibold">Nama Lengkap</Label>
                                    <div className="font-medium border-b pb-1">{item.namaLengkap}</div>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs text-slate-500 uppercase font-semibold">Asal Instansi</Label>
                                    <div className="text-sm">{item.instansi}</div>
                                    <div className="text-slate-500 text-xs">{item.jurusan}</div>
                                  </div>
                                  <div className="space-y-1">
                                      <Label className="text-xs text-slate-500 uppercase font-semibold">Rencana Magang</Label>
                                      <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                        <Clock className="h-3 w-3 text-blue-500" />
                                        {new Date(item.tanggalMulai).toLocaleDateString()} — {new Date(item.tanggalSelesai).toLocaleDateString()}
                                      </div>
                                  </div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-100 dark:border-slate-800 space-y-3">
                                  <Label className="text-xs text-slate-500 uppercase font-semibold block mb-2">Lampiran</Label>
                                  <Button variant="outline" size="sm" className="w-full justify-start text-slate-600" asChild>
                                    <a href={`/uploads/${item.cvPath}`} target="_blank"><FileText className="mr-2 h-4 w-4 text-blue-600" /> Lihat CV</a>
                                  </Button>
                                  <Button variant="outline" size="sm" className="w-full justify-start text-slate-600" asChild>
                                    <a href={`/uploads/${item.suratPath}`} target="_blank"><FileText className="mr-2 h-4 w-4 text-orange-600" /> Surat Pengantar</a>
                                  </Button>
                                </div>
                              </div>
                              <Separator />
                              
                              {/* --- FORM KEPUTUSAN --- */}
                              <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100">
                                <div className="mb-4 flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-blue-600" />
                                  <span className="text-sm font-semibold">Keputusan Admin</span>
                                </div>

                                <div className="grid gap-4">
                                  {/* DROPDOWN STATUS UTAMA */}
                                  <div className="space-y-1.5">
                                    <Label className="text-xs text-slate-500">Status Keputusan</Label>
                                    <Select 
                                      value={actionStatus} 
                                      onValueChange={(val) => {
                                          setActionStatus(val);
                                          if (val !== "ACCEPTED") setSelectedPosition("");
                                          // Note: UPT pilih ulang
                                      }}
                                    >
                                      <SelectTrigger className="bg-white dark:bg-slate-950"><SelectValue placeholder="-- Tentukan Status --" /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="ACCEPTED">Diterima (Masuk Bidang)</SelectItem>
                                        <SelectItem value="RECOMMENDED">Direkomendasikan (Pindah UPT)</SelectItem>
                                        <SelectItem value="REJECTED">Ditolak</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {/* DROPDOWN ACCEPTED */}
                                  {actionStatus === "ACCEPTED" && (
                                    <div className="space-y-1.5 animate-in slide-in-from-top-2">
                                      <Label className="text-xs text-slate-500">Penempatan Bidang <span className="text-red-500">*</span></Label>
                                      <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                                        <SelectTrigger className="bg-white dark:bg-slate-950 border-blue-200"><SelectValue placeholder="Pilih Posisi Magang" /></SelectTrigger>
                                        <SelectContent>
                                          {positions.map((pos) => (
                                            <SelectItem key={pos.id} value={pos.id.toString()}>{pos.title} <span className="text-slate-400 text-xs ml-2">(Sisa: {pos.quota - pos.filled})</span></SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  )}

                                  {/* DROPDOWN RECOMMENDED (FETCH FROM DB NOW) */}
                                  {(actionStatus === "RECOMMENDED") && (
                                    <div className="space-y-1.5 animate-in slide-in-from-top-2">
                                      <Label className="text-xs text-slate-500">
                                        Tujuan UPT <span className="text-red-500">*</span>
                                        {item.status === "RECOMMENDED" && <span className="ml-2 text-[10px] text-orange-500 font-normal">(Pilih ulang jika ingin kirim notifikasi)</span>}
                                      </Label>
                                      <Select value={selectedUpt} onValueChange={setSelectedUpt}>
                                        <SelectTrigger className="bg-white dark:bg-slate-950 border-orange-200"><SelectValue placeholder="Pilih UPT Tujuan" /></SelectTrigger>
                                        <SelectContent>
                                          {/* MAPPING DARI STATE UPTS (DATABASE) */}
                                          {upts.length > 0 ? upts.map((upt) => (
                                            <SelectItem key={upt.id} value={upt.name}>{upt.name}</SelectItem>
                                          )) : (
                                            <SelectItem value="dummy" disabled>Belum ada data UPT</SelectItem>
                                          )}
                                        </SelectContent>
                                      </Select>
                                      
                                      {item.status === "RECOMMENDED" && !selectedUpt && (
                                        <p className="text-[10px] text-slate-500 mt-1">
                                          <MapPin className="h-3 w-3 inline mr-1"/>
                                          Pilih ulang UPT agar alamat muncul di WhatsApp/Email.
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  {actionStatus === "REJECTED" && (
                                     <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 rounded text-xs text-red-600 animate-in fade-in">
                                        <span className="font-semibold">Konfirmasi:</span> Pelamar akan ditolak.
                                     </div>
                                  )}
                                </div>
                              </div>

                              {/* --- FOOTER --- */}
                              <DialogFooter className="p-4 bg-slate-100/50 dark:bg-slate-900/50 border-t border-slate-200 gap-2 sm:gap-0">
                                {item.status === "PENDING" && (
                                  <>
                                    <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isProcessing}>Batal</Button>
                                    <Button className="bg-blue-600 hover:bg-blue-700 text-white min-w-[150px]" onClick={handleProcess} disabled={isProcessing || !actionStatus}>
                                      {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...</> : "Simpan Keputusan"}
                                    </Button>
                                  </>
                                )}

                                {item.status !== "PENDING" && (
                                  <div className="flex flex-col sm:flex-row w-full justify-between items-center gap-4">
                                    <div className="text-sm italic text-slate-500 flex flex-col">
                                      <span>Status saat ini:{" "}
                                        <span className={`font-semibold ${item.status === "ACCEPTED" ? "text-green-600" : item.status === "RECOMMENDED" ? "text-blue-600" : "text-red-600"}`}>
                                          {item.status === "ACCEPTED" ? "Diterima" : item.status === "RECOMMENDED" ? "Direkomendasikan" : "Ditolak"}
                                        </span>
                                      </span>
                                      {isProcessing === false && actionStatus === item.status && (
                                        <span className="text-[10px] text-green-600 flex items-center mt-1"><CheckCircle className="h-3 w-3 mr-1"/> Data Tersimpan</span>
                                      )}
                                    </div>
                                    <div className="flex gap-2">
                                      <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>Tutup</Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => openWhatsApp(item, selectedUpt)} 
                                        className="h-8 text-green-600 border-green-200 hover:bg-green-50"
                                      >
                                        <MessageCircle className="w-3.5 h-3.5 mr-2" /> WhatsApp
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => openEmail(item, selectedUpt)} 
                                        className="h-8 text-orange-600 border-orange-200 hover:bg-orange-50"
                                      >
                                        <Mail className="w-3.5 h-3.5 mr-2" /> Email
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0 ml-1"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDelete(item.id)} className="text-red-600">Hapus</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
            {/* PAGINATION SAMA */}
            <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span>Menampilkan <strong>{filteredData.length > 0 ? startIndex + 1 : 0}</strong> - <strong>{Math.min(endIndex, filteredData.length)}</strong> dari <strong>{filteredData.length}</strong> data</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                <div className="flex items-center gap-1"><span className="text-sm px-2">Halaman {currentPage}</span></div>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          </Card>
        </main>
      </div>

      <Dialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen}>
        <DialogContent className="sm:max-w-[400px] p-6">
            <DialogHeader className="flex flex-col items-center text-center gap-2">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-2"><AlertTriangle className="h-6 w-6 text-red-600" /></div>
                <DialogTitle>Konfirmasi Keluar</DialogTitle>
                <DialogDescription>Anda harus login kembali untuk mengakses panel.</DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
                <Button variant="outline" className="w-full sm:w-1/2" onClick={() => setIsLogoutOpen(false)}>Batal</Button>
                <Button variant="destructive" className="w-full sm:w-1/2" onClick={handleLogoutConfirm}>Ya, Keluar</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}