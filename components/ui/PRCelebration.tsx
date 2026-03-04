"use client";

import { useEffect, useState } from "react";
import { Exercise } from "@/lib/types";

interface PRCelebrationProps {
  newPRs: { exercise: Exercise; weight: number; reps: number; unit: string }[];
  onDismiss: () => void;
}

export function PRCelebration({ newPRs, onDismiss }: PRCelebrationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!newPRs.length) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-6 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
      onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div className="relative bg-card rounded-ios-xl p-6 w-full max-w-sm text-center shadow-2xl border border-success/30">
        <div className="text-5xl mb-3">🏆</div>
        <h2 className="text-2xl font-bold text-white mb-1">
          New {newPRs.length > 1 ? "PRs" : "PR"}!
        </h2>
        <p className="text-text-secondary mb-4">You crushed it!</p>
        <div className="space-y-2">
          {newPRs.map((pr, i) => (
            <div key={i} className="bg-surface rounded-ios p-3 text-left">
              <p className="text-white font-semibold">{pr.exercise.name}</p>
              <p className="text-success text-sm">
                {pr.weight} {pr.unit} × {pr.reps} reps
              </p>
            </div>
          ))}
        </div>
        <p className="text-text-secondary text-xs mt-4">Tap to dismiss</p>
      </div>
    </div>
  );
}
