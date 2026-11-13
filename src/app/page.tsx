"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LayoutGrid, List, Rows3, Search } from "lucide-react";
import { toneTile } from "@/lib/format";
import {
  MAX_ITEMS_PER_REQUEST,
  addToCart,
  availableQty,
  cartCount,
  modelTotal,
  setCartQty,
  setCatalogView,
  useAppState,
  useReady,
} from "@/lib/store";
import { Button, EmptyState, PatternTile, Stepper, inputClass } from "@/components/ui";
import { Box, PageBody, PageHeader, tdClass, thClass } from "@/components/page-layout";
import type { AssetModel } from "@/lib/types";
import type { CatalogView } from "@/lib/store";

function Row({ model }: { model: AssetModel }) {
  const { cart, tickets, categories } = useAppState();
  const category = categories.find((c) => c.id === model.categoryId)!;
  const available = availableQty(tickets, model.id);
  const inCart = cart.find((l) => l.modelId === model.id)?.qty ?? 0;
  const others = cartCount(cart) - inCart;
  const max = Math.min(available, MAX_ITEMS_PER_REQUEST - others);
  const full = cartCount(cart) >= MAX_ITEMS_PER_REQUEST && inCart === 0;

  return (
    <tr className="hover:bg-sunken/60">
      <td className={tdClass}>
        <div className="flex items-center gap-3">
          <PatternTile src={toneTile[category.tone]} size={36} />
          <div className="min-w-0">
            <p className="font-medium">{model.name}</p>
            <p className="max-w-md text-[13px] text-ink-3">{model.description}</p>
          </div>
        </div>
      </td>
      <td className={`${tdClass} whitespace-nowrap text-ink-2`}>{category.name}</td>
      <td className={`${tdClass} whitespace-nowrap`}>
        <span
          className={`tnum font-medium ${available === 0 ? "text-red-text" : "text-ink"}`}
        >
          {available === 0 ? "Habis" : `${available} dari ${modelTotal(model.id)}`}
        </span>
      </td>
      <td className={`${tdClass} text-right`}>
        {inCart > 0 ? (
          <Stepper
            label={model.name}
            value={inCart}
            max={max}
            onChange={(n) => setCartQty(model.id, n)}
          />
        ) : (
          <Button
            size="sm"
            variant="secondary"
            disabled={available === 0 || full}
            onClick={() => addToCart(model.id)}
            title={full ? `Satu permintaan paling banyak ${MAX_ITEMS_PER_REQUEST} barang` : undefined}
          >
            {available === 0 ? "Habis" : "Tambah"}
          </Button>
        )}
      </td>
    </tr>
  );
}

function useLine(model: AssetModel) {
  const { cart, tickets } = useAppState();
  const available = availableQty(tickets, model.id);
  const inCart = cart.find((l) => l.modelId === model.id)?.qty ?? 0;
  const others = cartCount(cart) - inCart;
  const max = Math.min(available, MAX_ITEMS_PER_REQUEST - others);
  const full = cartCount(cart) >= MAX_ITEMS_PER_REQUEST && inCart === 0;
  return { available, inCart, max, full };
}

function Action({ model, compact }: { model: AssetModel; compact?: boolean }) {
  const { available, inCart, max, full } = useLine(model);
  return inCart > 0 ? (
    <Stepper label={model.name} value={inCart} max={max} onChange={(n) => setCartQty(model.id, n)} />
  ) : (
    <Button
      size="sm"
      variant="secondary"
      className={compact ? undefined : "w-full"}
      disabled={available === 0 || full}
      onClick={() => addToCart(model.id)}
      title={full ? `Satu permintaan paling banyak ${MAX_ITEMS_PER_REQUEST} barang` : undefined}
    >
      {available === 0 ? "Habis" : "Tambah"}
    </Button>
  );
}

/** Tampilan ikon: kartu besar seperti ikon besar di pengelola berkas. */
function IconCard({ model }: { model: AssetModel }) {
  const { categories } = useAppState();
  const category = categories.find((c) => c.id === model.categoryId)!;
  const { available } = useLine(model);
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 hover:border-line-strong">
      <PatternTile src={toneTile[category.tone]} size={72} />
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-snug">{model.name}</p>
        <p className="text-[13px] text-ink-3">{category.name}</p>
      </div>
      <p className={`tnum text-[13px] font-medium ${available === 0 ? "text-red-text" : "text-ink-2"}`}>
        {available === 0 ? "Habis" : `${available} dari ${modelTotal(model.id)} tersedia`}
      </p>
      <Action model={model} />
    </li>
  );
}

/** Tampilan daftar: satu baris ringkas per barang. */
function ListRow({ model }: { model: AssetModel }) {
  const { categories } = useAppState();
  const category = categories.find((c) => c.id === model.categoryId)!;
  const { available } = useLine(model);
  return (
    <li className="flex items-center gap-3 px-4 py-2.5 hover:bg-sunken/60">
      <PatternTile src={toneTile[category.tone]} size={28} />
      <p className="min-w-0 flex-1 truncate text-[14px] font-medium">{model.name}</p>
      <p className={`tnum hidden w-28 text-[13px] sm:block ${available === 0 ? "text-red-text" : "text-ink-2"}`}>
        {available === 0 ? "Habis" : `${available} tersedia`}
      </p>
      <Action model={model} compact />
    </li>
  );
}

