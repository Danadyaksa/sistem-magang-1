"use client";

import Image from "next/image"; 
import { ModeToggle } from "@/components/mode-toggle";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Briefcase, LogOut, Menu, Settings, X, Plus,
  Search, Pencil, Trash2, CalendarClock, FileText, User, Loader2,
  AlertTriangle, PanelLeftClose, PanelLeftOpen, ArrowUpDown, ArrowUp, ArrowDown,
  BookOpen, Building2, CalendarDays, MapPin, CalendarIcon
} from "lucide-react";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar"; 
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format, getYear, getMonth } from "date-fns";
import { id as idLocale } from "date-fns/locale";

// --- TYPES ---
type Position = {
  id: number;
  title: string;
  filled: number;
  quota: number;
};

type UPT = {
  id: number;
  name: string;
  address?: string; 
};

type Holiday = {
  id: string; 
  date: string; 
  description: string;
};

// Tipe untuk konfirmasi hapus
type DeleteState = {
    isOpen: boolean;
    type: "position" | "upt" | "holiday" | null;
    id: string | number | null;
    title: string; // Untuk menampilkan nama item yang akan dihapus di dialog
};

export default function AdminDashboard() {
  const router = useRouter();

  // --- GLOBAL STATE ---
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [admin, setAdmin] = useState({ username: "...", jabatan: "..." });

  // --- DATA STATE ---
  const [positions, setPositions] = useState<Position[]>([]);
  const [upts, setUpts] = useState<UPT[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [minDaysSetting, setMinDaysSetting] = useState("44"); // State untuk minimal hari

  // --- TAB & FILTER STATE ---
  const [activeTab, setActiveTab] = useState("positions");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  // Filter Hari Libur (Settings Style)
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [selectedHolidayIds, setSelectedHolidayIds] = useState<string[]>([]);
  const [isDeleteMassOpen, setIsDeleteMassOpen] = useState(false);

  // --- MODAL STATE ---
  const [isPositionDialogOpen, setIsPositionDialogOpen] = useState(false);
  const [isUptDialogOpen, setIsUptDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // --- DELETE CONFIRMATION STATE (NEW) ---
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteState>({
    isOpen: false,
    type: null,
    id: null,
    title: "",
  });

  // --- FORMS ---
  const [positionForm, setPositionForm] = useState({ title: "", quota: 3 });
  const [uptForm, setUptForm] = useState({ name: "", address: "" });
  
  // Form Hari Libur (Advanced Multi-select)
  const [newHolidayDates, setNewHolidayDates] = useState<Date[] | undefined>([]);

  // --- 1. SETUP & FETCH ---
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState === "true") setIsSidebarCollapsed(true);
    
    Promise.all([
        fetchAdminProfile(),
        fetchPositions(),
        fetchUpts(),
        fetchHolidays(),
        fetchSettings() // Fetch pengaturan sistem
    ]).finally(() => setIsLoading(false));
  }, []);

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", String(newState));
  };

  // --- FETCHERS ---
  const fetchAdminProfile = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (res.ok) setAdmin({ username: data.username, jabatan: data.jabatan || "Administrator" });
      else router.push("/admin/login");
    } catch (e) { console.error(e); }
  };

  const fetchPositions = async () => {
    try {
      const res = await fetch("/api/positions", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) setPositions(data);
    } catch (e) { console.error(e); }
  };

  const fetchUpts = async () => {
    try {
      const res = await fetch("/api/upt", { cache: "no-store" }); 
      if(res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setUpts(data);
      }
    } catch (e) { console.error(e); }
  };

  const fetchHolidays = async () => {
    try {
      const res = await fetch("/api/holidays", { cache: "no-store" });
      if(res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setHolidays(data);
      }
    } catch (error) { console.error("Gagal ambil hari libur", error); }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings?key=MIN_MAGANG_DAYS");
      if (res.ok) {
        const data = await res.json();
        if (data.value) setMinDaysSetting(data.value);
      }
    } catch (err) {
      console.error("Gagal load setting:", err);
    }
  };

  // --- LOGIC SORTING POSISI ---
  const getStatusWeight = (filled: number, quota: number) => {
    if (filled >= quota) return 3; 
    if (quota - filled <= 1) return 2;
    return 1;
  };

  const processedPositions = useMemo(() => {
    let data = positions.filter((p) => p.title.toLowerCase().includes(searchTerm.toLowerCase()));
    if (sortConfig !== null) {
      data.sort((a, b) => {
        let aValue: any;
        let bValue: any;
        if (sortConfig.key === 'title') {
            aValue = a.title.toLowerCase();
            bValue = b.title.toLowerCase();
        } else if (sortConfig.key === 'filled') {
            aValue = a.filled;
            bValue = b.filled;
        } else if (sortConfig.key === 'status') {
            aValue = getStatusWeight(a.filled, a.quota);
            bValue = getStatusWeight(b.filled, b.quota);
        }
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [positions, searchTerm, sortConfig]);

  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // --- LOGIC FILTERING HARI LIBUR ---
  const filteredHolidays = useMemo(() => {
    return holidays
      .filter((h) => {
        const date = new Date(h.date);
        const matchYear = filterYear === "all" || getYear(date).toString() === filterYear;
        const matchMonth = filterMonth === "all" || (getMonth(date) + 1).toString() === filterMonth;
        return matchYear && matchMonth;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [holidays, filterYear, filterMonth]);

  const availableYears = useMemo(() => {
    const years = holidays.map(h => getYear(new Date(h.date)).toString());
    const uniqueYears = Array.from(new Set([...years, new Date().getFullYear().toString()]));
    return uniqueYears.sort((a, b) => b.localeCompare(a));
  }, [holidays]);

  const toggleSelectHoliday = (id: string) => {
    setSelectedHolidayIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllHolidays = () => {
    if (selectedHolidayIds.length === filteredHolidays.length && filteredHolidays.length > 0) {
      setSelectedHolidayIds([]);
    } else {
      setSelectedHolidayIds(filteredHolidays.map(h => h.id));
    }
  };

  // --- CRUD HANDLERS ---
  
  const handleSavePosition = async () => {
    if (!positionForm.title.trim()) return toast.warning("Nama bidang wajib diisi");
    setIsSubmitting(true);
    try {
        const url = editingId ? `/api/positions/${editingId}` : "/api/positions";
        const method = editingId ? "PUT" : "POST";
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(positionForm),
        });
        if (!res.ok) throw new Error();
        await fetchPositions();
        setIsPositionDialogOpen(false);
        toast.success(editingId ? "Posisi diperbarui" : "Posisi ditambahkan");
    } catch (e) { toast.error("Gagal menyimpan posisi"); }
    finally { setIsSubmitting(false); }
  };

  // TRIGGER DELETE (Membuka Dialog)
  const openDeleteDialog = (type: "position" | "upt" | "holiday", id: string | number, title: string) => {
      setDeleteConfirm({ isOpen: true, type, id, title });
  };

  // EKSEKUSI HAPUS (Dipanggil dari dalam Dialog)
  const confirmDelete = async () => {
      if (!deleteConfirm.id || !deleteConfirm.type) return;
      
      setIsSubmitting(true);
      try {
          let url = "";
          let successMsg = "";
          
          if (deleteConfirm.type === "position") {
              url = `/api/positions/${deleteConfirm.id}`;
              successMsg = "Posisi berhasil dihapus";
          } else if (deleteConfirm.type === "upt") {
              url = `/api/upt/${deleteConfirm.id}`;
              successMsg = "Unit UPT berhasil dihapus";
          } else if (deleteConfirm.type === "holiday") {
              url = `/api/holidays/${deleteConfirm.id}`;
              successMsg = "Tanggal libur berhasil dihapus";
          }

          const res = await fetch(url, { method: "DELETE" });
          if (!res.ok) throw new Error("Gagal menghapus");

          toast.success(successMsg);
          
          // Refresh Data
          if (deleteConfirm.type === "position") fetchPositions();
          else if (deleteConfirm.type === "upt") fetchUpts();
          else if (deleteConfirm.type === "holiday") fetchHolidays();
          
      } catch (error) {
          toast.error("Terjadi kesalahan saat menghapus data");
      } finally {
          setIsSubmitting(false);
          setDeleteConfirm({ isOpen: false, type: null, id: null, title: "" });
      }
  };

  const handleSaveUpt = async () => {
    if (!uptForm.name.trim()) return toast.warning("Nama UPT wajib diisi");
    setIsSubmitting(true);
    try {
        const url = editingId ? `/api/upt/${editingId}` : "/api/upt"; 
        const method = editingId ? "PUT" : "POST";
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(uptForm),
        });
        if (!res.ok) throw new Error();
        await fetchUpts();
        setIsUptDialogOpen(false);
        toast.success(editingId ? "UPT diperbarui" : "UPT ditambahkan");
    } catch (e) { toast.error("Gagal menyimpan UPT"); }
    finally { setIsSubmitting(false); }
  };

  // HANDLER HARI LIBUR (MULTI DATE)
  const handleAddHolidays = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayDates || newHolidayDates.length === 0) {
      toast.warning("Pilih minimal satu tanggal di kalender!");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          dates: newHolidayDates,
          description: "-" 
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${newHolidayDates.length} Tanggal libur berhasil ditambahkan`);
      setNewHolidayDates([]);
      fetchHolidays(); 
    } catch (error) {
      toast.error("Gagal menambah data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMassHolidays = async () => {
    if (selectedHolidayIds.length === 0) return;
    setIsSubmitting(true);
    try {
      const deletePromises = selectedHolidayIds.map(id => 
        fetch(`/api/holidays/${id}`, { method: "DELETE" })
      );
      await Promise.all(deletePromises);
      toast.success(`${selectedHolidayIds.length} Data berhasil dihapus`);
      fetchHolidays();
      setSelectedHolidayIds([]);
    } catch (error) {
      toast.error("Gagal menghapus data");
    } finally {
      setIsSubmitting(false);
      setIsDeleteMassOpen(false);
    }
  };

  // HANDLER PENGATURAN SISTEM
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "MIN_MAGANG_DAYS", value: String(minDaysSetting) })
      });
      if (!res.ok) throw new Error("Gagal menyimpan pengaturan");
      toast.success("Minimal hari magang berhasil diperbarui!");
    } catch (error) {
      toast.error("Terjadi kesalahan sistem, pastikan tabel database sudah siap.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoutConfirm = async () => {
    setIsLogoutOpen(false);
    toast.promise(fetch("/api/auth/logout", { method: "POST" }), {
      loading: 'Keluar...',
      success: () => { router.push("/admin/login"); return 'Berhasil logout'; },
      error: 'Gagal logout',
    });
  };

  const SidebarItem = ({ icon: Icon, label, active = false, onClick, className = "" }: any) => (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button variant="ghost" onClick={onClick} className={cn("w-full flex items-center transition-all duration-200", isSidebarCollapsed ? "justify-center px-2" : "justify-start px-4", active ? "bg-slate-800 text-white shadow-md shadow-slate-900/20" : "text-slate-300 hover:text-white hover:bg-slate-800", className)}>
            <Icon className={cn("h-5 w-5", !isSidebarCollapsed && "mr-3")} />
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
      <aside className={cn("fixed inset-y-0 left-0 z-50 bg-slate-900 text-white shadow-xl flex flex-col h-full transition-all duration-300 ease-in-out md:relative", sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0", isSidebarCollapsed ? "w-20" : "w-64")}>
        <div className={cn("h-16 flex items-center border-b border-slate-800 flex-none", isSidebarCollapsed ? "justify-center px-0" : "px-6 gap-3")}>
          <div className="flex items-center justify-center">
             <Image src="/logo-disdikpora.png" alt="Logo" width={isSidebarCollapsed ? 28 : 32} height={isSidebarCollapsed ? 28 : 32} className="object-contain"/>
          </div>
          {!isSidebarCollapsed && <h1 className="font-bold text-xl tracking-wider truncate">Dinas DIKPORA</h1>}
          <button className="ml-auto md:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}><X className="h-6 w-6" /></button>
        </div>
        <nav className="p-3 space-y-2 flex-1 overflow-y-auto overflow-x-hidden">
          <SidebarItem icon={LayoutDashboard} label="Master Data" active={true} />
          <SidebarItem icon={FileText} label="Applicants" onClick={() => router.push("/admin/applicants")} />
          <SidebarItem icon={CalendarClock} label="Daftar PKL" onClick={() => router.push("/admin/pkl")} />
          <SidebarItem icon={BookOpen} label="Penelitian" onClick={() => router.push("/admin/penelitian")} />
          <SidebarItem icon={Users} label="Admin Users" onClick={() => router.push("/admin/users")} />
          <SidebarItem icon={Settings} label="Settings" onClick={() => router.push("/admin/pengaturan")} />
          <div className="pt-4 mt-4 border-t border-slate-800">
            <SidebarItem icon={LogOut} label="Keluar" className="text-red-400 hover:text-red-300 hover:bg-red-900/20" onClick={() => setIsLogoutOpen(true)} />
          </div>
        </nav>
      </aside>

      {/* CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="bg-white dark:bg-slate-950 border-b dark:border-slate-800 h-16 flex items-center px-4 md:px-8 justify-between shadow-sm transition-colors duration-300 flex-none z-40">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setSidebarOpen(true)}><Menu className="h-6 w-6 text-slate-600 dark:text-slate-200" /></button>
            <button className="hidden md:flex p-2 text-slate-500 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" onClick={toggleSidebar}>
               {isSidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Master Data Sistem</h2>
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
          
          <div className="w-full">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Konfigurasi Master Data</h1>
            <p className="text-slate-500 dark:text-slate-400">Kelola kuota posisi, unit UPT, kalender hari libur, dan minimal magang.</p>
          </div>

          <div className="w-full">
            <Tabs defaultValue="positions" onValueChange={setActiveTab} className="w-full">
              
              {/* TAB LIST (GRID COLS 4) */}
              <TabsList className="grid w-full grid-cols-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1 mb-6 rounded-lg h-12 shadow-sm transition-colors overflow-x-auto">
                <TabsTrigger value="positions" className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 font-medium rounded-md h-full transition-all dark:text-slate-400 text-sm whitespace-nowrap px-3">
                  <Briefcase className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Posisi</span>
                </TabsTrigger>
                <TabsTrigger value="upt" className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 font-medium rounded-md h-full transition-all dark:text-slate-400 text-sm whitespace-nowrap px-3">
                  <Building2 className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Unit UPT</span>
                </TabsTrigger>
                <TabsTrigger value="holidays" className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 font-medium rounded-md h-full transition-all dark:text-slate-400 text-sm whitespace-nowrap px-3">
                  <CalendarDays className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Hari Libur</span>
                </TabsTrigger>
                <TabsTrigger value="sistem" className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 font-medium rounded-md h-full transition-all dark:text-slate-400 text-sm whitespace-nowrap px-3">
                  <CalendarClock className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Minimal Magang</span>
                </TabsTrigger>
              </TabsList>

              {/* TABS CONTENT 1: POSITIONS */}
              <TabsContent value="positions" className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex justify-end mb-4">
                  <Button onClick={() => { setPositionForm({title: "", quota: 3}); setEditingId(null); setIsPositionDialogOpen(true); }} className="bg-blue-700 hover:bg-blue-800 text-white shadow-lg shadow-blue-700/20 transition-all hover:scale-105">
                    <Plus className="mr-2 h-4 w-4" /> Tambah Posisi
                  </Button>
                </div>
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm dark:bg-slate-900 overflow-hidden">
                  <div className="p-4 bg-slate-50/50 dark:bg-slate-950 border-b dark:border-slate-800 flex items-center">
                    <div className="relative w-full max-w-sm">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                      <Input placeholder="Cari posisi..." className="pl-9 h-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                  </div>
                  <Table>
                    <TableHeader className="bg-slate-50/80 dark:bg-slate-950">
                      <TableRow className="border-slate-200 dark:border-slate-800">
                        <TableHead className="w-[50px] text-center">No</TableHead>
                        <TableHead className="cursor-pointer" onClick={() => requestSort('title')}>Nama Bidang</TableHead>
                        <TableHead className="text-center cursor-pointer" onClick={() => requestSort('filled')}>Terisi/Kuota</TableHead>
                        <TableHead className="text-right pr-6">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processedPositions.map((pos, i) => (
                        <TableRow key={pos.id} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/50">
                          <TableCell className="text-center text-slate-500">{i + 1}</TableCell>
                          <TableCell className="font-medium">{pos.title}</TableCell>
                          <TableCell className="text-center"><b>{pos.filled}</b> / {pos.quota}</TableCell>
                          <TableCell className="text-right pr-4">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => { setPositionForm({title: pos.title, quota: pos.quota}); setEditingId(pos.id); setIsPositionDialogOpen(true); }}><Pencil className="h-4 w-4"/></Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-red-600" 
                              onClick={() => openDeleteDialog("position", pos.id, pos.title)}
                            >
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>

              {/* TABS CONTENT 2: UPT */}
              <TabsContent value="upt" className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex justify-end mb-4">
                  <Button onClick={() => { setUptForm({name: "", address: ""}); setEditingId(null); setIsUptDialogOpen(true); }} className="bg-blue-700 hover:bg-blue-800 text-white shadow-lg shadow-blue-700/20 transition-all hover:scale-105">
                    <Plus className="mr-2 h-4 w-4" /> Tambah UPT
                  </Button>
                </div>
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm dark:bg-slate-900">
                  <Table>
                    <TableHeader className="bg-slate-50/80 dark:bg-slate-950">
                      <TableRow className="border-slate-200 dark:border-slate-800">
                        <TableHead className="w-[50px] text-center">No</TableHead>
                        <TableHead>Nama Unit UPT</TableHead>
                        <TableHead>Link Google Maps</TableHead>
                        <TableHead className="text-right pr-6">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {upts.map((u, i) => (
                        <TableRow key={u.id} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/50">
                          <TableCell className="text-center text-slate-500">{i + 1}</TableCell>
                          <TableCell className="font-medium">{u.name}</TableCell>
                          <TableCell className="text-sm text-slate-500">{u.address || "-"}</TableCell>
                          <TableCell className="text-right pr-4">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => { setUptForm({name: u.name, address: u.address || ""}); setEditingId(u.id); setIsUptDialogOpen(true); }}><Pencil className="h-4 w-4"/></Button>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-slate-400 hover:text-red-600" 
                                onClick={() => openDeleteDialog("upt", u.id, u.name)}
                            >
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>

              {/* TABS CONTENT 3: HARI LIBUR */}
              <TabsContent value="holidays" className="animate-in fade-in slide-in-from-right-4 duration-300">
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm dark:bg-slate-900 h-fit lg:col-span-1">
                      <CardHeader>
                        <CardTitle className="text-lg">Tambah Libur & Cuti</CardTitle>
                        <CardDescription>Pilih satu/banyak tanggal di kalender.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleAddHolidays} className="space-y-4">
                          <div className="space-y-2">
                            <Label>Pilih Tanggal</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal dark:bg-slate-950 dark:border-slate-700")}>
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {newHolidayDates?.length ? `${newHolidayDates.length} Tanggal terpilih` : "Klik Kalender"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0 dark:bg-slate-950" align="start">
                                <Calendar mode="multiple" selected={newHolidayDates} onSelect={setNewHolidayDates} initialFocus className="dark:bg-slate-950" />
                              </PopoverContent>
                            </Popover>
                          </div>
                          
                          <Button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4" 
                          >
                             {isSubmitting ? <Loader2 className="animate-spin h-4 w-4"/> : "Simpan Hari Libur"}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>

                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm dark:bg-slate-900 lg:col-span-2">
                      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b dark:border-slate-800">
                        <div><CardTitle className="text-lg">Daftar Tanggal Merah</CardTitle></div>
                        <div className="flex gap-2">
                           <Select value={filterYear} onValueChange={setFilterYear}>
                              <SelectTrigger className="w-[90px] h-9 dark:bg-slate-950"><SelectValue /></SelectTrigger>
                              <SelectContent className="dark:bg-slate-950">
                                <SelectItem value="all">Semua</SelectItem>
                                {availableYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                              </SelectContent>
                           </Select>
                           <Select value={filterMonth} onValueChange={setFilterMonth}>
                              <SelectTrigger className="w-[110px] h-9 dark:bg-slate-950"><SelectValue /></SelectTrigger>
                              <SelectContent className="dark:bg-slate-950">
                                <SelectItem value="all">Semua</SelectItem>
                                {Array.from({ length: 12 }, (_, i) => (
                                  <SelectItem key={i + 1} value={(i + 1).toString()}>{format(new Date(2000, i, 1), "MMMM", { locale: idLocale })}</SelectItem>
                                ))}
                              </SelectContent>
                           </Select>
                           {selectedHolidayIds.length > 0 && (
                             <Button variant="destructive" size="sm" className="h-9" onClick={() => setIsDeleteMassOpen(true)}>
                                <Trash2 className="w-4 h-4 mr-1" /> ({selectedHolidayIds.length})
                             </Button>
                           )}
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="max-h-[400px] overflow-auto">
                          <Table>
                            <TableHeader className="bg-slate-50 dark:bg-slate-950 sticky top-0 z-10">
                              <TableRow className="border-slate-200 dark:border-slate-800">
                                <TableHead className="w-[60px] text-center bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-sm">
                                  <input 
                                    type="checkbox" 
                                    className="accent-red-600 w-4 h-4 mt-1 cursor-pointer" 
                                    checked={selectedHolidayIds.length === filteredHolidays.length && filteredHolidays.length > 0} 
                                    onChange={toggleSelectAllHolidays} 
                                  />
                                </TableHead>
                                <TableHead className="bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-sm">
                                    Tanggal
                                </TableHead>
                                <TableHead className="text-right pr-6 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-sm w-[100px]">
                                    Aksi
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredHolidays.map((item) => (
                                <TableRow 
                                    key={item.id} 
                                    className={cn(
                                        "border-slate-100 dark:border-slate-800 transition-colors",
                                        selectedHolidayIds.includes(item.id) ? "bg-red-50 dark:bg-red-900/10" : "hover:bg-slate-50/50"
                                    )}
                                >
                                  <TableCell className="text-center">
                                    <input 
                                        type="checkbox" 
                                        className="accent-red-600 w-4 h-4 mt-1 cursor-pointer" 
                                        checked={selectedHolidayIds.includes(item.id)} 
                                        onChange={() => toggleSelectHoliday(item.id)} 
                                    />
                                  </TableCell>
                                  <TableCell className="font-medium text-slate-700 dark:text-slate-200 py-3">
                                    <div className="flex items-center gap-2">
                                        <CalendarDays className="h-4 w-4 text-slate-400"/>
                                        {format(new Date(item.date), "EEEE, d MMMM yyyy", { locale: idLocale })}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right pr-4">
                                     <Button 
                                       variant="ghost" 
                                       size="icon" 
                                       className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" 
                                       onClick={() => openDeleteDialog("holiday", item.id, format(new Date(item.date), "d MMM yyyy", { locale: idLocale }))}
                                     >
                                       <Trash2 className="h-4 w-4"/>
                                     </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                              {filteredHolidays.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-32 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <CalendarIcon className="h-8 w-8 opacity-20"/>
                                            <p>Tidak ada data hari libur ditemukan.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                 </div>
              </TabsContent>

              {/* TABS CONTENT 4: SISTEM (Form Minimal Hari Dipindah ke Sini) */}
              <TabsContent value="sistem" className="animate-in fade-in slide-in-from-right-4 duration-300">
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm dark:bg-slate-900 transition-colors max-w-xl">
                  <CardHeader>
                    <CardTitle className="dark:text-slate-100">Konfigurasi Minimal Lama Magang</CardTitle>
                    <CardDescription className="dark:text-slate-400">Atur lama minimal magang dalam hari kerja</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <form onSubmit={handleSaveSettings} className="space-y-5">
                      <div className="grid gap-2">
                        <Label className="dark:text-slate-300">Minimal Hari Magang (Hari Kerja)</Label>
                        <Input 
                          type="number" 
                          value={minDaysSetting} 
                          onChange={(e) => setMinDaysSetting(e.target.value)} 
                          className="dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100" 
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                           Angka ini akan langsung ditetapkan sebagai batas minimal pada form pengajuan magang.
                        </p>
                      </div>
                      <Button type="submit" disabled={isSubmitting} className="bg-blue-700 hover:bg-blue-800 text-white dark:bg-blue-600 dark:hover:bg-blue-700">
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Simpan Konfigurasi"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>
          </div>

        </main>
      </div>

      {/* --- DIALOGS --- */}

      <Dialog open={isPositionDialogOpen} onOpenChange={setIsPositionDialogOpen}>
        <DialogContent className="dark:bg-slate-950 dark:border-slate-800">
            <DialogHeader><DialogTitle>{editingId ? "Edit Posisi" : "Tambah Posisi"}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2"><Label>Nama Bidang</Label><Input value={positionForm.title} onChange={(e) => setPositionForm({...positionForm, title: e.target.value})} placeholder="Contoh: IT Support"/></div>
                <div className="grid gap-2"><Label>Kuota</Label><Input type="number" value={positionForm.quota} onChange={(e) => setPositionForm({...positionForm, quota: parseInt(e.target.value) || 0})}/></div>
            </div>
            <DialogFooter><Button className="bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 w-full sm:w-auto transition-all text-white" onClick={handleSavePosition} disabled={isSubmitting}>{isSubmitting ? "Menyimpan..." : "Simpan"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isUptDialogOpen} onOpenChange={setIsUptDialogOpen}>
        <DialogContent className="dark:bg-slate-950 dark:border-slate-800">
            <DialogHeader><DialogTitle>{editingId ? "Edit UPT" : "Tambah UPT"}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2"><Label>Nama UPT</Label><Input value={uptForm.name} onChange={(e) => setUptForm({...uptForm, name: e.target.value})} placeholder="Nama Balai..."/></div>
                <div className="grid gap-2"><Label>Alamat</Label><Input value={uptForm.address} onChange={(e) => setUptForm({...uptForm, address: e.target.value})} placeholder="Jl. Raya..."/></div>
            </div>
            <DialogFooter><Button className="bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 w-full sm:w-auto transition-all text-white" onClick={handleSaveUpt} disabled={isSubmitting}>{isSubmitting ? "Menyimpan..." : "Simpan"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteMassOpen} onOpenChange={setIsDeleteMassOpen}>
        <DialogContent className="sm:max-w-[400px] dark:bg-slate-950 border-slate-800">
          <DialogHeader className="flex flex-col items-center text-center gap-2">
            <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-2">
                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle>Hapus {selectedHolidayIds.length} Data Terpilih?</DialogTitle>
            <DialogDescription>
                Tindakan ini tidak bisa dibatalkan. Data tanggal merah yang dipilih akan dihapus permanen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button variant="outline" className="w-full sm:w-1/2" onClick={() => setIsDeleteMassOpen(false)}>Batal</Button>
            <Button variant="destructive" className="w-full sm:w-1/2 bg-red-600 hover:bg-red-700" onClick={handleDeleteMassHolidays} disabled={isSubmitting}>
                 {isSubmitting ? <Loader2 className="animate-spin h-4 w-4"/> : "Hapus Semua"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirm.isOpen} onOpenChange={(open) => !open && setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}>
         <DialogContent className="sm:max-w-[425px] p-6 border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-950">
            <div className="flex flex-col items-center text-center gap-2 pt-2">
               <div className="h-14 w-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-2 animate-in zoom-in duration-300">
                  <Trash2 className="h-7 w-7 text-red-600 dark:text-red-500" />
               </div>
               <DialogTitle className="text-xl font-semibold dark:text-slate-100">
                  Hapus Data?
               </DialogTitle>
               <DialogDescription className="text-center dark:text-slate-400">
                  Anda akan menghapus data <span className="font-semibold text-slate-900 dark:text-slate-200">"{deleteConfirm.title}"</span>. 
                  <br/>Tindakan ini tidak dapat dibatalkan.
               </DialogDescription>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-6">
               <Button 
                 variant="outline" 
                 className="w-full sm:w-1/2 h-10 border-slate-200 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800" 
                 onClick={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
                 disabled={isSubmitting}
               >
                 Batal
               </Button>
               <Button 
                 variant="destructive" 
                 className="w-full sm:w-1/2 h-10 bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20" 
                 onClick={confirmDelete}
                 disabled={isSubmitting}
               >
                 {isSubmitting ? <Loader2 className="animate-spin h-4 w-4"/> : "Ya, Hapus"}
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