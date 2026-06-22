"use client";

import { useState } from "react";
import {
  Eye,
  Trash2,
  ArrowUpDown,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Loader2,
  MapPin,
  MessageCircle,
  Mail,
} from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pendaftaran, Position, Upt } from "@/hooks/useApplicants";
import { toast } from "sonner";

type ApplicantTableProps = {
  data: Pendaftaran[];
  positions: Position[];
  upts: Upt[];
  isLoading: boolean;
  startIndex: number;
  requestSort: (key: string) => void;
  deletePelamar: (id: string) => Promise<boolean>;
  processStatus: (id: string, status: string, posId: number | null) => Promise<boolean>;
  sendWhatsApp: (p: Pendaftaran, selectedUptName?: string) => void;
  sendEmail: (p: Pendaftaran, selectedUptName?: string) => void;
  getPositionName: (id: number | null) => string;
};

export function ApplicantTable({
  data,
  positions,
  upts,
  isLoading,
  startIndex,
  requestSort,
  deletePelamar,
  processStatus,
  sendWhatsApp,
  sendEmail,
  getPositionName,
}: ApplicantTableProps) {
  // Dialog Detail States
  const [selectedPelamar, setSelectedPelamar] = useState<Pendaftaran | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionStatus, setActionStatus] = useState<string>("");
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [selectedUpt, setSelectedUpt] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Delete States
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingPelamar, setDeletingPelamar] = useState<Pendaftaran | null>(null);

  const handleProcess = async () => {
    if (!selectedPelamar || !actionStatus) {
      toast.warning("Pilih status keputusan terlebih dahulu!");
      return;
    }

    if (actionStatus === "ACCEPTED" && !selectedPosition) {
      toast.warning("Wajib pilih posisi/bidang penempatan!");
      return;
    }

    if (actionStatus === "RECOMMENDED" && !selectedUpt) {
      toast.warning("Wajib pilih UPT tujuan untuk rekomendasi!");
      return;
    }

    setIsProcessing(true);
    const success = await processStatus(
      selectedPelamar.id,
      actionStatus,
      actionStatus === "ACCEPTED" ? parseInt(selectedPosition) : null
    );

    if (success) {
      let msg = "Status berhasil diperbarui.";
      if (actionStatus === "ACCEPTED") msg = "Sukses! Pelamar DITERIMA.";
      if (actionStatus === "REJECTED") msg = "Sukses! Pelamar DITOLAK.";
      if (actionStatus === "RECOMMENDED")
        msg = `Sukses! Pelamar DIREKOMENDASIKAN ke ${selectedUpt}.`;

      toast.success(msg);
      setIsDialogOpen(false);
    }
    setIsProcessing(false);
  };

  const confirmDelete = async () => {
    if (!deletingPelamar) return;
    setIsProcessing(true);
    const success = await deletePelamar(deletingPelamar.id);
    if (success) {
      setIsDeleteOpen(false);
      setDeletingPelamar(null);
    }
    setIsProcessing(false);
  };

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
      <Table>
        <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-800 z-10">
          <TableRow className="border-b border-slate-200 dark:border-slate-700">
            <TableHead className="w-[50px] text-center h-10">No</TableHead>
            <TableHead className="h-10 cursor-pointer group" onClick={() => requestSort("namaLengkap")}>
              <div className="flex items-center gap-2">Nama Pelamar <ArrowUpDown className="h-3 w-3" /></div>
            </TableHead>
            <TableHead className="h-10 cursor-pointer group" onClick={() => requestSort("instansi")}>
              <div className="flex items-center gap-2">Instansi <ArrowUpDown className="h-3 w-3" /></div>
            </TableHead>
            <TableHead className="h-10 cursor-pointer group" onClick={() => requestSort("createdAt")}>
              <div className="flex items-center gap-2">Tgl Daftar <ArrowUpDown className="h-3 w-3" /></div>
            </TableHead>
            <TableHead className="h-10 cursor-pointer group" onClick={() => requestSort("status")}>
              <div className="flex items-center gap-2">Status <ArrowUpDown className="h-3 w-3" /></div>
            </TableHead>
            <TableHead className="text-right pr-6 h-10">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                <Loader2 className="animate-spin h-4 w-4 inline mr-2" /> Memuat data...
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-8 w-8 text-slate-300" />
                  <p>Data tidak ditemukan.</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, idx) => (
              <TableRow
                key={item.id}
                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800"
              >
                <TableCell className="text-center text-slate-500 py-3">{startIndex + idx + 1}</TableCell>
                <TableCell className="font-medium py-3">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-900 dark:text-slate-100 text-sm">
                        {item.namaLengkap}
                      </span>
                      {item.cvPath === "manual-entry-smk" && (
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0 h-5 font-medium"
                        >
                          SMK (Kolektif)
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                      {item.jurusan}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-slate-600 dark:text-slate-300 text-sm py-3">
                  {item.instansi}
                </TableCell>
                <TableCell className="text-slate-500 text-sm py-3">
                  {new Date(item.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell className="py-3">
                  {item.status === "PENDING" && (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      Pending
                    </Badge>
                  )}
                  {item.status === "ACCEPTED" && (
                    <Badge className="bg-green-100 text-green-700 border-green-200 shadow-none hover:bg-green-100">
                      Diterima
                    </Badge>
                  )}
                  {item.status === "REJECTED" && (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      Ditolak
                    </Badge>
                  )}
                  {item.status === "RECOMMENDED" && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Direkomendasikan
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right pr-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Dialog
                      open={isDialogOpen && selectedPelamar?.id === item.id}
                      onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (open) {
                          setSelectedPelamar(item);
                          setActionStatus("");
                          setSelectedPosition(item.positionId ? item.positionId.toString() : "");
                          setSelectedUpt("");

                          if (item.status === "ACCEPTED" && item.positionId) {
                            setActionStatus("ACCEPTED");
                            setSelectedPosition(item.positionId.toString());
                          } else if (item.status === "RECOMMENDED") {
                            setActionStatus("RECOMMENDED");
                          } else if (item.status === "REJECTED") {
                            setActionStatus("REJECTED");
                          }
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl bg-white dark:bg-slate-950 p-0 overflow-hidden">
                        <DialogHeader className="p-6 pb-2">
                          <DialogTitle>Detail Pendaftaran</DialogTitle>
                          <DialogDescription>Tinjau kelengkapan berkas kandidat.</DialogDescription>
                        </DialogHeader>

                        <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <Label className="text-xs text-slate-500 uppercase font-semibold">Nama Lengkap</Label>
                              <div className="font-medium border-b border-slate-100 dark:border-slate-800 pb-1">
                                {item.namaLengkap}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-slate-500 uppercase font-semibold">Asal Instansi</Label>
                              <div className="text-sm">{item.instansi}</div>
                              <div className="text-slate-500 text-xs">{item.jurusan}</div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-slate-500 uppercase font-semibold">Rencana Magang</Label>
                              <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                <Clock className="h-3 w-3 text-blue-500" />
                                {new Date(item.tanggalMulai).toLocaleDateString("id-ID")} —{" "}
                                {new Date(item.tanggalSelesai).toLocaleDateString("id-ID")}
                              </div>
                            </div>
                            {item.pembimbing && (
                              <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <Label className="text-xs text-slate-500 uppercase font-semibold">Guru Pembimbing</Label>
                                <div className="text-sm font-medium">{item.pembimbing}</div>
                                <div className="text-slate-500 text-xs">WA: {item.kontakPembimbing || "-"}</div>
                              </div>
                            )}
                            {item.positionId && (
                              <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <Label className="text-xs text-slate-500 uppercase font-semibold">Pilihan Bidang Magang</Label>
                                <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                  {getPositionName(item.positionId)}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-100 dark:border-slate-800 space-y-3">
                            <Label className="text-xs text-slate-500 uppercase font-semibold block mb-2">Lampiran</Label>
                            {item.cvPath !== "manual-entry-smk" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start text-slate-600 dark:text-slate-300"
                                asChild
                              >
                                <a href={`/uploads/${item.cvPath}`} target="_blank">
                                  <FileText className="mr-2 h-4 w-4 text-blue-600" /> Lihat CV / Proposal
                                </a>
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full justify-start text-slate-600 dark:text-slate-300"
                              asChild
                            >
                              <a href={`/uploads/${item.suratPath}`} target="_blank">
                                <FileText className="mr-2 h-4 w-4 text-orange-600" /> Surat Pengantar
                              </a>
                            </Button>
                          </div>
                        </div>
                        <Separator className="dark:bg-slate-800" />

                        {/* --- FORM KEPUTUSAN --- */}
                        <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50">
                          <div className="mb-4 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-semibold">Keputusan Admin</span>
                          </div>

                          <div className="grid gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-xs text-slate-500">Status Keputusan</Label>
                              <Select
                                value={actionStatus}
                                onValueChange={(val) => {
                                  setActionStatus(val);
                                  if (val !== "ACCEPTED") setSelectedPosition("");
                                }}
                              >
                                <SelectTrigger className="bg-white dark:bg-slate-950">
                                  <SelectValue placeholder="-- Tentukan Status --" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ACCEPTED">Diterima (Masuk Bidang)</SelectItem>
                                  <SelectItem value="RECOMMENDED">Direkomendasikan (Pindah UPT)</SelectItem>
                                  <SelectItem value="REJECTED">Ditolak</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {actionStatus === "ACCEPTED" && (
                              <div className="space-y-1.5 animate-in slide-in-from-top-2">
                                <Label className="text-xs text-slate-500">
                                  Penempatan Bidang <span className="text-red-500">*</span>
                                </Label>
                                <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                                  <SelectTrigger className="bg-white dark:bg-slate-950 border-blue-200 dark:border-blue-900">
                                    <SelectValue placeholder="Pilih Posisi Magang" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {positions.map((pos) => (
                                      <SelectItem key={pos.id} value={pos.id.toString()}>
                                        {pos.title}{" "}
                                        <span className="text-slate-400 text-xs ml-2">
                                          (Sisa: {pos.quota - pos.filled})
                                        </span>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {actionStatus === "RECOMMENDED" && (
                              <div className="space-y-1.5 animate-in slide-in-from-top-2">
                                <Label className="text-xs text-slate-500">
                                  Tujuan UPT <span className="text-red-500">*</span>
                                  {item.status === "RECOMMENDED" && (
                                    <span className="ml-2 text-[10px] text-orange-500 font-normal">
                                      (Pilih ulang jika ingin kirim notifikasi)
                                    </span>
                                  )}
                                </Label>
                                <Select value={selectedUpt} onValueChange={setSelectedUpt}>
                                  <SelectTrigger className="bg-white dark:bg-slate-950 border-orange-200 dark:border-orange-900">
                                    <SelectValue placeholder="Pilih UPT Tujuan" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {upts.length > 0 ? (
                                      upts.map((upt) => (
                                        <SelectItem key={upt.id} value={upt.name}>
                                          {upt.name}
                                        </SelectItem>
                                      ))
                                    ) : (
                                      <SelectItem value="dummy" disabled>
                                        Belum ada data UPT
                                      </SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>

                                {item.status === "RECOMMENDED" && !selectedUpt && (
                                  <p className="text-[10px] text-slate-500 mt-1">
                                    <MapPin className="h-3 w-3 inline mr-1" />
                                    Pilih ulang UPT agar alamat muncul di WhatsApp/Email.
                                  </p>
                                )}
                              </div>
                            )}

                            {actionStatus === "REJECTED" && (
                              <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900 rounded text-xs text-red-600 dark:text-red-400 animate-in fade-in">
                                <span className="font-semibold">Konfirmasi:</span> Pelamar akan ditolak.
                              </div>
                            )}
                          </div>
                        </div>

                        <DialogFooter className="p-4 bg-slate-100/50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 gap-2 sm:gap-0">
                          {item.status === "PENDING" ? (
                            <>
                              <Button
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                                disabled={isProcessing}
                              >
                                Batal
                              </Button>
                              <Button
                                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[150px]"
                                onClick={handleProcess}
                                disabled={isProcessing || !actionStatus}
                              >
                                {isProcessing ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...
                                  </>
                                ) : (
                                  "Simpan Keputusan"
                                )}
                              </Button>
                            </>
                          ) : (
                            <div className="flex flex-col sm:flex-row w-full justify-between items-center gap-4">
                              <div className="text-sm italic text-slate-500 flex flex-col">
                                <span>
                                  Status saat ini:{" "}
                                  <span
                                    className={`font-semibold ${
                                      item.status === "ACCEPTED"
                                        ? "text-green-600"
                                        : item.status === "RECOMMENDED"
                                        ? "text-blue-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    {item.status === "ACCEPTED"
                                      ? "Diterima"
                                      : item.status === "RECOMMENDED"
                                      ? "Direkomendasikan"
                                      : "Ditolak"}
                                  </span>
                                </span>
                                {isProcessing === false && actionStatus === item.status && (
                                  <span className="text-[10px] text-green-600 flex items-center mt-1">
                                    <CheckCircle className="h-3 w-3 mr-1" /> Data Tersimpan
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>
                                  Tutup
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => sendWhatsApp(item, selectedUpt)}
                                  className="h-8 text-green-600 border-green-200 hover:bg-green-50 dark:hover:bg-green-900/20"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 mr-2" /> WhatsApp
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => sendEmail(item, selectedUpt)}
                                  className="h-8 text-orange-600 border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                >
                                  <Mail className="w-3.5 h-3.5 mr-2" /> Email
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                      onClick={() => {
                        setDeletingPelamar(item);
                        setIsDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[425px] p-6 border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-950">
          <div className="flex flex-col items-center text-center gap-2 pt-2">
            <div className="h-14 w-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-2 animate-in zoom-in duration-300">
              <Trash2 className="h-7 w-7 text-red-600 dark:text-red-500" />
            </div>
            <DialogTitle className="text-xl font-semibold dark:text-slate-100">
              Hapus Data Pelamar?
            </DialogTitle>
            <DialogDescription className="text-center dark:text-slate-400">
              Anda akan menghapus data pendaftaran{" "}
              <span className="font-semibold text-slate-900 dark:text-slate-200">
                "{deletingPelamar?.namaLengkap}"
              </span>
              .
              <br />
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-6">
            <Button
              variant="outline"
              className="w-full sm:w-1/2 h-10 border-slate-200 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              onClick={() => setIsDeleteOpen(false)}
              disabled={isProcessing}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              className="w-full sm:w-1/2 h-10 bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20"
              onClick={confirmDelete}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="animate-spin h-4 w-4" /> : "Ya, Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
