"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  LogOut,
  Menu,
  Settings,
  X,
  Plus,
  Search,
  Pencil,
  Trash2,
  FileText,
  User,
  Loader2, // Tambah loader
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type Position = {
  id: number;
  title: string;
  filled: number;
  quota: number;
};

export default function AdminDashboard() {
  const router = useRouter();

  // State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ title: "", quota: 3, filled: 0 });

  // Admin Profile State
  const [admin, setAdmin] = useState({ username: "...", jabatan: "..." });

  // 1. FETCH DATA
  useEffect(() => {
    fetchPositions();
    fetchAdminProfile();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (res.ok) {
        setAdmin({ username: data.username, jabatan: data.jabatan || "Administrator" });
      } else {
        router.push("/admin/login");
      }
    } catch (error) {
      console.error("Auth Error", error);
    }
  };

  const fetchPositions = async () => {
    try {
      const res = await fetch("/api/positions", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) setPositions(data);
    } catch (error) {
      console.error("Error fetching positions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. ACTIONS
  const handleSave = async () => {
    setIsSubmitting(true);
    const payload = {
      title: formData.title,
      quota: formData.quota,
      filled: formData.filled,
    };

    try {
      const url = editingId ? `/api/positions/${editingId}` : "/api/positions";
      const method = editingId ? "PUT" : "POST";
      
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      await fetchPositions();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      alert("Gagal menyimpan data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Yakin hapus data ini?")) {
      await fetch(`/api/positions/${id}`, { method: "DELETE" });
      fetchPositions();
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  // Helpers untuk Badge yang lebih cantik
  const renderStatusBadge = (filled: number, quota: number) => {
    if (filled >= quota) {
      return <Badge variant="destructive" className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200">Penuh</Badge>;
    }
    if (quota - filled <= 1) {
      return <Badge variant="secondary" className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200">Terbatas</Badge>;
    }
    return <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200">Dibuka</Badge>;
  };

  const openAddModal = () => { resetForm(); setEditingId(null); setIsDialogOpen(true); };
  const openEditModal = (pos: Position) => { setFormData({ title: pos.title, quota: pos.quota, filled: pos.filled }); setEditingId(pos.id); setIsDialogOpen(true); };
  const resetForm = () => setFormData({ title: "", quota: 3, filled: 0 });

  const filteredPositions = positions.filter((p) => p.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 shadow-xl`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <h1 className="font-bold text-xl tracking-wider">Admin Panel</h1>
          <button className="ml-auto md:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}><X className="h-6 w-6" /></button>
        </div>
        <nav className="p-4 space-y-2">
          {/* MENU DASHBOARD AKTIF */}
          <Button variant="ghost" className="w-full justify-start text-white bg-slate-800 shadow-md shadow-slate-900/20">
            <LayoutDashboard className="mr-3 h-5 w-5" /> Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800" onClick={() => router.push("/admin/applicants")}>
            <FileText className="mr-3 h-5 w-5" /> Applicants
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800" onClick={() => router.push("/admin/users")}>
            <Users className="mr-3 h-5 w-5" /> Admin Users
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800" onClick={() => router.push("/admin/pengaturan")}>
            <Settings className="mr-3 h-5 w-5" /> Settings
          </Button>
          <div className="pt-8 mt-8 border-t border-slate-800">
            <Button variant="ghost" className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20" onClick={handleLogout}>
              <LogOut className="mr-3 h-5 w-5" /> Keluar
            </Button>
          </div>
        </nav>
      </aside>

      {/* CONTENT */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b h-16 flex items-center px-4 md:px-8 justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 hover:bg-slate-100 rounded" onClick={() => setSidebarOpen(true)}><Menu className="h-6 w-6 text-slate-600" /></button>
            <h2 className="text-lg font-semibold text-slate-800">Overview Kuota</h2>
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

        <main className="p-4 md:p-8 space-y-8">
          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Total Posisi</CardTitle>
                <Briefcase className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{isLoading ? "..." : positions.length}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Total Kuota</CardTitle>
                <Users className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{isLoading ? "..." : positions.reduce((acc, curr) => acc + curr.quota, 0)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Terisi</CardTitle>
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{isLoading ? "..." : positions.reduce((acc, curr) => acc + curr.filled, 0)}</div></CardContent>
            </Card>
          </div>

          {/* TABLE CONTAINER MIRIP ADMIN USERS */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Manajemen Posisi</h1>
              <p className="text-slate-500">Kelola kuota dan nama bidang magang.</p>
            </div>
            <Button onClick={openAddModal} className="bg-blue-700 hover:bg-blue-800">
              <Plus className="mr-2 h-4 w-4" /> Tambah Posisi
            </Button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             {/* HEADER PENCARIAN DI DALAM KOTAK PUTIH */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input placeholder="Cari nama bidang..." className="pl-9 bg-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] text-center">No</TableHead>
                  <TableHead className="w-[40%]">Nama Bidang</TableHead>
                  <TableHead className="text-center">Terisi / Kuota</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right pr-6">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                   <TableRow><TableCell colSpan={5} className="h-24 text-center text-slate-500"><div className="flex justify-center items-center gap-2"><Loader2 className="animate-spin h-4 w-4" /> Memuat data...</div></TableCell></TableRow>
                ) : filteredPositions.length > 0 ? (
                  filteredPositions.map((pos, index) => (
                    <TableRow key={pos.id}>
                       {/* Kolom No */}
                      <TableCell className="text-center text-slate-500">{index + 1}</TableCell>
                      
                      {/* Kolom Nama Bidang dengan Ikon */}
                      <TableCell className="font-medium text-slate-900">
                         <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                <Briefcase className="h-4 w-4" />
                            </div>
                            {pos.title}
                         </div>
                      </TableCell>
                      
                      {/* Kolom Kuota */}
                      <TableCell className="text-center">
                        <span className="font-semibold text-slate-700">{pos.filled}</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className="text-slate-500">{pos.quota}</span>
                      </TableCell>

                      {/* Kolom Status (Badge Warna) */}
                      <TableCell className="text-center">
                        {renderStatusBadge(pos.filled, pos.quota)}
                      </TableCell>

                      {/* Kolom Aksi */}
                      <TableCell className="text-right pr-4">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => openEditModal(pos)}>
                             <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(pos.id)}>
                             <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={5} className="h-32 text-center text-slate-500">Belum ada data posisi.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </main>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Posisi" : "Tambah Posisi Baru"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Nama Bidang</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Contoh: Sub Bagian Keuangan" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Terisi</Label><Input type="number" value={formData.filled} onChange={(e) => setFormData({ ...formData, filled: parseInt(e.target.value) || 0 })} /></div>
              <div className="grid gap-2"><Label>Kuota</Label><Input type="number" value={formData.quota} onChange={(e) => setFormData({ ...formData, quota: parseInt(e.target.value) || 0 })} /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={handleSave} disabled={isSubmitting} className="bg-blue-700 hover:bg-blue-800">{isSubmitting ? "Menyimpan..." : "Simpan"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}