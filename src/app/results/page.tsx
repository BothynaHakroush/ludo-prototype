"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button, COLORS, LinkButton, Token, TopBar } from "@/components/ui";
import type { HistoryRecord } from "@/lib/data";
import { fmtDuration } from "@/lib/engine";
import { useStore } from "@/lib/store";

const PLACE = ["1st", "2nd", "3rd", "4th"];

export default function Results() {
  const router = useRouter();
  const { game, setGame, saveResult, ready, historyError } = useStore();
  const [rec, setRec] = useState<HistoryRecord | null>(null);
  const saved = useRef(false);

  useEffect(() => {
    if (!ready) return;
    if (!game || game.phase !== "over") { router.replace("/"); return; }
    if (!saved.current && !historyError) { saved.current = true; setRec(saveResult(game)); }
  }, [ready, game, router, saveResult, historyError]);

  if (!game || game.phase !== "over") return null;
  const order = game.finishOrder.map((i) => game.players[i]);
  const winner = order[0];

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="max-w-[860px] mx-auto px-4 sm:px-8 py-10">
        <div className="flex items-center gap-4">
          <Token color={winner.color} size={56} label={COLORS[winner.color].shape} />
          <div>
            <p className="text-paper/70">Game over</p>
            <h1 className="font-display text-[clamp(2rem,5vw,3.4rem)] font-bold leading-tight">{winner.name} wins!</h1>
          </div>
        </div>

        <ol className="mt-8 flex flex-col gap-3">
          {order.map((p, i) => (
            <li key={p.name} className={`flex items-center gap-4 rounded-2xl px-5 py-4 ${i === 0 ? "bg-paper text-ink" : "border border-felt-line"}`}>
              <span className="w-12 font-display text-2xl font-bold">{PLACE[i]}</span>
              <Token color={p.color} size={30} label={COLORS[p.color].shape} />
              <span className="font-bold text-lg flex-1">{p.name}</span>
              <span className={`text-sm ${i === 0 ? "text-ink-soft" : "text-paper/60"}`}>{COLORS[p.color].label}</span>
            </li>
          ))}
        </ol>

        <dl className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Stat label="Difficulty" value={game.difficulty[0].toUpperCase() + game.difficulty.slice(1)} />
          <Stat label="Game time" value={fmtDuration((game.endedAt ?? Date.now()) - game.startedAt)} />
          <Stat label="Game number" value={rec ? `#${rec.gameID}` : "Not saved"} />
        </dl>

        {historyError ? (
          <p role="alert" className="mt-6 rounded-xl bg-[var(--red-tint)] text-[var(--red-ink)] p-4">
            The result could not be saved to game_history.csv. Check that the game folder is not read-only. Your results are still shown here.
          </p>
        ) : rec && (
          <p className="mt-6 text-paper/75">Saved to Game History as game #{rec.gameID}.</p>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Button onClick={() => { setGame(null); router.push("/setup"); }}>Play again</Button>
          <LinkButton href="/history" variant="ghost">See game history</LinkButton>
          <Button variant="ghost" onClick={() => { setGame(null); router.push("/"); }}>Main menu</Button>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-felt-line p-4">
      <dt className="text-sm text-paper/65">{label}</dt>
      <dd className="font-display text-2xl font-bold tabular-nums">{value}</dd>
    </div>
  );
}
