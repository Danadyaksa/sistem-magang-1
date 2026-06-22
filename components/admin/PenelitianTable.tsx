"use client";

import { useState } from "react";
import {
  Eye,
  Trash2,
  ArrowUpDown,
  Clock,
  CheckCircle,
  XCircle,
  BookOpen,
  Loader2,
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
import { Penelitian } from "@/hooks/usePenelitian";
import { toast } from "sonner";

type PenelitianTableProps = {
  data: Penelitian[];
  isLoading: boolean;
  startIndex: number;
  requestSort: (key: string) => void;
  deletePenelitian: (id: string) => Promise<boolean>;
  updateStatus: (id: string, status: string) => Promise<boolean>;
  sendWhatsApp: (item: Penelitian) => void;
  sendEmail: (item: Penelitian) => void;
};

export function PenelitianTable({
  data,
  isLoading,
  startIndex,
  requestSort,
  deletePenelitian,
  updateStatus,
  sendWhatsApp,
  sendEmail,
}: PenelitianTableProps) {
  // Dialog Detail States
  const [selectedItem, setSelectedItem] = useState<Penelitian | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionStatus, setActionStatus] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Delete States
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Penelitian | null>(null);

  const handleStatusChange = async (val: string) => {
    if (!selectedItem) return;
    setActionStatus(val);
    setIsProcessing(true);
    const success = await updateStatus(selectedItem.id, val);
    if (success) {
      // Perbarui state lokal sementara agar sinkron di UI
      selectedItem.status = val as any;
    }
    setIsProcessing(false);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsProcessing(true);
    const success = await deletePenelitian(itemToDelete.id);
    if (success) {
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
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
              <div className="flex items-center gap-2">Nama Peneliti <ArrowUpDown className="h-3 w-3" /></div>
            </TableHead>
            <TableHead className="h-10 cursor-pointer group" onClick={() => requestSort("universitas")}>
              <div className="flex items-center gap-2">Instansi / Kampus <ArrowUpDown className="h-3 w-3" /></div>
            </TableHead>
            <TableHead className="h-10 cursor-pointer group" onClick={() => requestSort("kategori")}>
              <div className="flex items-center gap-2">Kategori <ArrowUpDown className="h-3 w-3" /></div>
            </TableHead>
            <TableHead className="h-10 cursor-pointer group" onClick={() => requestSort("judul")}>
              <div className="flex items-center gap-2">Judul Penelitian <ArrowUpDown className="h-3 w-3" /></div>
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
              <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                <Loader2 className="animate-spin h-4 w-4 inline mr-2" /> Memuat data...
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                <div className="flex flex-col items-center gap-2">
                  <BookOpen className="h-8 w-8 text-slate-300" />
                  <p>Belum ada data masuk.</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, idx) => (
              <TableRow
                key={item.id}
                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800"
              >
                <TableCell className="text-center">{startIndex + idx + 1}</TableCell>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{item.namaLengkap}</span>
                    <span className="text-xs text-slate-500">{item.nomorInduk}</span>
                  </div>
                </TableCell>
                <TableCell>{item.universitas}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal">
                    {item.kategori}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[250px] truncate" title={item.judul}>
                  {item.judul}
                </TableCell>
                <TableCell>
                  {item.status === "PENDING" && (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 gap-1">
                      <Clock className="h-3 w-3" /> Pending
                    </Badge>
                  )}
                  {item.status === "ACCEPTED" && (
                    <Badge className="bg-green-100 text-green-700 border-green-200 gap-1 shadow-none">
                      <CheckCircle className="h-3 w-3" /> Disetujui
                    </Badge>
                  )}
                  {item.status === "REJECTED" && (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1">
                      <XCircle className="h-3 w-3" /> Ditolak
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right pr-4">
                  <div className="flex justify-end gap-1">
                    <Dialog
                      open={isDialogOpen && selectedItem?.id === item.id}
                      onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (open) {
                          setSelectedItem(item);
                          setActionStatus(item.status);
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
                          <DialogTitle>Detail Permohonan</DialogTitle>
                          <DialogDescription>
                            Tinjau kelengkapan berkas dan kelayakan kandidat peneliti.
                          </DialogDescription>
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
                              <Label className="text-xs text-slate-500 uppercase font-semibold">NIM / NIDN</Label>
                              <div className="font-medium">{item.nomorInduk}</div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-slate-500 uppercase font-semibold">Asal Universitas</Label>
                              <div className="text-sm">{item.universitas}</div>
                              <div className="text-slate-500 text-xs">
                                {item.fakultas} - {item.jurusan}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-slate-500 uppercase font-semibold">Kategori / Subjek</Label>
                              <div className="text-sm">
                                {item.kategori} ({item.subjek})
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-1">
                              <Label className="text-xs text-slate-500 uppercase font-semibold">Nomor & Tanggal Surat</Label>
                              <div className="text-sm">{item.nomorSurat}</div>
                              <div className="text-slate-500 text-xs">
                                {new Date(item.tanggalSurat).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })}
                              </div>
                            </div>

                            <div className="space-y-1 border-t pt-2">
                              <Label className="text-xs text-slate-500 uppercase font-semibold">Tujuan Penelitian</Label>
                              <div className="text-xs text-slate-700 dark:text-slate-300 max-h-24 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-2 rounded border border-dashed">
                                {item.tujuanPenelitian || "Tidak dilampirkan."}
                              </div>
                            </div>
                          </div>

                          <div className="col-span-1 md:col-span-2 space-y-1 border-t pt-2">
                            <Label className="text-xs text-slate-500 uppercase font-semibold">Judul Penelitian</Label>
                            <div className="font-medium text-sm text-slate-800 dark:text-slate-200 italic">
                              "{item.judul}"
                            </div>
                          </div>
                        </div>

                        <Separator className="dark:bg-slate-800" />

                        {/* --- SELEKSI STATUS --- */}
                        <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50">
                          <div className="mb-4 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-semibold">Ubah Status Pengajuan</span>
                          </div>

                          <div className="grid gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-xs text-slate-500">Status Keputusan</Label>
                              <Select
                                value={actionStatus}
                                disabled={isProcessing}
                                onValueChange={handleStatusChange}
                              >
                                <SelectTrigger className="bg-white dark:bg-slate-950">
                                  <SelectValue placeholder="-- Ubah Status --" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="PENDING">Pending (PENDING)</SelectItem>
                                  <SelectItem value="ACCEPTED">Setujui Izin (ACCEPTED)</SelectItem>
                                  <SelectItem value="REJECTED">Tolak Permohonan (REJECTED)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {actionStatus === "REJECTED" && (
                              <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900 rounded text-xs text-red-600 dark:text-red-400 animate-in fade-in">
                                <span className="font-semibold">Konfirmasi:</span> Permohonan izin penelitian
                                mahasiswa ini akan ditolak otomatis.
                              </div>
                            )}
                            {actionStatus === "ACCEPTED" && (
                              <div className="p-3 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900 rounded text-xs text-green-600 dark:text-green-400 animate-in fade-in">
                                <span className="font-semibold">Konfirmasi:</span> Pengajuan disetujui, hak
                                observasi instansi/sub-bagian diberikan.
                              </div>
                            )}
                          </div>
                        </div>

                        <DialogFooter className="p-4 bg-slate-100/50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center w-full gap-2 sm:gap-0">
                          <div className="text-sm italic text-slate-500 flex flex-col col-span-1">
                            <span>
                              Status saat ini:{" "}
                              <span
                                className={`font-semibold ${
                                  item.status === "ACCEPTED"
                                    ? "text-green-600"
                                    : item.status === "REJECTED"
                                    ? "text-red-600"
                                    : "text-yellow-600"
                                }`}
                              >
                                {item.status === "ACCEPTED"
                                  ? "Disetujui"
                                  : item.status === "REJECTED"
                                  ? "Ditolak"
                                  : "Pending"}
                              </span>
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>
                              Tutup
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => sendWhatsApp(item)}
                              className="h-8 text-green-600 border-green-200 hover:bg-green-50"
                            >
                              <MessageCircle className="w-3.5 h-3.5 mr-2" /> WhatsApp
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => sendEmail(item)}
                              className="h-8 text-orange-600 border-orange-200 hover:bg-orange-50"
                            >
                              <Mail className="w-3.5 h-3.5 mr-2" /> Email
                            </Button>
                          </div>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                      onClick={() => {
                        setItemToDelete(item);
                        setIsDeleteDialogOpen(true);
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] p-6 border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-950">
          <div className="flex flex-col items-center text-center gap-2 pt-2">
            <div className="h-14 w-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-2 animate-in zoom-in duration-300">
              <Trash2 className="h-7 w-7 text-red-600 dark:text-red-500" />
            </div>
            <DialogTitle className="text-xl font-semibold dark:text-slate-100">
              Hapus Data Penelitian?
            </DialogTitle>
            <DialogDescription className="text-center dark:text-slate-400">
              Anda akan menghapus permohonan atas nama{" "}
              <span className="font-semibold text-slate-900 dark:text-slate-200">
                "{itemToDelete?.namaLengkap}"
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
              onClick={() => setIsDeleteDialogOpen(false)}
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
