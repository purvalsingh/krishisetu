"use client";

import { useRef, type ReactNode } from "react";

/**
 * A call to action that leans toward the cursor.
 *
 * The pull is small and capped, and it is applied with a transform so nothing
 * around the button reflows. Pointer handling is skipped entirely for coarse
 * pointers and for anyone who has asked for reduced motion, so a phone tap and
 * a screen reader get a perfectly ordinary button.
 */
export function Magnetic({ children, strength = 0.28, max = 9 }: { children: ReactNode; strength?: number; max?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  const allowed = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const follow = (e: React.PointerEvent<HTMLSpanElement>) => {
    const el = ref.current;
    if (!el || !allowed()) return;
    const box = el.getBoundingClientRect();
    const dx = (e.clientX - (box.left + box.width / 2)) * strength;
    const dy = (e.clientY - (box.top + box.height / 2)) * strength;
    const clamp = (v: number) => Math.max(-max, Math.min(max, v));
    el.style.transform = `translate(${clamp(dx)}px, ${clamp(dy)}px)`;
  };

  const release = () => {
    const el = ref.current;
    if (el) el.style.transform = "";
  };

  return (
    <span
      ref={ref}
      className="magnetic"
      onPointerMove={follow}
      onPointerLeave={release}
      onBlur={release}
    >
      {children}
    </span>
  );
}
