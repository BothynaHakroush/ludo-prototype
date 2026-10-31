"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Board, type BoardPiece } from "@/components/Board";
import { Button, COLORS, Logo, Modal, Token } from "@/components/ui";
import { SURPRISE_TABLE, QUESTION_STEPS } from "@/lib/data";
import {
  answer, applySurprise, boardOf, closeQuestion, finishDemo, fmtDuration, lastIndex, legalMoves, move,
  opponentsOnBoard, passTurn, pushOpponent, roll, stepsFor, type GameState,
} from "@/lib/engine";
import { useStore } from "@/lib/store";

const LETTERS = ["A", "B", "C", "D"];
const LEVEL_LABEL = { easy: "Easy", medium: "Medium", hard: "Hard" };

export default function GamePage() {
  const router = useRouter();
  const { game, setGame, ready } = useStore();
  const [now, setNow] = useState(() => Date.now());
  const [paused, setPaused] = useState(false);
  const [quitAsk, setQuitAsk] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [tools, setTools] = useState(false);

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { if (ready && !game) router.replace("/setup"); }, [ready, game, router]);
  useEffect(() => { if (game?.phase === "over") { const t = setTimeout(() => router.push("/results"), 900); return () => clearTimeout(t); } }, [game?.phase, router]);

  const board = useMemo(() => (game ? boardOf(game) : null), [game]);
  const moves = useMemo(() => (game && board && game.phase === "choose" ? legalMoves(game, board) : []), [game, board]);

  const doRoll = useCallback(() => {
    if (!game || game.phase !== "roll" || rolling) return;
    setRolling(true);
    setTimeout(() => { setGame(roll(game)); setRolling(false); }, 450);
  }, [game, rolling, setGame]);

  // Keyboard: R or Space to roll, 1–4 to move a piece.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!game || paused || e.target instanceof HTMLInputElement) return;
      if (game.phase === "roll" && (e.key === "r" || e.key === "R" || e.key === " ")) { e.preventDefault(); doRoll(); }
      if (game.phase === "choose" && ["1", "2", "3", "4"].includes(e.key)) {
        const piece = Number(e.key) - 1;
        if (moves.some((m) => m.piece === piece)) setGame(move(game, piece));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [game, paused, moves, doRoll, setGame]);

  // No legal move: show why, then pass automatically.
  useEffect(() => {
    if (game?.phase !== "noMove" || paused) return;
    const t = setTimeout(() => setGame(passTurn(game)), 2600);
    return () => clearTimeout(t);
  }, [game, paused, setGame]);

  if (!game || !board) return null;

  const me = game.players[game.current];
  const c = COLORS[me.color];
  const accentInk = me.color === "yellow" ? "#2a1f00" : "#ffffff";
  const pieces: BoardPiece[] = game.players.flatMap((p) => p.pieces.map((pos, i) => ({ color: p.color, piece: i, pos, name: p.name })));
  const movable = new Set(moves.map((m) => `${me.color}-${m.piece}`));
  const elapsed = fmtDuration((game.endedAt ?? now) - game.startedAt);
  const hasBoost = game.difficulty !== "easy" || game.dice?.ultra;
  const boostName = game.dice?.ultra || game.difficulty === "hard" ? "UltraBoost" : "Boost";

  let prompt = "";
  if (game.phase === "roll") prompt = "Roll the dice to start your turn.";
  if (game.phase === "choose") prompt = moves.length === 1 ? "Click the glowing piece to move it." : `Choose one of the ${moves.length} glowing pieces.`;
  if (game.phase === "noMove") prompt = game.notice?.text ?? "";

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ ["--accent" as string]: c.fill, ["--accent-ink" as string]: accentInk }}>
      {/* top bar */}
      <header className="flex items-center justify-between gap-4 px-4 sm:px-6 h-14 border-b border-felt-line shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="!py-2 !px-4" onClick={() => setPaused(true)} aria-label="Pause game">❚❚ Pause</Button>
          <span className="hidden md:inline"><Logo /></span>
        </div>
        <div className="flex items-center gap-5 text-sm">
          <span className="capitalize text-paper/80">{game.difficulty} board</span>
          <span className="font-display text-xl font-bold tabular-nums" aria-label={`Game time ${elapsed}`}>{elapsed}</span>
          <button onClick={() => setTools((v) => !v)} className="rounded-full border border-dashed border-paper/40 px-3 py-1 text-xs text-paper/70 hover:text-paper" aria-expanded={tools}>
            Prototype tools
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_360px] gap-5 p-4 sm:p-5 overflow-auto md:overflow-hidden">
        <div className="min-h-0 grid place-items-center">
          <Board
            board={board}
            pieces={pieces}
            movable={movable}
            onPick={(piece) => setGame(move(game, piece))}
            activeColor={me.color}
            lastMoved={game.moved ? `${game.moved.color}-${game.moved.piece}` : null}
            className="h-full max-h-full w-auto max-w-full"
          />
        </div>

        <aside className="min-h-0 flex flex-col gap-4 overflow-y-auto pr-1">
          {/* turn card */}
          <section aria-live="polite" className="rounded-2xl p-5 text-[var(--accent-ink)] shadow-[0_6px_0_rgba(0,0,0,.25)] transition-colors" style={{ background: c.fill }}>
            <p className="text-sm opacity-85">Turn of</p>
            <div className="flex items-center gap-3">
              <Token color={me.color} size={34} label={c.shape} />
              <h1 className="font-display text-3xl font-bold leading-tight break-all">{me.name}</h1>
            </div>
            <p className="mt-1 text-sm opacity-85">{c.label} pieces</p>

            <div className="mt-4 flex items-center gap-3">
              <Die value={game.dice?.n ?? null} rolling={rolling} label="Normal die" />
              {hasBoost && (
                <>
                  <span className="font-display text-2xl font-bold" aria-hidden>×</span>
                  <BoostDie value={game.dice?.b ?? null} rolling={rolling} name={boostName} />
                </>
              )}
              {game.dice && game.dice.n > 0 && (
                <div className="ml-auto text-right">
                  <span className="block text-xs opacity-80">Move</span>
                  <span className="font-display text-3xl font-extrabold">{game.dice.n * game.dice.b}</span>
                </div>
              )}
            </div>
            {game.phase === "choose" && hasBoost && me.pieces.some((x) => x >= board.routes[me.color].homeStart && x < lastIndex(board, me.color)) && (
              <p className="mt-2 text-xs opacity-85">Pieces in your home path move by the normal die only ({game.dice!.n}).</p>
            )}

            <p className="mt-4 font-bold">{prompt}</p>
            {game.phase === "roll" && (
              <button onClick={doRoll} disabled={rolling}
                className="mt-3 w-full rounded-xl bg-paper text-ink py-3.5 font-display text-xl font-bold shadow-[0_4px_0_rgba(0,0,0,.3)] hover:bg-white active:translate-y-[2px] disabled:opacity-60">
                {rolling ? "Rolling…" : "Roll dice"}
              </button>
            )}
            {game.phase === "roll" && <p className="mt-2 text-xs opacity-80">Shortcut: press R or Space.</p>}
            {game.phase === "choose" && <p className="mt-2 text-xs opacity-80">Shortcut: press the piece number (1–4).</p>}
            {game.phase === "noMove" && (
              <button onClick={() => setGame(passTurn(game))} className="mt-3 w-full rounded-xl border-2 border-current py-2.5 font-bold">Next player</button>
            )}
          </section>

          {game.notice && game.phase !== "noMove" && (
            <p role="status" className="anim-rise rounded-xl px-4 py-3 text-sm font-bold text-ink"
              style={{ background: game.notice.tone === "bad" ? "var(--red-tint)" : game.notice.tone === "good" ? "var(--green-tint)" : "var(--paper)" }}>
              {game.notice.text}
            </p>
          )}

          {/* players */}
          <section className="rounded-2xl bg-paper text-ink p-4">
            <h2 className="font-display text-lg font-bold mb-2">Players</h2>
            <ul className="flex flex-col gap-2">
              {game.players.map((p, i) => {
                const home = p.pieces.filter((x) => x === lastIndex(board, p.color)).length;
                const out = p.pieces.filter((x) => x >= 0 && x < lastIndex(board, p.color)).length;
                return (
                  <li key={i} className={`flex items-center gap-3 rounded-xl px-3 py-2 ${i === game.current ? "bg-paper-2" : ""}`}>
                    <Token color={p.color} size={24} label={COLORS[p.color].shape} />
                    <span className="flex-1 min-w-0">
                      <span className="block font-bold truncate">{p.name}{i === game.current && <span className="sr-only"> (playing now)</span>}</span>
                      <span className="block text-xs text-ink-soft">
                        {p.rank ? `Finished, place ${p.rank}` : `${4 - out - home} in castle · ${out} on board · ${home} home`}
                        {p.skipNext && " · skips next turn"}
                      </span>
                    </span>
                    <span className="flex gap-0.5" aria-label={`${home} of 4 pieces home`}>
                      {[0, 1, 2, 3].map((k) => <span key={k} className="w-2 h-4 rounded-sm" style={{ background: k < home ? COLORS[p.color].fill : "#d9d7cc" }} />)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          <Legend difficulty={game.difficulty} />

          <section className="rounded-2xl border border-felt-line p-4">
            <h2 className="font-display text-lg font-bold mb-2">What happened</h2>
            <ol className="text-sm text-paper/80 flex flex-col gap-1">
              {game.log.slice(0, 6).map((l, i) => <li key={i} className={i === 0 ? "text-paper" : ""}>{l}</li>)}
            </ol>
          </section>
        </aside>
      </div>

      {tools && <ToolsPanel game={game} setGame={setGame} onClose={() => setTools(false)} />}

      <QuestionModal game={game} setGame={setGame} />
      <SurpriseModal game={game} setGame={setGame} />

      <Modal open={paused && !quitAsk} onClose={() => setPaused(false)} title="Game paused">
        <p className="text-ink-soft">The timer keeps running in this prototype. Should pausing stop the game timer? Tell us in the feedback form.</p>
        <div className="mt-6 flex flex-col gap-3">
          <Button variant="accent" style={{ ["--accent" as string]: "var(--ink)", ["--accent-ink" as string]: "var(--paper)" }} onClick={() => setPaused(false)}>Resume game</Button>
          <Link href="/rules?from=game" className="rounded-xl border border-line px-5 py-3 text-center font-bold hover:bg-white">How to play</Link>
          <Button variant="paper" onClick={() => setQuitAsk(true)}>Quit to main menu</Button>
        </div>
      </Modal>
      <Modal open={quitAsk} onClose={() => setQuitAsk(false)} title="Quit this game?">
        <p className="text-ink-soft">The game is not finished, so it will not be saved in Game History.</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="paper" onClick={() => setQuitAsk(false)}>Keep playing</Button>
          <Button variant="danger" onClick={() => { setGame(null); router.push("/"); }}>Quit game</Button>
        </div>
      </Modal>
    </div>
  );
}

function Pips({ n }: { n: number }) {
  const map: Record<number, [number, number][]> = {
    1: [[50, 50]], 2: [[28, 28], [72, 72]], 3: [[28, 28], [50, 50], [72, 72]],
    4: [[28, 28], [72, 28], [28, 72], [72, 72]], 5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
    6: [[28, 25], [72, 25], [28, 50], [72, 50], [28, 75], [72, 75]],
  };
  return <>{(map[n] ?? []).map(([x, y], i) => <circle key={i} cx={x} cy={y} r="9" fill="var(--ink)" />)}</>;
}

function Die({ value, rolling, label }: { value: number | null; rolling: boolean; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 100" className={`w-16 h-16 drop-shadow-[0_3px_0_rgba(0,0,0,.3)] ${rolling ? "anim-tumble" : ""}`} role="img" aria-label={value ? `${label}: ${value}` : `${label}: not rolled`}>
        <rect x="4" y="4" width="92" height="92" rx="18" fill="var(--paper)" />
        {value ? <Pips n={rolling ? 5 : value} /> : <text x="50" y="62" textAnchor="middle" fontSize="34" fill="#b9b6aa" fontWeight="700">?</text>}
      </svg>
      <span className="mt-1 text-[11px] opacity-85">{label}</span>
    </div>
  );
}

function BoostDie({ value, rolling, name }: { value: number | null; rolling: boolean; name: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`grid place-items-center w-16 h-16 rounded-[18px] bg-ink text-paper font-display text-3xl font-extrabold shadow-[0_3px_0_rgba(0,0,0,.3)] ${rolling ? "anim-tumble" : ""}`}
        role="img" aria-label={value ? `${name} die: ${value}` : `${name} die: not rolled`}>
        {value ? `×${value}` : "×?"}
      </div>
      <span className="mt-1 text-[11px] opacity-85">{name} die</span>
    </div>
  );
}

function Legend({ difficulty }: { difficulty: string }) {
  const items = [
    { mark: <span className="grid place-items-center w-5 h-5 rounded bg-[var(--red)] text-white text-xs font-bold">#</span>, text: "Start square (safe)" },
    { mark: <span className="text-[#c99700]">★</span>, text: "Protection: you can't be captured" },
    { mark: <span className="font-bold">→</span>, text: "Arrow: your color turns inward" },
  ];
  if (difficulty !== "easy") {
    items.push(
      { mark: <span className="flex gap-0.5">{["var(--q-easy)", "var(--q-medium)", "var(--q-hard)"].map((c) => <span key={c} className="w-3 h-5 rounded-sm" style={{ background: c }} />)}</span>, text: "Question: easy, medium, hard" },
      { mark: <span className="grid place-items-center w-5 h-5 rounded bg-[#7b4fd6] text-white text-[10px]">✦</span>, text: "Surprise: random event (safe)" },
    );
  }
  return (
    <details className="rounded-2xl border border-felt-line p-4 group">
      <summary className="font-display text-lg font-bold cursor-pointer list-none flex justify-between">Board key <span className="text-paper/60 group-open:rotate-180 transition">⌄</span></summary>
      <ul className="mt-2 flex flex-col gap-2 text-sm text-paper/85">
        {items.map((it, i) => <li key={i} className="flex items-center gap-3"><span className="w-8 grid place-items-center">{it.mark}</span>{it.text}</li>)}
      </ul>
    </details>
  );
}

function QuestionModal({ game, setGame }: { game: GameState; setGame: (g: GameState) => void }) {
  const qs = game.question;
  const open = !!qs && (game.phase === "question" || game.phase === "answered");
  const [pick, setPick] = useState<number | null>(null);
  useEffect(() => { setPick(null); }, [qs?.q.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const i = LETTERS.indexOf(e.key.toUpperCase());
      if (game.phase === "question" && i >= 0) setPick(i + 1);
      if (e.key === "Enter" && game.phase === "question" && pick) setGame(answer(game, pick));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, game, pick, setGame]);

  if (!open || !qs) return null;
  const lvl = qs.q.level;
  const steps = QUESTION_STEPS[lvl];
  const answered = game.phase === "answered";
  const right = qs.choice === qs.q.correct;
  const tone = `var(--q-${lvl})`;

  return (
    <Modal open title={`${LEVEL_LABEL[lvl]} question`} tone={tone}>
      <p className="text-sm text-ink-soft -mt-1 mb-3">Topic: {qs.q.topic}. Right answer: {steps} step{steps > 1 ? "s" : ""} forward. Wrong answer: {steps} back.</p>
      <p className="text-lg font-bold leading-snug">{qs.q.text}</p>
      <div className="mt-4 flex flex-col gap-2" role="radiogroup" aria-label="Answers">
        {qs.q.options.map((o, i) => {
          const n = i + 1;
          const chosen = (answered ? qs.choice : pick) === n;
          const isCorrect = answered && n === qs.q.correct;
          const isWrongPick = answered && chosen && !isCorrect;
          return (
            <button key={i} role="radio" aria-checked={chosen} disabled={answered} onClick={() => setPick(n)}
              className={`flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition ${isCorrect ? "border-[var(--green)] bg-[var(--green-tint)]" : isWrongPick ? "border-[var(--red)] bg-[var(--red-tint)]" : chosen ? "border-ink bg-white" : "border-line hover:border-ink-soft"}`}>
              <span className={`grid place-items-center w-8 h-8 shrink-0 rounded-lg font-bold ${chosen && !answered ? "bg-ink text-paper" : "bg-paper-2"}`}>{LETTERS[i]}</span>
              <span>{o}</span>
              {isCorrect && <span className="ml-auto text-sm font-bold text-[var(--green-ink)]">Correct answer</span>}
              {isWrongPick && <span className="ml-auto text-sm font-bold text-[var(--red-ink)]">Your answer</span>}
            </button>
          );
        })}
      </div>
      {!answered ? (
        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="text-xs text-ink-soft">Click an answer or press A–D, then Enter.</span>
          <Button variant="accent" style={{ ["--accent" as string]: "var(--ink)", ["--accent-ink" as string]: "var(--paper)" }} disabled={!pick} onClick={() => setGame(answer(game, pick!))}>Submit answer</Button>
        </div>
      ) : (
        <div className="mt-5">
          <p className={`rounded-xl p-3 font-bold ${right ? "bg-[var(--green-tint)] text-[var(--green-ink)]" : "bg-[var(--red-tint)] text-[var(--red-ink)]"}`}>
            {right ? `Correct! Your piece moves ${steps} step${steps > 1 ? "s" : ""} forward.` : `Not this time. Your piece moves ${steps} step${steps > 1 ? "s" : ""} back.`}
          </p>
          <div className="mt-4 flex justify-end">
            <Button variant="accent" style={{ ["--accent" as string]: "var(--ink)", ["--accent-ink" as string]: "var(--paper)" }} onClick={() => setGame(closeQuestion(game))}>Continue</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function SurpriseModal({ game, setGame }: { game: GameState; setGame: (g: GameState) => void }) {
  const [revealed, setRevealed] = useState(false);
  const sp = game.surprise;
  useEffect(() => { setRevealed(false); if (game.phase === "surprise") { const t = setTimeout(() => setRevealed(true), 900); return () => clearTimeout(t); } }, [game.phase, sp?.id]);
  const board = boardOf(game);

  if (game.phase === "opponentPick") {
    const opps = opponentsOnBoard(game, board);
    return (
      <Modal open title="Choose an opponent" tone="#7b4fd6">
        <p className="text-ink-soft">You will roll the normal die. Their leading piece moves back half the result, rounded up.</p>
        <div className="mt-4 flex flex-col gap-2">
          {opps.map((i) => {
            const p = game.players[i];
            return (
              <Button key={i} variant="paper" className="!justify-start" onClick={() => setGame(pushOpponent(game, i))}>
                <Token color={p.color} size={24} label={COLORS[p.color].shape} /> {p.name}
              </Button>
            );
          })}
        </div>
      </Modal>
    );
  }
  if (game.phase !== "surprise" || !sp) return null;
  return (
    <Modal open title="Surprise square!" tone="#7b4fd6">
      <p className="text-ink-soft">One of these happens. The chance of each is shown.</p>
      <ul className="mt-4 flex flex-col gap-1.5">
        {SURPRISE_TABLE.map((o) => {
          const hit = revealed && o.id === sp.id;
          return (
            <li key={o.id} className={`flex items-center gap-3 rounded-xl px-3 py-2 border-2 transition ${hit ? "border-[#7b4fd6] bg-[#efe8fd] font-bold" : revealed ? "border-transparent opacity-45" : "border-transparent"}`}>
              <span className="w-10 text-sm tabular-nums text-ink-soft">{o.p}%</span>
              <span>{o.label}</span>
            </li>
          );
        })}
      </ul>
      <div className="mt-5 flex justify-end">
        <Button variant="accent" style={{ ["--accent" as string]: "#7b4fd6", ["--accent-ink" as string]: "white" }} disabled={!revealed} onClick={() => setGame(applySurprise(game))}>
          {revealed ? "OK, apply it" : "Drawing…"}
        </Button>
      </div>
    </Modal>
  );
}

function ToolsPanel({ game, setGame, onClose }: { game: GameState; setGame: (g: GameState) => void; onClose: () => void }) {
  const [n, setN] = useState(6);
  const [b, setB] = useState(1);
  const board = boardOf(game);
  void stepsFor; void board;
  return (
    <div className="fixed bottom-4 left-4 z-40 w-[300px] rounded-2xl bg-paper text-ink p-4 shadow-2xl border-2 border-dashed border-ink-soft/50">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold">Prototype tools</h2>
        <button onClick={onClose} className="px-2 text-ink-soft hover:text-ink" aria-label="Close tools">✕</button>
      </div>
      <p className="mt-1 text-xs text-ink-soft">Not part of the real game. Helps testers reach every screen quickly.</p>
      <div className="mt-3 flex items-end gap-2">
        <label className="text-sm">Normal
          <select value={n} onChange={(e) => setN(+e.target.value)} className="block mt-1 rounded-lg border border-line px-2 py-1">{[1, 2, 3, 4, 5, 6].map((x) => <option key={x}>{x}</option>)}</select>
        </label>
        <label className="text-sm">Boost
          <select value={b} onChange={(e) => setB(+e.target.value)} className="block mt-1 rounded-lg border border-line px-2 py-1">{[1, 2, 3, 4, 5, 6].map((x) => <option key={x}>{x}</option>)}</select>
        </label>
        <Button variant="paper" className="!py-1.5 !px-3 text-sm" onClick={() => setGame({ ...game, forceNext: { n, b: game.difficulty === "easy" ? 1 : b } })}>Use for next roll</Button>
      </div>
      {game.forceNext && <p className="mt-2 text-xs text-[var(--green-ink)]">Next roll is set to {game.forceNext.n} × {game.forceNext.b}.</p>}
      <Button variant="danger" className="mt-3 w-full !py-2 text-sm" onClick={() => { setGame(finishDemo(game)); onClose(); }}>End game now and see results</Button>
    </div>
  );
}
