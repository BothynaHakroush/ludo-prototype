"use client";

import { useEffect, useState } from "react";
import { Button, Modal, TopBar } from "@/components/ui";
import { ADMIN_DEMO_PASSWORD, type Question } from "@/lib/data";
import type { QLevel } from "@/lib/board";
import { useStore } from "@/lib/store";

const LEVELS: QLevel[] = ["easy", "medium", "hard"];
const TOPICS: Question["topic"][] = ["Agile", "MVC", "Design Patterns", "QA"];
const LETTERS = ["A", "B", "C", "D"];
const TIMEOUT_MS = 10 * 60 * 1000;

export default function Admin() {
  const { admin, setAdmin } = useStore();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const timedOut = admin.loggedIn && now - admin.lastActive > TIMEOUT_MS;
  useEffect(() => { if (timedOut) setAdmin({ loggedIn: false, lastActive: 0 }); }, [timedOut, setAdmin]);

  return (
    <div className="min-h-screen">
      <TopBar back={{ href: "/", label: "Menu" }}>
        {admin.loggedIn && <Button variant="ghost" className="!py-2 !px-4" onClick={() => setAdmin({ loggedIn: false, lastActive: 0 })}>Log out</Button>}
      </TopBar>
      {admin.loggedIn ? <Manage /> : <Login />}
    </div>
  );
}

function Login() {
  const { setAdmin, failed, setFailed } = useStore();
  const [mode, setMode] = useState<"login" | "create">("login");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState(ADMIN_DEMO_PASSWORD);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const locked = failed.lockedUntil > now;
  const left = Math.ceil((failed.lockedUntil - now) / 1000);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;
    if (pw === password) {
      setFailed({ count: 0, lockedUntil: 0 });
      setAdmin({ loggedIn: true, lastActive: Date.now() });
      return;
    }
    const count = failed.count + 1;
    if (count >= 5) { setFailed({ count: 0, lockedUntil: Date.now() + 5 * 60 * 1000 }); setError(null); }
    else { setFailed({ ...failed, count }); setError("Wrong user name or password. Try again."); }
    setPw("");
  };

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8 || !/[a-z]/i.test(pw) || !/\d/.test(pw)) { setError("Use at least 8 characters, with at least one letter and one number."); return; }
    if (pw !== pw2) { setError("The two passwords are not the same. Type them again."); return; }
    setPassword(pw); setPw(""); setPw2(""); setError(null); setMode("login");
  };

  return (
    <main className="max-w-[440px] mx-auto px-4 py-14">
      <div className="rounded-2xl bg-paper text-ink p-7">
        <span className="grid place-items-center w-12 h-12 rounded-xl bg-ink text-paper text-xl" aria-hidden>🔒</span>
        {mode === "login" ? (
          <>
            <h1 className="mt-4 font-display text-3xl font-bold">Administrator login</h1>
            <p className="mt-1 text-ink-soft">Question management is only for administrators. Players can&apos;t see answers here.</p>
            {locked ? (
              <div role="alert" className="mt-6 rounded-xl bg-[var(--red-tint)] text-[var(--red-ink)] p-4">
                <p className="font-bold">Login is blocked for {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}</p>
                <p className="mt-1 text-sm">There were 5 wrong tries in a row. Wait, then try again.</p>
                <button className="mt-3 text-xs underline" onClick={() => setFailed({ count: 0, lockedUntil: 0 })}>Prototype: unblock now</button>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
                <label className="text-sm font-bold">User name
                  <input defaultValue="admin" readOnly className="mt-1 block w-full rounded-xl border border-line bg-paper-2 px-4 py-3 font-normal" />
                </label>
                <label className="text-sm font-bold">Password
                  <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus
                    aria-invalid={!!error} aria-describedby="login-err"
                    className={`mt-1 block w-full rounded-xl border-2 bg-white px-4 py-3 font-normal outline-none ${error ? "border-[var(--red)]" : "border-line focus:border-ink"}`} />
                </label>
                {error && <p id="login-err" role="alert" className="text-sm text-[var(--red-ink)]">{error} {failed.count >= 3 && `${5 - failed.count} tries left before a 5-minute block.`}</p>}
                <Button variant="accent" style={{ ["--accent" as string]: "var(--ink)", ["--accent-ink" as string]: "var(--paper)" }} type="submit">Log in</Button>
              </form>
            )}
            <button onClick={() => { setMode("create"); setError(null); setPw(""); }} className="mt-5 text-sm text-ink-soft underline">First time? Create the administrator account</button>
          </>
        ) : (
          <>
            <h1 className="mt-4 font-display text-3xl font-bold">Create administrator</h1>
            <p className="mt-1 text-ink-soft">This shows only the first time the game runs, when no administrator exists yet.</p>
            <form onSubmit={create} className="mt-6 flex flex-col gap-4">
              <label className="text-sm font-bold">New password
                <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} className="mt-1 block w-full rounded-xl border-2 border-line bg-white px-4 py-3 font-normal outline-none focus:border-ink" />
                <span className="mt-1 block font-normal text-ink-soft">At least 8 characters, with a letter and a number.</span>
              </label>
              <label className="text-sm font-bold">Type it again
                <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} className="mt-1 block w-full rounded-xl border-2 border-line bg-white px-4 py-3 font-normal outline-none focus:border-ink" />
              </label>
              {error && <p role="alert" className="text-sm text-[var(--red-ink)]">{error}</p>}
              <Button variant="accent" style={{ ["--accent" as string]: "var(--ink)", ["--accent-ink" as string]: "var(--paper)" }} type="submit">Create administrator</Button>
            </form>
            <button onClick={() => { setMode("login"); setError(null); }} className="mt-5 text-sm text-ink-soft underline">Back to login</button>
          </>
        )}
      </div>
      <p className="mt-4 text-center text-sm text-paper/60">Prototype password: <span className="font-bold text-paper/85">{password}</span></p>
    </main>
  );
}

