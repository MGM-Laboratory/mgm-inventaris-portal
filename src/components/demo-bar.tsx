"use client";

import { RotateCcw } from "lucide-react";
import { resetDemo, setRole, useAppState, useReady } from "@/lib/store";
import type { Role } from "@/lib/types";

const roles: { id: Role; label: string }[] = [
  { id: "guest", label: "Guest" },
  { id: "member", label: "Member" },
  { id: "admin", label: "Admin" },
];

/** Hanya untuk tahap rancangan: berganti peran tanpa login sungguhan. */
export function DemoBar() {
  const state = useAppState();
  const ready = useReady();
  const role = ready ? state.session.role : "guest";

  return (
    <aside
      aria-label="Mode contoh"
      className="no-print fixed right-4 bottom-4 z-50 flex items-center gap-1 rounded-full border border-line-strong bg-surface/95 p-1 pl-4 shadow-lift backdrop-blur"
    >
      <span className="mr-1 hidden text-[13px] font-medium text-ink-2 sm:inline">
        Mode contoh
      </span>
      <div role="group" aria-label="Lihat sebagai" className="inline-flex rounded-full bg-page p-0.5">
        {roles.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRole(r.id)}
            aria-pressed={role === r.id}
            className={`rounded-full px-3 py-1 text-[13px] font-medium ${
              role === r.id ? "bg-ink text-page" : "text-ink-2 hover:bg-sunken"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={resetDemo}
        aria-label="Atur ulang data contoh"
        title="Atur ulang data contoh"
        className="grid size-8 place-items-center rounded-full text-ink-2 hover:bg-sunken"
      >
        <RotateCcw size={14} strokeWidth={2.25} />
      </button>
    </aside>
  );
}
