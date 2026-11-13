"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { toneTile } from "@/lib/format";
import {
  MAX_ITEMS_PER_REQUEST,
  availableQty,
  EMAIL_VERIFICATION,
  cartCount,
  setCartQty,
  submitRequest,
  todayIso,
  useAppState,
  useReady,
} from "@/lib/store";
import {
  Button,
  EmptyState,
  Field,
  LinkButton,
  PatternTile,
  Stepper,
  inputClass,
} from "@/components/ui";
import { PageBody, PageHeader } from "@/components/page-layout";

type Errors = Partial<Record<"purpose" | "pickupDate" | "durationDays", string>>;

export default function KeranjangPage() {
  const router = useRouter();
  const ready = useReady();
  const { cart, tickets, session, models, categories } = useAppState();
  const [purpose, setPurpose] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [durationDays, setDurationDays] = useState("3");
  const [errors, setErrors] = useState<Errors>({});

  if (!ready)
    return (
      <PageBody>
        <p className="text-ink-3">Memuat keranjang…</p>
      </PageBody>
    );

  const isMember = session.role === "member";
  const isAdmin = session.role === "admin";
  const count = cartCount(cart);

  if (count === 0) {
    return (
      <PageBody>
        <PageHeader
          title="Keranjang"
          description="Barang yang Anda pilih dari katalog muncul di sini."
          crumbs={[{ label: "Keranjang" }]}
        />
        <EmptyState
          tile="/patterns/circle-blue-on-white.svg"
          title="Keranjang masih kosong"
          action={<LinkButton href="/">Lihat katalog</LinkButton>}
        >
          Tambahkan barang dari katalog, lalu kembali ke sini untuk mengajukan
          peminjaman.
        </EmptyState>
      </PageBody>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Errors = {};
    if (purpose.trim().length < 5)
      next.purpose = "Tulis tujuan peminjaman dalam satu kalimat.";
    if (!pickupDate || pickupDate < todayIso())
      next.pickupDate = "Pilih tanggal ambil hari ini atau setelahnya.";
    const days = Number(durationDays);
    if (!Number.isInteger(days) || days < 1 || days > 30)
      next.durationDays = "Isi lama pinjam 1 sampai 30 hari.";
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) {
      document.getElementById(first)?.focus();
      return;
    }
    const number = submitRequest({
      requester: {
        kind: isMember ? "member" : "guest",
        name: session.name ?? "",
        nimNip: session.nimNip,
        email: session.email ?? "",
      },
      purpose: purpose.trim(),
      pickupDate,
      durationDays: days,
    });
    router.push(`/tiket/${number}`);
  }

  return (
    <PageBody>
      <PageHeader
        title="Ajukan peminjaman"
        description={`Periksa barangnya, lalu isi data di sebelah. Paling banyak ${MAX_ITEMS_PER_REQUEST} barang per permintaan.`}
        crumbs={[{ label: "Pengajuan" }]}
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,26rem)]">
        <section aria-label="Barang di keranjang">
          <ul className="flex flex-col gap-3">
            {cart.map((line) => {
              const m = models.find((x) => x.id === line.modelId)!;
              const c = categories.find((x) => x.id === m.categoryId)!;
              const avail = availableQty(tickets, m.id);
              const others = count - line.qty;
              return (
                <li
                  key={line.modelId}
                  className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 shadow-soft"
                >
                  <PatternTile src={toneTile[c.tone]} size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-semibold">{m.name}</p>
                    <p className="text-sm text-ink-3">
                      {c.name}, {avail} tersedia
                    </p>
                  </div>
                  <Stepper
                    label={m.name}
                    value={line.qty}
                    min={1}
                    max={Math.min(avail, MAX_ITEMS_PER_REQUEST - others)}
                    onChange={(n) => setCartQty(m.id, n)}
                  />
                  <button
                    type="button"
                    aria-label={`Hapus ${m.name} dari keranjang`}
                    onClick={() => setCartQty(m.id, 0)}
                    className="grid size-10 place-items-center rounded-full text-ink-3 hover:bg-red-50 hover:text-red-text"
                  >
                    <Trash2 size={18} strokeWidth={2.25} />
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-sm text-ink-3">
            Barang belum dipesan sampai Admin menyetujui. Jumlah tersedia bisa
            berubah sebelum itu.{" "}
            <Link href="/" className="text-link underline underline-offset-2">
              Tambah barang lain
            </Link>
          </p>
        </section>

        <form
          onSubmit={submit}
          noValidate
          className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6 shadow-soft"
          aria-label="Data peminjaman"
        >
          {isAdmin ? (
            <p className="rounded-xl border border-yellow/60 bg-yellow-50 px-4 py-3 text-sm">
              Anda melihat sebagai Admin. Ganti ke Guest atau Member di bar
              bawah untuk mencoba pengajuan.
            </p>
          ) : null}

          {!isAdmin ? (
            <p className="rounded-xl bg-blue-50 px-4 py-3 text-[15px]">
              Masuk sebagai <span className="font-semibold">{session.name}</span>
              {isMember ? (
                ". Data diri diambil dari akun MGM."
              ) : (
                <>
                  , <span className="tnum">{session.nimNip}</span>, {session.email}.{" "}
                  {EMAIL_VERIFICATION
                    ? "Kode verifikasi dikirim ke email ini setelah Anda mengajukan."
                    : "Admin menghubungi email ini bila permintaan perlu dibahas."}
                </>
              )}
            </p>
          ) : null}

          <Field
            label="Tujuan peminjaman"
            htmlFor="purpose"
            error={errors.purpose}
          >
            <input
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Misalnya uji kegunaan prototipe tugas akhir"
              aria-invalid={Boolean(errors.purpose)}
              aria-describedby={errors.purpose ? "purpose-error" : undefined}
              className={inputClass}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Tanggal ambil"
              htmlFor="pickupDate"
              error={errors.pickupDate}
            >
              <input
                id="pickupDate"
                type="date"
                min={todayIso()}
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                aria-invalid={Boolean(errors.pickupDate)}
                aria-describedby={
                  errors.pickupDate ? "pickupDate-error" : undefined
                }
                className={inputClass}
              />
            </Field>
            <Field
              label="Lama pinjam (hari)"
              htmlFor="durationDays"
              error={errors.durationDays}
            >
              <input
                id="durationDays"
                type="number"
                min={1}
                max={30}
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                aria-invalid={Boolean(errors.durationDays)}
                aria-describedby={
                  errors.durationDays ? "durationDays-error" : undefined
                }
                className={`${inputClass} tnum`}
              />
            </Field>
          </div>
          <p className="-mt-2 text-sm text-ink-3">
            Admin bisa mengubah jumlah dan lama pinjam saat menyetujui.
          </p>

          <Button type="submit" disabled={isAdmin} className="w-full">
            {isMember || !EMAIL_VERIFICATION ? "Ajukan peminjaman" : "Ajukan dan kirim kode"}
          </Button>
        </form>
      </div>
    </PageBody>
  );
}
