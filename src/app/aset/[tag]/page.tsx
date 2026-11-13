import { Suspense } from "react";
import AssetView from "@/components/asset-view";

export const metadata = { title: "Info aset" };

export default function AsetPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-ink-3">Memuat…</p>}>
      <AssetView params={params} />
    </Suspense>
  );
}
