"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  School,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { Position, Intern } from "@/hooks/usePkl";

// --- HELPER COMPONENTS ---
const StatusBadge = ({
  status,
  daysLeft,
}: {
  status: string;
  daysLeft: number;
}) => {
  if (status === "UPCOMING")
    return (
      <Badge
        variant="outline"
        className="bg-slate-100 text-slate-500 border-slate-300 px-2 py-0.5 text-[10px]"
      >
        Menunggu
      </Badge>
    );
  if (status === "FINISHED")
    return (
      <Badge
        variant="secondary"
        className="bg-slate-200 text-slate-700 px-2 py-0.5 text-[10px]"
      >
        Alumni
      </Badge>
    );
  if (daysLeft <= 5)
    return (
      <Badge
        variant="destructive"
        className="animate-pulse px-2 py-0.5 text-[10px]"
      >
        Sisa {daysLeft} Hari
      </Badge>
    );
  return (
    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200 shadow-none px-2 py-0.5 text-[10px]">
      Aktif
    </Badge>
  );
};

const SourceBadge = ({ path }: { path?: string | null }) => {
  if (path && (path === "-" || path.includes("manual-entry"))) {
    return (
      <span className="text-[8px] font-bold tracking-wider text-purple-600 bg-purple-50 border border-purple-200 px-1 py-[1px] rounded uppercase ml-1.5">
        Manual
      </span>
    );
  }
  return (
    <span className="text-[8px] font-bold tracking-wider text-blue-600 bg-blue-50 border border-blue-200 px-1 py-[1px] rounded uppercase ml-1.5">
      Web
    </span>
  );
};

// --- POSITION CARD ---
const PositionCard = ({
  pos,
  interns,
  onEditClick,
  onDeleteClick,
}: {
  pos: Position;
  interns: Intern[];
  onEditClick: (intern: Intern) => void;
  onDeleteClick: (intern: Intern) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  const sortedInterns = useMemo(() => {
    let sortableItems = [...interns];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof Intern];
        let bValue: any = b[sortConfig.key as keyof Intern];
        if (sortConfig.key === "periode") {
          aValue = new Date(a.tanggalMulai).getTime();
          bValue = new Date(b.tanggalMulai).getTime();
        }
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [interns, sortConfig]);

  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig?.key === key)
      return sortConfig.direction === "asc" ? (
        <ArrowUp className="ml-1 h-3 w-3" />
      ) : (
        <ArrowDown className="ml-1 h-3 w-3" />
      );
    return (
      <ArrowUpDown className="ml-1 h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
    );
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-sm overflow-hidden transition-all hover:shadow-md mb-3">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3 px-4 flex justify-between items-center select-none group"
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-1.5 rounded-md border shadow-sm transition-colors ${isOpen ? "bg-blue-50 border-blue-100" : "bg-white border-slate-100 dark:bg-slate-800 dark:border-slate-700"}`}
          >
            <Briefcase
              className={`h-4 w-4 ${isOpen ? "text-blue-600" : "text-slate-500"}`}
            />
          </div>
          <div>
            <CardTitle
              className={`text-sm md:text-base font-semibold ${isOpen ? "text-blue-700 dark:text-blue-400" : "text-slate-700 dark:text-slate-200"}`}
            >
              {pos.title}
            </CardTitle>
            {isOpen && (
              <div className="text-[10px] text-slate-500 mt-0.5 animate-in fade-in">
                Kuota Maksimal: {pos.quota}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isOpen && (
            <Badge
              variant="outline"
              className={`text-xs font-medium border ${interns.length >= pos.quota ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}
            >
              {interns.length} / {pos.quota} Peserta
            </Badge>
          )}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </div>
      {isOpen && (
        <CardContent className="p-0 animate-in slide-in-from-top-1">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 dark:bg-slate-900/30">
                <TableHead className="w-[50px] text-center text-xs">No</TableHead>
                <TableHead
                  className="text-xs cursor-pointer"
                  onClick={() => requestSort("namaLengkap")}
                >
                  <div className="flex items-center">
                    Nama {getSortIcon("namaLengkap")}
                  </div>
                </TableHead>
                <TableHead
                  className="text-xs cursor-pointer"
                  onClick={() => requestSort("periode")}
                >
                  <div className="flex items-center">
                    Periode {getSortIcon("periode")}
                  </div>
                </TableHead>
                <TableHead className="text-xs w-[30%]">Progress</TableHead>
                <TableHead className="text-center text-xs">Status</TableHead>
                <TableHead className="text-right text-xs">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedInterns.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-xs py-8 text-slate-400"
                  >
                    Kosong.
                  </TableCell>
                </TableRow>
              ) : (
                sortedInterns.map((intern: Intern, idx: number) => (
                  <TableRow
                    key={intern.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <TableCell className="text-center text-slate-500 px-4 py-2.5 text-xs">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="px-4 py-2.5">
                      <div className="font-medium flex items-center text-sm">
                        {intern.namaLengkap} <SourceBadge path={intern.cvPath} />
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <School className="h-3 w-3" /> {intern.instansi}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2.5">
                      <div className="flex flex-col text-xs">
                        <span>
                          {new Date(intern.tanggalMulai).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                          })}{" "}
                          -{" "}
                          {new Date(intern.tanggalSelesai).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "2-digit",
                          })}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Total {intern.totalDurasi} Hari
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2.5">
                      <div className="w-full space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span>{Math.round(intern.progress)}%</span>
                        </div>
                        <Progress value={intern.progress} className="h-1.5" />
                      </div>
                    </TableCell>
                    <TableCell className="text-center px-4 py-2.5">
                      <StatusBadge
                        status={intern.statusWaktu}
                        daysLeft={intern.sisaHari}
                      />
                    </TableCell>
                    <TableCell className="text-right px-4 py-2.5">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-400 hover:text-blue-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditClick(intern);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-400 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteClick(intern);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      )}
    </Card>
  );
};

