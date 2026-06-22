"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format, getYear, getMonth } from "date-fns";

export type Position = {
  id: number;
  title: string;
  filled: number;
  quota: number;
};

export type UPT = {
  id: number;
  name: string;
  address?: string;
};

export type Holiday = {
  id: string;
  date: string;
  description: string;
};

export type DeleteState = {
  isOpen: boolean;
  type: "position" | "upt" | "holiday" | null;
  id: string | number | null;
  title: string;
};

export function useAdminDashboard() {
  const router = useRouter();

  // --- GLOBAL STATE ---
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [admin, setAdmin] = useState({ username: "...", jabatan: "..." });

  // --- DATA STATE ---
  const [positions, setPositions] = useState<Position[]>([]);
  const [upts, setUpts] = useState<UPT[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [minDaysSetting, setMinDaysSetting] = useState("44");

  // --- TAB & FILTER STATE ---
  const [activeTab, setActiveTab] = useState("positions");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  // Filter Hari Libur
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [selectedHolidayIds, setSelectedHolidayIds] = useState<string[]>([]);
  const [isDeleteMassOpen, setIsDeleteMassOpen] = useState(false);

  // --- MODAL STATE ---
  const [isPositionDialogOpen, setIsPositionDialogOpen] = useState(false);
  const [isUptDialogOpen, setIsUptDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // --- DELETE CONFIRMATION STATE ---
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteState>({
    isOpen: false,
    type: null,
    id: null,
    title: "",
  });

  // --- FORMS ---
  const [positionForm, setPositionForm] = useState({ title: "", quota: 3 });
  const [uptForm, setUptForm] = useState({ name: "", address: "" });
  const [newHolidayDates, setNewHolidayDates] = useState<Date[] | undefined>([]);

  // --- FETCHERS ---
  const fetchAdminProfile = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (res.ok) setAdmin({ username: data.username, jabatan: data.jabatan || "Administrator" });
      else router.push("/admin/login");
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPositions = async () => {
    try {
      const res = await fetch("/api/positions", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) setPositions(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUpts = async () => {
    try {
      const res = await fetch("/api/upt", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setUpts(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchHolidays = async () => {
    try {
      const res = await fetch("/api/holidays", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setHolidays(data);
      }
    } catch (error) {
      console.error("Gagal ambil hari libur", error);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings?key=MIN_MAGANG_DAYS");
      if (res.ok) {
        const data = await res.json();
        if (data.value) setMinDaysSetting(data.value);
      }
    } catch (err) {
      console.error("Gagal load setting:", err);
    }
  };

  // --- SETUP ---
  useEffect(() => {
    Promise.all([
      fetchAdminProfile(),
      fetchPositions(),
      fetchUpts(),
      fetchHolidays(),
      fetchSettings(),
    ]).finally(() => setIsLoading(false));
  }, []);

  // --- LOGIC SORTING POSISI ---
  const getStatusWeight = (filled: number, quota: number) => {
    if (filled >= quota) return 3;
    if (quota - filled <= 1) return 2;
    return 1;
  };

  const processedPositions = useMemo(() => {
    let data = positions.filter((p) => p.title.toLowerCase().includes(searchTerm.toLowerCase()));
    if (sortConfig !== null) {
      data.sort((a, b) => {
        let aValue: any;
        let bValue: any;
        if (sortConfig.key === "title") {
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
        } else if (sortConfig.key === "filled") {
          aValue = a.filled;
          bValue = b.filled;
        } else if (sortConfig.key === "status") {
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

  // --- LOGIC FILTERING HARI LIBUR ---
  const filteredHolidays = useMemo(() => {
    return holidays
      .filter((h) => {
        const date = new Date(h.date);
        const matchYear = filterYear === "all" || getYear(date).toString() === filterYear;
        const matchMonth = filterMonth === "all" || (getMonth(date) + 1).toString() === filterMonth;
        return matchYear && matchMonth;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [holidays, filterYear, filterMonth]);

  const availableYears = useMemo(() => {
    const years = holidays.map((h) => getYear(new Date(h.date)).toString());
    const uniqueYears = Array.from(new Set([...years, new Date().getFullYear().toString()]));
    return uniqueYears.sort((a, b) => b.localeCompare(a));
  }, [holidays]);

  const toggleSelectHoliday = (id: string) => {
    setSelectedHolidayIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllHolidays = () => {
    if (selectedHolidayIds.length === filteredHolidays.length && filteredHolidays.length > 0) {
      setSelectedHolidayIds([]);
    } else {
      setSelectedHolidayIds(filteredHolidays.map((h) => h.id));
    }
  };

  // --- CRUD HANDLERS ---
  const handleSavePosition = async () => {
    if (!positionForm.title.trim()) return toast.warning("Nama bidang wajib diisi");
    setIsSubmitting(true);
    try {
      const url = editingId ? `/api/positions/${editingId}` : "/api/positions";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(positionForm),
      });
      if (!res.ok) throw new Error();
      await fetchPositions();
      setIsPositionDialogOpen(false);
      toast.success(editingId ? "Posisi diperbarui" : "Posisi ditambahkan");
    } catch (e) {
      toast.error("Gagal menyimpan posisi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteDialog = (type: "position" | "upt" | "holiday", id: string | number, title: string) => {
    setDeleteConfirm({ isOpen: true, type, id, title });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.id || !deleteConfirm.type) return;

    setIsSubmitting(true);
    try {
      let url = "";
      let successMsg = "";

      if (deleteConfirm.type === "position") {
        url = `/api/positions/${deleteConfirm.id}`;
        successMsg = "Posisi berhasil dihapus";
      } else if (deleteConfirm.type === "upt") {
        url = `/api/upt/${deleteConfirm.id}`;
        successMsg = "Unit UPT berhasil dihapus";
      } else if (deleteConfirm.type === "holiday") {
        url = `/api/holidays/${deleteConfirm.id}`;
        successMsg = "Tanggal libur berhasil dihapus";
      }

      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus");

      toast.success(successMsg);

      if (deleteConfirm.type === "position") fetchPositions();
      else if (deleteConfirm.type === "upt") fetchUpts();
      else if (deleteConfirm.type === "holiday") fetchHolidays();
    } catch (error) {
      toast.error("Terjadi kesalahan saat menghapus data");
    } finally {
      setIsSubmitting(false);
      setDeleteConfirm({ isOpen: false, type: null, id: null, title: "" });
    }
  };

  const handleSaveUpt = async () => {
    if (!uptForm.name.trim()) return toast.warning("Nama UPT wajib diisi");
    setIsSubmitting(true);
    try {
      const url = editingId ? `/api/upt/${editingId}` : "/api/upt";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(uptForm),
      });
      if (!res.ok) throw new Error();
      await fetchUpts();
      setIsUptDialogOpen(false);
      toast.success(editingId ? "UPT diperbarui" : "UPT ditambahkan");
    } catch (e) {
      toast.error("Gagal menyimpan UPT");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddHolidays = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayDates || newHolidayDates.length === 0) {
      toast.warning("Pilih minimal satu tanggal di kalender!");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dates: newHolidayDates,
          description: "-",
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${newHolidayDates.length} Tanggal libur berhasil ditambahkan`);
      setNewHolidayDates([]);
      fetchHolidays();
    } catch (error) {
      toast.error("Gagal menambah data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMassHolidays = async () => {
    if (selectedHolidayIds.length === 0) return;
    setIsSubmitting(true);
    try {
      const deletePromises = selectedHolidayIds.map((id) =>
        fetch(`/api/holidays/${id}`, { method: "DELETE" })
      );
      await Promise.all(deletePromises);
      toast.success(`${selectedHolidayIds.length} Data berhasil dihapus`);
      fetchHolidays();
      setSelectedHolidayIds([]);
    } catch (error) {
      toast.error("Gagal menghapus data");
    } finally {
      setIsSubmitting(false);
      setIsDeleteMassOpen(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "MIN_MAGANG_DAYS", value: String(minDaysSetting) }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan pengaturan");
      toast.success("Minimal hari magang berhasil diperbarui!");
    } catch (error) {
      toast.error("Terjadi kesalahan sistem, pastikan tabel database sudah siap.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isLoading,
    isSubmitting,
    admin,
    positions: processedPositions,
    rawPositions: positions,
    upts,
    holidays: filteredHolidays,
    minDaysSetting,
    setMinDaysSetting,
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    filterYear,
    setFilterYear,
    filterMonth,
    setFilterMonth,
    selectedHolidayIds,
    isDeleteMassOpen,
    setIsDeleteMassOpen,
    isPositionDialogOpen,
    setIsPositionDialogOpen,
    isUptDialogOpen,
    setIsUptDialogOpen,
    editingId,
    setEditingId,
    deleteConfirm,
    setDeleteConfirm,
    positionForm,
    setPositionForm,
    uptForm,
    setUptForm,
    newHolidayDates,
    setNewHolidayDates,
    availableYears,
    toggleSelectHoliday,
    toggleSelectAllHolidays,
    handleSavePosition,
    openDeleteDialog,
    confirmDelete,
    handleSaveUpt,
    handleAddHolidays,
    handleDeleteMassHolidays,
    handleSaveSettings,
    requestSort,
    fetchPositions,
    fetchUpts,
    fetchHolidays,
  };
}
