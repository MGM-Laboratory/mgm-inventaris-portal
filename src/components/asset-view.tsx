"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Button,
  EmptyState,
  LinkButton,
  PatternTile,
  StatusBadge,
  UnitStatusBadge,
  buttonClass,
} from "@/components/ui";
import {
  Box,
  PageBody,
  PageHeader,
  tdClass,
  thClass,
} from "@/components/page-layout";
import { QrCode } from "@/components/qr-code";
import {
  addToCart,
  effectiveStatus,
  unitStatuses,
  useAppState,
  useReady,
} from "@/lib/store";
import { formatDateTime, toneTile } from "@/lib/format";

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-3 border-b border-line py-3 text-[14px] last:border-0">
      <dt className="text-ink-3">{label}</dt>
      <dd className="min-w-0 font-medium">{children}</dd>
    </div>
  );
}

function AssetViewInner({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = use(params);
  const code = decodeURIComponent(tag).toUpperCase();
  const router = useRouter();
  const ready = useReady();
  const { tickets, session, units, log, models, categories } = useAppState();
  const statuses = useMemo(
    () => unitStatuses(tickets, units),
    [tickets, units],
  );

  if (!ready) return <p className="text-ink-3">Memuat…</p>;

  const unit = units.find((u) => u.tag === code);
  if (!unit) {
    return (
      <>
        <PageHeader
          title="Aset tidak ditemukan"
          crumbs={[{ label: "Aset" }, { label: code }]}
        />
        <EmptyState
          tile="/patterns/x-red-on-white.svg"
          title="Label ini tidak dikenali"
          action={<LinkButton href="/">Lihat katalog</LinkButton>}
        >
          Kode {code} tidak ada di daftar aset LabMGM. Periksa labelnya atau
          pindai ulang.
        </EmptyState>
      </>
    );
  }

  const model = models.find((m) => m.id === unit.modelId)!;
  const category = categories.find((c) => c.id === model.categoryId)!;
  const status = statuses[unit.tag];
  const isAdmin = session.role === "admin";
  const related = tickets.filter(
    (t) =>
      ["disetujui", "siap_diambil", "dipinjam", "terlambat"].includes(
        t.status,
      ) && t.items.some((it) => it.modelId === model.id),
  );
  const history = log.filter((h) => h.tag === unit.tag);
  const borrow = () => {
    addToCart(model.id);
    router.push("/keranjang");
  };

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <PatternTile src={toneTile[category.tone]} size={40} />
            <span>{model.name}</span>
          </span>
        }
        description={model.description}
        crumbs={[
          {
            label: isAdmin ? "Aset" : "Katalog",
            href: isAdmin ? "/admin/aset" : "/",
          },
          { label: unit.tag },
        ]}
        actions={
          <>
            {isAdmin ? (
              <Link
                href={`/admin/aset/${unit.tag}/ubah`}
                className={buttonClass("secondary")}
              >
                Ubah aset
              </Link>
            ) : null}
            {status === "tersedia" ? (
              <Button onClick={borrow}>Pinjam {model.name}</Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-6">
          <Box title="Detail">
            <dl>
              <Row label="Kode aset">
                <span className="tnum font-mono text-[16px]">{unit.tag}</span>
              </Row>
              <Row label="Status">
                <UnitStatusBadge status={status} />
              </Row>
              <Row label="Model">{model.name}</Row>
              <Row label="Kategori">{category.name}</Row>
              <Row label="Milik">MGM Laboratory</Row>
              <Row label="Disimpan di">
                Gedung F, FILKOM Universitas Brawijaya
              </Row>
            </dl>
          </Box>

          {isAdmin ? (
            <Box title="Khusus Admin">
              <dl>
                <Row label="Nomor seri">
                  <span className="tnum font-mono">{unit.serial}</span>
                </Row>
                <Row label="Kondisi">{unit.condition}</Row>
                <Row label="Tempat di lab">{unit.place}</Row>
              </dl>
              <h3 className="mt-5 mb-2 text-[14px] font-semibold">
                Tiket yang memegang model ini
              </h3>
              {related.length === 0 ? (
                <p className="text-[14px] text-ink-2">Tidak ada.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-line">
                  <table className="w-full text-[14px]">
                    <thead className="border-b border-line bg-sunken/50">
                      <tr>
                        <th scope="col" className={thClass}>
                          Tiket
                        </th>
                        <th scope="col" className={thClass}>
                          Peminjam
                        </th>
                        <th scope="col" className={thClass}>
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {related.map((t) => (
                        <tr key={t.number}>
                          <td className={tdClass}>
                            <Link
                              href={`/admin/tiket/${t.number}`}
                              className="tnum font-mono text-link hover:underline"
                            >
                              {t.number}
                            </Link>
                          </td>
                          <td className={tdClass}>{t.requester.name}</td>
                          <td className={tdClass}>
                            <StatusBadge status={effectiveStatus(t)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="mt-3 text-[13px] text-ink-3">
                Mode contoh: unit yang dipinjam diturunkan dari jumlah di tiket.
                Di sistem nyata, Snipe-IT mencatat unit mana yang diserahkan.
              </p>
            </Box>
          ) : null}

          {isAdmin ? (
            <Box title="Riwayat aset" flush>
              {history.length === 0 ? (
                <p className="px-5 py-4 text-[14px] text-ink-2">
                  Belum ada perubahan tercatat untuk unit ini.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {history.map((h, i) => (
                    <li key={`${h.at}-${i}`} className="px-5 py-3 text-[14px]">
                      <p className="font-medium">{h.action}</p>
                      <p className="tnum text-[13px] text-ink-3">
                        {formatDateTime(h.at)}, oleh {h.by}
                      </p>
                      {h.note ? (
                        <p className="mt-0.5 text-ink-2">{h.note}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </Box>
          ) : null}
        </div>

        <div className="flex flex-col gap-6">
          <Box title="Kode QR">
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-lg border border-line bg-white p-2">
                <QrCode
                  value={`${window.location.origin}/aset/${unit.tag}`}
                  size={176}
                  label={`Kode QR untuk ${unit.tag}`}
                />
              </div>
              <p className="text-center text-[13px] text-ink-3">
                Pindai untuk membuka halaman ini.
              </p>
              {isAdmin ? (
                <Link
                  href={`/admin/label?tag=${unit.tag}`}
                  className={buttonClass("secondary", "sm")}
                >
                  Cetak label
                </Link>
              ) : null}
            </div>
          </Box>

          <Box title="Peminjaman">
            {status === "tersedia" ? (
              <div className="flex flex-col items-start gap-3">
                <p className="text-[14px] text-ink-2">
                  Anda meminjam model ini. Unit yang diserahkan ditentukan Admin
                  saat serah terima.
                </p>
                <Button onClick={borrow}>Pinjam {model.name}</Button>
              </div>
            ) : (
              <div className="flex flex-col items-start gap-3">
                <p className="text-[14px] text-ink-2">
                  {status === "perawatan"
                    ? "Unit ini sedang diservis dan belum bisa dipinjam."
                    : status === "hilang" || status === "pensiun"
                      ? "Unit ini sudah tidak tersedia untuk dipinjam."
                      : status === "dipinjam"
                        ? "Unit ini sedang dipinjam."
                        : "Unit ini sudah dipesan untuk peminjaman yang disetujui."}{" "}
                  Cek unit {model.name} lain yang tersedia.
                </p>
                <LinkButton href="/" variant="secondary">
                  Lihat katalog
                </LinkButton>
              </div>
            )}
          </Box>
        </div>
      </div>
    </>
  );
}

export default function AssetView(props: { params: Promise<{ tag: string }> }) {
  return (
    <PageBody>
      <AssetViewInner {...props} />
    </PageBody>
  );
}