// --- MAIN TABLE & MODALS CONTAINER ---
type PklTableProps = {
  positions: Position[];
  loading: boolean;
  groupedData: Record<number, Intern[]>;
  searchTerm: string;
  activeTab: string;
  
  // Actions
  onEditClick: (intern: Intern) => void;
  isEditOpen: boolean;
  setIsEditOpen: (open: boolean) => void;
  editForm: any;
  setEditForm: (form: any) => void;
  handleEditSubmit: () => Promise<void>;
  
  isDeleteOpen: boolean;
  setIsDeleteOpen: (open: boolean) => void;
  deletingIntern: Intern | null;
  setDeletingIntern: (intern: Intern | null) => void;
  confirmDelete: () => Promise<void>;
  
  isLogoutOpen: boolean;
  setIsLogoutOpen: (open: boolean) => void;
  
  isSubmitting: boolean;
};

export function PklTable({
  positions,
  loading,
  groupedData,
  searchTerm,
  activeTab,
  onEditClick,
  isEditOpen,
  setIsEditOpen,
  editForm,
  setEditForm,
  handleEditSubmit,
  isDeleteOpen,
  setIsDeleteOpen,
  deletingIntern,
  setDeletingIntern,
  confirmDelete,
  isLogoutOpen,
  setIsLogoutOpen,
  isSubmitting,
}: PklTableProps) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="h-24 text-center text-slate-500 py-12">
        <Loader2 className="animate-spin h-6 w-6 inline mr-2 text-blue-600" /> Memuat data...
      </div>
    );
  }

  const listContent = positions.map((pos) => {
    const isHistory = activeTab === "history";
    const filteredInterns =
      groupedData[pos.id]?.filter((i) => {
        if (isHistory) return i.statusWaktu === "FINISHED";
        return i.statusWaktu !== "FINISHED";
      }) || [];

    if (filteredInterns.length === 0 && (searchTerm || isHistory)) return null;

    return (
      <PositionCard
        key={pos.id}
        pos={pos}
        interns={filteredInterns}
        onEditClick={onEditClick}
        onDeleteClick={(i) => {
          setDeletingIntern(i);
          setIsDeleteOpen(true);
        }}
      />
    );
  });

  return (
    <>
      <div className="space-y-6">{listContent}</div>

      {/* DIALOG EDIT (SINGLE) */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px] dark:bg-slate-950">
          <DialogHeader>
            <DialogTitle>Edit Data Peserta</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nama Lengkap</Label>
              <Input
                value={editForm.namaLengkap || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, namaLengkap: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Instansi</Label>
                <Input
                  value={editForm.instansi || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, instansi: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>No HP</Label>
                <Input
                  value={editForm.nomorHp || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, nomorHp: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Mulai</Label>
                <Input
                  type="date"
                  value={editForm.tanggalMulai || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, tanggalMulai: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Selesai</Label>
                <Input
                  type="date"
                  value={editForm.tanggalSelesai || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, tanggalSelesai: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleEditSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" /> Menyimpan...
                </>
              ) : (
                "Update Data"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG LOGOUT */}
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
            <Button 
              variant="destructive" 
              className="w-full sm:w-1/2 bg-red-600 hover:bg-red-700 text-white font-semibold" 
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                router.push("/admin/login");
              }}
            >
              Ya, Keluar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG KONFIRMASI HAPUS */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[425px] p-6 border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-950">
          <div className="flex flex-col items-center text-center gap-2 pt-2">
            <div className="h-14 w-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-2 animate-in zoom-in duration-300">
              <Trash2 className="h-7 w-7 text-red-600 dark:text-red-500" />
            </div>
            <DialogTitle className="text-xl font-semibold dark:text-slate-100">
              Hapus Data Peserta?
            </DialogTitle>
            <DialogDescription className="text-center dark:text-slate-400">
              Anda akan menghapus data <b>"{deletingIntern?.namaLengkap}"</b>.
              <br/>Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-6">
            <Button 
              variant="outline" 
              className="w-full sm:w-1/2 h-10 border-slate-200 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800" 
              onClick={() => setIsDeleteOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button 
              variant="destructive" 
              className="w-full sm:w-1/2 h-10 bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20" 
              onClick={confirmDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="animate-spin h-4 w-4"/> : "Ya, Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
