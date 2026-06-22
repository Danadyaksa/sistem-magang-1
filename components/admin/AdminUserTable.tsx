"use client";

import { useState } from "react";
import {
  Trash2,
  Pencil,
  ArrowUpDown,
  Shield,
  Loader2,
  Lock,
  Briefcase,
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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AdminUser } from "@/hooks/useAdminUsers";
import { toast } from "sonner";

type AdminUserTableProps = {
  data: AdminUser[];
  isLoading: boolean;
  isSubmitting: boolean;
  requestSort: (key: string) => void;
  saveAdmin: (editingId: string | null, formData: any) => Promise<{ success: boolean; message: string }>;
  deleteAdmin: (id: string) => Promise<boolean>;
  onOpenAddModalTrigger: (trigger: () => void) => void;
};

export function AdminUserTable({
  data,
  isLoading,
  isSubmitting,
  requestSort,
  saveAdmin,
  deleteAdmin,
  onOpenAddModalTrigger,
}: AdminUserTableProps) {
  // Modal Form States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    jabatan: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [formError, setFormError] = useState("");

  // Delete State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    id: string | null;
    username: string;
  }>({
    isOpen: false,
    id: null,
    username: "",
  });

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      username: "",
      jabatan: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setFormError("");
    setIsDialogOpen(true);
  };

  // Bind trigger to parent so "Tambah Admin" button can open this modal
  onOpenAddModalTrigger(openAddModal);

  const openEditModal = (admin: AdminUser) => {
    setEditingId(admin.id);
    setFormData({
      username: admin.username,
      jabatan: admin.jabatan || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setFormError("");
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    setFormError("");

    if (!formData.username) {
      setFormError("Username wajib diisi.");
      toast.warning("Mohon isi username terlebih dahulu.");
      return;
    }

    if (!editingId) {
      if (!formData.newPassword) {
        setFormError("Password wajib diisi untuk admin baru.");
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setFormError("Konfirmasi password tidak cocok.");
        return;
      }
      if (formData.newPassword.length < 6) {
        setFormError("Password minimal 6 karakter.");
        return;
      }
    } else {
      if (formData.newPassword || formData.confirmPassword || formData.currentPassword) {
        if (!formData.currentPassword) {
          setFormError("Masukkan password lama untuk mengubah password.");
          return;
        }
        if (!formData.newPassword) {
          setFormError("Masukkan password baru.");
          return;
        }
        if (formData.newPassword !== formData.confirmPassword) {
          setFormError("Konfirmasi password baru tidak cocok.");
          return;
        }
        if (formData.newPassword.length < 6) {
          setFormError("Password baru minimal 6 karakter.");
          return;
        }
      }
    }

    const result = await saveAdmin(editingId, formData);
    if (result.success) {
      toast.success(result.message);
      setIsDialogOpen(false);
      setEditingId(null);
    } else {
      setFormError(result.message);
      toast.error(result.message);
    }
  };

  const openDeleteDialog = (id: string, username: string) => {
    setDeleteConfirm({ isOpen: true, id, username });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return;
    const success = await deleteAdmin(deleteConfirm.id);
    if (success) {
      setDeleteConfirm({ isOpen: false, id: null, username: "" });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent dark:border-slate-800">
            <TableHead className="w-[50px] text-center dark:text-slate-400">No</TableHead>
            <TableHead className="dark:text-slate-400 cursor-pointer group" onClick={() => requestSort("username")}>
              <div className="flex items-center gap-2">Username <ArrowUpDown className="h-3 w-3" /></div>
            </TableHead>
            <TableHead className="dark:text-slate-400 cursor-pointer group" onClick={() => requestSort("jabatan")}>
              <div className="flex items-center gap-2">Jabatan <ArrowUpDown className="h-3 w-3" /></div>
            </TableHead>
            <TableHead className="dark:text-slate-400">Role</TableHead>
            <TableHead className="text-right pr-6 dark:text-slate-400">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-slate-500 dark:text-slate-400">
                <div className="flex justify-center items-center gap-2">
                  <Loader2 className="animate-spin h-4 w-4" /> Memuat data...
                </div>
              </TableCell>
            </TableRow>
          ) : data.length > 0 ? (
            data.map((admin, index) => (
              <TableRow
                key={admin.id}
                className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-200 dark:border-slate-800"
              >
                <TableCell className="text-center text-slate-500 dark:text-slate-400">{index + 1}</TableCell>
                <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                      <Shield className="h-4 w-4" />
                    </div>
                    {admin.username}
                  </div>
                </TableCell>
                <TableCell className="text-slate-600 dark:text-slate-300">{admin.jabatan || "-"}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 border-blue-200 dark:border-blue-800"
                  >
                    Super Admin
                  </Badge>
                </TableCell>
                <TableCell className="text-right pr-4">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                      onClick={() => openEditModal(admin)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                      onClick={() => openDeleteDialog(admin.id, admin.username)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-32 text-center text-slate-500 dark:text-slate-400">
                Belum ada admin lain.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Form Add / Edit Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] dark:bg-slate-950 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="dark:text-slate-100">
              {editingId ? "Edit Admin" : "Tambah Admin Baru"}
            </DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              {editingId
                ? "Ubah detail login untuk akun ini."
                : "Buat akun baru untuk memberikan akses ke panel admin."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {formError && (
              <Alert variant="destructive" className="py-2 text-xs animate-in slide-in-from-top-2">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <Label htmlFor="username" className="dark:text-slate-300">
                Username
              </Label>
              <Input
                id="username"
                placeholder="Contoh: admin2 "
                className="dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="jabatan" className="dark:text-slate-300">
                Jabatan
              </Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="jabatan"
                  className="pl-9 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                  placeholder="Contoh: Kepala Sub Bagian Umum"
                  value={formData.jabatan}
                  onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                />
              </div>
            </div>

            {editingId ? (
              <div className="space-y-4 pt-2 border-t dark:border-slate-800 mt-2 animate-in fade-in">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-200">
                  Ganti Password <span className="text-slate-400 font-normal">(Opsional)</span>
                </p>
                <div className="grid gap-2">
                  <Label htmlFor="currentPassword" className="dark:text-slate-300">
                    Password Lama
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="currentPassword"
                      type="password"
                      className="pl-9 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                      placeholder="Password saat ini..."
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="newPassword" className="dark:text-slate-300">
                    Password Baru
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="newPassword"
                      type="password"
                      className="pl-9 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                      placeholder="Password baru..."
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword" className="dark:text-slate-300">
                    Konfirmasi Password Baru
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      className="pl-9 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                      placeholder="Ulangi password baru..."
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-2 animate-in fade-in">
                  <Label htmlFor="newPassword" className="dark:text-slate-300">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="newPassword"
                      type="password"
                      className="pl-9 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                      placeholder="******"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2 animate-in fade-in">
                  <Label htmlFor="confirmPassword" className="dark:text-slate-300">
                    Konfirmasi Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      className="pl-9 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                      placeholder="******"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              type="submit"
              className="bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 w-full sm:w-auto transition-all text-white"
              onClick={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...
                </>
              ) : editingId ? (
                "Simpan Perubahan"
              ) : (
                "Buat Akun"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteConfirm.isOpen}
        onOpenChange={(open) => !open && setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))}
      >
        <DialogContent className="sm:max-w-[425px] p-6 border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-950">
          <div className="flex flex-col items-center text-center gap-2 pt-2">
            <div className="h-14 w-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-2 animate-in zoom-in duration-300">
              <Trash2 className="h-7 w-7 text-red-600 dark:text-red-500" />
            </div>
            <DialogTitle className="text-xl font-semibold dark:text-slate-100">
              Hapus Admin?
            </DialogTitle>
            <DialogDescription className="text-center dark:text-slate-400">
              Anda akan menghapus akun admin{" "}
              <span className="font-semibold text-slate-900 dark:text-slate-200">
                "{deleteConfirm.username}"
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
              onClick={() => setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              className="w-full sm:w-1/2 h-10 bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20"
              onClick={confirmDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : "Ya, Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
