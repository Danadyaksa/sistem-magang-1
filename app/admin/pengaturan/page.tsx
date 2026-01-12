// app/admin/pengaturan/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  LogOut,
  X,
  Menu,
  User,
  Save,
  Shield,
  UserCircle
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function PengaturanPage() {
  const router = useRouter();
  
  // --- STATE UI ---
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // --- STATE DATA ---
  // Data Form Profil
  const [profile, setProfile] = useState({
    id: "", 
    username: "",
    jabatan: "",
  });

  // Data Form Password
  const [pass, setPass] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  // Data Header (Admin yang login)
  const [currentAdmin, setCurrentAdmin] = useState({ username: "...", jabatan: "..." });

  // --- 1. FETCH DATA ---
  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      
      if (res.ok) {
        // Set Data Header
        setCurrentAdmin({
          username: data.username,
          jabatan: data.jabatan || "Administrator",
        });
        
        // Set Data Form Profil
        setProfile({
          id: data.id,
          username: data.username,
          jabatan: data.jabatan || "", 
        });
      } else {
        router.push("/admin/login");
      }
    } catch (error) {
      console.error("Auth error:", error);
    }
  };

  // --- 2. LOGIC UPDATE ---
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/admins/${profile.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: profile.username,
          jabatan: profile.jabatan,
        }),
      });

      if (res.ok) {
        alert("Profil berhasil disimpan!");
        router.refresh(); // Refresh agar header update
        fetchSession();   // Ambil data terbaru lagi
      } else {
        const json = await res.json();
        alert("Gagal: " + json.error);
      }
    } catch (error) {
      alert("Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pass.new !== pass.confirm) {
      alert("Konfirmasi password tidak cocok!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admins/${profile.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: pass.current,
          newPassword: pass.new,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        alert("Password berhasil diganti!");
        setPass({ current: "", new: "", confirm: "" });
      } else {
        alert("Gagal: " + json.error);
      }
    } catch (error) {
      alert("Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin/login");
    } catch (error) {
      router.push("/admin/login");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* --- SIDEBAR --- */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0 shadow-xl`}
      >
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <h1 className="font-bold text-xl tracking-wider">Admin Panel</h1>
          <button
            className="ml-auto md:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="p-4 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
            onClick={() => router.push("/admin/dashboard")}
          >
            <LayoutDashboard className="mr-3 h-5 w-5" /> Dashboard
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
            onClick={() => router.push("/admin/applicants")}
          >
            <FileText className="mr-3 h-5 w-5" /> Applicants
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
            onClick={() => router.push("/admin/users")}
          >
            <Users className="mr-3 h-5 w-5" /> Admin Users
          </Button>

          {/* ACTIVE MENU */}
          <Button
            variant="ghost"
            className="w-full justify-start text-white bg-slate-800 shadow-md shadow-slate-900/20"
          >
            <Settings className="mr-3 h-5 w-5" /> Settings
          </Button>

          <div className="pt-8 mt-8 border-t border-slate-800">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-5 w-5" /> Keluar
            </Button>
          </div>
        </nav>
      </aside>

      {/* --- CONTENT --- */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* HEADER */}
        <header className="bg-white border-b h-16 flex items-center px-4 md:px-8 justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2 hover:bg-slate-100 rounded"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6 text-slate-600" />
            </button>
            <h2 className="text-lg font-semibold text-slate-800">
              Pengaturan Akun
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <div className="font-bold text-sm text-slate-900">{currentAdmin.username}</div>
              <div className="text-xs text-slate-500">{currentAdmin.jabatan}</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200">
              <User className="h-6 w-6" />
            </div>
          </div>
        </header>

        {/* MAIN BODY */}
        <main className="p-4 md:p-8 space-y-8 w-full">
          
          {/* JUDUL HALAMAN (Biar sama kaya yang lain) */}
          <div className="max-w-4xl mx-auto w-full">
            <h1 className="text-2xl font-bold text-slate-900">
              Profil & Keamanan
            </h1>
            <p className="text-slate-500">
              Kelola informasi pribadi dan keamanan akun Anda.
            </p>
          </div>

          {/* CONTENT TENGAH & LEBAR (max-w-4xl mx-auto) */}
          <div className="max-w-4xl mx-auto w-full">
            <Tabs defaultValue="profil" className="w-full">
              
              {/* TAB NAVIGATION FULL WIDTH */}
              <TabsList className="grid w-full grid-cols-2 bg-white border border-slate-200 p-1 mb-6 rounded-lg h-12">
                <TabsTrigger 
                  value="profil" 
                  className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 font-medium rounded-md h-full transition-all"
                >
                  <UserCircle className="w-4 h-4 mr-2" />
                  Profil Admin
                </TabsTrigger>
                <TabsTrigger 
                  value="password" 
                  className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 font-medium rounded-md h-full transition-all"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Ganti Password
                </TabsTrigger>
              </TabsList>

              {/* TAB CONTENT: PROFIL */}
              <TabsContent value="profil">
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle>Informasi Dasar</CardTitle>
                    <CardDescription>
                      Perbarui nama pengguna dan jabatan yang ditampilkan.
                    </CardDescription>
                  </CardHeader>
                  <Separator className="bg-slate-100" />
                  <CardContent className="pt-6">
                    <form onSubmit={handleUpdateProfile} className="space-y-5">
                      <div className="grid gap-2">
                        <Label className="text-slate-600">Username</Label>
                        <Input 
                          value={profile.username} 
                          onChange={(e) => setProfile({...profile, username: e.target.value})} 
                          className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-slate-600">Jabatan</Label>
                        <Input 
                          value={profile.jabatan} 
                          onChange={(e) => setProfile({...profile, jabatan: e.target.value})} 
                          placeholder="Contoh: Kepala Tata Usaha"
                          className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                        />
                      </div>
                      <div className="pt-2">
                        <Button type="submit" disabled={loading} className="bg-blue-700 hover:bg-blue-800 w-full sm:w-auto">
                          {loading ? "Menyimpan..." : (
                             <>
                               <Save className="w-4 h-4 mr-2" /> Simpan Perubahan
                             </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB CONTENT: PASSWORD */}
              <TabsContent value="password">
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle>Keamanan Akun</CardTitle>
                    <CardDescription>
                      Pastikan password Anda kuat dan tidak diketahui orang lain.
                    </CardDescription>
                  </CardHeader>
                  <Separator className="bg-slate-100" />
                  <CardContent className="pt-6">
                    <form onSubmit={handleUpdatePassword} className="space-y-5">
                      <div className="grid gap-2">
                        <Label className="text-slate-600">Password Lama</Label>
                        <Input 
                          type="password" 
                          required 
                          placeholder="••••••"
                          value={pass.current}
                          onChange={(e) => setPass({...pass, current: e.target.value})}
                          className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-slate-600">Password Baru</Label>
                        <Input 
                          type="password" 
                          required 
                          placeholder="••••••"
                          value={pass.new}
                          onChange={(e) => setPass({...pass, new: e.target.value})}
                          className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-slate-600">Konfirmasi Password Baru</Label>
                        <Input 
                          type="password" 
                          required 
                          placeholder="••••••"
                          value={pass.confirm}
                          onChange={(e) => setPass({...pass, confirm: e.target.value})}
                          className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                        />
                      </div>
                      <div className="pt-2">
                        <Button type="submit" variant="destructive" disabled={loading} className="w-full sm:w-auto">
                          {loading ? "Memproses..." : (
                             <>
                               <Shield className="w-4 h-4 mr-2" /> Update Password
                             </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}