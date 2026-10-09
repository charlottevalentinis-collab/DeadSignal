import type { CaseFile, Fact, Gated, Requirement, Rule } from "./types";

// The clue engine. Pure functions only, so they are easy to test.

/** Applies every rule until nothing new can be derived. */
export function deriveFacts(base: Iterable<Fact>, rules: Rule[]): Set<Fact> {
  const facts = new Set(base);
  let changed = true;
  while (changed) {
    changed = false;
    for (const rule of rules) {
      if (!rule.when.every((f) => facts.has(f))) continue;
      for (const f of rule.then) {
        if (!facts.has(f)) {
          facts.add(f);
          changed = true;
        }
      }
    }
  }
  return facts;
}

export function meets(req: Requirement | undefined, facts: Set<Fact>): boolean {
  if (req === undefined) return true;
  return Array.isArray(req) ? req.some((f) => facts.has(f)) : facts.has(req);
}

export function isVisible(item: Gated, facts: Set<Fact>): boolean {
  if (item.hiddenWhen && facts.has(item.hiddenWhen)) return false;
  return meets(item.requires, facts);
}

/** First stuck-hint question whose target area is still unexplored. */
export function nextHint(c: CaseFile, facts: Set<Fact>): string | undefined {
  return c.hints.find(
    (h) => isVisible(h, facts) && !facts.has(h.until) && !facts.has(`hint:${h.question}`),
  )?.question;
}

export type Outcome = "solved" | "released" | "twist" | "escaped";

export interface AccusationInput {
  who: string;
  how: string;
  why: string;
  proof: { who?: string; how?: string; why?: string };
}

/**
 * Judges an accusation, following the PRD table:
 * right who/how/why with proof → solved; right who otherwise → released;
 * wrong who → twist the first time, killer escapes the second time.
 */
export function judge(c: CaseFile, a: AccusationInput, wrongWhoSoFar: number): Outcome {
  const { solution, proof } = c.accusation;
  if (a.who !== solution.who) return wrongWhoSoFar === 0 ? "twist" : "escaped";
  const proven =
    a.how === solution.how &&
    a.why === solution.why &&
    proof.who.includes(a.proof.who ?? "") &&
    proof.how.includes(a.proof.how ?? "") &&
    proof.why.includes(a.proof.why ?? "");
  return proven ? "solved" : "released";
}

export const RANKS = ["Rookie", "Constable", "Sergeant", "Detective", "Inspector"] as const;
export type Rank = (typeof RANKS)[number];

/** Rank from mistakes and the share of key clues found. */
export function computeRank(opts: {
  escaped: boolean;
  wrongWho: number;
  released: number;
  keyShare: number;
}): Rank {
  if (opts.escaped) return "Rookie";
  const score = 40 + opts.keyShare * 60 - opts.wrongWho * 30 - opts.released * 10;
  if (score >= 90) return "Inspector";
  if (score >= 75) return "Detective";
  if (score >= 60) return "Sergeant";
  if (score >= 40) return "Constable";
  return "Rookie";
}

export function keyShare(c: CaseFile, facts: Set<Fact>): number {
  const keys = c.accusation.keyClues;
  return keys.filter((k) => facts.has(`clue:${k}`)).length / keys.length;
}
