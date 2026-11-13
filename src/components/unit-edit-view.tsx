"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminOnly } from "@/components/admin-only";
import { Box, PageBody, PageHeader } from "@/components/page-layout";
import { UnitForm } from "@/components/unit-form";
import { Button, EmptyState, Field, LinkButton, UnitStatusBadge, inputClass } from "@/components/ui";
import {
  lifecycleBlocker,
  setLifecycle,
  unitStatuses,
  updateUnit,
  useAppState,
} from "@/lib/store";
import type { Lifecycle } from "@/lib/types";

type Action = Lifecycle | "aktif";

const copy: Record<Action, { label: string; confirm: string; needNote: boolean; danger?: boolean }> = {
  perawatan: {
    label: "Kirim ke perawatan",
    confirm: "Unit tidak bisa dipinjam sampai selesai diservis.",
    needNote: false,
  },
  hilang: {
    label: "Tandai hilang",
    confirm: "Unit tidak dihitung sebagai stok dan hilang dari label.",
    needNote: true,
    danger: true,
  },
  pensiun: {
    label: "Pensiunkan",
    confirm:
      "Unit tidak bisa dipinjam lagi dan hilang dari label, tetapi riwayatnya tetap tersimpan.",
    needNote: true,
    danger: true,
  },
  aktif: {
    label: "Aktifkan kembali",
    confirm: "Unit kembali dihitung sebagai stok dan bisa dipinjam.",
    needNote: false,
  },
};

function Edit({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = use(params);
  const code = decodeURIComponent(tag).toUpperCase();
  const router = useRouter();
  const { tickets, units, models } = useAppState();
  const statuses = useMemo(() => unitStatuses(tickets, units), [tickets, units]);
  const [pending, setPending] = useState<Action | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const unit = units.find((u) => u.tag === code);
  if (!unit) {
    return (
      <PageBody>
        <PageHeader title="Aset tidak ditemukan" crumbs={[{ label: "Admin" }, { label: "Aset", href: "/admin/aset" }]} />
        <EmptyState
          tile="/patterns/x-red-on-white.svg"
          title="Kode tidak ada di daftar aset"
          action={<LinkButton href="/admin/aset">Ke daftar aset</LinkButton>}
        >
          Periksa kode {code}.
        </EmptyState>
      </PageBody>
    );
  }

  const model = models.find((m) => m.id === unit.modelId)!;
  const status = statuses[unit.tag];
  const blocker = lifecycleBlocker(unit.tag);

  const options: Action[] =
    unit.lifecycle === "perawatan"
      ? ["aktif", "hilang", "pensiun"]
      : unit.lifecycle === "hilang"
        ? ["aktif", "pensiun"]
        : unit.lifecycle === "pensiun"
          ? ["aktif"]
          : ["perawatan", "hilang", "pensiun"];

  function confirm() {
    if (!pending) return;
    const c = copy[pending];
    if (c.needNote && note.trim().length < 3) {
      setError("Tulis alasannya singkat, supaya tercatat di riwayat.");
      document.getElementById("alasan")?.focus();
      return;
    }
    const ok = setLifecycle(unit!.tag, pending === "aktif" ? null : pending, note);
    if (!ok) {
      setError(lifecycleBlocker(unit!.tag) ?? "Perubahan gagal.");
      return;
    }
    setPending(null);
    setNote("");
    setError("");
  }

  return (
    <PageBody>
      <PageHeader
        title={
          <span>
            Ubah <span className="tnum font-mono">{unit.tag}</span>
          </span>
        }
        description={model.name}
        crumbs={[
          { label: "Admin" },
          { label: "Aset", href: "/admin/aset" },
          { label: unit.tag, href: `/aset/${unit.tag}` },
          { label: "Ubah" },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Box title="Data aset">
          <UnitForm
            mode="ubah"
            editingTag={unit.tag}
            initial={{ serial: unit.serial, condition: unit.condition, place: unit.place }}
            submitLabel="Simpan perubahan"
            onSubmit={(v) => {
              updateUnit(unit.tag, { serial: v.serial, condition: v.condition, place: v.place });
              router.push(`/aset/${unit.tag}`);
            }}
          />
        </Box>

        <Box title="Keadaan unit">
          <div className="mb-4 flex items-center gap-3">
            <UnitStatusBadge status={status} />
          </div>

          {blocker ? (
            <p className="rounded-lg border border-yellow/60 bg-yellow-50 px-3 py-2 text-[14px]">
              {blocker}{" "}
              <Link href="/admin/permintaan?status=semua" className="text-link underline">
                Lihat tiket
              </Link>
            </p>
          ) : pending ? (
            <div className="flex flex-col gap-3">
              <p className="text-[15px] font-medium">
                {copy[pending].label} {unit.tag}?
              </p>
              <p className="text-[14px] text-ink-2">{copy[pending].confirm}</p>
              <Field
                label={copy[pending].needNote ? "Alasan" : "Catatan (boleh kosong)"}
                htmlFor="alasan"
                error={error}
              >
                <input
                  id="alasan"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  aria-invalid={Boolean(error)}
                  className={inputClass}
                />
              </Field>
              <div className="flex gap-2">
                <Button variant={copy[pending].danger ? "danger" : "primary"} size="sm" onClick={confirm}>
                  Ya, {copy[pending].label.toLowerCase()}
                </Button>
                <Button
                  variant="quiet"
                  size="sm"
                  onClick={() => {
                    setPending(null);
                    setError("");
                    setNote("");
                  }}
                >
                  Batal
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-2">
              {options.map((a) => (
                <Button
                  key={a}
                  variant={copy[a].danger ? "danger" : "secondary"}
                  size="sm"
                  onClick={() => setPending(a)}
                >
                  {copy[a].label}
                </Button>
              ))}
            </div>
          )}

          <p className="mt-5 text-[13px] text-ink-3">
            Untuk mengurangi stok, pakai Pensiunkan atau Tandai hilang agar riwayat peminjaman
            tetap utuh. Hapus permanen hanya dilakukan di Snipe-IT.
          </p>
        </Box>
      </div>
    </PageBody>
  );
}

export default function UnitEditView(props: { params: Promise<{ tag: string }> }) {
  return (
    <AdminOnly>
      <Edit {...props} />
    </AdminOnly>
  );
}
