"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { currentCase as C, byId } from "./case";
import { computeRank, deriveFacts, judge, keyShare, nextHint, type AccusationInput, type Outcome, type Rank } from "./rules";
import type { Fact } from "./types";

/** Minutes without any new discovery before a suspect offers a lead. */
export const STUCK_MINUTES = 3;

export interface Ending {
  kind: "solved" | "escaped";
  rank: Rank;
  durationS: number;
}

interface GameState {
  /** Facts the player has earned directly; rules derive the rest. */
  base: Fact[];
  foundAt: Record<string, { where: string; at: number }>;
  startedAt: number | null;
  lastProgressAt: number;
  wrongWho: number;
  released: number;
  tries: Record<string, number>;
  lastVerdict: Outcome | null;
  ending: Ending | null;
  telemetrySent: boolean;
  toast: string | null;

  start: () => void;
  reset: () => void;
  /** Adds facts; returns true if anything was new. */
  learn: (facts: Fact[], where?: string) => boolean;
  tryCode: (deviceId: string, code: string) => boolean;
  checkStuck: () => void;
  accuse: (a: AccusationInput) => Outcome;
  dismissVerdict: () => void;
  markTelemetrySent: () => void;
  clearToast: () => void;
}

const fresh = () => ({
  base: [...C.startFacts],
  foundAt: {},
  startedAt: null,
  lastProgressAt: Date.now(),
  wrongWho: 0,
  released: 0,
  tries: {},
  lastVerdict: null,
  ending: null,
  telemetrySent: false,
  toast: null,
});

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      ...fresh(),

      start: () => {
        if (get().startedAt === null) set({ startedAt: Date.now(), lastProgressAt: Date.now() });
      },

      reset: () => set({ ...fresh(), startedAt: Date.now() }),

      learn: (facts, where = "") => {
        const { base, foundAt } = get();
        const known = new Set(base);
        const added = facts.filter((f) => !known.has(f));
        if (added.length === 0) return false;
        const now = Date.now();
        const newFound = { ...foundAt };
        const newClues: string[] = [];
        for (const f of added) {
          if (f.startsWith("clue:")) {
            const id = f.slice(5);
            newFound[id] = { where, at: now };
            newClues.push(byId(C.clues, id)?.name ?? id);
          }
        }
        set({
          base: [...base, ...added],
          foundAt: newFound,
          lastProgressAt: now,
          toast: newClues.length ? `Added to Evidence bag: ${newClues.join(", ")}` : get().toast,
        });
        return true;
      },

      tryCode: (deviceId, code) => {
        const device = byId(C.devices, deviceId);
        if (!device?.lock) return true;
        if (code === device.lock.code) {
          get().learn([`unlocked:${deviceId}`]);
          return true;
        }
        set({ tries: { ...get().tries, [deviceId]: (get().tries[deviceId] ?? 0) + 1 } });
        return false;
      },

      checkStuck: () => {
        const { lastProgressAt, ending } = get();
        if (ending || Date.now() - lastProgressAt < STUCK_MINUTES * 60_000) return;
        const facts = deriveFacts(get().base, C.rules);
        const q = nextHint(C, facts);
        if (q) {
          get().learn([`hint:${q}`]);
          set({ toast: "A suspect has something new to tell you." });
        } else {
          set({ lastProgressAt: Date.now() });
        }
      },

      accuse: (a) => {
        const s = get();
        const outcome = judge(C, a, s.wrongWho);
        const durationS = Math.round((Date.now() - (s.startedAt ?? Date.now())) / 1000);
        const share = keyShare(C, deriveFacts(s.base, C.rules));
        if (outcome === "solved" || outcome === "escaped") {
          const wrongWho = s.wrongWho + (outcome === "escaped" ? 1 : 0);
          set({
            wrongWho,
            lastVerdict: outcome,
            ending: {
              kind: outcome,
              durationS,
              rank: computeRank({ escaped: outcome === "escaped", wrongWho, released: s.released, keyShare: share }),
            },
          });
        } else if (outcome === "twist") {
          set({ wrongWho: s.wrongWho + 1, lastVerdict: outcome });
          get().learn(["event:twist"]);
        } else {
          set({ released: s.released + 1, lastVerdict: outcome, lastProgressAt: Date.now() });
        }
        return outcome;
      },

      dismissVerdict: () => set({ lastVerdict: null }),
      markTelemetrySent: () => set({ telemetrySent: true }),
      clearToast: () => set({ toast: null }),
    }),
    {
      name: `dead-signal:${C.id}`,
      partialize: (s) => {
        const { toast, ...rest } = s;
        void toast;
        return rest;
      },
    },
  ),
);

/** All known facts, including the ones derived by the rules. */
export function useFacts(): Set<Fact> {
  const base = useGame((s) => s.base);
  return useMemo(() => deriveFacts(base, C.rules), [base]);
}
