import { Suspense } from "react";
import AdminTicketView from "@/components/admin-ticket-view";

export const metadata = { title: "Keputusan tiket" };

export default function AdminTiketPage({
  params,
}: {
  params: Promise<{ nomor: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-ink-3">Memuat tiket…</p>}>
      <AdminTicketView params={params} />
    </Suspense>
  );
}
