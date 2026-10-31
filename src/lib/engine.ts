import { buildBoard, key, type BoardLayout, type ColorId, type Difficulty, type QLevel } from "./board";
import { QUESTION_STEPS, SURPRISE_TABLE, type Question, type SurpriseId } from "./data";

export interface Player {
  name: string;
  color: ColorId;
  pieces: number[]; // -1 = castle, else index on route
  rank: number | null;
  skipNext: boolean;
}

export type Phase = "roll" | "choose" | "noMove" | "question" | "answered" | "surprise" | "opponentPick" | "over";

export interface Dice { n: number; b: number; ultra?: boolean; aim?: boolean }

export interface GameState {
  seed: number;
  difficulty: Difficulty;
  startedAt: number;
  endedAt: number | null;
  players: Player[];
  current: number;
  phase: Phase;
  dice: Dice | null;
  sixes: number;
  ultraNext: boolean;
  forceNext: Dice | null;
  script: number[];
  question: { q: Question; piece: number; choice: number | null } | null;
  surprise: { id: SurpriseId; piece: number; detail?: string } | null;
  notice: { text: string; tone: "info" | "good" | "bad" } | null;
  usedQuestions: number[];
  finishOrder: number[];
  log: string[];
  moved: { color: ColorId; piece: number } | null;
}

// Prototype: fixed first rolls per player so testers meet the main rules quickly.
const SCRIPT: Dice[][] = [
  [{ n: 6, b: 2 }, { n: 3, b: 2 }, { n: 1, b: 3, aim: true }],
  [{ n: 4, b: 1 }, { n: 6, b: 2 }, { n: 5, b: 2 }],
  [{ n: 6, b: 3 }, { n: 2, b: 2 }],
  [{ n: 1, b: 1 }, { n: 6, b: 1 }],
];

const boards = new Map<string, BoardLayout>();
export function boardOf(s: Pick<GameState, "difficulty" | "seed">): BoardLayout {
  const k = `${s.difficulty}-${s.seed}`;
  if (!boards.has(k)) boards.set(k, buildBoard(s.difficulty, s.seed));
  return boards.get(k)!;
}

export function newGame(difficulty: Difficulty, players: { name: string; color: ColorId }[]): GameState {
  return {
    seed: Math.floor(Math.random() * 1e9) + 1,
    difficulty,
    startedAt: Date.now(),
    endedAt: null,
    players: players.map((p) => ({ ...p, pieces: [-1, -1, -1, -1], rank: null, skipNext: false })),
    current: 0,
    phase: "roll",
    dice: null,
    sixes: 0,
    ultraNext: false,
    forceNext: null,
    script: players.map(() => 0),
    question: null,
    surprise: null,
    notice: null,
    usedQuestions: [],
    finishOrder: [],
    log: [`Game started on ${difficulty}. ${players[0].name} goes first.`],
    moved: null,
  };
}

const clone = (s: GameState): GameState => JSON.parse(JSON.stringify(s));
const d6 = () => 1 + Math.floor(Math.random() * 6);
const d3 = () => 1 + Math.floor(Math.random() * 3);
export const lastIndex = (b: BoardLayout, c: ColorId) => b.routes[c].path.length - 1;

function cellOf(b: BoardLayout, p: Player, piece: number) {
  const pos = p.pieces[piece];
  return pos < 0 ? null : key(b.routes[p.color].path[pos]);
}

function occupants(s: GameState, b: BoardLayout, k: string) {
  const out: { player: number; piece: number }[] = [];
  s.players.forEach((p, pi) => p.pieces.forEach((_, i) => { if (cellOf(b, p, i) === k) out.push({ player: pi, piece: i }); }));
  return out;
}

export function isProtected(b: BoardLayout, k: string) {
  const sq = b.squares[k];
  if (b.homeCells[k]) return true;
  return !!sq && (sq.kind === "protect" || sq.kind === "start" || sq.kind === "surprise");
}

function opponentBlock(s: GameState, b: BoardLayout, pi: number, k: string) {
  const occ = occupants(s, b, k).filter((o) => o.player !== pi);
  return occ.length >= 2 && occ.every((o) => o.player === occ[0].player);
}

