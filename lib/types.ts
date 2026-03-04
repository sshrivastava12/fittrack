export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "arms"
  | "legs"
  | "core"
  | "cardio";

export interface Exercise {
  id: string;
  name: string;
  muscle_group: MuscleGroup;
  is_custom: boolean;
  user_id: string | null;
  created_at: string;
}

export interface Routine {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  routine_exercises?: RoutineExercise[];
}

export interface RoutineExercise {
  id: string;
  routine_id: string;
  exercise_id: string;
  order_index: number;
  default_sets: number;
  default_reps: number;
  exercise?: Exercise;
}

export interface Workout {
  id: string;
  user_id: string;
  routine_id: string | null;
  name: string;
  started_at: string;
  finished_at: string | null;
  notes: string | null;
  workout_sets?: WorkoutSet[];
}

export interface WorkoutSet {
  id: string;
  workout_id: string;
  exercise_id: string;
  set_number: number;
  reps: number | null;
  weight: number | null;
  unit: "lbs" | "kg";
  completed: boolean;
  created_at: string;
  exercise?: Exercise;
}

export interface PersonalRecord {
  id: string;
  user_id: string;
  exercise_id: string;
  weight: number;
  reps: number;
  unit: "lbs" | "kg";
  achieved_at: string;
  workout_id: string;
  exercise?: Exercise;
}

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  unit_preference: "lbs" | "kg";
  created_at: string;
  updated_at: string;
}

// Active workout state (client-side only)
export interface ActiveSet {
  id: string;
  exercise_id: string;
  set_number: number;
  reps: string;
  weight: string;
  completed: boolean;
}

export interface ActiveExercise {
  exercise: Exercise;
  sets: ActiveSet[];
}

export interface ActiveWorkout {
  id: string | null;
  name: string;
  started_at: Date;
  routine_id: string | null;
  exercises: ActiveExercise[];
}
