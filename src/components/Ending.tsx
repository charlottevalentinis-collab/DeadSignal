"use client";

import { useState } from "react";
import { currentCase as C } from "@/engine/case";
import { keyShare } from "@/engine/rules";
import { useFacts, useGame, type Ending as EndingT } from "@/engine/store";
import { sendPlaythrough } from "@/lib/telemetry";

const APP_VERSION = "0.1.0";

export function Ending({ ending }: { ending: EndingT }) {
  const facts = useFacts();
  const s = useGame();
  const [voted, setVoted] = useState(s.telemetrySent);
  const text = C.endings[ending.kind];
  const share = keyShare(C, facts);
  const usedConfront = C.suspects.some((su) => su.questions.some((q) => q.confront && facts.has(`asked:${q.id}`)));
  const minutes = Math.max(1, Math.round(ending.durationS / 60));

  const vote = (wantsMore: boolean | null) => {
    setVoted(true);
    if (s.telemetrySent) return;
    s.markTelemetrySent();
    void sendPlaythrough({
      case_id: C.id,
      outcome: ending.kind,
      duration_s: ending.durationS,
      wrong_accusations: s.wrongWho,
      released_count: s.released,
      key_clues_pct: Math.round(share * 100),
      used_confront: usedConfront,
      rank: ending.rank,
      wants_more: wantsMore,
      app_version: APP_VERSION,
    });
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col gap-6 px-5 py-10">
      <p className="text-xs uppercase tracking-widest text-muted">{C.title}</p>
      <h1 className={`text-3xl font-bold ${ending.kind === "solved" ? "text-good" : "text-accent"}`}>{text.title}</h1>
      <div className="flex aspect-video items-center justify-center rounded-xl border border-line bg-black text-[10px] uppercase tracking-widest text-white/40">
        {ending.kind === "solved" ? "arrest & confession clip" : "escape clip"} placeholder
      </div>
      {text.text.map((p, i) => (
        <p key={i} className="leading-relaxed">
          {p}
        </p>
      ))}

      {ending.kind === "escaped" && (
        <div className="rounded-xl border border-line bg-panel p-4">
          <h2 className="mb-2 font-semibold">The full solution</h2>
          {C.endings.solution.map((p, i) => (
            <p key={i} className="mb-1 text-sm">
              {p}
            </p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Rank" value={ending.rank} />
        <Stat label="Time" value={`${minutes} min`} />
        <Stat label="Key clues" value={`${Math.round(share * 100)}%`} />
      </div>

      <div className="rounded-xl border border-line bg-panel p-4">
        {voted ? (
          <p className="text-center text-sm">Thanks! Your answer helps decide what comes next.</p>
        ) : (
          <>
            <p className="mb-3 text-center font-semibold">Would you play another case?</p>
            <div className="flex gap-2">
              <button onClick={() => vote(true)} className="flex-1 rounded-lg bg-good py-3 font-semibold text-white">
                Yes!
              </button>
              <button onClick={() => vote(false)} className="flex-1 rounded-lg border border-line py-3">
                Not really
              </button>
            </div>
            <button onClick={() => vote(null)} className="mt-2 w-full text-xs text-muted">
              Skip
            </button>
          </>
        )}
      </div>

      <button onClick={() => s.reset()} className="rounded-lg border border-line py-3">
        Play the case again
      </button>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-panel p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
