"use client";

import { COLOR_ORDER, key, type BoardLayout, type ColorId, type Square } from "@/lib/board";
import { COLORS } from "./ui";

export interface BoardPiece { color: ColorId; piece: number; pos: number; name: string }

interface Props {
  board: BoardLayout;
  pieces: BoardPiece[];
  movable?: Set<string>; // `${color}-${piece}`
  onPick?: (piece: number) => void;
  lastMoved?: string | null;
  activeColor?: ColorId;
  className?: string;
  decorative?: boolean;
}

const Q_COLOR = { easy: "var(--q-easy)", medium: "var(--q-medium)", hard: "var(--q-hard)" };
const ARROW = { up: "↑", down: "↓", left: "←", right: "→" };

function SquareMark({ sq }: { sq: Square }) {
  switch (sq.kind) {
    case "start":
      return <span className="font-display font-extrabold text-white" style={{ fontSize: "62cqh" }}>#</span>;
    case "protect":
      return <span style={{ color: "#c99700", fontSize: "72cqh" }} aria-hidden>★</span>;
    case "arrow":
      return <span className="font-bold" style={{ color: COLORS[sq.owner!].ink, fontSize: "72cqh" }}>{ARROW[sq.arrowDir!]}</span>;
    case "question":
      return (
        <span className="grid place-items-center rounded-[3px] font-display font-extrabold text-white w-[82%] h-[82%]"
          style={{ background: Q_COLOR[sq.qLevel!], fontSize: "62cqh", color: sq.qLevel === "medium" ? "#3b2a00" : "white" }}>?</span>
      );
    case "surprise":
      return (
        <svg viewBox="0 0 20 20" className="w-[72%] h-[72%]" aria-hidden>
          <rect x="3" y="8" width="14" height="10" rx="1.5" fill="#7b4fd6" />
          <rect x="2" y="5.5" width="16" height="4" rx="1" fill="#9a72ec" />
          <rect x="9" y="5.5" width="2" height="12.5" fill="#ffd166" />
          <path d="M10 5.5c-2-3-5-2.5-4-.5s4 .5 4 .5zm0 0c2-3 5-2.5 4-.5s-4 .5-4 .5z" fill="#ffd166" />
        </svg>
      );
    default:
      return null;
  }
}

const SQUARE_LABEL: Record<Square["kind"], string> = {
  normal: "Square", start: "Start square", arrow: "Arrow square", protect: "Protection square", question: "Question square", surprise: "Surprise square",
};

