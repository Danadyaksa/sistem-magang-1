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
  AlertTriangle // Import icon
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
  DialogDescription, // Import description
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

type AdminUser = {
  id: string;
  username: string;
  jabatan: string | null;
  createdAt: string;
};

export default function AdminUsersPage() {
  const router = useRouter();

  // --- STATE UI ---
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false); // State Logout

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

  // --- 1. FETCH DATA ---
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

  // --- 2. LOGIC ACTIONS ---
  
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

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 shadow-xl`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <h1 className="font-bold text-xl tracking-wider">Admin Panel</h1>
          <button className="ml-auto md:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}><X className="h-6 w-6" /></button>
        </div>
        <nav className="p-4 space-y-2">
          <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800 transition-colors" onClick={() => router.push("/admin/dashboard")}>
            <LayoutDashboard className="mr-3 h-5 w-5" /> Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800 transition-colors" onClick={() => router.push("/admin/applicants")}>
            <FileText className="mr-3 h-5 w-5" /> Applicants
          </Button>
          <Button variant="ghost" className="w-full justify-start text-white bg-slate-800 shadow-md shadow-slate-900/20">
            <Users className="mr-3 h-5 w-5" /> Admin Users
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800 transition-colors" onClick={() => router.push("/admin/pengaturan")}>
            <Settings className="mr-3 h-5 w-5" /> Settings
          </Button>
          <div className="pt-8 mt-8 border-t border-slate-800">
            <Button variant="ghost" className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors" onClick={() => setIsLogoutOpen(true)}>
              <LogOut className="mr-3 h-5 w-5" /> Keluar
            </Button>
          </div>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b h-16 flex items-center px-4 md:px-8 justify-between sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 hover:bg-slate-100 rounded" onClick={() => setSidebarOpen(true)}><Menu className="h-6 w-6 text-slate-600" /></button>
            <h2 className="text-lg font-semibold text-slate-800">Manajemen Pengguna</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <div className="font-bold text-sm text-slate-900">{currentAdmin.username}</div>
              <div className="text-xs text-slate-500">{currentAdmin.jabatan}</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200">
              <User className="h-6 w-6" />
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Daftar Admin</h1>
              <p className="text-slate-500">Kelola siapa saja yang bisa mengakses panel ini.</p>
            </div>
            <Button onClick={openAddModal} className="bg-blue-700 hover:bg-blue-800 shadow-lg shadow-blue-700/20 transition-all hover:scale-105">
              <UserPlus className="mr-2 h-4 w-4" /> Tambah Admin
            </Button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                    placeholder="Cari username atau jabatan..." 
                    className="pl-9 bg-white focus-visible:ring-blue-500" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[50px] text-center">No</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Jabatan</TableHead> 
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right pr-6">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center text-slate-500"><div className="flex justify-center items-center gap-2"><Loader2 className="animate-spin h-4 w-4" /> Memuat data...</div></TableCell></TableRow>
                ) : filteredAdmins.length > 0 ? (
                  filteredAdmins.map((admin, index) => (
                    <TableRow key={admin.id} className="hover:bg-slate-50 transition-colors duration-200">
                      <TableCell className="text-center text-slate-500">{index + 1}</TableCell>
                      <TableCell className="font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"><Shield className="h-4 w-4" /></div>
                          {admin.username}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {admin.jabatan || "-"}
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">Super Admin</Badge></TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" onClick={() => openEditModal(admin)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" onClick={() => handleDelete(admin.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={5} className="h-32 text-center text-slate-500">Belum ada admin lain.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </main>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Admin" : "Tambah Admin Baru"}</DialogTitle>
            <DialogDescription>
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
              <Label htmlFor="username">Username</Label>
              <Input id="username" 
              placeholder="Contoh: admin2 " 
              value={formData.username} 
              onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="jabatan">Jabatan</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                  id="jabatan" 
                  className="pl-9" 
                  placeholder="Contoh: Kepala Sub Bagian Umum" 
                  value={formData.jabatan} 
                  onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })} 
                />
              </div>
            </div>

            {editingId ? (
              <div className="space-y-4 pt-2 border-t mt-2 animate-in fade-in">
                <p className="text-sm font-medium text-slate-900">Ganti Password <span className="text-slate-400 font-normal">(Opsional)</span></p>
                <div className="grid gap-2">
                  <Label htmlFor="currentPassword">Password Lama</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input id="currentPassword" type="password" className="pl-9" placeholder="Password saat ini..." value={formData.currentPassword} onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="newPassword">Password Baru</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input id="newPassword" type="password" className="pl-9" placeholder="Password baru..." value={formData.newPassword} onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input id="confirmPassword" type="password" className="pl-9" placeholder="Ulangi password baru..." value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-2 animate-in fade-in">
                  <Label htmlFor="newPassword">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input id="newPassword" type="password" className="pl-9" placeholder="******" value={formData.newPassword} onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-2 animate-in fade-in">
                  <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input id="confirmPassword" type="password" className="pl-9" placeholder="******" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} />
                  </div>
                </div>
              </>
            )}

          </div>

          <DialogFooter>
            <Button type="submit" className="bg-blue-700 hover:bg-blue-800 w-full sm:w-auto transition-all" onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : (editingId ? "Simpan Perubahan" : "Buat Akun")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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