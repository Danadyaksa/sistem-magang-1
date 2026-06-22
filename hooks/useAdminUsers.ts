"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export type AdminUser = {
  id: string;
  username: string;
  jabatan: string | null;
  createdAt: string;
};

export function useAdminUsers() {
  const router = useRouter();

  // --- STATE DATA ---
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState({ username: "...", jabatan: "..." });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- SEARCH & SORT STATE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  // --- FETCH DATA ---
  const fetchCurrentSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (res.ok) {
        setCurrentAdmin({
          username: data.username,
          jabatan: data.jabatan || "Administrator",
        });
      } else {
        router.push("/admin/login");
      }
    } catch (error) {
      console.error("Auth error", error);
    }
  };

  const fetchAdmins = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admins");
      if (!res.ok) throw new Error("Gagal mengambil data");
      const data = await res.json();
      setAdmins(data);
    } catch (error) {
      toast.error("Gagal memuat data admin.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
    fetchCurrentSession();
  }, []);

  // --- LOGIC SORTING & FILTERING ---
  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const filteredAdmins = useMemo(() => {
    let data = admins.filter(
      (admin) =>
        admin.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (admin.jabatan && admin.jabatan.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (sortConfig !== null) {
      data.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof AdminUser];
        let bValue: any = b[sortConfig.key as keyof AdminUser];
        if (typeof aValue === "string") {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [admins, searchTerm, sortConfig]);

  // --- API CRUD ACTIONS ---
  const saveAdmin = async (editingId: string | null, formData: any) => {
    setIsSubmitting(true);
    try {
      const url = editingId ? `/api/admins/${editingId}` : "/api/admins";
      const method = editingId ? "PUT" : "POST";

      const payload: any = {
        username: formData.username,
        jabatan: formData.jabatan,
      };

      if (editingId) {
        if (formData.newPassword) {
          payload.currentPassword = formData.currentPassword;
          payload.newPassword = formData.newPassword;
        }
      } else {
        payload.password = formData.newPassword;
      }

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Gagal menyimpan data");
      }

      await fetchAdmins();
      return { success: true, message: editingId ? "Data admin berhasil diperbarui!" : "Admin baru berhasil dibuat!" };
    } catch (err: any) {
      return { success: false, message: err.message };
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteAdmin = async (id: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admins/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Admin berhasil dihapus");
        fetchAdmins();
        return true;
      } else {
        toast.error("Gagal menghapus admin");
        return false;
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    admins: filteredAdmins,
    currentAdmin,
    isLoading,
    isSubmitting,

    searchTerm,
    setSearchTerm,
    sortConfig,
    requestSort,

    saveAdmin,
    deleteAdmin,
    fetchAdmins,
  };
}
