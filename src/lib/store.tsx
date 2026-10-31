"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { SEED_HISTORY, SEED_QUESTIONS, type AuditEntry, type HistoryRecord, type Question } from "./data";
import { fmtDuration, fmtTimestamp, setBank, type GameState } from "./engine";
import type { ColorId, Difficulty } from "./board";

export interface SetupDraft {
  count: 2 | 3 | 4 | null;
  difficulty: Difficulty | null;
  players: { name: string; color: ColorId | null }[];
}

interface Store {
  game: GameState | null;
  setGame: (g: GameState | null) => void;
  draft: SetupDraft;
  setDraft: (d: SetupDraft) => void;
  history: HistoryRecord[];
  saveResult: (g: GameState) => HistoryRecord | null;
  historyError: boolean;
  setHistoryError: (v: boolean) => void;
  questions: Question[];
  setQuestions: (q: Question[]) => void;
  audit: AuditEntry[];
  addAudit: (a: Omit<AuditEntry, "at" | "admin">) => void;
  admin: { loggedIn: boolean; lastActive: number };
  setAdmin: (a: { loggedIn: boolean; lastActive: number }) => void;
  failed: { count: number; lockedUntil: number };
  setFailed: (f: { count: number; lockedUntil: number }) => void;
  savedGameIds: Record<number, number>;
  ready: boolean;
}

const Ctx = createContext<Store | null>(null);
const KEY = "spider-ludo-prototype";

export const emptyDraft: SetupDraft = { count: null, difficulty: null, players: [] };

export function StoreProvider({ children }: { children: ReactNode }) {
  const [game, setGame] = useState<GameState | null>(null);
  const [draft, setDraft] = useState<SetupDraft>(emptyDraft);
  const [history, setHistory] = useState<HistoryRecord[]>(SEED_HISTORY);
  const [historyError, setHistoryError] = useState(false);
  const [questions, setQuestions] = useState<Question[]>(SEED_QUESTIONS);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [admin, setAdmin] = useState({ loggedIn: false, lastActive: 0 });
  const [failed, setFailed] = useState({ count: 0, lockedUntil: 0 });
  const [savedGameIds, setSaved] = useState<Record<number, number>>({});
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  // Restore after refresh (per browser tab only).
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.game) setGame(d.game);
        if (d.draft) setDraft(d.draft);
        if (d.history) setHistory(d.history);
        if (d.questions) setQuestions(d.questions);
        if (d.audit) setAudit(d.audit);
        if (d.admin) setAdmin(d.admin);
        if (d.savedGameIds) setSaved(d.savedGameIds);
      }
    } catch { /* storage blocked: start fresh */ }
    loaded.current = true;
    setReady(true);
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ game, draft, history, questions, audit, admin, savedGameIds }));
    } catch { /* ignore */ }
  }, [game, draft, history, questions, audit, admin, savedGameIds]);

  useEffect(() => { setBank(questions); }, [questions]);

  const saveResult = (g: GameState) => {
    if (savedGameIds[g.seed]) return history.find((h) => h.gameID === savedGameIds[g.seed]) ?? null;
    const places = ["", "", "", ""] as HistoryRecord["places"];
    g.finishOrder.forEach((pi, i) => { places[i] = g.players[pi].name; });
    const rec: HistoryRecord = {
      gameID: (history.at(-1)?.gameID ?? 0) + 1,
      difficulty: g.difficulty,
      timestamp: fmtTimestamp(new Date(g.endedAt ?? Date.now())),
      places,
      duration: fmtDuration((g.endedAt ?? Date.now()) - g.startedAt),
    };
    setHistory((h) => [...h, rec]);
    setSaved((x) => ({ ...x, [g.seed]: rec.gameID }));
    return rec;
  };

  const addAudit = (a: Omit<AuditEntry, "at" | "admin">) =>
    setAudit((x) => [{ ...a, at: fmtTimestamp(new Date()).replace(";", " "), admin: "admin" }, ...x]);

  return (
    <Ctx.Provider value={{
      game, setGame, draft, setDraft, history, saveResult, historyError, setHistoryError,
      questions, setQuestions, audit, addAudit, admin, setAdmin, failed, setFailed, savedGameIds, ready,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside provider");
  return s;
}
