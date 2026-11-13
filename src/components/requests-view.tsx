"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { AdminOnly } from "@/components/admin-only";
import { Box, PageBody, PageHeader, tdClass, thClass } from "@/components/page-layout";
import { EmptyState, StatusBadge, buttonClass, inputClass } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { effectiveStatus, endDateIso, useAppState } from "@/lib/store";
import type { AssetModel, Ticket, TicketStatus } from "@/lib/types";

const tabs: { id: string; label: string; match: TicketStatus[] | null }[] = [
  { id: "putus", label: "Perlu diputuskan", match: ["diajukan"] },
  { id: "ambil", label: "Siap diambil", match: ["disetujui", "siap_diambil"] },
  { id: "pinjam", label: "Sedang dipinjam", match: ["dipinjam", "terlambat"] },
  {
    id: "selesai",
    label: "Selesai",
    match: ["dikembalikan", "ditolak", "dibatalkan", "menunggu_verifikasi"],
  },
  { id: "semua", label: "Semua", match: null },
];

function summary(t: Ticket, models: AssetModel[]) {
  return t.items
    .map((it) => `${it.approvedQty ?? it.qty} ${models.find((m) => m.id === it.modelId)?.name ?? it.modelId}`)
    .join(", ");
}

function Requests() {
  const params = useSearchParams();
  const { tickets, models } = useAppState();
  const initial = tabs.some((t) => t.id === params.get("status")) ? params.get("status")! : "putus";
  const [tab, setTab] = useState(initial);
  const [q, setQ] = useState("");

  const all = useMemo(
    () => tickets.map((t) => ({ t, s: effectiveStatus(t) })),
    [tickets],
  );
  const countOf = (match: TicketStatus[] | null) =>
    match ? all.filter(({ s }) => match.includes(s)).length : all.length;

  const active = tabs.find((x) => x.id === tab)!;
  const needle = q.trim().toLowerCase();
  const rows = all
    .filter(({ s }) => !active.match || active.match.includes(s))
    .filter(
      ({ t }) =>
        !needle ||
        t.number.toLowerCase().includes(needle) ||
        t.requester.name.toLowerCase().includes(needle) ||
        (t.requester.nimNip ?? "").includes(needle),
    )
    .sort((a, b) => b.t.createdAt.localeCompare(a.t.createdAt));

  return (
    <PageBody>
      <PageHeader
        title="Permintaan"
        description="Tiket peminjaman yang diajukan guest dan member."
        crumbs={[{ label: "Admin" }, { label: "Permintaan" }]}
      />

      <Box flush>
        <div className="flex flex-col gap-3 border-b border-line p-4">
          <div role="tablist" aria-label="Status tiket" className="flex flex-wrap gap-2">
            {tabs.map((x) => (
              <button
                key={x.id}
                role="tab"
                type="button"
                aria-selected={tab === x.id}
                onClick={() => setTab(x.id)}
                className={`rounded-full border px-3.5 py-1 text-[14px] font-medium ${
                  tab === x.id
                    ? "border-ink bg-ink text-page"
                    : "border-line-strong bg-surface text-ink-2 hover:border-ink-3"
                }`}
              >
                {x.label} <span className="tnum opacity-70">{countOf(x.match)}</span>
              </button>
            ))}
          </div>
          <div className="relative sm:w-80">
            <Search
              size={16}
              strokeWidth={2.25}
              aria-hidden
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3"
            />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nomor, nama, atau NIM"
              aria-label="Cari tiket"
              className={`${inputClass} h-10 pl-10`}
            />
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState tile="/patterns/circle-blue-on-white.svg" title="Tidak ada tiket di sini">
              Tiket dengan status dan kata kunci ini akan muncul di daftar.
            </EmptyState>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[14px]">
              <caption className="sr-only">Daftar tiket peminjaman</caption>
              <thead className="border-b border-line bg-sunken/50">
                <tr>
                  <th scope="col" className={thClass}>Nomor</th>
                  <th scope="col" className={thClass}>Peminjam</th>
                  <th scope="col" className={thClass}>Barang</th>
                  <th scope="col" className={thClass}>Ambil</th>
                  <th scope="col" className={thClass}>Kembali</th>
                  <th scope="col" className={thClass}>Status</th>
                  <th scope="col" className={`${thClass} text-right`}>Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map(({ t, s }) => (
                  <tr key={t.number} className="hover:bg-sunken/60">
                    <td className={`${tdClass} whitespace-nowrap`}>
                      <Link
                        href={`/admin/tiket/${t.number}`}
                        className="tnum font-mono font-medium text-link hover:underline"
                      >
                        {t.number}
                      </Link>
                    </td>
                    <td className={tdClass}>
                      <p className="font-medium">{t.requester.name}</p>
                      <p className="tnum text-[13px] text-ink-3">{t.requester.nimNip}</p>
                    </td>
                    <td className={`${tdClass} max-w-xs text-ink-2`}>{summary(t, models)}</td>
                    <td className={`${tdClass} tnum whitespace-nowrap text-ink-2`}>
                      {formatDate(t.pickupDate)}
                    </td>
                    <td className={`${tdClass} tnum whitespace-nowrap text-ink-2`}>
                      {formatDate(endDateIso(t))}
                    </td>
                    <td className={`${tdClass} whitespace-nowrap`}>
                      <StatusBadge status={s} />
                    </td>
                    <td className={`${tdClass} text-right`}>
                      <Link
                        href={`/admin/tiket/${t.number}`}
                        className={buttonClass(t.status === "diajukan" ? "primary" : "secondary", "sm")}
                      >
                        {t.status === "diajukan" ? "Putuskan" : "Buka"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="tnum border-t border-line px-4 py-2.5 text-[13px] text-ink-3">
          Menampilkan {rows.length} dari {all.length} tiket
        </p>
      </Box>
    </PageBody>
  );
}

export default function RequestsView() {
  return (
    <AdminOnly>
      <Requests />
    </AdminOnly>
  );
}
