"use client";

import Image from "next/image"; 
import { ModeToggle } from "@/components/mode-toggle";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Briefcase, LogOut, Menu, Settings, X, Plus,
  Search, Pencil, Trash2, CalendarClock, FileText, User, Loader2,
  AlertTriangle, PanelLeftClose, PanelLeftOpen, ArrowUpDown, ArrowUp, ArrowDown,
  BookOpen, UserCheck, Building2, CalendarDays, MapPin
} from "lucide-react";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import { format } from "date-fns";
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
  address?: string; // Tambahin address biar typescript ga marah
};

type Holiday = {
  id: string; 
  date: string; 
  description: string;
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

  // --- TAB & FILTER STATE ---
  const [activeTab, setActiveTab] = useState("positions");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  // --- MODAL STATE ---
  const [isPositionDialogOpen, setIsPositionDialogOpen] = useState(false);
  const [isUptDialogOpen, setIsUptDialogOpen] = useState(false);
  const [isHolidayDialogOpen, setIsHolidayDialogOpen] = useState(false);
  
  const [editingId, setEditingId] = useState<number | null>(null);

  // --- FORMS ---
  const [positionForm, setPositionForm] = useState({ title: "", quota: 3 });
  // Update form UPT biar nampung address
  const [uptForm, setUptForm] = useState({ name: "", address: "" });
  const [holidayForm, setHolidayForm] = useState<{ date: Date | undefined; description: string }>({ date: undefined, description: "" });

  // --- 1. SETUP & FETCH ---
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState === "true") setIsSidebarCollapsed(true);
    
    Promise.all([
        fetchAdminProfile(),
        fetchPositions(),
        fetchUpts(),
        fetchHolidays()
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
    } catch (e) { console.error(e); }
  };

  // --- LOGIC SORTING ---
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

  // --- CRUD HANDLERS ---
  
  // 1. POSITIONS
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

  const handleDeletePosition = async (id: number) => {
      if(!confirm("Hapus posisi ini?")) return;
      try {
          const res = await fetch(`/api/positions/${id}`, { method: "DELETE" });
          if(res.ok) { fetchPositions(); toast.success("Posisi dihapus"); }
      } catch(e) { toast.error("Gagal menghapus"); }
  };

  // 2. UPT
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

  const handleDeleteUpt = async (id: number) => {
      if(!confirm("Hapus UPT ini?")) return;
      try {
          const res = await fetch(`/api/upt/${id}`, { method: "DELETE" });
          if(res.ok) { fetchUpts(); toast.success("UPT dihapus"); }
      } catch(e) { toast.error("Gagal menghapus"); }
  };

  // 3. HOLIDAYS
  const handleSaveHoliday = async () => {
    if (!holidayForm.date || !holidayForm.description.trim()) return toast.warning("Tanggal dan deskripsi wajib diisi");
    setIsSubmitting(true);
    try {
        const url = "/api/holidays"; 
        const method = "POST";
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                date: holidayForm.date.toISOString(),
                description: holidayForm.description
            }),
        });
        if (!res.ok) throw new Error();
        await fetchHolidays();
        setIsHolidayDialogOpen(false);
        toast.success("Hari libur ditambahkan");
    } catch (e) { toast.error("Gagal menyimpan hari libur"); }
    finally { setIsSubmitting(false); }
  };

  const handleDeleteHoliday = async (id: string) => {
      if(!confirm("Hapus hari libur ini?")) return;
      try {
          const res = await fetch(`/api/holidays/${id}`, { method: "DELETE" });
          if(res.ok) { fetchHolidays(); toast.success("Hari libur dihapus"); }
      } catch(e) { toast.error("Gagal menghapus"); }
  };

  // --- HELPERS ---
  const handleLogoutConfirm = async () => {
    setIsLogoutOpen(false);
    toast.promise(fetch("/api/auth/logout", { method: "POST" }), {
      loading: 'Keluar...',
      success: () => { router.push("/admin/login"); return 'Berhasil logout'; },
      error: 'Gagal logout',
    });
  };

  const renderStatusBadge = (filled: number, quota: number) => {
    if (filled >= quota) return <Badge variant="destructive" className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200 shadow-none">Penuh</Badge>;
    if (quota - filled <= 1) return <Badge variant="secondary" className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200 shadow-none">Terbatas</Badge>;
    return <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 shadow-none">Dibuka</Badge>;
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

      {/* CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="bg-white dark:bg-slate-950 border-b dark:border-slate-800 h-16 flex items-center px-4 md:px-8 justify-between shadow-sm transition-colors duration-300 flex-none z-40">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setSidebarOpen(true)}><Menu className="h-6 w-6 text-slate-600 dark:text-slate-200" /></button>
            <button className="hidden md:flex p-2 text-slate-500 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" onClick={toggleSidebar}>
               {isSidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Master Data & Kuota</h2>
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
          
          {/* TABS CONTAINER */}
          <Tabs defaultValue="positions" value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
            
            {/* STATS & TABS LIST */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <TabsList className="grid grid-cols-3 w-full md:w-[400px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 h-12">
                    <TabsTrigger value="positions" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900/20 dark:data-[state=active]:text-blue-400">Posisi</TabsTrigger>
                    <TabsTrigger value="upt" className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 dark:data-[state=active]:bg-orange-900/20 dark:data-[state=active]:text-orange-400">Unit UPT</TabsTrigger>
                    <TabsTrigger value="holidays" className="data-[state=active]:bg-red-50 data-[state=active]:text-red-700 dark:data-[state=active]:bg-red-900/20 dark:data-[state=active]:text-red-400">Hari Libur</TabsTrigger>
                </TabsList>
                
                {/* ACTION BUTTON DYNAMIC */}
                {activeTab === "positions" && (
                    <Button onClick={() => { setPositionForm({title: "", quota: 3}); setEditingId(null); setIsPositionDialogOpen(true); }} className="bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white shadow-lg">
                        <Plus className="mr-2 h-4 w-4" /> Tambah Posisi
                    </Button>
                )}
                {activeTab === "upt" && (
                    <Button onClick={() => { setUptForm({name: "", address: ""}); setEditingId(null); setIsUptDialogOpen(true); }} className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg">
                        <Plus className="mr-2 h-4 w-4" /> Tambah UPT
                    </Button>
                )}
                {activeTab === "holidays" && (
                    <Button onClick={() => { setHolidayForm({date: undefined, description: ""}); setIsHolidayDialogOpen(true); }} className="bg-red-600 hover:bg-red-700 text-white shadow-lg">
                        <Plus className="mr-2 h-4 w-4" /> Tambah Hari Libur
                    </Button>
                )}
            </div>

            {/* TAB CONTENT 1: POSITIONS */}
            <TabsContent value="positions" className="space-y-4">
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm dark:bg-slate-900">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <Input placeholder="Cari nama bidang..." className="pl-9 bg-white dark:bg-slate-950 dark:border-slate-700" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                    </div>
                    <Table>
                        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                            <TableRow className="border-b dark:border-slate-800">
                                <TableHead className="w-[50px] text-center dark:text-slate-400">No</TableHead>
                                <TableHead onClick={() => requestSort('title')} className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400"><div className="flex items-center gap-2">Nama Bidang {sortConfig?.key === 'title' && (sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3"/> : <ArrowDown className="h-3 w-3"/>)}</div></TableHead>
                                <TableHead onClick={() => requestSort('filled')} className="text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400"><div className="flex items-center justify-center gap-2">Terisi / Kuota {sortConfig?.key === 'filled' && (sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3"/> : <ArrowDown className="h-3 w-3"/>)}</div></TableHead>
                                <TableHead className="text-center dark:text-slate-400">Status</TableHead>
                                <TableHead className="text-right pr-6 dark:text-slate-400">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {processedPositions.length > 0 ? processedPositions.map((pos, i) => (
                                <TableRow key={pos.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b dark:border-slate-800">
                                    <TableCell className="text-center text-slate-500 dark:text-slate-500">{i + 1}</TableCell>
                                    <TableCell className="font-medium dark:text-slate-200"><div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-slate-400"/> {pos.title}</div></TableCell>
                                    <TableCell className="text-center dark:text-slate-200"><span className="font-bold">{pos.filled}</span> <span className="text-slate-400">/</span> {pos.quota}</TableCell>
                                    <TableCell className="text-center">{renderStatusBadge(pos.filled, pos.quota)}</TableCell>
                                    <TableCell className="text-right pr-4">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400" onClick={() => { setPositionForm({title: pos.title, quota: pos.quota}); setEditingId(pos.id); setIsPositionDialogOpen(true); }}><Pencil className="h-4 w-4"/></Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 dark:hover:text-red-400" onClick={() => handleDeletePosition(pos.id)}><Trash2 className="h-4 w-4"/></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )) : <TableRow><TableCell colSpan={5} className="h-32 text-center text-slate-500 dark:text-slate-400">Data tidak ditemukan.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </Card>
            </TabsContent>

            {/* TAB CONTENT 2: UPT */}
            <TabsContent value="upt" className="space-y-4">
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm dark:bg-slate-900">
                    <Table>
                        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                            <TableRow className="border-b dark:border-slate-800">
                                <TableHead className="w-[50px] text-center dark:text-slate-400">No</TableHead>
                                <TableHead className="dark:text-slate-400">Nama Unit Pelaksana Teknis (UPT)</TableHead>
                                {/* Tambahan kolom Alamat */}
                                <TableHead className="dark:text-slate-400">Alamat</TableHead>
                                <TableHead className="text-right pr-6 dark:text-slate-400">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {upts.length > 0 ? upts.map((u, i) => (
                                <TableRow key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b dark:border-slate-800">
                                    <TableCell className="text-center text-slate-500 dark:text-slate-500">{i + 1}</TableCell>
                                    <TableCell className="font-medium dark:text-slate-200"><div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-orange-400"/> {u.name}</div></TableCell>
                                    <TableCell className="text-slate-500 dark:text-slate-400 text-sm">{u.address || "-"}</TableCell>
                                    <TableCell className="text-right pr-4">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400" onClick={() => { setUptForm({name: u.name, address: u.address || ""}); setEditingId(u.id); setIsUptDialogOpen(true); }}><Pencil className="h-4 w-4"/></Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 dark:hover:text-red-400" onClick={() => handleDeleteUpt(u.id)}><Trash2 className="h-4 w-4"/></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )) : <TableRow><TableCell colSpan={4} className="h-32 text-center text-slate-500 dark:text-slate-400">Belum ada data UPT.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </Card>
            </TabsContent>

            {/* TAB CONTENT 3: HOLIDAYS */}
            <TabsContent value="holidays" className="space-y-4">
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm dark:bg-slate-900">
                    <Table>
                        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                            <TableRow className="border-b dark:border-slate-800">
                                <TableHead className="w-[50px] text-center dark:text-slate-400">No</TableHead>
                                <TableHead className="dark:text-slate-400">Tanggal</TableHead>
                                <TableHead className="dark:text-slate-400">Keterangan</TableHead>
                                <TableHead className="text-right pr-6 dark:text-slate-400">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {holidays.length > 0 ? holidays.map((h, i) => (
                                <TableRow key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b dark:border-slate-800">
                                    <TableCell className="text-center text-slate-500 dark:text-slate-500">{i + 1}</TableCell>
                                    <TableCell className="font-medium dark:text-slate-200">
                                        <div className="flex items-center gap-2">
                                            <CalendarDays className="h-4 w-4 text-red-400"/> 
                                            {format(new Date(h.date), "dd MMMM yyyy", { locale: idLocale })}
                                        </div>
                                    </TableCell>
                                    <TableCell className="dark:text-slate-300">{h.description}</TableCell>
                                    <TableCell className="text-right pr-4">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 dark:hover:text-red-400" onClick={() => handleDeleteHoliday(h.id)}><Trash2 className="h-4 w-4"/></Button>
                                    </TableCell>
                                </TableRow>
                            )) : <TableRow><TableCell colSpan={4} className="h-32 text-center text-slate-500 dark:text-slate-400">Belum ada hari libur.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </Card>
            </TabsContent>

          </Tabs>

        </main>
      </div>

      {/* DIALOGS */}
      
      {/* 1. POSITION DIALOG */}
      <Dialog open={isPositionDialogOpen} onOpenChange={setIsPositionDialogOpen}>
        <DialogContent className="dark:bg-slate-950 dark:border-slate-800">
            <DialogHeader><DialogTitle className="dark:text-slate-100">{editingId ? "Edit Posisi" : "Tambah Posisi"}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2"><Label className="dark:text-slate-300">Nama Bidang</Label><Input className="dark:bg-slate-900 dark:border-slate-700" value={positionForm.title} onChange={(e) => setPositionForm({...positionForm, title: e.target.value})} placeholder="Contoh: Sub Bagian Keuangan"/></div>
                <div className="grid gap-2"><Label className="dark:text-slate-300">Kuota</Label><Input className="dark:bg-slate-900 dark:border-slate-700" type="number" value={positionForm.quota} onChange={(e) => setPositionForm({...positionForm, quota: parseInt(e.target.value) || 0})}/></div>
            </div>
            <DialogFooter><Button onClick={handleSavePosition} disabled={isSubmitting}>{isSubmitting ? "Menyimpan..." : "Simpan"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. UPT DIALOG (FIXED WITH ADDRESS) */}
      <Dialog open={isUptDialogOpen} onOpenChange={setIsUptDialogOpen}>
        <DialogContent className="dark:bg-slate-950 dark:border-slate-800">
            <DialogHeader><DialogTitle className="dark:text-slate-100">{editingId ? "Edit UPT" : "Tambah UPT Baru"}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label className="dark:text-slate-300">Nama UPT</Label>
                    <Input className="dark:bg-slate-900 dark:border-slate-700" value={uptForm.name} onChange={(e) => setUptForm({...uptForm, name: e.target.value})} placeholder="Contoh: Balai Tekkomdik"/>
                </div>
                {/* Tambahan Input Address */}
                <div className="grid gap-2">
                    <Label className="dark:text-slate-300">Alamat Lengkap</Label>
                    <Input className="dark:bg-slate-900 dark:border-slate-700" value={uptForm.address} onChange={(e) => setUptForm({...uptForm, address: e.target.value})} placeholder="Jl. Kenari No. xyz..."/>
                </div>
            </div>
            <DialogFooter><Button onClick={handleSaveUpt} disabled={isSubmitting}>{isSubmitting ? "Menyimpan..." : "Simpan"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. HOLIDAY DIALOG */}
      <Dialog open={isHolidayDialogOpen} onOpenChange={setIsHolidayDialogOpen}>
        <DialogContent className="dark:bg-slate-950 dark:border-slate-800">
            <DialogHeader><DialogTitle className="dark:text-slate-100">Tambah Hari Libur</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label className="dark:text-slate-300">Pilih Tanggal</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal dark:bg-slate-900 dark:border-slate-700", !holidayForm.date && "text-muted-foreground")}>
                                <CalendarDays className="mr-2 h-4 w-4" />
                                {holidayForm.date ? format(holidayForm.date, "PPP", { locale: idLocale }) : <span>Pilih tanggal</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 dark:bg-slate-950 dark:border-slate-800">
                            <Calendar mode="single" selected={holidayForm.date} onSelect={(date) => setHolidayForm({...holidayForm, date})} initialFocus className="dark:bg-slate-950"/>
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="grid gap-2"><Label className="dark:text-slate-300">Keterangan</Label><Input className="dark:bg-slate-900 dark:border-slate-700" value={holidayForm.description} onChange={(e) => setHolidayForm({...holidayForm, description: e.target.value})} placeholder="Contoh: Cuti Bersama Idul Fitri"/></div>
            </div>
            <DialogFooter><Button onClick={handleSaveHoliday} disabled={isSubmitting}>{isSubmitting ? "Menyimpan..." : "Simpan"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LOGOUT CONFIRM */}
      <Dialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen}>
        <DialogContent className="sm:max-w-[400px] dark:bg-slate-950 dark:border-slate-800">
          <DialogHeader className="items-center text-center">
             <AlertTriangle className="h-10 w-10 text-red-500 mb-2"/>
             <DialogTitle className="dark:text-slate-100">Konfirmasi Keluar</DialogTitle>
             <DialogDescription className="dark:text-slate-400">Anda harus login kembali untuk mengakses panel.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
             <Button variant="outline" onClick={() => setIsLogoutOpen(false)} className="dark:bg-transparent dark:border-slate-700 dark:text-slate-300">Batal</Button>
             <Button variant="destructive" onClick={handleLogoutConfirm}>Ya, Keluar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}