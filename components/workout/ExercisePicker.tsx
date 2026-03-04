"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Exercise, MuscleGroup } from "@/lib/types";
import { Sheet } from "@/components/ui/Sheet";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

const MUSCLE_GROUPS: { label: string; value: MuscleGroup | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Chest", value: "chest" },
  { label: "Back", value: "back" },
  { label: "Shoulders", value: "shoulders" },
  { label: "Arms", value: "arms" },
  { label: "Legs", value: "legs" },
  { label: "Core", value: "core" },
  { label: "Cardio", value: "cardio" },
];

interface ExercisePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
  excludeIds?: string[];
}

export function ExercisePicker({
  isOpen,
  onClose,
  onSelect,
  excludeIds = [],
}: ExercisePickerProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState<MuscleGroup | "all">("all");

  useEffect(() => {
    if (!isOpen) return;
    const client = createClient();
    client
      .from("exercises")
      .select("*")
      .order("name")
      .then(({ data }) => {
        if (data) setExercises(data as Exercise[]);
      });
  }, [isOpen]);

  const filtered = exercises.filter((ex) => {
    if (excludeIds.includes(ex.id)) return false;
    if (activeGroup !== "all" && ex.muscle_group !== activeGroup) return false;
    if (search && !ex.name.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title="Add Exercise" snapPoint="full">
      <div className="px-4 pt-3 space-y-3">
        <Input
          placeholder="Search exercises..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Group filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {MUSCLE_GROUPS.map((g) => (
            <button
              key={g.value}
              onClick={() => setActiveGroup(g.value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeGroup === g.value
                  ? "bg-primary text-white"
                  : "bg-card text-text-secondary"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-1">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-text-secondary">
            No exercises found
          </div>
        ) : (
          filtered.map((exercise) => (
            <button
              key={exercise.id}
              onClick={() => {
                onSelect(exercise);
                onClose();
              }}
              className="w-full flex items-center justify-between px-4 py-3.5 border-b border-separator active:bg-card transition-colors"
            >
              <div className="text-left">
                <p className="text-white font-medium">{exercise.name}</p>
                <p className="text-text-secondary text-sm capitalize">
                  {exercise.muscle_group}
                </p>
              </div>
              {exercise.is_custom && (
                <Badge variant="primary">Custom</Badge>
              )}
            </button>
          ))
        )}
      </div>
    </Sheet>
  );
}
