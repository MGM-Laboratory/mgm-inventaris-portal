"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Minus, Plus } from "lucide-react";
import { statusLabel, statusTone } from "@/lib/format";
import type { TicketStatus, UnitStatus } from "@/lib/types";

const tones = {
  neutral: "bg-sunken text-ink-2 border-line-strong",
  blue: "bg-blue-50 text-link border-blue/30",
  green: "bg-green-50 text-green-text border-green/30",
  yellow: "bg-yellow-50 text-ink border-yellow/60",
  red: "bg-red-50 text-red-text border-red/30",
} as const;

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[13px] font-medium ${tones[statusTone[status]]}`}
    >
      <span
        aria-hidden
        className="size-1.5 rounded-full bg-current"
      />
      {statusLabel[status]}
    </span>
  );
}

type ButtonProps = {
  variant?: "primary" | "secondary" | "quiet" | "danger";
  size?: "md" | "sm";
} & ComponentProps<"button">;

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-45";
const buttonSize = { md: "h-11 px-5 text-[15px]", sm: "h-9 px-4 text-sm" };
const buttonVariant = {
  primary: "bg-ink text-page hover:bg-blue hover:text-white",
  secondary:
    "border border-line-strong bg-surface text-ink hover:border-ink-3",
  quiet: "text-ink-2 hover:bg-sunken",
  danger:
    "border border-red/40 bg-surface text-red-text hover:bg-red-50",
};

export function buttonClass(
  variant: keyof typeof buttonVariant = "primary",
  size: keyof typeof buttonSize = "md",
) {
  return `${buttonBase} ${buttonSize[size]} ${buttonVariant[variant]}`;
}

export function Button({ variant = "primary", size = "md", className = "", ...rest }: ButtonProps) {
  return <button className={`${buttonClass(variant, size)} ${className}`} {...rest} />;
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  children,
  className = "",
}: {
  href: string;
  variant?: keyof typeof buttonVariant;
  size?: keyof typeof buttonSize;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={`${buttonClass(variant, size)} ${className}`}>
      {children}
    </Link>
  );
}

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-sm text-red-text">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-sm text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const inputClass =
  "h-11 w-full rounded-xl border border-line-strong bg-surface px-3.5 text-[15px] text-ink placeholder:text-ink-3 aria-[invalid=true]:border-red";

export function Stepper({
  value,
  onChange,
  min = 0,
  max,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max: number;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex h-10 items-center rounded-full border border-line-strong bg-surface"
    >
      <button
        type="button"
        aria-label={`Kurangi ${label}`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className="grid size-10 place-items-center rounded-full text-ink-2 hover:bg-sunken disabled:opacity-35"
      >
        <Minus size={16} strokeWidth={2.25} />
      </button>
      <span className="tnum w-7 text-center text-[15px] font-medium" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        aria-label={`Tambah ${label}`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className="grid size-10 place-items-center rounded-full text-ink-2 hover:bg-sunken disabled:opacity-35"
      >
        <Plus size={16} strokeWidth={2.25} />
      </button>
    </div>
  );
}

export function PatternTile({
  src,
  size = 56,
  className = "",
}: {
  src: string;
  size?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={`shrink-0 rounded-lg ${className}`}
    />
  );
}

export function EmptyState({
  tile,
  title,
  children,
  action,
}: {
  tile: string;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-10 sm:flex-row sm:items-center">
      <PatternTile src={tile} size={72} />
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-xl font-semibold">{title}</h2>
        {children ? <p className="max-w-prose text-ink-2">{children}</p> : null}
      </div>
      {action ? <div className="sm:ml-auto">{action}</div> : null}
    </div>
  );
}

const unitLabel: Record<UnitStatus, string> = {
  tersedia: "Tersedia",
  dipesan: "Dipesan",
  dipinjam: "Sedang dipinjam",
  perawatan: "Dalam perawatan",
  hilang: "Hilang",
  pensiun: "Pensiun",
};
const unitTone: Record<UnitStatus, keyof typeof tones> = {
  tersedia: "green",
  dipesan: "yellow",
  dipinjam: "blue",
  perawatan: "yellow",
  hilang: "red",
  pensiun: "neutral",
};

export function UnitStatusBadge({ status }: { status: UnitStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[13px] font-medium ${tones[unitTone[status]]}`}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {unitLabel[status]}
    </span>
  );
}
