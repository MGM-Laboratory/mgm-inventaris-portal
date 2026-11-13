"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, QrCode, Search } from "lucide-react";
import { AdminOnly } from "@/components/admin-only";
import {
  Box,
  PageBody,
  PageHeader,
  tdClass,
  thClass,
} from "@/components/page-layout";
import {
  EmptyState,
  UnitStatusBadge,
  buttonClass,
  inputClass,
} from "@/components/ui";
import { unitStatuses, useAppState } from "@/lib/store";
import type { UnitStatus } from "@/lib/types";

const statusOptions: { id: UnitStatus; label: string }[] = [
  { id: "tersedia", label: "Tersedia" },
  { id: "dipesan", label: "Dipesan" },
  { id: "dipinjam", label: "Sedang dipinjam" },
  { id: "perawatan", label: "Dalam perawatan" },
  { id: "hilang", label: "Hilang" },
  { id: "pensiun", label: "Pensiun" },
];

function Assets() {
  const params = useSearchParams();
  const { tickets, units, models, categories } = useAppState();
  const statuses = useMemo(
    () => unitStatuses(tickets, units),
    [tickets, units],
  );
  const fromUrl = params.get("status");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("semua");
  const [st, setSt] = useState(
    statusOptions.some((s) => s.id === fromUrl) ? (fromUrl as string) : "semua",
  );
  const [picked, setPicked] = useState<string[]>([]);

  const needle = q.trim().toLowerCase();
  const rows = units
    .map((u) => {
      const model = models.find((m) => m.id === u.modelId)!;
      return {
        u,
        model,
        category: categories.find((c) => c.id === model.categoryId)!,
        status: statuses[u.tag],
      };
    })
    .filter(({ category }) => cat === "semua" || category.id === cat)
    .filter(({ status }) => st === "semua" || status === st)
    .filter(
      ({ u, model }) =>
        !needle ||
        u.tag.toLowerCase().includes(needle) ||
        model.name.toLowerCase().includes(needle) ||
        u.serial.toLowerCase().includes(needle),
    )
    .sort((a, b) => a.u.tag.localeCompare(b.u.tag));

  const shownTags = rows.map((r) => r.u.tag);
  const allPicked =
    shownTags.length > 0 && shownTags.every((t) => picked.includes(t));
  const toggle = (tag: string) =>
    setPicked((p) =>
      p.includes(tag) ? p.filter((x) => x !== tag) : [...p, tag],
    );

  return (
    <PageBody>
      <PageHeader
        title="Aset"
        description="Semua unit fisik yang punya label QR."
        crumbs={[{ label: "Admin" }, { label: "Aset" }]}
        actions={
          <>
            <Link
              href="/admin/aset/baru"
              className={buttonClass("primary", "sm")}
            >
              <Plus size={16} strokeWidth={2.25} aria-hidden />
              Tambah aset
            </Link>
            {picked.length > 0 ? (
              <Link
                href={`/admin/label?tag=${encodeURIComponent(picked.join(","))}`}
                className={buttonClass("primary", "sm")}
              >
                <QrCode size={16} strokeWidth={2.25} aria-hidden />
                Cetak {picked.length} label
              </Link>
            ) : (
              <Link
                href="/admin/label"
                className={buttonClass("secondary", "sm")}
              >
                <QrCode size={16} strokeWidth={2.25} aria-hidden />
                Semua label
              </Link>
            )}
          </>
        }
      />

      <Box flush>
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative sm:w-72">
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
              placeholder="Cari kode, barang, atau nomor seri"
              aria-label="Cari aset"
              className={`${inputClass} h-10 pl-10`}
            />
          </div>
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            aria-label="Kategori"
            className={`${inputClass} h-10 sm:w-48`}
          >
            <option value="semua">Semua kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={st}
            onChange={(e) => setSt(e.target.value)}
            aria-label="Status"
            className={`${inputClass} h-10 sm:w-48`}
          >
            <option value="semua">Semua status</option>
            {statusOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              tile="/patterns/x-red-on-white.svg"
              title="Tidak ada aset yang cocok"
            >
              Ubah kata kunci atau saringan untuk melihat aset lain.
            </EmptyState>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[14px]">
              <caption className="sr-only">Daftar unit aset</caption>
              <thead className="border-b border-line bg-sunken/50">
                <tr>
                  <th scope="col" className={`${thClass} w-10`}>
                    <input
                      type="checkbox"
                      checked={allPicked}
                      onChange={() =>
                        setPicked((p) =>
                          allPicked
                            ? p.filter((t) => !shownTags.includes(t))
                            : [...new Set([...p, ...shownTags])],
                        )
                      }
                      aria-label="Pilih semua aset yang tampil"
                      className="size-4 accent-blue"
                    />
                  </th>
                  <th scope="col" className={thClass}>
                    Kode
                  </th>
                  <th scope="col" className={thClass}>
                    Barang
                  </th>
                  <th scope="col" className={thClass}>
                    Kategori
                  </th>
                  <th scope="col" className={thClass}>
                    Status
                  </th>
                  <th scope="col" className={thClass}>
                    Tempat
                  </th>
                  <th scope="col" className={thClass}>
                    Kondisi
                  </th>
                  <th scope="col" className={`${thClass} text-right`}>
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map(({ u, model, category, status }) => (
                  <tr key={u.tag} className="hover:bg-sunken/60">
                    <td className={tdClass}>
                      <input
                        type="checkbox"
                        checked={picked.includes(u.tag)}
                        onChange={() => toggle(u.tag)}
                        aria-label={`Pilih ${u.tag}`}
                        className="size-4 accent-blue"
                      />
                    </td>
                    <td className={`${tdClass} whitespace-nowrap`}>
                      <Link
                        href={`/aset/${u.tag}`}
                        className="tnum font-mono font-medium text-link hover:underline"
                      >
                        {u.tag}
                      </Link>
                    </td>
                    <td className={tdClass}>{model.name}</td>
                    <td className={`${tdClass} whitespace-nowrap text-ink-2`}>
                      {category.name}
                    </td>
                    <td className={`${tdClass} whitespace-nowrap`}>
                      <UnitStatusBadge status={status} />
                    </td>
                    <td className={`${tdClass} whitespace-nowrap text-ink-2`}>
                      {u.place}
                    </td>
                    <td className={`${tdClass} text-ink-2`}>{u.condition}</td>
                    <td className={`${tdClass} whitespace-nowrap text-right`}>
                      <Link
                        href={`/aset/${u.tag}`}
                        className={buttonClass("quiet", "sm")}
                      >
                        Lihat
                      </Link>
                      <Link
                        href={`/admin/aset/${u.tag}/ubah`}
                        className={`${buttonClass("secondary", "sm")} ml-1`}
                      >
                        Ubah
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="tnum border-t border-line px-4 py-2.5 text-[13px] text-ink-3">
          Menampilkan {rows.length} dari {units.length} aset
          {picked.length > 0 ? `, ${picked.length} dipilih` : ""}
        </p>
      </Box>
    </PageBody>
  );
}

export default function AssetsView() {
  return (
    <AdminOnly>
      <Assets />
    </AdminOnly>
  );
}
