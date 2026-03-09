"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { WeeklyData } from "@/types";
import { useState } from "react";

interface CalorieChartProps {
  data: WeeklyData[];
}

type ChartMode = "calories" | "burned" | "net";

interface TooltipPayload {
  value: number;
  name: string;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 shadow-xl">
        <p className="text-sm font-medium text-slate-300">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-lg font-bold" style={{ color: p.color }}>
            {p.value} kcal
          </p>
        ))}
      </div>
    );
  }
  return null;
}

const MODES: { key: ChartMode; label: string; color: string; gradient: string }[] = [
  { key: "calories", label: "Calories",  color: "#22c55e", gradient: "calorieGrad" },
  { key: "burned",   label: "Burned",    color: "#f97316", gradient: "burnedGrad"  },
  { key: "net",      label: "Net",       color: "#818cf8", gradient: "netGrad"     },
];

export default function CalorieChart({ data }: CalorieChartProps) {
  const [mode, setMode] = useState<ChartMode>("calories");
  const current = MODES.find((m) => m.key === mode)!;

  return (
    <div>
      {/* Toggle buttons */}
      <div className="mb-4 flex gap-2">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              mode === m.key
                ? "ring-1 text-slate-900"
                : "bg-slate-700 text-slate-400 hover:text-slate-200"
            }`}
            style={mode === m.key ? { backgroundColor: m.color } : undefined}
          >
            {m.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            {MODES.map((m) => (
              <linearGradient key={m.gradient} id={m.gradient} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={m.color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={m.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey={current.key}
            stroke={current.color}
            strokeWidth={2}
            fill={`url(#${current.gradient})`}
            dot={{ fill: current.color, strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6, fill: current.color, stroke: "#0f172a", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
