"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  School,
  CalendarClock,
  CalendarDays,
  Users,
  Plus,
  X,
  FileText,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Position } from "@/hooks/usePkl";

type PklManualDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  positions: Position[];
  batchCommon: any;
  setBatchCommon: React.Dispatch<React.SetStateAction<any>>;
  batchStudents: any[];
  addStudentField: () => void;
  updateStudent: (idx: number, field: string, val: string) => void;
  removeStudentField: (idx: number) => void;
  batchSurat: File | null;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleStartDateChange: (date: string) => void;
  handleDurationChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBatchSubmit: () => Promise<void>;
  isSubmitting: boolean;
  isFormValid: boolean;
};

export function PklManualDialog({
  isOpen,
  onOpenChange,
  positions,
  batchCommon,
  setBatchCommon,
  batchStudents,
  addStudentField,
  updateStudent,
  removeStudentField,
  batchSurat,
  handleFileChange,
  handleStartDateChange,
  handleDurationChange,
  handleBatchSubmit,
  isSubmitting,
  isFormValid,
}: PklManualDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[80vw] max-h-[95vh] overflow-y-auto dark:bg-slate-950 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle>Input Manual Peserta (Offline/SMK)</DialogTitle>
          <DialogDescription>
            Input data untuk siswa SMK/Kampus. Bisa input maksimal 4 siswa sekaligus.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* 1. DATA SEKOLAH & TANGGAL */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* KOLOM KIRI: Sekolah */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-600 font-semibold mb-2">
                <School className="h-4 w-4" /> Data Sekolah / Instansi
              </div>
              <div className="space-y-3 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <Label>
                    Nama Sekolah / Kampus <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Contoh: SMK N 2 Depok"
                    value={batchCommon.instansi}
                    onChange={(e) =>
                      setBatchCommon({
                        ...batchCommon,
                        instansi: e.target.value,
                      })
                    }
                    className="dark:bg-slate-950"
                  />
                </div>
                <div className="space-y-1">
                  <Label>
                    Jurusan <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Contoh: TKJ"
                    value={batchCommon.jurusan}
                    onChange={(e) =>
                      setBatchCommon({
                        ...batchCommon,
                        jurusan: e.target.value,
                      })
                    }
                    className="dark:bg-slate-950"
                  />
                </div>
                <div className="space-y-1">
                  <Label>
                    Guru Pembimbing <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Nama Guru..."
                    value={batchCommon.pembimbing}
                    onChange={(e) =>
                      setBatchCommon({
                        ...batchCommon,
                        pembimbing: e.target.value,
                      })
                    }
                    className="dark:bg-slate-950"
                  />
                </div>
                <div className="space-y-1">
                  <Label>
                    No HP Pembimbing <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="08..."
                    value={batchCommon.kontakPembimbing}
                    onChange={(e) =>
                      setBatchCommon({
                        ...batchCommon,
                        kontakPembimbing: e.target.value,
                      })
                    }
                    className="dark:bg-slate-950"
                  />
                </div>
              </div>
            </div>

            {/* KOLOM KANAN: Detail Magang */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-600 font-semibold mb-2">
                <CalendarClock className="h-4 w-4" /> Detail Waktu Magang
              </div>
              <div className="space-y-4 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>
                      Mulai Magang <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={batchCommon.tanggalMulai}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="dark:bg-slate-950"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>
                      Lama Magang (Hari) <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min={44}
                        value={batchCommon.lamaMagang}
                        onChange={handleDurationChange}
                        className="pr-12 dark:bg-slate-950"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-500">
                        Hari
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-slate-600 dark:text-slate-400">
                    Estimasi Tanggal Selesai
                  </Label>
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      value={
                        batchCommon.tanggalSelesai
                          ? new Date(batchCommon.tanggalSelesai).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                          : "-"
                      }
                      readOnly
                      className="pl-9 bg-slate-200/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-not-allowed font-medium"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    *Otomatis menghitung hari kerja (Senin-Jumat) & libur nasional.
                    {batchCommon.lamaMagang < 44 && (
                      <span className="text-red-500 ml-1 font-bold">
                        Minimal 44 hari kerja!
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-2" />

          {/* 2. DATA SISWA LOOP */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-sm flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Users className="h-4 w-4" /> Data Peserta ({batchStudents.length}/4)
              </h3>
              {batchStudents.length < 4 && (
                <Button size="sm" variant="outline" onClick={addStudentField}>
                  <Plus className="h-3 w-3 mr-1" /> Tambah Peserta
                </Button>
              )}
            </div>

            {batchStudents.map((siswa, idx) => (
              <div
                key={idx}
                className="p-4 border rounded-xl bg-white dark:bg-slate-900 dark:border-slate-800 relative group shadow-sm flex gap-5 items-center hover:shadow-md transition-shadow"
              >
                {/* NOMOR PESERTA DI KIRI */}
                <div className="flex-none flex flex-col items-center justify-center w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-xs text-slate-400 font-medium uppercase">
                    Siswa
                  </span>
                  <span className="text-xl font-bold text-slate-600 dark:text-slate-300">
                    #{idx + 1}
                  </span>
                </div>

                <div className="flex-1 grid md:grid-cols-3 gap-5">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Nama Lengkap <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Nama Siswa..."
                      value={siswa.namaLengkap}
                      onChange={(e) =>
                        updateStudent(idx, "namaLengkap", e.target.value)
                      }
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      No HP Siswa <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="08..."
                      value={siswa.nomorHp}
                      onChange={(e) =>
                        updateStudent(idx, "nomorHp", e.target.value)
                      }
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Posisi Magang <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={siswa.positionId}
                      onValueChange={(v) => updateStudent(idx, "positionId", v)}
                    >
                      <SelectTrigger className="h-9 text-xs w-full">
                        <SelectValue placeholder="Pilih Posisi..." />
                      </SelectTrigger>
                      <SelectContent>
                        {positions.map((p) => {
                          const sisa = p.quota - p.filled;
                          return (
                            <SelectItem
                              key={p.id}
                              value={p.id.toString()}
                              disabled={sisa <= 0}
                            >
                              {p.title} (Sisa: {sisa})
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {batchStudents.length > 1 && (
                  <button
                    onClick={() => removeStudentField(idx)}
                    className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1.5 rounded-full shadow hover:bg-red-200 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* 3. UPLOAD SURAT */}
          <div className="p-4 border border-dashed rounded-xl flex items-center gap-5 bg-slate-50/80 dark:bg-slate-900/50 hover:bg-slate-100/80 transition-colors cursor-pointer relative">
            <div className="p-3 bg-blue-100/50 dark:bg-slate-800 rounded-full text-blue-600">
              <FileText className="h-6 w-6" />
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-base font-medium">
                Upload Surat Pengantar (PDF) <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-slate-500">
                Wajib upload. Maksimal ukuran file <b>300KB</b>.
              </p>
              <Input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer h-full"
              />
              {batchSurat && (
                <p className="text-sm text-emerald-600 font-medium mt-1 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> File terpilih: {batchSurat.name}
                </p>
              )}
            </div>
            {!batchSurat && (
              <div className="text-xs font-semibold px-3 py-1.5 bg-white dark:bg-slate-950 border rounded text-slate-500 shadow-sm pointer-events-none">
                Pilih File
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            onClick={handleBatchSubmit}
            disabled={isSubmitting || !isFormValid}
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-300 disabled:cursor-not-allowed min-w-[150px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" /> Memproses...
              </>
            ) : (
              "Simpan Semua Data"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
