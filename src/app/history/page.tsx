"use client";

import { useMemo, useState } from "react";
import { LinkButton, TopBar } from "@/components/ui";
import { CSV_HEADER } from "@/lib/data";
import { useStore } from "@/lib/store";

type Sort = "newest" | "oldest" | "difficulty";
const DIFF_ORDER = { easy: 0, medium: 1, hard: 2 };
const toDate = (ts: string) => {
  const [d, t] = ts.split(";");
  const [dd, mm, yy] = d.split("/").map(Number);
  return new Date(`${yy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}T${t}`).getTime();
};

export default function History() {
  const { history, historyError, setHistoryError } = useStore();
  const [sort, setSort] = useState<Sort>("newest");
  const [showEmpty, setShowEmpty] = useState(false);
  const [showCsv, setShowCsv] = useState(false);

  const rows = useMemo(() => {
    const r = [...history];
    if (sort === "newest") r.sort((a, b) => toDate(b.timestamp) - toDate(a.timestamp));
    if (sort === "oldest") r.sort((a, b) => toDate(a.timestamp) - toDate(b.timestamp));
    if (sort === "difficulty") r.sort((a, b) => DIFF_ORDER[b.difficulty] - DIFF_ORDER[a.difficulty] || toDate(b.timestamp) - toDate(a.timestamp));
    return showEmpty ? [] : r;
  }, [history, sort, showEmpty]);

  return (
    <div className="min-h-screen">
      <TopBar back={{ href: "/", label: "Menu" }} />
      <main className="max-w-[1100px] mx-auto px-4 sm:px-8 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight">Game history</h1>
            <p className="mt-1 text-paper/70">Every finished game, from game_history.csv.</p>
          </div>
          {!historyError && rows.length > 0 && (
            <label className="text-sm text-paper/80">
              Sort by
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="ml-2 rounded-lg bg-paper text-ink px-3 py-2">
                <option value="newest">Date, newest first</option>
                <option value="oldest">Date, oldest first</option>
                <option value="difficulty">Difficulty, hardest first</option>
              </select>
            </label>
          )}
        </div>

        {historyError ? (
          <div role="alert" className="mt-8 rounded-2xl bg-[var(--red-tint)] text-[var(--red-ink)] p-6">
            <h2 className="font-display text-xl font-bold">Game history can&apos;t be read</h2>
            <p className="mt-2">The file game_history.csv is damaged or missing. No history is shown, so you don&apos;t see wrong results. Restore the file from a backup, or delete it to start a new one.</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="mt-8 rounded-2xl border-2 border-dashed border-felt-line p-10 text-center">
            <h2 className="font-display text-2xl font-bold">No games yet</h2>
            <p className="mt-2 text-paper/70">Finished games show up here with the winners, difficulty and time.</p>
            <LinkButton href="/setup" className="mt-5">Start a new game</LinkButton>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-2xl bg-paper text-ink">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-ink-soft">
                <tr>
                  <th className="px-4 py-3 font-bold">Game</th><th className="px-4 py-3 font-bold">Date and time</th>
                  <th className="px-4 py-3 font-bold">Difficulty</th><th className="px-4 py-3 font-bold">1st</th>
                  <th className="px-4 py-3 font-bold">2nd</th><th className="px-4 py-3 font-bold">3rd</th>
                  <th className="px-4 py-3 font-bold">4th</th><th className="px-4 py-3 font-bold">Duration</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.gameID} className="border-b border-line/70 last:border-0">
                    <td className="px-4 py-3 tabular-nums">#{r.gameID}</td>
                    <td className="px-4 py-3 tabular-nums whitespace-nowrap">{r.timestamp.replace(";", ", ")}</td>
                    <td className="px-4 py-3"><DiffChip d={r.difficulty} /></td>
                    {r.places.map((p, i) => <td key={i} className={`px-4 py-3 ${i === 0 ? "font-bold" : ""}`}>{p || <span className="text-ink-soft/50">–</span>}</td>)}
                    <td className="px-4 py-3 tabular-nums">{r.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <section className="mt-10 rounded-2xl border border-dashed border-paper/30 p-5 text-sm">
          <h2 className="font-display font-bold text-base">Prototype tools</h2>
          <p className="mt-1 text-paper/65">Preview the other states of this screen.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => { setShowEmpty((v) => !v); setHistoryError(false); }} className="rounded-lg border border-felt-line px-3 py-1.5 hover:bg-felt-line/50">{showEmpty ? "Show records" : "Show empty state"}</button>
            <button onClick={() => { setHistoryError(!historyError); setShowEmpty(false); }} className="rounded-lg border border-felt-line px-3 py-1.5 hover:bg-felt-line/50">{historyError ? "Fix the file" : "Simulate a damaged file"}</button>
            <button onClick={() => setShowCsv((v) => !v)} className="rounded-lg border border-felt-line px-3 py-1.5 hover:bg-felt-line/50">{showCsv ? "Hide CSV" : "Show CSV file"}</button>
          </div>
          {showCsv && (
            <pre className="mt-3 overflow-x-auto rounded-xl bg-felt-deep p-4 text-xs text-paper/85">
              {[CSV_HEADER, ...history.map((r) => [r.gameID, r.difficulty, r.timestamp, ...r.places, r.duration].join(","))].join("\n")}
            </pre>
          )}
        </section>
      </main>
    </div>
  );
}

function DiffChip({ d }: { d: "easy" | "medium" | "hard" }) {
  const c = { easy: "var(--q-easy)", medium: "var(--q-medium)", hard: "var(--q-hard)" }[d];
  return <span className="inline-flex items-center gap-2 capitalize"><span className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />{d}</span>;
}
