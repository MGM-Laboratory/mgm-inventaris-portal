"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Download, Printer } from "lucide-react";
import { TicketCard } from "@/components/ticket-card";
import {
  Button,
  EmptyState,
  Field,
  LinkButton,
  inputClass,
} from "@/components/ui";
import { formatDateTime, statusLabel, statusNext } from "@/lib/format";
import { downloadTicketPng } from "@/lib/ticket-png";
import {
  VERIFY_CODE_DEMO,
  cancelTicket,
  canViewTicket,
  effectiveStatus,
  useAppState,
  useReady,
  verifyEmail,
} from "@/lib/store";
import { PageBody, PageHeader } from "@/components/page-layout";

function TicketViewInner({ params }: { params: Promise<{ nomor: string }> }) {
  const { nomor } = use(params);
  const number = decodeURIComponent(nomor);
  const ready = useReady();
  const state = useAppState();
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pngError, setPngError] = useState("");

  if (!ready) return <p className="text-ink-3">Memuat tiket…</p>;

  const ticket = state.tickets.find((t) => t.number === number);

  if (!ticket) {
    return (
      <EmptyState
        tile="/patterns/x-red-on-white.svg"
        title="Tiket tidak ditemukan"
        action={<LinkButton href="/lacak">Lacak dengan nomor</LinkButton>}
      >
        Periksa nomornya. Nomor tiket berbentuk MGM-2611-0001-K7QX.
      </EmptyState>
    );
  }

  if (!canViewTicket(state, ticket)) {
    return (
      <EmptyState
        tile="/patterns/square-white-on-blue.svg"
        title="Tiket ini perlu dibuka dengan email"
        action={
          <LinkButton
            href={`/lacak?nomor=${encodeURIComponent(ticket.number)}`}
          >
            Masukkan email
          </LinkButton>
        }
      >
        Demi keamanan data peminjam, tiket hanya terbuka untuk pemiliknya.
      </EmptyState>
    );
  }

  const status = effectiveStatus(ticket);
  const canCancel =
    ticket.status === "diajukan" || ticket.status === "menunggu_verifikasi";

  function onVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!verifyEmail(ticket!.number, code)) {
      setCodeError("Kode tidak cocok. Periksa email Anda dan coba lagi.");
      return;
    }
    setCodeError("");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={ticket.number}
        crumbs={[{ label: "Peminjaman" }, { label: "Tiket" }]}
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setPngError("");
                try {
                  await downloadTicketPng(ticket, status);
                } catch {
                  setPngError(
                    "Gambar tiket gagal dibuat. Coba lagi, atau pakai Cetak tiket.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Download size={16} strokeWidth={2.25} />
              {busy ? "Membuat gambar…" : "Unduh PNG"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.print()}
            >
              <Printer size={16} strokeWidth={2.25} />
              Cetak tiket
            </Button>
          </>
        }
      />
      {pngError ? (
        <p role="alert" className="no-print -mt-4 text-[15px] text-red-text">
          {pngError}
        </p>
      ) : null}

      <TicketCard ticket={ticket} status={status} />

      {ticket.status === "menunggu_verifikasi" ? (
        <form
          onSubmit={onVerify}
          noValidate
          className="no-print flex max-w-xl flex-col gap-4 rounded-2xl border border-yellow/60 bg-yellow-50 p-6"
        >
          <div>
            <h2 className="font-display text-xl font-semibold">
              Verifikasi email Anda
            </h2>
            <p className="mt-1 text-[15px] text-ink-2">
              Kami mengirim kode 6 digit ke{" "}
              <span className="font-medium text-ink">
                {ticket.requester.email}
              </span>
              . Permintaan baru diproses Admin setelah email terverifikasi.
            </p>
            <p className="mt-2 text-sm text-ink-3">
              Mode contoh: tidak ada email sungguhan, pakai kode{" "}
              <span className="tnum font-mono font-semibold text-ink">
                {VERIFY_CODE_DEMO}
              </span>
              .
            </p>
          </div>
          <Field label="Kode verifikasi" htmlFor="kode" error={codeError}>
            <input
              id="kode"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              aria-invalid={Boolean(codeError)}
              aria-describedby={codeError ? "kode-error" : undefined}
              className={`${inputClass} tnum max-w-48 font-mono tracking-[0.2em]`}
            />
          </Field>
          <Button type="submit" className="self-start">
            Verifikasi
          </Button>
        </form>
      ) : (
        <section
          aria-label="Langkah berikutnya"
          className="max-w-2xl rounded-2xl border border-line bg-surface p-5"
        >
          <h2 className="font-display text-lg font-semibold">
            {statusLabel[status]}
          </h2>
          <p className="mt-1 text-[15px] text-ink-2">{statusNext[status]}</p>
          {ticket.decisionNote ? (
            <p className="mt-3 rounded-xl bg-sunken px-4 py-3 text-[15px]">
              <span className="font-medium">Catatan Admin: </span>
              {ticket.decisionNote}
            </p>
          ) : null}
        </section>
      )}

      <section aria-label="Riwayat tiket" className="no-print max-w-2xl">
        <h2 className="font-display text-lg font-semibold">Riwayat</h2>
        <ol className="mt-3 flex flex-col border-l border-line-strong">
          {[...ticket.history].reverse().map((ev, i) => (
            <li key={`${ev.at}-${i}`} className="relative pb-5 pl-6 last:pb-0">
              <span
                aria-hidden
                className="absolute -left-[5px] top-2 size-2.5 rounded-full border-2 border-page bg-blue"
              />
              <p className="text-[15px] font-medium">
                {statusLabel[ev.status]}
              </p>
              <p className="text-sm text-ink-3">
                {formatDateTime(ev.at)}, oleh {ev.by}
              </p>
              {ev.note ? (
                <p className="mt-1 text-sm text-ink-2">{ev.note}</p>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      <div className="no-print flex flex-wrap items-center gap-3">
        {canCancel ? (
          confirmCancel ? (
            <>
              <p className="text-[15px]">Batalkan permintaan ini?</p>
              <Button
                variant="danger"
                size="sm"
                onClick={() => cancelTicket(ticket.number)}
              >
                Ya, batalkan
              </Button>
              <Button
                variant="quiet"
                size="sm"
                onClick={() => setConfirmCancel(false)}
              >
                Tidak
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConfirmCancel(true)}
            >
              Batalkan permintaan
            </Button>
          )
        ) : null}
        <Link
          href="/"
          className="text-[15px] text-link underline underline-offset-2"
        >
          Kembali ke katalog
        </Link>
      </div>
    </div>
  );
}

export default function TicketView(props: {
  params: Promise<{ nomor: string }>;
}) {
  return (
    <PageBody>
      <TicketViewInner {...props} />
    </PageBody>
  );
}
