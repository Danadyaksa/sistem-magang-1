"use client";

import { ModeToggle } from "@/components/mode-toggle";
import { useState, useEffect } from "react";
import Image from "next/image"; // Import Image
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  LogOut,
  Menu,
  X,
  Search,
  Trash2,
  UserPlus,
  Shield,
  Loader2,
  Lock,
  User,
  FileText,
  Settings,
  Pencil,
  Briefcase,
  AlertTriangle,
  PanelLeftClose, // Icon tutup sidebar
  PanelLeftOpen   // Icon buka sidebar
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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type AdminUser = {
  id: string;
  username: string;
  jabatan: string | null;
  createdAt: string;
};

export default function AdminUsersPage() {
  const router = useRouter();

  // --- STATE UI ---
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Desktop Minimize
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  // --- STATE DATA ---
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState({ username: "...", jabatan: "..." });

  // --- STATE MODAL ---
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form Data
  const [formData, setFormData] = useState({
    username: "",
    jabatan: "",
    currentPassword: "", 
    newPassword: "",     
    confirmPassword: "", 
  });
  const [formError, setFormError] = useState("");

  // --- 1. CEK LOCAL STORAGE SAAT PERTAMA LOAD ---
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState === "true") {
      setIsSidebarCollapsed(true);
    }
  }, []);

  // --- FUNGSI TOGGLE SIDEBAR + SIMPAN KE STORAGE ---
  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", String(newState));
  };

  // --- 2. FETCH DATA ---
  useEffect(() => {
    fetchAdmins();
    fetchCurrentSession();
  }, []);

  const fetchCurrentSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (res.ok) {
        setCurrentAdmin({
          username: data.username,
          jabatan: data.jabatan || "Administrator",
        });
      } else {
        router.push("/admin/login");
      }
    } catch (error) { console.error("Auth error", error); }
  };

  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/admins");
      if (!res.ok) throw new Error("Gagal mengambil data");
      const data = await res.json();
      setAdmins(data);
    } catch (error) { 
      toast.error("Gagal memuat data admin.");
    } finally { 
      setIsLoading(false); 
    }
  };

  // --- 3. LOGIC ACTIONS ---
  
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

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ username: "", jabatan: "", currentPassword: "", newPassword: "", confirmPassword: "" });
    setFormError("");
    setIsDialogOpen(true);
  };

  const openEditModal = (admin: AdminUser) => {
    setEditingId(admin.id);
    setFormData({ 
      username: admin.username, 
      jabatan: admin.jabatan || "", 
      currentPassword: "", 
      newPassword: "", 
      confirmPassword: "" 
    });
    setFormError("");
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    setFormError("");

    if (!formData.username) {
      setFormError("Username wajib diisi.");
      toast.warning("Mohon isi username terlebih dahulu.");
      return;
    }

    if (!editingId) {
       if (!formData.newPassword) {
         setFormError("Password wajib diisi untuk admin baru.");
         return;
       }
       if (formData.newPassword !== formData.confirmPassword) {
         setFormError("Konfirmasi password tidak cocok.");
         return;
       }
       if (formData.newPassword.length < 6) {
         setFormError("Password minimal 6 karakter.");
         return;
       }
    } else {
      if (formData.newPassword || formData.confirmPassword || formData.currentPassword) {
        if (!formData.currentPassword) {
          setFormError("Masukkan password lama untuk mengubah password.");
          return;
        }
        if (!formData.newPassword) {
          setFormError("Masukkan password baru.");
          return;
        }
        if (formData.newPassword !== formData.confirmPassword) {
          setFormError("Konfirmasi password baru tidak cocok.");
          return;
        }
        if (formData.newPassword.length < 6) {
          setFormError("Password baru minimal 6 karakter.");
          return;
        }
      }
    }

    setIsSubmitting(true);
    
    const saveProcess = async () => {
        const url = editingId ? `/api/admins/${editingId}` : "/api/admins";
        const method = editingId ? "PUT" : "POST";

        const payload: any = { 
            username: formData.username,
            jabatan: formData.jabatan
        };
        
        if (editingId) {
            if (formData.newPassword) {
            payload.currentPassword = formData.currentPassword;
            payload.newPassword = formData.newPassword;
            }
        } else {
            payload.password = formData.newPassword;
        }

        const res = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Gagal menyimpan data");
        }

        await fetchAdmins(); 
        return editingId ? "Data admin berhasil diperbarui!" : "Admin baru berhasil dibuat!";
    };

    toast.promise(saveProcess(), {
        loading: 'Menyimpan data...',
        success: (message) => {
            setIsDialogOpen(false);
            setEditingId(null);
            return message;
        },
        error: (err) => {
            setFormError(err.message);
            return err.message;
        },
        finally: () => setIsSubmitting(false)
    });
  };

  const handleDelete = (id: string) => {
    toast("Yakin ingin menghapus admin ini?", {
        description: "Tindakan ini tidak bisa dibatalkan.",
        action: {
            label: "Ya, Hapus",
            onClick: async () => {
                try {
                    const res = await fetch(`/api/admins/${id}`, { method: "DELETE" });
                    if(res.ok) {
                        toast.success("Admin berhasil dihapus");
                        fetchAdmins();
                    } else {
                        toast.error("Gagal menghapus admin");
                    }
                } catch (error) {
                    toast.error("Terjadi kesalahan sistem");
                }
            }
        },
        cancel: {
            label: "Batal",
            onClick: () => {}
        },
        duration: 5000,
    });
  };

  const filteredAdmins = admins.filter((admin) =>
    admin.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (admin.jabatan && admin.jabatan.toLowerCase().includes(searchTerm.toLowerCase()))
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
    // FIX LAYOUT: h-screen & overflow-hidden
    <div className="h-screen w-full bg-slate-50 dark:bg-slate-950 flex font-sans transition-colors duration-300 overflow-hidden">
      
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

        {/* Sidebar Menu */}
        <nav className="p-3 space-y-2 flex-1 overflow-y-auto overflow-x-hidden">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            onClick={() => router.push("/admin/dashboard")}
          />
          <SidebarItem 
            icon={FileText} 
            label="Applicants" 
            onClick={() => router.push("/admin/applicants")}
          />
          <SidebarItem 
            icon={Users} 
            label="Admin Users" 
            active={true}
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

      {/* MAIN CONTENT WRAPPER */}
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
                onClick={toggleSidebar} 
                title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
                {isSidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>

            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Manajemen Pengguna</h2>
          </div>
          <div className="flex items-center gap-4">
            <ModeToggle />
            <div className="text-right hidden md:block">
              <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{currentAdmin.username}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{currentAdmin.jabatan}</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800">
              <User className="h-6 w-6" />
            </div>
          </div>
        </header>

        {/* MAIN */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Daftar Admin</h1>
              <p className="text-slate-500 dark:text-slate-400">Kelola siapa saja yang bisa mengakses panel ini.</p>
            </div>
            <Button onClick={openAddModal} className="bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 shadow-lg shadow-blue-700/20 transition-all hover:scale-105 text-white">
              <UserPlus className="mr-2 h-4 w-4" /> Tambah Admin
            </Button>
          </div>

          {/* TABLE CONTAINER */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                    placeholder="Cari username atau jabatan..." 
                    className="pl-9 bg-white dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100 focus-visible:ring-blue-500" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent dark:border-slate-800">
                  <TableHead className="w-[50px] text-center dark:text-slate-400">No</TableHead>
                  <TableHead className="dark:text-slate-400">Username</TableHead>
                  <TableHead className="dark:text-slate-400">Jabatan</TableHead> 
                  <TableHead className="dark:text-slate-400">Role</TableHead>
                  <TableHead className="text-right pr-6 dark:text-slate-400">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center text-slate-500 dark:text-slate-400"><div className="flex justify-center items-center gap-2"><Loader2 className="animate-spin h-4 w-4" /> Memuat data...</div></TableCell></TableRow>
                ) : filteredAdmins.length > 0 ? (
                  filteredAdmins.map((admin, index) => (
                    <TableRow key={admin.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-200 dark:border-slate-800">
                      <TableCell className="text-center text-slate-500 dark:text-slate-400">{index + 1}</TableCell>
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300"><Shield className="h-4 w-4" /></div>
                          {admin.username}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-300">
                        {admin.jabatan || "-"}
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 border-blue-200 dark:border-blue-800">Super Admin</Badge></TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors" onClick={() => openEditModal(admin)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors" onClick={() => handleDelete(admin.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={5} className="h-32 text-center text-slate-500 dark:text-slate-400">Belum ada admin lain.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </main>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] dark:bg-slate-950 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="dark:text-slate-100">{editingId ? "Edit Admin" : "Tambah Admin Baru"}</DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              {editingId ? "Ubah detail login untuk akun ini." : "Buat akun baru untuk memberikan akses ke panel admin."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {formError && (
              <Alert variant="destructive" className="py-2 text-xs animate-in slide-in-from-top-2">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <Label htmlFor="username" className="dark:text-slate-300">Username</Label>
              <Input id="username" 
              placeholder="Contoh: admin2 " 
              className="dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
              value={formData.username} 
              onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="jabatan" className="dark:text-slate-300">Jabatan</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                  id="jabatan" 
                  className="pl-9 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" 
                  placeholder="Contoh: Kepala Sub Bagian Umum" 
                  value={formData.jabatan} 
                  onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })} 
                />
              </div>
            </div>

            {editingId ? (
              <div className="space-y-4 pt-2 border-t dark:border-slate-800 mt-2 animate-in fade-in">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-200">Ganti Password <span className="text-slate-400 font-normal">(Opsional)</span></p>
                <div className="grid gap-2">
                  <Label htmlFor="currentPassword" className="dark:text-slate-300">Password Lama</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input id="currentPassword" type="password" className="pl-9 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" placeholder="Password saat ini..." value={formData.currentPassword} onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="newPassword" className="dark:text-slate-300">Password Baru</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input id="newPassword" type="password" className="pl-9 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" placeholder="Password baru..." value={formData.newPassword} onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword" className="dark:text-slate-300">Konfirmasi Password Baru</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input id="confirmPassword" type="password" className="pl-9 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" placeholder="Ulangi password baru..." value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-2 animate-in fade-in">
                  <Label htmlFor="newPassword" className="dark:text-slate-300">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input id="newPassword" type="password" className="pl-9 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" placeholder="******" value={formData.newPassword} onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-2 animate-in fade-in">
                  <Label htmlFor="confirmPassword" className="dark:text-slate-300">Konfirmasi Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input id="confirmPassword" type="password" className="pl-9 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" placeholder="******" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} />
                  </div>
                </div>
              </>
            )}

          </div>

          <DialogFooter>
            <Button type="submit" className="bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 w-full sm:w-auto transition-all text-white" onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : (editingId ? "Simpan Perubahan" : "Buat Akun")}
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