"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Field, inputClass } from "@/components/ui";
import { markLookedUp, useAppState } from "@/lib/store";
import { PageBody, PageHeader } from "@/components/page-layout";

function Form() {
  const router = useRouter();
  const params = useSearchParams();
  const { tickets } = useAppState();
  const [nomor, setNomor] = useState(params.get("nomor") ?? "");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const found = tickets.find(
      (t) =>
        t.number.toLowerCase() === nomor.trim().toLowerCase() &&
        t.requester.email.toLowerCase() === email.trim().toLowerCase(),
    );
    if (!found) {
      setError(
        "Nomor tiket dan email tidak cocok. Periksa keduanya, lalu coba lagi.",
      );
      document.getElementById("nomor")?.focus();
      return;
    }
    markLookedUp(found.number);
    router.push(`/tiket/${found.number}`);
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="flex max-w-md flex-col gap-5 rounded-2xl border border-line bg-surface p-6 shadow-soft"
    >
      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-red-50 px-4 py-3 text-[15px] text-red-text"
        >
          {error}
        </p>
      ) : null}
      <Field label="Nomor tiket" htmlFor="nomor">
        <input
          id="nomor"
          value={nomor}
          onChange={(e) => setNomor(e.target.value)}
          placeholder="MGM-2611-0001-K7QX"
          autoComplete="off"
          className={`${inputClass} tnum font-mono`}
        />
      </Field>
      <Field label="Email UB yang dipakai saat mengajukan" htmlFor="email">
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className={inputClass}
        />
      </Field>
      <Button type="submit" className="w-full">
        Lacak tiket
      </Button>
      <p className="text-sm text-ink-3">
        Mode contoh: coba nomor dan email dari tiket yang baru Anda ajukan, atau
        dari tiket contoh seperti{" "}
        <span className="tnum font-mono text-ink-2">MGM-2611-0003-R8WN</span> dengan{" "}
        <span className="font-mono text-ink-2">dosen.contoh@ub.ac.id</span>.
      </p>
    </form>
  );
}

export default function LacakPage() {
  return (
    <PageBody>
      <PageHeader
        title="Di mana tiket Anda sekarang?"
        description="Masukkan nomor tiket dan email yang Anda pakai saat mengajukan."
        crumbs={[{ label: "Lacak tiket" }]}
      />
      <Suspense fallback={<p className="text-ink-3">Memuat…</p>}>
        <Form />
      </Suspense>
    </PageBody>
  );
}
