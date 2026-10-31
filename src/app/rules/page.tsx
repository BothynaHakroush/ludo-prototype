"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { TopBar } from "@/components/ui";

const RULES = [
  { t: "Goal", d: "Bring all four of your pieces from your castle to the centre. Players who finish get a place. The game ends when only one player is left." },
  { t: "Getting out", d: "You need a 6 on the normal die to move a piece from your castle to your start square (#). If no piece is out and you roll 1–5, your turn passes." },
  { t: "Moving", d: "On Medium and Hard you also roll a Boost (1–3) or UltraBoost (1–6) die. Pieces on the shared route move normal × boost. Pieces in your home path move by the normal die only." },
  { t: "Rolling a 6", d: "A 6 gives you another roll. If you roll 6 three times in a row, the third roll is cancelled and the turn passes." },
  { t: "Capturing", d: "Land on a square with one opponent piece and it goes back to its castle. Start, protection (★) and surprise squares are safe." },
  { t: "Double Block", d: "Two of your pieces on one square make a wall. Opponents can't land on it or pass it, forward or back. They stop on the square before it." },
  { t: "Getting home", d: "You need the exact number to reach the centre. If the number is too big, move another piece or the turn passes." },
  { t: "Question squares", d: "Answer a question about software engineering. Easy, medium and hard questions move you 1, 2 or 3 steps: forward if right, back if wrong." },
  { t: "Surprise squares", d: "Something random happens: a jump home, a push for an opponent, back to the castle, 3 steps back, a skipped turn, or an extra UltraBoost turn." },
];

function Content() {
  const from = useSearchParams().get("from");
  return (
    <div className="min-h-screen">
      <TopBar back={from === "game" ? { href: "/game", label: "Back to game" } : { href: "/", label: "Menu" }} />
      <main className="max-w-[760px] mx-auto px-4 sm:px-8 py-10">
        <h1 className="font-display text-4xl font-bold tracking-tight">How to play</h1>
        <p className="mt-2 text-paper/70 text-lg">The full rules in nine short points.</p>
        <dl className="mt-8 flex flex-col">
          {RULES.map((r) => (
            <div key={r.t} className="grid sm:grid-cols-[170px_1fr] gap-1 sm:gap-6 py-4 border-b border-felt-line">
              <dt className="font-display text-lg font-bold">{r.t}</dt>
              <dd className="text-paper/85 leading-relaxed max-w-[60ch]">{r.d}</dd>
            </div>
          ))}
        </dl>
      </main>
    </div>
  );
}

export default function Rules() {
  return <Suspense><Content /></Suspense>;
}
