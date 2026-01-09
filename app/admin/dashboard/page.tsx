"use client";

import { useState, useEffect } from "react";
// import Link from "next/link"; // Ga kepake karena pake router.push
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
  Pencil,
  Trash2,
  Loader2,
  FileText, // <-- Gue tambahin buat icon Applicants
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// Tipe Data
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

  // --- 1. AMBIL DATA DARI DATABASE (FETCH) ---
  const fetchPositions = async () => {
    try {
      const res = await fetch("/api/positions", { cache: "no-store" });
      const data = await res.json();

      if (Array.isArray(data)) {
        setPositions(data);
      } else {
        console.error("API Error:", data);
        setPositions([]);
      }
    } catch (error) {
      console.error("Network Error:", error);
      setPositions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  // --- 2. FUNGSI SIMPAN & HAPUS ---
  const handleSave = async () => {
    setIsSubmitting(true);
    const payload = {
      title: formData.title,
      quota: formData.quota,
      filled: formData.filled,
    };

    try {
      if (editingId) {
        // Update Data
        await fetch(`/api/positions/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Tambah Data Baru
        await fetch("/api/positions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
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
      try {
        await fetch(`/api/positions/${id}`, { method: "DELETE" });
        await fetchPositions();
      } catch (error) {
        alert("Gagal menghapus");
      }
    }
  };

  // --- 3. FITUR LOGOUT ---
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error", error);
      router.push("/admin/login");
    }
  };

  // --- HELPER LAIN ---
  const getStatus = (filled: number, quota: number) => {
    if (filled >= quota) return "Penuh";
    if (quota - filled <= 1) return "Terbatas";
    return "Dibuka";
  };

  const openAddModal = () => {
    resetForm();
    setEditingId(null);
    setIsDialogOpen(true);
  };

  const openEditModal = (pos: Position) => {
    setFormData({ title: pos.title, quota: pos.quota, filled: pos.filled });
    setEditingId(pos.id);
    setIsDialogOpen(true);
  };

  const resetForm = () => setFormData({ title: "", quota: 3, filled: 0 });

  const filteredPositions = positions.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
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
            className="w-full justify-start text-white bg-slate-800"
          >
            <LayoutDashboard className="mr-3 h-5 w-5" /> Dashboard
          </Button>

          {/* MENU APPLICANTS (BARU) */}
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
            onClick={() => router.push("/admin/applicants")}
          >
            <FileText className="mr-3 h-5 w-5" /> Applicants
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
            onClick={() => router.push("/admin/users")}
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
              Overview Kuota
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200">
              A
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8 space-y-8">
          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Total Posisi
                </CardTitle>
                <Briefcase className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? "..." : positions.length}
                </div>
                <p className="text-xs text-slate-500">Bidang tersedia</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Total Kuota
                </CardTitle>
                <Users className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading
                    ? "..."
                    : positions.reduce((acc, curr) => acc + curr.quota, 0)}
                </div>
                <p className="text-xs text-slate-500">
                  Kursi magang keseluruhan
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Terisi
                </CardTitle>
                {!isLoading && positions.length > 0 && (
                  <div className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">
                    {Math.round(
                      (positions.reduce((acc, curr) => acc + curr.filled, 0) /
                        positions.reduce((acc, curr) => acc + curr.quota, 0)) *
                        100
                    )}
                    %
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading
                    ? "..."
                    : positions.reduce((acc, curr) => acc + curr.filled, 0)}
                </div>
                <p className="text-xs text-slate-500">Peserta aktif</p>
              </CardContent>
            </Card>
          </div>

          {/* TABLE */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Manajemen Posisi
                </h3>
                <p className="text-sm text-slate-500">
                  Kelola kuota dan nama bidang magang.
                </p>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Cari bidang..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button
                  onClick={openAddModal}
                  className="bg-blue-700 hover:bg-blue-800"
                >
                  <Plus className="h-4 w-4 mr-2" /> Tambah
                </Button>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Nama Bidang</TableHead>
                  <TableHead className="text-center">Terisi</TableHead>
                  <TableHead className="text-center">Total Kuota</TableHead>
                  <TableHead>Status</TableHead>
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
                ) : filteredPositions.length > 0 ? (
                  filteredPositions.map((pos) => {
                    const status = getStatus(pos.filled, pos.quota);
                    return (
                      <TableRow key={pos.id}>
                        <TableCell className="font-medium text-slate-900">
                          {pos.title}
                        </TableCell>
                        <TableCell className="text-center">
                          {pos.filled}
                        </TableCell>
                        <TableCell className="text-center">
                          {pos.quota}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${
                              status === "Dibuka"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : ""
                            } ${
                              status === "Terbatas"
                                ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                : ""
                            } ${
                              status === "Penuh"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : ""
                            }`}
                          >
                            {status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-500 hover:text-blue-700"
                              onClick={() => openEditModal(pos)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-500 hover:text-red-700"
                              onClick={() => handleDelete(pos.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-slate-500"
                    >
                      Belum ada data.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </main>
      </div>

      {/* MODAL */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Posisi" : "Tambah Posisi Baru"}
            </DialogTitle>
            <DialogDescription>
              Sesuaikan nama bidang dan jumlah kuota magang di sini.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nama Bidang</Label>
              <Input
                id="name"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Contoh: Sub Bagian Umum"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="filled">Terisi</Label>
                <Input
                  id="filled"
                  type="number"
                  min={0}
                  value={formData.filled}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      filled: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="quota">Total Kuota</Label>
                <Input
                  id="quota"
                  type="number"
                  min={1}
                  value={formData.quota}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quota: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              className="bg-blue-700 hover:bg-blue-800"
              onClick={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...
                </>
              ) : (
                "Simpan Perubahan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
