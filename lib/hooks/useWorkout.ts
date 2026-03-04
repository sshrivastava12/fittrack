"use client";

import { useState, useCallback } from "react";
import { ActiveWorkout, ActiveSet, Exercise } from "@/lib/types";

export function useWorkout(initial?: Partial<ActiveWorkout>) {
  const [workout, setWorkout] = useState<ActiveWorkout>({
    id: initial?.id ?? null,
    name: initial?.name ?? "Workout",
    started_at: initial?.started_at ?? new Date(),
    routine_id: initial?.routine_id ?? null,
    exercises: initial?.exercises ?? [],
  });

  const addExercise = useCallback((exercise: Exercise, defaultSets = 3, defaultReps = 10) => {
    const sets: ActiveSet[] = Array.from({ length: defaultSets }, (_, i) => ({
      id: crypto.randomUUID(),
      exercise_id: exercise.id,
      set_number: i + 1,
      reps: String(defaultReps),
      weight: "",
      completed: false,
    }));

    setWorkout((prev) => ({
      ...prev,
      exercises: [...prev.exercises, { exercise, sets }],
    }));
  }, []);

  const addSet = useCallback((exerciseIndex: number) => {
    setWorkout((prev) => {
      const exercises = [...prev.exercises];
      const ae = exercises[exerciseIndex];
      const lastSet = ae.sets[ae.sets.length - 1];
      const newSet: ActiveSet = {
        id: crypto.randomUUID(),
        exercise_id: ae.exercise.id,
        set_number: ae.sets.length + 1,
        reps: lastSet?.reps ?? "10",
        weight: lastSet?.weight ?? "",
        completed: false,
      };
      exercises[exerciseIndex] = { ...ae, sets: [...ae.sets, newSet] };
      return { ...prev, exercises };
    });
  }, []);

  const removeSet = useCallback((exerciseIndex: number, setIndex: number) => {
    setWorkout((prev) => {
      const exercises = [...prev.exercises];
      const ae = exercises[exerciseIndex];
      const sets = ae.sets.filter((_, i) => i !== setIndex).map((s, i) => ({
        ...s,
        set_number: i + 1,
      }));
      exercises[exerciseIndex] = { ...ae, sets };
      return { ...prev, exercises };
    });
  }, []);

  const updateSet = useCallback(
    (exerciseIndex: number, setIndex: number, field: keyof ActiveSet, value: string | boolean) => {
      setWorkout((prev) => {
        const exercises = [...prev.exercises];
        const ae = exercises[exerciseIndex];
        const sets = [...ae.sets];
        sets[setIndex] = { ...sets[setIndex], [field]: value };
        exercises[exerciseIndex] = { ...ae, sets };
        return { ...prev, exercises };
      });
    },
    []
  );

  const toggleSet = useCallback((exerciseIndex: number, setIndex: number) => {
    setWorkout((prev) => {
      const exercises = [...prev.exercises];
      const ae = exercises[exerciseIndex];
      const sets = [...ae.sets];
      sets[setIndex] = { ...sets[setIndex], completed: !sets[setIndex].completed };
      exercises[exerciseIndex] = { ...ae, sets };
      return { ...prev, exercises };
    });
  }, []);

  const removeExercise = useCallback((exerciseIndex: number) => {
    setWorkout((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== exerciseIndex),
    }));
  }, []);

  const setWorkoutName = useCallback((name: string) => {
    setWorkout((prev) => ({ ...prev, name }));
  }, []);

  return {
    workout,
    addExercise,
    addSet,
    removeSet,
    updateSet,
    toggleSet,
    removeExercise,
    setWorkoutName,
  };
}
