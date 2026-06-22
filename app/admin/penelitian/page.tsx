"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Hooks & Components
import { usePenelitian } from "@/hooks/usePenelitian";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { PenelitianFilters } from "@/components/admin/PenelitianFilters";
import { PenelitianTable } from "@/components/admin/PenelitianTable";

export default function AdminResearchPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  // Ambil semua data & fungsi dari Custom Hook
  const {
    dataPenelitian,
    loading,
    admin,
    currentPage,
    setCurrentPage,
    totalPages,
    startIndex,
    endIndex,
    itemsPerPage,
    setItemsPerPage,
    exportToExcel,
    fetchData,
    ...filterProps
  } = usePenelitian();

  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState === "true") setIsSidebarCollapsed(true);
  }, []);

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", String(newState));
  };

  return (
    <div className="h-screen w-full bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300 overflow-hidden">
      {/* 1. SIDEBAR */}
      <AdminSidebar
        active="penelitian"
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isSidebarCollapsed={isSidebarCollapsed}
        onLogout={() => setIsLogoutOpen(true)}
      />

      {/* CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* 2. HEADER */}
        <AdminHeader
          title="Izin Penelitian"
          setSidebarOpen={setSidebarOpen}
          isSidebarCollapsed={isSidebarCollapsed}
          toggleSidebar={toggleSidebar}
          username={admin.username}
          jabatan={admin.jabatan}
        />

        {/* MAIN */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
          {/* 3. FILTERS */}
          <PenelitianFilters
            onExport={exportToExcel}
            onRefresh={fetchData}
            {...filterProps}
          />

          {/* 4. TABLE CONTAINER */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden flex flex-col h-full max-h-[calc(100vh-18rem)]">
            <div className="flex-1 overflow-auto">
              <PenelitianTable
                data={dataPenelitian}
                isLoading={loading}
                startIndex={startIndex}
                requestSort={filterProps.requestSort}
                deletePenelitian={filterProps.deletePenelitian}
                updateStatus={filterProps.updateStatus}
                sendWhatsApp={filterProps.sendWhatsApp}
                sendEmail={filterProps.sendEmail}
              />
            </div>

            {/* 5. PAGINATION */}
            <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 flex flex-col sm:flex-row justify-between items-center gap-4 flex-none">
              <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                <span>
                  Menampilkan <strong>{dataPenelitian.length > 0 ? startIndex + 1 : 0}</strong> -{" "}
                  <strong>{Math.min(endIndex, dataPenelitian.length)}</strong> dari{" "}
                  <strong>{dataPenelitian.length}</strong> data
                </span>
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline">| Baris:</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(val) => {
                      setItemsPerPage(Number(val));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="h-8 w-[70px] bg-white dark:bg-slate-950">
                      <SelectValue placeholder="10" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pNum = i + 1;
                    if (totalPages > 5 && currentPage > 3) {
                      pNum = currentPage - 2 + i;
                    }
                    if (pNum > totalPages) return null;
                    return (
                      <Button
                        key={pNum}
                        variant={currentPage === pNum ? "default" : "outline"}
                        size="sm"
                        className={`h-8 w-8 p-0 ${
                          currentPage === pNum ? "bg-blue-600 hover:bg-blue-700 text-white" : ""
                        }`}
                        onClick={() => setCurrentPage(pNum)}
                      >
                        {pNum}
                      </Button>
                    );
                  })}
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
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.href = "/admin/login";
              }}
            >
              Ya, Keluar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}