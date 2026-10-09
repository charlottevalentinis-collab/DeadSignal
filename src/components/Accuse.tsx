"use client";

import { useState } from "react";
import { currentCase as C } from "@/engine/case";
import { isVisible } from "@/engine/rules";
import { useFacts, useGame } from "@/engine/store";
import type { Option } from "@/engine/types";
import { useUI } from "@/engine/ui";

type Part = "who" | "how" | "why";

export function Accuse() {
  const facts = useFacts();
  const accuse = useGame((s) => s.accuse);
  const wrongWho = useGame((s) => s.wrongWho);
  const setTab = useUI((s) => s.setTab);
  const [pick, setPick] = useState<Record<Part, string>>({ who: "", how: "", why: "" });
  const [proof, setProof] = useState<Record<Part, string>>({ who: "", how: "", why: "" });
  const [confirming, setConfirming] = useState(false);

  const options: Record<Part, Option[]> = {
    who: C.suspects.filter((s) => isVisible(s, facts)).map((s) => ({ id: s.id, label: `${s.name} — ${s.role}` })),
    how: C.accusation.how.filter((o) => isVisible(o, facts)),
    why: C.accusation.why.filter((o) => isVisible(o, facts)),
  };
  const clues = C.clues.filter((c) => facts.has(`clue:${c.id}`));
  const ready = (["who", "how", "why"] as Part[]).every((p) => pick[p] && proof[p]);

  const submit = () => {
    accuse({ ...pick, proof });
    setConfirming(false);
    setPick({ who: "", how: "", why: "" });
    setProof({ who: "", how: "", why: "" });
    setTab("scene");
  };

  const section = (part: Part, title: string) => (
    <section className="flex flex-col gap-2 rounded-xl border border-line bg-panel p-3">
      <h3 className="font-semibold">{title}</h3>
      {options[part].length === 0 && <p className="text-sm text-muted">Nothing discovered yet.</p>}
      {options[part].map((o) => (
        <label key={o.id} className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${pick[part] === o.id ? "border-accent bg-accent-soft" : "border-line"}`}>
          <input type="radio" name={part} className="mt-0.5 accent-[var(--accent)]" checked={pick[part] === o.id} onChange={() => setPick({ ...pick, [part]: o.id })} />
          {o.label}
        </label>
      ))}
      <select
        value={proof[part]}
        onChange={(e) => setProof({ ...proof, [part]: e.target.value })}
        className="rounded-lg border border-line bg-panel-2 p-3 text-sm"
        aria-label={`Evidence for ${title}`}
      >
        <option value="">Attach one piece of evidence…</option>
        {clues.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </section>
  );

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        Name the killer, the method and the motive, each backed by one piece of evidence. A wrong accusation has consequences.
        {wrongWho > 0 && <b className="text-accent"> You have already arrested the wrong person once. Another mistake and the killer escapes.</b>}
      </p>
      {section("who", "Who killed Mara?")}
      {section("how", "How?")}
      {section("why", "Why?")}
      {confirming ? (
        <div className="flex gap-2">
          <button onClick={() => setConfirming(false)} className="flex-1 rounded-lg border border-line py-3">
            Not yet
          </button>
          <button onClick={submit} className="flex-1 rounded-lg bg-accent py-3 font-semibold text-white">
            Make the arrest
          </button>
        </div>
      ) : (
        <button disabled={!ready} onClick={() => setConfirming(true)} className="rounded-lg bg-accent py-3 font-semibold text-white disabled:opacity-30">
          Accuse
        </button>
      )}
    </div>
  );
}
