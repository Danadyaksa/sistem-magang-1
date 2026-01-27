"use client";

import Image from "next/image";
import { ModeToggle } from "@/components/mode-toggle";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  LogOut,
  Menu,
  X,
  Search,
  Briefcase,
  FileText,
  User,
  Settings,
  AlertTriangle,
  PanelLeftClose,
  PanelLeftOpen,
  CalendarClock,
  History,
  Clock,
  CheckCircle2,
  Hourglass,
  Plus,
  School,
  ChevronDown,
  Pencil,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  Users2,
  UploadCloud,
  CalendarDays,
  BookOpen,
} from "lucide-react";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";

// --- TIPE DATA ---
type Position = {
  id: number;
  title: string;
  quota: number;
  filled: number;
};

type Intern = {
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

// --- HELPER: LIBURAN 2026 (Sesuai Request) ---
const HOLIDAYS_2026 = [
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
const calculateEndDate = (startDate: string, duration: number) => {
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

const formatDateForInput = (dateString: string) => {
  if (!dateString) return "";
  try {
    return new Date(dateString).toISOString().split("T")[0];
  } catch (e) {
    return "";
  }
};

// --- HELPER COMPONENTS ---
const StatusBadge = ({
  status,
  daysLeft,
}: {
  status: string;
  daysLeft: number;
}) => {
  if (status === "UPCOMING")
    return (
      <Badge
        variant="outline"
        className="bg-slate-100 text-slate-500 border-slate-300 px-2 py-0.5 text-[10px]"
      >
        Menunggu
      </Badge>
    );
  if (status === "FINISHED")
    return (
      <Badge
        variant="secondary"
        className="bg-slate-200 text-slate-700 px-2 py-0.5 text-[10px]"
      >
        Alumni
      </Badge>
    );
  if (daysLeft <= 5)
    return (
      <Badge
        variant="destructive"
        className="animate-pulse px-2 py-0.5 text-[10px]"
      >
        Sisa {daysLeft} Hari
      </Badge>
    );
  return (
    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200 shadow-none px-2 py-0.5 text-[10px]">
      Aktif
    </Badge>
  );
};

const SourceBadge = ({ path }: { path?: string | null }) => {
  if (path && (path === "-" || path.includes("manual-entry"))) {
    return (
      <span className="text-[8px] font-bold tracking-wider text-purple-600 bg-purple-50 border border-purple-200 px-1 py-[1px] rounded uppercase ml-1.5">
        Manual
      </span>
    );
  }
  return (
    <span className="text-[8px] font-bold tracking-wider text-blue-600 bg-blue-50 border border-blue-200 px-1 py-[1px] rounded uppercase ml-1.5">
      Web
    </span>
  );
};

// --- POSITION CARD ---
const PositionCard = ({
  pos,
  interns,
  loading,
  onEditClick,
  onDeleteClick,
}: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  const sortedInterns = useMemo(() => {
    let sortableItems = [...interns];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof Intern];
        let bValue: any = b[sortConfig.key as keyof Intern];
        if (sortConfig.key === "periode") {
          aValue = new Date(a.tanggalMulai).getTime();
          bValue = new Date(b.tanggalMulai).getTime();
        }
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [interns, sortConfig]);

  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig?.key === key)
      return sortConfig.direction === "asc" ? (
        <ArrowUp className="ml-1 h-3 w-3" />
      ) : (
        <ArrowDown className="ml-1 h-3 w-3" />
      );
    return (
      <ArrowUpDown className="ml-1 h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
    );
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-sm overflow-hidden transition-all hover:shadow-md mb-3">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3 px-4 flex justify-between items-center select-none group"
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-1.5 rounded-md border shadow-sm transition-colors ${isOpen ? "bg-blue-50 border-blue-100" : "bg-white border-slate-100 dark:bg-slate-800 dark:border-slate-700"}`}
          >
            <Briefcase
              className={`h-4 w-4 ${isOpen ? "text-blue-600" : "text-slate-500"}`}
            />
          </div>
          <div>
            <CardTitle
              className={`text-sm md:text-base font-semibold ${isOpen ? "text-blue-700 dark:text-blue-400" : "text-slate-700 dark:text-slate-200"}`}
            >
              {pos.title}
            </CardTitle>
            {isOpen && (
              <div className="text-[10px] text-slate-500 mt-0.5 animate-in fade-in">
                Kuota Maksimal: {pos.quota}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isOpen && (
            <Badge
              variant="outline"
              className={`text-xs font-medium border ${interns.length >= pos.quota ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}
            >
              {interns.length} / {pos.quota} Peserta
            </Badge>
          )}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </div>
      {isOpen && (
        <CardContent className="p-0 animate-in slide-in-from-top-1">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 dark:bg-slate-900/30">
                <TableHead className="w-[50px] text-center text-xs">
                  No
                </TableHead>
                <TableHead
                  className="text-xs cursor-pointer"
                  onClick={() => requestSort("namaLengkap")}
                >
                  <div className="flex items-center">
                    Nama {getSortIcon("namaLengkap")}
                  </div>
                </TableHead>
                <TableHead
                  className="text-xs cursor-pointer"
                  onClick={() => requestSort("periode")}
                >
                  <div className="flex items-center">
                    Periode {getSortIcon("periode")}
                  </div>
                </TableHead>
                <TableHead className="text-xs w-[30%]">Progress</TableHead>
                <TableHead className="text-center text-xs">Status</TableHead>
                <TableHead className="text-right text-xs">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedInterns.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-xs py-8 text-slate-400"
                  >
                    Kosong.
                  </TableCell>
                </TableRow>
              ) : (
                sortedInterns.map((intern: Intern, idx: number) => (
                  <TableRow
                    key={intern.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <TableCell className="text-center text-slate-500 px-4 py-2.5 text-xs">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="px-4 py-2.5">
                      <div className="font-medium flex items-center text-sm">
                        {intern.namaLengkap}{" "}
                        <SourceBadge path={intern.cvPath} />
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <School className="h-3 w-3" /> {intern.instansi}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2.5">
                      <div className="flex flex-col text-xs">
                        <span>
                          {new Date(intern.tanggalMulai).toLocaleDateString(
                            "id-ID",
                            { day: "numeric", month: "short" },
                          )}{" "}
                          -{" "}
                          {new Date(intern.tanggalSelesai).toLocaleDateString(
                            "id-ID",
                            { day: "numeric", month: "short", year: "2-digit" },
                          )}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Total {intern.totalDurasi} Hari
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2.5">
                      <div className="w-full space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span>{Math.round(intern.progress)}%</span>
                        </div>
                        <Progress value={intern.progress} className="h-1.5" />
                      </div>
                    </TableCell>
                    <TableCell className="text-center px-4 py-2.5">
                      <StatusBadge
                        status={intern.statusWaktu}
                        daysLeft={intern.sisaHari}
                      />
                    </TableCell>
                    <TableCell className="text-right px-4 py-2.5">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-400 hover:text-blue-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditClick(intern);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-400 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteClick(intern);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      )}
    </Card>
  );
};

// --- PAGE COMPONENT ---
export default function PKLMonitoringPage() {
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
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingIntern, setDeletingIntern] = useState<Intern | null>(null);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  useEffect(() => {
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
      // Jangan update tanggal selesai kalo < 44 (biar user tau ada warning/error), tapi state lama kerja tetep diupdate
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
      batchCommon.instansi &&
      batchCommon.jurusan &&
      batchCommon.pembimbing &&
      batchCommon.kontakPembimbing &&
      batchCommon.tanggalMulai &&
      batchCommon.lamaMagang >= 44 && // Validasi Min 44 Hari
      batchCommon.tanggalSelesai &&
      batchSurat;

    const studentsValid = batchStudents.every(
      (s) => s.namaLengkap && s.nomorHp && s.positionId,
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

  // LOGIC EDIT (FIXED CRASH)
  const onEditClick = (intern: Intern) => {
    // Safety check biar ga crash kalo data tanggal aneh
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

  const SidebarItem = ({
    icon: Icon,
    label,
    active = false,
    onClick,
    className = "",
  }: any) => (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            onClick={onClick}
            className={`w-full flex items-center transition-all duration-200 ${isSidebarCollapsed ? "justify-center px-2" : "justify-start px-4"} ${active ? "bg-slate-800 text-white shadow-md shadow-slate-900/20" : "text-slate-300 hover:text-white hover:bg-slate-800"} ${className}`}
          >
            <Icon className={`h-5 w-5 ${isSidebarCollapsed ? "" : "mr-3"}`} />
            {!isSidebarCollapsed && <span>{label}</span>}
          </Button>
        </TooltipTrigger>
        {isSidebarCollapsed && (
          <TooltipContent
            side="right"
            className="bg-slate-800 text-white border-slate-700 ml-2"
          >
            {label}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className="h-screen w-full bg-slate-50 dark:bg-slate-950 flex overflow-hidden">
      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-slate-900 text-white shadow-xl flex flex-col h-full transition-all duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 ${isSidebarCollapsed ? "w-20" : "w-64"}`}
      >
        <div
          className={`h-16 flex items-center border-b border-slate-800 flex-none ${isSidebarCollapsed ? "justify-center px-0" : "px-6 gap-3"}`}
        >
          <div className="flex items-center justify-center">
            <Image
              src="/logo-disdikpora.png"
              alt="Logo"
              width={isSidebarCollapsed ? 28 : 32}
              height={isSidebarCollapsed ? 28 : 32}
              className="object-contain"
            />
          </div>
          {!isSidebarCollapsed && (
            <h1 className="font-bold text-xl tracking-wider truncate">
              Dinas DIKPORA
            </h1>
          )}
          <button
            className="ml-auto md:hidden text-slate-400"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="p-3 space-y-2 flex-1 overflow-y-auto">
          <SidebarItem
            icon={LayoutDashboard}
            label="Dashboard"
            onClick={() => router.push("/admin/dashboard")}
          />
          <SidebarItem
            icon={FileText}
            label="Applicants"
            onClick={() => router.push("/admin/applicants")}
          />
          <SidebarItem icon={CalendarClock} label="Daftar PKL" active={true} />
          <SidebarItem
            icon={Users}
            label="Admin Users"
            onClick={() => router.push("/admin/users")}
          />
          <SidebarItem
            icon={BookOpen}
            label="Penelitian"
            onClick={() => router.push("/admin/penelitian")}
            // active={true}  <-- HANYA nyalakan ini di file 'app/admin/penelitian/page.tsx'
          />
          <SidebarItem
            icon={Settings}
            label="Settings"
            onClick={() => router.push("/admin/pengaturan")}
          />
          <div className="pt-4 mt-4 border-t border-slate-800">
            <SidebarItem
              icon={LogOut}
              label="Keluar"
              className="text-red-400 hover:bg-red-900/20"
              onClick={() => setIsLogoutOpen(true)}
            />
          </div>
        </nav>
      </aside>

      {/* CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="bg-white dark:bg-slate-950 border-b dark:border-slate-800 h-16 flex items-center px-8 justify-between shadow-sm flex-none">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <button
              className="hidden md:flex p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
              onClick={() => {
                setIsSidebarCollapsed(!isSidebarCollapsed);
                localStorage.setItem(
                  "sidebarCollapsed",
                  String(!isSidebarCollapsed),
                );
              }}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="h-5 w-5" />
              ) : (
                <PanelLeftClose className="h-5 w-5" />
              )}
            </button>
            <h2 className="text-lg font-semibold">Monitoring PKL</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <div className="font-bold text-sm">{admin.username}</div>
              <div className="text-xs text-slate-500">{admin.jabatan}</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              <User className="h-6 w-6" />
            </div>
            <ModeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="w-full">
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
                  onClick={() => setIsManualOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Users2 className="h-4 w-4 mr-2" /> Input Manual
                </Button>
              </div>
            </div>
          </div>

          <Tabs
            defaultValue="active"
            className="w-full"
            onValueChange={setActiveTab}
          >
            <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-12 p-0 mb-6">
              <TabsTrigger
                value="active"
                className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent rounded-none h-full px-6"
              >
                Sedang Magang
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent rounded-none h-full px-6"
              >
                Magang Selesai
              </TabsTrigger>
            </TabsList>
            <TabsContent value="active" className="space-y-6">
              {loading ? (
                <div className="p-12 text-center">
                  <Loader2 className="animate-spin h-6 w-6 mx-auto mb-2" />
                  Loading data...
                </div>
              ) : (
                positions.map((pos) => {
                  const activeInterns =
                    groupedData[pos.id]?.filter(
                      (i) => i.statusWaktu !== "FINISHED",
                    ) || [];
                  if (activeInterns.length === 0 && searchTerm) return null;
                  return (
                    <PositionCard
                      key={pos.id}
                      pos={pos}
                      interns={activeInterns}
                      loading={loading}
                      onEditClick={onEditClick}
                      onDeleteClick={(i: any) => {
                        setDeletingIntern(i);
                        setIsDeleteOpen(true);
                      }}
                    />
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* --- DIALOG INPUT MANUAL (REVISI: max-w-[80vw], Layout Full) --- */}
      <Dialog open={isManualOpen} onOpenChange={setIsManualOpen}>
        <DialogContent className="sm:max-w-[80vw] max-h-[95vh] overflow-y-auto dark:bg-slate-950 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle>Input Manual Peserta (Offline/SMK)</DialogTitle>
            <DialogDescription>
              Input data untuk siswa SMK/Kampus. Bisa input maksimal 4 siswa
              sekaligus.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* 1. DATA SEKOLAH & TANGGAL (Layout Form Mirip /daftar) */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* KOLOM KIRI: Sekolah */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-blue-600 font-semibold mb-2">
                  <School className="h-4 w-4" /> Data Sekolah / Instansi
                </div>
                <div className="space-y-3 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <Label>
                      Nama Sekolah / Kampus{" "}
                      <span className="text-red-500">*</span>
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
                        Lama Magang (Hari){" "}
                        <span className="text-red-500">*</span>
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
                            ? new Date(
                                batchCommon.tanggalSelesai,
                              ).toLocaleDateString("id-ID", {
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
                      *Otomatis menghitung hari kerja (Senin-Jumat) & libur
                      nasional.
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
                  <Users className="h-4 w-4" /> Data Peserta (
                  {batchStudents.length}/4)
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
                  {/* NOMOR PESERTA DI KIRI (Besar & Jelas) */}
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
                        onValueChange={(v) =>
                          updateStudent(idx, "positionId", v)
                        }
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
                  Upload Surat Pengantar (PDF){" "}
                  <span className="text-red-500">*</span>
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
                    <CheckCircle2 className="h-3 w-3" /> File terpilih:{" "}
                    {batchSurat.name}
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
            <Button variant="outline" onClick={() => setIsManualOpen(false)}>
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

      {/* DIALOG EDIT (SINGLE) */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px] dark:bg-slate-950">
          <DialogHeader>
            <DialogTitle>Edit Data Peserta</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nama Lengkap</Label>
              <Input
                value={editForm.namaLengkap}
                onChange={(e) =>
                  setEditForm({ ...editForm, namaLengkap: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Instansi</Label>
                <Input
                  value={editForm.instansi}
                  onChange={(e) =>
                    setEditForm({ ...editForm, instansi: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>No HP</Label>
                <Input
                  value={editForm.nomorHp}
                  onChange={(e) =>
                    setEditForm({ ...editForm, nomorHp: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Mulai</Label>
                <Input
                  type="date"
                  value={editForm.tanggalMulai}
                  onChange={(e) =>
                    setEditForm({ ...editForm, tanggalMulai: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Selesai</Label>
                <Input
                  type="date"
                  value={editForm.tanggalSelesai}
                  onChange={(e) =>
                    setEditForm({ ...editForm, tanggalSelesai: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleEditSubmit} disabled={isSubmitting}>
              Update Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG LOGOUT */}
      <Dialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen}>
        <DialogContent className="sm:max-w-[400px] p-6 text-center dark:bg-slate-950 dark:border-slate-800">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <DialogTitle className="text-xl">Konfirmasi Keluar</DialogTitle>
          <DialogDescription>
            Yakin ingin keluar dari sesi admin?
          </DialogDescription>
          <div className="flex gap-2 mt-6 justify-center">
            <Button variant="outline" onClick={() => setIsLogoutOpen(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                router.push("/admin/login");
              }}
            >
              Ya, Keluar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG DELETE */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="dark:bg-slate-950 dark:border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data?</AlertDialogTitle>
            <AlertDialogDescription>
              Data <b>{deletingIntern?.namaLengkap}</b> akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deletingIntern) return;
                await fetch(`/api/pendaftaran/${deletingIntern.id}`, {
                  method: "DELETE",
                });
                fetchData();
                setIsDeleteOpen(false);
                toast.success("Data dihapus");
              }}
              className="bg-red-600 text-white"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
