"use client";

import { useState } from "react";
import { byId, currentCase as C } from "@/engine/case";
import { isVisible } from "@/engine/rules";
import { useFacts, useGame } from "@/engine/store";
import type {
  AppId,
  BrowserEntry,
  CalendarEntry,
  Call,
  Device as DeviceT,
  Email,
  Gated,
  MapEntry,
  Note,
  Photo,
  Post,
  Thread,
} from "@/engine/types";
import { useUI } from "@/engine/ui";
import { Picture } from "./ui";

// The fictional OS ("Signal OS"): one set of apps reused for every device,
// skinned by the owner's wallpaper. No real brands.

type AnyItem = Gated & { id: string; clue?: string; grants?: string[] };

interface AppDef<T> {
  label: string;
  icon: string;
  row: (item: T) => { title: string; sub?: string; time?: string };
  detail: (item: T) => React.ReactNode;
}

const APPS: { [K in AppId]-?: AppDef<NonNullable<DeviceT["apps"][K]>[number]> } = {
  messages: {
    label: "Messages",
    icon: "💬",
    row: (t: Thread) => ({ title: t.contact, sub: t.messages.at(-1)?.text, time: t.messages.at(-1)?.time }),
    detail: (t: Thread) => (
      <div className="flex flex-col gap-2">
        {t.messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.from === "me" ? "items-end" : "items-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.from === "me" ? "bg-sky-600 text-white" : "bg-white/10"}`}>
              {m.text}
            </div>
            <span className="mt-0.5 text-[10px] opacity-50">{m.time}</span>
          </div>
        ))}
      </div>
    ),
  },
  calls: {
    label: "Phone",
    icon: "📞",
    row: (c: Call) => ({
      title: c.contact,
      sub: `${c.direction === "in" ? "Incoming" : c.direction === "out" ? "Outgoing" : "Missed"} · ${c.duration}${c.voicemail ? " · voicemail" : ""}`,
      time: c.time,
    }),
    detail: (c: Call) => (
      <div className="flex flex-col gap-3 text-sm">
        <p>
          {c.direction === "missed" ? "Missed call" : c.direction === "in" ? "Incoming call" : "Outgoing call"} from/to{" "}
          <b>{c.contact}</b> at {c.time}, duration {c.duration}.
        </p>
        {c.voicemail && (
          <div className="rounded-xl bg-white/10 p-3">
            <p className="mb-1 text-xs uppercase opacity-60">▶ Voicemail (audio placeholder)</p>
            <p className="italic">“{c.voicemail}”</p>
          </div>
        )}
      </div>
    ),
  },
  photos: {
    label: "Gallery",
    icon: "🖼️",
    row: (p: Photo) => ({ title: p.caption, sub: p.place, time: p.time }),
    detail: (p: Photo) => (
      <div className="flex flex-col gap-3 text-sm">
        <PhotoImage p={p} />
        <p>{p.caption}</p>
        <p className="opacity-60">
          📅 {p.time} · 📍 {p.place}
        </p>
      </div>
    ),
  },
  email: {
    label: "Mail",
    icon: "✉️",
    row: (e: Email) => ({ title: e.subject, sub: `${e.folder === "inbox" ? "From" : e.folder === "sent" ? "Sent" : "Trash"} · ${e.from}`, time: e.time }),
    detail: (e: Email) => (
      <div className="flex flex-col gap-2 text-sm">
        <p className="font-semibold">{e.subject}</p>
        <p className="opacity-60">
          {e.from} · {e.time} · {e.folder}
        </p>
        <p className="whitespace-pre-line leading-relaxed">{e.body}</p>
      </div>
    ),
  },
  notes: {
    label: "Notes",
    icon: "📝",
    row: (n: Note) => ({ title: n.title, sub: n.body.split("\n")[0] }),
    detail: (n: Note) => <p className="typewriter whitespace-pre-line text-sm leading-relaxed">{n.body}</p>,
  },
  calendar: {
    label: "Calendar",
    icon: "📅",
    row: (c: CalendarEntry) => ({ title: c.title, time: c.time }),
    detail: (c: CalendarEntry) => (
      <div className="text-sm">
        <p className="font-semibold">{c.title}</p>
        <p className="opacity-60">{c.time}</p>
        <p className="mt-2">{c.detail}</p>
      </div>
    ),
  },
  social: {
    label: "Circle",
    icon: "🌐",
    row: (p: Post) => ({ title: p.author, sub: p.text, time: p.time }),
    detail: (p: Post) => (
      <div className="text-sm">
        <p className="font-semibold">{p.author}</p>
        <p className="opacity-60">{p.time}</p>
        <p className="mt-2 leading-relaxed">{p.text}</p>
      </div>
    ),
  },
  maps: {
    label: "Places",
    icon: "📍",
    row: (m: MapEntry) => ({ title: m.place, sub: m.day, time: m.time }),
    detail: (m: MapEntry) => (
      <div className="text-sm">
        <p className="font-semibold">{m.place}</p>
        <p className="opacity-60">
          {m.day} · {m.time}
        </p>
      </div>
    ),
  },
  browser: {
    label: "Browser",
    icon: "🔍",
    row: (b: BrowserEntry) => ({ title: b.query, time: b.time }),
    detail: (b: BrowserEntry) => (
      <div className="text-sm">
        <p className="opacity-60">Searched at {b.time}</p>
        <p className="mt-2 rounded-full bg-white/10 px-4 py-2">🔍 {b.query}</p>
      </div>
    ),
  },
};

