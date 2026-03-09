export function SkeletonCard() {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-slate-800 p-5 shadow-lg ring-1 ring-slate-700/50 animate-pulse">
      <div className="h-12 w-12 rounded-xl bg-slate-700 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-24 rounded bg-slate-700" />
        <div className="h-6 w-32 rounded bg-slate-700" />
        <div className="h-3 w-20 rounded bg-slate-700" />
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="rounded-xl bg-slate-800 p-6 shadow-lg ring-1 ring-slate-700/50 animate-pulse">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-5 w-32 rounded bg-slate-700" />
        <div className="h-5 w-20 rounded bg-slate-700" />
      </div>
      <div className="h-[220px] rounded-lg bg-slate-700/50" />
    </div>
  );
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-xl bg-slate-800 p-4 ring-1 ring-slate-700/50"
        >
          <div className="space-y-2">
            <div className="h-4 w-36 rounded bg-slate-700" />
            <div className="h-3 w-24 rounded bg-slate-700" />
          </div>
          <div className="h-4 w-16 rounded bg-slate-700" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonText({ width = "w-32" }: { width?: string }) {
  return <div className={`h-4 ${width} rounded bg-slate-700 animate-pulse`} />;
}
