"use client";

import Image from "next/image"; 
import { ModeToggle } from "@/components/mode-toggle";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  PanelLeftOpen   
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

export default function ApplicantsPage() {
  const router = useRouter();

  // --- STATE ---
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Desktop Minimize
  const [pendaftar, setPendaftar] = useState<Pendaftaran[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  // State Admin
  const [admin, setAdmin] = useState({ username: "...", jabatan: "..." });

  // State Dialog & Approval
  const [selectedPelamar, setSelectedPelamar] = useState<Pendaftaran | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // --- 1. CEK LOCAL STORAGE SAAT PERTAMA LOAD ---
  useEffect(() => {
    // Cek apakah user sebelumnya me-minimize sidebar
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState === "true") {
      setIsSidebarCollapsed(true);
    }
  }, []);

  // --- FUNGSI TOGGLE SIDEBAR + SIMPAN KE STORAGE ---
  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    // Simpan status baru ke local storage
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

  // --- 3. FETCH ADMIN SESSION ---
  const fetchAdminSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (res.ok) {
        setAdmin({
          username: data.username,
          jabatan: data.jabatan || "Administrator"
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

  // --- LOGIC ACTIONS ---
  const handleLogoutConfirm = async () => {
    setIsLogoutOpen(false);
    const promise = fetch("/api/auth/logout", { method: "POST" });
    toast.promise(promise, {
      loading: 'Sedang keluar...',
      success: () => {
        router.push("/admin/login");
        return 'Berhasil logout';
      },
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
        fetchData(); // Refresh data table
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

  const filteredData = pendaftar.filter(
    (item) =>
      item.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.instansi.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              ${active 
                ? "bg-slate-800 text-white shadow-md shadow-slate-900/20" 
                : "text-slate-300 hover:text-white hover:bg-slate-800"
              }
              ${className}
            `}
          >
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
    // FIX LAYOUT
    <div className="h-screen w-full bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300 overflow-hidden">
      
      {/* SIDEBAR */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 bg-slate-900 text-white shadow-xl flex flex-col h-full transition-all duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
          md:relative md:translate-x-0 
          ${isSidebarCollapsed ? "w-20" : "w-64"}
        `}
      >
        {/* Sidebar Header */}
        <div className={`h-16 flex items-center border-b border-slate-800 flex-none ${isSidebarCollapsed ? "justify-center px-0" : "px-6 gap-3"}`}>
          
          <div className="flex items-center justify-center">
             <Image 
               src="/logo-disdikpora.png" 
               alt="Logo Disdikpora" 
               width={isSidebarCollapsed ? 28 : 32} 
               height={isSidebarCollapsed ? 28 : 32} 
               className="object-contain transition-all duration-300"
             />
          </div>
          
          {!isSidebarCollapsed && (
            <h1 className="font-bold text-xl tracking-wider truncate animate-in fade-in duration-300">
              Dinas DIKPORA
            </h1>
          )}
          
          <button className="ml-auto md:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Menu */}
        <nav className="p-3 space-y-2 flex-1 overflow-y-auto overflow-x-hidden">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            onClick={() => router.push("/admin/dashboard")}
          />
          <SidebarItem 
            icon={FileText} 
            label="Applicants" 
            active={true} 
          />
          <SidebarItem 
            icon={Users} 
            label="Admin Users" 
            onClick={() => router.push("/admin/users")} 
          />
          <SidebarItem 
            icon={Settings} 
            label="Settings" 
            onClick={() => router.push("/admin/pengaturan")} 
          />
          
          <div className={`pt-4 mt-4 border-t border-slate-800 ${isSidebarCollapsed ? "mx-2" : ""}`}>
            <SidebarItem 
              icon={LogOut} 
              label="Keluar" 
              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
              onClick={() => setIsLogoutOpen(true)} 
            />
          </div>
        </nav>
      </aside>

      {/* CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* HEADER */}
        <header className="bg-white dark:bg-slate-950 border-b dark:border-slate-800 h-16 flex items-center px-4 md:px-8 justify-between shadow-sm transition-colors duration-300 flex-none z-40">
          <div className="flex items-center gap-4">
            {/* Hamburger Mobile */}
            <button className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-6 w-6 text-slate-600 dark:text-slate-200" />
            </button>

            {/* Tombol Minimize Sidebar (Desktop) - WITH SAVE FUNCTION */}
            <button 
                className="hidden md:flex p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                onClick={toggleSidebar} // <-- Panggil fungsi toggleSidebar yg baru
                title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
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
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
          {/* Page Title & Action */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Data Pelamar Masuk</h1>
              <p className="text-slate-500 dark:text-slate-400">Cek berkas dan tentukan siapa yang layak magang.</p>
            </div>
            <Button
              onClick={() => { setLoading(true); fetchData(); }}
              className="bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white shadow-sm"
            >
              <RefreshCcw className="h-4 w-4 mr-2" /> Refresh Data
            </Button>
          </div>

          {/* Table Card */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden transition-colors">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 py-4">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-100">
                  List Pendaftar Terbaru
                </CardTitle>
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Cari nama / instansi..."
                    className="pl-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 dark:text-slate-100 focus:ring-blue-500/20"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                    <TableHead className="w-[50px] text-center h-10 dark:text-slate-400">No</TableHead>
                    <TableHead className="h-10 dark:text-slate-400">Nama Pelamar</TableHead>
                    <TableHead className="h-10 dark:text-slate-400">Instansi</TableHead>
                    <TableHead className="h-10 dark:text-slate-400">Tgl Daftar</TableHead>
                    <TableHead className="h-10 dark:text-slate-400">Status</TableHead>
                    <TableHead className="text-right pr-6 h-10 dark:text-slate-400">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-slate-500 dark:text-slate-400 py-3">
                        <div className="flex justify-center items-center gap-2">
                          <Loader2 className="animate-spin h-4 w-4" /> Memuat data...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-slate-500 dark:text-slate-400 py-3">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                          <p>Belum ada pendaftar yang cocok.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((item, idx) => (
                      <TableRow key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0">
                        <TableCell className="text-center text-slate-500 dark:text-slate-400 py-3">{idx + 1}</TableCell>
                        <TableCell className="font-medium py-3">
                          <div className="flex flex-col">
                            <span className="text-slate-900 dark:text-slate-100 text-sm">{item.namaLengkap}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                              {item.jurusan}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-300 text-sm py-3">{item.instansi}</TableCell>
                        <TableCell className="text-slate-500 dark:text-slate-400 text-sm py-3">
                          {new Date(item.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                        </TableCell>
                        <TableCell className="py-3">
                          {item.status === "PENDING" && (
                            <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800 gap-1 font-normal text-xs py-0.5">
                              <Clock className="h-3 w-3" /> Pending
                            </Badge>
                          )}
                          {item.status === "ACCEPTED" && (
                            <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-200 dark:hover:bg-green-900/40 gap-1 font-normal shadow-none text-xs py-0.5">
                              <CheckCircle className="h-3 w-3" /> Diterima
                            </Badge>
                          )}
                          {item.status === "REJECTED" && (
                            <Badge variant="outline" className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 gap-1 font-normal text-xs py-0.5">
                              <XCircle className="h-3 w-3" /> Ditolak
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-4 py-3">
                          {/* --- DIALOG DETAIL --- */}
                          <Dialog
                            open={isDialogOpen && selectedPelamar?.id === item.id}
                            onOpenChange={(open) => {
                              setIsDialogOpen(open);
                              if (open) {
                                setSelectedPelamar(item);
                                setSelectedPosition(item.positionId?.toString() || "");
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl bg-white dark:bg-slate-950 p-0 overflow-hidden border-slate-200 dark:border-slate-800">
                              <DialogHeader className="p-6 pb-2">
                                <DialogTitle className="text-xl dark:text-slate-100">Detail Pendaftaran</DialogTitle>
                                <DialogDescription className="dark:text-slate-400">Tinjau kelengkapan berkas kandidat.</DialogDescription>
                              </DialogHeader>

                              <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Info Kiri */}
                                <div className="space-y-4">
                                  <div className="space-y-1">
                                    <Label className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Nama Lengkap</Label>
                                    <div className="text-slate-900 dark:text-slate-100 font-medium border-b border-slate-100 dark:border-slate-800 pb-1">{item.namaLengkap}</div>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Asal Instansi & Jurusan</Label>
                                    <div className="text-slate-900 dark:text-slate-100 text-sm">{item.instansi}</div>
                                    <div className="text-slate-500 dark:text-slate-400 text-xs">{item.jurusan}</div>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Rencana Magang</Label>
                                    <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                      <Clock className="h-3 w-3 text-blue-500" />
                                      {new Date(item.tanggalMulai).toLocaleDateString()} — {new Date(item.tanggalSelesai).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>

                                {/* Info Kanan (Dokumen) */}
                                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-100 dark:border-slate-800 space-y-3">
                                  <Label className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold block mb-2">Lampiran Berkas</Label>
                                  <Button variant="outline" size="sm" className="w-full justify-start bg-white dark:bg-slate-950 hover:bg-blue-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700" asChild>
                                    <a href={item.cvPath} target="_blank" rel="noopener noreferrer">
                                      <FileText className="mr-2 h-4 w-4 text-blue-600" /> Lihat CV
                                    </a>
                                  </Button>
                                  <Button variant="outline" size="sm" className="w-full justify-start bg-white dark:bg-slate-950 hover:bg-orange-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700" asChild>
                                    <a href={item.suratPath} target="_blank" rel="noopener noreferrer">
                                      <FileText className="mr-2 h-4 w-4 text-orange-600" /> Surat Pengantar
                                    </a>
                                  </Button>
                                  <Button variant="outline" size="sm" className="w-full justify-start bg-white dark:bg-slate-950 hover:bg-purple-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700" asChild>
                                    <a href={item.fotoPath} target="_blank" rel="noopener noreferrer">
                                      <ImageIcon className="mr-2 h-4 w-4 text-purple-600" /> Lihat Pas Foto
                                    </a>
                                  </Button>
                                </div>
                              </div>

                              <Separator className="dark:bg-slate-800" />

                              {/* Form Keputusan */}
                              <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50">
                                <div className="mb-3 flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Keputusan Admin</span>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs text-slate-500 dark:text-slate-400">Tempatkan di Bidang (Wajib jika diterima)</Label>
                                  <Select
                                    value={selectedPosition}
                                    onValueChange={setSelectedPosition}
                                    disabled={item.status !== "PENDING"}
                                  >
                                    <SelectTrigger className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 dark:text-slate-100">
                                      <SelectValue placeholder="-- Pilih Posisi Magang --" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {positions.map((pos) => (
                                        <SelectItem key={pos.id} value={pos.id.toString()}>
                                          {pos.title} <span className="text-slate-400 text-xs ml-2">(Sisa: {pos.quota - pos.filled})</span>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <DialogFooter className="p-4 bg-slate-100/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 gap-2 sm:gap-0">
                                {item.status === "PENDING" ? (
                                  <>
                                    <Button
                                      variant="ghost"
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                      onClick={() => handleUpdateStatus("REJECTED")}
                                      disabled={isProcessing}
                                    >
                                      Tolak Pengajuan
                                    </Button>
                                    <Button
                                      className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white shadow-sm"
                                      onClick={() => handleUpdateStatus("ACCEPTED")}
                                      disabled={isProcessing}
                                    >
                                      {isProcessing ? "Menyimpan..." : "Terima & Simpan"}
                                    </Button>
                                  </>
                                ) : (
                                  <div className="w-full text-center text-sm text-slate-500 dark:text-slate-400 italic">
                                    Status pelamar ini sudah diputuskan: <strong>{item.status}</strong>
                                  </div>
                                )}
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
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