export function Board({ board, pieces, movable, onPick, lastMoved, activeColor, className = "", decorative }: Props) {
  const n = board.size;
  const o = (n - 15) / 2;

  // Pieces grouped by cell (and by castle).
  const onCell = new Map<string, BoardPiece[]>();
  const inCastle: Record<ColorId, BoardPiece[]> = { red: [], green: [], yellow: [], blue: [] };
  for (const p of pieces) {
    if (p.pos < 0) { inCastle[p.color].push(p); continue; }
    const k = key(board.routes[p.color].path[p.pos]);
    onCell.set(k, [...(onCell.get(k) ?? []), p]);
  }

  const cells: React.ReactNode[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const k = `${r},${c}`;
      const sq = board.squares[k];
      const home = board.homeCells[k];
      if (!sq && !home) continue;
      const here = onCell.get(k) ?? [];
      let bg = "#ffffff";
      if (home) bg = COLORS[home].tint;
      if (sq?.kind === "start") bg = COLORS[sq.owner!].fill;
      if (sq?.kind === "arrow") bg = COLORS[sq.owner!].tint;
      const isFinal = home && board.routes[home].path.at(-1)![0] === r && board.routes[home].path.at(-1)![1] === c;
      if (isFinal) continue; // final home is drawn in the centre
      const outer = r < o || c < o || r >= n - o || c >= n - o;
      cells.push(
        <div
          key={k}
          title={decorative ? undefined : sq ? `${SQUARE_LABEL[sq.kind]}${sq.qLevel ? ` (${sq.qLevel})` : ""}` : "Home path"}
          className="relative grid place-items-center border-[0.5px] border-[#c9c7bb]"
          style={{ gridRow: r + 1, gridColumn: c + 1, background: outer && sq?.kind === "normal" ? "#fbfaf6" : bg, containerType: "size" }}
        >
          {sq && <SquareMark sq={sq} />}
          {here.length > 0 && <Stack pieces={here} movable={movable} onPick={onPick} lastMoved={lastMoved} />}
        </div>,
      );
    }
  }

  return (
    <div
      className={`relative grid aspect-square rounded-xl bg-[#e9e7dd] p-[1.2%] shadow-[0_18px_40px_rgba(5,10,30,.45)] ${className}`}
      style={{ gridTemplateColumns: `repeat(${n}, 1fr)`, gridTemplateRows: `repeat(${n}, 1fr)` }}
      role={decorative ? "img" : "group"}
      aria-label={decorative ? "Ludo board" : `${board.difficulty} board, ${n} by ${n}`}
    >
      {COLOR_ORDER.map((color) => {
        const { r0, c0 } = board.castles[color];
        const active = activeColor === color;
        return (
          <div
            key={color}
            className="relative m-[6%] grid grid-cols-2 grid-rows-2 place-items-center rounded-[10%] p-[14%]"
            style={{
              gridRow: `${r0 + 1} / span 6`, gridColumn: `${c0 + 1} / span 6`,
              background: COLORS[color].fill,
              boxShadow: active ? `0 0 0 4px var(--paper), 0 0 0 7px ${COLORS[color].ink}` : undefined,
            }}
          >
            <div className="absolute inset-[12%] rounded-[12%] bg-white/95" />
            {[0, 1, 2, 3].map((slot) => {
              const p = inCastle[color].find((x) => x.piece === slot);
              return (
                <div key={slot} className="relative z-10 grid place-items-center w-[78%] aspect-square rounded-full" style={{ background: COLORS[color].tint, containerType: "size" }}>
                  {p && <PieceBtn p={p} movable={movable} onPick={onPick} lastMoved={lastMoved} />}
                </div>
              );
            })}
          </div>
        );
      })}
      {/* centre: four finishing triangles */}
      <div className="relative" style={{ gridRow: `${o + 7} / span 3`, gridColumn: `${o + 7} / span 3` }}>
        <svg viewBox="0 0 30 30" className="absolute inset-0 w-full h-full" aria-hidden>
          <polygon points="0,0 15,15 0,30" fill={COLORS.red.fill} />
          <polygon points="0,0 30,0 15,15" fill={COLORS.green.fill} />
          <polygon points="30,0 30,30 15,15" fill={COLORS.yellow.fill} />
          <polygon points="0,30 30,30 15,15" fill={COLORS.blue.fill} />
        </svg>
        {COLOR_ORDER.map((color) => {
          const done = pieces.filter((p) => p.color === color && p.pos === board.routes[color].path.length - 1);
          if (!done.length) return null;
          const pos = { red: "left-[4%] top-[35%]", green: "top-[4%] left-[35%]", yellow: "right-[4%] top-[35%]", blue: "bottom-[4%] left-[35%]" }[color];
          return (
            <div key={color} className={`absolute ${pos} grid place-items-center w-[30%] aspect-square rounded-full bg-white text-[10px] font-bold`} style={{ color: COLORS[color].ink, containerType: "size" }}>
              <span style={{ fontSize: "55cqw" }}>{done.length}/4</span>
            </div>
          );
        })}
      </div>
      {cells}
    </div>
  );
}

function Stack({ pieces, movable, onPick, lastMoved }: { pieces: BoardPiece[]; movable?: Set<string>; onPick?: (n: number) => void; lastMoved?: string | null }) {
  if (pieces.length === 1) return <div className="absolute inset-[6%] grid place-items-center"><PieceBtn p={pieces[0]} movable={movable} onPick={onPick} lastMoved={lastMoved} /></div>;
  const block = pieces.length === 2 && pieces[0].color === pieces[1].color;
  return (
    <div className="absolute inset-[4%] grid grid-cols-2 grid-rows-2 place-items-center gap-[2%]" title={block ? "Double Block" : undefined}>
      {pieces.slice(0, 4).map((p) => <PieceBtn key={`${p.color}-${p.piece}`} p={p} movable={movable} onPick={onPick} lastMoved={lastMoved} small />)}
      {block && <span className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 rounded bg-ink px-[3px] text-[8px] leading-tight text-paper">block</span>}
    </div>
  );
}

function PieceBtn({ p, movable, onPick, lastMoved, small }: { p: BoardPiece; movable?: Set<string>; onPick?: (n: number) => void; lastMoved?: string | null; small?: boolean }) {
  const id = `${p.color}-${p.piece}`;
  const can = movable?.has(id);
  const style = {
    background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${COLORS[p.color].fill} 55%, white), ${COLORS[p.color].fill} 55%, ${COLORS[p.color].ink})`,
    boxShadow: `0 1.5px 0 ${COLORS[p.color].ink}`,
    ["--accent" as string]: COLORS[p.color].fill,
  };
  const cls = `grid place-items-center rounded-full border-2 border-white text-white font-bold ${small ? "w-full" : "w-[86%]"} aspect-square ${can ? "movable ring-2 ring-offset-1 ring-ink" : ""} ${lastMoved === id ? "anim-rise" : ""}`;
  const label = <span className="leading-none" style={{ fontSize: small ? "30cqh" : "48cqh" }}>{p.piece + 1}</span>;
  if (can && onPick) {
    return (
      <button type="button" onClick={() => onPick(p.piece)} className={cls} style={style} aria-label={`Move ${p.name}'s piece ${p.piece + 1}`}>
        {label}
      </button>
    );
  }
  return <span className={cls} style={style} aria-hidden>{label}</span>;
}
