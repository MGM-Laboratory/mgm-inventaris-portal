"use client";

import { useSyncExternalStore } from "react";
import {
  categories as seedCategories,
  models as seedModels,
  seedTickets,
  tagPrefix,
  ticketPrefix,
  units as seedUnits,
} from "./mock-data";
import type {
  AssetLog,
  AssetModel,
  AssetUnit,
  CartLine,
  Category,
  Lifecycle,
  Requester,
  Role,
  Session,
  Ticket,
  TicketStatus,
  Tone,
  UnitStatus,
} from "./types";

/*
  Penyimpanan contoh di browser. Semua fungsi di sini nanti diganti panggilan
  ke layanan portal; bentuk datanya sengaja mengikuti tiket di PRD.
*/

type State = {
  session: Session;
  cart: CartLine[];
  tickets: Ticket[];
  /** Nomor tiket yang dibuat di browser ini. */
  mine: string[];
  /** Barang (model) dan kategori. Admin menambah sendiri; nanti dibaca dari Snipe-IT. */
  models: AssetModel[];
  categories: Category[];
  /** Unit aset. Di sistem nyata dibaca dari Snipe-IT. */
  units: AssetUnit[];
  log: AssetLog[];
  /** Tampilan katalog, seperti pilihan tampilan di pengelola berkas. */
  view: CatalogView;
};

export type CatalogView = "ikon" | "daftar" | "rincian";

const KEY = "labmgm-portal-contoh-v3";
export const MAX_ITEMS_PER_REQUEST = 10;
export const VERIFY_CODE_DEMO = "123456";
/**
 * Verifikasi email guest ditunda sampai email pengirim (Gmail IT MGM) siap.
 * Selama false, tiket guest langsung berstatus "diajukan". Ganti ke true bila
 * kode verifikasi sungguhan sudah bisa dikirim.
 */
export const EMAIL_VERIFICATION = false;

/** Huruf dan angka tanpa I, O, 0, 1 agar mudah dibaca dan diketik. */
const SUFFIX_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Bagian acak nomor tiket. Mencegah tiket orang lain ditebak dari urutan. */
function randomSuffix(length = 4) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => SUFFIX_CHARS[b % SUFFIX_CHARS.length]).join("");
}

function initialState(): State {
  return {
    session: { role: "guest" },
    cart: [],
    tickets: seedTickets(),
    mine: [],
    models: seedModels.map((m) => ({ ...m, prefix: tagPrefix[m.id] })),
    categories: seedCategories.map((c) => ({ ...c })),
    units: seedUnits.map((u) => ({ ...u })),
    log: [],
    view: "rincian",
  };
}

/** Keadaan awal di server: tanpa tanggal, agar prarender tetap stabil. */
const serverState: State = {
  session: { role: "guest" },
  cart: [],
  tickets: [],
  mine: [],
  models: seedModels.map((m) => ({ ...m, prefix: tagPrefix[m.id] })),
  categories: seedCategories,
  units: seedUnits,
  log: [],
  view: "rincian",
};
let state: State = serverState;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return { ...initialState(), ...(JSON.parse(raw) as Partial<State>) };
  } catch {
    /* penyimpanan tidak tersedia: pakai data awal */
  }
  return initialState();
}

function commit(next: State) {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* abaikan */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  if (!loaded) {
    loaded = true;
    state = load();
  }
  return state;
}

function getServerSnapshot() {
  return serverState;
}

export function useAppState() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** False saat render di server dan saat hidrasi; true setelah di browser. */
export function useReady() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/* ---------- turunan ---------- */

const RESERVING: TicketStatus[] = [
  "disetujui",
  "siap_diambil",
  "dipinjam",
  "terlambat",
];