const VIEWS: { id: CatalogView; label: string; icon: typeof List }[] = [
  { id: "ikon", label: "Ikon", icon: LayoutGrid },
  { id: "daftar", label: "Daftar", icon: List },
  { id: "rincian", label: "Rincian", icon: Rows3 },
];

function ViewSwitch({ value }: { value: CatalogView }) {
  return (
    <div role="group" aria-label="Tampilan barang" className="inline-flex rounded-lg border border-line-strong p-0.5 sm:ml-auto">
      {VIEWS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          aria-pressed={value === id}
          onClick={() => setCatalogView(id)}
          className={`inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium ${
            value === id ? "bg-blue-50 text-link" : "text-ink-2 hover:bg-sunken"
          }`}
        >
          <Icon size={15} strokeWidth={2.25} aria-hidden />
          {label}
        </button>
      ))}
    </div>
  );
}

export default function KatalogPage() {
  const ready = useReady();
  const { cart, tickets, view, models, categories } = useAppState();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("semua");
  const [onlyAvail, setOnlyAvail] = useState(false);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return models.filter((m) => {
      if (cat !== "semua" && m.categoryId !== cat) return false;
      if (onlyAvail && availableQty(tickets, m.id) === 0) return false;
      if (!needle) return true;
      return (
        m.name.toLowerCase().includes(needle) ||
        m.description.toLowerCase().includes(needle)
      );
    });
  }, [q, cat, onlyAvail, tickets, models]);

  const count = ready ? cartCount(cart) : 0;

  return (
    <PageBody>
      <PageHeader
        title="Katalog"
        description="Pilih barang yang ingin dipinjam, lalu ajukan lewat keranjang. Admin memutuskan setiap permintaan."
        crumbs={[{ label: "Peminjaman" }, { label: "Katalog" }]}
      />

      <p className="mb-4 max-w-3xl rounded-xl border border-yellow/60 bg-yellow-50 px-4 py-2.5 text-sm">
        Data contoh: daftar dan jumlah barang mengikuti klaim lab dan belum diaudit. Jumlah asli
        diisi setelah audit fisik.
      </p>

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
              placeholder="Cari barang"
              aria-label="Cari barang"
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
          <label className="inline-flex items-center gap-2.5 text-sm text-ink-2">
            <input
              type="checkbox"
              checked={onlyAvail}
              onChange={(e) => setOnlyAvail(e.target.checked)}
              className="size-[18px] accent-blue"
            />
            Hanya yang tersedia
          </label>
          <ViewSwitch value={view} />
        </div>

        {shown.length === 0 ? (
          <div className="p-5">
            <EmptyState
              tile="/patterns/x-red-on-white.svg"
              title="Tidak ada barang yang cocok"
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQ("");
                    setCat("semua");
                    setOnlyAvail(false);
                  }}
                >
                  Hapus saringan
                </Button>
              }
            >
              Ubah kata kunci atau hapus saringan untuk melihat semua barang.
            </EmptyState>
          </div>
        ) : view === "ikon" ? (
          <ul className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {shown.map((m) => (
              <IconCard key={m.id} model={m} />
            ))}
          </ul>
        ) : view === "daftar" ? (
          <ul className="divide-y divide-line">
            {shown.map((m) => (
              <ListRow key={m.id} model={m} />
            ))}
          </ul>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[14px]">
              <caption className="sr-only">Barang yang bisa dipinjam</caption>
              <thead className="border-b border-line bg-sunken/50">
                <tr>
                  <th scope="col" className={thClass}>Barang</th>
                  <th scope="col" className={thClass}>Kategori</th>
                  <th scope="col" className={thClass}>Tersedia</th>
                  <th scope="col" className={`${thClass} text-right`}>Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {shown.map((m) => (
                  <Row key={m.id} model={m} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="tnum border-t border-line px-4 py-2.5 text-[13px] text-ink-3">
          Menampilkan {shown.length} dari {models.length} barang
        </p>
      </Box>

      {count > 0 ? (
        <div className="sticky bottom-16 z-10 mt-6 flex max-w-xl items-center justify-between gap-4 rounded-xl border border-line-strong bg-surface px-5 py-3 shadow-lift sm:bottom-4">
          <p className="tnum text-[15px]">
            <span className="font-semibold">{count}</span> barang di keranjang
          </p>
          <Link
            href="/keranjang"
            className="inline-flex h-10 items-center rounded-full bg-ink px-5 text-[15px] font-medium text-page hover:bg-blue hover:text-white"
          >
            Lanjut mengajukan
          </Link>
        </div>
      ) : null}
    </PageBody>
  );
}
