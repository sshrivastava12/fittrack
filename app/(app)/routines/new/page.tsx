"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { ExercisePicker } from "@/components/workout/ExercisePicker";
import { Exercise } from "@/lib/types";

interface RoutineExerciseEntry {
  exercise: Exercise;
  sets: number;
  reps: number;
}

export default function NewRoutinePage() {
  const [name, setName] = useState("");
  const [exercises, setExercises] = useState<RoutineExerciseEntry[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  function addExercise(exercise: Exercise) {
    setExercises((prev) => [...prev, { exercise, sets: 3, reps: 10 }]);
  }

  function removeExercise(index: number) {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  }

  function updateEntry(
    index: number,
    field: "sets" | "reps",
    value: number
  ) {
    setExercises((prev) =>
      prev.map((e, i) => (i === index ? { ...e, [field]: value } : e))
    );
  }

  async function saveRoutine() {
    if (!name.trim()) return;
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: routine, error } = await supabase
      .from("routines")
      .insert({ user_id: user.id, name: name.trim() })
      .select()
      .single();

    if (error || !routine) {
      setLoading(false);
      return;
    }

    if (exercises.length > 0) {
      await supabase.from("routine_exercises").insert(
        exercises.map((e, i) => ({
          routine_id: routine.id,
          exercise_id: e.exercise.id,
          order_index: i,
          default_sets: e.sets,
          default_reps: e.reps,
        }))
      );
    }

    router.push("/routines");
    router.refresh();
  }

  return (
    <div className="px-4 safe-top">
      <div className="flex items-center gap-3 pt-4 mb-6">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-card flex items-center justify-center active:opacity-60"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18l-6-6 6-6"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-white">New Routine</h1>
      </div>

      <div className="space-y-4">
        <Input
          label="Routine Name"
          placeholder="e.g. Push Day, Leg Day"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-white">
              Exercises ({exercises.length})
            </h2>
            <button
              onClick={() => setShowPicker(true)}
              className="text-primary text-sm font-semibold"
            >
              + Add
            </button>
          </div>

          {exercises.length === 0 ? (
            <Card className="text-center py-8">
              <p className="text-text-secondary">No exercises added yet</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {exercises.map((entry, i) => (
                <Card key={i} padding="sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">
                        {entry.exercise.name}
                      </p>
                      <p className="text-text-secondary text-xs capitalize">
                        {entry.exercise.muscle_group}
                      </p>
                    </div>
                    <button
                      onClick={() => removeExercise(i)}
                      className="text-danger ml-2 p-1 active:opacity-60"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M18 6L6 18M6 6l12 12"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-text-secondary text-sm">Sets</span>
                      <input
                        type="number"
                        value={entry.sets}
                        onChange={(e) =>
                          updateEntry(i, "sets", parseInt(e.target.value) || 1)
                        }
                        className="w-14 bg-card-elevated text-white text-center rounded-ios px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        min="1"
                        max="20"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-text-secondary text-sm">Reps</span>
                      <input
                        type="number"
                        value={entry.reps}
                        onChange={(e) =>
                          updateEntry(i, "reps", parseInt(e.target.value) || 1)
                        }
                        className="w-14 bg-card-elevated text-white text-center rounded-ios px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        min="1"
                        max="100"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Button
          fullWidth
          size="lg"
          onClick={saveRoutine}
          disabled={!name.trim()}
          loading={loading}
        >
          Save Routine
        </Button>
      </div>

      <ExercisePicker
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={addExercise}
        excludeIds={exercises.map((e) => e.exercise.id)}
      />
    </div>
  );
}
