"use client";

import { useState, useEffect } from "react";
import {
  Menu,
  X,
  Search,
  UserPlus,
  Loader2,
  User,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Hooks & Components
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminUserTable } from "@/components/admin/AdminUserTable";

export default function AdminUsersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  // Hook for adding admin - we trigger this inside AdminUserTable
  let openAddModalCallback: () => void = () => {};
  const setOpenAddModalCallback = (trigger: () => void) => {
    openAddModalCallback = trigger;
  };

  // Ambil semua data & fungsi CRUD dari Custom Hook
  const {
    admins,
    currentAdmin,
    isLoading,
    isSubmitting,
    searchTerm,
    setSearchTerm,
    requestSort,
    saveAdmin,
    deleteAdmin,
  } = useAdminUsers();

  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState === "true") setIsSidebarCollapsed(true);
  }, []);

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", String(newState));
  };

  const handleLogoutConfirm = async () => {
    setIsLogoutOpen(false);
    const promise = fetch("/api/auth/logout", { method: "POST" });
    toast.promise(promise, {
      loading: "Sedang keluar...",
      success: () => {
        window.location.href = "/admin/login";
        return "Berhasil logout";
      },
      error: "Gagal logout",
    });
  };

  return (
    <div className="h-screen w-full bg-slate-50 dark:bg-slate-950 flex font-sans transition-colors duration-300 overflow-hidden">
      {/* 1. SIDEBAR */}
      <AdminSidebar
        active="users"
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isSidebarCollapsed={isSidebarCollapsed}
        onLogout={() => setIsLogoutOpen(true)}
      />

      {/* CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* 2. HEADER */}
        <AdminHeader
          title="Manajemen Pengguna"
          setSidebarOpen={setSidebarOpen}
          isSidebarCollapsed={isSidebarCollapsed}
          toggleSidebar={toggleSidebar}
          username={currentAdmin.username}
          jabatan={currentAdmin.jabatan}
        />

        {/* MAIN */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Daftar Admin</h1>
              <p className="text-slate-500 dark:text-slate-400">Kelola siapa saja yang bisa mengakses panel ini.</p>
            </div>
            <Button
              onClick={() => openAddModalCallback()}
              className="bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 shadow-lg shadow-blue-700/20 transition-all hover:scale-105 text-white"
            >
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

            <AdminUserTable
              data={admins}
              isLoading={isLoading}
              isSubmitting={isSubmitting}
              requestSort={requestSort}
              saveAdmin={saveAdmin}
              deleteAdmin={deleteAdmin}
              onOpenAddModalTrigger={setOpenAddModalCallback}
            />
          </div>
        </main>
      </div>

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
            <Button
              variant="outline"
              className="w-full sm:w-1/2 dark:bg-transparent dark:text-slate-100 dark:border-slate-700"
              onClick={() => setIsLogoutOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              className="w-full sm:w-1/2 bg-red-600 hover:bg-red-700 text-white font-semibold"
              onClick={handleLogoutConfirm}
            >
              Ya, Keluar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}