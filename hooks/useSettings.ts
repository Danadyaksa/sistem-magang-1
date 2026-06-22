"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useSettings() {
  const router = useRouter();

  // --- STATE UI ---
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  // --- STATE DATA ---
  const [profile, setProfile] = useState({ id: "", username: "", jabatan: "" });
  const [pass, setPass] = useState({ current: "", new: "", confirm: "" });
  const [currentAdmin, setCurrentAdmin] = useState({ username: "...", jabatan: "..." });

  // --- INITIAL LOAD ---
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState === "true") setIsSidebarCollapsed(true);
    fetchSession();
  }, []);

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", String(newState));
  };

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (res.ok) {
        setCurrentAdmin({ username: data.username, jabatan: data.jabatan || "Administrator" });
        setProfile({ id: data.id, username: data.username, jabatan: data.jabatan || "" });
      } else {
        router.push("/admin/login");
      }
    } catch (error) {
      console.error("Auth error:", error);
    }
  };

  // --- HANDLERS ---
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.username) {
      toast.warning("Username tidak boleh kosong");
      return;
    }
    setLoading(true);
    const promise = async () => {
      const res = await fetch(`/api/admins/${profile.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: profile.username,
          jabatan: profile.jabatan,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Gagal update profil");
      }
      router.refresh();
      fetchSession();
      return "Profil berhasil diperbarui!";
    };
    toast.promise(promise(), {
      loading: "Menyimpan perubahan...",
      success: (msg) => msg,
      error: (err) => err.message,
      finally: () => setLoading(false),
    });
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pass.current || !pass.new || !pass.confirm) {
      toast.warning("Semua kolom wajib diisi!");
      return;
    }
    if (pass.new !== pass.confirm) {
      toast.warning("Konfirmasi password baru tidak cocok!");
      return;
    }
    if (pass.new.length < 6) {
      toast.warning("Password baru minimal 6 karakter");
      return;
    }
    setLoading(true);
    const promise = async () => {
      const res = await fetch(`/api/admins/${profile.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: pass.current,
          newPassword: pass.new,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal ganti password");
      setPass({ current: "", new: "", confirm: "" });
      return "Password berhasil diganti!";
    };
    toast.promise(promise(), {
      loading: "Memproses password...",
      success: (msg) => msg,
      error: (err) => err.message,
      finally: () => setLoading(false),
    });
  };

  const handleLogoutConfirm = async () => {
    setIsLogoutOpen(false);
    const promise = fetch("/api/auth/logout", { method: "POST" });
    toast.promise(promise, {
      loading: "Sedang keluar...",
      success: () => {
        router.push("/admin/login");
        return "Berhasil logout";
      },
      error: "Gagal logout",
    });
  };

  return {
    sidebarOpen,
    setSidebarOpen,
    isSidebarCollapsed,
    loading,
    isLogoutOpen,
    setIsLogoutOpen,
    profile,
    setProfile,
    pass,
    setPass,
    currentAdmin,
    toggleSidebar,
    handleUpdateProfile,
    handleUpdatePassword,
    handleLogoutConfirm,
  };
}
