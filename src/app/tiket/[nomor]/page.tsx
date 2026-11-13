import { Suspense } from "react";
import TicketView from "@/components/ticket-view";

export const metadata = { title: "Tiket peminjaman" };

export default function TiketPage({
  params,
}: {
  params: Promise<{ nomor: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-ink-3">Memuat tiket…</p>}>
      <TicketView params={params} />
    </Suspense>
  );
}
