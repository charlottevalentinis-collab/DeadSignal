"use client";

import { currentCase as C } from "@/engine/case";
import { useFacts, useGame } from "@/engine/store";
import { useUI } from "@/engine/ui";

const clock = (t: number) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export function Evidence() {
  const facts = useFacts();
  const foundAt = useGame((s) => s.foundAt);
  const found = C.clues
    .filter((c) => facts.has(`clue:${c.id}`))
    .sort((a, b) => (foundAt[b.id]?.at ?? 0) - (foundAt[a.id]?.at ?? 0));

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">
        {found.length} item{found.length === 1 ? "" : "s"} in the Evidence bag.
      </p>
      {found.map((c) => (
        <div key={c.id} className="rounded-xl border border-line bg-panel p-3">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-semibold">{c.name}</p>
            {foundAt[c.id] && (
              <p className="shrink-0 text-[11px] text-muted">
                {foundAt[c.id].where} · {clock(foundAt[c.id].at)}
              </p>
            )}
          </div>
          <p className="mt-1 text-sm text-muted">{c.description}</p>
        </div>
      ))}
    </div>
  );
}

export function Devices() {
  const facts = useFacts();
  const openDevice = useUI((s) => s.openDevice);
  const have = C.devices.filter((d) => facts.has(`have:${d.id}`));
  const icon = { phone: "📱", tablet: "📲", laptop: "💻" };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">Devices you have picked up or been handed. Find more at the scene and in interviews.</p>
      {have.length === 0 && <p className="text-sm">None yet — look around the apartment.</p>}
      {have.map((d) => {
        const locked = d.lock && !facts.has(`unlocked:${d.id}`);
        const wiped = d.wipedWhen && facts.has(d.wipedWhen);
        return (
          <button key={d.id} onClick={() => openDevice(d.id)} className="flex items-center gap-4 rounded-xl border border-line bg-panel p-4 text-left">
            <span className="text-3xl">{icon[d.kind]}</span>
            <span className="flex-1">
              <span className="block font-semibold">{d.name}</span>
              <span className="block text-sm text-muted">{wiped ? "Erased" : locked ? "Locked" : "Unlocked"}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