// Walk forward/back respecting exact-home and Double Block rules. Returns null when illegal.
function walk(s: GameState, b: BoardLayout, pi: number, from: number, steps: number): number | null {
  const last = lastIndex(b, s.players[pi].color);
  const path = b.routes[s.players[pi].color].path;
  const dir = Math.sign(steps);
  let pos = from;
  for (let i = 0; i < Math.abs(steps); i++) {
    const next = pos + dir;
    if (next > last) return dir > 0 ? null : pos; // exact roll needed for Final Home
    if (next < 0) return pos; // cannot go behind the start square
    if (opponentBlock(s, b, pi, key(path[next]))) return pos === from ? null : pos; // stop before a Double Block
    pos = next;
  }
  return pos;
}

export function stepsFor(s: GameState, b: BoardLayout, pi: number, piece: number) {
  const d = s.dice!;
  const pos = s.players[pi].pieces[piece];
  const inHome = pos >= b.routes[s.players[pi].color].homeStart;
  return inHome ? d.n : d.n * d.b; // home path uses the Normal Die only (course spec)
}

export function legalMoves(s: GameState, b: BoardLayout): { piece: number; to: number }[] {
  const pi = s.current, p = s.players[pi], d = s.dice;
  if (!d) return [];
  const out: { piece: number; to: number }[] = [];
  p.pieces.forEach((pos, i) => {
    if (pos === lastIndex(b, p.color)) return;
    if (pos < 0) { if (d.n === 6) out.push({ piece: i, to: 0 }); return; }
    const to = walk(s, b, pi, pos, stepsFor(s, b, pi, i));
    if (to !== null && to !== pos) out.push({ piece: i, to });
  });
  return out;
}

// Prototype: pick a roll that lands the player's piece on the next Surprise square, if one is close.
function aimAtSurprise(s: GameState, b: BoardLayout, pi: number): Dice | null {
  const p = s.players[pi], path = b.routes[p.color].path;
  for (const pos of p.pieces) {
    if (pos < 0) continue;
    for (let d = 1; d <= 18; d++) {
      const sq = b.squares[key(path[pos + d] ?? [-1, -1])];
      if (sq?.kind !== "surprise") continue;
      for (const m of [1, 2, 3]) if (d % m === 0 && d / m <= 6 && d / m !== 6) return { n: d / m, b: s.difficulty === "easy" ? 1 : m };
    }
  }
  return null;
}

export function roll(prev: GameState): GameState {
  const s = clone(prev), b = boardOf(s), pi = s.current;
  const boost = s.ultraNext || s.difficulty === "hard" ? d6 : s.difficulty === "medium" ? d3 : () => 1;
  let dice: Dice;
  if (s.forceNext) { dice = s.forceNext; s.forceNext = null; }
  else if (SCRIPT[pi]?.[s.script[pi]]) {
    dice = { ...SCRIPT[pi][s.script[pi]] }; s.script[pi]++;
    if (dice.aim) { const a = aimAtSurprise(s, b, pi); if (a) dice = a; delete dice.aim; }
  }
  else dice = { n: d6(), b: boost() };
  if (s.difficulty === "easy" && !s.ultraNext) dice.b = 1;
  if (s.ultraNext) { dice.ultra = true; s.ultraNext = false; }
  s.dice = dice;
  s.moved = null;
  const name = s.players[pi].name;
  const total = dice.b > 1 ? `${dice.n} × ${dice.b}` : `${dice.n}`;
  s.log.unshift(`${name} rolled ${total}.`);

  if (dice.n === 6) {
    s.sixes++;
    if (s.sixes === 3) {
      s.notice = { text: "Third 6 in a row. This roll is cancelled and the turn passes.", tone: "bad" };
      s.log.unshift(`${name}'s third 6 was cancelled.`);
      s.phase = "noMove";
      s.dice = { ...dice, n: 0 };
      return s;
    }
  }
  const moves = legalMoves(s, b);
  if (!moves.length) {
    const noneOut = s.players[pi].pieces.every((x) => x < 0);
    s.notice = {
      text: noneOut ? "You need a 6 to bring a piece out. The turn passes." : "No piece can move with this roll. The turn passes.",
      tone: "info",
    };
    s.phase = "noMove";
  } else {
    s.notice = null;
    s.phase = "choose";
  }
  return s;
}

