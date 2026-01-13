"use client";

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
  AlertTriangle // Import icon warning
} from "lucide-react";

import { toast } from "sonner"; // Use sonner here too for consistency

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendaftar, setPendaftar] = useState<Pendaftaran[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLogoutOpen, setIsLogoutOpen] = useState(false); // State Logout

  // State Admin (Otomatis dari Session)
  const [admin, setAdmin] = useState({ username: "...", jabatan: "..." });

  // State Dialog & Approval
  const [selectedPelamar, setSelectedPelamar] = useState<Pendaftaran | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // --- 1. FETCH DATA UTAMA (PELAMAR & POSISI) ---
  const fetchData = async () => {
    try {
      const [resPendaftar, resPositions] = await Promise.all([
        fetch("/api/pendaftaran", { cache: 'no-store' }),
        fetch("/api/positions", { cache: 'no-store' }),
      ]);

      const dataPendaftar = await resPendaftar.json();
      const dataPositions = await resPositions.json();

      if(Array.isArray(dataPendaftar)) setPendaftar(dataPendaftar);
      if(Array.isArray(dataPositions)) setPositions(dataPositions);

    } catch (error) {
      console.error("Gagal ambil data:", error);
      toast.error("Gagal mengambil data.");
    } finally {
      setLoading(false);
    }
  };

  // --- 2. FETCH ADMIN SESSION ---
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

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* --- SIDEBAR --- */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0 shadow-xl`}
      >
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <h1 className="font-bold text-xl tracking-wider">Admin Panel</h1>
          <button
            className="ml-auto md:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="p-4 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
            onClick={() => router.push("/admin/dashboard")}
          >
            <LayoutDashboard className="mr-3 h-5 w-5" /> Dashboard
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-white bg-slate-800 shadow-md shadow-slate-900/20"
          >
            <FileText className="mr-3 h-5 w-5" /> Applicants
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
            onClick={() => router.push("/admin/users")}
          >
            <Users className="mr-3 h-5 w-5" /> Admin Users
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
            onClick={() => router.push("/admin/pengaturan")}
          >
            <Settings className="mr-3 h-5 w-5" /> Settings
          </Button>
          <div className="pt-8 mt-8 border-t border-slate-800">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20"
              onClick={() => setIsLogoutOpen(true)}
            >
              <LogOut className="mr-3 h-5 w-5" /> Keluar
            </Button>
          </div>
        </nav>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col min-h-screen transition-all duration-300">
        {/* HEADER */}
        <header className="bg-white border-b h-16 flex items-center px-4 md:px-8 justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2 hover:bg-slate-100 rounded"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6 text-slate-600" />
            </button>
            <h2 className="text-lg font-semibold text-slate-800">Review Pelamar</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <div className="font-bold text-sm text-slate-900">{admin.username}</div>
              <div className="text-xs text-slate-500">{admin.jabatan}</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200">
              <User className="h-6 w-6" />
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Page Title & Action */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Data Pelamar Masuk</h1>
              <p className="text-slate-500">Cek berkas dan tentukan siapa yang layak magang.</p>
            </div>
            <Button
              onClick={() => { setLoading(true); fetchData(); }}
              className="bg-blue-700 hover:bg-blue-800 text-white shadow-sm"
            >
              <RefreshCcw className="h-4 w-4 mr-2" /> Refresh Data
            </Button>
          </div>

          {/* Table Card */}
          <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-4">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <CardTitle className="text-base font-semibold text-slate-800">
                  List Pendaftar Terbaru
                </CardTitle>
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Cari nama / instansi..."
                    className="pl-9 bg-white border-slate-200 focus:ring-blue-500/20"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-100">
                    <TableHead className="w-[50px] text-center h-10">No</TableHead>
                    <TableHead className="h-10">Nama Pelamar</TableHead>
                    <TableHead className="h-10">Instansi</TableHead>
                    <TableHead className="h-10">Tgl Daftar</TableHead>
                    <TableHead className="h-10">Status</TableHead>
                    <TableHead className="text-right pr-6 h-10">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-slate-500 py-3">
                        <div className="flex justify-center items-center gap-2">
                          <Loader2 className="animate-spin h-4 w-4" /> Memuat data...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-slate-500 py-3">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-8 w-8 text-slate-300" />
                          <p>Belum ada pendaftar yang cocok.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((item, idx) => (
                      <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0">
                        <TableCell className="text-center text-slate-500 py-3">{idx + 1}</TableCell>
                        <TableCell className="font-medium py-3">
                          <div className="flex flex-col">
                            <span className="text-slate-900 text-sm">{item.namaLengkap}</span>
                            <span className="text-xs text-slate-500 truncate max-w-[150px]">
                              {item.jurusan}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600 text-sm py-3">{item.instansi}</TableCell>
                        <TableCell className="text-slate-500 text-sm py-3">
                          {new Date(item.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                        </TableCell>
                        <TableCell className="py-3">
                          {item.status === "PENDING" && (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 gap-1 font-normal text-xs py-0.5">
                              <Clock className="h-3 w-3" /> Pending
                            </Badge>
                          )}
                          {item.status === "ACCEPTED" && (
                            <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-200 gap-1 font-normal shadow-none text-xs py-0.5">
                              <CheckCircle className="h-3 w-3" /> Diterima
                            </Badge>
                          )}
                          {item.status === "REJECTED" && (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1 font-normal text-xs py-0.5">
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
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-50 text-slate-400 hover:text-blue-600">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl bg-white p-0 overflow-hidden border-slate-200">
                              <DialogHeader className="p-6 pb-2">
                                <DialogTitle className="text-xl">Detail Pendaftaran</DialogTitle>
                                <DialogDescription>Tinjau kelengkapan berkas kandidat.</DialogDescription>
                              </DialogHeader>

                              <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Info Kiri */}
                                <div className="space-y-4">
                                  <div className="space-y-1">
                                    <Label className="text-xs text-slate-500 uppercase font-semibold">Nama Lengkap</Label>
                                    <div className="text-slate-900 font-medium border-b border-slate-100 pb-1">{item.namaLengkap}</div>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs text-slate-500 uppercase font-semibold">Asal Instansi & Jurusan</Label>
                                    <div className="text-slate-900 text-sm">{item.instansi}</div>
                                    <div className="text-slate-500 text-xs">{item.jurusan}</div>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs text-slate-500 uppercase font-semibold">Rencana Magang</Label>
                                    <div className="flex items-center gap-2 text-sm text-slate-700">
                                      <Clock className="h-3 w-3 text-blue-500" />
                                      {new Date(item.tanggalMulai).toLocaleDateString()} — {new Date(item.tanggalSelesai).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>

                                {/* Info Kanan (Dokumen) */}
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
                                  <Label className="text-xs text-slate-500 uppercase font-semibold block mb-2">Lampiran Berkas</Label>
                                  <Button variant="outline" size="sm" className="w-full justify-start bg-white hover:bg-blue-50 text-slate-600 border-slate-200" asChild>
                                    <a href={item.cvPath} target="_blank" rel="noopener noreferrer">
                                      <FileText className="mr-2 h-4 w-4 text-blue-600" /> Lihat CV
                                    </a>
                                  </Button>
                                  <Button variant="outline" size="sm" className="w-full justify-start bg-white hover:bg-orange-50 text-slate-600 border-slate-200" asChild>
                                    <a href={item.suratPath} target="_blank" rel="noopener noreferrer">
                                      <FileText className="mr-2 h-4 w-4 text-orange-600" /> Surat Pengantar
                                    </a>
                                  </Button>
                                  <Button variant="outline" size="sm" className="w-full justify-start bg-white hover:bg-purple-50 text-slate-600 border-slate-200" asChild>
                                    <a href={item.fotoPath} target="_blank" rel="noopener noreferrer">
                                      <ImageIcon className="mr-2 h-4 w-4 text-purple-600" /> Lihat Pas Foto
                                    </a>
                                  </Button>
                                </div>
                              </div>

                              <Separator />

                              {/* Form Keputusan */}
                              <div className="px-6 py-4 bg-slate-50/50">
                                <div className="mb-3 flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  <span className="text-sm font-semibold text-slate-900">Keputusan Admin</span>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs text-slate-500">Tempatkan di Bidang (Wajib jika diterima)</Label>
                                  <Select
                                    value={selectedPosition}
                                    onValueChange={setSelectedPosition}
                                    disabled={item.status !== "PENDING"}
                                  >
                                    <SelectTrigger className="bg-white border-slate-300">
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

                              <DialogFooter className="p-4 bg-slate-100/50 border-t border-slate-200 gap-2 sm:gap-0">
                                {item.status === "PENDING" ? (
                                  <>
                                    <Button
                                      variant="ghost"
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => handleUpdateStatus("REJECTED")}
                                      disabled={isProcessing}
                                    >
                                      Tolak Pengajuan
                                    </Button>
                                    <Button
                                      className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                      onClick={() => handleUpdateStatus("ACCEPTED")}
                                      disabled={isProcessing}
                                    >
                                      {isProcessing ? "Menyimpan..." : "Terima & Simpan"}
                                    </Button>
                                  </>
                                ) : (
                                  <div className="w-full text-center text-sm text-slate-500 italic">
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
        <DialogContent className="sm:max-w-[400px] p-6 animate-in fade-in zoom-in-95 duration-200">
           <DialogHeader className="flex flex-col items-center text-center gap-2">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-2">
                 <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <DialogTitle className="text-xl">Konfirmasi Keluar</DialogTitle>
              <DialogDescription className="text-center">
                 Apakah Anda yakin ingin keluar dari sesi admin ini? Anda harus login kembali untuk mengakses panel.
              </DialogDescription>
           </DialogHeader>
           <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
              <Button variant="outline" className="w-full sm:w-1/2" onClick={() => setIsLogoutOpen(false)}>Batal</Button>
              <Button variant="destructive" className="w-full sm:w-1/2 bg-red-600 hover:bg-red-700 text-white font-semibold" onClick={handleLogoutConfirm}>Ya, Keluar</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}