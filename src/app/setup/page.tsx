"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Board } from "@/components/Board";
import { Button, COLORS, TopBar } from "@/components/ui";
import { buildBoard, COLOR_ORDER, type ColorId, type Difficulty } from "@/lib/board";
import { newGame } from "@/lib/engine";
import { useStore, type SetupDraft } from "@/lib/store";

const LEVELS: { id: Difficulty; title: string; board: string; dice: string; extras: string }[] = [
  { id: "easy", title: "Easy", board: "Standard board, 52 squares", dice: "Normal die", extras: "Protection and arrow squares" },
  { id: "medium", title: "Medium", board: "Adds an outer route of 64 squares", dice: "Normal die × Boost die (1–3)", extras: "6 question squares, 2 surprises" },
  { id: "hard", title: "Hard", board: "Adds outer routes of 64 and 72 squares", dice: "Normal die × UltraBoost die (1–6)", extras: "9 question squares, 3 surprises" },
];

const NAME_OK = /^[\p{L}\p{N} _'-]+$/u;

function validateName(name: string, all: string[], i: number): string | null {
  const t = name.trim();
  if (!t) return "Enter a name or nickname.";
  if (t.length > 15) return `This name has ${t.length} characters. Use 15 or fewer.`;
  if (!NAME_OK.test(t)) return "Use letters, numbers, spaces, - or _ only.";
  if (all.some((n, j) => j !== i && n.trim().toLowerCase() === t.toLowerCase())) return "Another player already has this name. Choose a different one.";
  return null;
}

export default function Setup() {
  const router = useRouter();
  const { draft, setDraft, setGame } = useStore();
  const [tried, setTried] = useState(false);
  const preview = useMemo(() => buildBoard(draft.difficulty ?? "easy", 11), [draft.difficulty]);

  const update = (d: Partial<SetupDraft>) => setDraft({ ...draft, ...d });
  const setCount = (count: 2 | 3 | 4) => {
    const players = Array.from({ length: count }, (_, i) => draft.players[i] ?? { name: "", color: null });
    update({ count, players });
  };
  const setPlayer = (i: number, p: Partial<{ name: string; color: ColorId | null }>) => {
    const players = draft.players.map((x, j) => (j === i ? { ...x, ...p } : x));
    update({ players });
  };

  const names = draft.players.map((p) => p.name);
  const nameErrors = draft.players.map((p, i) => validateName(p.name, names, i));
  const colorErrors = draft.players.map((p) => (p.color ? null : "Pick a color."));
  const missing: string[] = [];
  if (!draft.count) missing.push("the number of players");
  if (!draft.difficulty) missing.push("a difficulty");
  const playersOk = draft.count && nameErrors.every((e) => !e) && colorErrors.every((e) => !e);

  const start = () => {
    setTried(true);
    if (missing.length || !playersOk) return;
    setGame(newGame(draft.difficulty!, draft.players.map((p) => ({ name: p.name.trim(), color: p.color! }))));
    router.push("/game");
  };

  return (
    <div className="min-h-screen">
      <TopBar back={{ href: "/", label: "Menu" }} />
      <main className="max-w-[1180px] mx-auto px-4 sm:px-8 py-8 grid lg:grid-cols-[minmax(0,1fr)_340px] gap-10">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">New game</h1>
          <p className="mt-2 text-paper/70">Three quick steps. You can change anything before you start.</p>

          <Step n={1} title="How many players?">
            <div className="flex gap-3" role="radiogroup" aria-label="Number of players">
              {([2, 3, 4] as const).map((c) => (
                <button key={c} role="radio" aria-checked={draft.count === c} onClick={() => setCount(c)}
                  className={`w-20 h-16 rounded-xl font-display text-2xl font-bold border-2 transition ${draft.count === c ? "bg-paper text-ink border-paper" : "border-felt-line hover:border-paper/60"}`}>
                  {c}
                </button>
              ))}
            </div>
            {tried && !draft.count && <ErrorText>Choose how many people will play.</ErrorText>}
          </Step>

          <Step n={2} title="Choose difficulty">
            <div className="grid sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Difficulty">
              {LEVELS.map((l) => {
                const on = draft.difficulty === l.id;
                return (
                  <button key={l.id} role="radio" aria-checked={on} onClick={() => update({ difficulty: l.id })}
                    className={`flex flex-col items-start justify-start text-left rounded-2xl p-4 border-2 transition ${on ? "bg-paper text-ink border-paper" : "border-felt-line hover:border-paper/60"}`}>
                    <span className="block font-display text-xl font-bold">{l.title}</span>
                    <span className={`mt-2 block text-sm leading-snug ${on ? "text-ink-soft" : "text-paper/70"}`}>{l.board}</span>
                    <span className={`mt-1 block text-sm leading-snug ${on ? "text-ink-soft" : "text-paper/70"}`}>{l.dice}</span>
                    <span className={`mt-1 block text-sm leading-snug ${on ? "text-ink-soft" : "text-paper/70"}`}>{l.extras}</span>
                  </button>
                );
              })}
            </div>
            {tried && !draft.difficulty && <ErrorText>Choose Easy, Medium or Hard.</ErrorText>}
          </Step>

          <Step n={3} title="Who is playing?">
            {!draft.count ? (
              <p className="text-paper/60">Choose the number of players first.</p>
            ) : (
              <ol className="flex flex-col gap-3">
                {draft.players.map((p, i) => {
                  const nErr = tried || p.name ? nameErrors[i] : null;
                  const cErr = tried ? colorErrors[i] : null;
                  return (
                    <li key={i} className="rounded-2xl bg-felt-deep/70 border border-felt-line p-4">
                      <div className="flex flex-wrap items-start gap-4">
                        <div className="flex-1 min-w-[200px]">
                          <label htmlFor={`name-${i}`} className="block text-sm text-paper/70 mb-1">Player {i + 1} name</label>
                          <input id={`name-${i}`} value={p.name} maxLength={30} autoComplete="off"
                            onChange={(e) => setPlayer(i, { name: e.target.value })}
                            aria-invalid={!!nErr} aria-describedby={nErr ? `name-err-${i}` : undefined}
                            className={`w-full rounded-xl bg-paper text-ink px-4 py-3 text-lg outline-none border-2 ${nErr ? "border-[var(--red)]" : "border-transparent focus:border-[#ffd166]"}`}
                            placeholder="Name or nickname" />
                          <div className="mt-1 flex justify-between text-sm">
                            <span id={`name-err-${i}`} className="text-[#ff9b9b]">{nErr}</span>
                            <span className={p.name.trim().length > 15 ? "text-[#ff9b9b]" : "text-paper/50"}>{p.name.trim().length}/15</span>
                          </div>
                        </div>
                        <fieldset>
                          <legend className="text-sm text-paper/70 mb-1">Color</legend>
                          <div className="flex gap-2">
                            {COLOR_ORDER.map((c) => {
                              const owner = draft.players.findIndex((x, j) => j !== i && x.color === c);
                              const taken = owner >= 0;
                              const on = p.color === c;
                              return (
                                <button key={c} type="button" disabled={taken} onClick={() => setPlayer(i, { color: c })}
                                  aria-pressed={on} aria-label={taken ? `${COLORS[c].label}, taken by player ${owner + 1}` : COLORS[c].label}
                                  title={taken ? `Taken by ${draft.players[owner].name || `player ${owner + 1}`}` : COLORS[c].label}
                                  className={`relative w-12 h-12 rounded-xl border-[3px] transition ${on ? "border-paper scale-105" : "border-transparent"} ${taken ? "opacity-25 cursor-not-allowed" : "hover:scale-105"}`}
                                  style={{ background: COLORS[c].fill }}>
                                  {on && <span className="absolute inset-0 grid place-items-center text-white text-xl font-bold">✓</span>}
                                  {taken && <span className="absolute inset-0 grid place-items-center text-white text-xs font-bold">P{owner + 1}</span>}
                                </button>
                              );
                            })}
                          </div>
                          {cErr && <span className="block mt-1 text-sm text-[#ff9b9b]">{cErr}</span>}
                        </fieldset>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </Step>
        </div>

        <aside className="lg:sticky lg:top-6 self-start rounded-2xl bg-paper text-ink p-5">
          <h2 className="font-display text-xl font-bold">Your game</h2>
          <div className="mt-4 w-full max-w-[300px] mx-auto">
            <Board board={preview} pieces={[]} decorative className="w-full" />
          </div>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-ink-soft">Players</dt><dd className="font-bold">{draft.count ?? "Not chosen"}</dd>
            <dt className="text-ink-soft">Difficulty</dt><dd className="font-bold capitalize">{draft.difficulty ?? "Not chosen"}</dd>
          </dl>
          <ul className="mt-3 flex flex-col gap-1">
            {draft.players.map((p, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full" style={{ background: p.color ? COLORS[p.color].fill : "#ccc" }} />
                {p.name.trim() || <span className="text-ink-soft">Player {i + 1}</span>}
              </li>
            ))}
          </ul>
          {tried && (missing.length > 0 || !playersOk) && (
            <p role="alert" className="mt-4 rounded-xl bg-[var(--red-tint)] text-[var(--red-ink)] p-3 text-sm">
              {missing.length ? `Choose ${missing.join(" and ")} to continue.` : "Fix the marked player details to continue."}
            </p>
          )}
          <Button className="mt-5 w-full text-lg" variant="accent" style={{ ["--accent" as string]: "var(--ink)", ["--accent-ink" as string]: "var(--paper)" }} onClick={start}>
            Start game
          </Button>
        </aside>
      </main>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-9" aria-labelledby={`step-${n}`}>
      <h2 id={`step-${n}`} className="flex items-center gap-3 font-display text-2xl font-bold mb-4">
        <span className="grid place-items-center w-9 h-9 rounded-full border-2 border-paper/40 text-base">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-sm text-[#ff9b9b]">{children}</p>;
}
