"use client";

import Image from "next/image"; 
import { ModeToggle } from "@/components/mode-toggle";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format, getYear, getMonth } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  LogOut,
  X,
  Menu,
  User,
  Shield,
  UserCircle,
  Loader2,
  AlertTriangle,
  PanelLeftClose, 
  PanelLeftOpen,   
  CalendarClock,
  BookOpen,
  CalendarDays,
  CalendarIcon,
  Trash2
} from "lucide-react";

import { toast } from "sonner";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Tipe data Holiday
type Holiday = {
  id: string;
  date: string; 
};

export default function PengaturanPage() {
  const router = useRouter();
  
  // --- STATE UI ---
  const [sidebarOpen, setSidebarOpen] = useState(false); 
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); 
  const [loading, setLoading] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  
  // State Delete massal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // --- STATE DATA ---
  const [profile, setProfile] = useState({ id: "", username: "", jabatan: "" });
  const [pass, setPass] = useState({ current: "", new: "", confirm: "" });
  const [currentAdmin, setCurrentAdmin] = useState({ username: "...", jabatan: "..." });

  // --- STATE HARI LIBUR ---
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [newHolidayDates, setNewHolidayDates] = useState<Date[] | undefined>([]);
  const [loadingHoliday, setLoadingHoliday] = useState(false);

  // --- FILTER STATES ---
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  const [filterMonth, setFilterMonth] = useState<string>("all");

  // --- INITIAL LOAD ---
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState === "true") setIsSidebarCollapsed(true);
    fetchSession();
    fetchHolidays();
  }, []);

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", String(newState));
  };

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (res.ok) {
        setCurrentAdmin({ username: data.username, jabatan: data.jabatan || "Administrator" });
        setProfile({ id: data.id, username: data.username, jabatan: data.jabatan || "" });
      } else {
        router.push("/admin/login");
      }
    } catch (error) { console.error("Auth error:", error); }
  };

  const fetchHolidays = async () => {
    try {
      const res = await fetch("/api/holidays");
      if (res.ok) {
        const data = await res.json();
        setHolidays(data);
      }
    } catch (error) { console.error("Gagal ambil hari libur", error); }
  };

  // --- LOGIKA FILTERING ---
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

  // --- HANDLERS ---
  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayDates || newHolidayDates.length === 0) {
      toast.warning("Pilih minimal satu tanggal terlebih dahulu");
      return;
    }
    setLoadingHoliday(true);
    try {
      const res = await fetch("/api/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dates: newHolidayDates }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
      toast.success(`${newHolidayDates.length} Tanggal libur berhasil ditambahkan`);
      setNewHolidayDates([]);
      fetchHolidays(); 
    } catch (error) {
      toast.error("Gagal menambah data");
    } finally {
      setLoadingHoliday(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredHolidays.length && filteredHolidays.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredHolidays.map(h => h.id));
    }
  };

  const handleDeleteHolidays = async () => {
    if (selectedIds.length === 0) return;
    
    setLoading(true);
    try {
      const deletePromises = selectedIds.map(id => 
        fetch(`/api/holidays/${id}`, { method: "DELETE" })
      );
      await Promise.all(deletePromises);
      toast.success(`${selectedIds.length} Data berhasil dihapus`);
      setHolidays(prev => prev.filter(h => !selectedIds.includes(h.id)));
      setSelectedIds([]);
    } catch (error) {
      toast.error("Gagal menghapus data");
    } finally {
      setLoading(false);
      setIsDeleteOpen(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!profile.username) {
        toast.warning("Username tidak boleh kosong");
        return;
    }
    setLoading(true);
    const promise = async () => {
        const res = await fetch(`/api/admins/${profile.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: profile.username,
                jabatan: profile.jabatan,
            }),
        });
        if (!res.ok) {
            const json = await res.json();
            throw new Error(json.error || "Gagal update profil");
        }
        router.refresh(); 
        fetchSession(); 
        return "Profil berhasil diperbarui!";
    };
    toast.promise(promise(), {
        loading: 'Menyimpan perubahan...',
        success: (msg) => msg,
        error: (err) => err.message,
        finally: () => setLoading(false)
    });
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!pass.current || !pass.new || !pass.confirm) {
        toast.warning("Semua kolom wajib diisi!");
        return;
    }
    if (pass.new !== pass.confirm) {
      toast.warning("Konfirmasi password baru tidak cocok!");
      return;
    }
    if (pass.new.length < 6) {
        toast.warning("Password baru minimal 6 karakter");
        return;
    }
    setLoading(true);
    const promise = async () => {
        const res = await fetch(`/api/admins/${profile.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                currentPassword: pass.current,
                newPassword: pass.new,
            }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Gagal ganti password");
        setPass({ current: "", new: "", confirm: "" });
        return "Password berhasil diganti!";
    };
    toast.promise(promise(), {
        loading: 'Memproses password...',
        success: (msg) => msg,
        error: (err) => err.message,
        finally: () => setLoading(false)
    });
  };

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
    <div className="h-screen w-full bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300 overflow-hidden">
      
      {/* SIDEBAR (Z-Index disesuaikan ke 40) */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-40 bg-slate-900 text-white shadow-xl flex flex-col h-full transition-all duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
          md:relative md:translate-x-0 
          ${isSidebarCollapsed ? "w-20" : "w-64"}
        `}
      >
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

        <nav className="p-3 space-y-2 flex-1 overflow-y-auto overflow-x-hidden">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" onClick={() => router.push("/admin/dashboard")}/>
          <SidebarItem icon={FileText} label="Applicants" onClick={() => router.push("/admin/applicants")}/>
          <SidebarItem icon={CalendarClock} label="Daftar PKL" onClick={() => router.push("/admin/pkl")} />
          <SidebarItem icon={BookOpen} label="Penelitian" onClick={() => router.push("/admin/penelitian")}/>
          <SidebarItem icon={Users} label="Admin Users" onClick={() => router.push("/admin/users")}/>
          <SidebarItem icon={Settings} label="Settings" active={true}/>
          <div className={`pt-4 mt-4 border-t border-slate-800 ${isSidebarCollapsed ? "mx-2" : ""}`}>
            <SidebarItem icon={LogOut} label="Keluar" className="text-red-400 hover:text-red-300 hover:bg-red-900/20" onClick={() => setIsLogoutOpen(true)} />
          </div>
        </nav>
      </aside>

      {/* CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="bg-white dark:bg-slate-950 border-b dark:border-slate-800 h-16 flex items-center px-4 md:px-8 justify-between shadow-sm transition-colors duration-300 flex-none z-30">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-6 w-6 text-slate-600 dark:text-slate-200" />
            </button>
            <button 
                className="hidden md:flex p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                onClick={toggleSidebar} 
                title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
                {isSidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Pengaturan Sistem
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{currentAdmin.username}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{currentAdmin.jabatan}</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800">
              <User className="h-6 w-6" />
            </div>
            <ModeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
          <div className="w-full">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Konfigurasi Admin
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Kelola profil, keamanan akun, dan pengaturan sistem (hari libur).
            </p>
          </div>

          <div className="w-full">
            <Tabs defaultValue="holidays" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1 mb-6 rounded-lg h-12 shadow-sm transition-colors">
                <TabsTrigger value="profil" className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 font-medium rounded-md h-full transition-all dark:text-slate-400">
                  <UserCircle className="w-4 h-4 mr-2" /> Profil
                </TabsTrigger>
                <TabsTrigger value="password" className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 font-medium rounded-md h-full transition-all dark:text-slate-400">
                  <Shield className="w-4 h-4 mr-2" /> Password
                </TabsTrigger>
                <TabsTrigger value="holidays" className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 font-medium rounded-md h-full transition-all dark:text-slate-400">
                  <CalendarDays className="w-4 h-4 mr-2" /> Hari Libur
                </TabsTrigger>
              </TabsList>

              {/* TABS HARI LIBUR (UTAMA) */}
              <TabsContent value="holidays" className="animate-in fade-in slide-in-from-right-4 duration-300">
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* FORM TAMBAH */}
                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm dark:bg-slate-900 lg:col-span-1 h-fit">
                      <CardHeader>
                        <CardTitle className="text-lg dark:text-slate-100">Tambah Tanggal Merah</CardTitle>
                        <CardDescription className="dark:text-slate-400">Pilih satu atau lebih tanggal merah.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleAddHoliday} className="space-y-4">
                          <div className="space-y-2">
                            <Label className="dark:text-slate-300">Pilih Tanggal</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100")}>
                                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                                  {newHolidayDates?.length ? `${newHolidayDates.length} Tanggal terpilih` : "Klik untuk buka kalender"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0 dark:bg-slate-950 dark:border-slate-800" align="start">
                                <Calendar mode="multiple" selected={newHolidayDates} onSelect={setNewHolidayDates} initialFocus className="dark:bg-slate-950 dark:text-slate-100" />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <Button type="submit" disabled={loadingHoliday} className="w-full bg-blue-700 hover:bg-blue-800 text-white dark:bg-blue-600 dark:hover:bg-blue-700">
                             {loadingHoliday ? <Loader2 className="animate-spin h-4 w-4"/> : "Simpan Tanggal"}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>

                    {/* TABEL LIST */}
                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm dark:bg-slate-900 lg:col-span-2 transition-colors">
                      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800">
                        <div>
                          <CardTitle className="text-lg dark:text-slate-100">Daftar Libur & Cuti</CardTitle>
                          <CardDescription className="dark:text-slate-400">Pilih tanggal untuk menghapus massal.</CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2">
                           {/* Filter Tahun */}
                           <Select value={filterYear} onValueChange={setFilterYear}>
                              <SelectTrigger className="w-[100px] h-9 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100">
                                <SelectValue placeholder="Thn" />
                              </SelectTrigger>
                              <SelectContent className="dark:bg-slate-950 dark:border-slate-800">
                                <SelectItem value="all">Semua</SelectItem>
                                {availableYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                              </SelectContent>
                           </Select>
                           {/* Filter Bulan */}
                           <Select value={filterMonth} onValueChange={setFilterMonth}>
                              <SelectTrigger className="w-[120px] h-9 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100">
                                <SelectValue placeholder="Bulan" />
                              </SelectTrigger>
                              <SelectContent className="dark:bg-slate-950 dark:border-slate-800">
                                <SelectItem value="all">Semua</SelectItem>
                                {Array.from({ length: 12 }, (_, i) => (
                                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                                    {format(new Date(2000, i, 1), "MMMM", { locale: idLocale })}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                           </Select>
                           {/* Tombol Hapus Massal */}
                           {selectedIds.length > 0 && (
                             <Button variant="destructive" size="sm" className="h-9" onClick={() => setIsDeleteOpen(true)}>
                                <Trash2 className="w-4 h-4 mr-2" /> Hapus ({selectedIds.length})
                             </Button>
                           )}
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="relative w-full overflow-auto max-h-[500px]">
                          <Table>
                            <TableHeader className="bg-slate-50 dark:bg-slate-950 sticky top-0 z-10">
                              <TableRow className="border-slate-200 dark:border-slate-800">
                                <TableHead className="w-[50px] text-center">
                                  <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 cursor-pointer accent-blue-600"
                                    checked={selectedIds.length === filteredHolidays.length && filteredHolidays.length > 0}
                                    onChange={toggleSelectAll}
                                  />
                                </TableHead>
                                <TableHead className="dark:text-slate-300">Hari & Tanggal</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredHolidays.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={3} className="h-32 text-center text-slate-500 dark:text-slate-400">Belum ada data tanggal merah.</TableCell>
                                </TableRow>
                              ) : (
                                filteredHolidays.map((item) => (
                                  <TableRow key={item.id} className="group border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <TableCell className="text-center">
                                      <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 cursor-pointer accent-blue-600"
                                        checked={selectedIds.includes(item.id)}
                                        onChange={() => toggleSelect(item.id)}
                                      />
                                    </TableCell>
                                    <TableCell className="font-medium text-slate-800 dark:text-slate-200">
                                      {format(new Date(item.date), "EEEE, d MMMM yyyy", { locale: idLocale })}
                                    </TableCell>
                                    <TableCell>
                                      <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => { setSelectedIds([item.id]); setIsDeleteOpen(true); }}>
                                        <Trash2 className="h-4 w-4"/>
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                 </div>
              </TabsContent>

              {/* TABS PROFIL */}
              <TabsContent value="profil">
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm dark:bg-slate-900 transition-colors">
                  <CardHeader><CardTitle className="dark:text-slate-100">Informasi Dasar</CardTitle><CardDescription className="dark:text-slate-400">Perbarui nama pengguna dan jabatan.</CardDescription></CardHeader>
                  <Separator className="bg-slate-100 dark:bg-slate-800" />
                  <CardContent className="pt-6">
                    <form onSubmit={handleUpdateProfile} className="space-y-5">
                      <div className="grid gap-2"><Label className="dark:text-slate-300">Username</Label><Input value={profile.username} onChange={(e) => setProfile({...profile, username: e.target.value})} className="dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100" /></div>
                      <div className="grid gap-2"><Label className="dark:text-slate-300">Jabatan</Label><Input value={profile.jabatan} onChange={(e) => setProfile({...profile, jabatan: e.target.value})} className="dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100" /></div>
                      <Button type="submit" disabled={loading} className="bg-blue-700 hover:bg-blue-800 text-white dark:bg-blue-600 dark:hover:bg-blue-700">Simpan Perubahan</Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TABS PASSWORD (FIX WARNA TOMBOL) */}
              <TabsContent value="password">
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm dark:bg-slate-900 transition-colors">
                  <CardHeader><CardTitle className="dark:text-slate-100">Keamanan Akun</CardTitle><CardDescription className="dark:text-slate-400">Pastikan password Anda kuat.</CardDescription></CardHeader>
                  <Separator className="bg-slate-100 dark:bg-slate-800" />
                  <CardContent className="pt-6">
                    <form onSubmit={handleUpdatePassword} className="space-y-5">
                      <div className="grid gap-2"><Label className="dark:text-slate-300">Password Lama</Label><Input type="password" value={pass.current} onChange={(e) => setPass({...pass, current: e.target.value})} className="dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100" /></div>
                      <div className="grid gap-2"><Label className="dark:text-slate-300">Password Baru</Label><Input type="password" value={pass.new} onChange={(e) => setPass({...pass, new: e.target.value})} className="dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100" /></div>
                      <div className="grid gap-2"><Label className="dark:text-slate-300">Konfirmasi Baru</Label><Input type="password" value={pass.confirm} onChange={(e) => setPass({...pass, confirm: e.target.value})} className="dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100" /></div>
                      
                      {/* Tombol diganti jadi Biru (Primary) */}
                      <Button type="submit" disabled={loading} className="bg-blue-700 hover:bg-blue-800 text-white dark:bg-blue-600 dark:hover:bg-blue-700">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Update Password"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>
          </div>
        </main>
      </div>

      {/* --- MODAL DIALOG HAPUS --- */}
      <Dialog open={isDeleteOpen} onOpenChange={(open) => { setIsDeleteOpen(open); if(!open) setSelectedIds([]); }}>
        <DialogContent className="sm:max-w-[400px] border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-950">
          <DialogHeader className="flex flex-col items-center text-center gap-2">
            <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-2">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle className="text-xl dark:text-slate-100">Hapus {selectedIds.length} Data?</DialogTitle>
            <DialogDescription className="text-center dark:text-slate-400">
               Data yang dihapus tidak bisa dikembalikan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button variant="outline" className="w-full sm:w-1/2 dark:bg-transparent dark:border-slate-700 dark:text-slate-100" onClick={() => { setIsDeleteOpen(false); setSelectedIds([]); }}>Batal</Button>
            <Button variant="destructive" className="w-full sm:w-1/2 bg-red-600 hover:bg-red-700 text-white" onClick={handleDeleteHolidays} disabled={loading}>
              {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : "Ya, Hapus Semua"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAL LOGOUT --- */}
      <Dialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen}>
        <DialogContent className="sm:max-w-[400px] p-6 border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-950">
           <DialogHeader className="flex flex-col items-center text-center gap-2">
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-2">
                 <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <DialogTitle className="text-xl dark:text-slate-100">Konfirmasi Keluar</DialogTitle>
              <DialogDescription className="text-center dark:text-slate-400">Anda harus login kembali untuk mengakses panel.</DialogDescription>
           </DialogHeader>
           <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
              <Button variant="outline" className="w-full sm:w-1/2 dark:bg-transparent dark:border-slate-700 dark:text-slate-100" onClick={() => setIsLogoutOpen(false)}>Batal</Button>
              <Button variant="destructive" className="w-full sm:w-1/2 bg-red-600 hover:bg-red-700 text-white" onClick={handleLogoutConfirm}>Ya, Keluar</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}