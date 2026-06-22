"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// --- TIPE DATA PENELITIAN ---
export type Penelitian = {
  id: string;
  namaLengkap: string;
  nomorInduk: string;
  universitas: string;
  fakultas: string;
  jurusan: string;
  email: string;
  nomorHp: string;
  kategori: string;
  judul: string;
  subjek: string;
  pemohonSurat: string;
  nomorSurat: string;
  tanggalSurat: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  tujuanPenelitian?: string;
  createdAt: string;
};

const MONTHS = [
  { value: "0", label: "Januari" }, { value: "1", label: "Februari" },
  { value: "2", label: "Maret" }, { value: "3", label: "April" },
  { value: "4", label: "Mei" }, { value: "5", label: "Juni" },
  { value: "6", label: "Juli" }, { value: "7", label: "Agustus" },
  { value: "8", label: "September" }, { value: "9", label: "Oktober" },
  { value: "10", label: "November" }, { value: "11", label: "Desember" },
];

export function usePenelitian() {
  const router = useRouter();

  // --- STATE UTAMA ---
  const [dataPenelitian, setDataPenelitian] = useState<Penelitian[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [admin, setAdmin] = useState({ username: "...", jabatan: "..." });

  // --- STATE FILTER ---
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterKategori, setFilterKategori] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  // --- STATE PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // --- FETCH DATA ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/penelitian", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) setDataPenelitian(data);
    } catch (error) {
      toast.error("Gagal mengambil data penelitian.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setAdmin({ username: data.username, jabatan: data.jabatan || "Administrator" });
      } else {
        router.push("/admin/login");
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAdminSession();
    fetchData();
  }, []);

  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const availableYears = useMemo(() => {
    const years = new Set(dataPenelitian.map((p) => new Date(p.createdAt).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [dataPenelitian]);

  const availableCategories = useMemo(() => {
    const categories = new Set(dataPenelitian.map((p) => p.kategori));
    return Array.from(categories).filter(Boolean).sort();
  }, [dataPenelitian]);

  const filteredData = useMemo(() => {
    let data = dataPenelitian.filter((item) => {
      const date = new Date(item.createdAt);
      const matchesSearch =
        item.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.universitas.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.judul.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesYear = filterYear === "all" || date.getFullYear().toString() === filterYear;
      const matchesMonth = filterMonth === "all" || date.getMonth().toString() === filterMonth;
      const matchesKategori = filterKategori === "all" || item.kategori === filterKategori;

      return matchesSearch && matchesYear && matchesMonth && matchesKategori;
    });

    if (sortConfig !== null) {
      data.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof Penelitian];
        let bValue: any = b[sortConfig.key as keyof Penelitian];
        if (sortConfig.key === "createdAt") {
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
        } else if (typeof aValue === "string") {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [dataPenelitian, searchTerm, filterYear, filterMonth, filterKategori, sortConfig]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterYear, filterMonth, filterKategori, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // --- ACTIONS ---
  const deletePenelitian = async (id: string) => {
    try {
      const res = await fetch(`/api/penelitian/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Data berhasil dihapus!");
        fetchData();
        return true;
      } else {
        toast.error("Gagal menghapus data");
        return false;
      }
    } catch (err) {
      toast.error("Terjadi kesalahan sistem");
      return false;
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/penelitian/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        toast.success(`Sukses! Status diperbarui menjadi ${status}`);
        setDataPenelitian((prevList) =>
          prevList.map((p) => (p.id === id ? { ...p, status: status as any } : p))
        );
        return true;
      } else {
        toast.error("Gagal update status database.");
        return false;
      }
    } catch (err) {
      toast.error("Terjadi kesalahan jaringan.");
      return false;
    }
  };

  // --- MESSAGES ---
  const sendWhatsApp = (item: Penelitian) => {
    let hp = item.nomorHp.replace(/\D/g, "");
    if (hp.startsWith("0")) hp = "62" + hp.slice(1);

    let message = "";
    if (item.status === "ACCEPTED") {
      message = `Halo *${item.namaLengkap}*,\n\nPermohonan Izin Penelitian Anda di Dinas DIKPORA DIY telah *DISETUJUI*.\n\n*Detail:* \nJudul: ${item.judul}\nInstansi: ${item.universitas}\n\nSilakan datang ke kantor Dinas Dikpora DIY Sub Bagian Kepegawaian untuk koordinasi pelaksanaan teknis penelitian. \nTerima kasih.`;
    } else {
      message = `Halo *${item.namaLengkap}*,\n\nMohon maaf, permohonan Izin Penelitian Anda dengan judul "${item.judul}" belum dapat kami setujui saat ini. Terima kasih.`;
    }
    window.open(`https://wa.me/${hp}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const sendEmail = (item: Penelitian) => {
    let subject =
      item.status === "ACCEPTED"
        ? "IZIN PENELITIAN DISETUJUI - DINAS DIKPORA DIY"
        : "STATUS PENGAJUAN PENELITIAN";
    let body = "";

    if (item.status === "ACCEPTED") {
      body = `Halo ${item.namaLengkap},\n\nPermohonan Izin Penelitian Anda di Dinas DIKPORA DIY telah *DISETUJUI*.\n\nJudul: ${item.judul}\n\nSilakan datang ke kantor Dinas DIKPORA DIY (Sub Bagian Kepegawaian) untuk koordinasi pelaksanaan teknis penelitian.`;
    } else {
      body = `Halo ${item.namaLengkap},\n\nMohon maaf, permohonan Izin Penelitian Anda dengan judul "${item.judul}" belum dapat kami setujui saat ini. Terima kasih.`;
    }
    window.open(`mailto:${item.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
  };

  // --- EXPORT EXCEL ---
  const exportToExcel = async () => {
    if (filteredData.length === 0) {
      toast.warning("Tidak ada data untuk diexport.");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data Izin Penelitian");

    let titleText = "LAPORAN IZIN PENELITIAN - DINAS DIKPORA DIY";
    if (filterMonth !== "all" && filterYear !== "all") {
      const monthName = MONTHS.find((m) => m.value === filterMonth)?.label;
      titleText += ` (PERIODE: ${monthName?.toUpperCase()} ${filterYear})`;
    } else if (filterYear !== "all") {
      titleText += ` (TAHUN: ${filterYear})`;
    } else if (filterMonth !== "all") {
      const monthName = MONTHS.find((m) => m.value === filterMonth)?.label;
      titleText += ` (BULAN: ${monthName?.toUpperCase()})`;
    } else {
      titleText += " (SEMUA DATA)";
    }

    worksheet.mergeCells("A1:K1");
    const titleRow = worksheet.getCell("A1");
    titleRow.value = titleText;
    titleRow.font = { name: "Arial", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
    titleRow.alignment = { vertical: "middle", horizontal: "center" };
    titleRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1e3a8a" },
    };
    worksheet.getRow(1).height = 40;

    const headerRow = worksheet.getRow(3);
    headerRow.values = [
      "No", "Nama Peneliti", "NIM / NIDN", "Instansi", "Fakultas - Jurusan",
      "Judul Penelitian", "Kategori", "Subjek", "No. HP", "Status", "Tgl Daftar"
    ];
    headerRow.font = { bold: true, color: { argb: "FF000000" }, size: 11 };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFbfdbfe" } };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 25;

    worksheet.getColumn(1).width = 5;
    worksheet.getColumn(2).width = 30;
    worksheet.getColumn(3).width = 20;
    worksheet.getColumn(4).width = 25;
    worksheet.getColumn(5).width = 30;
    worksheet.getColumn(6).width = 40;
    worksheet.getColumn(7).width = 15;
    worksheet.getColumn(8).width = 20;
    worksheet.getColumn(9).width = 15;
    worksheet.getColumn(10).width = 15;
    worksheet.getColumn(11).width = 15;

    filteredData.forEach((item, index) => {
      let statusLabel = "PENDING";
      if (item.status === "ACCEPTED") statusLabel = "DISETUJUI";
      if (item.status === "REJECTED") statusLabel = "DITOLAK";

      const row = worksheet.addRow([
        index + 1,
        item.namaLengkap,
        item.nomorInduk,
        item.universitas,
        `${item.fakultas || "-"} - ${item.jurusan}`,
        item.judul,
        item.kategori,
        item.subjek,
        item.nomorHp,
        statusLabel,
        new Date(item.createdAt).toLocaleDateString("id-ID"),
      ]);
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
      });
      row.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
      row.getCell(10).alignment = { vertical: "middle", horizontal: "center" };
      row.getCell(11).alignment = { vertical: "middle", horizontal: "center" };
    });

    let fileName = "Rekap_Penelitian";
    if (filterMonth !== "all" && filterYear !== "all") {
      const monthName = MONTHS.find((m) => m.value === filterMonth)?.label;
      fileName += `_${monthName}_${filterYear}`;
    } else if (filterYear !== "all") {
      fileName += `_Tahun_${filterYear}`;
    } else {
      fileName += `_All_Data`;
    }
    fileName += ".xlsx";

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, fileName);
    toast.success("Data berhasil diexport!");
  };

  return {
    dataPenelitian: filteredData,
    loading,
    admin,

    searchTerm,
    setSearchTerm,
    filterMonth,
    setFilterMonth,
    filterYear,
    setFilterYear,
    filterKategori,
    setFilterKategori,
    sortConfig,
    requestSort,
    availableYears,
    availableCategories,
    MONTHS,

    currentPage,
    setCurrentPage,
    totalPages,
    startIndex,
    endIndex,
    itemsPerPage,
    setItemsPerPage,

    deletePenelitian,
    updateStatus,
    sendWhatsApp,
    sendEmail,
    exportToExcel,
    fetchData,
  };
}
