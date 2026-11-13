"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Printer } from "lucide-react";
import { QrCode } from "@/components/qr-code";
import { Button, Field, inputClass } from "@/components/ui";
import { useAppState } from "@/lib/store";
import type { AssetUnit, Tone } from "@/lib/types";
import { AdminOnly } from "@/components/admin-only";
import { PageBody, PageHeader } from "@/components/page-layout";

const sizes = {
  kecil: { label: "Kecil, 40 × 20 mm", w: 40, h: 20, name: 5, tag: 6.5, hint: 4.5, logo: 5 },
  sedang: { label: "Sedang, 60 × 30 mm", w: 60, h: 30, name: 7.5, tag: 10, hint: 5.5, logo: 7 },
  besar: { label: "Besar, 80 × 40 mm", w: 80, h: 40, name: 10, tag: 13, hint: 7, logo: 9 },
} as const;
type SizeKey = keyof typeof sizes;

const toneColor: Record<Tone, string> = {
  blue: "#3a6dc5",
  yellow: "#f7bf33",
  red: "#f94141",
  green: "#0f8657",
};

function LabelCard({
  unit,
  size,
  origin,
}: {
  unit: AssetUnit;
  size: SizeKey;
  origin: string;
}) {
  const s = sizes[size];
  const { models, categories } = useAppState();
  const model = models.find((m) => m.id === unit.modelId)!;
  const category = categories.find((c) => c.id === model.categoryId)!;
  const pad = 1.6;
  const qr = s.h - pad * 2;
  return (
    <div
      className="label-card relative flex shrink-0 items-center overflow-hidden rounded-[1mm] border border-[#b9bcc4] bg-white text-[#0e1116]"
      style={{ width: `${s.w}mm`, height: `${s.h}mm`, padding: `${pad}mm`, gap: `${pad}mm` }}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0"
        style={{ width: "1.4mm", background: toneColor[category.tone] }}
      />
      <div style={{ marginLeft: "1mm", width: `${qr}mm`, height: `${qr}mm` }} className="shrink-0">
        <QrCode
          value={`${origin}/aset/${unit.tag}`}
          size="100%"
          label={`Kode QR untuk ${unit.tag}`}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between self-stretch">
        <div className="flex items-center gap-[1mm]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" style={{ width: `${s.logo}mm`, height: `${s.logo}mm` }} />
          <span
            className="font-display font-semibold leading-none"
            style={{ fontSize: `${s.name}pt` }}
          >
            LabMGM
          </span>
        </div>
        <div className="min-w-0">
          <p className="truncate leading-tight" style={{ fontSize: `${s.name}pt` }}>
            {model.name}
          </p>
          <p
            className="font-mono font-bold leading-tight tracking-tight"
            style={{ fontSize: `${s.tag}pt` }}
          >
            {unit.tag}
          </p>
        </div>
        <p className="leading-none text-[#3b4150]" style={{ fontSize: `${s.hint}pt` }}>
          Pindai untuk info aset
        </p>
      </div>
    </div>
  );
}

function Labels() {
  const params = useSearchParams();
  const { units: allUnits, models } = useAppState();
  const units = allUnits.filter((u) => u.lifecycle !== "hilang" && u.lifecycle !== "pensiun");
  const [size, setSize] = useState<SizeKey>("sedang");
  const [modelId, setModelId] = useState("semua");

  const picked = (params.get("tag") ?? "")
    .split(",")
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean);
  const list = units
    .filter((u) => (picked.length > 0 ? picked.includes(u.tag) : true))
    .filter((u) => modelId === "semua" || u.modelId === modelId)
    .sort((a, b) => a.tag.localeCompare(b.tag));
  const origin = window.location.origin;

  return (
    <PageBody>
      <PageHeader
        title="Label QR"
        description="Cetak label berkode QR untuk ditempel di barang. Pemindaian membuka halaman info aset, dan Admin yang masuk melihat data tambahan."
        crumbs={[{ label: "Admin" }, { label: "Label QR" }]}
        actions={
          <Button onClick={() => window.print()}>
            <Printer size={18} strokeWidth={2.25} />
            Cetak {list.length} label
          </Button>
        }
      />

      <div className="no-print mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Ukuran label" htmlFor="ukuran">
            <select
              id="ukuran"
              value={size}
              onChange={(e) => setSize(e.target.value as SizeKey)}
              className={`${inputClass} min-w-52`}
            >
              {Object.entries(sizes).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Barang" htmlFor="barang">
            <select
              id="barang"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              className={`${inputClass} min-w-52`}
            >
              <option value="semua">Semua barang</option>
              {models
                .filter((m) => units.some((u) => u.modelId === m.id))
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </select>
          </Field>
        </div>
        {picked.length > 0 ? (
          <p className="text-sm text-ink-2">
            Menampilkan {picked.length} aset yang Anda pilih.{" "}
            <Link href="/admin/label" className="text-link underline underline-offset-2">
              Tampilkan semua
            </Link>
          </p>
        ) : null}
        <p className="max-w-prose text-sm text-ink-3">
          Saat mencetak, pilih skala 100% dan matikan header dan footer browser agar ukuran label
          sesuai. Alamat di kode QR memakai alamat halaman ini; ganti ke domain asli sebelum
          label dicetak untuk dipakai.
        </p>
      </div>

      <ul className="label-sheet flex flex-wrap gap-3">
        {list.map((u) => (
          <li key={u.tag}>
            <LabelCard unit={u} size={size} origin={origin} />
          </li>
        ))}
      </ul>
    </PageBody>
  );
}

export default function LabelPage() {
  return (
    <AdminOnly>
      <Suspense fallback={<p className="px-8 py-6 text-ink-3">Memuat…</p>}>
        <Labels />
      </Suspense>
    </AdminOnly>
  );
}
