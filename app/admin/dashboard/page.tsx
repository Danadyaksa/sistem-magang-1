"use client";

import Image from "next/image"; 
import { ModeToggle } from "@/components/mode-toggle";
import { useState, useEffect, useMemo } from "react";
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
  Loader2,
  AlertTriangle,
  PanelLeftClose, 
  PanelLeftOpen,
  ArrowUpDown, // <-- ICON SORT
  ArrowUp,     // <-- ICON SORT
  ArrowDown    // <-- ICON SORT
} from "lucide-react";

import { toast } from "sonner";

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
  DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Position = {
  id: number;
  title: string;
  filled: number;
  quota: number;
};

export default function AdminDashboard() {
  const router = useRouter();

  // State
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Desktop Minimize
  const [positions, setPositions] = useState<Position[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  // State Sorting
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ title: "", quota: 3, filled: 0 });

  // Admin Profile State
  const [admin, setAdmin] = useState({ username: "...", jabatan: "..." });

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
      toast.error("Gagal mengambil data posisi.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. LOGIC FILTERING & SORTING (USEMEMO)
  
  // Helper untuk hitung bobot status (biar bisa di-sort)
  const getStatusWeight = (filled: number, quota: number) => {
    if (filled >= quota) return 3; // Penuh (Paling tinggi)
    if (quota - filled <= 1) return 2; // Terbatas
    return 1; // Dibuka
  };

  const processedPositions = useMemo(() => {
    // A. Copy & Filter
    let data = positions.filter((p) => p.title.toLowerCase().includes(searchTerm.toLowerCase()));

    // B. Sorting
    if (sortConfig !== null) {
      data.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === 'title') {
            aValue = a.title.toLowerCase();
            bValue = b.title.toLowerCase();
        } else if (sortConfig.key === 'filled') {
            // Sort berdasarkan jumlah terisi
            aValue = a.filled;
            bValue = b.filled;
        } else if (sortConfig.key === 'status') {
            // Sort berdasarkan Status (Penuh > Terbatas > Dibuka)
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


  // 4. ACTIONS
  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.warning("Nama bidang tidak boleh kosong!");
      return;
    }
    if (formData.quota < 0 || formData.filled < 0) {
      toast.warning("Angka tidak boleh negatif!");
      return;
    }

    setIsSubmitting(true);

    const saveProcess = async () => {
      const payload = {
        title: formData.title,
        quota: formData.quota,
        filled: formData.filled,
      };

      const url = editingId ? `/api/positions/${editingId}` : "/api/positions";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Gagal menyimpan");

      await fetchPositions();
      return editingId ? "Data posisi berhasil diperbarui!" : "Posisi baru berhasil ditambahkan!";
    };

    toast.promise(saveProcess(), {
      loading: 'Menyimpan data...',
      success: (msg) => {
        setIsDialogOpen(false);
        resetForm();
        return msg;
      },
      error: 'Terjadi kesalahan saat menyimpan.',
      finally: () => setIsSubmitting(false)
    });
  };

  const handleDelete = (id: number) => {
    toast("Yakin ingin menghapus posisi ini?", {
      description: "Data kuota akan hilang permanen.",
      action: {
        label: "Ya, Hapus",
        onClick: async () => {
          try {
            const res = await fetch(`/api/positions/${id}`, { method: "DELETE" });
            if (res.ok) {
              toast.success("Posisi berhasil dihapus");
              fetchPositions();
            } else {
              toast.error("Gagal menghapus posisi");
            }
          } catch (error) {
            toast.error("Kesalahan server");
          }
        }
      },
      cancel: {
        label: "Batal",
        onClick: () => { }
      },
      duration: 5000,
    });
  };

  // --- LOGIC LOGOUT ---
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

  // Render Badge Status dengan Dark Mode Support
  const renderStatusBadge = (filled: number, quota: number) => {
    if (filled >= quota) return <Badge variant="destructive" className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">Penuh</Badge>;
    if (quota - filled <= 1) return <Badge variant="secondary" className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">Terbatas</Badge>;
    return <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">Dibuka</Badge>;
  };

  const openAddModal = () => { resetForm(); setEditingId(null); setIsDialogOpen(true); };
  const openEditModal = (pos: Position) => { setFormData({ title: pos.title, quota: pos.quota, filled: pos.filled }); setEditingId(pos.id); setIsDialogOpen(true); };
  const resetForm = () => setFormData({ title: "", quota: 3, filled: 0 });

  // Component untuk Item Sidebar
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
    // FIX LAYOUT
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
            active={true}
          />
          <SidebarItem 
            icon={FileText} 
            label="Applicants" 
            onClick={() => router.push("/admin/applicants")} 
          />
          <SidebarItem 
            icon={Users} 
            label="Admin Users" 
            onClick={() => router.push("/admin/users")} 
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

      {/* CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* HEADER */}
        <header className="bg-white dark:bg-slate-950 border-b dark:border-slate-800 h-16 flex items-center px-4 md:px-8 justify-between shadow-sm transition-colors duration-300 flex-none z-40">
          <div className="flex items-center gap-4">
            
            {/* Hamburger Mobile */}
            <button className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-6 w-6 text-slate-600 dark:text-slate-200" />
            </button>

            {/* Tombol Minimize Sidebar (Desktop) */}
            <button 
                className="hidden md:flex p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                onClick={toggleSidebar} 
                title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
                {isSidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>

            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Overview Kuota</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <ModeToggle />
            <div className="text-right hidden md:block">
              <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{admin.username}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{admin.jabatan}</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800">
              <User className="h-6 w-6" />
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
          {/* STATS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-md transition-shadow dark:bg-slate-900 dark:border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Posisi</CardTitle>
                <Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold dark:text-slate-100">{isLoading ? "..." : positions.length}</div></CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow dark:bg-slate-900 dark:border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Kuota</CardTitle>
                <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold dark:text-slate-100">{isLoading ? "..." : positions.reduce((acc, curr) => acc + curr.quota, 0)}</div></CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow dark:bg-slate-900 dark:border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Terisi</CardTitle>
              </CardHeader>
              <CardContent><div className="text-2xl font-bold dark:text-slate-100">{isLoading ? "..." : positions.reduce((acc, curr) => acc + curr.filled, 0)}</div></CardContent>
            </Card>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Manajemen Posisi</h1>
              <p className="text-slate-500 dark:text-slate-400">Kelola kuota dan nama bidang magang.</p>
            </div>
            <Button onClick={openAddModal} className="bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 shadow-lg shadow-blue-700/20 transition-all hover:scale-105 text-white">
              <Plus className="mr-2 h-4 w-4" /> Tambah Posisi
            </Button>
          </div>

          {/* TABLE CONTAINER */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                    placeholder="Cari nama bidang..." 
                    className="pl-9 bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 focus-visible:ring-blue-500" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent dark:border-slate-800">
                  <TableHead className="w-[50px] text-center dark:text-slate-400">No</TableHead>
                  
                  {/* HEADER NAMA BIDANG (SORTABLE) */}
                  <TableHead 
                    className="w-[40%] dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none group"
                    onClick={() => requestSort('title')}
                  >
                    <div className="flex items-center gap-2">
                       Nama Bidang
                       {sortConfig?.key === 'title' ? (
                          sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 text-blue-600" /> : <ArrowDown className="h-3 w-3 text-blue-600" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                    </div>
                  </TableHead>

                  {/* HEADER TERISI/KUOTA (SORTABLE) */}
                  <TableHead 
                    className="text-center dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none group"
                    onClick={() => requestSort('filled')}
                  >
                    <div className="flex items-center justify-center gap-2">
                       Terisi / Kuota
                       {sortConfig?.key === 'filled' ? (
                          sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 text-blue-600" /> : <ArrowDown className="h-3 w-3 text-blue-600" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                    </div>
                  </TableHead>

                  {/* HEADER STATUS (SORTABLE) */}
                  <TableHead 
                    className="text-center dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none group"
                    onClick={() => requestSort('status')}
                  >
                    <div className="flex items-center justify-center gap-2">
                       Status
                       {sortConfig?.key === 'status' ? (
                          sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 text-blue-600" /> : <ArrowDown className="h-3 w-3 text-blue-600" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                    </div>
                  </TableHead>

                  <TableHead className="text-right pr-6 dark:text-slate-400">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center text-slate-500 dark:text-slate-400"><div className="flex justify-center items-center gap-2"><Loader2 className="animate-spin h-4 w-4" /> Memuat data...</div></TableCell></TableRow>
                ) : processedPositions.length > 0 ? (
                  processedPositions.map((pos, index) => (
                    // TABLE ROW HOVER
                    <TableRow key={pos.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-200 dark:border-slate-800">
                      <TableCell className="text-center text-slate-500 dark:text-slate-400">{index + 1}</TableCell>
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                            <Briefcase className="h-4 w-4" />
                          </div>
                          {pos.title}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{pos.filled}</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className="text-slate-500 dark:text-slate-400">{pos.quota}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        {renderStatusBadge(pos.filled, pos.quota)}
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors" onClick={() => openEditModal(pos)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors" onClick={() => handleDelete(pos.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={5} className="h-32 text-center text-slate-500 dark:text-slate-400">Belum ada data posisi.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </main>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="animate-in fade-in zoom-in-95 duration-200 dark:bg-slate-950 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="dark:text-slate-100">{editingId ? "Edit Posisi" : "Tambah Posisi Baru"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label className="dark:text-slate-300">Nama Bidang</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Contoh: Sub Bagian Keuangan" className="dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label className="dark:text-slate-300">Terisi</Label><Input type="number" value={formData.filled} onChange={(e) => setFormData({ ...formData, filled: parseInt(e.target.value) || 0 })} className="dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" /></div>
              <div className="grid gap-2"><Label className="dark:text-slate-300">Kuota</Label><Input type="number" value={formData.quota} onChange={(e) => setFormData({ ...formData, quota: parseInt(e.target.value) || 0 })} className="dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={isSubmitting} className="bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 transition-all text-white">
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : "Simpan"}
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