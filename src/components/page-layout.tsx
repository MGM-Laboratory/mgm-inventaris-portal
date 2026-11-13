import type { ReactNode } from "react";
import Link from "next/link";
import { FlairShape, type PatternKind } from "@/components/pattern-tile";

/** Kolom isi halaman. */
export function PageBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1400px] px-5 py-6 sm:px-8 ${className}`}>
      {children}
    </div>
  );
}

/** Judul halaman dengan jejak, deskripsi, dan aksi, seperti halaman daftar Snipe-IT. */
export function PageHeader({
  title,
  description,
  crumbs,
  actions,
}: {
  title: ReactNode;
  description?: string;
  crumbs?: { label: string; href?: string }[];
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        {crumbs?.length ? (
          <nav
            aria-label="Jejak halaman"
            className="no-print mb-1 flex flex-wrap items-center gap-1.5 text-[13px] text-ink-3"
          >
            {crumbs.map((c, i) => (
              <span key={c.label} className="flex items-center gap-1.5">
                {i > 0 ? <span aria-hidden>/</span> : null}
                {c.href ? (
                  <Link href={c.href} className="hover:text-ink hover:underline">
                    {c.label}
                  </Link>
                ) : (
                  <span aria-current="page">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        ) : null}
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-[28px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-prose text-sm text-ink-2">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="no-print flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

/** Kotak berjudul, seperti "box" di Snipe-IT. `flush` menghapus padding isi untuk tabel. */
export function Box({
  title,
  actions,
  children,
  flush = false,
  className = "",
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  flush?: boolean;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-line bg-surface shadow-soft ${className}`}>
      {title || actions ? (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
          {title ? <h2 className="text-[15px] font-semibold">{title}</h2> : <span />}
          {actions}
        </header>
      ) : null}
      <div className={flush ? "" : "p-5"}>{children}</div>
    </section>
  );
}

const tileTone = {
  blue: "border-blue/30 bg-blue-50",
  green: "border-green/30 bg-green-50",
  yellow: "border-yellow/60 bg-yellow-50",
  red: "border-red/30 bg-red-50",
} as const;

/** Angka ringkas di dasbor. Warna dan bentuk pudar mengikuti identitas LabMGM. */
export function StatTile({
  label,
  value,
  href,
  tone,
  motif,
  hint,
}: {
  label: string;
  value: number | string;
  href: string;
  tone: keyof typeof tileTone;
  motif: PatternKind;
  hint?: string;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex flex-col overflow-hidden rounded-xl border p-4 transition-shadow hover:shadow-lift ${tileTone[tone]}`}
    >
      <FlairShape
        kind={motif}
        tone={tone}
        className="pointer-events-none absolute -top-3 -right-3 size-20 opacity-25"
      />
      <span className="tnum relative font-display text-[2.25rem] leading-none font-semibold">
        {value}
      </span>
      <span className="relative mt-1.5 text-[14px] font-medium">{label}</span>
      {hint ? <span className="relative text-[13px] text-ink-2">{hint}</span> : null}
      <span className="relative mt-3 text-[13px] font-medium text-link group-hover:underline">
        Lihat semua
      </span>
    </Link>
  );
}

export const thClass =
  "px-4 py-2.5 text-left text-[13px] font-medium whitespace-nowrap text-ink-3";
export const tdClass = "px-4 py-3 align-middle";
