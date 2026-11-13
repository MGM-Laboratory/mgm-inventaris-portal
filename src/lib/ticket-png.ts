import QRCode from "qrcode";
import { getModels } from "./store";
import {
  formatDate,
  formatWeekday,
  statusLabel,
  statusTone,
  toneTile,
} from "./format";
import { endDateIso } from "./store";
import type { Ticket, TicketStatus, Tone } from "./types";

/*
  Tiket sebagai gambar PNG, digambar langsung di kanvas supaya hasilnya sama di
  semua browser dan selalu bertema terang, apa pun tema halaman. QR di tiket
  membuka /tiket/<nomor>; halaman itu tetap meminta email bagi non-Admin.
*/

const W = 1200;
const H = 540;
const SCALE = 2;
const M = 24;
const STUB = 340;

const ink = "#0e1116";
const ink2 = "#3b4150";
const ink3 = "#6b7280";
const lineStrong = "#d8d8d2";
const page = "#f7f7f5";

const pill: Record<
  "neutral" | "blue" | "green" | "yellow" | "red",
  { bg: string; fg: string }
> = {
  neutral: { bg: "#efefec", fg: ink2 },
  blue: { bg: "#ecf1fa", fg: "#2f5aa6" },
  green: { bg: "#e2f1ea", fg: "#0b6d47" },
  yellow: { bg: "#fef6e0", fg: ink },
  red: { bg: "#fee5e5", fg: "#b42323" },
};

