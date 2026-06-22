"use client";

import { Search, Download, RefreshCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CardHeader } from "@/components/ui/card";

type PenelitianFiltersProps = {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  filterKategori: string;
  setFilterKategori: (val: string) => void;
  filterMonth: string;
  setFilterMonth: (val: string) => void;
  filterYear: string;
  setFilterYear: (val: string) => void;
  availableCategories: string[];
  availableYears: number[];
  MONTHS: Array<{ value: string; label: string }>;
  onExport: () => void;
  onRefresh: () => void;
};

export function PenelitianFilters({
  searchTerm,
  setSearchTerm,
  filterKategori,
  setFilterKategori,
  filterMonth,
  setFilterMonth,
  filterYear,
  setFilterYear,
  availableCategories,
  availableYears,
  MONTHS,
  onExport,
  onRefresh,
}: PenelitianFiltersProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Permohonan Izin Penelitian</h1>
          <p className="text-slate-500 dark:text-slate-400">Kelola pengajuan izin penelitian dari Mahasiswa/Dosen.</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onExport}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-700/20 transition-all hover:scale-105"
          >
            <Download className="h-4 w-4 mr-2" /> Export Excel
          </Button>
          <Button
            onClick={onRefresh}
            className="bg-blue-700 hover:bg-blue-800 text-white shadow-lg shadow-blue-700/20 transition-all hover:scale-105"
          >
            <RefreshCcw className="h-4 w-4 mr-2" /> Refresh Data
          </Button>
        </div>
      </div>

      <CardHeader className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl bg-white dark:bg-slate-900 py-4 space-y-4">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari nama, kampus, atau judul..."
                className="pl-9 bg-white dark:bg-slate-950"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
            <Select value={filterKategori} onValueChange={setFilterKategori}>
              <SelectTrigger className="w-[160px] bg-white dark:bg-slate-950">
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {availableCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-[130px] bg-white dark:bg-slate-950">
                <SelectValue placeholder="Bulan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Bulan</SelectItem>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-[130px] bg-white dark:bg-slate-950">
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tahun</SelectItem>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
    </div>
  );
}
