"use client";

import { useSettings } from "@/hooks/useSettings";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, AlertTriangle, Shield, UserCircle } from "lucide-react";

export default function PengaturanPage() {
  const {
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
  } = useSettings();

  return (
    <div className="h-screen w-full bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300 overflow-hidden">
      {/* SIDEBAR */}
      <AdminSidebar
        active="settings"
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isSidebarCollapsed={isSidebarCollapsed}
        onLogout={() => setIsLogoutOpen(true)}
      />

      {/* CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* HEADER */}
        <AdminHeader
          title="Pengaturan Sistem"
          setSidebarOpen={setSidebarOpen}
          isSidebarCollapsed={isSidebarCollapsed}
          toggleSidebar={toggleSidebar}
          username={currentAdmin.username}
          jabatan={currentAdmin.jabatan}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
          <div className="w-full">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Konfigurasi Admin
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Kelola profil dan keamanan akun Anda.
            </p>
          </div>

          <div className="w-full">
            <Tabs defaultValue="profil" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1 mb-6 rounded-lg h-12 shadow-sm transition-colors">
                <TabsTrigger
                  value="profil"
                  className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 font-medium rounded-md h-full transition-all dark:text-slate-400"
                >
                  <UserCircle className="w-4 h-4 mr-2" /> Profil
                </TabsTrigger>
                <TabsTrigger
                  value="password"
                  className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 font-medium rounded-md h-full transition-all dark:text-slate-400"
                >
                  <Shield className="w-4 h-4 mr-2" /> Password
                </TabsTrigger>
              </TabsList>

              {/* TABS PROFIL */}
              <TabsContent value="profil">
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm dark:bg-slate-900 transition-colors">
                  <CardHeader>
                    <CardTitle className="dark:text-slate-100">Informasi Dasar</CardTitle>
                    <CardDescription className="dark:text-slate-400">Perbarui nama pengguna dan jabatan.</CardDescription>
                  </CardHeader>
                  <Separator className="bg-slate-100 dark:bg-slate-800" />
                  <CardContent className="pt-6">
                    <form onSubmit={handleUpdateProfile} className="space-y-5">
                      <div className="grid gap-2">
                        <Label className="dark:text-slate-300">Username</Label>
                        <Input
                          value={profile.username}
                          onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                          className="dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label className="dark:text-slate-300">Jabatan</Label>
                        <Input
                          value={profile.jabatan}
                          onChange={(e) => setProfile({ ...profile, jabatan: e.target.value })}
                          className="dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-700 hover:bg-blue-800 text-white dark:bg-blue-600 dark:hover:bg-blue-700"
                      >
                        Simpan Perubahan
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TABS PASSWORD */}
              <TabsContent value="password">
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm dark:bg-slate-900 transition-colors">
                  <CardHeader>
                    <CardTitle className="dark:text-slate-100">Keamanan Akun</CardTitle>
                    <CardDescription className="dark:text-slate-400">Pastikan password Anda kuat.</CardDescription>
                  </CardHeader>
                  <Separator className="bg-slate-100 dark:bg-slate-800" />
                  <CardContent className="pt-6">
                    <form onSubmit={handleUpdatePassword} className="space-y-5">
                      <div className="grid gap-2">
                        <Label className="dark:text-slate-300">Password Lama</Label>
                        <Input
                          type="password"
                          value={pass.current}
                          onChange={(e) => setPass({ ...pass, current: e.target.value })}
                          className="dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label className="dark:text-slate-300">Password Baru</Label>
                        <Input
                          type="password"
                          value={pass.new}
                          onChange={(e) => setPass({ ...pass, new: e.target.value })}
                          className="dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label className="dark:text-slate-300">Konfirmasi Baru</Label>
                        <Input
                          type="password"
                          value={pass.confirm}
                          onChange={(e) => setPass({ ...pass, confirm: e.target.value })}
                          className="dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-700 hover:bg-blue-800 text-white dark:bg-blue-600 dark:hover:bg-blue-700"
                      >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Update Password"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* --- MODAL LOGOUT --- */}
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
            <Button
              variant="outline"
              className="w-full sm:w-1/2 dark:bg-transparent dark:text-slate-100 dark:border-slate-700"
              onClick={() => setIsLogoutOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              className="w-full sm:w-1/2 bg-red-600 hover:bg-red-700 text-white font-semibold"
              onClick={handleLogoutConfirm}
            >
              Ya, Keluar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}