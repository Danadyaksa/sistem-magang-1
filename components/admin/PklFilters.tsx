"use client";

import { Search, Users2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type PklFiltersProps = {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  onOpenManualClick: () => void;
};

export function PklFilters({
  searchTerm,
  setSearchTerm,
  onOpenManualClick,
}: PklFiltersProps) {
  return (
    <div className="flex justify-between items-center gap-4 mb-2">
      <div>
        <h1 className="text-2xl font-bold">Daftar Anak PKL</h1>
        <p className="text-slate-500 text-sm">
          Pantau progres magang dan status keaktifan.
        </p>
      </div>
      <div className="flex gap-3">
        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari nama..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          onClick={onOpenManualClick}
          className="bg-blue-700 hover:bg-blue-800 text-white shadow-lg shadow-blue-700/20 transition-all hover:scale-105"
        >
          <Users2 className="h-4 w-4 mr-2" /> Input Manual
        </Button>
      </div>
    </div>
  );
}
