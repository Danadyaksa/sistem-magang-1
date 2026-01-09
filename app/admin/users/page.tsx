"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  LogOut,
  Menu,
  X,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Shield,
  Loader2,
  Lock,
  FileText, // <-- Import Icon Applicants
} from "lucide-react";

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

// Tipe Data Admin
type AdminUser = {
  id: string;
  username: string;
  createdAt: string;
};

export default function AdminUsersPage() {
  const router = useRouter();

  // State UI
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Data
  const [admins, setAdmins] = useState<AdminUser[]>([]);

  // State Modal Tambah Admin
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [formError, setFormError] = useState("");

  // --- 1. FETCH DATA ADMIN ---
  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/admins");
      if (!res.ok) throw new Error("Gagal mengambil data");
      const data = await res.json();
      setAdmins(data);
    } catch (error) {
      console.error("Error fetching admins:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // --- 2. LOGIC CRUD ---
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch (error) {
      router.push("/admin/login");
    }
  };

  const handleSave = async () => {
    setFormError("");
    if (!formData.username || !formData.password) {
      setFormError("Username dan password wajib diisi.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setFormError("Konfirmasi password tidak cocok.");
      return;
    }
    if (formData.password.length < 6) {
      setFormError("Password minimal 6 karakter.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Gagal menambah admin");
      }

      await fetchAdmins();
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      setFormError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      confirm("Yakin ingin menghapus admin ini? Akses mereka akan dicabut.")
    ) {
      try {
        await fetch(`/api/admins/${id}`, { method: "DELETE" });
        await fetchAdmins();
      } catch (error) {
        alert("Gagal menghapus admin.");
      }
    }
  };

  const resetForm = () => {
    setFormData({ username: "", password: "", confirmPassword: "" });
    setFormError("");
  };

  const filteredAdmins = admins.filter((admin) =>
    admin.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0`}
      >
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <h1 className="font-bold text-xl tracking-wider">Admin Panel</h1>
          <button
            className="ml-auto md:hidden"
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

          {/* MENU APPLICANTS DITAMBAH DI SINI */}
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
            onClick={() => router.push("/admin/applicants")}
          >
            <FileText className="mr-3 h-5 w-5" /> Applicants
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start text-white bg-slate-800"
          >
            <Users className="mr-3 h-5 w-5" /> Admin Users
          </Button>

          <div className="pt-8 mt-8 border-t border-slate-800">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-5 w-5" /> Keluar
            </Button>
          </div>
        </nav>
      </aside>

      {/* CONTENT */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b h-16 flex items-center px-4 md:px-8 justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2 hover:bg-slate-100 rounded"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6 text-slate-600" />
            </button>
            <h2 className="text-lg font-semibold text-slate-800">
              Manajemen Pengguna
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200">
              A
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8 space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Daftar Admin
              </h1>
              <p className="text-slate-500">
                Kelola siapa saja yang bisa mengakses panel ini.
              </p>
            </div>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-blue-700 hover:bg-blue-800"
            >
              <UserPlus className="mr-2 h-4 w-4" /> Tambah Admin
            </Button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Cari username..."
                  className="pl-9 bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">No</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Terdaftar Sejak</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-slate-500"
                    >
                      <div className="flex justify-center items-center gap-2">
                        <Loader2 className="animate-spin h-4 w-4" /> Memuat
                        data...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredAdmins.length > 0 ? (
                  filteredAdmins.map((admin, index) => (
                    <TableRow key={admin.id}>
                      <TableCell className="text-center text-slate-500">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                            <Shield className="h-4 w-4" />
                          </div>
                          {admin.username}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                        >
                          Super Admin
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {new Date(admin.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(admin.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-32 text-center text-slate-500"
                    >
                      Belum ada admin lain.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </main>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Tambah Admin Baru</DialogTitle>
            <DialogDescription>
              Buat akun baru untuk memberikan akses ke panel admin.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {formError && (
              <Alert variant="destructive" className="py-2 text-xs">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="misal: admin2"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  className="pl-9"
                  placeholder="******"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  className="pl-9"
                  placeholder="******"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              className="bg-blue-700 hover:bg-blue-800 w-full sm:w-auto"
              onClick={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...
                </>
              ) : (
                "Buat Akun"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