type Draft = { id: number | null; text: string; options: string[]; correct: number; level: QLevel | ""; topic: Question["topic"] };
const emptyDraft: Draft = { id: null, text: "", options: ["", "", "", ""], correct: 0, level: "", topic: "Agile" };

function validate(d: Draft, all: Question[]): Record<string, string> {
  const e: Record<string, string> = {};
  const t = d.text.trim();
  if (!t) e.text = "Write the question text.";
  else if (t.length > 300) e.text = `The question has ${t.length} characters. Use 300 or fewer.`;
  else if (all.some((q) => q.id !== d.id && q.text.trim().toLowerCase() === t.toLowerCase())) e.text = "This question already exists in the bank.";
  d.options.forEach((o, i) => {
    const v = o.trim();
    if (!v) e[`o${i}`] = `Write answer ${LETTERS[i]}.`;
    else if (v.length > 100) e[`o${i}`] = `Answer ${LETTERS[i]} has ${v.length} characters. Use 100 or fewer.`;
    else if (d.options.some((x, j) => j < i && x.trim().toLowerCase() === v.toLowerCase())) e[`o${i}`] = `Answer ${LETTERS[i]} is the same as another answer.`;
  });
  if (!d.correct) e.correct = "Mark which answer is correct.";
  if (!d.level) e.level = "Choose a difficulty.";
  return e;
}

