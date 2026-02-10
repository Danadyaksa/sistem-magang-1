"use client";

import Image from "next/image"; 
import { ModeToggle } from "@/components/mode-toggle";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
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
  Save,
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
  Trash2,
  Plus,
  CheckCircle2
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
  
  // --- STATE DATA ---
  const [profile, setProfile] = useState({
    id: "", 
    username: "",
    jabatan: "",
  });

  const [pass, setPass] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const [currentAdmin, setCurrentAdmin] = useState({ username: "...", jabatan: "..." });

  // --- STATE HARI LIBUR ---
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [newHolidayDate, setNewHolidayDate] = useState<Date | undefined>(undefined);
  const [loadingHoliday, setLoadingHoliday] = useState(false);

  // --- 1. INITIAL LOAD ---
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState === "true") {
      setIsSidebarCollapsed(true);
    }
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
    } catch (error) {
      console.error("Auth error:", error);
    }
  };

  // --- FETCH HOLIDAYS ---
  const fetchHolidays = async () => {
    try {
      const res = await fetch("/api/holidays");
      if (res.ok) {
        const data = await res.json();
        setHolidays(data);
      }
    } catch (error) {
      console.error("Gagal ambil hari libur", error);
    }
  };

  // --- ADD HOLIDAY ---
  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayDate) {
      toast.warning("Pilih tanggal terlebih dahulu");
      return;
    }

    setLoadingHoliday(true);
    try {
      const res = await fetch("/api/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Keterangan dihapus, cuma kirim tanggal
        body: JSON.stringify({
          date: newHolidayDate, 
        }),
      });

      if (!res.ok) throw new Error("Gagal menyimpan");

      toast.success("Tanggal libur berhasil ditambahkan");
      setNewHolidayDate(undefined);
      fetchHolidays(); 
    } catch (error) {
      toast.error("Gagal menambah data (Mungkin tanggal sudah ada)");
    } finally {
      setLoadingHoliday(false);
    }
  };

  // --- DELETE HOLIDAY ---
  const handleDeleteHoliday = async (id: string) => {
    // Confirm delete diganti jadi toast action atau langsung aja biar cepet (optional), 
    // tapi biar aman pakai confirm window dulu standard.
    const confirm = window.confirm("Hapus tanggal libur ini?");
    if (!confirm) return;

    try {
      const res = await fetch(`/api/holidays/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal hapus");
      
      toast.success("Data dihapus");
      setHolidays(prev => prev.filter(h => h.id !== id));
    } catch (error) {
      toast.error("Gagal menghapus data");
    }
  };

  // --- UPDATE PROFIL ---
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

  // --- UPDATE PASSWORD ---
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

  // --- LOGOUT ---
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
      
      {/* SIDEBAR */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 bg-slate-900 text-white shadow-xl flex flex-col h-full transition-all duration-300 ease-in-out
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
        <header className="bg-white dark:bg-slate-950 border-b dark:border-slate-800 h-16 flex items-center px-4 md:px-8 justify-between shadow-sm transition-colors duration-300 flex-none z-40">
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
                <TabsTrigger 
                  value="profil" 
                  className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 font-medium rounded-md h-full transition-all dark:text-slate-400"
                >
                  <UserCircle className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Profil</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="password" 
                  className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 font-medium rounded-md h-full transition-all dark:text-slate-400"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Password</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="holidays" 
                  className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 font-medium rounded-md h-full transition-all dark:text-slate-400"
                >
                  <CalendarDays className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Hari Libur</span>
                </TabsTrigger>
              </TabsList>

              {/* CARD PROFIL */}
              <TabsContent value="profil" className="animate-in fade-in slide-in-from-left-4 duration-300">
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm dark:bg-slate-900 transition-colors">
                  <CardHeader>
                    <CardTitle className="dark:text-slate-100">Informasi Dasar</CardTitle>
                    <CardDescription className="dark:text-slate-400">Perbarui nama pengguna dan jabatan.</CardDescription>
                  </CardHeader>
                  <Separator className="bg-slate-100 dark:bg-slate-800" />
                  <CardContent className="pt-6">
                    <form onSubmit={handleUpdateProfile} className="space-y-5">
                      <div className="grid gap-2">
                        <Label className="text-slate-600 dark:text-slate-300">Username</Label>
                        <Input value={profile.username} onChange={(e) => setProfile({...profile, username: e.target.value})} className="dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100" />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-slate-600 dark:text-slate-300">Jabatan</Label>
                        <Input value={profile.jabatan} onChange={(e) => setProfile({...profile, jabatan: e.target.value})} placeholder="Contoh: Kepala Tata Usaha" className="dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100" />
                      </div>
                      <div className="pt-2">
                        <Button type="submit" disabled={loading} className="bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 w-full sm:w-auto text-white">
                          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Menyimpan...</> : <><Save className="w-4 h-4 mr-2" /> Simpan Perubahan</>}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* CARD PASSWORD */}
              <TabsContent value="password" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm dark:bg-slate-900 transition-colors">
                  <CardHeader>
                    <CardTitle className="dark:text-slate-100">Keamanan Akun</CardTitle>
                    <CardDescription className="dark:text-slate-400">Pastikan password Anda kuat.</CardDescription>
                  </CardHeader>
                  <Separator className="bg-slate-100 dark:bg-slate-800" />
                  <CardContent className="pt-6">
                    <form onSubmit={handleUpdatePassword} className="space-y-5">
                      <div className="grid gap-2">
                        <Label className="text-slate-600 dark:text-slate-300">Password Lama</Label>
                        <Input type="password" required value={pass.current} onChange={(e) => setPass({...pass, current: e.target.value})} className="dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100" />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-slate-600 dark:text-slate-300">Password Baru</Label>
                        <Input type="password" required value={pass.new} onChange={(e) => setPass({...pass, new: e.target.value})} className="dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100" />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-slate-600 dark:text-slate-300">Konfirmasi Password Baru</Label>
                        <Input type="password" required value={pass.confirm} onChange={(e) => setPass({...pass, confirm: e.target.value})} className="dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100" />
                      </div>
                      <div className="pt-2">
                        <Button type="submit" variant="destructive" disabled={loading} className="w-full sm:w-auto text-white">
                          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Memproses...</> : <><Shield className="w-4 h-4 mr-2" /> Update Password</>}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* CARD HARI LIBUR (WARNA BIRU + TANPA KETERANGAN) */}
              <TabsContent value="holidays" className="animate-in fade-in slide-in-from-right-4 duration-300">
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* FORM TAMBAH */}
                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm dark:bg-slate-900 transition-colors lg:col-span-1 h-fit">
                      <CardHeader>
                        <CardTitle className="dark:text-slate-100 text-lg">Tambah Tanggal Merah</CardTitle>
                        <CardDescription className="dark:text-slate-400">
                          Pilih tanggal yang diliburkan.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleAddHoliday} className="space-y-4">
                          <div className="space-y-2">
                            <Label className="dark:text-slate-300">Pilih Tanggal</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full justify-start text-left font-normal dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100",
                                    !newHolidayDate && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {newHolidayDate ? format(newHolidayDate, "PPP", { locale: idLocale }) : <span>Klik untuk pilih</span>}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0 dark:bg-slate-950 dark:border-slate-800" align="start">
                                <Calendar
                                  mode="single"
                                  selected={newHolidayDate}
                                  onSelect={setNewHolidayDate}
                                  initialFocus
                                  className="dark:bg-slate-950 dark:text-slate-100"
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          
                          {/* TOMBOL JADI BIRU (bg-blue-700) */}
                          <Button type="submit" disabled={loadingHoliday} className="w-full bg-blue-700 hover:bg-blue-800 text-white dark:bg-blue-600 dark:hover:bg-blue-700">
                             {loadingHoliday ? <Loader2 className="animate-spin h-4 w-4"/> : <><Plus className="h-4 w-4 mr-2"/> Tambah ke Daftar</>}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>

                    {/* LIST DAFTAR */}
                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm dark:bg-slate-900 transition-colors lg:col-span-2">
                      <CardHeader>
                        <CardTitle className="dark:text-slate-100 text-lg">Daftar Libur Nasional & Cuti</CardTitle>
                        <CardDescription className="dark:text-slate-400">
                          Tanggal-tanggal ini tidak akan dihitung sebagai hari magang.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {holidays.length === 0 ? (
                           <div className="text-center py-10 text-slate-500 dark:text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                              <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-50"/>
                              <p>Belum ada data tanggal merah.</p>
                           </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2">
                            {holidays.map((item) => (
                              <div key={item.id} className="flex items-center justify-between p-3 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 transition-colors group">
                                <div className="flex items-center gap-3">
                                   {/* ICON JADI BIRU (bg-blue-100 text-blue-700) */}
                                   <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center justify-center flex-none group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                                      <CalendarIcon className="h-4 w-4"/>
                                   </div>
                                   <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                                     {format(new Date(item.date), "EEEE, d MMMM yyyy", { locale: idLocale })}
                                   </p>
                                </div>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDeleteHoliday(item.id)}>
                                   <Trash2 className="h-4 w-4"/>
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                 </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* --- MODAL LOGOUT --- */}
      <Dialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen}>
        <DialogContent className="sm:max-w-[400px] p-6 dark:bg-slate-950 dark:border-slate-800">
           <DialogHeader className="flex flex-col items-center text-center gap-2">
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-2">
                 <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <DialogTitle className="text-xl dark:text-slate-100">Konfirmasi Keluar</DialogTitle>
              <DialogDescription className="text-center dark:text-slate-400">
                 Anda harus login kembali untuk mengakses panel.
              </DialogDescription>
           </DialogHeader>
           <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
              <Button variant="outline" className="w-full sm:w-1/2 dark:bg-transparent dark:text-slate-100 dark:border-slate-700" onClick={() => setIsLogoutOpen(false)}>Batal</Button>
              <Button variant="destructive" className="w-full sm:w-1/2 bg-red-600 hover:bg-red-700 text-white" onClick={handleLogoutConfirm}>Ya, Keluar</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}