import type { AssetModel, AssetUnit, Category, Ticket } from "./types";

/*
  DATA CONTOH. Daftar model dan jumlahnya mengikuti klaim di labmgm.org,
  bukan hasil audit. Jumlah asli diatur setelah platform jadi (PRD bagian 11).
*/

export const categories: Category[] = [
  { id: "mobile", name: "Mobile", tone: "red" },
  { id: "game-xr", name: "Game dan XR", tone: "green" },
  { id: "ux-hci", name: "UX dan HCI", tone: "yellow" },
];

export const models: AssetModel[] = [
  {
    id: "ponsel-android",
    name: "Ponsel Android",
    categoryId: "mobile",
    description: "Perangkat fisik untuk menguji aplikasi sebelum rilis.",
    total: 6,
  },
  {
    id: "tablet-android",
    name: "Tablet Android",
    categoryId: "mobile",
    description: "Layar besar untuk menguji tata letak dan orientasi.",
    total: 4,
  },
  {
    id: "iphone-ipad",
    name: "iPhone dan iPad",
    categoryId: "mobile",
    description: "Perangkat iOS untuk uji TestFlight dan App Store.",
    total: 3,
  },
  {
    id: "meta-quest-3",
    name: "Meta Quest 3",
    categoryId: "game-xr",
    description: "Headset VR dan mixed reality untuk prototipe XR.",
    total: 5,
  },
  {
    id: "mac-mini",
    name: "Mac Mini M4",
    categoryId: "game-xr",
    description: "Komputer untuk build iOS dan pengembangan Unity.",
    total: 4,
  },
  {
    id: "tablet-gambar",
    name: "Tablet gambar",
    categoryId: "game-xr",
    description: "Untuk ilustrasi, aset 2D, dan animasi.",
    total: 6,
  },
  {
    id: "eye-tracker",
    name: "Eye tracker",
    categoryId: "ux-hci",
    description: "Merekam arah pandang saat sesi uji kegunaan.",
    total: 2,
  },
  {
    id: "monitor-detak",
    name: "Monitor detak jantung",
    categoryId: "ux-hci",
    description: "Mengukur respons pengguna saat mencoba prototipe.",
    total: 3,
  },
  {
    id: "webcam",
    name: "Webcam",
    categoryId: "ux-hci",
    description: "Merekam sesi wawancara dan uji kegunaan jarak jauh.",
    total: 0,
  },
];

export const tagPrefix: Record<string, string> = {
  "ponsel-android": "PHN",
  "tablet-android": "TAB",
  "iphone-ipad": "IOS",
  "meta-quest-3": "VRQ",
  "mac-mini": "MAC",
  "tablet-gambar": "DRW",
  "eye-tracker": "EYE",
  "monitor-detak": "HRT",
  webcam: "CAM",
};
const placesSample = [
  "F10.5, Lemari A",
  "F10.5, Lemari B",
  "F10.6, Rak 1",
  "F10.6, Rak 2",
];
const conditionsSample = ["Baik", "Baik", "Baik", "Ada goresan ringan"];

/** Satu unit per jumlah model, ditambah satu unit contoh yang sedang diservis. */
export const units: AssetUnit[] = [
  ...models.flatMap((m) =>
    Array.from({ length: m.total }, (_, i) => ({
      tag: `MGM-${tagPrefix[m.id]}-${String(i + 1).padStart(3, "0")}`,
      modelId: m.id,
      serial: `SN${tagPrefix[m.id]}${(7919 * (i + 3)).toString(36).toUpperCase()}`,
      condition: conditionsSample[i % conditionsSample.length],
      place: placesSample[i % placesSample.length],
    })),
  ),
  {
    tag: "MGM-VRQ-006",
    modelId: "meta-quest-3",
    serial: "SNVRQ9X2K1",
    condition: "Layar retak, menunggu servis",
    place: "F10.5, Lemari A",
    lifecycle: "perawatan",
  },
];

