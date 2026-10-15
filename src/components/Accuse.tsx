"use client";

import { useState } from "react";
import { currentCase as C } from "@/engine/case";
import { debrief, isVisible, PARTS, type Part } from "@/engine/rules";
import { useFacts, useGame } from "@/engine/store";
import type { Option } from "@/engine/types";
import { useUI } from "@/engine/ui";

const TITLES: Record<Part, string> = { who: "Who", how: "How", why: "Why" };

const labelOf = (part: Part, id: string) =>
  part === "who"
    ? C.suspects.find((s) => s.id === id)?.name
    : C.accusation[part].find((o) => o.id === id)?.label;

/**
 * The prosecutor's verdict on the latest accusation: what held up, what
 * didn't, and a nudge for every part that was wrong.
 */
export function ProsecutorNotes() {
  const last = useGame((s) => s.attempts.at(-1));
  if (!last) return null;
  const d = debrief(C, last);
  const clueName = (id?: string) => C.clues.find((c) => c.id === id)?.name ?? "nothing";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-panel-2 p-3">
      <p className="text-xs uppercase tracking-widest text-muted">Prosecutor&apos;s notes on your last accusation</p>
      {PARTS.map((p) => {
        const r = d[p];
        return (
          <div key={p} className="text-sm">
            <p>
              <span className={r.right ? "text-good" : "text-accent"}>{r.right ? "✓" : "✗"}</span>{" "}
              <b>{TITLES[p]}:</b> {labelOf(p, last[p])}
            </p>
            {r.right && (
              <p className="ml-5 text-muted">
                {r.proven ? "✓" : "✗"} Evidence: {clueName(last.proof[p])}
                {r.proven ? "" : " — this doesn't prove it. Attach something that points to it directly."}
              </p>
            )}
            {!r.right && <p className="ml-5 text-muted">💡 {C.accusation.hints[p]}</p>}
          </div>
        );
      })}
    </div>
  );
}

export function Accuse() {
  const facts = useFacts();
  const accuse = useGame((s) => s.accuse);
  const wrongWho = useGame((s) => s.wrongWho);
  const setTab = useUI((s) => s.setTab);
  const [pick, setPick] = useState<Record<Part, string>>({ who: "", how: "", why: "" });
  const [proof, setProof] = useState<Record<Part, string>>({ who: "", how: "", why: "" });
  const [confirming, setConfirming] = useState(false);
  const attempts = useGame((s) => s.attempts);
  const ruledOut = (part: Part, id: string) => attempts.some((a) => a[part] === id && !debrief(C, a)[part].right);

  const options: Record<Part, Option[]> = {
    who: C.suspects.filter((s) => isVisible(s, facts)).map((s) => ({ id: s.id, label: `${s.name} — ${s.role}` })),
    how: C.accusation.how.filter((o) => isVisible(o, facts)),
    why: C.accusation.why.filter((o) => isVisible(o, facts)),
  };
  const clues = C.clues.filter((c) => facts.has(`clue:${c.id}`));
  const ready = PARTS.every((p) => pick[p] && proof[p]);

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
      {options[part].map((o) => {
        const out = ruledOut(part, o.id);
        return (
          <label
            key={o.id}
            className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${pick[part] === o.id ? "border-accent bg-accent-soft" : "border-line"} ${out ? "opacity-45" : ""}`}
          >
            <input type="radio" name={part} className="mt-0.5 accent-[var(--accent)]" checked={pick[part] === o.id} onChange={() => setPick({ ...pick, [part]: o.id })} />
            <span className={out ? "line-through" : ""}>{o.label}</span>
            {out && <span className="ml-auto shrink-0 text-[11px] uppercase text-muted">ruled out</span>}
          </label>
        );
      })}
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
      <ProsecutorNotes />
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
