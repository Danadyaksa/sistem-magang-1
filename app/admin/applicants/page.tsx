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
  Image as ImageIcon,
  Loader2,
  Settings,
  AlertTriangle,
  PanelLeftClose, 
  PanelLeftOpen,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  ArrowUpDown, 
  ArrowUp,     
  ArrowDown,    
  CalendarClock
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// --- TIPE DATA ---
type Pendaftaran = {
  id: string;
  namaLengkap: string;
  nomorHp: string;
  instansi: string;
  jurusan: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
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

// CONSTANT BULAN
const MONTHS = [
  { value: "0", label: "Januari" },
  { value: "1", label: "Februari" },
  { value: "2", label: "Maret" },
  { value: "3", label: "April" },
  { value: "4", label: "Mei" },
  { value: "5", label: "Juni" },
  { value: "6", label: "Juli" },
  { value: "7", label: "Agustus" },
  { value: "8", label: "September" },
  { value: "9", label: "Oktober" },
  { value: "10", label: "November" },
  { value: "11", label: "Desember" },
];

export default function ApplicantsPage() {
  const router = useRouter();

  // --- STATE UTAMA ---
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [pendaftar, setPendaftar] = useState<Pendaftaran[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- STATE FILTER, SORT & PAGINATION ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  
  // State Sorting
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); 

  // State Lainnya
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [admin, setAdmin] = useState({ username: "...", jabatan: "..." });
  const [selectedPelamar, setSelectedPelamar] = useState<Pendaftaran | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  // --- 2. FETCH DATA ---
  const fetchData = async () => {
    try {
      const [resPendaftar, resPositions] = await Promise.all([
        fetch("/api/pendaftaran", { cache: 'no-store' }),
        fetch("/api/positions", { cache: 'no-store' }),
      ]);

      const dataPendaftar = await resPendaftar.json();
      const dataPositions = await resPositions.json();

      if (Array.isArray(dataPendaftar)) setPendaftar(dataPendaftar);
      if (Array.isArray(dataPositions)) setPositions(dataPositions);

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
        setAdmin({ username: data.username, jabatan: data.jabatan || "Administrator" });
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

  // --- LOGIC FILTERING & SORTING ---
  
  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const availableYears = useMemo(() => {
    const years = new Set(pendaftar.map(p => new Date(p.createdAt).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [pendaftar]);

  const filteredData = useMemo(() => {
    // 1. Filtering
    let data = pendaftar.filter((item) => {
      const date = new Date(item.createdAt);
      const matchesSearch = 
        item.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.instansi.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesYear = filterYear === "all" || date.getFullYear().toString() === filterYear;
      const matchesMonth = filterMonth === "all" || date.getMonth().toString() === filterMonth;

      return matchesSearch && matchesYear && matchesMonth;
    });

    // 2. Sorting
    if (sortConfig !== null) {
      data.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof Pendaftaran];
        let bValue: any = b[sortConfig.key as keyof Pendaftaran];

        // Handling khusus tipe data
        if (sortConfig.key === 'createdAt') {
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
        } else if (typeof aValue === 'string') {
            // Untuk Nama, Instansi, Status -> Compare Lowercase biar rapi
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return data;
  }, [pendaftar, searchTerm, filterYear, filterMonth, sortConfig]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterYear, filterMonth, itemsPerPage]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // --- ACTION HANDLERS ---
  const handleLogoutConfirm = async () => {
    setIsLogoutOpen(false);
    const promise = fetch("/api/auth/logout", { method: "POST" });
    toast.promise(promise, {
      loading: 'Sedang keluar...',
      success: () => { router.push("/admin/login"); return 'Berhasil logout'; },
      error: 'Gagal logout',
    });
  };

  const handleUpdateStatus = async (status: "ACCEPTED" | "REJECTED") => {
    if (!selectedPelamar) return;
    if (status === "ACCEPTED" && !selectedPosition) {
      toast.warning("Wajib pilih posisi/bidang penempatan terlebih dahulu!");
      return;
    }
    try {
      setIsProcessing(true);
      const res = await fetch(`/api/pendaftaran/${selectedPelamar.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          positionId: status === "ACCEPTED" ? selectedPosition : null,
        }),
      });
      if (res.ok) {
        setIsDialogOpen(false);
        fetchData(); 
        toast.success(`Sukses! Pelamar berhasil di-${status === "ACCEPTED" ? "terima" : "tolak"}.`);
      } else {
        toast.error("Gagal update status.");
      }
    } catch (error) {
      toast.error("Server error.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- EXPORT TO EXCEL FUNCTION ---
  const handleExportExcel = async () => {
    if (filteredData.length === 0) {
      toast.warning("Tidak ada data untuk diexport.");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data Pelamar");

    const columns = [
      { header: "No", key: "no", width: 5 },
      { header: "Nama Lengkap", key: "nama", width: 30 },
      { header: "Instansi", key: "instansi", width: 25 },
      { header: "Jurusan", key: "jurusan", width: 25 },
      { header: "Nomor HP", key: "hp", width: 18 },
      { header: "Tgl Daftar", key: "tgl_daftar", width: 15 },
      { header: "Mulai Magang", key: "tgl_mulai", width: 15 },
      { header: "Selesai Magang", key: "tgl_selesai", width: 15 },
      { header: "Status", key: "status", width: 15 },
      { header: "Penempatan", key: "penempatan", width: 25 },
    ];

    worksheet.columns = columns;

    filteredData.forEach((item, index) => {
      const posisi = positions.find(p => p.id === item.positionId)?.title || "-";
      let statusLabel = "PENDING";
      if(item.status === "ACCEPTED") statusLabel = "DITERIMA";
      if(item.status === "REJECTED") statusLabel = "DITOLAK";

      worksheet.addRow({
        no: index + 1,
        nama: item.namaLengkap,
        instansi: item.instansi,
        jurusan: item.jurusan,
        hp: item.nomorHp || "-",
        tgl_daftar: new Date(item.createdAt).toLocaleDateString("id-ID"),
        tgl_mulai: new Date(item.tanggalMulai).toLocaleDateString("id-ID"),
        tgl_selesai: new Date(item.tanggalSelesai).toLocaleDateString("id-ID"),
        status: statusLabel,
        penempatan: posisi,
      });
    });

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1e40af" }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 30;

    worksheet.eachRow((row, rowNumber) => {
       row.eachCell((cell, colNumber) => {
          cell.border = {
             top: { style: 'thin' },
             left: { style: 'thin' },
             bottom: { style: 'thin' },
             right: { style: 'thin' }
          };
          if ([1, 5, 6, 7, 8, 9].includes(colNumber)) {
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
          } else {
            cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
          }
       });
       if(rowNumber > 1) {
         row.eachCell((cell, colNumber) => {
            const column = worksheet.getColumn(colNumber);
            const cellLength = cell.value ? cell.value.toString().length : 10;
            const currentWidth = column.width || 10;
            if (cellLength > currentWidth && cellLength < 50) {
               column.width = cellLength + 2;
            }
         });
       }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `Rekap_Magang_${new Date().toISOString().split('T')[0]}.xlsx`;
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, fileName);

    toast.success("Data berhasil diexport dengan format rapi!");
  };

  // Component Sidebar Item
  const SidebarItem = ({ icon: Icon, label, active = false, onClick, className = "" }: any) => (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            onClick={onClick}
            className={`
              w-full flex items-center transition-all duration-200
              ${isSidebarCollapsed ? "justify-center px-2" : "justify-start px-4"}
              ${active ? "bg-slate-800 text-white shadow-md shadow-slate-900/20" : "text-slate-300 hover:text-white hover:bg-slate-800"}
              ${className}
            `}
          >
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
      <aside className={`fixed inset-y-0 left-0 z-50 bg-slate-900 text-white shadow-xl flex flex-col h-full transition-all duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 ${isSidebarCollapsed ? "w-20" : "w-64"}`}>
        <div className={`h-16 flex items-center border-b border-slate-800 flex-none ${isSidebarCollapsed ? "justify-center px-0" : "px-6 gap-3"}`}>
          <div className="flex items-center justify-center">
             <Image src="/logo-disdikpora.png" alt="Logo Disdikpora" width={isSidebarCollapsed ? 28 : 32} height={isSidebarCollapsed ? 28 : 32} className="object-contain transition-all duration-300"/>
          </div>
          {!isSidebarCollapsed && <h1 className="font-bold text-xl tracking-wider truncate animate-in fade-in duration-300">Dinas DIKPORA</h1>}
          <button className="ml-auto md:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}><X className="h-6 w-6" /></button>
        </div>
        <nav className="p-3 space-y-2 flex-1 overflow-y-auto overflow-x-hidden">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" onClick={() => router.push("/admin/dashboard")} />
          <SidebarItem icon={FileText} label="Applicants" active={true} />
          <SidebarItem 
            icon={CalendarClock} 
            label="Daftar PKL" 
            onClick={() => router.push("/admin/pkl")} 
          />
          <SidebarItem icon={Users} label="Admin Users" onClick={() => router.push("/admin/users")} />
          <SidebarItem icon={Settings} label="Settings" onClick={() => router.push("/admin/pengaturan")} />
          <div className={`pt-4 mt-4 border-t border-slate-800 ${isSidebarCollapsed ? "mx-2" : ""}`}>
            <SidebarItem icon={LogOut} label="Keluar" className="text-red-400 hover:text-red-300 hover:bg-red-900/20" onClick={() => setIsLogoutOpen(true)} />
          </div>
        </nav>
      </aside>

      {/* CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* HEADER */}
        <header className="bg-white dark:bg-slate-950 border-b dark:border-slate-800 h-16 flex items-center px-4 md:px-8 justify-between shadow-sm transition-colors duration-300 flex-none z-40">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded" onClick={() => setSidebarOpen(true)}><Menu className="h-6 w-6 text-slate-600 dark:text-slate-200" /></button>
            <button className="hidden md:flex p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors" onClick={toggleSidebar} title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}>
                {isSidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Review Pelamar</h2>
          </div>
          <div className="flex items-center gap-4">
            <ModeToggle />
            <div className="text-right hidden md:block">
              <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{admin.username}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{admin.jabatan}</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800">
              <User className="h-6 w-6" />
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Data Pelamar Masuk</h1>
              <p className="text-slate-500 dark:text-slate-400">Cek berkas dan tentukan siapa yang layak magang.</p>
            </div>
            <div className="flex gap-2">
              {/* TOMBOL EXPORT */}
              <Button onClick={handleExportExcel} className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-700/20 transition-all hover:scale-105 text-white">
                 <Download className="h-4 w-4 mr-2" /> Export Excel
              </Button>

              <Button onClick={() => { setLoading(true); fetchData(); }} className="bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 shadow-lg shadow-blue-700/20 transition-all hover:scale-105 text-white">
                <RefreshCcw className="h-4 w-4 mr-2" /> Refresh Data
              </Button>
            </div>
          </div>

          {/* TABLE CONTAINER */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden transition-colors flex flex-col h-full max-h-[calc(100vh-14rem)]">
            {/* 1. FILTER HEADER */}
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 py-4 space-y-4">
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                 
                 {/* Kiri: Search & Filter Title */}
                 <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                    <div className="relative w-full sm:w-72">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        placeholder="Cari nama / instansi..." 
                        className="pl-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                 </div>

                 {/* Kanan: Filter Dropdowns */}
                 <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mr-2">
                      <Filter className="h-4 w-4" /> Filter:
                    </div>
                    
                    {/* Filter Bulan */}
                    <Select value={filterMonth} onValueChange={setFilterMonth}>
                      <SelectTrigger className="w-[130px] bg-white dark:bg-slate-950">
                        <SelectValue placeholder="Bulan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Bulan</SelectItem>
                        {MONTHS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Filter Tahun */}
                    <Select value={filterYear} onValueChange={setFilterYear}>
                      <SelectTrigger className="w-[100px] bg-white dark:bg-slate-950">
                        <SelectValue placeholder="Tahun" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua</SelectItem>
                        {availableYears.map((year) => (
                          <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                 </div>
              </div>
            </CardHeader>

            {/* 2. TABLE BODY */}
            <CardContent className="p-0 overflow-auto flex-1">
              <Table>
                <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-800 z-10">
                  <TableRow className="border-b border-slate-200 dark:border-slate-700">
                    <TableHead className="w-[50px] text-center h-10 dark:text-slate-400">No</TableHead>
                    
                    {/* --- HEADER NAMA (SORTABLE) --- */}
                    <TableHead 
                      className="h-10 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none group"
                      onClick={() => requestSort('namaLengkap')}
                    >
                      <div className="flex items-center gap-2">
                        Nama Pelamar
                        {sortConfig?.key === 'namaLengkap' ? (
                          sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 text-blue-600" /> : <ArrowDown className="h-3 w-3 text-blue-600" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </TableHead>

                    {/* --- HEADER INSTANSI (SORTABLE) --- */}
                    <TableHead 
                      className="h-10 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none group"
                      onClick={() => requestSort('instansi')}
                    >
                      <div className="flex items-center gap-2">
                        Instansi
                        {sortConfig?.key === 'instansi' ? (
                          sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 text-blue-600" /> : <ArrowDown className="h-3 w-3 text-blue-600" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </TableHead>
                    
                    {/* --- HEADER TANGGAL (SORTABLE) --- */}
                    <TableHead 
                      className="h-10 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none group"
                      onClick={() => requestSort('createdAt')}
                    >
                      <div className="flex items-center gap-2">
                         Tgl Daftar
                         {sortConfig?.key === 'createdAt' ? (
                          sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 text-blue-600" /> : <ArrowDown className="h-3 w-3 text-blue-600" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </TableHead>

                    {/* --- HEADER STATUS (SORTABLE) --- */}
                    <TableHead 
                      className="h-10 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none group"
                      onClick={() => requestSort('status')}
                    >
                      <div className="flex items-center gap-2">
                         Status
                         {sortConfig?.key === 'status' ? (
                          sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 text-blue-600" /> : <ArrowDown className="h-3 w-3 text-blue-600" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </TableHead>
                    
                    <TableHead className="text-right pr-6 h-10 dark:text-slate-400">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="h-24 text-center text-slate-500"><Loader2 className="animate-spin h-4 w-4 inline mr-2" /> Memuat data...</TableCell></TableRow>
                  ) : currentData.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="h-32 text-center text-slate-500"><div className="flex flex-col items-center gap-2"><FileText className="h-8 w-8 text-slate-300" /><p>Data tidak ditemukan.</p></div></TableCell></TableRow>
                  ) : (
                    currentData.map((item, idx) => (
                      <TableRow key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0">
                        <TableCell className="text-center text-slate-500 dark:text-slate-400 py-3">{startIndex + idx + 1}</TableCell>
                        <TableCell className="font-medium py-3">
                          <div className="flex flex-col">
                            <span className="text-slate-900 dark:text-slate-100 text-sm">{item.namaLengkap}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px]">{item.jurusan}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-300 text-sm py-3">{item.instansi}</TableCell>
                        <TableCell className="text-slate-500 dark:text-slate-400 text-sm py-3">
                          {new Date(item.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </TableCell>
                        <TableCell className="py-3">
                          {item.status === "PENDING" && <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 gap-1 font-normal text-xs"><Clock className="h-3 w-3" /> Pending</Badge>}
                          {item.status === "ACCEPTED" && <Badge className="bg-green-100 text-green-700 border-green-200 gap-1 font-normal shadow-none text-xs"><CheckCircle className="h-3 w-3" /> Diterima</Badge>}
                          {item.status === "REJECTED" && <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1 font-normal text-xs"><XCircle className="h-3 w-3" /> Ditolak</Badge>}
                        </TableCell>
                        <TableCell className="text-right pr-4 py-3">
                           {/* DIALOG START */}
                           <Dialog open={isDialogOpen && selectedPelamar?.id === item.id} onOpenChange={(open) => { setIsDialogOpen(open); if(open) { setSelectedPelamar(item); setSelectedPosition(item.positionId?.toString() || ""); } }}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-50 text-slate-400 hover:text-blue-600">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl bg-white dark:bg-slate-950 p-0 overflow-hidden border-slate-200 dark:border-slate-800">
                              <DialogHeader className="p-6 pb-2">
                                <DialogTitle className="text-xl dark:text-slate-100">Detail Pendaftaran</DialogTitle>
                                <DialogDescription className="dark:text-slate-400">Tinjau kelengkapan berkas kandidat.</DialogDescription>
                              </DialogHeader>
                              <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                  <div className="space-y-1"><Label className="text-xs text-slate-500 uppercase font-semibold">Nama Lengkap</Label><div className="text-slate-900 dark:text-slate-100 font-medium border-b border-slate-100 pb-1">{item.namaLengkap}</div></div>
                                  <div className="space-y-1"><Label className="text-xs text-slate-500 uppercase font-semibold">Asal Instansi</Label><div className="text-slate-900 dark:text-slate-100 text-sm">{item.instansi}</div><div className="text-slate-500 text-xs">{item.jurusan}</div></div>
                                  <div className="space-y-1"><Label className="text-xs text-slate-500 uppercase font-semibold">Rencana Magang</Label><div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><Clock className="h-3 w-3 text-blue-500" />{new Date(item.tanggalMulai).toLocaleDateString()} — {new Date(item.tanggalSelesai).toLocaleDateString()}</div></div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-100 dark:border-slate-800 space-y-3">
                                  <Label className="text-xs text-slate-500 uppercase font-semibold block mb-2">Lampiran</Label>
                                  <Button variant="outline" size="sm" className="w-full justify-start text-slate-600" asChild><a href={item.cvPath} target="_blank"><FileText className="mr-2 h-4 w-4 text-blue-600" /> Lihat CV</a></Button>
                                  <Button variant="outline" size="sm" className="w-full justify-start text-slate-600" asChild><a href={item.suratPath} target="_blank"><FileText className="mr-2 h-4 w-4 text-orange-600" /> Surat Pengantar</a></Button>
                                  <Button variant="outline" size="sm" className="w-full justify-start text-slate-600" asChild><a href={item.fotoPath} target="_blank"><ImageIcon className="mr-2 h-4 w-4 text-purple-600" /> Lihat Pas Foto</a></Button>
                                </div>
                              </div>
                              <Separator className="dark:bg-slate-800" />
                              <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50">
                                <div className="mb-3 flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /><span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Keputusan Admin</span></div>
                                <div className="space-y-2">
                                  <Label className="text-xs text-slate-500">Tempatkan di Bidang (Wajib jika diterima)</Label>
                                  <Select value={selectedPosition} onValueChange={setSelectedPosition} disabled={item.status !== "PENDING"}>
                                    <SelectTrigger className="bg-white dark:bg-slate-950"><SelectValue placeholder="-- Pilih Posisi Magang --" /></SelectTrigger>
                                    <SelectContent>{positions.map((pos) => (<SelectItem key={pos.id} value={pos.id.toString()}>{pos.title} <span className="text-slate-400 text-xs ml-2">(Sisa: {pos.quota - pos.filled})</span></SelectItem>))}</SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <DialogFooter className="p-4 bg-slate-100/50 dark:bg-slate-900/50 border-t border-slate-200 gap-2 sm:gap-0">
                                {item.status === "PENDING" ? (
                                  <>
                                    <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleUpdateStatus("REJECTED")} disabled={isProcessing}>Tolak</Button>
                                    <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleUpdateStatus("ACCEPTED")} disabled={isProcessing}>{isProcessing ? "Menyimpan..." : "Terima & Simpan"}</Button>
                                  </>
                                ) : (<div className="w-full text-center text-sm text-slate-500 italic">Status pelamar ini sudah diputuskan: <strong>{item.status}</strong></div>)}
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                           {/* DIALOG END */}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>

            {/* 3. PAGINATION FOOTER */}
            <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 flex flex-col sm:flex-row justify-between items-center gap-4">
               
               {/* Left: Info & Row Selector */}
               <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                  <span>
                     Menampilkan <strong>{filteredData.length > 0 ? startIndex + 1 : 0}</strong> - <strong>{Math.min(endIndex, filteredData.length)}</strong> dari <strong>{filteredData.length}</strong> data
                  </span>
                  
                  <div className="flex items-center gap-2">
                     <span className="hidden sm:inline">| Baris:</span>
                     <Select value={itemsPerPage.toString()} onValueChange={(val) => { setItemsPerPage(Number(val)); setCurrentPage(1); }}>
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

               {/* Right: Pagination Buttons */}
               <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
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
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
               </div>
            </div>

          </Card>
        </main>
      </div>

      {/* MODAL LOGOUT */}
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
              <Button variant="destructive" className="w-full sm:w-1/2 bg-red-600 hover:bg-red-700 text-white font-semibold" onClick={handleLogoutConfirm}>Ya, Keluar</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}