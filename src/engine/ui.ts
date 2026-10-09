"use client";

import { create } from "zustand";

// Screen state that doesn't need saving (which tab, which room...).
export type Tab = "scene" | "suspects" | "evidence" | "devices" | "accuse";

interface UIState {
  tab: Tab;
  location: string;
  device: string | null;
  suspect: string | null;
  setTab: (t: Tab) => void;
  go: (location: string) => void;
  openDevice: (id: string | null) => void;
  openSuspect: (id: string | null) => void;
}

export const useUI = create<UIState>()((set) => ({
  tab: "scene",
  location: "living",
  device: null,
  suspect: null,
  setTab: (tab) => set({ tab, suspect: null }),
  go: (location) => set({ location }),
  openDevice: (device) => set({ device }),
  openSuspect: (suspect) => set({ suspect }),
}));
