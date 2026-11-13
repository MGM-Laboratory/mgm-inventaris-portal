"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminOnly } from "@/components/admin-only";
import { Box, PageBody, PageHeader } from "@/components/page-layout";
import { UnitForm } from "@/components/unit-form";
import { buttonClass } from "@/components/ui";
import { NEW } from "@/components/unit-form";
import { addModel, addUnits } from "@/lib/store";

export default function TambahAsetPage() {
  const [created, setCreated] = useState<string[] | null>(null);

  return (
    <AdminOnly>
      <PageBody>
        <PageHeader
          title="Tambah aset"
          description="Ketik barang dan kategorinya sendiri, atau tambah unit untuk barang yang sudah ada. Kode QR dibuat otomatis."
          crumbs={[{ label: "Admin" }, { label: "Aset", href: "/admin/aset" }, { label: "Tambah" }]}
        />

        {created ? (
          <Box title={`${created.length} aset ditambahkan`}>
            <ul className="mb-5 flex flex-wrap gap-2">
              {created.map((t) => (
                <li key={t}>
                  <Link
                    href={`/aset/${t}`}
                    className="tnum rounded-lg border border-line-strong bg-sunken px-3 py-1 font-mono text-[14px] text-link hover:underline"
                  >
                    {t}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/admin/label?tag=${encodeURIComponent(created.join(","))}`}
                className={buttonClass("primary")}
              >
                Cetak label
              </Link>
              <button type="button" onClick={() => setCreated(null)} className={buttonClass("secondary")}>
                Tambah lagi
              </button>
              <Link href="/admin/aset" className={buttonClass("quiet")}>
                Ke daftar aset
              </Link>
            </div>
          </Box>
        ) : (
          <Box title="Data aset" className="max-w-3xl">
            <UnitForm
              mode="tambah"
              submitLabel="Tambah aset"
              onSubmit={(v) => {
                const modelId =
                  v.modelId === NEW
                    ? addModel({
                        name: v.newName,
                        categoryId: v.categoryId,
                        newCategory: v.newCategory,
                      })
                    : v.modelId;
                setCreated(
                  addUnits(modelId, v.count, {
                    serial: v.serial,
                    condition: v.condition,
                    place: v.place,
                  }),
                );
              }}
            />
            <p className="mt-5 text-[13px] text-ink-3">
              Impor massal dari CSV dan hapus permanen dilakukan di Snipe-IT.
            </p>
          </Box>
        )}
      </PageBody>
    </AdminOnly>
  );
}
