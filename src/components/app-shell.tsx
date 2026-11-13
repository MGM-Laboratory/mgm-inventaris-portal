"use client";

import { useEffect, useState, type ComponentType } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Inbox,
  LayoutDashboard,
  LayoutGrid,
  Menu,
  Moon,
  Package,
  QrCode,
  ScanSearch,
  ShoppingBag,
  Sun,
  Ticket,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cartCount, isAnonymous, signOut, useAppState, useReady } from "@/lib/store";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number; "aria-hidden"?: boolean }>;
  badge?: number;
};

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const ready = useReady();
  const dark = ready && resolvedTheme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Pakai tampilan terang" : "Pakai tampilan gelap"}
      className="inline-flex size-9 items-center justify-center rounded-full border border-line-strong hover:bg-sunken"
    >
      {dark ? <Sun size={16} strokeWidth={2.25} /> : <Moon size={16} strokeWidth={2.25} />}
    </button>
  );
}

function NavGroup({
  title,
  items,
  pathname,
  onNavigate,
}: {
  title?: string;
  items: NavItem[];
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      {title ? (
        <p className="px-3 pb-1 text-[12px] font-semibold tracking-wide text-ink-3 uppercase">
          {title}
        </p>
      ) : null}
      {items.map((it) => {
        const exact = it.href === "/" || it.href === "/admin";
        const active = exact ? pathname === it.href : pathname.startsWith(it.href);
        const Icon = it.icon;
        return (
          <Link
            key={it.href}
            href={it.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-[15px] font-medium transition-colors ${
              active ? "bg-blue-50 text-link" : "text-ink-2 hover:bg-sunken hover:text-ink"
            }`}
          >
            {active ? (
              <span aria-hidden className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-blue" />
            ) : null}
            <Icon size={18} strokeWidth={2.25} aria-hidden />
            <span className="flex-1">{it.label}</span>
            {it.badge ? (
              <span className="tnum rounded-full bg-blue px-2 py-0.5 text-[12px] font-semibold text-white">
                {it.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}

/**
 * Kerangka aplikasi ala Snipe-IT: bilah atas, menu samping, dan isi halaman.
 * Peminjam melihat menu pendek; Admin dan Maintainer menambah dasbor, permintaan,
 * aset, dan label.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const ready = useReady();
  const state = useAppState();
  const [open, setOpen] = useState(false);
  const [lookup, setLookup] = useState("");

  const role = ready ? state.session.role : "guest";
  const count = ready ? cartCount(state.cart) : 0;
  const pending = ready ? state.tickets.filter((t) => t.status === "diajukan").length : 0;
  const close = () => setOpen(false);

  const bare = pathname === "/masuk";
  const anonymous = ready && isAnonymous(state.session);
  const gated = pathname === "/" || pathname.startsWith("/keranjang");
  const blocked = anonymous && gated;

  useEffect(() => {
    if (blocked) router.replace("/masuk");
  }, [blocked, router]);

  const loan: NavItem[] = [
    { href: "/", label: "Katalog", icon: LayoutGrid },
    { href: "/keranjang", label: "Keranjang", icon: ShoppingBag, badge: count },
    { href: "/lacak", label: "Lacak tiket", icon: Ticket },
  ];
  const admin: NavItem[] = [
    { href: "/admin", label: "Dasbor", icon: LayoutDashboard },
    { href: "/admin/permintaan", label: "Permintaan", icon: Inbox, badge: pending },
    { href: "/admin/aset", label: "Aset", icon: Package },
    { href: "/admin/label", label: "Label QR", icon: QrCode },
  ];

  if (bare) return <>{children}</>;

  return (
    <div className="min-h-dvh">
      <a
        href="#isi"
        className="no-print sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2"
      >
        Lewati ke konten
      </a>

      <div
        aria-hidden
        onClick={close}
        className={`no-print fixed inset-0 z-30 bg-black/45 transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        aria-label="Menu utama"
        className={`no-print fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-line bg-surface transition-[transform,visibility] duration-300 max-lg:shadow-lift ${
          open ? "translate-x-0" : "max-lg:invisible max-lg:-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between gap-2 border-b border-line px-4">
          <Link href="/" onClick={close} className="flex items-center gap-2" aria-label="MGM Laboratory, inventaris, ke katalog">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="" width={28} height={28} />
            <span className="flex flex-col font-display leading-[1.1] tracking-tight">
              <span className="text-sm font-bold">MGM</span>
              <span className="text-[10px] font-medium text-ink-3">Laboratory</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={close}
            aria-label="Tutup menu"
            className="grid size-8 place-items-center rounded-full hover:bg-sunken lg:hidden"
          >
            <X size={18} strokeWidth={2.25} />
          </button>
        </div>

        <nav aria-label="Halaman" className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
          <NavGroup title="Peminjaman" items={loan} pathname={pathname} onNavigate={close} />
          {role === "admin" ? (
            <NavGroup title="Admin" items={admin} pathname={pathname} onNavigate={close} />
          ) : null}
        </nav>

        <p className="border-t border-line px-4 py-3 text-[12px] text-ink-3">
          Inventaris LabMGM. Prototipe dengan data contoh.
        </p>
      </aside>

      <div className="flex min-h-dvh flex-col lg:pl-60">
        <header className="no-print sticky top-0 z-20 border-b border-line bg-page/90 backdrop-blur">
          <div
            aria-hidden
            className="h-1 w-full bg-[linear-gradient(90deg,var(--blue)_0_25%,var(--yellow)_25%_50%,var(--red)_50%_75%,var(--green)_75%_100%)]"
          />
          <div className="flex h-14 items-center gap-3 px-5 sm:px-8">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Buka menu"
              className="grid size-9 place-items-center rounded-full border border-line-strong hover:bg-sunken lg:hidden"
            >
              <Menu size={18} strokeWidth={2.25} />
            </button>

            {role === "admin" ? (
              <form
                role="search"
                onSubmit={(e) => {
                  e.preventDefault();
                  const code = lookup.trim().toUpperCase();
                  if (code) {
                    router.push(`/aset/${encodeURIComponent(code)}`);
                    setLookup("");
                  }
                }}
                className="relative hidden w-full max-w-xs sm:block"
              >
                <ScanSearch
                  size={16}
                  strokeWidth={2.25}
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
                />
                <input
                  value={lookup}
                  onChange={(e) => setLookup(e.target.value)}
                  placeholder="Cari kode aset"
                  aria-label="Cari kode aset"
                  className="h-9 w-full rounded-full border border-line-strong bg-surface pl-9 pr-3 text-sm placeholder:text-ink-3"
                />
              </form>
            ) : null}

            <div className="ml-auto flex items-center gap-2">
              {role === "admin" ? (
                <Link
                  href="/admin/permintaan"
                  aria-label={
                    pending > 0 ? `${pending} permintaan menunggu keputusan` : "Tidak ada permintaan menunggu"
                  }
                  className="relative grid size-9 place-items-center rounded-full border border-line-strong hover:bg-sunken"
                >
                  <Bell size={16} strokeWidth={2.25} />
                  {pending > 0 ? (
                    <span className="tnum absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-red px-1 text-[12px] leading-5 font-semibold text-white">
                      {pending}
                    </span>
                  ) : null}
                </Link>
              ) : null}
              <Link
                href="/keranjang"
                aria-label={count > 0 ? `Keranjang, ${count} barang` : "Keranjang kosong"}
                className="relative grid size-9 place-items-center rounded-full border border-line-strong hover:bg-sunken"
              >
                <ShoppingBag size={16} strokeWidth={2.25} />
                {count > 0 ? (
                  <span className="tnum absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-blue px-1 text-[12px] leading-5 font-semibold text-white">
                    {count}
                  </span>
                ) : null}
              </Link>
              <ThemeToggle />
              {anonymous ? (
                <Link
                  href="/masuk"
                  className="ml-1 rounded-full bg-ink px-4 py-2 text-sm font-medium text-page hover:bg-blue hover:text-white"
                >
                  Masuk
                </Link>
              ) : (
                <div className="ml-1 flex items-center gap-2">
                  <span className="hidden text-sm text-ink-2 md:inline">
                    {state.session.name}
                  </span>
                  <button
                    type="button"
                    onClick={signOut}
                    className="rounded-full border border-line-strong px-4 py-2 text-sm font-medium hover:bg-sunken"
                  >
                    Keluar
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main id="isi" className="flex-1">
          {blocked ? <p className="px-8 py-6 text-ink-3">Mengalihkan ke halaman masuk…</p> : children}
        </main>
      </div>
    </div>
  );
}
