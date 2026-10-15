"use client";

import { useState } from "react";
import { byId, currentCase as C } from "@/engine/case";
import { isVisible } from "@/engine/rules";
import { useFacts, useGame } from "@/engine/store";
import type { Hotspot } from "@/engine/types";
import { useUI } from "@/engine/ui";
import { Picture, Sheet } from "./ui";

// Crime scene: one drawn illustration per viewpoint with tappable
// hotspots. Later this becomes a 360° photo viewer with the same hotspots.
export function Scene() {
  const facts = useFacts();
  const learn = useGame((s) => s.learn);
  const { location, go, openDevice } = useUI();
  const [closeup, setCloseup] = useState<Hotspot | null>(null);

  const visible = C.locations.filter((l) => isVisible(l, facts));
  const here = visible.find((l) => l.id === location) ?? visible[0];
  const areas = [...new Set(visible.map((l) => l.area))];

  const tap = (h: Hotspot) => {
    setCloseup(h);
    const gained = [...(h.grants ?? [])];
    if (h.clue) gained.push(`clue:${h.clue}`);
    if (h.device) gained.push(`have:${h.device}`);
    learn(gained, here.name);
  };

  const close = () => {
    const device = closeup?.device;
    setCloseup(null);
    if (device) openDevice(device);
  };

  return (
    <div className="flex flex-col gap-3">
      {areas.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {areas.map((a) => (
            <button
              key={a}
              onClick={() => go(visible.find((l) => l.area === a)!.id)}
              className={`shrink-0 rounded-full border px-3 py-1 text-sm ${
                here.area === a ? "border-accent bg-accent-soft" : "border-line text-muted"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      )}

      <div>
        <p className="text-xs uppercase tracking-widest text-muted">{here.area}</p>
        <h2 className="text-xl font-semibold">{here.name}</h2>
        <p className="mt-1 text-sm text-muted">{here.description}</p>
      </div>

      <div
        className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-line"
        style={{ background: here.backdrop }}
      >
        {here.image && <Picture src={here.image} alt={here.name} className="absolute inset-0 h-full w-full object-cover" />}
        <span className="absolute left-3 top-2 text-[10px] uppercase tracking-widest text-white/40">
          illustration · 360° photo coming
        </span>
        {here.hotspots
          .filter((h) => isVisible(h, facts))
          .map((h) => {
            const seen = (h.clue && facts.has(`clue:${h.clue}`)) || (h.device && facts.has(`have:${h.device}`));
            return (
              <button
                key={h.id}
                onClick={() => tap(h)}
                aria-label={h.label}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                style={{ left: `${h.x}%`, top: `${h.y}%` }}
              >
                <span
                  className={`block h-6 w-6 rounded-full border-2 ${
                    seen ? "border-white/40 bg-white/10" : "hotspot border-white/80 bg-white/20"
                  }`}
                />
                {seen && <span className="mt-1 whitespace-nowrap text-[10px] text-white/60">{h.label}</span>}
              </button>
            );
          })}
      </div>

      {here.exits.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {here.exits.map((id) => (
            <button key={id} onClick={() => go(id)} className="rounded-lg border border-line bg-panel px-3 py-2 text-sm">
              → {byId(C.locations, id)?.name}
            </button>
          ))}
        </div>
      )}

      <Sheet open={!!closeup} onClose={close} title={closeup?.label ?? ""}>
        {closeup?.image && (
          <Picture src={closeup.image} alt={closeup.label} className="mb-3 aspect-[4/3] w-full rounded-lg border border-line object-cover" />
        )}
        <p className="leading-relaxed">{closeup?.closeup}</p>
        {closeup?.device && (
          <button onClick={close} className="mt-4 w-full rounded-lg bg-accent py-3 font-semibold text-white">
            Pick it up
          </button>
        )}
      </Sheet>
    </div>
  );
}
