// Board geometry for Easy (15x15), Medium (17x17, +64 ring) and Hard (19x19, +64 and +72 rings).
// Pieces move clockwise. Red's route is built first, then rotated 90° for each other color.

export type Difficulty = "easy" | "medium" | "hard";
export type ColorId = "red" | "green" | "yellow" | "blue";
export type Cell = [number, number]; // [row, col]

export type SquareKind =
  | "normal"
  | "start"
  | "arrow"
  | "protect"
  | "question"
  | "surprise";

export type QLevel = "easy" | "medium" | "hard";

export interface Square {
  kind: SquareKind;
  owner?: ColorId; // start / arrow / home cells
  qLevel?: QLevel; // question squares
  arrowDir?: "up" | "down" | "left" | "right";
}

export const COLOR_ORDER: ColorId[] = ["red", "green", "yellow", "blue"];
// Quarter turns clockwise from red's top-left corner.
const ROTATION: Record<ColorId, number> = { red: 0, green: 1, yellow: 2, blue: 3 };

export const OFFSET: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 };
export const gridSize = (d: Difficulty) => 15 + 2 * OFFSET[d];
export const key = (c: Cell) => `${c[0]},${c[1]}`;

// Standard 52-square shared route (15x15), index 0 = red start square (6,1).
function standardTrack(): Cell[] {
  const t: Cell[] = [];
  for (let c = 1; c <= 5; c++) t.push([6, c]);
  for (let r = 5; r >= 0; r--) t.push([r, 6]);
  t.push([0, 7]);
  for (let r = 0; r <= 5; r++) t.push([r, 8]);
  for (let c = 9; c <= 14; c++) t.push([6, c]);
  t.push([7, 14]);
  for (let c = 14; c >= 9; c--) t.push([8, c]);
  for (let r = 9; r <= 14; r++) t.push([r, 8]);
  t.push([14, 7]);
  for (let r = 14; r >= 9; r--) t.push([r, 6]);
  for (let c = 5; c >= 0; c--) t.push([8, c]);
  t.push([7, 0]);
  t.push([6, 0]);
  return t; // 52 cells
}

// Ring k cells, clockwise from the top-left corner (k,k).
function ring(n: number, k: number): Cell[] {
  const a = k, b = n - 1 - k, out: Cell[] = [];
  for (let c = a; c <= b; c++) out.push([a, c]);
  for (let r = a + 1; r <= b; r++) out.push([r, b]);
  for (let c = b - 1; c >= a; c--) out.push([b, c]);
  for (let r = b - 1; r >= a + 1; r--) out.push([r, a]);
  return out;
}

// Walk a ring clockwise from `from` until `to` (both included).
function ringWalk(cells: Cell[], from: Cell, to: Cell): Cell[] {
  const i = cells.findIndex((c) => key(c) === key(from));
  const out: Cell[] = [];
  for (let s = 0; s < cells.length; s++) {
    const c = cells[(i + s) % cells.length];
    out.push(c);
    if (key(c) === key(to)) break;
  }
  return out;
}

const rotate = (c: Cell, n: number, times: number): Cell => {
  let [r, col] = c;
  for (let i = 0; i < times; i++) [r, col] = [col, n - 1 - r];
  return [r, col];
};

export interface RouteInfo {
  path: Cell[]; // castle exit (index 0) ... final home (last)
  homeStart: number; // first index of the private home path
  ringArrows: Cell[]; // arrow squares on outer routes
  homeArrow: Cell; // arrow that turns the piece into its home path
}

function redRoute(d: Difficulty): RouteInfo {
  const o = OFFSET[d], n = gridSize(d);
  const sh = (c: Cell): Cell => [c[0] + o, c[1] + o];
  const std = standardTrack().map(sh);
  const home: Cell[] = [1, 2, 3, 4, 5].map((c) => sh([7, c]));
  const final = sh([7, 6]);
  const ringArrows: Cell[] = [];
  let path: Cell[] = [];

  if (d === "easy") {
    path = [...std.slice(0, 51)];
  } else if (d === "medium") {
    // Start in the outer corner next to the castle, one lap, arrow turns inward.
    const r0 = ring(n, 0);
    const lap = ringWalk(r0, [0, 0], [7, 0]);
    ringArrows.push([7, 0]);
    path = [...lap, std[51], ...std.slice(0, 51)];
  } else {
    const r0 = ring(n, 0), r1 = ring(n, 1);
    const lap0 = ringWalk(r0, [0, 0], [7, 0]);
    const lap1 = ringWalk(r1, [7, 1], [8, 1]);
    ringArrows.push([7, 0], [8, 1]);
    path = [...lap0, ...lap1, std[51], ...std.slice(0, 51)];
  }
  const homeArrow = path[path.length - 1];
  const homeStart = path.length;
  path = [...path, ...home, final];
  return { path, homeStart, ringArrows, homeArrow };
}

