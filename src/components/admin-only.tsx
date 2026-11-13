"use client";

import type { ReactNode } from "react";
import { Button, EmptyState } from "@/components/ui";
import { PageBody, PageHeader } from "@/components/page-layout";
import { setRole, useAppState, useReady } from "@/lib/store";

/** Menjaga halaman Admin. Di mode contoh, tombolnya mengganti peran tanpa login. */
export function AdminOnly({ children }: { children: ReactNode }) {
  const ready = useReady();
  const { session } = useAppState();

  if (!ready) {
    return (
      <PageBody>
        <p className="text-ink-3">Memuat…</p>
      </PageBody>
    );
  }
  if (session.role !== "admin") {
    return (
      <PageBody>
        <PageHeader title="Khusus Admin dan Maintainer" />
        <EmptyState
          tile="/patterns/square-white-on-blue.svg"
          title="Halaman ini untuk Admin dan Maintainer"
          action={
            <Button variant="secondary" onClick={() => setRole("admin")}>
              Lihat sebagai Admin
            </Button>
          }
        >
          Admin masuk dengan akun lokal ber-2FA. Di mode contoh, tombol ini mengganti peran
          tanpa login.
        </EmptyState>
      </PageBody>
    );
  }
  return <>{children}</>;
}