function PhotoImage({ p }: { p: Photo }) {
  return p.image ? (
    <Picture src={p.image} alt={p.caption} className="aspect-square w-full rounded-xl object-cover" />
  ) : (
    <div className="flex aspect-square items-center justify-center rounded-xl bg-white/10 p-6 text-center">{p.scene}</div>
  );
}

/** Gallery home: a grid of photos, each with its description underneath. */
function PhotoGrid({ photos, open }: { photos: Photo[]; open: (p: Photo) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {photos.map((p) => (
        <button key={p.id} onClick={() => open(p)} className="flex flex-col gap-1 text-left">
          <PhotoImage p={p} />
          <span className="line-clamp-3 text-[11px] leading-snug">{p.caption}</span>
          <span className="text-[10px] opacity-50">{p.time}</span>
        </button>
      ))}
    </div>
  );
}

export function DeviceView() {
  const { device: id, openDevice } = useUI();
  const facts = useFacts();
  const device = id ? byId(C.devices, id) : undefined;
  if (!device) return null;

  const wiped = device.wipedWhen && facts.has(device.wipedWhen);
  const locked = device.lock && !facts.has(`unlocked:${device.id}`);
  const frame =
    device.kind === "phone"
      ? "h-[min(82dvh,780px)] max-w-full aspect-[9/19] rounded-[2.5rem] border-[10px]"
      : device.kind === "tablet"
        ? "w-full max-w-[640px] aspect-[3/4] sm:aspect-[4/3] rounded-[1.75rem] border-[14px]"
        : "w-full max-w-[760px] aspect-[4/5] sm:aspect-[16/10] rounded-t-xl border-[12px] border-b-[18px]";

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0908] p-3" style={{ backgroundImage: "radial-gradient(circle at 50% 40%, #2a2420, #0a0908 70%)" }}>
      <div className="mb-2 flex w-full max-w-[760px] items-center justify-between">
        <button onClick={() => openDevice(null)} className="rounded-lg border border-line bg-panel px-3 py-2 text-sm">
          ← Back
        </button>
        <span className="text-xs text-muted">{device.name}</span>
      </div>
      <div className={`${frame} relative max-h-[86dvh] overflow-hidden border-black bg-black shadow-2xl`}>
        <div className="absolute inset-0 flex flex-col text-white" style={{ background: device.wallpaper }}>
          {wiped ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
              <p className="text-4xl">⚠️</p>
              <p className="font-semibold">This device has been erased remotely.</p>
              <p className="text-sm opacity-70">Anything you found earlier is still in your Evidence bag.</p>
            </div>
          ) : locked ? (
            <LockScreen device={device} />
          ) : (
            <Home device={device} />
          )}
        </div>
      </div>
      {device.kind === "laptop" && <div className="h-3 w-full max-w-[820px] rounded-b-xl bg-neutral-700" />}
    </div>
  );
}

