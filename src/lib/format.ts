import type { Tone, TicketStatus } from "./types";

export const statusLabel: Record<TicketStatus, string> = {
  menunggu_verifikasi: "Menunggu verifikasi email",
  diajukan: "Diajukan",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
  siap_diambil: "Siap diambil",
  dipinjam: "Dipinjam",
  dikembalikan: "Dikembalikan",
  terlambat: "Terlambat",
  dibatalkan: "Dibatalkan",
};

/** Satu kalimat yang menjelaskan apa yang terjadi berikutnya. */
export const statusNext: Record<TicketStatus, string> = {
  menunggu_verifikasi:
    "Masukkan kode yang dikirim ke email UB Anda agar permintaan bisa diproses.",
  diajukan: "Admin akan memeriksa permintaan ini dan memutuskan.",
  disetujui: "Disetujui. Admin akan menyiapkan barang untuk diambil.",
  ditolak: "Permintaan ditolak. Baca catatan Admin, lalu ajukan ulang bila perlu.",
  siap_diambil: "Barang siap. Datang ke lab dan tunjukkan nomor tiket ini.",
  dipinjam: "Barang sedang Anda pinjam. Kembalikan sebelum tanggal tenggat.",
  dikembalikan: "Barang sudah dikembalikan. Terima kasih.",
  terlambat: "Tenggat lewat. Segera kembalikan barang ke lab.",
  dibatalkan: "Permintaan dibatalkan.",
};

export const statusTone: Record<TicketStatus, "neutral" | "blue" | "green" | "yellow" | "red"> = {
  menunggu_verifikasi: "yellow",
  diajukan: "blue",
  disetujui: "green",
  ditolak: "red",
  siap_diambil: "green",
  dipinjam: "blue",
  dikembalikan: "neutral",
  terlambat: "red",
  dibatalkan: "neutral",
};

export const toneTile: Record<Tone, string> = {
  blue: "/patterns/circle-white-on-blue.svg",
  yellow: "/patterns/arcs-white-on-yellow.svg",
  red: "/patterns/plus-white-on-red.svg",
  green: "/patterns/leaves-white-on-green.svg",
};

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const dateTimeFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Jakarta",
});
const weekdayFmt = new Intl.DateTimeFormat("id-ID", { weekday: "long" });

export function formatDate(iso: string) {
  return dateFmt.format(new Date(iso.length === 10 ? `${iso}T00:00:00` : iso));
}

export function formatWeekday(iso: string) {
  return weekdayFmt.format(new Date(`${iso}T00:00:00`));
}

export function formatDateTime(iso: string) {
  return `${dateTimeFmt.format(new Date(iso))} WIB`;
}

export const UB_EMAIL = /^[^\s@]+@([a-z0-9-]+\.)*ub\.ac\.id$/i;
