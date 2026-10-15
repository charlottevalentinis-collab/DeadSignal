import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { currentCase as C } from "../src/engine/case";
import { computeRank, debrief, deriveFacts, isVisible, judge, nextHint } from "../src/engine/rules";
import type { AppId, Fact } from "../src/engine/types";

describe("clue engine", () => {
  it("chains rules until nothing new appears", () => {
    const facts = deriveFacts(["a"], [
      { when: ["b"], then: ["c"] },
      { when: ["a"], then: ["b"] },
    ]);
    expect([...facts].sort()).toEqual(["a", "b", "c"]);
  });

  it("gates content on any of several facts, and hides it again", () => {
    const item = { requires: ["x", "y"], hiddenWhen: "gone" };
    expect(isVisible(item, new Set(["y"]))).toBe(true);
    expect(isVisible(item, new Set())).toBe(false);
    expect(isVisible(item, new Set(["x", "gone"]))).toBe(false);
  });
});

describe("accusation outcomes (PRD table)", () => {
  const right = { who: "nina", how: "pills_tea", why: "stop_report", proof: { who: "nina_location", how: "tea_cups", why: "bank_alert" } };

  it("right who, how, why with proof → solved", () => {
    expect(judge(C, right, 0)).toBe("solved");
  });
  it("right who, wrong how → released", () => {
    expect(judge(C, { ...right, how: "push" }, 0)).toBe("released");
  });
  it("right answers but proof that proves nothing → released", () => {
    expect(judge(C, { ...right, proof: { ...right.proof, why: "spare_key" } }, 0)).toBe("released");
  });
  it("wrong who first time → twist, second time → escaped", () => {
    expect(judge(C, { ...right, who: "daniel" }, 0)).toBe("twist");
    expect(judge(C, { ...right, who: "theo" }, 1)).toBe("escaped");
  });
});

describe("prosecutor's notes", () => {
  const right = { who: "nina", how: "pills_tea", why: "stop_report", proof: { who: "nina_location", how: "tea_cups", why: "bank_alert" } };

  it("marks each part right or wrong", () => {
    const d = debrief(C, { ...right, how: "push", why: "sale" });
    expect(d.who).toEqual({ right: true, proven: true });
    expect(d.how.right).toBe(false);
    expect(d.why.right).toBe(false);
  });

  it("flags a right answer backed by evidence that proves nothing", () => {
    const d = debrief(C, { ...right, proof: { ...right.proof, how: "spare_key" } });
    expect(d.how).toEqual({ right: true, proven: false });
  });

  it("has a tip for every part", () => {
    for (const p of ["who", "how", "why"] as const) expect(C.accusation.hints[p].length).toBeGreaterThan(10);
  });
});

describe("rank", () => {
  it("rewards a clean, thorough solve and punishes mistakes", () => {
    expect(computeRank({ escaped: false, wrongWho: 0, released: 0, keyShare: 1 })).toBe("Inspector");
    expect(computeRank({ escaped: false, wrongWho: 1, released: 0, keyShare: 1 })).toBe("Sergeant");
    expect(computeRank({ escaped: true, wrongWho: 2, released: 0, keyShare: 1 })).toBe("Rookie");
  });
});

describe("case file integrity", () => {
  const clueIds = new Set(C.clues.map((c) => c.id));
  const deviceIds = new Set(C.devices.map((d) => d.id));
  const locationIds = new Set(C.locations.map((l) => l.id));
  const questionIds = new Set(C.suspects.flatMap((s) => s.questions.map((q) => q.id)));
  const items = C.devices.flatMap((d) => Object.values(d.apps).flat() as { id: string; clue?: string }[]);

  it("only references things that exist", () => {
    for (const l of C.locations) {
      l.exits.forEach((e) => expect(locationIds, `exit ${e}`).toContain(e));
      for (const h of l.hotspots) {
        if (h.clue) expect(clueIds, `hotspot ${h.id}`).toContain(h.clue);
        if (h.device) expect(deviceIds, `hotspot ${h.id}`).toContain(h.device);
      }
    }
    items.forEach((i) => i.clue && expect(clueIds, `item ${i.id}`).toContain(i.clue));
    C.hints.forEach((h) => expect(questionIds).toContain(h.question));
    const { proof, keyClues, solution } = C.accusation;
    [...proof.who, ...proof.how, ...proof.why, ...keyClues].forEach((id) => expect(clueIds, id).toContain(id));
    expect(C.suspects.map((s) => s.id)).toContain(solution.who);
  });

  it("only points to pictures that exist", () => {
    const images = [
      ...C.locations.flatMap((l) => [l.image, ...l.hotspots.map((h) => h.image)]),
      ...C.devices.flatMap((d) => (d.apps.photos ?? []).map((p) => p.image)),
      ...C.suspects.map((s) => s.image),
    ].filter((i): i is string => !!i);
    expect(images.length).toBeGreaterThan(0);
    images.forEach((i) => expect(existsSync(join(__dirname, "../public", i)), i).toBe(true));
  });

  it("gives every clue at least one place to be found", () => {
    const sources = new Set([
      ...C.startFacts,
      ...C.locations.flatMap((l) => l.hotspots.map((h) => `clue:${h.clue}`)),
      ...items.map((i) => `clue:${i.clue}`),
    ]);
    C.clues.forEach((c) => expect(sources, c.id).toContain(`clue:${c.id}`));
  });

  it("backs each key fact of the solution with at least two clues", () => {
    const { proof } = C.accusation;
    expect(proof.who.length).toBeGreaterThanOrEqual(2);
    expect(proof.how.length).toBeGreaterThanOrEqual(2);
    expect(proof.why.length).toBeGreaterThanOrEqual(2);
  });
});