function sendHomeIfCaptured(s: GameState, b: BoardLayout, pi: number, k: string) {
  if (isProtected(b, k)) return;
  const opp = occupants(s, b, k).filter((o) => o.player !== pi);
  if (opp.length === 1) {
    const o = opp[0];
    s.players[o.player].pieces[o.piece] = -1;
    s.notice = { text: `Captured! ${s.players[o.player].name}'s piece goes back to the castle.`, tone: "good" };
    s.log.unshift(`${s.players[pi].name} captured ${s.players[o.player].name}.`);
  }
}

function checkFinished(s: GameState, b: BoardLayout, pi: number) {
  const p = s.players[pi];
  if (p.rank === null && p.pieces.every((x) => x === lastIndex(b, p.color))) {
    s.finishOrder.push(pi);
    p.rank = s.finishOrder.length;
    s.log.unshift(`${p.name} finished in place ${p.rank}!`);
    const left = s.players.map((x, i) => i).filter((i) => s.players[i].rank === null);
    if (left.length <= 1) {
      if (left.length === 1) { s.finishOrder.push(left[0]); s.players[left[0]].rank = s.finishOrder.length; }
      s.phase = "over";
      s.endedAt = Date.now();
    }
  }
}

export function move(prev: GameState, piece: number): GameState {
  const s = clone(prev), b = boardOf(s), pi = s.current, p = s.players[pi];
  const m = legalMoves(s, b).find((x) => x.piece === piece);
  if (!m) return prev;
  p.pieces[piece] = m.to;
  s.moved = { color: p.color, piece };
  s.notice = null;
  const k = key(b.routes[p.color].path[m.to]);
  sendHomeIfCaptured(s, b, pi, k);
  s.log.unshift(m.to === 0 && prev.players[pi].pieces[piece] < 0 ? `${p.name} brought a piece out.` : `${p.name} moved a piece.`);
  checkFinished(s, b, pi);
  if (s.phase === "over") return s;

  const sq = b.squares[k];
  if (sq?.kind === "question") return openQuestion(s, sq.qLevel!, piece);
  if (sq?.kind === "surprise") return openSurprise(s, piece);
  return endTurn(s);
}

function openQuestion(s: GameState, level: QLevel, piece: number, bank = currentBank): GameState {
  let pool = bank.filter((q) => q.level === level && !s.usedQuestions.includes(q.id));
  if (!pool.length) { // every question of this level was used: allow repeats (FR-4.07)
    s.usedQuestions = s.usedQuestions.filter((id) => bank.find((q) => q.id === id)?.level !== level);
    pool = bank.filter((q) => q.level === level);
  }
  const q = pool[Math.floor(Math.random() * pool.length)];
  s.usedQuestions.push(q.id);
  s.question = { q, piece, choice: null };
  s.phase = "question";
  return s;
}

// The live bank (admin edits change it). Set by the store.
let currentBank: Question[] = [];
export const setBank = (b: Question[]) => { currentBank = b; };

export function answer(prev: GameState, choice: number): GameState {
  const s = clone(prev), b = boardOf(s), pi = s.current;
  const qs = s.question!;
  qs.choice = choice;
  const right = choice === qs.q.correct;
  const steps = QUESTION_STEPS[qs.q.level] * (right ? 1 : -1);
  const from = s.players[pi].pieces[qs.piece];
  const to = walk(s, b, pi, from, steps) ?? from;
  s.players[pi].pieces[qs.piece] = to;
  s.moved = { color: s.players[pi].color, piece: qs.piece };
  sendHomeIfCaptured(s, b, pi, key(b.routes[s.players[pi].color].path[to]));
  s.log.unshift(`${s.players[pi].name} answered ${right ? "correctly" : "wrong"} (${steps > 0 ? "+" : ""}${steps}).`);
  checkFinished(s, b, pi);
  if (s.phase !== "over") s.phase = "answered";
  return s;
}

export function closeQuestion(prev: GameState): GameState {
  const s = clone(prev);
  s.question = null;
  return endTurn(s);
}

function openSurprise(s: GameState, piece: number): GameState {
  let r = Math.random() * 100;
  let id: SurpriseId = "skip";
  for (const o of SURPRISE_TABLE) { if ((r -= o.p) < 0) { id = o.id; break; } }
  s.surprise = { id, piece };
  s.phase = "surprise";
  return s;
}

