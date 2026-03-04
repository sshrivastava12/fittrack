"use client";

import { ActiveSet } from "@/lib/types";

interface SetRowProps {
  set: ActiveSet;
  unit: string;
  onUpdate: (field: keyof ActiveSet, value: string | boolean) => void;
  onToggle: () => void;
  onRemove: () => void;
}

export function SetRow({ set, unit, onUpdate, onToggle, onRemove }: SetRowProps) {
  return (
    <div
      className={`flex items-center gap-2 px-1 py-2 rounded-ios transition-colors ${
        set.completed ? "bg-success/10" : ""
      }`}
    >
      {/* Set number */}
      <span className="text-text-secondary text-sm w-6 text-center font-medium flex-shrink-0">
        {set.set_number}
      </span>

      {/* Weight */}
      <div className="flex-1">
        <div className="relative">
          <input
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={set.weight}
            onChange={(e) => onUpdate("weight", e.target.value)}
            className="w-full bg-card-elevated text-white text-center rounded-ios px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary text-xs">
            {unit}
          </span>
        </div>
      </div>

      {/* × separator */}
      <span className="text-text-secondary text-sm flex-shrink-0">×</span>

      {/* Reps */}
      <div className="flex-1">
        <input
          type="number"
          inputMode="numeric"
          placeholder="0"
          value={set.reps}
          onChange={(e) => onUpdate("reps", e.target.value)}
          className="w-full bg-card-elevated text-white text-center rounded-ios px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Complete toggle */}
      <button
        onClick={onToggle}
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors active:scale-95 ${
          set.completed
            ? "bg-success text-white"
            : "bg-card-elevated text-text-secondary"
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <polyline
            points="20,6 9,17 4,12"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Remove */}
      <button
        onClick={onRemove}
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-text-secondary active:text-danger"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path
            d="M18 6L6 18M6 6l12 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
