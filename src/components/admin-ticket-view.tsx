"use client";

import { use, useState } from "react";
import { TicketCard } from "@/components/ticket-card";
import {
  Button,
  EmptyState,
  Field,
  Stepper,
  inputClass,
} from "@/components/ui";
import { formatDateTime, statusLabel } from "@/lib/format";
import {
  advanceTicket,
  availableQty,
  decideTicket,
  effectiveStatus,
  setRole,
  useAppState,
  useReady,
} from "@/lib/store";
import type { Ticket } from "@/lib/types";
import { PageBody, PageHeader } from "@/components/page-layout";

function DecisionForm({ ticket }: { ticket: Ticket }) {
  const { tickets, models } = useAppState();
  const [qty, setQty] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      ticket.items.map((it) => [
        it.modelId,
        Math.min(it.qty, availableQty(tickets, it.modelId)),
      ]),
    ),
  );
  const [days, setDays] = useState(String(ticket.durationDays));
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const total = Object.values(qty).reduce((a, b) => a + b, 0);

  function approve() {
    const d = Number(days);
    if (total === 0) {
      setError("Setujui paling sedikit satu unit, atau tolak permintaan ini.");
      return;
    }
    if (!Number.isInteger(d) || d < 1 || d > 30) {
      setError("Isi lama pinjam 1 sampai 30 hari.");
      return;
    }
    setError("");
    decideTicket(ticket.number, {
      approve: true,
      durationDays: d,
      note: note.trim() || undefined,
      items: Object.entries(qty).map(([modelId, approvedQty]) => ({
        modelId,
        approvedQty,
      })),
    });
  }

  function reject() {
    if (note.trim().length < 5) {
      setError("Tulis alasan penolakan agar peminjam tahu langkah berikutnya.");
      document.getElementById("catatan")?.focus();
      return;
    }
    setError("");
    decideTicket(ticket.number, {
      approve: false,
      durationDays: ticket.durationDays,
      note: note.trim(),
      items: [],
    });
  }

  return (
    <section
      aria-label="Keputusan"
      className="flex max-w-2xl flex-col gap-5 rounded-2xl border border-line-strong bg-surface p-6 shadow-soft"
    >
      <div>
        <h2 className="font-display text-xl font-semibold">
          Putuskan permintaan
        </h2>
        <p className="mt-1 text-[15px] text-ink-2">
          Ubah jumlah atau lama pinjam bila perlu. Peminjam melihat perubahan di
          tiketnya.
        </p>
      </div>

      <ul className="flex flex-col divide-y divide-line">
        {ticket.items.map((it) => {
          const m = models.find((x) => x.id === it.modelId)!;
          const avail = availableQty(tickets, it.modelId);
          return (
            <li
              key={it.modelId}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div>
                <p className="font-medium">{m.name}</p>
                <p className="tnum text-sm text-ink-3">
                  Diminta {it.qty}, tersedia {avail}
                </p>
              </div>
              <Stepper
                label={m.name}
                value={qty[it.modelId] ?? 0}
                max={Math.min(it.qty, avail)}
                onChange={(n) => setQty((q) => ({ ...q, [it.modelId]: n }))}
              />
            </li>
          );
        })}
      </ul>

      <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
        <Field label="Lama pinjam (hari)" htmlFor="hari">
          <input
            id="hari"
            type="number"
            min={1}
            max={30}
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className={`${inputClass} tnum`}
          />
        </Field>
        <Field
          label="Catatan untuk peminjam"
          htmlFor="catatan"
          hint="Wajib diisi bila menolak."
        >
          <input
            id="catatan"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      {error ? (
        <p role="alert" className="text-[15px] text-red-text">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button onClick={approve}>Setujui</Button>
        <Button variant="danger" onClick={reject}>
          Tolak
        </Button>
      </div>
    </section>
  );
}

function AdminTicketViewInner({
  params,
}: {
  params: Promise<{ nomor: string }>;
}) {
  const { nomor } = use(params);
  const ready = useReady();
  const { tickets, session } = useAppState();

  if (!ready) return <p className="text-ink-3">Memuat…</p>;

  if (session.role !== "admin") {
    return (
      <EmptyState
        tile="/patterns/square-white-on-blue.svg"
        title="Halaman ini untuk Admin dan Maintainer"
        action={
          <Button variant="secondary" onClick={() => setRole("admin")}>
            Lihat sebagai Admin
          </Button>
        }
      >
        Di mode contoh, tombol ini mengganti peran tanpa login.
      </EmptyState>
    );
  }

  const ticket = tickets.find((t) => t.number === decodeURIComponent(nomor));
  if (!ticket) {
    return (
      <EmptyState
        tile="/patterns/x-red-on-white.svg"
        title="Tiket tidak ditemukan"
      />
    );
  }

  const status = effectiveStatus(ticket);

  const nextAction =
    ticket.status === "disetujui"
      ? {
          to: "siap_diambil" as const,
          label: "Tandai siap diambil",
          help: "Barang sudah disiapkan di lab.",
        }
      : ticket.status === "siap_diambil"
        ? {
            to: "dipinjam" as const,
            label: "Catat serah terima",
            help: "Peminjam sudah mengambil barang. Di sistem nyata ini memanggil check-out Snipe-IT.",
          }
        : ticket.status === "dipinjam"
          ? {
              to: "dikembalikan" as const,
              label: "Terima pengembalian",
              help: "Barang sudah kembali. Di sistem nyata ini memanggil check-in Snipe-IT.",
            }
          : null;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={ticket.number}
        description={`Peminjam: ${ticket.requester.name}`}
        crumbs={[
          { label: "Admin" },
          { label: "Permintaan", href: "/admin/permintaan" },
          { label: ticket.number },
        ]}
      />

      <TicketCard ticket={ticket} status={status} />

      {ticket.status === "diajukan" ? <DecisionForm ticket={ticket} /> : null}

      {nextAction ? (
        <section
          aria-label="Langkah berikutnya"
          className="flex max-w-2xl flex-col items-start gap-3 rounded-2xl border border-line-strong bg-surface p-6 shadow-soft"
        >
          <p className="text-[15px] text-ink-2">{nextAction.help}</p>
          <Button onClick={() => advanceTicket(ticket.number, nextAction.to)}>
            {nextAction.label}
          </Button>
        </section>
      ) : null}

      <section aria-label="Riwayat tiket" className="max-w-2xl">
        <h2 className="font-display text-lg font-semibold">Riwayat</h2>
        <ol className="mt-3 flex flex-col border-l border-line-strong">
          {[...ticket.history].reverse().map((ev, i) => (
            <li key={`${ev.at}-${i}`} className="relative pb-5 pl-6 last:pb-0">
              <span
                aria-hidden
                className="absolute -left-[5px] top-2 size-2.5 rounded-full border-2 border-page bg-blue"
              />
              <p className="text-[15px] font-medium">
                {statusLabel[ev.status]}
              </p>
              <p className="text-sm text-ink-3">
                {formatDateTime(ev.at)}, oleh {ev.by}
              </p>
              {ev.note ? (
                <p className="mt-1 text-sm text-ink-2">{ev.note}</p>
              ) : null}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

export default function AdminTicketView(props: {
  params: Promise<{ nomor: string }>;
}) {
  return (
    <PageBody>
      <AdminTicketViewInner {...props} />
    </PageBody>
  );
}
