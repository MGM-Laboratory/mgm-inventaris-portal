import { EmptyState, LinkButton } from "@/components/ui";
import { PageBody } from "@/components/page-layout";

export default function NotFound() {
  return (
    <PageBody>
      <EmptyState
        tile="/patterns/x-red-on-white.svg"
        title="Halaman tidak ditemukan"
        action={<LinkButton href="/">Ke katalog</LinkButton>}
      >
        Alamatnya mungkin salah atau halamannya sudah pindah.
      </EmptyState>
    </PageBody>
  );
}
