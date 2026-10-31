"use client";

import Link from "next/link";
import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import type { ColorId } from "@/lib/board";

export const COLORS: Record<ColorId, { label: string; fill: string; ink: string; tint: string; shape: string }> = {
  red: { label: "Red", fill: "var(--red)", ink: "var(--red-ink)", tint: "var(--red-tint)", shape: "●" },
  green: { label: "Green", fill: "var(--green)", ink: "var(--green-ink)", tint: "var(--green-tint)", shape: "▲" },
  yellow: { label: "Yellow", fill: "var(--yellow)", ink: "var(--yellow-ink)", tint: "var(--yellow-tint)", shape: "■" },
  blue: { label: "Blue", fill: "var(--blue)", ink: "var(--blue-ink)", tint: "var(--blue-tint)", shape: "◆" },
};

type Variant = "primary" | "paper" | "ghost" | "danger" | "accent";
const variants: Record<Variant, string> = {
  primary: "bg-paper text-ink hover:bg-white shadow-[0_3px_0_#0e1530]",
  paper: "bg-paper text-ink border border-line hover:bg-white",
  ghost: "bg-transparent text-paper border border-felt-line hover:bg-felt-line/60",
  danger: "bg-[var(--red-ink)] text-white hover:bg-[var(--red)]",
  accent: "bg-[var(--accent)] text-[var(--accent-ink)] shadow-[0_3px_0_rgba(0,0,0,.35)] hover:brightness-105",
};

export function Button({ variant = "primary", className = "", ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...p}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-bold transition active:translate-y-[2px] disabled:opacity-40 disabled:pointer-events-none ${variants[variant]} ${className}`}
    />
  );
}

export function LinkButton({ href, variant = "primary", className = "", children }: { href: string; variant?: Variant; className?: string; children: ReactNode }) {
  return (
    <Link href={href} className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-bold transition active:translate-y-[2px] ${variants[variant]} ${className}`}>
      {children}
    </Link>
  );
}

export function Token({ color, size = 28, label, className = "" }: { color: ColorId; size?: number; label?: string | number; className?: string }) {
  return (
    <span
      className={`inline-grid place-items-center rounded-full font-bold text-white select-none ${className}`}
      style={{
        width: size, height: size, fontSize: size * 0.42,
        background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${COLORS[color].fill} 60%, white), ${COLORS[color].fill} 55%, ${COLORS[color].ink})`,
        boxShadow: `0 2px 0 ${COLORS[color].ink}, inset 0 -2px 0 rgba(0,0,0,.15)`,
        border: "2px solid white",
      }}
      aria-hidden
    >
      {label}
    </span>
  );
}

export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  const big = size === "lg";
  return (
    <span className="inline-flex items-center gap-3">
      <span className={`grid grid-cols-2 gap-[3px] ${big ? "w-12 h-12" : "w-8 h-8"}`} aria-hidden>
        {(["red", "green", "blue", "yellow"] as ColorId[]).map((c) => (
          <span key={c} className="rounded-[4px]" style={{ background: COLORS[c].fill }} />
        ))}
      </span>
      <span className={`font-display font-extrabold tracking-tight ${big ? "text-5xl" : "text-2xl"}`}>Spider Ludo</span>
    </span>
  );
}

export function PrototypeTag() {
  return (
    <span className="rounded-full border border-dashed border-paper/40 px-3 py-1 text-xs text-paper/70">
      Prototype with sample data
    </span>
  );
}

export function Modal({ open, onClose, title, children, labelledBy = "modal-title", tone }: {
  open: boolean; onClose?: () => void; title: string; children: ReactNode; labelledBy?: string; tone?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("button, [href], input, select, textarea")?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && onClose) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); prev?.focus(); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#0e1530]/70 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="anim-rise w-full max-w-lg rounded-2xl bg-paper text-ink shadow-2xl"
        style={tone ? { borderTop: `8px solid ${tone}` } : undefined}
      >
        <div className="p-6">
          <h2 id={labelledBy} className="font-display text-2xl font-bold mb-3">{title}</h2>
          {children}
        </div>
      </div>
    </div>
  );
}

export function TopBar({ children, back }: { children?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-8 py-4 border-b border-felt-line">
      <div className="flex items-center gap-4">
        {back && (
          <Link href={back.href} className="rounded-lg px-3 py-2 text-paper/80 hover:text-paper hover:bg-felt-line/60">
            ← {back.label}
          </Link>
        )}
        <Logo />
      </div>
      <div className="flex items-center gap-3">{children}<PrototypeTag /></div>
    </header>
  );
}
