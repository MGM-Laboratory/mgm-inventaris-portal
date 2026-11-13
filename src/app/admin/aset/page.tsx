import { Suspense } from "react";
import AssetsView from "@/components/assets-view";

export const metadata = { title: "Aset" };

export default function AsetListPage() {
  return (
    <Suspense fallback={<p className="px-8 py-6 text-ink-3">Memuat…</p>}>
      <AssetsView />
    </Suspense>
  );
}