function LockScreen({ device }: { device: DeviceT }) {
  const tryCode = useGame((s) => s.tryCode);
  const tries = useGame((s) => s.tries[device.id] ?? 0);
  const [code, setCode] = useState("");
  const [shake, setShake] = useState(false);
  const length = device.lock!.code.length;

  const press = (d: string) => {
    const next = (code + d).slice(0, length);
    setCode(next);
    if (next.length === length) {
      if (!tryCode(device.id, next)) {
        setShake(true);
        setTimeout(() => {
          setShake(false);
          setCode("");
        }, 450);
      }
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 overflow-y-auto p-4">
      <p className="text-4xl">🔒</p>
      <p className="text-sm opacity-80">Enter passcode</p>
      <div className={`flex gap-3 ${shake ? "animate-bounce" : ""}`}>
        {Array.from({ length }).map((_, i) => (
          <span key={i} className={`h-3 w-3 rounded-full border border-white ${i < code.length ? "bg-white" : ""}`} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((k, i) =>
          k === "" ? (
            <span key={i} />
          ) : (
            <button
              key={i}
              onClick={() => (k === "⌫" ? setCode(code.slice(0, -1)) : press(k))}
              className="h-14 w-14 rounded-full bg-white/15 text-xl active:bg-white/30"
            >
              {k}
            </button>
          ),
        )}
      </div>
      {tries >= 3 && <p className="max-w-[16rem] text-center text-xs opacity-80">💡 {device.lock!.hint}</p>}
    </div>
  );
}

function Home({ device }: { device: DeviceT }) {
  const facts = useFacts();
  const learn = useGame((s) => s.learn);
  const [app, setApp] = useState<AppId | null>(null);
  const [item, setItem] = useState<AnyItem | null>(null);
  const apps = (Object.keys(APPS) as AppId[]).filter((a) => device.apps[a]?.length);

  if (!app) {
    return (
      <div className="flex flex-1 flex-col p-5">
        <p className="mb-6 text-center text-xs opacity-70">{device.owner}</p>
        <div className="grid grid-cols-4 gap-4">
          {apps.map((a) => (
            <button key={a} onClick={() => setApp(a)} className="flex flex-col items-center gap-1">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-2xl backdrop-blur">{APPS[a].icon}</span>
              <span className="text-[11px]">{APPS[a].label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const def = APPS[app] as AppDef<AnyItem>;
  const items = ((device.apps[app] ?? []) as AnyItem[]).filter((i) => isVisible(i, facts));

  const open = (i: AnyItem) => {
    setItem(i);
    const gained = [...(i.grants ?? [])];
    if (i.clue) gained.push(`clue:${i.clue}`);
    learn(gained, device.name);
  };

  const sections: { title?: string; items: AnyItem[] }[] =
    app === "messages"
      ? [
          { items: items.filter((t) => !(t as Thread).deleted) },
          { title: "Recently deleted", items: items.filter((t) => (t as Thread).deleted) },
        ]
      : [{ items }];

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-black/60 backdrop-blur">
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-3">
        <button onClick={() => (item ? setItem(null) : setApp(null))} className="text-sm text-sky-300">
          ‹ {item ? def.label : "Home"}
        </button>
        <span className="flex-1 truncate text-center text-sm font-semibold">{item ? def.row(item).title : def.label}</span>
        <span className="w-12" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {item ? (
          def.detail(item)
        ) : app === "photos" ? (
          <PhotoGrid photos={items as Photo[]} open={open} />
        ) : (
          sections
            .filter((s) => s.items.length)
            .map((s, i) => (
              <div key={i} className="mb-4">
                {s.title && <p className="mb-1 px-1 text-xs uppercase tracking-wide text-red-300">{s.title}</p>}
                <ul className="divide-y divide-white/10 overflow-hidden rounded-xl bg-white/5">
                  {s.items.map((it) => {
                    const r = def.row(it);
                    return (
                      <li key={it.id}>
                        <button onClick={() => open(it)} className="flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left active:bg-white/10">
                          <span className="flex w-full justify-between gap-2 text-sm">
                            <span className="truncate font-medium">{r.title}</span>
                            {r.time && <span className="shrink-0 text-[11px] opacity-50">{r.time}</span>}
                          </span>
                          {r.sub && <span className="line-clamp-1 text-xs opacity-60">{r.sub}</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
