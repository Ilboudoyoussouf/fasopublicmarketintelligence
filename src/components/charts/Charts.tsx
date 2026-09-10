"use client";

import {
  ResponsiveContainer, BarChart, Bar, Cell, LineChart, Line, AreaChart, Area,
  PieChart, Pie, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ReferenceArea,
  Tooltip, Legend, Treemap,
} from "recharts";

// Palette fonctionnelle — charte graphique §4/§11/§28 : les données restent
// neutres (gris), l'orange de marque est réservé à ce qui mérite l'attention
// (secteur sélectionné, point mis en avant). Jamais de dégradé orange.
const GRID = "#282e34"; // --border
const TICK = "#70777e"; // --text-tertiary
const NEUTRAL = "#89919a"; // --neutral
const NEUTRAL_DIM = "#4a5158";
const ORANGE = "#ff6600"; // --orange-500
const TOOLTIP_STYLE = { fontSize: 12, borderRadius: 8, background: "#1b2025", border: "1px solid #282e34", color: "#f2f3f3" };
const TOOLTIP_LABEL_STYLE = { color: "#a7adb3" };
const SERIES_COLORS = [NEUTRAL, "#5b9cf6", "#35c47a", "#e6b84a", "#70777e"];

export function SimpleBarChart({
  data, xKey, yKey, color = NEUTRAL, highlightKey,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  color?: string;
  /** Valeur de xKey à mettre en avant en orange — les autres barres restent grises (§11B, §17). */
  highlightKey?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: TICK }} />
        <YAxis type="category" dataKey={xKey} width={140} tick={{ fontSize: 11, fill: TICK }} />
        <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Bar dataKey={yKey} radius={[0, 4, 4, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={highlightKey ? (d[xKey] === highlightKey ? ORANGE : NEUTRAL_DIM) : color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SimpleLineChart({ data, xKey, series }: { data: Record<string, unknown>[]; xKey: string; series: string[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ left: 0, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: TICK }} />
        <YAxis tick={{ fontSize: 11, fill: TICK }} />
        <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11, color: TICK }} />}
        {series.map((s, i) => (
          <Line key={s} type="monotone" dataKey={s} stroke={SERIES_COLORS[i % SERIES_COLORS.length]} strokeWidth={2} dot={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SimpleAreaChart({ data, xKey, yKey, color = NEUTRAL }: { data: Record<string, unknown>[]; xKey: string; yKey: string; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ left: 0, right: 16 }}>
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.35} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: TICK }} />
        <YAxis tick={{ fontSize: 11, fill: TICK }} />
        <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} />
        <Area type="monotone" dataKey={yKey} stroke={color} fill="url(#areaFill)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SimpleDonutChart({ data, nameKey, valueKey }: { data: Record<string, unknown>[]; nameKey: string; valueKey: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey={valueKey} nameKey={nameKey} innerRadius="55%" outerRadius="85%" paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={SERIES_COLORS[i % SERIES_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} />
        <Legend wrapperStyle={{ fontSize: 11, color: TICK }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

/**
 * Graphique décisionnel « Opportunité × Intensité concurrentielle » (§12).
 * La zone idéale (forte valeur, faible concurrence) est mise en évidence
 * visuellement plutôt que laissée à l'utilisateur à déduire.
 */
export function SimpleScatterChart({
  data, xKey, yKey, xLabel, yLabel, idealZone, nameKey, highlightValue,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  xLabel: string;
  yLabel: string;
  /** Bornes de la zone à mettre en avant (ex. faible concurrence + forte valeur). */
  idealZone?: { x1: number; x2: number; y1: number; y2: number; label?: string };
  /** Avec highlightValue : seul le point nameKey===highlightValue reste orange, les autres passent en gris (§17). */
  nameKey?: string;
  highlightValue?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ left: 4, right: 16, bottom: 8, top: idealZone ? 16 : 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
        <XAxis type="number" dataKey={xKey} name={xLabel} tick={{ fontSize: 11, fill: TICK }} label={{ value: xLabel, position: "insideBottom", offset: -4, fontSize: 11, fill: TICK }} />
        <YAxis type="number" dataKey={yKey} name={yLabel} tick={{ fontSize: 11, fill: TICK }} label={{ value: yLabel, angle: -90, position: "insideLeft", fontSize: 11, fill: TICK }} />
        {idealZone && (
          <ReferenceArea
            x1={idealZone.x1} x2={idealZone.x2} y1={idealZone.y1} y2={idealZone.y2}
            fill={ORANGE} fillOpacity={0.08} stroke={ORANGE} strokeOpacity={0.4} strokeDasharray="4 4"
            label={idealZone.label ? { value: idealZone.label, position: "insideTopRight", fontSize: 10, fill: ORANGE } : undefined}
          />
        )}
        <Tooltip cursor={{ strokeDasharray: "3 3", stroke: TICK }} contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} />
        <Scatter data={data} fill={ORANGE}>
          {nameKey && data.map((d, i) => (
            <Cell key={i} fill={d[nameKey] === highlightValue ? ORANGE : NEUTRAL} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export function SimpleTreemap({ data }: { data: { name: string; size: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <Treemap data={data} dataKey="size" nameKey="name" stroke="#0b0d0f" fill={NEUTRAL} />
    </ResponsiveContainer>
  );
}

/** Micro-graphique sans axe ni grille — utilisé dans les cartes KPI (§10). */
export function Sparkline({ data, color = ORANGE }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const points = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={28}>
      <AreaChart data={points} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill="url(#sparkFill)" isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function Heatmap({
  rows, cols, value, formatValue,
}: {
  rows: string[];
  cols: string[];
  value: (row: string, col: string) => number;
  formatValue?: (v: number) => string;
}) {
  const max = Math.max(1, ...rows.flatMap((r) => cols.map((c) => value(r, c))));
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr>
            <th className="p-1 text-left text-ink-faint"></th>
            {cols.map((c) => (
              <th key={c} className="p-1 text-center font-medium text-ink-faint">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r}>
              <td className="p-1 text-right font-medium text-ink-muted whitespace-nowrap">{r}</td>
              {cols.map((c) => {
                const v = value(r, c);
                const intensity = v / max;
                return (
                  <td key={c} className="p-1 text-center">
                    <div
                      className="mx-auto flex h-7 w-full min-w-7 items-center justify-center rounded text-[10px] font-medium"
                      style={{ backgroundColor: `rgba(255,102,0,${0.08 + intensity * 0.62})`, color: intensity > 0.5 ? "#fff" : "#f2f3f3" }}
                      title={`${r} × ${c} : ${v}`}
                    >
                      {formatValue ? formatValue(v) : v || ""}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Graphe de relations simplifié — disposition radiale statique en SVG.
export function RelationGraph({
  center, nodes,
}: {
  center: string;
  nodes: { label: string; weight: number }[];
}) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 100;
  const maxWeight = Math.max(1, ...nodes.map((n) => n.weight));

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto h-full max-h-64 w-full">
      {nodes.map((n, i) => {
        const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        const strokeWidth = 1 + (n.weight / maxWeight) * 4;
        return (
          <g key={n.label}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke={GRID} strokeWidth={strokeWidth} />
            <circle cx={x} cy={y} r={5 + (n.weight / maxWeight) * 6} fill={NEUTRAL} />
            <text x={x} y={y + 16} textAnchor="middle" fontSize={9} fill={TICK}>
              {n.label.length > 16 ? n.label.slice(0, 15) + "…" : n.label}
            </text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={14} fill={ORANGE} />
      <text x={cx} y={cy + 3} textAnchor="middle" fontSize={9} fill="#0b0d0f" fontWeight={600}>
        {center.length > 10 ? center.slice(0, 9) + "…" : center}
      </text>
    </svg>
  );
}
