"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, Pencil, X } from "lucide-react";

export function getInitials(displayName?: string | null, email?: string | null): string {
  if (displayName) {
    return displayName
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return (email?.[0] ?? "?").toUpperCase();
}

interface EditableFieldProps {
  label: string;
  icon: React.ElementType;
  iconClass?: string;
  bgClass?: string;
  value: string | number;
  unit?: string;
  inputType?: string;
  min?: number;
  max?: number;
  placeholder?: string;
  onSave: (val: string) => Promise<void>;
  readOnly?: boolean;
  hint?: string;
}

export function EditableField({
  label,
  icon: Icon,
  iconClass = "text-green-400",
  bgClass = "bg-green-500/10",
  value,
  unit,
  inputType = "text",
  min,
  max,
  placeholder,
  onSave,
  readOnly = false,
  hint,
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(String(value));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setInput(String(value));
  }, [value]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(input);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setInput(String(value));
    setEditing(false);
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-800/60 p-4 ring-1 ring-slate-700/50">
      <div className="flex min-w-0 items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bgClass}`}>
          <Icon className={`h-5 w-5 ${iconClass}`} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
          {editing ? (
            <div className="mt-1 flex items-center gap-2">
              <input
                autoFocus
                type={inputType}
                value={input}
                min={min}
                max={max}
                placeholder={placeholder}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    void handleSave();
                  }
                  if (e.key === "Escape") {
                    handleCancel();
                  }
                }}
                className="w-40 rounded-lg bg-slate-700 px-3 py-1.5 text-sm text-slate-100 ring-1 ring-slate-600 focus:outline-none focus:ring-green-500"
              />
              {unit && <span className="text-xs text-slate-500">{unit}</span>}
            </div>
          ) : (
            <p className="truncate font-semibold text-slate-100">
              {value}
              {unit && <span className="ml-1 text-sm font-normal text-slate-400">{unit}</span>}
            </p>
          )}
          {hint && !editing && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
        </div>
      </div>

      {!readOnly && (
        <div className="flex shrink-0 items-center gap-1">
          {editing ? (
            <>
              <button
                onClick={() => void handleSave()}
                disabled={saving}
                className="rounded-lg bg-green-600 p-1.5 text-white transition hover:bg-green-500 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={handleCancel}
                className="rounded-lg bg-slate-700 p-1.5 text-slate-300 transition hover:bg-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-700 hover:text-slate-300"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  icon: React.ElementType;
  iconClass?: string;
  bgClass?: string;
  value: string;
  options: { value: string; label: string }[];
  hint?: string;
  onSave: (val: string) => Promise<void>;
}

export function SelectField({
  label,
  icon: Icon,
  iconClass = "text-green-400",
  bgClass = "bg-green-500/10",
  value,
  options,
  hint,
  onSave,
}: SelectFieldProps) {
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState(value);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelected(value);
  }, [value]);

  const displayLabel = options.find((opt) => opt.value === selected)?.label ?? selected;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(selected);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setSelected(value);
    setEditing(false);
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-800/60 p-4 ring-1 ring-slate-700/50">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bgClass}`}>
          <Icon className={`h-5 w-5 ${iconClass}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
          {editing ? (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <div className="relative">
                <select
                  autoFocus
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  className="cursor-pointer appearance-none rounded-lg bg-slate-700 py-1.5 pl-3 pr-8 text-sm text-slate-100 ring-1 ring-slate-600 focus:outline-none focus:ring-green-500"
                >
                  {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          ) : (
            <p className="truncate font-semibold text-slate-100">{displayLabel || "Not set"}</p>
          )}
          {hint && !editing && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {editing ? (
          <>
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="rounded-lg bg-green-600 p-1.5 text-white transition hover:bg-green-500 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={handleCancel}
              className="rounded-lg bg-slate-700 p-1.5 text-slate-300 transition hover:bg-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-700 hover:text-slate-300"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

interface StatTileProps {
  label: string;
  value: string | number;
  sub?: string;
  iconClass?: string;
  bgClass?: string;
  icon: React.ElementType;
}

export function StatTile({
  label,
  value,
  sub,
  iconClass = "text-green-400",
  bgClass = "bg-green-500/10",
  icon: Icon,
}: StatTileProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-800/60 p-4 ring-1 ring-slate-700/50">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bgClass}`}>
        <Icon className={`h-5 w-5 ${iconClass}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
        <p className="truncate font-bold text-slate-100">{value}</p>
        {sub && <p className="text-xs text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}
