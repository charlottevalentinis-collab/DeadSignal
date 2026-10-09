"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { currentCase as C } from "@/engine/case";
import { useGame } from "@/engine/store";

export function Title() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const startedAt = useGame((s) => s.startedAt);
  const reset = useGame((s) => s.reset);
  const inProgress = hydrated && startedAt !== null;

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-between px-6 py-12">
      <div>
        <p className="typewriter text-xs uppercase tracking-[0.3em] text-accent">● rec</p>
        <h1 className="mt-6 text-5xl font-black tracking-tight">
          DEAD
          <br />
          SIGNAL
        </h1>
        <p className="mt-4 text-muted">The truth is in her phone. Find it before the killer deletes it.</p>
      </div>

      <section className="rounded-2xl border border-line bg-panel p-5">
        <p className="text-xs uppercase tracking-widest text-muted">Case 01</p>
        <h2 className="mt-1 text-2xl font-semibold">{C.title}</h2>
        <p className="mt-2 text-sm text-muted">{C.tagline}</p>
        <div className="mt-4 flex flex-col gap-3 text-sm leading-relaxed">
          {C.intro.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-3">
        <Link href="/play" className="rounded-lg bg-accent py-4 text-center font-semibold text-white">
          {inProgress ? "Continue investigation" : "Start investigation"}
        </Link>
        {inProgress && (
          <Link href="/play" onClick={() => reset()} className="rounded-lg border border-line py-3 text-center text-sm">
            Restart case
          </Link>
        )}
        <p className="text-center text-xs text-muted">About 20 minutes · no timer · best with headphones</p>
      </div>
    </main>
  );
}
