import { Suspense } from "react";
import UnitEditView from "@/components/unit-edit-view";

export const metadata = { title: "Ubah aset" };

export default function UbahAsetPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  return (
    <Suspense fallback={<p className="px-8 py-6 text-ink-3">Memuat…</p>}>
      <UnitEditView params={params} />
    </Suspense>
  );
}
