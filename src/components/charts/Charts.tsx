"use client";

import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, Treemap,
} from "recharts";

// Palette fonctionnelle limitée — section 55 : bleu/neutre pour la donnée,
// vert/orange/rouge réservés aux états. Data first, decoration last.
const SERIES_COLORS = ["#1e3a8a", "#2563eb", "#7c93c7", "#94a3b8", "#b7c3d6"];

export function SimpleBarChart({ data, xKey, yKey, color = SERIES_COLORS[0] }: { data: Record<string, unknown>[]; xKey: string; yKey: string; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e7ec" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: "#8892a0" }} />
        <YAxis type="category" dataKey={xKey} width={140} tick={{ fontSize: 11, fill: "#55606f" }} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#e4e7ec" }} />
        <Bar dataKey={yKey} fill={color} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SimpleLineChart({ data, xKey, series }: { data: Record<string, unknown>[]; xKey: string; series: string[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ left: 0, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e7ec" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "#8892a0" }} />
        <YAxis tick={{ fontSize: 11, fill: "#8892a0" }} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#e4e7ec" }} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
        {series.map((s, i) => (
          <Line key={s} type="monotone" dataKey={s} stroke={SERIES_COLORS[i % SERIES_COLORS.length]} strokeWidth={2} dot={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SimpleAreaChart({ data, xKey, yKey, color = SERIES_COLORS[0] }: { data: Record<string, unknown>[]; xKey: string; yKey: string; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ left: 0, right: 16 }}>
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e7ec" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "#8892a0" }} />
        <YAxis tick={{ fontSize: 11, fill: "#8892a0" }} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#e4e7ec" }} />
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
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#e4e7ec" }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function SimpleScatterChart({ data, xKey, yKey, xLabel, yLabel }: { data: Record<string, unknown>[]; xKey: string; yKey: string; xLabel: string; yLabel: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ left: 4, right: 16, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e7ec" />
        <XAxis type="number" dataKey={xKey} name={xLabel} tick={{ fontSize: 11, fill: "#8892a0" }} />
        <YAxis type="number" dataKey={yKey} name={yLabel} tick={{ fontSize: 11, fill: "#8892a0" }} />
        <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#e4e7ec" }} />
        <Scatter data={data} fill={SERIES_COLORS[1]} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export function SimpleTreemap({ data }: { data: { name: string; size: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <Treemap data={data} dataKey="size" nameKey="name" stroke="#fff" fill={SERIES_COLORS[0]} />
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
                      style={{ backgroundColor: `rgba(30,58,138,${0.08 + intensity * 0.72})`, color: intensity > 0.5 ? "#fff" : "#14181f" }}
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
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="#cbd2dc" strokeWidth={strokeWidth} />
            <circle cx={x} cy={y} r={5 + (n.weight / maxWeight) * 6} fill="#2563eb" />
            <text x={x} y={y + 16} textAnchor="middle" fontSize={9} fill="#55606f">
              {n.label.length > 16 ? n.label.slice(0, 15) + "…" : n.label}
            </text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={14} fill="#1e3a8a" />
      <text x={cx} y={cy + 3} textAnchor="middle" fontSize={9} fill="#fff" fontWeight={600}>
        {center.length > 10 ? center.slice(0, 9) + "…" : center}
      </text>
    </svg>
  );
}
