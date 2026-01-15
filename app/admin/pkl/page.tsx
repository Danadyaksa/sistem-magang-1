"use client";

import Image from "next/image";
import { ModeToggle } from "@/components/mode-toggle";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  LogOut,
  Menu,
  X,
  Search,
  Briefcase,
  FileText,
  User,
  Settings,
  AlertTriangle,
  PanelLeftClose,
  PanelLeftOpen,
  CalendarClock,
  History,
  Clock,
  CheckCircle2,
  Hourglass,
  Plus,
  School,
  ChevronDown,
  Pencil, // Icon Edit Baru
  Loader2
} from "lucide-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// --- TIPE DATA ---
type Position = {
  id: number;
  title: string;
  quota: number;
  filled: number;
};

type Intern = {
  id: string;
  namaLengkap: string;
  instansi: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  nomorHp: string;
  positionId: number;
  cvPath?: string | null;
  statusWaktu: "UPCOMING" | "ACTIVE" | "FINISHED";
  progress: number;
  sisaHari: number;
  totalDurasi: number;
};

// --- HELPER COMPONENTS ---
const StatusBadge = ({ status, daysLeft }: { status: string, daysLeft: number }) => {
  if (status === "UPCOMING") return <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-300 px-2 py-0.5 text-[10px]">Menunggu</Badge>;
  if (status === "FINISHED") return <Badge variant="secondary" className="bg-slate-200 text-slate-700 px-2 py-0.5 text-[10px]">Alumni</Badge>;
  if (daysLeft <= 5) return <Badge variant="destructive" className="animate-pulse px-2 py-0.5 text-[10px]">Sisa {daysLeft} Hari</Badge>;
  return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200 shadow-none px-2 py-0.5 text-[10px]">Aktif</Badge>;
};

const SourceBadge = ({ path }: { path?: string | null }) => {
  if (path && (path === "-" || path.includes("manual-entry"))) {
    return <span className="text-[9px] font-bold tracking-wider text-purple-600 bg-purple-50 border border-purple-200 px-1 rounded uppercase ml-2">Manual</span>;
  }
  return <span className="text-[9px] font-bold tracking-wider text-blue-600 bg-blue-50 border border-blue-200 px-1 rounded uppercase ml-2">Web</span>;
};