const stubTone: Record<keyof typeof pill, Tone> = {
  neutral: "blue",
  blue: "blue",
  green: "green",
  yellow: "yellow",
  red: "red",
};

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Gagal memuat ${src}`));
    img.src = src;
  });
}

function fontFamily(variable: string, fallback: string) {
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
  return v || fallback;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(next).width <= maxWidth || !cur) {
      cur = next;
    } else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    let last = kept[maxLines - 1];
    while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) {
      last = last.slice(0, -1);
    }
    kept[maxLines - 1] = `${last}…`;
    return kept;
  }
  return lines;
}

export async function renderTicketPng(
  ticket: Ticket,
  status: TicketStatus,
  origin: string,
): Promise<Blob> {
  const sans = fontFamily("--font-geist-sans", "system-ui, sans-serif");
  const mono = fontFamily("--font-geist-mono", "ui-monospace, monospace");
  const display = fontFamily("--font-hanken", sans);

  await Promise.all([
    document.fonts.load(`600 30px ${display}`),
    document.fonts.load(`400 16px ${sans}`),
    document.fonts.load(`500 16px ${sans}`),
    document.fonts.load(`600 26px ${mono}`),
  ]);

  const tone = statusTone[status];
  const [tile, logo] = await Promise.all([
    loadImage(toneTile[stubTone[tone]]),
    loadImage("/logo.svg"),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Kanvas tidak tersedia");
  ctx.scale(SCALE, SCALE);

  // Latar halaman
  ctx.fillStyle = page;
  ctx.fillRect(0, 0, W, H);

  // Kartu
  const cx = M;
  const cy = M;
  const cw = W - M * 2;
  const ch = H - M * 2;
  ctx.save();
  ctx.shadowColor = "rgba(14,17,22,0.12)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(cx, cy, cw, ch, 20);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = lineStrong;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(cx, cy, cw, ch, 20);
  ctx.stroke();

  // Pola di bagian atas stub
  const stubX = cx;
  const patH = 150;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(stubX, cy, STUB, patH, [20, 0, 0, 0]);
  ctx.clip();
  const ts = 112;
  for (let y = cy; y < cy + patH; y += ts) {
    for (let x = stubX; x < stubX + STUB; x += ts) {
      ctx.drawImage(tile, x, y, ts, ts);
    }
  }
  ctx.restore();

  // Garis sobekan dan lekukan
  const splitX = cx + STUB;
  ctx.save();
  ctx.setLineDash([7, 7]);
  ctx.strokeStyle = lineStrong;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(splitX, cy + 14);
  ctx.lineTo(splitX, cy + ch - 14);
  ctx.stroke();
  ctx.restore();
  for (const y of [cy, cy + ch]) {
    ctx.fillStyle = page;
    ctx.beginPath();
    ctx.arc(splitX, y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = lineStrong;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(splitX, y, 14, y === cy ? 0 : Math.PI, y === cy ? Math.PI : Math.PI * 2);
    ctx.stroke();
  }

  // Isi stub
  const sx = stubX + 26;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = ink3;
  ctx.font = `400 16px ${sans}`;
  ctx.fillText("Nomor tiket", sx, cy + patH + 40);
  ctx.fillStyle = ink;
  ctx.font = `600 24px ${mono}`;
  ctx.fillText(ticket.number, sx, cy + patH + 78);

  const label = statusLabel[status];
  ctx.font = `500 16px ${sans}`;
  const pw = ctx.measureText(label).width + 40;
  const py = cy + patH + 100;
  ctx.fillStyle = pill[tone].bg;
  ctx.beginPath();
  ctx.roundRect(sx, py, pw, 32, 16);
  ctx.fill();
  ctx.fillStyle = pill[tone].fg;
  ctx.beginPath();
  ctx.arc(sx + 16, py + 16, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillText(label, sx + 28, py + 21);

  if (status === "disetujui" || status === "siap_diambil" || status === "dipinjam") {
    ctx.fillStyle = ink3;
    ctx.font = `400 15px ${sans}`;
    ctx.fillText("Tunjukkan tiket ini", sx, cy + ch - 78);
    ctx.fillText("saat mengambil barang.", sx, cy + ch - 58);
  }
  ctx.drawImage(logo, sx, cy + ch - 46, 30, 30);
  ctx.fillStyle = ink;
  ctx.font = `600 20px ${display}`;
  ctx.fillText("LabMGM", sx + 40, cy + ch - 24);

  // Isi utama
  const rx = splitX + 34;
  const rightMax = cx + cw - 34 - 160;
  const textW = rightMax - rx - 10;

  ctx.fillStyle = ink3;
  ctx.font = `400 15px ${sans}`;
  ctx.fillText("Peminjam", rx, cy + 42);
  ctx.fillStyle = ink;
  ctx.font = `600 30px ${display}`;
  ctx.fillText(ticket.requester.name, rx, cy + 78);
  ctx.fillStyle = ink2;
  ctx.font = `400 16px ${sans}`;
  const who = `${ticket.requester.nimNip ? `${ticket.requester.nimNip}, ` : ""}${ticket.requester.email}`;
  ctx.fillText(wrap(ctx, who, textW, 1)[0] ?? "", rx, cy + 104);

  ctx.fillStyle = ink3;
  ctx.font = `400 15px ${sans}`;
  ctx.fillText("Tujuan", rx, cy + 146);
  ctx.fillStyle = ink;
  ctx.font = `400 18px ${sans}`;
  wrap(ctx, ticket.purpose, textW, 2).forEach((l, i) =>
    ctx.fillText(l, rx, cy + 172 + i * 24),
  );

  ctx.fillStyle = ink3;
  ctx.font = `400 15px ${sans}`;
  ctx.fillText("Barang", rx, cy + 232);
  const rows = ticket.items.map((it) => ({
    name: getModels().find((m) => m.id === it.modelId)?.name ?? it.modelId,
    qty: it.approvedQty ?? it.qty,
  }));
  const shown = rows.length > 4 ? rows.slice(0, 3) : rows;
  ctx.font = `400 18px ${sans}`;
  shown.forEach((r, i) => {
    const y = cy + 260 + i * 26;
    ctx.fillStyle = ink;
    ctx.textAlign = "left";
    ctx.fillText(r.name, rx, y);
    ctx.fillStyle = ink2;
    ctx.textAlign = "right";
    ctx.fillText(`${r.qty} unit`, rightMax - 10, y);
  });
  ctx.textAlign = "left";
  if (rows.length > 4) {
    ctx.fillStyle = ink3;
    ctx.fillText(`dan ${rows.length - 3} barang lain`, rx, cy + 260 + 3 * 26);
  }

  // Tanggal
  const dy = cy + ch - 80;
  ctx.save();
  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = lineStrong;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(rx, dy - 20);
  ctx.lineTo(rightMax, dy - 20);
  ctx.stroke();
  ctx.restore();
  const end = endDateIso(ticket);
  const days = ticket.approvedDurationDays ?? ticket.durationDays;
  ctx.fillStyle = ink3;
  ctx.font = `400 15px ${sans}`;
  ctx.fillText("Ambil", rx, dy + 6);
  ctx.fillText("Kembali paling lambat", rx + 250, dy + 6);
  ctx.fillStyle = ink;
  ctx.font = `500 19px ${sans}`;
  ctx.fillText(
    `${formatWeekday(ticket.pickupDate)}, ${formatDate(ticket.pickupDate)}`,
    rx,
    dy + 38,
  );
  ctx.fillText(`${formatDate(end)} (${days} hari)`, rx + 250, dy + 38);

  // QR ke halaman tiket
  const qr = QRCode.create(`${origin}/tiket/${ticket.number}`, {
    errorCorrectionLevel: "M",
  });
  const n = qr.modules.size;
  const quiet = 2;
  const qsize = 150;
  const unit = qsize / (n + quiet * 2);
  const qx = cx + cw - 34 - qsize;
  const qy = cy + ch - 34 - qsize;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(qx, qy, qsize, qsize);
  ctx.fillStyle = ink;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.modules.data[r * n + c]) {
        ctx.fillRect(
          qx + (c + quiet) * unit,
          qy + (r + quiet) * unit,
          Math.ceil(unit),
          Math.ceil(unit),
        );
      }
    }
  }
  ctx.fillStyle = ink3;
  ctx.font = `400 13px ${sans}`;
  ctx.textAlign = "center";
  ctx.fillText("Pindai untuk membuka", qx + qsize / 2, qy - 10);
  ctx.textAlign = "left";

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Gagal membuat gambar"))),
      "image/png",
    ),
  );
}

export async function downloadTicketPng(ticket: Ticket, status: TicketStatus) {
  const blob = await renderTicketPng(ticket, status, window.location.origin);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tiket-${ticket.number}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
