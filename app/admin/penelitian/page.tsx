"use client";

import Image from "next/image";
import { ModeToggle } from "@/components/mode-toggle";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  LayoutDashboard,
  Users,
  LogOut,
  Menu,
  X,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  FileText,
  RefreshCcw,
  Loader2,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Filter,
  ArrowUpDown,
  BookOpen,
  MessageCircle,
  Mail,
  CalendarClock,
  Download,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Trash2 // Tambahin icon Trash2
} from "lucide-react";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// --- TIPE DATA PENELITIAN ---
type Penelitian = {
  id: string;
  namaLengkap: string;
  nomorInduk: string;
  universitas: string;
  fakultas: string;
  jurusan: string;
  email: string;
  nomorHp: string;
  kategori: string;
  judul: string;
  subjek: string;
  pemohonSurat: string;
  nomorSurat: string;
  tanggalSurat: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
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

export default function AdminResearchPage() {
  const router = useRouter();

  // --- STATE UTAMA ---
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [dataPenelitian, setDataPenelitian] = useState<Penelitian[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // --- STATE FILTER ---
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  
  // --- STATE PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Detail Modal
  const [selectedItem, setSelectedItem] = useState<Penelitian | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- STATE DELETE MODAL (BARU) ---
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Penelitian | null>(null);

  // Admin Info
  const [admin, setAdmin] = useState({ username: "...", jabatan: "..." });
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  // --- FETCH DATA ---
  const fetchData = async () => {
    try {
      const res = await fetch("/api/penelitian", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) setDataPenelitian(data);
    } catch (error) {
      toast.error("Gagal mengambil data penelitian.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState === "true") setIsSidebarCollapsed(true);
    
    // Cek Sesi Admin
    fetch("/api/auth/me").then(res => {
        if(res.ok) return res.json();
        throw new Error("Auth failed");
    }).then(data => {
        setAdmin({ username: data.username, jabatan: data.jabatan || "Administrator" });
    }).catch(() => router.push("/admin/login"));

    fetchData();
  }, []);

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", String(newState));
  };

  // --- LOGIC AVAILABLE YEARS ---
  const availableYears = useMemo(() => {
    const years = new Set(dataPenelitian.map((p) => new Date(p.createdAt).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [dataPenelitian]);

  // --- FILTERING & PAGINATION LOGIC ---
  const filteredData = useMemo(() => {
    return dataPenelitian.filter((item) => {
      const date = new Date(item.createdAt);
      const matchesSearch = item.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.universitas.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.judul.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesYear = filterYear === "all" || date.getFullYear().toString() === filterYear;
      const matchesMonth = filterMonth === "all" || date.getMonth().toString() === filterMonth;
      
      return matchesSearch && matchesYear && matchesMonth;
    });
  }, [dataPenelitian, searchTerm, filterYear, filterMonth]);

  // Reset page saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterYear, filterMonth, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // --- EXPORT EXCEL ---
  const handleExportExcel = async () => {
    if (filteredData.length === 0) {
      toast.warning("Tidak ada data untuk diexport.");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data Izin Penelitian");

    let titleText = "LAPORAN IZIN PENELITIAN - DINAS DIKPORA DIY";
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

    worksheet.mergeCells('A1:K1');
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
      "No", "Nama Peneliti", "NIM / NIDN", "Instansi", "Fakultas - Jurusan", 
      "Judul Penelitian", "Kategori", "Subjek", "No. HP", "Status", "Tgl Daftar"
    ];
    headerRow.font = { bold: true, color: { argb: "FF000000" }, size: 11 };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFbfdbfe" } };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 25;
    
    worksheet.getColumn(1).width = 5;
    worksheet.getColumn(2).width = 30;
    worksheet.getColumn(3).width = 20;
    worksheet.getColumn(4).width = 25;
    worksheet.getColumn(5).width = 30;
    worksheet.getColumn(6).width = 40;
    worksheet.getColumn(7).width = 15;
    worksheet.getColumn(8).width = 20;
    worksheet.getColumn(9).width = 15;
    worksheet.getColumn(10).width = 15;
    worksheet.getColumn(11).width = 15;

    filteredData.forEach((item, index) => {
      let statusLabel = "PENDING";
      if (item.status === "ACCEPTED") statusLabel = "DISETUJUI";
      if (item.status === "REJECTED") statusLabel = "DITOLAK";

      const row = worksheet.addRow([
        index + 1, item.namaLengkap, item.nomorInduk, item.universitas, `${item.fakultas || '-'} - ${item.jurusan}`,
        item.judul, item.kategori, item.subjek, item.nomorHp, statusLabel, new Date(item.createdAt).toLocaleDateString("id-ID")
      ]);
      row.eachCell((cell) => {
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      });
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(10).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(11).alignment = { vertical: 'middle', horizontal: 'center' };
    });

    let fileName = "Rekap_Penelitian";
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

  // --- UPDATE STATUS ---
  const handleUpdateStatus = async (status: "ACCEPTED" | "REJECTED") => {
    if (!selectedItem) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/penelitian/${selectedItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        toast.success(`Status berhasil diubah menjadi ${status}`);
        setIsDialogOpen(false);
        fetchData();
      } else {
        toast.error("Gagal update status");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan server");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- DELETE LOGIC (BARU) ---
  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/penelitian/${itemToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Data berhasil dihapus!");
        setIsDeleteDialogOpen(false);
        setItemToDelete(null);
        fetchData();
      } else {
        toast.error("Gagal menghapus data");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- NOTIFIKASI WA & EMAIL ---
  const openWhatsApp = (item: Penelitian) => {
    let hp = item.nomorHp.replace(/\D/g, "");
    if (hp.startsWith("0")) hp = "62" + hp.slice(1);

    let message = "";
    if (item.status === "ACCEPTED") {
      message = `Halo *${item.namaLengkap}*,\n\nPermohonan Izin Penelitian Anda di Dinas DIKPORA DIY telah *DISETUJUI*.\n\n*Detail:* \nJudul: ${item.judul}\nInstansi: ${item.universitas}\n\nSilakan datang ke kantor Dinas Dikpora DIY Sub Bagian Kepegawaian untuk koordinasi pelaksanaan teknis penelitian. \nTerima kasih.`;
    } else {
      message = `Halo *${item.namaLengkap}*,\n\nMohon maaf, permohonan Izin Penelitian Anda dengan judul "${item.judul}" belum dapat kami setujui saat ini. Terima kasih.`;
    }
    window.open(`https://wa.me/${hp}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const openEmail = (item: Penelitian) => {
    let subject = item.status === "ACCEPTED" ? "IZIN PENELITIAN DISETUJUI - DINAS DIKPORA DIY" : "STATUS PENGAJUAN PENELITIAN";
    let body = "";
    
    if (item.status === "ACCEPTED") {
      body = `Halo ${item.namaLengkap},\n\nPermohonan Izin Penelitian Anda di Dinas DIKPORA DIY telah *DISETUJUI*.\n\nJudul: ${item.judul}\n\nSilakan datang ke kantor Dinas DIKPORA DIY (Sub Bagian Kepegawaian) untuk koordinasi pelaksanaan teknis penelitian.`;
    } else {
      body = `Halo ${item.namaLengkap},\n\nMohon maaf, permohonan Izin Penelitian Anda dengan judul "${item.judul}" belum dapat kami setujui saat ini. Terima kasih.`;
    }
    window.open(`mailto:${item.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
  };

  // --- SIDEBAR ITEM COMPONENT ---
  const SidebarItem = ({ icon: Icon, label, active = false, onClick, className = "" }: any) => (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button variant="ghost" onClick={onClick} className={`w-full flex items-center transition-colors duration-200 ${isSidebarCollapsed ? "justify-center px-2" : "justify-start px-4"} ${active ? "bg-slate-800 text-white shadow-md shadow-slate-900/20" : "text-slate-300 hover:text-white hover:bg-slate-800"} ${className}`}>
            <Icon className={`h-5 w-5 ${isSidebarCollapsed ? "" : "mr-3"}`} />
            {!isSidebarCollapsed && <span>{label}</span>}
          </Button>
        </TooltipTrigger>
        {isSidebarCollapsed && <TooltipContent side="right" className="bg-slate-800 text-white border-slate-700 ml-2">{label}</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className="h-screen w-full bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300 overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-slate-900 text-white shadow-xl flex flex-col h-full transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 ${isSidebarCollapsed ? "w-20" : "w-64"}`}>
        <div className={`h-16 flex items-center border-b border-slate-800 flex-none ${isSidebarCollapsed ? "justify-center px-0" : "px-6 gap-3"}`}>
          <div className="flex items-center justify-center">
            <Image src="/logo-disdikpora.png" alt="Logo" width={isSidebarCollapsed ? 28 : 32} height={isSidebarCollapsed ? 28 : 32} className="object-contain" />
          </div>
          {!isSidebarCollapsed && <h1 className="font-bold text-xl tracking-wider truncate">Dinas DIKPORA</h1>}
          <button className="ml-auto md:hidden text-slate-400" onClick={() => setSidebarOpen(false)}><X className="h-6 w-6" /></button>
        </div>
        <nav className="p-3 space-y-2 flex-1 overflow-y-auto overflow-x-hidden">
          <SidebarItem icon={LayoutDashboard} label="Master Data" onClick={() => router.push("/admin/dashboard")} />
          <SidebarItem icon={FileText} label="Applicants" onClick={() => router.push("/admin/applicants")} />
          <SidebarItem icon={CalendarClock} label="Daftar PKL" onClick={() => router.push("/admin/pkl")} />
          <SidebarItem icon={BookOpen} label="Penelitian" active={true} />
          <SidebarItem icon={Users} label="Admin Users" onClick={() => router.push("/admin/users")} />
          <SidebarItem icon={Settings} label="Settings" onClick={() => router.push("/admin/pengaturan")} />
          <div className={`pt-4 mt-4 border-t border-slate-800 ${isSidebarCollapsed ? "mx-2" : ""}`}>
            <SidebarItem icon={LogOut} label="Keluar" className="text-red-400 hover:text-red-300 hover:bg-red-900/20" onClick={() => setIsLogoutOpen(true)} />
          </div>
        </nav>
      </aside>

      {/* CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="bg-white dark:bg-slate-950 border-b dark:border-slate-800 h-16 flex items-center px-4 md:px-8 justify-between shadow-sm flex-none z-40">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 hover:bg-slate-100 rounded" onClick={() => setSidebarOpen(true)}><Menu className="h-6 w-6" /></button>
            <button className="hidden md:flex p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md" onClick={toggleSidebar}>
              {isSidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Izin Penelitian</h2>
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
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Permohonan Izin Penelitian</h1>
              <p className="text-slate-500 dark:text-slate-400">Kelola pengajuan izin penelitian dari Mahasiswa/Dosen.</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleExportExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-700/20 transition-all hover:scale-105">
                <Download className="h-4 w-4 mr-2" /> Export Excel
              </Button>
              <Button onClick={() => { setLoading(true); fetchData(); }} className="bg-blue-700 hover:bg-blue-800 text-white shadow-lg shadow-blue-700/20 transition-all hover:scale-105">
                <RefreshCcw className="h-4 w-4 mr-2" /> Refresh Data
              </Button>
            </div>
          </div>

          <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden flex flex-col h-full max-h-[calc(100vh-14rem)]">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 py-4 space-y-4">
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input placeholder="Cari nama, kampus, atau judul..." className="pl-9 bg-white dark:bg-slate-950" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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

            <div className="p-0 overflow-auto flex-1">
              <Table>
                <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-800 z-10">
                  <TableRow>
                    <TableHead className="w-[50px] text-center">No</TableHead>
                    <TableHead>Nama Peneliti</TableHead>
                    <TableHead>Instansi / Kampus</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Judul Penelitian</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right pr-6">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={7} className="h-24 text-center text-slate-500"><Loader2 className="animate-spin h-4 w-4 inline mr-2" /> Memuat data...</TableCell></TableRow>
                  ) : currentData.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="h-32 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <BookOpen className="h-8 w-8 text-slate-300" />
                        <p>Belum ada data masuk.</p>
                      </div>
                    </TableCell></TableRow>
                  ) : (
                    currentData.map((item, idx) => (
                      <TableRow key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <TableCell className="text-center">{startIndex + idx + 1}</TableCell>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{item.namaLengkap}</span>
                            <span className="text-xs text-slate-500">{item.nomorInduk}</span>
                          </div>
                        </TableCell>
                        <TableCell>{item.universitas}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">{item.kategori}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[250px] truncate" title={item.judul}>
                          {item.judul}
                        </TableCell>
                        <TableCell>
                          {item.status === "PENDING" && <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 gap-1"><Clock className="h-3 w-3"/> Pending</Badge>}
                          {item.status === "ACCEPTED" && <Badge className="bg-green-100 text-green-700 border-green-200 gap-1 shadow-none"><CheckCircle className="h-3 w-3"/> Disetujui</Badge>}
                          {item.status === "REJECTED" && <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1"><XCircle className="h-3 w-3"/> Ditolak</Badge>}
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <div className="flex justify-end gap-2">
                            {/* --- TOMBOL DETAIL --- */}
                            <Dialog open={isDialogOpen && selectedItem?.id === item.id} onOpenChange={(open) => { setIsDialogOpen(open); if(open) setSelectedItem(item); }}>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl bg-white dark:bg-slate-950">
                                <DialogHeader>
                                  <DialogTitle>Detail Permohonan</DialogTitle>
                                  <DialogDescription>Cek detail penelitian mahasiswa/dosen.</DialogDescription>
                                </DialogHeader>
                                
                                <div className="grid grid-cols-2 gap-4 py-4 text-sm">
                                  <div><Label className="text-xs text-slate-500">Nama Lengkap</Label><div className="font-medium">{item.namaLengkap}</div></div>
                                  <div><Label className="text-xs text-slate-500">NIM / NIDN</Label><div className="font-medium">{item.nomorInduk}</div></div>
                                  <div><Label className="text-xs text-slate-500">Universitas</Label><div className="font-medium">{item.universitas}</div></div>
                                  <div><Label className="text-xs text-slate-500">Fakultas/Jurusan</Label><div className="font-medium">{item.fakultas} - {item.jurusan}</div></div>
                                  <div className="col-span-2 border-t pt-2 mt-2"><Label className="text-xs text-slate-500">Judul Penelitian</Label><div className="font-medium italic">"{item.judul}"</div></div>
                                  <div className="col-span-2"><Label className="text-xs text-slate-500">Subjek/Target</Label><div className="font-medium">{item.subjek}</div></div>
                                  <div><Label className="text-xs text-slate-500">Nomor Surat Kampus</Label><div className="font-medium">{item.nomorSurat}</div></div>
                                  <div><Label className="text-xs text-slate-500">Tanggal Surat</Label><div className="font-medium">{new Date(item.tanggalSurat).toLocaleDateString("id-ID")}</div></div>
                                </div>

                                <DialogFooter className="gap-2 sm:gap-0">
                                  {item.status === "PENDING" ? (
                                    <>
                                      <Button variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => handleUpdateStatus("REJECTED")} disabled={isProcessing}>Tolak</Button>
                                      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleUpdateStatus("ACCEPTED")} disabled={isProcessing}>
                                        {isProcessing ? "Menyimpan..." : "Setujui Izin"}
                                      </Button>
                                    </>
                                  ) : (
                                    <div className="flex w-full justify-between items-center">
                                      <div className="text-sm italic text-slate-500">Status: <span className="font-bold">{item.status}</span></div>
                                      <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => openWhatsApp(item)} className="text-green-600 border-green-200 hover:bg-green-50"><MessageCircle className="w-4 h-4 mr-2"/> WhatsApp</Button>
                                        <Button variant="outline" size="sm" onClick={() => openEmail(item)} className="text-orange-600 border-orange-200 hover:bg-orange-50"><Mail className="w-4 h-4 mr-2"/> Email</Button>
                                      </div>
                                    </div>
                                  )}
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            {/* --- TOMBOL HAPUS --- */}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                              onClick={() => {
                                setItemToDelete(item);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                <span>
                  Menampilkan <strong>{filteredData.length > 0 ? startIndex + 1 : 0}</strong> - <strong>{Math.min(endIndex, filteredData.length)}</strong> dari <strong>{filteredData.length}</strong> data
                </span>
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline">| Baris:</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(val) => {
                      setItemsPerPage(Number(val));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="h-8 w-[70px] bg-white dark:bg-slate-950">
                      <SelectValue placeholder="10" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pNum = i + 1;
                    if (totalPages > 5 && currentPage > 3) {
                      pNum = currentPage - 2 + i;
                    }
                    if (pNum > totalPages) return null;
                    return (
                      <Button
                        key={pNum}
                        variant={currentPage === pNum ? "default" : "outline"}
                        size="sm"
                        className={`h-8 w-8 p-0 ${currentPage === pNum ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}`}
                        onClick={() => setCurrentPage(pNum)}
                      >
                        {pNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* --- MODAL KONFIRMASI HAPUS (BARU) --- */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogContent className="sm:max-w-[425px] p-6 border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-950">
                  <div className="flex flex-col items-center text-center gap-2 pt-2">
                    <div className="h-14 w-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-2 animate-in zoom-in duration-300">
                        <Trash2 className="h-7 w-7 text-red-600 dark:text-red-500" />
                    </div>
                    <DialogTitle className="text-xl font-semibold dark:text-slate-100">
                        Hapus Data Penelitian?
                    </DialogTitle>
                    <DialogDescription className="text-center dark:text-slate-400">
                        Anda akan menghapus permohonan atas nama <span className="font-semibold text-slate-900 dark:text-slate-200">"{itemToDelete?.namaLengkap}"</span>. 
                        <br/>Tindakan ini tidak dapat dibatalkan.
                    </DialogDescription>
                  </div>
                  <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-6">
                    <Button 
                      variant="outline" 
                      className="w-full sm:w-1/2 h-10 border-slate-200 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800" 
                      onClick={() => setIsDeleteDialogOpen(false)}
                      disabled={isProcessing}
                    >
                      Batal
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="w-full sm:w-1/2 h-10 bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20" 
                      onClick={handleDelete}
                      disabled={isProcessing}
                    >
                      {isProcessing ? <Loader2 className="animate-spin h-4 w-4"/> : "Ya, Hapus"}
                    </Button>
                  </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* --- MODAL LOGOUT --- */}
            <Dialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen}>
              <DialogContent className="sm:max-w-[400px] p-6 animate-in fade-in zoom-in-95 duration-200 dark:bg-slate-950 dark:border-slate-800">
                <DialogHeader className="flex flex-col items-center text-center gap-2">
                    <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-2">
                      <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <DialogTitle className="text-xl dark:text-slate-100">Konfirmasi Keluar</DialogTitle>
                    <DialogDescription className="text-center dark:text-slate-400">
                      Apakah Anda yakin ingin keluar dari sesi admin ini? Anda harus login kembali untuk mengakses panel.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
                    <Button variant="outline" className="w-full sm:w-1/2 dark:bg-transparent dark:text-slate-100 dark:border-slate-700" onClick={() => setIsLogoutOpen(false)}>Batal</Button>
                    <Button 
                      variant="destructive" 
                      className="w-full sm:w-1/2 bg-red-600 hover:bg-red-700 text-white font-semibold" 
                      onClick={async () => {
                        await fetch("/api/auth/logout", { method: "POST" });
                        router.push("/admin/login");
                      }}
                    >
                      Ya, Keluar
                    </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Card>
        </main>
      </div>
    </div>
    
  );
}