// --- SUB-COMPONENT: KARTU BIDANG ---
const PositionCard = ({ 
  pos, 
  interns, 
  loading,
  onEditClick 
}: { 
  pos: Position, 
  interns: Intern[], 
  loading: boolean,
  onEditClick: (intern: Intern) => void 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-sm overflow-hidden transition-all hover:shadow-md mb-4">
      {/* HEADER: KLIK UNTUK BUKA/TUTUP */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-4 px-6 flex justify-between items-center select-none group"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-md border shadow-sm transition-colors ${isOpen ? "bg-blue-50 border-blue-100" : "bg-white border-slate-100 dark:bg-slate-800 dark:border-slate-700"}`}>
             <Briefcase className={`h-5 w-5 ${isOpen ? "text-blue-600" : "text-slate-500"}`} />
          </div>
          <div>
             <CardTitle className={`text-base font-semibold ${isOpen ? "text-blue-700 dark:text-blue-400" : "text-slate-700 dark:text-slate-200"}`}>
                {pos.title}
             </CardTitle>
             <div className="text-xs text-slate-500 mt-0.5">
                {interns.length} Data Peserta
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-white dark:bg-slate-800 font-normal hidden sm:inline-flex">
             {interns.filter(i => i.statusWaktu === "ACTIVE").length} Aktif
          </Badge>
          <div className={`text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
             <ChevronDown className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* CONTENT: HANYA MUNCUL JIKA OPEN */}
      {isOpen && (
        <CardContent className="p-0 animate-in slide-in-from-top-1 duration-200">
          <div className="overflow-x-auto w-full">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800">
                  <TableHead className="w-[50px] text-center px-6">No</TableHead>
                  <TableHead className="px-6">Nama Peserta</TableHead>
                  <TableHead className="px-6">Periode Magang</TableHead>
                  <TableHead className="w-[30%] px-6">Progress</TableHead>
                  <TableHead className="text-center px-6">Status</TableHead>
                  <TableHead className="text-right px-6">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {interns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24 text-slate-400 italic text-sm">
                        Belum ada peserta aktif di bidang ini.
                      </TableCell>
                    </TableRow>
                ) : (
                  interns.map((intern, idx) => (
                    <TableRow 
                      key={intern.id} 
                      className={`
                        border-b border-slate-50 dark:border-slate-800 last:border-0
                        ${intern.statusWaktu === 'UPCOMING' ? 'bg-slate-50/60 dark:bg-slate-900/50 text-slate-500' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}
                      `}
                    >
                      <TableCell className="text-center text-slate-500 px-6 py-4">{idx + 1}</TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="font-medium flex items-center">
                          {intern.namaLengkap}
                          <SourceBadge path={intern.cvPath} />
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <School className="h-3 w-3" /> {intern.instansi}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex flex-col text-sm">
                          <span>{new Date(intern.tanggalMulai).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })} - {new Date(intern.tanggalSelesai).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          <span className="text-xs text-slate-400 mt-0.5">Total {intern.totalDurasi} Hari</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="w-full space-y-1.5">
                          <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
                              <span>{Math.round(intern.progress)}%</span>
                              {intern.statusWaktu === "ACTIVE" && <span className="text-blue-600 dark:text-blue-400">Sisa {intern.sisaHari} Hari</span>}
                          </div>
                          <Progress value={intern.progress} className="h-2 bg-slate-100 dark:bg-slate-800 [&>div]:bg-blue-600 rounded-full" />
                        </div>
                      </TableCell>
                      <TableCell className="text-center px-6 py-4">
                        <StatusBadge status={intern.statusWaktu} daysLeft={intern.sisaHari} />
                      </TableCell>
                      <TableCell className="text-right px-6 py-4">
                        {/* TOMBOL EDIT PERPANJANG/STOP */}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => onEditClick(intern)}
                          title="Edit Tanggal / Data"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default function PKLMonitoringPage() {
  const router = useRouter();

  // --- STATE ---
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [positions, setPositions] = useState<Position[]>([]);
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [admin, setAdmin] = useState({ username: "...", jabatan: "..." });

  // --- STATE MANUAL ENTRY ---
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualForm, setManualForm] = useState({
    namaLengkap: "",
    instansi: "",
    jurusan: "",
    nomorHp: "",
    tanggalMulai: "",
    tanggalSelesai: "",
    positionId: "",
  });

  // --- STATE EDIT ENTRY ---
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingIntern, setEditingIntern] = useState<Intern | null>(null);
  const [editForm, setEditForm] = useState({
    namaLengkap: "",
    instansi: "",
    nomorHp: "",
    tanggalMulai: "",
    tanggalSelesai: "",
  });

  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState === "true") setIsSidebarCollapsed(true);
    fetchData();
    fetchAdminSession();
  }, []);

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", String(newState));
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
    } catch (error) { console.error("Auth error", error); }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resPendaftar, resPositions] = await Promise.all([
        fetch("/api/pendaftaran", { cache: "no-store" }),
        fetch("/api/positions", { cache: "no-store" }),
      ]);

      const rawInterns = await resPendaftar.json();
      const rawPositions = await resPositions.json();

      if (Array.isArray(rawPositions)) setPositions(rawPositions);

      if (Array.isArray(rawInterns)) {
        const acceptedInterns = rawInterns
          .filter((item: any) => item.status === "ACCEPTED" && item.positionId !== null)
          .map((item: any) => {
            const start = new Date(item.tanggalMulai).getTime();
            const end = new Date(item.tanggalSelesai).getTime();
            const now = new Date().getTime();

            let statusWaktu: "UPCOMING" | "ACTIVE" | "FINISHED" = "ACTIVE";
            if (now < start) statusWaktu = "UPCOMING";
            else if (now > end) statusWaktu = "FINISHED";

            const totalDuration = end - start;
            const elapsed = now - start;
            let progress = 0;
            if (statusWaktu === "FINISHED") progress = 100;
            else if (statusWaktu === "ACTIVE") {
               progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
            }

            const oneDay = 24 * 60 * 60 * 1000;
            const sisaHari = Math.ceil((end - now) / oneDay);

            return {
              ...item,
              statusWaktu,
              progress,
              sisaHari,
              totalDurasi: Math.ceil(totalDuration / oneDay)
            };
          });

        setInterns(acceptedInterns);
      }
    } catch (error) {
      toast.error("Gagal memuat data PKL.");
    } finally {
      setLoading(false);
    }
  };

  const groupedData = useMemo(() => {
    const filtered = interns.filter(i => 
      i.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) || 
      i.instansi.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groups: Record<number, Intern[]> = {};
    positions.forEach(pos => { groups[pos.id] = [] });

    filtered.forEach(intern => {
      if (groups[intern.positionId]) {
        groups[intern.positionId].push(intern);
      }
    });

    return groups;
  }, [interns, positions, searchTerm]);

  const handleManualSubmit = async () => {
    if (!manualForm.namaLengkap || !manualForm.instansi || !manualForm.tanggalMulai || !manualForm.tanggalSelesai || !manualForm.positionId) {
      toast.warning("Mohon lengkapi semua field bertanda bintang (*)");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("namaLengkap", manualForm.namaLengkap);
      formData.append("instansi", manualForm.instansi);
      formData.append("jurusan", manualForm.jurusan || "-");
      formData.append("nomorHp", manualForm.nomorHp || "-");
      formData.append("tanggalMulai", manualForm.tanggalMulai);
      formData.append("tanggalSelesai", manualForm.tanggalSelesai);
      
      const dummyBlob = new Blob(["dummy"], { type: "text/plain" });
      formData.set("cv", dummyBlob, "manual-entry.txt"); 
      formData.set("surat", dummyBlob, "manual-entry.txt");
      formData.set("foto", dummyBlob, "manual-entry.txt");

      const resCreate = await fetch("/api/pendaftaran", {
        method: "POST",
        body: formData,
      });

      if (!resCreate.ok) {
        const errorData = await resCreate.json();
        throw new Error(errorData.error || "Gagal membuat data");
      }
      
      const newData = await resCreate.json(); 

      if (newData.data && newData.data.id) {
          const resUpdate = await fetch(`/api/pendaftaran/${newData.data.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: "ACCEPTED",
              positionId: manualForm.positionId
            }),
          });

          if (!resUpdate.ok) {
             const errorUpdate = await resUpdate.json();
             throw new Error(errorUpdate.error || "Gagal update status");
          }

          toast.success("Peserta manual berhasil ditambahkan!");
          setIsManualOpen(false);
          setManualForm({ namaLengkap: "", instansi: "", jurusan: "", nomorHp: "", tanggalMulai: "", tanggalSelesai: "", positionId: "" });
          fetchData(); 
      } else {
          throw new Error("Gagal mendapatkan ID data baru");
      }

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Terjadi kesalahan saat menyimpan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (intern: Intern) => {
    setEditingIntern(intern);
    setEditForm({
      namaLengkap: intern.namaLengkap,
      instansi: intern.instansi,
      nomorHp: intern.nomorHp,
      tanggalMulai: new Date(intern.tanggalMulai).toISOString().split('T')[0],
      tanggalSelesai: new Date(intern.tanggalSelesai).toISOString().split('T')[0],
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingIntern) return;
    if (!editForm.namaLengkap || !editForm.tanggalMulai || !editForm.tanggalSelesai) {
      toast.warning("Nama dan Tanggal wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/pendaftaran/${editingIntern.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namaLengkap: editForm.namaLengkap,
          instansi: editForm.instansi,
          nomorHp: editForm.nomorHp,
          tanggalMulai: editForm.tanggalMulai,
          tanggalSelesai: editForm.tanggalSelesai,
        }),
      });

      if (!res.ok) throw new Error("Gagal mengupdate data");

      toast.success("Data berhasil diperbarui!");
      setIsEditOpen(false);
      setEditingIntern(null);
      fetchData(); 
    } catch (error) {
      toast.error("Gagal update data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoutConfirm = async () => {
    setIsLogoutOpen(false);
    const promise = fetch("/api/auth/logout", { method: "POST" });
    toast.promise(promise, {
      loading: 'Sedang keluar...',
      success: () => { router.push("/admin/login"); return 'Berhasil logout'; },
      error: 'Gagal logout',
    });
  };

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
          <SidebarItem icon={FileText} label="Applicants" onClick={() => router.push("/admin/applicants")} />
          <SidebarItem icon={CalendarClock} label="Daftar PKL" active={true} />
          <SidebarItem icon={Users} label="Admin Users" onClick={() => router.push("/admin/users")} />
          <SidebarItem icon={Settings} label="Settings" onClick={() => router.push("/admin/pengaturan")} />
          <div className={`pt-4 mt-4 border-t border-slate-800 ${isSidebarCollapsed ? "mx-2" : ""}`}>
            <SidebarItem icon={LogOut} label="Keluar" className="text-red-400 hover:text-red-300 hover:bg-red-900/20" onClick={() => setIsLogoutOpen(true)} />
          </div>
        </nav>
      </aside>

      {/* CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="bg-white dark:bg-slate-950 border-b dark:border-slate-800 h-16 flex items-center px-4 md:px-8 justify-between shadow-sm transition-colors duration-300 flex-none z-40">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded" onClick={() => setSidebarOpen(true)}><Menu className="h-6 w-6 text-slate-600 dark:text-slate-200" /></button>
            <button className="hidden md:flex p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors" onClick={toggleSidebar} title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}>
                {isSidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Monitoring PKL</h2>
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

        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
          
          <div className="max-w-4xl mx-auto w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Daftar Anak PKL</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Pantau progres magang, sisa hari, dan status keaktifan.</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch sm:items-center">
                 <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="Cari nama / instansi..." 
                      className="pl-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 focus:ring-blue-500" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                 </div>
                 <Button 
                   onClick={() => setIsManualOpen(true)} 
                   className="bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 shadow-lg shadow-blue-700/20 transition-all hover:scale-105 text-white"
                 >
                   <Plus className="h-4 w-4 mr-2" /> <span>Tambah Manual</span>
                 </Button>
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto w-full">
            <Tabs defaultValue="active" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1 mb-6 rounded-lg h-12 shadow-sm transition-colors">
                <TabsTrigger 
                  value="active" 
                  className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 font-medium rounded-md h-full transition-all dark:text-slate-400"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Sedang Magang
                </TabsTrigger>
                <TabsTrigger 
                  value="history" 
                  className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 font-medium rounded-md h-full transition-all dark:text-slate-400"
                >
                  <History className="w-4 h-4 mr-2" />
                  Riwayat / Alumni
                </TabsTrigger>
              </TabsList>

              {/* TAB: SEDANG MAGANG */}
              <TabsContent value="active" className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                {loading ? (
                   <div className="flex justify-center items-center gap-2"><Loader2 className="animate-spin h-4 w-4" /> Memuat data...</div>
                ) : positions.length === 0 ? (
                   <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">Belum ada data posisi.</div>
                ) : (
                  positions.map((pos) => {
                    const activeInterns = groupedData[pos.id]?.filter(i => i.statusWaktu === "ACTIVE" || i.statusWaktu === "UPCOMING") || [];
                    if (activeInterns.length === 0 && searchTerm) return null;

                    return <PositionCard key={pos.id} pos={pos} interns={activeInterns} loading={loading} onEditClick={handleEditClick} />;
                  })
                )}
              </TabsContent>

              {/* TAB: RIWAYAT / ALUMNI */}
              <TabsContent value="history" className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                {loading ? (
                   <div className="flex justify-center h-40 items-center"><Hourglass className="animate-spin text-slate-400" /></div>
                ) : (
                  <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800 py-4 px-6">
                      <CardTitle className="text-lg">Arsip Alumni Magang</CardTitle>
                      <CardDescription>Daftar peserta yang telah menyelesaikan masa magang.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto w-full">
                        <Table className="min-w-[800px]">
                            <TableHeader>
                              <TableRow className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/40">
                                <TableHead className="w-[60px] text-center h-12 px-6">No</TableHead>
                                <TableHead className="h-12 px-6">Nama Peserta</TableHead>
                                <TableHead className="h-12 px-6">Bidang</TableHead>
                                <TableHead className="h-12 px-6">Tanggal Selesai</TableHead>
                                <TableHead className="text-right h-12 px-6">Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {interns.filter(i => i.statusWaktu === "FINISHED").length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center h-32 text-slate-500">Belum ada alumni.</TableCell></TableRow>
                              ) : (
                                interns.filter(i => i.statusWaktu === "FINISHED").map((intern, idx) => {
                                  const posName = positions.find(p => p.id === intern.positionId)?.title || "-";
                                  return (
                                    <TableRow key={intern.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-50 dark:border-slate-800 last:border-0">
                                      <TableCell className="text-center text-slate-500 px-6 py-4">{idx + 1}</TableCell>
                                      <TableCell className="px-6 py-4">
                                        <div className="font-medium flex items-center gap-2">
                                          {intern.namaLengkap}
                                          <SourceBadge path={intern.cvPath} />
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1">{intern.instansi}</div>
                                      </TableCell>
                                      <TableCell className="px-6 py-4"><Badge variant="outline" className="font-normal bg-white dark:bg-slate-900">{posName}</Badge></TableCell>
                                      <TableCell className="text-slate-600 text-sm px-6 py-4">
                                        {new Date(intern.tanggalSelesai).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
                                      </TableCell>
                                      <TableCell className="text-right px-6 py-4">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                          <CheckCircle2 className="h-3.5 w-3.5" /> Selesai
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })
                              )}
                            </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* --- DIALOG INPUT MANUAL --- */}
      <Dialog open={isManualOpen} onOpenChange={setIsManualOpen}>
        <DialogContent className="max-w-lg dark:bg-slate-950 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle>Input Peserta Manual (Jalur Offline/SMK)</DialogTitle>
            <DialogDescription>
              Data ini akan langsung masuk sebagai peserta aktif tanpa perlu upload berkas.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Nama Lengkap <span className="text-red-500">*</span></Label>
              <Input 
                value={manualForm.namaLengkap} 
                onChange={(e) => setManualForm({...manualForm, namaLengkap: e.target.value})}
                placeholder="Contoh: Budi Santoso"
                className="dark:bg-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Asal Sekolah / Kampus <span className="text-red-500">*</span></Label>
                <Input 
                  value={manualForm.instansi} 
                  onChange={(e) => setManualForm({...manualForm, instansi: e.target.value})}
                  placeholder="SMK N 2 Depok..."
                  className="dark:bg-slate-900"
                />
              </div>
              <div className="grid gap-2">
                <Label>Jurusan</Label>
                <Input 
                  value={manualForm.jurusan} 
                  onChange={(e) => setManualForm({...manualForm, jurusan: e.target.value})}
                  placeholder="TKJ"
                  className="dark:bg-slate-900"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Nomor HP / WA</Label>
              <Input 
                value={manualForm.nomorHp} 
                onChange={(e) => setManualForm({...manualForm, nomorHp: e.target.value})}
                placeholder="0812..."
                type="tel"
                className="dark:bg-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Tanggal Mulai <span className="text-red-500">*</span></Label>
                <Input 
                  type="date"
                  value={manualForm.tanggalMulai} 
                  onChange={(e) => setManualForm({...manualForm, tanggalMulai: e.target.value})}
                  className="dark:bg-slate-900"
                />
              </div>
              <div className="grid gap-2">
                <Label>Tanggal Selesai <span className="text-red-500">*</span></Label>
                <Input 
                  type="date"
                  value={manualForm.tanggalSelesai} 
                  onChange={(e) => setManualForm({...manualForm, tanggalSelesai: e.target.value})}
                  className="dark:bg-slate-900"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Tempatkan di Bidang <span className="text-red-500">*</span></Label>
              <Select 
                value={manualForm.positionId} 
                onValueChange={(val) => setManualForm({...manualForm, positionId: val})}
              >
                <SelectTrigger className="dark:bg-slate-900">
                  <SelectValue placeholder="-- Pilih Bidang --" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((pos) => (
                    <SelectItem key={pos.id} value={pos.id.toString()}>
                      {pos.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManualOpen(false)}>Batal</Button>
            <Button onClick={handleManualSubmit} disabled={isSubmitting} className="bg-blue-700 hover:bg-blue-800 text-white">
              {isSubmitting ? "Menyimpan..." : "Simpan Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- DIALOG EDIT PESERTA (BARU) --- */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg dark:bg-slate-950 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle>Edit Data Peserta</DialogTitle>
            <DialogDescription>
              Ubah data peserta atau perpanjang/akhiri masa magang.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Nama Lengkap</Label>
              <Input 
                value={editForm.namaLengkap} 
                onChange={(e) => setEditForm({...editForm, namaLengkap: e.target.value})}
                className="dark:bg-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Instansi</Label>
                <Input 
                  value={editForm.instansi} 
                  onChange={(e) => setEditForm({...editForm, instansi: e.target.value})}
                  className="dark:bg-slate-900"
                />
              </div>
              <div className="grid gap-2">
                <Label>Nomor HP</Label>
                <Input 
                  value={editForm.nomorHp} 
                  onChange={(e) => setEditForm({...editForm, nomorHp: e.target.value})}
                  className="dark:bg-slate-900"
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-800">
              <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                <CalendarClock className="h-4 w-4" /> Atur Masa Magang
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1">
                  <Label className="text-xs text-slate-500">Mulai</Label>
                  <Input 
                    type="date"
                    value={editForm.tanggalMulai} 
                    onChange={(e) => setEditForm({...editForm, tanggalMulai: e.target.value})}
                    className="bg-white dark:bg-slate-950 h-9"
                  />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs text-slate-500">Selesai (Ubah untuk Stop/Extend)</Label>
                  <Input 
                    type="date"
                    value={editForm.tanggalSelesai} 
                    onChange={(e) => setEditForm({...editForm, tanggalSelesai: e.target.value})}
                    className="bg-white dark:bg-slate-950 h-9"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Batal</Button>
            <Button onClick={handleEditSubmit} disabled={isSubmitting} className="bg-blue-700 hover:bg-blue-800 text-white">
              {isSubmitting ? "Menyimpan..." : "Update Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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