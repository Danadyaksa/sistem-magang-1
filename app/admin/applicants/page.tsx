"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";

// Hooks & Components
import { useApplicants } from "@/hooks/useApplicants";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ApplicantFilters } from "@/components/admin/ApplicantFilters";
import { ApplicantTable } from "@/components/admin/ApplicantTable";

export default function ApplicantsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  // Ambil semua data & fungsi logika dari custom hook
  const {
    pendaftar,
    positions,
    upts,
    loading,
    admin,
    currentPage,
    setCurrentPage,
    totalPages,
    startIndex,
    endIndex,
    exportToExcel,
    fetchData,
    ...filterProps
  } = useApplicants();

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
    <div className="h-screen w-full bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300 overflow-hidden">
      {/* 1. SIDEBAR */}
      <AdminSidebar
        active="applicants"
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isSidebarCollapsed={isSidebarCollapsed}
        onLogout={() => setIsLogoutOpen(true)}
      />

      {/* CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* 2. HEADER */}
        <AdminHeader
          title="Review Pelamar"
          setSidebarOpen={setSidebarOpen}
          isSidebarCollapsed={isSidebarCollapsed}
          toggleSidebar={toggleSidebar}
          username={admin.username}
          jabatan={admin.jabatan}
        />

        {/* MAIN */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
          {/* 3. FILTERS */}
          <ApplicantFilters
            onExport={exportToExcel}
            onRefresh={fetchData}
            {...filterProps}
          />

          {/* 4. CARD CONTAINER & TABLE */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden transition-colors flex flex-col h-full max-h-[calc(100vh-18rem)]">
            <div className="flex-1 overflow-auto">
              <ApplicantTable
                data={pendaftar}
                positions={positions}
                upts={upts}
                isLoading={loading}
                startIndex={startIndex}
                requestSort={filterProps.requestSort}
                deletePelamar={filterProps.deletePelamar}
                processStatus={filterProps.processStatus}
                sendWhatsApp={filterProps.sendWhatsApp}
                sendEmail={filterProps.sendEmail}
                getPositionName={filterProps.getPositionName}
              />
            </div>

            {/* 5. PAGINATION */}
            <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 flex flex-col sm:flex-row justify-between items-center gap-4 flex-none">
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span>
                  Menampilkan <strong>{pendaftar.length > 0 ? startIndex + 1 : 0}</strong> -{" "}
                  <strong>{Math.min(endIndex, pendaftar.length)}</strong> dari{" "}
                  <strong>{pendaftar.length}</strong> data
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1">
                  <span className="text-sm px-2">Halaman {currentPage}</span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </main>
      </div>

      {/* 6. LOGOUT DIALOG */}
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