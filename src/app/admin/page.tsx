"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AdminOnly } from "@/components/admin-only";
import {
  Box,
  PageBody,
  PageHeader,
  StatTile,
  tdClass,
  thClass,
} from "@/components/page-layout";
import { LinkButton } from "@/components/ui";
import { formatDate, formatDateTime, statusLabel } from "@/lib/format";
import {
  effectiveStatus,
  endDateIso,
  todayIso,
  unitStatuses,
  useAppState,
} from "@/lib/store";
import type { TicketStatus, UnitStatus } from "@/lib/types";

const segments: { key: UnitStatus; label: string; cls: string }[] = [
  { key: "tersedia", label: "Tersedia", cls: "bg-green" },
  { key: "dipesan", label: "Dipesan", cls: "bg-yellow" },
  { key: "dipinjam", label: "Dipinjam", cls: "bg-blue" },
  { key: "perawatan", label: "Perawatan", cls: "bg-red" },
];

function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function Dashboard() {
  const { tickets, units: allUnits, models, categories } = useAppState();
  const statuses = useMemo(() => unitStatuses(tickets, allUnits), [tickets, allUnits]);
  const units = allUnits.filter((u) => u.lifecycle !== "hilang" && u.lifecycle !== "pensiun");

  const eff = tickets.map((t) => ({ t, s: effectiveStatus(t) }));
  const n = (...list: TicketStatus[]) => eff.filter(({ s }) => list.includes(s)).length;
  const unitCount = (st: UnitStatus) =>
    units.filter((u) => statuses[u.tag] === st).length;

  const events = tickets
    .flatMap((t) => t.history.map((h) => ({ ...h, t })))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 8);

  const today = todayIso();
  const tomorrow = addDays(today, 1);
  const agenda = eff
    .flatMap(({ t, s }) => {
      const list: { date: string; text: string; href: string; late?: boolean }[] = [];
      if ((s === "disetujui" || s === "siap_diambil") && t.pickupDate <= tomorrow) {
        list.push({
          date: t.pickupDate,
          text: `Ambil: ${t.number}, ${t.requester.name}`,
          href: `/admin/tiket/${t.number}`,
        });
      }
      if (s === "dipinjam" || s === "terlambat") {
        const end = endDateIso(t);
        if (end <= tomorrow) {
          list.push({
            date: end,
            text: `${s === "terlambat" ? "Terlambat" : "Kembali"}: ${t.number}, ${t.requester.name}`,
            href: `/admin/tiket/${t.number}`,
            late: s === "terlambat",
          });
        }
      }
      return list;
    })
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);

  return (
    <PageBody>
      <PageHeader
        title="Dasbor"
        description="Ringkasan permintaan dan aset LabMGM."
        crumbs={[{ label: "Admin" }, { label: "Dasbor" }]}
        actions={<LinkButton href="/admin/permintaan" variant="secondary" size="sm">Buka permintaan</LinkButton>}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 2xl:grid-cols-6">
        <StatTile
          label="Perlu diputuskan"
          value={n("diajukan")}
          href="/admin/permintaan?status=putus"
          tone="blue"
          motif="circle"
        />
        <StatTile
          label="Siap diambil"
          value={n("disetujui", "siap_diambil")}
          href="/admin/permintaan?status=ambil"
          tone="green"
          motif="leaves"
        />
        <StatTile
          label="Sedang dipinjam"
          value={n("dipinjam")}
          href="/admin/permintaan?status=pinjam"
          tone="yellow"
          motif="arcs"
        />
        <StatTile
          label="Terlambat"
          value={n("terlambat")}
          href="/admin/permintaan?status=pinjam"
          tone="red"
          motif="x"
        />
        <StatTile
          label="Aset"
          value={units.length}
          hint={`${unitCount("tersedia")} tersedia`}
          href="/admin/aset"
          tone="blue"
          motif="square"
        />
        <StatTile
          label="Dalam perawatan"
          value={unitCount("perawatan")}
          href="/admin/aset?status=perawatan"
          tone="yellow"
          motif="plus"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <Box title="Aktivitas terbaru" flush>
            <div className="overflow-x-auto">
              <table className="w-full text-[14px]">
                <caption className="sr-only">Aktivitas terbaru pada tiket</caption>
                <thead className="border-b border-line bg-sunken/50">
                  <tr>
                    <th scope="col" className={thClass}>Waktu</th>
                    <th scope="col" className={thClass}>Tindakan</th>
                    <th scope="col" className={thClass}>Tiket</th>
                    <th scope="col" className={thClass}>Oleh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {events.map((e, i) => (
                    <tr key={`${e.t.number}-${e.at}-${i}`} className="hover:bg-sunken/60">
                      <td className={`${tdClass} tnum whitespace-nowrap text-ink-2`}>
                        {formatDateTime(e.at)}
                      </td>
                      <td className={`${tdClass} whitespace-nowrap font-medium`}>
                        {statusLabel[e.status]}
                      </td>
                      <td className={tdClass}>
                        <Link
                          href={`/admin/tiket/${e.t.number}`}
                          className="tnum font-mono whitespace-nowrap text-link hover:underline"
                        >
                          {e.t.number}
                        </Link>
                        <span className="block text-[13px] text-ink-3">{e.t.requester.name}</span>
                      </td>
                      <td className={`${tdClass} text-ink-2`}>{e.by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-line px-4 py-2.5 text-[13px]">
              <Link href="/admin/permintaan?status=semua" className="font-medium text-link hover:underline">
                Lihat semua permintaan
              </Link>
            </div>
          </Box>

          <Box title="Status aset per kategori">
            <ul className="flex flex-col gap-4">
              {categories.map((c) => {
                const list = units.filter(
                  (u) => models.find((m) => m.id === u.modelId)?.categoryId === c.id,
                );
                const total = list.length || 1;
                return (
                  <li key={c.id}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[14px]">
                      <span className="font-medium">{c.name}</span>
                      <span className="tnum text-ink-3">{list.length} aset</span>
                    </div>
                    <div
                      role="img"
                      aria-label={segments
                        .map((s) => `${list.filter((u) => statuses[u.tag] === s.key).length} ${s.label.toLowerCase()}`)
                        .join(", ")}
                      className="flex h-2.5 overflow-hidden rounded-full bg-sunken"
                    >
                      {segments.map((s) => {
                        const k = list.filter((u) => statuses[u.tag] === s.key).length;
                        return k > 0 ? (
                          <span
                            key={s.key}
                            className={s.cls}
                            style={{ width: `${(k / total) * 100}%` }}
                          />
                        ) : null;
                      })}
                    </div>
                  </li>
                );
              })}
            </ul>
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-ink-2">
              {segments.map((s) => (
                <li key={s.key} className="flex items-center gap-1.5">
                  <span aria-hidden className={`size-2.5 rounded-full ${s.cls}`} />
                  {s.label}
                </li>
              ))}
            </ul>
          </Box>
        </div>

        <Box title="Hari ini dan berikutnya" flush>
          {agenda.length === 0 ? (
            <p className="px-5 py-6 text-[14px] text-ink-2">
              Tidak ada pengambilan atau pengembalian untuk hari ini dan besok.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {agenda.map((a, i) => (
                <li key={`${a.href}-${i}`}>
                  <Link href={a.href} className="flex flex-col gap-0.5 px-5 py-3 hover:bg-sunken/60">
                    <span className="tnum text-[13px] text-ink-3">
                      {a.date === today ? "Hari ini" : a.date === tomorrow ? "Besok" : formatDate(a.date)}
                    </span>
                    <span className={`text-[14px] ${a.late ? "font-medium text-red-text" : ""}`}>
                      {a.text}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Box>
      </div>
    </PageBody>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminOnly>
      <Dashboard />
    </AdminOnly>
  );
}
