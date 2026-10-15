"use client";

import { useEffect, useState } from "react";
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

/**
 * A picture with an ⓘ info point in its top corner. Tapping ⓘ shows, over the
 * top of the picture, what exactly it shows. Tapping the picture calls onOpen.
 */
export function InfoImage({
  src,
  alt,
  info,
  className,
  onOpen,
}: {
  src: string;
  alt: string;
  info?: string;
  className?: string;
  onOpen?: () => void;
}) {
  const [show, setShow] = useState(false);
  const picture = <Picture src={src} alt={alt} className={`block w-full ${className ?? ""}`} />;
  return (
    <div className="relative">
      {onOpen ? (
        <button onClick={onOpen} className="block w-full" aria-label={alt}>
          {picture}
        </button>
      ) : (
        picture
      )}
      {info && (
        <>
          <button
            onClick={() => setShow(!show)}
            aria-label={show ? "Hide info" : "What am I looking at?"}
            className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-white/40 bg-black/65 text-sm font-semibold text-white"
          >
            {show ? "×" : "i"}
          </button>
          {show && (
            <button
              onClick={() => setShow(false)}
              className="absolute inset-x-1.5 top-10 rounded-lg bg-black/85 p-2.5 text-left text-xs leading-snug text-white"
            >
              {info}
            </button>
          )}
        </>
      )}
    </div>
  );
}
