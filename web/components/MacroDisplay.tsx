interface MacroBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
  unit?: string;
}

export function MacroBar({ label, value, max, color, unit = "g" }: MacroBarProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">{label}</span>
        <span className="font-semibold text-slate-200">
          {value.toFixed(1)}{unit}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-700">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

interface MacroSummaryProps {
  protein: number;
  carbs: number;
  fat: number;
}

export function MacroSummary({ protein, carbs, fat }: MacroSummaryProps) {
  const total = protein * 4 + carbs * 4 + fat * 9;
  const proteinPct = total > 0 ? Math.round((protein * 4 / total) * 100) : 0;
  const carbsPct   = total > 0 ? Math.round((carbs * 4 / total) * 100) : 0;
  const fatPct     = total > 0 ? Math.round((fat * 9 / total) * 100) : 0;

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-lg bg-slate-700/50 p-3 text-center">
        <div className="text-lg font-bold text-blue-400">{protein.toFixed(1)}g</div>
        <div className="text-xs text-slate-500">Protein</div>
        <div className="text-xs text-slate-600">{proteinPct}%</div>
      </div>
      <div className="rounded-lg bg-slate-700/50 p-3 text-center">
        <div className="text-lg font-bold text-yellow-400">{carbs.toFixed(1)}g</div>
        <div className="text-xs text-slate-500">Carbs</div>
        <div className="text-xs text-slate-600">{carbsPct}%</div>
      </div>
      <div className="rounded-lg bg-slate-700/50 p-3 text-center">
        <div className="text-lg font-bold text-pink-400">{fat.toFixed(1)}g</div>
        <div className="text-xs text-slate-500">Fat</div>
        <div className="text-xs text-slate-600">{fatPct}%</div>
      </div>
    </div>
  );
}