function Manage() {
  const { questions, setQuestions, addAudit, audit, admin, setAdmin } = useStore();
  const [filter, setFilter] = useState<QLevel | "all">("all");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toDelete, setToDelete] = useState<Question | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [tab, setTab] = useState<"questions" | "log">("questions");

  const touch = () => setAdmin({ ...admin, lastActive: Date.now() });
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2600); };
  const counts = Object.fromEntries(LEVELS.map((l) => [l, questions.filter((q) => q.level === l).length])) as Record<QLevel, number>;
  const shown = questions.filter((q) => filter === "all" || q.level === filter);

  const save = () => {
    touch();
    if (!draft) return;
    const e = validate(draft, questions);
    setErrors(e);
    if (Object.keys(e).length) return;
    const q: Question = {
      id: draft.id ?? Math.max(...questions.map((x) => x.id)) + 1,
      text: draft.text.trim(), options: draft.options.map((o) => o.trim()) as Question["options"],
      correct: draft.correct as Question["correct"], level: draft.level as QLevel, topic: draft.topic,
    };
    if (draft.id) {
      const before = questions.find((x) => x.id === draft.id)!;
      setQuestions(questions.map((x) => (x.id === q.id ? q : x)));
      addAudit({ action: "Edited", questionId: q.id, detail: `Before: "${before.text}" → After: "${q.text}"` });
      flash(`Question #${q.id} saved.`);
    } else {
      setQuestions([...questions, q]);
      addAudit({ action: "Added", questionId: q.id, detail: `"${q.text}" (${q.level})` });
      flash(`Question #${q.id} added.`);
    }
    setDraft(null);
  };

  const remove = (q: Question) => {
    touch();
    setQuestions(questions.filter((x) => x.id !== q.id));
    addAudit({ action: "Deleted", questionId: q.id, detail: `"${q.text}" (${q.level})` });
    setToDelete(null);
    flash(`Question #${q.id} deleted.`);
  };

  return (
    <main className="max-w-[1180px] mx-auto px-4 sm:px-8 py-8" onClick={touch}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Question bank</h1>
          <p className="mt-1 text-paper/70">{questions.length} questions. Each level needs at least 10. You are logged out after 10 minutes without activity.</p>
        </div>
        <Button onClick={() => { setDraft({ ...emptyDraft, options: ["", "", "", ""] }); setErrors({}); }}>Add question</Button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-felt-line" role="tablist">
        {(["questions", "log"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 font-bold border-b-2 -mb-px ${tab === t ? "border-paper" : "border-transparent text-paper/60 hover:text-paper"}`}>
            {t === "questions" ? "Questions" : `Change log (${audit.length})`}
          </button>
        ))}
      </div>

      {tab === "questions" ? (
        <>
          <div className="mt-5 flex flex-wrap gap-2" aria-label="Filter by difficulty">
            {(["all", ...LEVELS] as const).map((l) => (
              <button key={l} onClick={() => setFilter(l)} aria-pressed={filter === l}
                className={`rounded-full px-4 py-1.5 text-sm font-bold border ${filter === l ? "bg-paper text-ink border-paper" : "border-felt-line hover:border-paper/60"}`}>
                {l === "all" ? `All (${questions.length})` : `${l[0].toUpperCase() + l.slice(1)} (${counts[l]})`}
              </button>
            ))}
          </div>
          <ul className="mt-4 flex flex-col gap-2">
            {shown.map((q) => (
              <li key={q.id} className="rounded-2xl bg-paper text-ink p-4 grid md:grid-cols-[1fr_auto] gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
                    <span className="font-bold">#{q.id}</span>
                    <span className="inline-flex items-center gap-1 capitalize"><span className="w-2 h-2 rounded-full" style={{ background: `var(--q-${q.level})` }} />{q.level}</span>
                    <span>{q.topic}</span>
                  </div>
                  <p className="mt-1 font-bold">{q.text}</p>
                  <ol className="mt-2 grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                    {q.options.map((o, i) => (
                      <li key={i} className={i + 1 === q.correct ? "font-bold text-[var(--green-ink)]" : "text-ink-soft"}>
                        {LETTERS[i]}. {o}{i + 1 === q.correct && " ✓"}
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="flex md:flex-col gap-2 md:items-end">
                  <Button variant="paper" className="!py-1.5 !px-4 text-sm" onClick={() => { setDraft({ id: q.id, text: q.text, options: [...q.options], correct: q.correct, level: q.level, topic: q.topic }); setErrors({}); }}>Edit</Button>
                  <Button variant="paper" className="!py-1.5 !px-4 text-sm text-[var(--red-ink)]" onClick={() => setToDelete(q)}>Delete</Button>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="mt-5 rounded-2xl bg-paper text-ink overflow-x-auto">
          {audit.length === 0 ? (
            <p className="p-6 text-ink-soft">No changes yet. Every add, edit and delete is recorded here with the time and administrator.</p>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="border-b border-line text-ink-soft"><tr><th className="px-4 py-3">Time</th><th className="px-4 py-3">Admin</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Question</th><th className="px-4 py-3">Details</th></tr></thead>
              <tbody>{audit.map((a, i) => (
                <tr key={i} className="border-b border-line/70 last:border-0"><td className="px-4 py-3 whitespace-nowrap tabular-nums">{a.at}</td><td className="px-4 py-3">{a.admin}</td><td className="px-4 py-3 font-bold">{a.action}</td><td className="px-4 py-3">#{a.questionId}</td><td className="px-4 py-3">{a.detail}</td></tr>
              ))}</tbody>
            </table>
          )}
        </div>
      )}

      {toast && <p role="status" className="anim-rise fixed bottom-5 left-1/2 -translate-x-1/2 rounded-xl bg-paper text-ink px-5 py-3 font-bold shadow-xl">{toast}</p>}

      {draft && (
        <div className="fixed inset-0 z-50 bg-[#0e1530]/70 grid place-items-center p-4 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="q-form">
          <div className="anim-rise w-full max-w-2xl rounded-2xl bg-paper text-ink p-6 my-8">
            <h2 id="q-form" className="font-display text-2xl font-bold">{draft.id ? `Edit question #${draft.id}` : "Add a question"}</h2>
            <label className="mt-4 block text-sm font-bold">Question
              <textarea value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} rows={2}
                className={`mt-1 block w-full rounded-xl border-2 bg-white px-3 py-2 font-normal outline-none ${errors.text ? "border-[var(--red)]" : "border-line focus:border-ink"}`} />
              <span className="mt-1 flex justify-between font-normal"><span className="text-[var(--red-ink)]">{errors.text}</span><span className="text-ink-soft">{draft.text.trim().length}/300</span></span>
            </label>
            <fieldset className="mt-3">
              <legend className="text-sm font-bold">Answers (mark the correct one)</legend>
              <div className="mt-1 flex flex-col gap-2">
                {draft.options.map((o, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-sm">
                        <input type="radio" name="correct" checked={draft.correct === i + 1} onChange={() => setDraft({ ...draft, correct: i + 1 })} className="w-4 h-4 accent-[var(--green)]" aria-label={`Answer ${LETTERS[i]} is correct`} />
                        <span className="w-5 font-bold">{LETTERS[i]}</span>
                      </label>
                      <input value={o} onChange={(e) => { const options = [...draft.options]; options[i] = e.target.value; setDraft({ ...draft, options }); }}
                        aria-label={`Answer ${LETTERS[i]}`}
                        className={`flex-1 rounded-xl border-2 bg-white px-3 py-2 outline-none ${errors[`o${i}`] ? "border-[var(--red)]" : "border-line focus:border-ink"}`} />
                    </div>
                    {errors[`o${i}`] && <p className="ml-12 mt-0.5 text-sm text-[var(--red-ink)]">{errors[`o${i}`]}</p>}
                  </div>
                ))}
              </div>
              {errors.correct && <p className="mt-1 text-sm text-[var(--red-ink)]">{errors.correct}</p>}
            </fieldset>
            <div className="mt-3 grid sm:grid-cols-2 gap-3">
              <label className="text-sm font-bold">Difficulty
                <select value={draft.level} onChange={(e) => setDraft({ ...draft, level: e.target.value as QLevel })}
                  className={`mt-1 block w-full rounded-xl border-2 bg-white px-3 py-2 font-normal ${errors.level ? "border-[var(--red)]" : "border-line"}`}>
                  <option value="">Choose…</option>{LEVELS.map((l) => <option key={l} value={l} className="capitalize">{l}</option>)}
                </select>
                {errors.level && <span className="font-normal text-[var(--red-ink)]">{errors.level}</span>}
              </label>
              <label className="text-sm font-bold">Topic
                <select value={draft.topic} onChange={(e) => setDraft({ ...draft, topic: e.target.value as Question["topic"] })} className="mt-1 block w-full rounded-xl border-2 border-line bg-white px-3 py-2 font-normal">
                  {TOPICS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </label>
            </div>
            {Object.keys(errors).length > 0 && <p role="alert" className="mt-4 rounded-xl bg-[var(--red-tint)] text-[var(--red-ink)] p-3 text-sm">The question was not saved. Fix the {Object.keys(errors).length} marked field{Object.keys(errors).length > 1 ? "s" : ""}.</p>}
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="paper" onClick={() => { setDraft(null); setErrors({}); }}>{draft.id ? "Cancel edit" : "Cancel"}</Button>
              <Button variant="accent" style={{ ["--accent" as string]: "var(--ink)", ["--accent-ink" as string]: "var(--paper)" }} onClick={save}>{draft.id ? "Save changes" : "Add question"}</Button>
            </div>
          </div>
        </div>
      )}

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title={`Delete question #${toDelete?.id}?`}>
        {toDelete && (counts[toDelete.level] <= 10 ? (
          <>
            <p className="text-ink-soft">This can&apos;t be deleted. The {toDelete.level} level has only {counts[toDelete.level]} questions, and the game needs at least 10. Add another {toDelete.level} question first.</p>
            <div className="mt-6 flex justify-end"><Button variant="paper" onClick={() => setToDelete(null)}>OK</Button></div>
          </>
        ) : (
          <>
            <p className="text-ink-soft">&ldquo;{toDelete.text}&rdquo; will be removed from the bank. This is recorded in the change log.</p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="paper" onClick={() => setToDelete(null)}>Keep it</Button>
              <Button variant="danger" onClick={() => remove(toDelete)}>Delete question</Button>
            </div>
          </>
        ))}
      </Modal>
    </main>
  );
}
