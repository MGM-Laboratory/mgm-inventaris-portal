import { endDateIso, useAppState } from "@/lib/store";
import { formatDate, formatWeekday, statusTone } from "@/lib/format";
import { StatusBadge } from "@/components/ui";
import type { Ticket, TicketStatus } from "@/lib/types";

const stubTile: Record<"neutral" | "blue" | "green" | "yellow" | "red", string> = {
  neutral: "/patterns/circle-blue-on-white.svg",
  blue: "/patterns/circle-white-on-blue.svg",
  green: "/patterns/leaves-white-on-green.svg",
  yellow: "/patterns/arcs-white-on-yellow.svg",
  red: "/patterns/plus-white-on-red.svg",
};

/** Tiket peminjaman: satu-satunya tempat pola geometris dipakai besar. */
export function TicketCard({
  ticket,
  status,
}: {
  ticket: Ticket;
  status: TicketStatus;
}) {
  const { models } = useAppState();
  const tile = stubTile[statusTone[status]];
  const end = endDateIso(ticket);
  const days = ticket.approvedDurationDays ?? ticket.durationDays;

  return (
    <article
      aria-label={`Tiket ${ticket.number}`}
      className="relative grid overflow-visible rounded-2xl border border-line-strong bg-surface shadow-lift md:grid-cols-[13rem_1fr]"
    >
      <div
        aria-hidden
        className="absolute -top-[11px] left-[13rem] z-10 hidden size-[22px] -translate-x-1/2 rounded-full border border-line-strong bg-page [clip-path:inset(50%_0_0_0)] md:block"
      />
      <div
        aria-hidden
        className="absolute -bottom-[11px] left-[13rem] z-10 hidden size-[22px] -translate-x-1/2 rounded-full border border-line-strong bg-page [clip-path:inset(0_0_50%_0)] md:block"
      />

      <div className="flex flex-col overflow-hidden rounded-t-2xl border-b border-dashed border-line-strong md:rounded-l-2xl md:rounded-tr-none md:border-b-0 md:border-r">
        <div
          aria-hidden
          className="h-24 md:h-28"
          style={{
            backgroundImage: `url(${tile})`,
            backgroundSize: "56px 56px",
          }}
        />
        <div className="flex flex-1 flex-col gap-2 p-5">
          <p className="text-sm text-ink-3">Nomor tiket</p>
          <p className="tnum break-all font-mono text-[19px] font-semibold leading-tight">
            {ticket.number}
          </p>
          <div className="mt-1">
            <StatusBadge status={status} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5 p-5 sm:p-6">
        <div>
          <p className="text-sm text-ink-3">Peminjam</p>
          <p className="font-display text-xl font-semibold tracking-[-0.005em]">
            {ticket.requester.name}
          </p>
          <p className="tnum text-sm text-ink-2">
            {ticket.requester.nimNip ? `${ticket.requester.nimNip}, ` : ""}
            {ticket.requester.email}
          </p>
        </div>

        <div>
          <p className="text-sm text-ink-3">Tujuan</p>
          <p className="text-[15px]">{ticket.purpose}</p>
        </div>

        <div>
          <p className="text-sm text-ink-3">Barang</p>
          <ul className="mt-1 flex flex-col divide-y divide-line">
            {ticket.items.map((it) => {
              const m = models.find((x) => x.id === it.modelId);
              const changed =
                it.approvedQty !== undefined && it.approvedQty !== it.qty;
              return (
                <li
                  key={it.modelId}
                  className="flex items-baseline justify-between gap-4 py-1.5 text-[15px]"
                >
                  <span>{m?.name ?? it.modelId}</span>
                  <span className="tnum text-ink-2">
                    {it.approvedQty !== undefined ? it.approvedQty : it.qty} unit
                    {changed ? (
                      <span className="ml-2 text-sm text-ink-3">
                        (diminta {it.qty})
                      </span>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <dl className="grid grid-cols-2 gap-4 border-t border-dashed border-line-strong pt-4">
          <div>
            <dt className="text-sm text-ink-3">Ambil</dt>
            <dd className="text-[15px] font-medium">
              {formatWeekday(ticket.pickupDate)}, {formatDate(ticket.pickupDate)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-ink-3">Kembali paling lambat</dt>
            <dd className="text-[15px] font-medium">
              {formatDate(end)}
              <span className="tnum ml-1.5 text-sm font-normal text-ink-3">
                ({days} hari)
              </span>
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
