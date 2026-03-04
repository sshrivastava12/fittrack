"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useWorkout } from "@/lib/hooks/useWorkout";
import { SetRow } from "./SetRow";
import { ExercisePicker } from "./ExercisePicker";
import { PRCelebration } from "@/components/ui/PRCelebration";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Exercise, Routine, RoutineExercise } from "@/lib/types";

interface ActiveWorkoutProps {
  routine?: Routine & { routine_exercises: (RoutineExercise & { exercise: Exercise })[] };
  unit: "lbs" | "kg";
  userId: string;
}

function useTimer(startTime: Date) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}

// Epley formula for estimated 1RM
function calc1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export function ActiveWorkoutView({
  routine,
  unit,
  userId,
}: ActiveWorkoutProps) {
  const router = useRouter();
  const supabase = createClient();

  // Initialize workout from routine if provided
  const initialExercises = routine
    ? routine.routine_exercises
        .sort((a, b) => a.order_index - b.order_index)
        .map((re) => ({
          exercise: re.exercise,
          sets: Array.from({ length: re.default_sets }, (_, i) => ({
            id: crypto.randomUUID(),
            exercise_id: re.exercise.id,
            set_number: i + 1,
            reps: String(re.default_reps),
            weight: "",
            completed: false,
          })),
        }))
    : [];

  const { workout, addExercise, addSet, removeSet, updateSet, toggleSet, removeExercise } =
    useWorkout({
      name: routine?.name ?? "Workout",
      routine_id: routine?.id ?? null,
      exercises: initialExercises,
    });

  const timer = useTimer(workout.started_at);
  const [showPicker, setShowPicker] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [newPRs, setNewPRs] = useState<
    { exercise: Exercise; weight: number; reps: number; unit: string }[]
  >([]);
  const [showCelebration, setShowCelebration] = useState(false);

  const totalCompleted = workout.exercises.reduce(
    (sum, ae) => sum + ae.sets.filter((s) => s.completed).length,
    0
  );
  const totalSets = workout.exercises.reduce(
    (sum, ae) => sum + ae.sets.length,
    0
  );

  async function finishWorkout() {
    if (finishing) return;
    setFinishing(true);

    const finishedAt = new Date().toISOString();

    // Create workout record
    const { data: workoutRecord, error } = await supabase
      .from("workouts")
      .insert({
        user_id: userId,
        routine_id: workout.routine_id,
        name: workout.name,
        started_at: workout.started_at.toISOString(),
        finished_at: finishedAt,
      })
      .select()
      .single();

    if (error || !workoutRecord) {
      setFinishing(false);
      return;
    }

    // Collect completed sets
    const completedSets = workout.exercises.flatMap((ae) =>
      ae.sets
        .filter((s) => s.completed && s.reps && s.weight !== "")
        .map((s) => ({
          workout_id: workoutRecord.id,
          exercise_id: ae.exercise.id,
          set_number: s.set_number,
          reps: parseInt(s.reps) || null,
          weight: parseFloat(s.weight) || null,
          unit,
          completed: true,
        }))
    );

    if (completedSets.length > 0) {
      await supabase.from("workout_sets").insert(completedSets);
    }

    // PR detection — compare best set per exercise against personal_records
    const prsToCheck: { exercise: Exercise; weight: number; reps: number }[] =
      [];

    for (const ae of workout.exercises) {
      const bestSet = ae.sets
        .filter((s) => s.completed && s.reps && s.weight !== "")
        .reduce(
          (best, s) => {
            const rm = calc1RM(parseFloat(s.weight) || 0, parseInt(s.reps) || 0);
            return rm > (best?.rm ?? 0) ? { ...s, rm } : best;
          },
          null as (typeof ae.sets[0] & { rm: number }) | null
        );

      if (bestSet) {
        prsToCheck.push({
          exercise: ae.exercise,
          weight: parseFloat(bestSet.weight) || 0,
          reps: parseInt(bestSet.reps) || 0,
        });
      }
    }

    const celebrationPRs: typeof newPRs = [];

    for (const check of prsToCheck) {
      const { data: existingPR } = await supabase
        .from("personal_records")
        .select("*")
        .eq("user_id", userId)
        .eq("exercise_id", check.exercise.id)
        .single();

      const currentRM = calc1RM(check.weight, check.reps);
      const existingRM = existingPR
        ? calc1RM(existingPR.weight, existingPR.reps)
        : 0;

      if (currentRM > existingRM) {
        await supabase.from("personal_records").upsert(
          {
            user_id: userId,
            exercise_id: check.exercise.id,
            weight: check.weight,
            reps: check.reps,
            unit,
            achieved_at: finishedAt,
            workout_id: workoutRecord.id,
          },
          { onConflict: "user_id,exercise_id" }
        );

        celebrationPRs.push({
          exercise: check.exercise,
          weight: check.weight,
          reps: check.reps,
          unit,
        });
      }
    }

    if (celebrationPRs.length > 0) {
      setNewPRs(celebrationPRs);
      setShowCelebration(true);
    } else {
      router.push(`/workout/${workoutRecord.id}`);
      router.refresh();
    }
  }

  function handlePRDismiss() {
    setShowCelebration(false);
    router.push("/");
    router.refresh();
  }

  return (
    <>
      {showCelebration && (
        <PRCelebration newPRs={newPRs} onDismiss={handlePRDismiss} />
      )}

      <div className="px-4 safe-top">
        {/* Header */}
        <div className="flex items-center justify-between pt-4 mb-2">
          <div>
            <h1 className="text-xl font-bold text-white">{workout.name}</h1>
            <p className="text-primary font-mono text-sm">{timer}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-text-secondary text-sm">
              {totalCompleted}/{totalSets} sets
            </span>
            <Button
              variant="success"
              size="sm"
              onClick={finishWorkout}
              loading={finishing}
            >
              Finish
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-separator rounded-full mb-4 overflow-hidden">
          <div
            className="h-full bg-success rounded-full transition-all duration-300"
            style={{
              width: totalSets > 0 ? `${(totalCompleted / totalSets) * 100}%` : "0%",
            }}
          />
        </div>

        {/* Exercises */}
        {workout.exercises.length === 0 ? (
          <Card className="text-center py-12 mb-4">
            <p className="text-text-secondary mb-4">No exercises added</p>
            <Button
              variant="secondary"
              onClick={() => setShowPicker(true)}
            >
              Add Exercise
            </Button>
          </Card>
        ) : (
          <div className="space-y-4 mb-4">
            {workout.exercises.map((ae, exerciseIndex) => (
              <Card key={ae.exercise.id + exerciseIndex} padding="sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white">
                      {ae.exercise.name}
                    </h3>
                    <p className="text-text-secondary text-xs capitalize">
                      {ae.exercise.muscle_group}
                    </p>
                  </div>
                  <button
                    onClick={() => removeExercise(exerciseIndex)}
                    className="text-text-secondary active:text-danger p-1"
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

                {/* Column headers */}
                <div className="flex items-center gap-2 px-1 mb-1">
                  <span className="text-text-secondary text-xs w-6 text-center">#</span>
                  <span className="flex-1 text-text-secondary text-xs text-center">
                    Weight
                  </span>
                  <span className="text-text-secondary text-xs w-4" />
                  <span className="flex-1 text-text-secondary text-xs text-center">
                    Reps
                  </span>
                  <span className="w-9" />
                  <span className="w-7" />
                </div>

                {ae.sets.map((set, setIndex) => (
                  <SetRow
                    key={set.id}
                    set={set}
                    unit={unit}
                    onUpdate={(field, value) =>
                      updateSet(exerciseIndex, setIndex, field, value)
                    }
                    onToggle={() => toggleSet(exerciseIndex, setIndex)}
                    onRemove={() => removeSet(exerciseIndex, setIndex)}
                  />
                ))}

                <button
                  onClick={() => addSet(exerciseIndex)}
                  className="mt-2 w-full py-2 text-primary text-sm font-medium text-center active:opacity-60"
                >
                  + Add Set
                </button>
              </Card>
            ))}
          </div>
        )}

        <Button
          variant="secondary"
          fullWidth
          onClick={() => setShowPicker(true)}
          className="mb-4"
        >
          + Add Exercise
        </Button>

        <Button
          variant="danger"
          fullWidth
          onClick={() => {
            if (confirm("Cancel workout? Progress will be lost.")) {
              router.back();
            }
          }}
          className="mb-8"
        >
          Cancel Workout
        </Button>
      </div>

      <ExercisePicker
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={(exercise) => addExercise(exercise)}
      />
    </>
  );
}
