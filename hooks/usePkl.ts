"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// --- TIPE DATA ---
export type Position = {
  id: number;
  title: string;
  quota: number;
  filled: number;
};

export type Intern = {
  id: string;
  namaLengkap: string;
  instansi: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  nomorHp: string;
  positionId: number;
  cvPath?: string | null;
  statusWaktu: "UPCOMING" | "ACTIVE" | "FINISHED";
  progress: number;
  sisaHari: number;
  totalDurasi: number;
  pembimbing?: string;
  kontakPembimbing?: string;
};

// --- HELPER: LIBURAN 2026 ---
export const HOLIDAYS_2026 = [
  "2026-01-01",
  "2026-01-16",
  "2026-02-16",
  "2026-02-17",
  "2026-03-18",
  "2026-03-19",
  "2026-03-20",
  "2026-03-21",
  "2026-03-22",
  "2026-03-23",
  "2026-03-24",
  "2026-04-03",
  "2026-04-05",
  "2026-05-01",
  "2026-05-14",
  "2026-05-15",
  "2026-05-27",
  "2026-05-28",
  "2026-05-31",
  "2026-06-01",
  "2026-06-16",
  "2026-08-17",
  "2026-08-25",
  "2026-12-24",
  "2026-12-25",
];

// REVISI LOGIC: Hitung start date sebagai hari kerja pertama
export const calculateEndDate = (startDate: string, duration: number) => {
  if (!startDate || duration < 1) return "";

  let count = 0;
  let currentDate = new Date(startDate);

  // Set jam ke 00:00 biar aman dari timezone shift pas loop
  currentDate.setHours(0, 0, 0, 0);

  // Loop sampai kuota hari kerja terpenuhi
  while (count < duration) {
    const day = currentDate.getDay();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const d = String(currentDate.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${d}`;

    // Cek: Bukan Minggu (0), Bukan Sabtu (6), Bukan Libur
    if (day !== 0 && day !== 6 && !HOLIDAYS_2026.includes(dateStr)) {
      count++;
    }

    // Kalo belum mencapai target durasi, maju ke besok
    // Kalo SUDAH mencapai (count === duration), jangan maju lagi, itu tanggal selesainya.
    if (count < duration) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  // Format output YYYY-MM-DD
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const d = String(currentDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${d}`;
};

export const formatDateForInput = (dateString: string) => {
  if (!dateString) return "";
  try {
    return new Date(dateString).toISOString().split("T")[0];
  } catch (e) {
    return "";
  }
};

export function usePkl() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [positions, setPositions] = useState<Position[]>([]);
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState({ username: "...", jabatan: "..." });

  // --- MANUAL INPUT STATE ---
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [batchSurat, setBatchSurat] = useState<File | null>(null);

  // Data Umum
  const [batchCommon, setBatchCommon] = useState({
    instansi: "",
    jurusan: "",
    pembimbing: "",
    kontakPembimbing: "",
    tanggalMulai: "",
    tanggalSelesai: "",
    lamaMagang: 44, // Default Minimal 44 Hari
  });

  // Data Siswa
  const [batchStudents, setBatchStudents] = useState([
    { namaLengkap: "", nomorHp: "", positionId: "" },
  ]);

  // Actions State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingIntern, setEditingIntern] = useState<Intern | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  
  // --- DELETE STATE ---
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingIntern, setDeletingIntern] = useState<Intern | null>(null);
  
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState === "true") setIsSidebarCollapsed(true);

    fetchData();
    fetchAdminSession();
  }, []);

  const fetchAdminSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setAdmin({
          username: data.username,
          jabatan: data.jabatan || "Administrator",
        });
      } else router.push("/admin/login");
    } catch {
      router.push("/admin/login");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resPendaftar, resPositions] = await Promise.all([
        fetch("/api/pendaftaran", { cache: "no-store" }),
        fetch("/api/positions", { cache: "no-store" }),
      ]);
      const rawPositions = await resPositions.json();
      const rawInterns = await resPendaftar.json();

      if (Array.isArray(rawPositions)) setPositions(rawPositions);
      if (Array.isArray(rawInterns)) {
        const processed = rawInterns
          .filter(
            (item: any) =>
              item.status === "ACCEPTED" && item.positionId !== null,
          )
          .map((item: any) => {
            const start = new Date(item.tanggalMulai).getTime();
            const end = new Date(item.tanggalSelesai).getTime();
            const now = new Date().getTime();
            let statusWaktu: any =
              now < start ? "UPCOMING" : now > end ? "FINISHED" : "ACTIVE";
            const total = end - start;
            const elapsed = now - start;
            let progress =
              statusWaktu === "FINISHED"
                ? 100
                : Math.min(100, Math.max(0, (elapsed / total) * 100));
            return {
              ...item,
              statusWaktu,
              progress,
              sisaHari: Math.ceil((end - now) / 86400000),
              totalDurasi: Math.ceil(total / 86400000),
            };
          });
        setInterns(processed);
      }
    } catch {
      toast.error("Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  };

  const groupedData = useMemo(() => {
    const groups: Record<number, Intern[]> = {};
    positions.forEach((pos) => {
      groups[pos.id] = [];
    });
    interns
      .filter(
        (i) =>
          i.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
          i.instansi.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      .forEach((i) => {
        if (groups[i.positionId]) groups[i.positionId].push(i);
      });
    return groups;
  }, [interns, positions, searchTerm]);

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", String(newState));
  };

  // --- LOGIC MANUAL INPUT ---
  const handleStartDateChange = (date: string) => {
    const endDate = calculateEndDate(date, batchCommon.lamaMagang);
    setBatchCommon((prev) => ({
      ...prev,
      tanggalMulai: date,
      tanggalSelesai: endDate,
    }));
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val)) {
      const endDate =
        val >= 44 ? calculateEndDate(batchCommon.tanggalMulai, val) : "";
      setBatchCommon((prev) => ({
        ...prev,
        lamaMagang: val,
        tanggalSelesai: endDate,
      }));
    }
  };

  const isFormValid = useMemo(() => {
    const commonValid =
      !!batchCommon.instansi &&
      !!batchCommon.jurusan &&
      !!batchCommon.pembimbing &&
      !!batchCommon.kontakPembimbing &&
      !!batchCommon.tanggalMulai &&
      batchCommon.lamaMagang >= 44 &&
      !!batchCommon.tanggalSelesai &&
      !!batchSurat;

    const studentsValid = batchStudents.every(
      (s) => !!s.namaLengkap && !!s.nomorHp && !!s.positionId,
    );
    return commonValid && studentsValid;
  }, [batchCommon, batchStudents, batchSurat]);

  const addStudentField = () => {
    if (batchStudents.length >= 4) return;
    setBatchStudents([
      ...batchStudents,
      { namaLengkap: "", nomorHp: "", positionId: "" },
    ]);
  };

  const updateStudent = (idx: number, field: string, val: string) => {
    const newStudents = [...batchStudents];
    (newStudents[idx] as any)[field] = val;
    setBatchStudents(newStudents);
  };

  const removeStudentField = (idx: number) => {
    if (batchStudents.length === 1) return;
    setBatchStudents(batchStudents.filter((_, i) => i !== idx));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
        toast.error("Ukuran file maksimal 500KB!");
        e.target.value = "";
        setBatchSurat(null);
      } else {
        setBatchSurat(file);
      }
    }
  };

  const handleBatchSubmit = async () => {
    if (!isFormValid) {
      toast.warning(
        "Mohon lengkapi data bertanda bintang (*). Pastikan durasi magang minimal 44 hari kerja.",
      );
      return;
    }

    const names = batchStudents.map((s) => s.namaLengkap.trim().toLowerCase());
    const phones = batchStudents.map((s) => s.nomorHp.trim());
    if (new Set(names).size !== names.length) {
      toast.error("Ada nama peserta yang sama dalam inputan ini!");
      return;
    }
    const validPhones = phones.filter((p) => p && p !== "-" && p.length > 5);
    if (new Set(validPhones).size !== validPhones.length) {
      toast.error("Ada nomor HP siswa yang sama dalam inputan ini!");
      return;
    }
    if (validPhones.includes(batchCommon.kontakPembimbing.trim())) {
      toast.error("Nomor HP Pembimbing tidak boleh sama dengan Siswa!");
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;

    try {
      for (const student of batchStudents) {
        const formData = new FormData();
        formData.append("namaLengkap", student.namaLengkap);
        formData.append("nomorHp", student.nomorHp);
        formData.append("instansi", batchCommon.instansi);
        formData.append("jurusan", batchCommon.jurusan);
        formData.append("pembimbing", batchCommon.pembimbing);
        formData.append("kontakPembimbing", batchCommon.kontakPembimbing);
        formData.append("tanggalMulai", batchCommon.tanggalMulai);
        formData.append("tanggalSelesai", batchCommon.tanggalSelesai);
        formData.append("lamaMagang", batchCommon.lamaMagang.toString());

        const dummyBlob = new Blob(["dummy"], { type: "text/plain" });
        formData.set("cv", dummyBlob, "manual-entry.txt");
        formData.set("foto", dummyBlob, "manual-entry.txt");
        if (batchSurat) formData.set("surat", batchSurat);

        const res = await fetch("/api/pendaftaran", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error(`Gagal simpan ${student.namaLengkap}`);

        const json = await res.json();
        if (json.data?.id) {
          await fetch(`/api/pendaftaran/${json.data.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: "ACCEPTED",
              positionId: student.positionId,
            }),
          });
          successCount++;
        }
      }

      toast.success(`Berhasil input ${successCount} peserta!`);
      setIsManualOpen(false);
      setBatchCommon({
        instansi: "",
        jurusan: "",
        pembimbing: "",
        kontakPembimbing: "",
        tanggalMulai: "",
        tanggalSelesai: "",
        lamaMagang: 44,
      });
      setBatchStudents([{ namaLengkap: "", nomorHp: "", positionId: "" }]);
      setBatchSurat(null);
      fetchData();
    } catch (e) {
      toast.error("Terjadi kesalahan sistem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEditClick = (intern: Intern) => {
    const safeStart = formatDateForInput(intern.tanggalMulai);
    const safeEnd = formatDateForInput(intern.tanggalSelesai);

    setEditingIntern(intern);
    setEditForm({
      namaLengkap: intern.namaLengkap,
      instansi: intern.instansi,
      nomorHp: intern.nomorHp,
      tanggalMulai: safeStart,
      tanggalSelesai: safeEnd,
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingIntern) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/pendaftaran/${editingIntern.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        toast.success("Data diupdate");
        setIsEditOpen(false);
        fetchData();
      } else toast.error("Gagal update");
    } catch {
      toast.error("Error server");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingIntern) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/pendaftaran/${deletingIntern.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Data peserta dihapus");
        fetchData();
      } else {
        toast.error("Gagal menghapus data");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
      setIsDeleteOpen(false);
      setDeletingIntern(null);
    }
  };

  return {
    sidebarOpen,
    setSidebarOpen,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    positions,
    interns,
    loading,
    admin,
    isManualOpen,
    setIsManualOpen,
    isSubmitting,
    batchSurat,
    setBatchSurat,
    batchCommon,
    setBatchCommon,
    batchStudents,
    setBatchStudents,
    isEditOpen,
    setIsEditOpen,
    editingIntern,
    setEditingIntern,
    editForm,
    setEditForm,
    isDeleteOpen,
    setIsDeleteOpen,
    deletingIntern,
    setDeletingIntern,
    isLogoutOpen,
    setIsLogoutOpen,
    fetchData,
    toggleSidebar,
    handleStartDateChange,
    handleDurationChange,
    isFormValid,
    addStudentField,
    updateStudent,
    removeStudentField,
    handleFileChange,
    handleBatchSubmit,
    onEditClick,
    handleEditSubmit,
    confirmDelete,
    groupedData,
  };
}