export function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function endDateIso(t: Pick<Ticket, "pickupDate" | "durationDays" | "approvedDurationDays">) {
  const d = new Date(`${t.pickupDate}T00:00:00`);
  d.setDate(d.getDate() + (t.approvedDurationDays ?? t.durationDays));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Status yang ditampilkan: tiket dipinjam yang lewat tenggat menjadi terlambat. */
export function effectiveStatus(t: Ticket): TicketStatus {
  if (t.status === "dipinjam" && endDateIso(t) < todayIso()) return "terlambat";
  return t.status;
}

export function reservedQty(tickets: Ticket[], modelId: string) {
  let n = 0;
  for (const t of tickets) {
    if (!RESERVING.includes(t.status)) continue;
    for (const it of t.items) {
      if (it.modelId === modelId) n += it.approvedQty ?? it.qty;
    }
  }
  return n;
}

/** Jumlah unit aktif sebuah model: tidak sedang diservis, hilang, atau pensiun. */
export function modelTotal(modelId: string, units: AssetUnit[] = state.units) {
  return units.filter((u) => u.modelId === modelId && !u.lifecycle).length;
}

export function availableQty(tickets: Ticket[], modelId: string) {
  return Math.max(0, modelTotal(modelId) - reservedQty(tickets, modelId));
}

/**
 * Status tiap unit, diturunkan dari tiket: unit berurutan menurut tag diberi
 * status dipinjam, lalu dipesan, sisanya tersedia. Di sistem nyata, Snipe-IT
 * mencatat unit mana yang dipinjam.
 */
export function unitStatuses(
  tickets: Ticket[],
  units: AssetUnit[] = state.units,
): Record<string, UnitStatus> {
  const out: Record<string, UnitStatus> = {};
  for (const m of state.models) {
    const list = units
      .filter((u) => u.modelId === m.id)
      .sort((a, b) => a.tag.localeCompare(b.tag));
    let borrowed = 0;
    let reserved = 0;
    for (const t of tickets) {
      for (const it of t.items) {
        if (it.modelId !== m.id) continue;
        const q = it.approvedQty ?? it.qty;
        if (t.status === "dipinjam" || t.status === "terlambat") borrowed += q;
        else if (t.status === "disetujui" || t.status === "siap_diambil")
          reserved += q;
      }
    }
    for (const u of list) {
      if (u.lifecycle) {
        out[u.tag] = u.lifecycle;
      } else if (borrowed > 0) {
        out[u.tag] = "dipinjam";
        borrowed -= 1;
      } else if (reserved > 0) {
        out[u.tag] = "dipesan";
        reserved -= 1;
      } else {
        out[u.tag] = "tersedia";
      }
    }
  }
  return out;
}

export function cartCount(cart: CartLine[]) {
  return cart.reduce((n, l) => n + l.qty, 0);
}

export function canViewTicket(s: State, t: Ticket) {
  if (s.session.role === "admin") return true;
  if (s.mine.includes(t.number)) return true;
  if (
    s.session.role === "member" &&
    s.session.email &&
    s.session.email.toLowerCase() === t.requester.email.toLowerCase()
  )
    return true;
  try {
    return window.sessionStorage.getItem(`lacak:${t.number}`) === "1";
  } catch {
    return false;
  }
}

export function markLookedUp(number: string) {
  try {
    window.sessionStorage.setItem(`lacak:${number}`, "1");
  } catch {
    /* abaikan */
  }
}

/* ---------- aksi ---------- */

const SAMPLE_GUEST: Session = {
  role: "guest",
  name: "Mahasiswa Uji",
  nimNip: "000000000099",
  email: "uji.coba@student.ub.ac.id",
};

/** Belum masuk: peran guest tanpa identitas. */
export function isAnonymous(s: Session) {
  return s.role === "guest" && !s.name;
}

/** Guest masuk dengan data diri; tidak memakai akun MGM. */
export function signInGuest(d: { name: string; nimNip: string; email: string }) {
  commit({
    ...state,
    session: {
      role: "guest",
      name: d.name.trim(),
      nimNip: d.nimNip.trim(),
      email: d.email.trim().toLowerCase(),
    },
  });
}

/** Hanya untuk mode contoh: berganti peran tanpa login sungguhan. */
export function setRole(role: Role) {
  const session: Session =
    role === "member"
      ? {
          role,
          name: "Anggota Contoh",
          nimNip: "000000000002",
          email: "anggota.contoh@student.ub.ac.id",
        }
      : role === "admin"
        ? { role, name: "Admin contoh" }
        : { ...SAMPLE_GUEST };
  commit({ ...state, session });
}

export function signOut() {
  commit({ ...state, session: { role: "guest" }, cart: [] });
}

export function addToCart(modelId: string, qty = 1) {
  const cart = [...state.cart];
  const i = cart.findIndex((l) => l.modelId === modelId);
  const room = MAX_ITEMS_PER_REQUEST - cartCount(cart);
  const add = Math.min(qty, room);
  if (add <= 0) return false;
  const stock = availableQty(state.tickets, modelId);
  const current = i >= 0 ? cart[i].qty : 0;
  const next = Math.min(current + add, stock);
  if (next <= current) return false;
  if (i >= 0) cart[i] = { modelId, qty: next };
  else cart.push({ modelId, qty: next });
  commit({ ...state, cart });
  return true;
}

export function setCartQty(modelId: string, qty: number) {
  const others = state.cart.filter((l) => l.modelId !== modelId);
  const room = MAX_ITEMS_PER_REQUEST - cartCount(others);
  const stock = availableQty(state.tickets, modelId);
  const next = Math.max(0, Math.min(qty, room, stock));
  const cart =
    next === 0
      ? others
      : state.cart.some((l) => l.modelId === modelId)
        ? state.cart.map((l) => (l.modelId === modelId ? { ...l, qty: next } : l))
        : [...state.cart, { modelId, qty: next }];
  commit({ ...state, cart });
}

export function clearCart() {
  commit({ ...state, cart: [] });
}

function nextNumber() {
  const prefix = ticketPrefix();
  let max = 0;
  for (const t of state.tickets) {
    if (t.number.startsWith(prefix + "-")) {
      max = Math.max(max, Number(t.number.split("-")[2]) || 0);
    }
  }
  return `${prefix}-${String(max + 1).padStart(4, "0")}-${randomSuffix()}`;
}

export type RequestInput = {
  requester: Requester;
  purpose: string;
  pickupDate: string;
  durationDays: number;
};

/** Guest memverifikasi email dulu bila EMAIL_VERIFICATION aktif; selain itu langsung diajukan. */
export function submitRequest(input: RequestInput) {
  const number = nextNumber();
  const status: TicketStatus =
    input.requester.kind === "guest" && EMAIL_VERIFICATION
      ? "menunggu_verifikasi"
      : "diajukan";
  const now = new Date().toISOString();
  const ticket: Ticket = {
    number,
    createdAt: now,
    status,
    requester: input.requester,
    purpose: input.purpose,
    pickupDate: input.pickupDate,
    durationDays: input.durationDays,
    items: state.cart.map((l) => ({ modelId: l.modelId, qty: l.qty })),
    history: [{ at: now, status, by: input.requester.name }],
  };
  commit({
    ...state,
    tickets: [ticket, ...state.tickets],
    cart: [],
    mine: [number, ...state.mine],
  });
  return number;
}

function patchTicket(number: string, fn: (t: Ticket) => Ticket) {
  commit({
    ...state,
    tickets: state.tickets.map((t) => (t.number === number ? fn(t) : t)),
  });
}

function withEvent(t: Ticket, status: TicketStatus, by: string, note?: string): Ticket {
  return {
    ...t,
    status,
    history: [...t.history, { at: new Date().toISOString(), status, by, note }],
  };
}

export function verifyEmail(number: string, code: string) {
  if (code.trim() !== VERIFY_CODE_DEMO) return false;
  patchTicket(number, (t) =>
    t.status === "menunggu_verifikasi"
      ? withEvent(t, "diajukan", t.requester.name, "Email diverifikasi")
      : t,
  );
  return true;
}

export function cancelTicket(number: string) {
  patchTicket(number, (t) =>
    t.status === "diajukan" || t.status === "menunggu_verifikasi"
      ? withEvent(t, "dibatalkan", t.requester.name)
      : t,
  );
}

export type Decision = {
  approve: boolean;
  items: { modelId: string; approvedQty: number }[];
  durationDays: number;
  note?: string;
};

export function decideTicket(number: string, d: Decision) {
  patchTicket(number, (t) => {
    if (t.status !== "diajukan") return t;
    if (!d.approve) {
      return {
        ...withEvent(t, "ditolak", "Admin", d.note),
        decisionNote: d.note,
      };
    }
    return {
      ...withEvent(t, "disetujui", "Admin", d.note),
      decisionNote: d.note,
      approvedDurationDays: d.durationDays,
      items: t.items.map((it) => ({
        ...it,
        approvedQty:
          d.items.find((x) => x.modelId === it.modelId)?.approvedQty ?? it.qty,
      })),
    };
  });
}

export function advanceTicket(number: string, to: "siap_diambil" | "dipinjam" | "dikembalikan") {
  patchTicket(number, (t) => withEvent(t, to, "Admin"));
}

/* ---------- manajemen aset ---------- */

function actorName() {
  return state.session.name ?? "Admin";
}

function withLog(tag: string, action: string, note?: string): AssetLog[] {
  return [
    { at: new Date().toISOString(), tag, action, by: actorName(), note },
    ...state.log,
  ];
}

function nextTags(modelId: string, count: number) {
  const prefix =
    state.models.find((m) => m.id === modelId)?.prefix ?? tagPrefix[modelId] ?? "AST";
  const head = `MGM-${prefix}-`;
  let max = 0;
  for (const u of state.units) {
    if (u.tag.startsWith(head)) max = Math.max(max, Number(u.tag.slice(head.length)) || 0);
  }
  return Array.from({ length: count }, (_, i) => `${head}${String(max + i + 1).padStart(3, "0")}`);
}

export type UnitDetails = { serial: string; condition: string; place: string };

function slug(s: string) {
  return (
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "barang"
  );
}

function uniqueId(base: string, taken: string[]) {
  let id = base;
  for (let n = 2; taken.includes(id); n++) id = `${base}-${n}`;
  return id;
}

/** Usulan awalan kode dari nama barang, misalnya "Meta Quest 3" menjadi "MQ3". */
/** Daftar barang saat ini, untuk kode di luar komponen. */
export function getModels() {
  return state.models;
}

export function suggestPrefix(name: string) {
  const words = name
    .toUpperCase()
    .normalize("NFKD")
    .replace(/[^A-Z0-9 ]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  const p =
    words.length >= 3
      ? words
          .slice(0, 3)
          .map((w) => w[0])
          .join("")
      : words.join("").slice(0, 3);
  return p || "AST";
}

/** Awalan dari nama, ditambah angka bila sudah dipakai barang lain, agar kode aset tidak bentrok. */
function uniquePrefix(name: string) {
  const used = state.models.map((m) => m.prefix ?? tagPrefix[m.id]);
  const base = suggestPrefix(name);
  let p = base;
  for (let n = 2; used.includes(p); n++) p = `${base.slice(0, 4)}${n}`;
  return p;
}

export function findModelByName(name: string): AssetModel | undefined {
  const n = name.trim().toLowerCase();
  return state.models.find((m) => m.name.toLowerCase() === n);
}

export type NewModelInput = {
  name: string;
  /** Kategori yang sudah ada. Diabaikan bila newCategory diisi. */
  categoryId: string;
  newCategory?: string;
};

/**
 * Membuat barang (model) baru, dan kategori barunya bila diisi. Mengembalikan
 * id barang. Di Snipe-IT ini berarti membuat model aset (dan kategori).
 */
export function addModel(input: NewModelInput): string {
  let categories = state.categories;
  let categoryId = input.categoryId;
  const catName = input.newCategory?.trim();
  if (catName) {
    const existing = categories.find((c) => c.name.toLowerCase() === catName.toLowerCase());
    if (existing) {
      categoryId = existing.id;
    } else {
      const tones: Tone[] = ["blue", "yellow", "red", "green"];
      const id = uniqueId(slug(catName), categories.map((c) => c.id));
      categories = [...categories, { id, name: catName, tone: tones[categories.length % tones.length] }];
      categoryId = id;
    }
  }
  const id = uniqueId(slug(input.name), state.models.map((m) => m.id));
  const model: AssetModel = {
    id,
    name: input.name.trim(),
    categoryId,
    description: "",
    prefix: uniquePrefix(input.name),
    total: 0,
  };
  commit({ ...state, categories, models: [...state.models, model] });
  return id;
}

/** Menambah unit baru untuk model yang sudah ada. Mengembalikan kode-kode barunya. */
export function addUnits(modelId: string, count: number, d: UnitDetails) {
  const tags = nextTags(modelId, count);
  const made: AssetUnit[] = tags.map((tag) => ({
    tag,
    modelId,
    serial: count === 1 ? d.serial.trim() : "",
    condition: d.condition,
    place: d.place.trim(),
  }));
  commit({
    ...state,
    units: [...state.units, ...made],
    log: [
      ...tags.map((tag) => ({
        at: new Date().toISOString(),
        tag,
        action: "Ditambahkan",
        by: actorName(),
      })),
      ...state.log,
    ],
  });
  return tags;
}

export function updateUnit(tag: string, d: UnitDetails) {
  commit({
    ...state,
    units: state.units.map((u) =>
      u.tag === tag
        ? { ...u, serial: d.serial.trim(), condition: d.condition, place: d.place.trim() }
        : u,
    ),
    log: withLog(tag, "Data diubah"),
  });
}

/**
 * Unit yang sedang dipinjam atau dipesan tidak boleh diubah keadaannya;
 * selesaikan tiketnya dulu. Mengembalikan alasan, atau null bila boleh.
 */
export function lifecycleBlocker(tag: string): string | null {
  const u = state.units.find((x) => x.tag === tag);
  if (!u) return "Unit tidak ditemukan.";
  if (u.lifecycle) return null;
  const st = unitStatuses(state.tickets)[tag];
  if (st === "dipinjam" || st === "dipesan") {
    return "Unit ini sedang dipinjam atau dipesan. Selesaikan tiketnya dulu.";
  }
  return null;
}

const lifecycleAction: Record<Lifecycle | "aktif", string> = {
  perawatan: "Dikirim ke perawatan",
  hilang: "Ditandai hilang",
  pensiun: "Dipensiunkan",
  aktif: "Diaktifkan kembali",
};

/** Mengubah keadaan unit: perawatan, hilang, pensiun, atau aktif kembali (null). */
export function setLifecycle(tag: string, to: Lifecycle | null, note?: string) {
  if (lifecycleBlocker(tag)) return false;
  commit({
    ...state,
    units: state.units.map((u) => {
      if (u.tag !== tag) return u;
      const next = { ...u };
      if (to) next.lifecycle = to;
      else delete next.lifecycle;
      return next;
    }),
    log: withLog(tag, lifecycleAction[to ?? "aktif"], note?.trim() || undefined),
  });
  return true;
}

export function setCatalogView(view: CatalogView) {
  commit({ ...state, view });
}

export function resetDemo() {
  commit({ ...initialState(), view: state.view });
}