export function routeFor(d: Difficulty, color: ColorId): RouteInfo {
  const n = gridSize(d), t = ROTATION[color];
  const r = redRoute(d);
  const rot = (c: Cell) => rotate(c, n, t);
  return {
    path: r.path.map(rot),
    homeStart: r.homeStart,
    ringArrows: r.ringArrows.map(rot),
    homeArrow: rot(r.homeArrow),
  };
}

// Cells that belong to shared routes (where random special squares may go).
export function sharedCells(d: Difficulty): Cell[] {
  const o = OFFSET[d], n = gridSize(d);
  const cells: Cell[] = standardTrack().map((c) => [c[0] + o, c[1] + o] as Cell);
  if (d !== "easy") cells.push(...ring(n, 0));
  if (d === "hard") cells.push(...ring(n, 1));
  return cells;
}

export const SPECIAL_COUNTS: Record<Difficulty, { protect: number; question: number; surprise: number }> = {
  easy: { protect: 4, question: 0, surprise: 0 },
  medium: { protect: 8, question: 6, surprise: 2 },
  hard: { protect: 12, question: 9, surprise: 3 },
};

// Simple seeded random so a game keeps the same layout.
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

function arrowDirection(from: Cell, to: Cell): Square["arrowDir"] {
  if (to[0] < from[0]) return "up";
  if (to[0] > from[0]) return "down";
  if (to[1] < from[1]) return "left";
  return "right";
}

export interface BoardLayout {
  difficulty: Difficulty;
  size: number;
  squares: Record<string, Square>;
  routes: Record<ColorId, RouteInfo>;
  homeCells: Record<string, ColorId>;
  castles: Record<ColorId, { r0: number; c0: number }>;
}

export function buildBoard(d: Difficulty, seed: number): BoardLayout {
  const n = gridSize(d), o = OFFSET[d];
  const squares: Record<string, Square> = {};
  const routes = {} as Record<ColorId, RouteInfo>;
  const homeCells: Record<string, ColorId> = {};

  for (const shared of sharedCells(d)) squares[key(shared)] = { kind: "normal" };

  for (const color of COLOR_ORDER) {
    const r = routeFor(d, color);
    routes[color] = r;
    squares[key(r.path[0])] = { kind: "start", owner: color };
    const arrows = [...r.ringArrows, r.homeArrow];
    for (const a of arrows) {
      const idx = r.path.findIndex((c) => key(c) === key(a));
      squares[key(a)] = { kind: "arrow", owner: color, arrowDir: arrowDirection(a, r.path[idx + 1]) };
    }
    for (let i = r.homeStart; i < r.path.length; i++) homeCells[key(r.path[i])] = color;
  }

  // Random placement of Protection / Question / Surprise on free shared cells (FR-2.05).
  const rand = rng(seed);
  const red = routes.red;
  const free = Object.keys(squares).filter((k) => squares[k].kind === "normal");
  const take = (k: string) => free.splice(free.indexOf(k), 1);
  const counts = SPECIAL_COUNTS[d];

  // Prototype: put one question and one surprise early on Red's route so testers meet them.
  if (d !== "easy") {
    const q = key(red.path[6]);
    const s = key(red.path[10]);
    if (free.includes(q)) { squares[q] = { kind: "question", qLevel: "easy" }; take(q); }
    if (free.includes(s)) { squares[s] = { kind: "surprise" }; take(s); }
  }
  const pick = () => free.splice(Math.floor(rand() * free.length), 1)[0];
  const levels: QLevel[] = ["easy", "medium", "hard"];
  const placedQ = Object.values(squares).filter((s) => s.kind === "question").length;
  const placedS = Object.values(squares).filter((s) => s.kind === "surprise").length;
  const qList: QLevel[] = [];
  for (let i = 0; i < counts.question; i++) qList.push(levels[i % 3]);
  // remove the already placed easy question
  if (placedQ) qList.splice(qList.indexOf("easy"), 1);
  for (const lvl of qList) squares[pick()] = { kind: "question", qLevel: lvl };
  for (let i = placedS; i < counts.surprise; i++) squares[pick()] = { kind: "surprise" };
  for (let i = 0; i < counts.protect; i++) squares[pick()] = { kind: "protect" };

  const castles = {
    red: { r0: o, c0: o },
    green: { r0: o, c0: o + 9 },
    yellow: { r0: o + 9, c0: o + 9 },
    blue: { r0: o + 9, c0: o },
  };
  void n;
  return { difficulty: d, size: n, squares, routes, homeCells, castles };
}
