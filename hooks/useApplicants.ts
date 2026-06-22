"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// --- TIPE DATA ---
export type Pendaftaran = {
  id: string;
  namaLengkap: string;
  nomorHp: string;
  email: string;
  instansi: string;
  jurusan: string;
  nomorInduk: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "RECOMMENDED";
  cvPath: string;
  suratPath: string;
  fotoPath: string;
  positionId: number | null;
  pembimbing?: string | null;
  kontakPembimbing?: string | null;
  createdAt: string;
};

export type Position = {
  id: number;
  title: string;
  quota: number;
  filled: number;
};

export type Upt = {
  id: number;
  name: string;
  address?: string;
};

const MONTHS = [
  { value: "0", label: "Januari" }, { value: "1", label: "Februari" },
  { value: "2", label: "Maret" }, { value: "3", label: "April" },
  { value: "4", label: "Mei" }, { value: "5", label: "Juni" },
  { value: "6", label: "Juli" }, { value: "7", label: "Agustus" },
  { value: "8", label: "September" }, { value: "9", label: "Oktober" },
  { value: "10", label: "November" }, { value: "11", label: "Desember" },
];

export function useApplicants() {
  const router = useRouter();

  // State Utama
  const [pendaftar, setPendaftar] = useState<Pendaftaran[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [upts, setUpts] = useState<Upt[]>([]);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState({ username: "...", jabatan: "..." });

  // State Filter & Sort
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterJenis, setFilterJenis] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // --- FETCH DATA ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const [resPendaftar, resPositions, resUpt] = await Promise.all([
        fetch("/api/pendaftaran", { cache: "no-store" }),
        fetch("/api/positions", { cache: "no-store" }),
        fetch("/api/upt", { cache: "no-store" }),
      ]);

      const dataPendaftar = await resPendaftar.json();
      const dataPositions = await resPositions.json();
      const dataUpt = await resUpt.json();

      if (Array.isArray(dataPendaftar)) setPendaftar(dataPendaftar);
      if (Array.isArray(dataPositions)) setPositions(dataPositions);
      if (Array.isArray(dataUpt)) setUpts(dataUpt);
    } catch (error) {
      console.error("Gagal ambil data:", error);
      toast.error("Gagal mengambil data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (res.ok) {
        setAdmin({
          username: data.username,
          jabatan: data.jabatan || "Administrator",
        });
      } else {
        router.push("/admin/login");
      }
    } catch (error) {
      console.error("Auth error:", error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchAdminSession();
  }, []);

  // --- LOGIC FILTERING & SORTING ---
  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const availableYears = useMemo(() => {
    const years = new Set(pendaftar.map((p) => new Date(p.createdAt).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [pendaftar]);

  const filteredData = useMemo(() => {
    let data = pendaftar.filter((item) => {
      const date = new Date(item.createdAt);
      const matchesSearch =
        item.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.instansi.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesYear = filterYear === "all" || date.getFullYear().toString() === filterYear;
      const matchesMonth = filterMonth === "all" || date.getMonth().toString() === filterMonth;
      const matchesJenis =
        filterJenis === "all" ||
        (filterJenis === "smk" && item.cvPath === "manual-entry-smk") ||
        (filterJenis === "mahasiswa" && item.cvPath !== "manual-entry-smk");
      return matchesSearch && matchesYear && matchesMonth && matchesJenis;
    });

    if (sortConfig !== null) {
      data.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof Pendaftaran];
        let bValue: any = b[sortConfig.key as keyof Pendaftaran];
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
  }, [pendaftar, searchTerm, filterYear, filterMonth, filterJenis, sortConfig]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterYear, filterMonth, filterJenis, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // --- ACTIONS ---
  const deletePelamar = async (id: string) => {
    try {
      const res = await fetch(`/api/pendaftaran/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Data pelamar berhasil dihapus");
        fetchData();
        return true;
      } else {
        toast.error("Gagal menghapus data");
        return false;
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
      return false;
    }
  };

  const processStatus = async (
    id: string,
    status: string,
    positionId: number | null
  ) => {
    try {
      const res = await fetch(`/api/pendaftaran/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, positionId }),
      });

      if (res.ok) {
        fetchData();
        return true;
      } else {
        toast.error("Gagal update status.");
        return false;
      }
    } catch (error) {
      toast.error("Server error, coba lagi nanti.");
      return false;
    }
  };

  // Helper Date Indonesia
  const formatDateIndo = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getPositionName = (id: number | null) => {
    if (!id) return "-";
    return positions.find((p) => p.id === id)?.title || "Posisi Tidak Ditemukan";
  };

  // --- NOTIFIKASI WA & EMAIL ---
  const sendWhatsApp = (p: Pendaftaran, selectedUptName?: string) => {
    if (!p.nomorHp) return toast.error("Nomor HP tidak tersedia");

    let hp = p.nomorHp.replace(/\D/g, "");
    if (hp.startsWith("0")) hp = "62" + hp.slice(1);

    const tglMulai = formatDateIndo(p.tanggalMulai);
    const tglSelesai = formatDateIndo(p.tanggalSelesai);
    let message = "";

    if (p.status === "ACCEPTED") {
      const posName = getPositionName(p.positionId);
      message = `Halo *${p.namaLengkap}*,\n\nAnda *DITERIMA* magang di Dinas DIKPORA DIY.\n\n*Detail Penerimaan:*\nNama: ${p.namaLengkap}\nAsal: ${p.instansi}\nBidang: ${posName}\nTanggal Magang: ${tglMulai} s.d. ${tglSelesai}\n\nMohon balas pesan ini untuk konfirmasi kesediaannya. Terima kasih.`;
    } else if (p.status === "REJECTED") {
      message = `Halo *${p.namaLengkap}*,\n\nTerima kasih sudah mendaftar magang di Dinas DIKPORA DIY (Asal: ${p.instansi}).\n\nMohon maaf, berdasarkan hasil seleksi berkas, saat ini kami belum bisa menerima permohonan magang Anda di Dinas DIKPORA DIY. Tetap semangat dan sukses selalu untuk studinya!`;
    } else if (p.status === "RECOMMENDED") {
      if (!selectedUptName) {
        toast.warning("Mohon pilih UPT terlebih dahulu di dropdown sebelum kirim WA.");
        return;
      }
      const uptDetail = upts.find((u) => u.name === selectedUptName);
      const alamatUpt = uptDetail?.address || "Alamat belum tersedia (Hubungi Admin)";
      message = `Halo, *${p.namaLengkap}*\n\nMenindaklanjuti permohonan magang Anda di Dinas DIKPORA DIY, dengan ini kami informasikan hasil verifikasi berkas:\n\n*Data Pelamar:*\nNama: ${p.namaLengkap}\nNIM/NIS: ${p.nomorInduk || "-"}\nJurusan: ${p.jurusan}\nAsal Sekolah/Kampus: ${p.instansi}\n\nBerdasarkan ketersediaan kuota di kantor induk, kami *MEREKOMENDASIKAN* Anda untuk melaksanakan magang di Unit Pelaksana Teknis (UPT) kami:\n\n*Unit Tujuan: ${selectedUptName}*\nAlamat: ${alamatUpt}\n\nSilakan datang atau menghubungi pihak UPT terkait dengan membawa surat pengantar ini untuk proses administrasi lebih lanjut.\n\nTerima kasih.`;
    }

    const url = `https://wa.me/${hp}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const sendEmail = (p: Pendaftaran, selectedUptName?: string) => {
    if (!p.email) return toast.error("Email tidak tersedia");

    let subject = "";
    let body = "";
    const tglMulai = formatDateIndo(p.tanggalMulai);
    const tglSelesai = formatDateIndo(p.tanggalSelesai);

    if (p.status === "ACCEPTED") {
      const posName = getPositionName(p.positionId);
      subject = "SELAMAT! Anda Diterima Magang - Dinas DIKPORA DIY";
      body = `Halo ${p.namaLengkap},\n\nSelamat! Anda DITERIMA magang di Dinas DIKPORA DIY.\n\nDetail Penerimaan:\nNama: ${p.namaLengkap}\nAsal: ${p.instansi}\nBidang: ${posName}\nTanggal Magang: ${tglMulai} s.d. ${tglSelesai}\n\nSilakan balas email ini untuk konfirmasi.`;
    } else if (p.status === "REJECTED") {
      subject = "Update Status Pendaftaran Magang - Dinas DIKPORA DIY";
      body = `Halo ${p.namaLengkap},\n\nTerima kasih telah mendaftar di Dinas DIKPORA DIY.\n\nMohon maaf, lamaran magang Anda belum dapat kami terima di periode ini karena keterbatasan kuota/ketidaksesuaian kualifikasi.\n\nTerima kasih.`;
    } else if (p.status === "RECOMMENDED") {
      if (!selectedUptName) {
        toast.warning("Pilih UPT terlebih dahulu sebelum kirim Email.");
        return;
      }
      const uptDetail = upts.find((u) => u.name === selectedUptName);
      const alamatUpt = uptDetail?.address || "Alamat belum tersedia (Hubungi Admin)";
      subject = "Rekomendasi Penempatan Magang - Dinas DIKPORA DIY";
      body = `Halo ${p.namaLengkap},\n\nMenindaklanjuti permohonan magang Anda, kami informasikan status pendaftaran Anda:\n\nData Pelamar:\nNama: ${p.namaLengkap}\nNIM/NIS: ${p.nomorInduk || "-"}\nJurusan: ${p.jurusan}\nAsal: ${p.instansi}\n\nStatus: DIREKOMENDASIKAN (PINDAH LOKASI)\n\nKami merekomendasikan Anda untuk melanjutkan proses magang di Unit Pelaksana Teknis (UPT) kami berikut ini:\n\nNama UPT : ${selectedUptName}\nAlamat   : ${alamatUpt}\n\nSilakan berkoordinasi langsung dengan pihak UPT terkait menggunakan surat rekomendasi ini.\n\nTerima kasih,\nAdmin Dinas DIKPORA DIY`;
    }

    const url = `mailto:${p.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, "_blank");
  };

  // --- EXPORT EXCEL ---
  const exportToExcel = async () => {
    if (filteredData.length === 0) {
      toast.warning("Tidak ada data untuk diexport.");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data Pelamar");

    let titleText = "LAPORAN PENDAFTAR MAGANG - DINAS DIKPORA DIY";
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

    worksheet.mergeCells("A1:J1");
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
      "No", "Nama Lengkap", "Instansi", "Jurusan", "Nomor HP",
      "Tgl Daftar", "Mulai Magang", "Selesai Magang", "Status", "Penempatan"
    ];
    headerRow.font = { bold: true, color: { argb: "FF000000" }, size: 11 };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFbfdbfe" } };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 25;

    worksheet.getColumn(1).width = 5;
    worksheet.getColumn(2).width = 30;
    worksheet.getColumn(3).width = 25;
    worksheet.getColumn(4).width = 25;
    worksheet.getColumn(5).width = 18;
    worksheet.getColumn(6).width = 15;
    worksheet.getColumn(7).width = 15;
    worksheet.getColumn(8).width = 15;
    worksheet.getColumn(9).width = 15;
    worksheet.getColumn(10).width = 25;

    filteredData.forEach((item, index) => {
      const posisi = positions.find((p) => p.id === item.positionId)?.title || "-";
      let statusLabel = "PENDING";
      if (item.status === "ACCEPTED") statusLabel = "DITERIMA";
      if (item.status === "REJECTED") statusLabel = "DITOLAK";
      if (item.status === "RECOMMENDED") statusLabel = "DIREKOMENDASIKAN";

      const row = worksheet.addRow([
        index + 1,
        item.namaLengkap,
        item.instansi,
        item.jurusan,
        item.nomorHp || "-",
        new Date(item.createdAt).toLocaleDateString("id-ID"),
        new Date(item.tanggalMulai).toLocaleDateString("id-ID"),
        new Date(item.tanggalSelesai).toLocaleDateString("id-ID"),
        statusLabel,
        posisi,
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
      row.getCell(6).alignment = { vertical: "middle", horizontal: "center" };
      row.getCell(7).alignment = { vertical: "middle", horizontal: "center" };
      row.getCell(8).alignment = { vertical: "middle", horizontal: "center" };
      row.getCell(9).alignment = { vertical: "middle", horizontal: "center" };
    });

    let fileName = "Rekap_Magang";
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
    // Data Utama
    pendaftar: filteredData,
    positions,
    upts,
    loading,
    admin,

    // States & Setters
    searchTerm,
    setSearchTerm,
    filterYear,
    setFilterYear,
    filterMonth,
    setFilterMonth,
    filterJenis,
    setFilterJenis,
    sortConfig,
    requestSort,
    availableYears,
    MONTHS,

    // Pagination
    currentPage,
    setCurrentPage,
    totalPages,
    startIndex,
    endIndex,
    itemsPerPage,
    setItemsPerPage,

    // Actions & Helpers
    deletePelamar,
    processStatus,
    sendWhatsApp,
    sendEmail,
    exportToExcel,
    getPositionName,
    fetchData,
  };
}
