"use client";

import { useEffect } from "react";
import { useGame } from "@/engine/store";

/** A panel that slides up from the bottom, used for close-ups and results. */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-label={title}
        className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-line bg-panel p-5 pb-8 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="text-2xl leading-none text-muted">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Toast() {
  const toast = useGame((s) => s.toast);
  const clear = useGame((s) => s.clearToast);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clear, 2800);
    return () => clearTimeout(t);
  }, [toast, clear]);
  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex justify-center px-4">
      <div className="rounded-full border border-line bg-panel-2 px-4 py-2 text-sm shadow-lg">🔎 {toast}</div>
    </div>
  );
}

/** A case illustration. Plain <img>: the site is static, nothing to optimise. */
export function Picture({ src, alt, className }: { src: string; alt: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} draggable={false} />;
}
