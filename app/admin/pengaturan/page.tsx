"use client";

import Image from "next/image"; 
import { ModeToggle } from "@/components/mode-toggle";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  BookOpen
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

export default function PengaturanPage() {
  const router = useRouter();
  
  // --- STATE UI ---
  const [sidebarOpen, setSidebarOpen] = useState(false); 
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); 
  const [loading, setLoading] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  
  // --- STATE DATA ---
  const [profile, setProfile] = useState({ id: "", username: "", jabatan: "" });
  const [pass, setPass] = useState({ current: "", new: "", confirm: "" });
  const [currentAdmin, setCurrentAdmin] = useState({ username: "...", jabatan: "..." });

  // --- INITIAL LOAD ---
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState === "true") setIsSidebarCollapsed(true);
    fetchSession();
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

  // --- HANDLERS ---
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
      
      {/* SIDEBAR */}
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
          <SidebarItem icon={LayoutDashboard} label="Master Data" onClick={() => router.push("/admin/dashboard")}/>
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
              Kelola profil dan keamanan akun Anda.
            </p>
          </div>

          <div className="w-full">
            <Tabs defaultValue="profil" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1 mb-6 rounded-lg h-12 shadow-sm transition-colors">
                <TabsTrigger value="profil" className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 font-medium rounded-md h-full transition-all dark:text-slate-400">
                  <UserCircle className="w-4 h-4 mr-2" /> Profil
                </TabsTrigger>
                <TabsTrigger value="password" className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 font-medium rounded-md h-full transition-all dark:text-slate-400">
                  <Shield className="w-4 h-4 mr-2" /> Password
                </TabsTrigger>
              </TabsList>

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

              {/* TABS PASSWORD */}
              <TabsContent value="password">
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm dark:bg-slate-900 transition-colors">
                  <CardHeader><CardTitle className="dark:text-slate-100">Keamanan Akun</CardTitle><CardDescription className="dark:text-slate-400">Pastikan password Anda kuat.</CardDescription></CardHeader>
                  <Separator className="bg-slate-100 dark:bg-slate-800" />
                  <CardContent className="pt-6">
                    <form onSubmit={handleUpdatePassword} className="space-y-5">
                      <div className="grid gap-2"><Label className="dark:text-slate-300">Password Lama</Label><Input type="password" value={pass.current} onChange={(e) => setPass({...pass, current: e.target.value})} className="dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100" /></div>
                      <div className="grid gap-2"><Label className="dark:text-slate-300">Password Baru</Label><Input type="password" value={pass.new} onChange={(e) => setPass({...pass, new: e.target.value})} className="dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100" /></div>
                      <div className="grid gap-2"><Label className="dark:text-slate-300">Konfirmasi Baru</Label><Input type="password" value={pass.confirm} onChange={(e) => setPass({...pass, confirm: e.target.value})} className="dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100" /></div>
                      
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