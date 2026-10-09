// The shape of a case file. A case is pure data: adding a new case means
// writing a new JSON file, never new code.
//
// Everything in the game is driven by "facts" — short strings such as
// "clue:tea_cups" or "asked:n_where". Content becomes visible when the
// fact named in its `requires` field is known, and `rules` derive new facts
// from existing ones ("when clue X is found, unlock Y").

export type Fact = string;

/** A fact, or a list of facts where ANY one is enough. */
export type Requirement = Fact | Fact[];

export interface Gated {
  /** Hidden until this fact (or any of these facts) is known. */
  requires?: Requirement;
  /** Hidden again once this fact is known (e.g. a suspect who fled). */
  hiddenWhen?: Fact;
}

export interface CaseFile {
  id: string;
  title: string;
  tagline: string;
  intro: string[];
  startFacts: Fact[];
  locations: Location[];
  devices: Device[];
  suspects: Suspect[];
  clues: Clue[];
  rules: Rule[];
  hints: Hint[];
  accusation: Accusation;
  endings: Endings;
  /** What happens after the first wrong suspect is arrested. */
  twist: { title: string; text: string[]; location: string };
}

export interface Location extends Gated {
  id: string;
  name: string;
  area: string;
  description: string;
  /** CSS background used until real 360° photos exist. */
  backdrop: string;
  exits: string[];
  hotspots: Hotspot[];
}

export interface Hotspot extends Gated {
  id: string;
  label: string;
  /** Position on the backdrop, in percent. */
  x: number;
  y: number;
  closeup: string;
  clue?: string;
  device?: string;
  grants?: Fact[];
}

export interface Clue {
  id: string;
  name: string;
  description: string;
  /** Key clues count towards the detective rank. */
  key?: boolean;
}

export interface Rule {
  when: Fact[];
  then: Fact[];
}

export interface Hint extends Gated {
  /** Question that appears when the player is stuck... */
  question: string;
  /** ...as long as this fact is still unknown. */
  until: Fact;
}

export type DeviceKind = "phone" | "tablet" | "laptop";

export interface Device extends Gated {
  id: string;
  name: string;
  owner: string;
  kind: DeviceKind;
  wallpaper: string;
  lock?: { code: string; hint: string };
  /** After this fact, the device is erased (its clues stay in the bag). */
  wipedWhen?: Fact;
  apps: DeviceApps;
}

interface Item extends Gated {
  id: string;
  /** Opening this item puts the clue in the Evidence bag. */
  clue?: string;
  grants?: Fact[];
}

export interface Thread extends Item {
  contact: string;
  deleted?: boolean;
  messages: { from: "me" | "them"; text: string; time: string }[];
}
export interface Call extends Item {
  contact: string;
  direction: "in" | "out" | "missed";
  time: string;
  duration: string;
  voicemail?: string;
}
export interface Photo extends Item {
  caption: string;
  time: string;
  place: string;
  scene: string;
}
export interface Email extends Item {
  folder: "inbox" | "sent" | "trash";
  from: string;
  subject: string;
  time: string;
  body: string;
}
export interface Note extends Item {
  title: string;
  body: string;
}
export interface CalendarEntry extends Item {
  time: string;
  title: string;
  detail: string;
}
export interface Post extends Item {
  author: string;
  time: string;
  text: string;
}
export interface MapEntry extends Item {
  day: string;
  time: string;
  place: string;
}
export interface BrowserEntry extends Item {
  time: string;
  query: string;
}

export interface DeviceApps {
  messages?: Thread[];
  calls?: Call[];
  photos?: Photo[];
  email?: Email[];
  notes?: Note[];
  calendar?: CalendarEntry[];
  social?: Post[];
  maps?: MapEntry[];
  browser?: BrowserEntry[];
}

export type AppId = keyof DeviceApps;

export interface Suspect extends Gated {
  id: string;
  name: string;
  role: string;
  portrait: string;
  bio: string;
  /** After this fact the suspect can no longer be interviewed. */
  absentWhen?: Fact;
  absentText?: string;
  questions: Question[];
}

export type Reaction = "calm" | "admit" | "deflect" | "angry";

export interface Question extends Gated {
  id: string;
  text: string;
  /** Subtitles for the video clip (placeholder until the FMV shoot). */
  answer: string;
  /** Written into the suspect's file once asked. */
  summary: string;
  confront?: boolean;
  reaction?: Reaction;
  grants?: Fact[];
}

export interface Option extends Gated {
  id: string;
  label: string;
}

export interface Accusation {
  how: Option[];
  why: Option[];
  solution: { who: string; how: string; why: string };
  /** Clues that count as proof for each part of the solution. */
  proof: { who: string[]; how: string[]; why: string[] };
  keyClues: string[];
}

export interface Endings {
  solved: { title: string; text: string[] };
  released: { title: string; text: string[] };
  escaped: { title: string; text: string[] };
  solution: string[];
}
