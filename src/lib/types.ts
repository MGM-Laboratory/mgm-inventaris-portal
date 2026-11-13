export type Tone = "blue" | "yellow" | "red" | "green";

export type Category = {
  id: string;
  name: string;
  tone: Tone;
};

export type AssetModel = {
  id: string;
  name: string;
  categoryId: string;
  description: string;
  /** Awalan kode aset, misalnya "VRQ" untuk MGM-VRQ-001. Dipilih Admin saat barang dibuat. */
  prefix?: string;
  /** Jumlah unit contoh di katalog. Nanti dibaca dari Snipe-IT. */
  total: number;
};

/** Satu unit fisik yang punya label QR. Nanti dibaca dari Snipe-IT. */
export type AssetUnit = {
  tag: string;
  modelId: string;
  serial: string;
  condition: string;
  /** Lokasi rinci di lab; hanya ditampilkan ke Admin. */
  place: string;
  /** Keadaan yang diatur Admin; kosong berarti unit aktif. */
  lifecycle?: Lifecycle;
};

export type Lifecycle = "perawatan" | "hilang" | "pensiun";

export type UnitStatus =
  | "tersedia"
  | "dipesan"
  | "dipinjam"
  | "perawatan"
  | "hilang"
  | "pensiun";

/** Catatan perubahan pada aset. */
export type AssetLog = {
  at: string;
  tag: string;
  action: string;
  by: string;
  note?: string;
};

export type TicketStatus =
  | "menunggu_verifikasi"
  | "diajukan"
  | "disetujui"
  | "ditolak"
  | "siap_diambil"
  | "dipinjam"
  | "dikembalikan"
  | "terlambat"
  | "dibatalkan";

export type Role = "guest" | "member" | "admin";

export type Requester = {
  kind: "guest" | "member";
  name: string;
  /** NIM untuk mahasiswa, NIP untuk dosen dan tenaga kependidikan. */
  nimNip?: string;
  email: string;
};

export type TicketItem = {
  modelId: string;
  qty: number;
  /** Jumlah yang disetujui Admin; kosong sebelum diputuskan. */
  approvedQty?: number;
};

export type TicketEvent = {
  at: string;
  status: TicketStatus;
  by: string;
  note?: string;
};

export type Ticket = {
  number: string;
  createdAt: string;
  status: TicketStatus;
  requester: Requester;
  purpose: string;
  /** Format YYYY-MM-DD. */
  pickupDate: string;
  durationDays: number;
  approvedDurationDays?: number;
  items: TicketItem[];
  decisionNote?: string;
  history: TicketEvent[];
};

export type CartLine = { modelId: string; qty: number };

export type Session = {
  role: Role;
  name?: string;
  nimNip?: string;
  email?: string;
};