function isoDay(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isoTime(offsetDays: number, hour = 9) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

/** Tiket contoh dengan tanggal relatif terhadap hari ini. */
export function seedTickets(): Ticket[] {
  const prefix = ticketPrefix();
  return [
    {
      number: `${prefix}-0005-K7QX`,
      createdAt: isoTime(0, 8),
      status: "diajukan",
      requester: {
        kind: "guest",
        name: "Mahasiswa Contoh A",
        nimNip: "000000000001",
        email: "contoh.a@student.ub.ac.id",
      },
      purpose: "Uji kegunaan prototipe tugas akhir",
      pickupDate: isoDay(2),
      durationDays: 3,
      items: [
        { modelId: "eye-tracker", qty: 1 },
        { modelId: "webcam", qty: 1 },
      ],
      history: [
        { at: isoTime(0, 8), status: "diajukan", by: "Mahasiswa Contoh A" },
      ],
    },
    {
      number: `${prefix}-0004-M3TD`,
      createdAt: isoTime(-1, 14),
      status: "diajukan",
      requester: {
        kind: "member",
        name: "Anggota Contoh",
        nimNip: "000000000002",
        email: "anggota.contoh@student.ub.ac.id",
      },
      purpose: "Demo aplikasi mobile di acara fakultas",
      pickupDate: isoDay(1),
      durationDays: 2,
      items: [
        { modelId: "ponsel-android", qty: 3 },
        { modelId: "tablet-android", qty: 1 },
      ],
      history: [
        { at: isoTime(-1, 14), status: "diajukan", by: "Anggota Contoh" },
      ],
    },
    {
      number: `${prefix}-0003-R8WN`,
      createdAt: isoTime(-2, 10),
      status: "siap_diambil",
      requester: {
        kind: "guest",
        name: "Dosen Contoh",
        nimNip: "198000000000000001",
        email: "dosen.contoh@ub.ac.id",
      },
      purpose: "Praktikum realitas virtual",
      pickupDate: isoDay(0),
      durationDays: 2,
      approvedDurationDays: 2,
      items: [{ modelId: "meta-quest-3", qty: 2, approvedQty: 2 }],
      history: [
        { at: isoTime(-2, 10), status: "diajukan", by: "Dosen Contoh" },
        { at: isoTime(-1, 9), status: "disetujui", by: "Admin" },
        { at: isoTime(0, 7), status: "siap_diambil", by: "Admin" },
      ],
    },
    {
      number: `${prefix}-0002-H5ZC`,
      createdAt: isoTime(-6, 11),
      status: "dipinjam",
      requester: {
        kind: "member",
        name: "Anggota Contoh",
        nimNip: "000000000002",
        email: "anggota.contoh@student.ub.ac.id",
      },
      purpose: "Pengembangan prototipe XR",
      pickupDate: isoDay(-5),
      durationDays: 3,
      approvedDurationDays: 3,
      items: [
        { modelId: "mac-mini", qty: 1, approvedQty: 1 },
        { modelId: "meta-quest-3", qty: 1, approvedQty: 1 },
      ],
      history: [
        { at: isoTime(-6, 11), status: "diajukan", by: "Anggota Contoh" },
        { at: isoTime(-5, 8), status: "disetujui", by: "Admin" },
        { at: isoTime(-5, 9), status: "dipinjam", by: "Admin" },
      ],
    },
    {
      number: `${prefix}-0001-P2VY`,
      createdAt: isoTime(-9, 13),
      status: "ditolak",
      requester: {
        kind: "guest",
        name: "Mahasiswa Contoh B",
        nimNip: "000000000003",
        email: "contoh.b@student.ub.ac.id",
      },
      purpose: "Keperluan pribadi",
      pickupDate: isoDay(-7),
      durationDays: 14,
      items: [{ modelId: "mac-mini", qty: 2 }],
      decisionNote:
        "Inventaris dipakai untuk kegiatan lab dan perkuliahan. Ajukan ulang dengan tujuan yang terkait.",
      history: [
        { at: isoTime(-9, 13), status: "diajukan", by: "Mahasiswa Contoh B" },
        {
          at: isoTime(-8, 10),
          status: "ditolak",
          by: "Admin",
          note: "Inventaris dipakai untuk kegiatan lab dan perkuliahan. Ajukan ulang dengan tujuan yang terkait.",
        },
      ],
    },
  ];
}

export function ticketPrefix() {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `MGM-${yy}${mm}`;
}
