"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Board, type BoardPiece } from "@/components/Board";
import { Button, Logo, Modal, PrototypeTag } from "@/components/ui";
import { buildBoard } from "@/lib/board";
import { useStore } from "@/lib/store";

const DEMO_PIECES: BoardPiece[] = [
  { color: "red", piece: 0, pos: 4, name: "" }, { color: "red", piece: 1, pos: -1, name: "" },
  { color: "green", piece: 0, pos: 17, name: "" }, { color: "green", piece: 1, pos: 17, name: "" },
  { color: "yellow", piece: 0, pos: 30, name: "" }, { color: "yellow", piece: 1, pos: -1, name: "" },
  { color: "blue", piece: 0, pos: 52, name: "" }, { color: "blue", piece: 1, pos: -1, name: "" },
];

const MENU = [
  { href: "/setup", label: "New game", hint: "2–4 players on one computer", primary: true },
  { href: "/history", label: "Game history", hint: "Winners, difficulty and time of past games" },
  { href: "/admin", label: "Question management", hint: "For administrators only. Password needed." },
];

export default function Home() {
  const board = useMemo(() => buildBoard("easy", 7), []);
  const [exitOpen, setExitOpen] = useState(false);
  const [closed, setClosed] = useState(false);
  const { game } = useStore();
  const resumable = game && game.phase !== "over";

  if (closed) {
    return (
      <main className="min-h-screen grid place-items-center p-8 text-center">
        <div>
          <Logo size="lg" />
          <p className="mt-6 text-paper/80 text-lg">The game is closed. In the real Java app the window would close here.</p>
          <Button className="mt-6" onClick={() => setClosed(false)}>Open Spider Ludo again</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 sm:px-10 py-8 lg:py-0 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] items-center gap-10 max-w-[1280px] mx-auto">
      <section className="lg:py-12">
        <div className="flex items-center justify-between gap-4 mb-10">
          <Logo size="lg" />
        </div>
        <h1 className="font-display text-[clamp(2rem,4.2vw,3.4rem)] font-bold leading-[1.05] tracking-tight max-w-[14ch]">
          Roll the dice. Answer the question. Get home first.
        </h1>
        <p className="mt-5 text-lg text-paper/75 max-w-[46ch] leading-relaxed">
          Classic Ludo for 2–4 players, with questions about Agile, MVC, design patterns and testing on the board.
        </p>

        <nav aria-label="Main menu" className="mt-9 flex flex-col gap-3 max-w-md">
          {resumable && (
            <Link href="/game" className="group rounded-2xl border-2 border-[#ffd166] bg-[#ffd166]/10 px-5 py-4 hover:bg-[#ffd166]/20">
              <span className="block font-display text-xl font-bold">Continue game</span>
              <span className="block text-sm text-paper/70">{game!.players.map((p) => p.name).join(", ")} on {game!.difficulty}</span>
            </Link>
          )}
          {MENU.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className={`rounded-2xl px-5 py-4 transition ${m.primary
                ? "bg-paper text-ink shadow-[0_4px_0_#0e1530] hover:bg-white active:translate-y-[2px]"
                : "border border-felt-line hover:bg-felt-line/50"}`}
            >
              <span className="block font-display text-xl font-bold">{m.label}</span>
              <span className={`block text-sm ${m.primary ? "text-ink-soft" : "text-paper/65"}`}>{m.hint}</span>
            </Link>
          ))}
          <div className="flex gap-3 pt-1">
            <Link href="/rules" className="flex-1 rounded-2xl border border-felt-line px-5 py-3 text-center font-bold hover:bg-felt-line/50">How to play</Link>
            <button onClick={() => setExitOpen(true)} className="flex-1 rounded-2xl border border-felt-line px-5 py-3 font-bold hover:bg-felt-line/50">Exit</button>
          </div>
        </nav>
        <div className="mt-8"><PrototypeTag /></div>
      </section>

      <section aria-hidden className="hidden sm:block py-6 lg:py-12">
        <Board board={board} pieces={DEMO_PIECES} decorative className="w-full max-w-[600px] ml-auto rotate-[-3deg]" />
      </section>

      <Modal open={exitOpen} onClose={() => setExitOpen(false)} title="Close Spider Ludo?">
        <p className="text-ink-soft">{resumable ? "Your current game is not finished. It will not be saved to the history." : "You can open the game again at any time."}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="paper" onClick={() => setExitOpen(false)}>Stay</Button>
          <Button variant="danger" onClick={() => { setExitOpen(false); setClosed(true); }}>Close game</Button>
        </div>
      </Modal>
    </main>
  );
}