export function applySurprise(prev: GameState): GameState {
  const s = clone(prev), b = boardOf(s), pi = s.current, p = s.players[pi];
  const sp = s.surprise!;
  const label = SURPRISE_TABLE.find((o) => o.id === sp.id)!.label;
  s.log.unshift(`Surprise for ${p.name}: ${label}.`);
  switch (sp.id) {
    case "home": p.pieces[sp.piece] = lastIndex(b, p.color); checkFinished(s, b, pi); break;
    case "castle": p.pieces[sp.piece] = -1; break;
    case "back3": {
      const to = walk(s, b, pi, p.pieces[sp.piece], -3) ?? p.pieces[sp.piece];
      p.pieces[sp.piece] = to;
      sendHomeIfCaptured(s, b, pi, key(b.routes[p.color].path[to]));
      break;
    }
    case "skip": p.skipNext = true; break;
    case "ultra": s.ultraNext = true; break;
    case "opponent": {
      const targets = opponentsOnBoard(s, b);
      if (targets.length) { s.phase = "opponentPick"; return s; }
      s.log.unshift("No opponent piece is on the board, so nothing happens.");
      break;
    }
  }
  s.surprise = null;
  if (s.phase === "over") return s;
  if (sp.id === "ultra") { s.phase = "roll"; s.dice = null; s.notice = { text: "Extra turn! Roll with the UltraBoost die.", tone: "good" }; return s; }
  return endTurn(s);
}

export function opponentsOnBoard(s: GameState, b: BoardLayout) {
  return s.players.map((p, i) => i).filter((i) => i !== s.current && s.players[i].rank === null &&
    s.players[i].pieces.some((x) => x >= 0 && x < lastIndex(b, s.players[i].color)));
}

export function pushOpponent(prev: GameState, target: number): GameState {
  const s = clone(prev), b = boardOf(s), o = s.players[target];
  const n = d6(), steps = Math.ceil(n / 2);
  const onBoard = o.pieces.map((x, i) => [x, i]).filter(([x]) => x >= 0 && x < lastIndex(b, o.color)).sort((a, z) => z[0] - a[0]);
  const piece = onBoard[0][1];
  o.pieces[piece] = walk(s, b, target, o.pieces[piece], -steps) ?? o.pieces[piece];
  s.log.unshift(`Rolled ${n}: ${o.name}'s piece moves ${steps} back.`);
  s.notice = { text: `You rolled ${n}. ${o.name}'s leading piece moves ${steps} steps back.`, tone: "good" };
  s.surprise = null;
  return endTurn(s);
}

export function endTurn(prev: GameState): GameState {
  const s = prev;
  const extra = s.dice && s.dice.n === 6 && s.sixes < 3;
  if (extra && s.players[s.current].rank === null) {
    s.phase = "roll";
    s.notice = s.notice ?? { text: "You rolled a 6. Roll again!", tone: "good" };
    s.dice = null;
    return s;
  }
  s.sixes = 0;
  s.dice = null;
  let next = s.current;
  for (let i = 0; i < s.players.length * 2; i++) {
    next = (next + 1) % s.players.length;
    const p = s.players[next];
    if (p.rank !== null) continue;
    if (p.skipNext) { p.skipNext = false; s.log.unshift(`${p.name} skips this turn.`); continue; }
    break;
  }
  s.current = next;
  s.phase = "roll";
  return s;
}

export function passTurn(prev: GameState): GameState {
  const s = clone(prev);
  s.notice = null;
  if (s.sixes >= 3) s.dice = { n: 0, b: 1 };
  return endTurn(s);
}

// Prototype tool: finish the game with the current order to reach the results screen.
export function finishDemo(prev: GameState): GameState {
  const s = clone(prev), b = boardOf(s);
  const order = s.players.map((p, i) => ({ i, score: p.pieces.reduce((a, x) => a + Math.max(x, 0), 0) / lastIndex(b, p.color) }))
    .filter((x) => s.players[x.i].rank === null).sort((a, z) => z.score - a.score);
  for (const { i } of order) { s.finishOrder.push(i); s.players[i].rank = s.finishOrder.length; }
  s.phase = "over";
  s.endedAt = Date.now();
  return s;
}

export const fmtDuration = (ms: number) => {
  const t = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), sec = t % 60;
  return [h, m, sec].map((x) => String(x).padStart(2, "0")).join(":");
};

export const fmtTimestamp = (d: Date) => {
  const p = (x: number) => String(x).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()};${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};
