"use client";

import { useState } from "react";
import { byId, currentCase as C } from "@/engine/case";
import { isVisible } from "@/engine/rules";
import { useFacts, useGame } from "@/engine/store";
import type { Question, Suspect } from "@/engine/types";
import { useUI } from "@/engine/ui";

const REACTION: Record<string, string> = {
  admit: "admits",
  deflect: "deflects",
  angry: "gets angry",
  calm: "",
};

export function Suspects() {
  const facts = useFacts();
  const { suspect, openSuspect } = useUI();
  const current = suspect ? byId(C.suspects, suspect) : undefined;
  if (current) return <Interview s={current} onBack={() => openSuspect(null)} />;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">Talk to the people who saw Mara last. Stuck? Ask questions — suspects drop leads.</p>
      {C.suspects
        .filter((s) => isVisible(s, facts))
        .map((s) => {
          const open = s.absentWhen && facts.has(s.absentWhen)
            ? 0
            : s.questions.filter((q) => isVisible(q, facts) && !facts.has(`asked:${q.id}`)).length;
          return (
            <button key={s.id} onClick={() => openSuspect(s.id)} className="flex items-center gap-4 rounded-xl border border-line bg-panel p-4 text-left">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-panel-2 text-3xl">{s.portrait}</span>
              <span className="flex-1">
                <span className="block font-semibold">{s.name}</span>
                <span className="block text-sm text-muted">{s.role}</span>
              </span>
              {open > 0 && <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-white">{open} new</span>}
            </button>
          );
        })}
    </div>
  );
}

function Interview({ s, onBack }: { s: Suspect; onBack: () => void }) {
  const facts = useFacts();
  const learn = useGame((st) => st.learn);
  const [playing, setPlaying] = useState<Question | null>(null);
  const absent = s.absentWhen && facts.has(s.absentWhen);
  const questions = s.questions.filter((q) => isVisible(q, facts));
  const unasked = questions.filter((q) => !facts.has(`asked:${q.id}`));
  const asked = s.questions.filter((q) => facts.has(`asked:${q.id}`));

  const ask = (q: Question) => {
    setPlaying(q);
    learn([`asked:${q.id}`, ...(q.grants ?? [])], s.name);
  };

  return (
    <div className="flex flex-col gap-4">
      <button onClick={onBack} className="self-start text-sm text-muted">
        ← All suspects
      </button>
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-panel-2 text-4xl">{s.portrait}</span>
        <div>
          <h2 className="text-xl font-semibold">{s.name}</h2>
          <p className="text-sm text-muted">{s.role}</p>
        </div>
      </div>
      <p className="text-sm">{s.bio}</p>

      {playing && (
        <div className="overflow-hidden rounded-xl border border-line bg-black">
          <div className="flex aspect-video flex-col items-center justify-center gap-2 bg-gradient-to-b from-neutral-900 to-black p-4 text-center">
            <span className="text-5xl">{s.portrait}</span>
            <span className="text-[10px] uppercase tracking-widest text-white/40">video clip placeholder</span>
          </div>
          <div className="border-t border-line p-3">
            <p className="text-xs text-muted">
              You: “{playing.text}”{playing.reaction && REACTION[playing.reaction] ? ` — ${s.name.split(" ")[0]} ${REACTION[playing.reaction]}` : ""}
            </p>
            <p className="mt-1 leading-relaxed">“{playing.answer}”</p>
          </div>
        </div>
      )}

      {absent ? (
        <p className="rounded-xl border border-accent bg-accent-soft p-3 text-sm">{s.absentText}</p>
      ) : (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs uppercase tracking-widest text-muted">Ask</h3>
          {unasked.length === 0 && <p className="text-sm text-muted">No new questions. Find more clues.</p>}
          {unasked.map((q) => (
            <button
              key={q.id}
              onClick={() => ask(q)}
              className={`rounded-lg border px-3 py-3 text-left text-sm ${q.confront ? "border-accent bg-accent-soft font-semibold" : "border-line bg-panel"}`}
            >
              {q.confront ? "⚡ " : ""}
              {q.text}
            </button>
          ))}
        </div>
      )}

      {asked.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs uppercase tracking-widest text-muted">File</h3>
          {asked.map((q) => (
            <button key={q.id} onClick={() => setPlaying(q)} className="rounded-lg bg-panel px-3 py-2 text-left text-sm">
              <span className="block text-xs text-muted">{q.text}</span>
              {q.summary}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
