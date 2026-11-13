import { Suspense } from "react";
import RequestsView from "@/components/requests-view";

export const metadata = { title: "Permintaan" };

export default function PermintaanPage() {
  return (
    <Suspense fallback={<p className="px-8 py-6 text-ink-3">Memuat…</p>}>
      <RequestsView />
    </Suspense>
  );
}
