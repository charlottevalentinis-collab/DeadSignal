"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { currentCase as C } from "@/engine/case";
import { useGame } from "@/engine/store";
import { useUI, type Tab } from "@/engine/ui";
import { Accuse } from "./Accuse";
import { DeviceView } from "./Device";
import { Ending } from "./Ending";
import { Devices, Evidence } from "./Evidence";
import { Scene } from "./Scene";
import { Suspects } from "./Suspects";
import { Sheet, Toast } from "./ui";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "scene", label: "Scene", icon: "🏠" },
  { id: "suspects", label: "Suspects", icon: "🗣️" },
  { id: "devices", label: "Devices", icon: "📱" },
  { id: "evidence", label: "Evidence", icon: "🗂️" },
  { id: "accuse", label: "Accuse", icon: "⚖️" },
];

/** Saved games live in the browser, so wait until we're in the browser. */
function useHydrated() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready;
}

export function Game() {
  const hydrated = useHydrated();
  const { start, checkStuck, ending, lastVerdict, dismissVerdict } = useGame();
  const { tab, setTab, go } = useUI();

  useEffect(() => {
    start();
    const t = setInterval(checkStuck, 20_000);
    return () => clearInterval(t);
  }, [start, checkStuck]);

  if (!hydrated) return null;
  if (ending) return <Ending ending={ending} />;

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-bg/90 px-4 py-3 backdrop-blur">
        <Link href="/" className="text-sm text-muted">
          ← Menu
        </Link>
        <span className="typewriter text-sm">{C.title}</span>
        <span className="w-12" />
      </header>

      <main className="flex-1 px-4 pb-28 pt-4">
        {tab === "scene" && <Scene />}
        {tab === "suspects" && <Suspects />}
        {tab === "devices" && <Devices />}
        {tab === "evidence" && <Evidence />}
        {tab === "accuse" && <Accuse />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex max-w-2xl">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${tab === t.id ? "text-text" : "text-muted"}`}
            >
              <span className={`text-xl ${tab === t.id ? "" : "opacity-60 grayscale"}`}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <DeviceView />
      <Toast />

      <Sheet open={lastVerdict === "twist"} onClose={dismissVerdict} title={C.twist.title}>
        {C.twist.text.map((p, i) => (
          <p key={i} className="mb-3 leading-relaxed">
            {p}
          </p>
        ))}
        <button
          onClick={() => {
            dismissVerdict();
            setTab("scene");
            go(C.twist.location);
          }}
          className="mt-2 w-full rounded-lg bg-accent py-3 font-semibold text-white"
        >
          Go to the new location
        </button>
      </Sheet>

      <Sheet open={lastVerdict === "released"} onClose={dismissVerdict} title={C.endings.released.title}>
        {C.endings.released.text.map((p, i) => (
          <p key={i} className="mb-3 leading-relaxed">
            {p}
          </p>
        ))}
        <button onClick={dismissVerdict} className="mt-2 w-full rounded-lg border border-line py-3">
          Back to the investigation
        </button>
      </Sheet>
    </div>
  );
}
