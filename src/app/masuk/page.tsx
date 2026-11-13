"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Field, PatternTile, inputClass } from "@/components/ui";
import { EMAIL_VERIFICATION, setRole, signInGuest } from "@/lib/store";

type Errors = Partial<Record<"name" | "nimNip" | "email", string>>;

export default function MasukPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [nimNip, setNimNip] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  function submitGuest(e: React.FormEvent) {
    e.preventDefault();
    const next: Errors = {};
    if (name.trim().length < 3) next.name = "Isi nama lengkap.";
    if (!/^[0-9A-Za-z]{8,20}$/.test(nimNip.trim()))
      next.nimNip = "Isi NIM atau NIP, 8 sampai 20 huruf atau angka.";
    if (!/^[^\s@]+@([a-z0-9-]+\.)*ub\.ac\.id$/i.test(email.trim()))
      next.email = "Pakai email UB, misalnya nama@student.ub.ac.id.";
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) {
      document.getElementById(first)?.focus();
      return;
    }
    signInGuest({ name, nimNip, email });
    router.push("/");
  }

  return (
    <div className="min-h-dvh">
      <div
        aria-hidden
        className="h-1 w-full bg-[linear-gradient(90deg,var(--blue)_0_25%,var(--yellow)_25%_50%,var(--red)_50%_75%,var(--green)_75%_100%)]"
      />
      <main id="isi" className="mx-auto w-full max-w-4xl px-5 pt-10 pb-28 sm:px-8 sm:pt-16">
        <div className="mb-8 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" width={36} height={36} />
          <span className="flex flex-col font-display leading-[1.1] tracking-tight">
            <span className="text-base font-bold">MGM Laboratory</span>
            <span className="text-xs font-medium text-ink-3">Inventaris dan peminjaman</span>
          </span>
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight">Masuk</h1>
        <p className="mt-2 max-w-xl text-[15px] text-ink-2">
          Masuk dulu untuk melihat katalog dan meminjam. Anggota lab memakai akun MGM. Civitas
          FILKOM lain bisa masuk sebagai guest dengan email UB.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <section className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6 shadow-soft">
            <PatternTile src="/patterns/circle-white-on-blue.svg" size={56} />
            <div>
              <h2 className="font-display text-xl font-semibold">Member</h2>
              <p className="mt-1 text-[15px] text-ink-2">
                Masuk dengan akun MGM. Data diri terisi otomatis, Anda hanya mengisi tujuan dan
                tanggal.
              </p>
            </div>
            <Button
              className="mt-auto self-start"
              onClick={() => {
                setRole("member");
                router.push("/");
              }}
            >
              Masuk dengan akun MGM
            </Button>
            <p className="text-sm text-ink-3">
              Mode contoh: masuk sebagai anggota contoh tanpa akun sungguhan. Nanti memakai
              Keycloak.
            </p>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
            <PatternTile src="/patterns/arcs-white-on-yellow.svg" size={56} />
            <h2 className="mt-4 font-display text-xl font-semibold">Guest</h2>
            <p className="mt-1 mb-4 text-[15px] text-ink-2">
              Tanpa akun. Data ini dipakai sebagai kontak tiket.
              {EMAIL_VERIFICATION ? " Email diverifikasi dengan kode saat Anda mengajukan." : ""}
            </p>
            <form onSubmit={submitGuest} noValidate className="flex flex-col gap-4">
              <Field label="Nama lengkap" htmlFor="name" error={errors.name}>
                <input
                  id="name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={Boolean(errors.name)}
                  className={inputClass}
                />
              </Field>
              <Field label="NIM atau NIP" htmlFor="nimNip" error={errors.nimNip}>
                <input
                  id="nimNip"
                  inputMode="numeric"
                  value={nimNip}
                  onChange={(e) => setNimNip(e.target.value)}
                  aria-invalid={Boolean(errors.nimNip)}
                  className={`${inputClass} tnum`}
                />
              </Field>
              <Field label="Email UB" htmlFor="email" error={errors.email}>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={Boolean(errors.email)}
                  className={inputClass}
                />
              </Field>
              <Button type="submit" variant="secondary" className="self-start">
                Lanjut sebagai guest
              </Button>
            </form>
          </section>
        </div>

        <p className="mt-8 text-[14px] text-ink-3">
          Hanya ingin mengecek tiket?{" "}
          <Link href="/lacak" className="text-link underline">
            Lacak tiket tanpa masuk
          </Link>
          .
          <span className="mx-2" aria-hidden>
            ·
          </span>
          <button
            type="button"
            onClick={() => {
              setRole("admin");
              router.push("/admin");
            }}
            className="text-link underline"
          >
            Masuk sebagai Admin (mode contoh)
          </button>
        </p>
      </main>
    </div>
  );
}