/** Where each lock's code is revealed (only the test needs to know). */
const CODE_FROM: Record<string, string> = {
  mara_laptop: "clue:kitchen_note",
  mara_phone: "clue:phone_code",
  nina_tablet: "clue:nina_card",
};

/** A player who explores everything they can, minus some actions. */
function exhaust(start: Fact[], skip: Set<string> = new Set()): Set<Fact> {
  let base = new Set(start);
  for (;;) {
    const facts = deriveFacts(base, C.rules);
    const before = base.size;
    const add = (f: Fact) => base.add(f);
    for (const l of C.locations.filter((l) => isVisible(l, facts))) {
      for (const h of l.hotspots.filter((h) => isVisible(h, facts))) {
        if (h.clue) add(`clue:${h.clue}`);
        if (h.device) add(`have:${h.device}`);
      }
    }
    for (const d of C.devices) {
      if (!facts.has(`have:${d.id}`) || (d.wipedWhen && facts.has(d.wipedWhen))) continue;
      if (d.lock && !facts.has(`unlocked:${d.id}`)) {
        if (facts.has(CODE_FROM[d.id])) add(`unlocked:${d.id}`);
        continue;
      }
      for (const app of Object.keys(d.apps) as AppId[]) {
        for (const item of d.apps[app] ?? []) {
          if (isVisible(item, facts) && item.clue) add(`clue:${item.clue}`);
        }
      }
    }
    for (const s of C.suspects) {
      if (s.absentWhen && facts.has(s.absentWhen)) continue;
      for (const q of s.questions.filter((q) => isVisible(q, facts) && !skip.has(q.id))) {
        add(`asked:${q.id}`);
        q.grants?.forEach(add);
      }
    }
    if (base.size === before) {
      const hint = nextHint(C, deriveFacts(base, C.rules));
      if (!hint) return deriveFacts(base, C.rules);
      add(`hint:${hint}`);
    }
    base = new Set(base);
  }
}

describe("the case can be solved", () => {
  const { solution } = C.accusation;
  const reachable = (facts: Set<Fact>) => ({
    how: C.accusation.how.find((o) => o.id === solution.how)!,
    why: C.accusation.why.find((o) => o.id === solution.why)!,
    proof: (ids: string[]) => ids.some((id) => facts.has(`clue:${id}`)),
  });

  it("first time, by a thorough player", () => {
    const facts = exhaust(C.startFacts);
    const r = reachable(facts);
    expect(isVisible(r.how, facts)).toBe(true);
    expect(isVisible(r.why, facts)).toBe(true);
    C.accusation.keyClues.forEach((k) => expect(facts, k).toContain(`clue:${k}`));
    expect(facts).toContain("asked:n_confront_location");
  });

  it("after the twist, even without Nina's phone", () => {
    const facts = exhaust([...C.startFacts, "event:twist"], new Set(["n_phone"]));
    const r = reachable(facts);
    expect(isVisible(r.how, facts)).toBe(true);
    expect(isVisible(r.why, facts)).toBe(true);
    expect(r.proof(C.accusation.proof.who)).toBe(true);
    expect(r.proof(C.accusation.proof.how)).toBe(true);
    expect(r.proof(C.accusation.proof.why)).toBe(true);
  });
});
