import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ActiveWorkoutView } from "@/components/workout/ActiveWorkout";
import { Routine, RoutineExercise, Exercise } from "@/lib/types";

export default async function WorkoutPage({
  searchParams,
}: {
  searchParams: Promise<{ routine?: string }>;
}) {
  const { routine: routineId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("unit_preference")
    .eq("user_id", user.id)
    .single();

  const unit = (profile?.unit_preference as "lbs" | "kg") ?? "lbs";

  let routine:
    | (Routine & {
        routine_exercises: (RoutineExercise & { exercise: Exercise })[];
      })
    | undefined;

  if (routineId) {
    const { data } = await supabase
      .from("routines")
      .select("*, routine_exercises(*, exercise:exercises(*))")
      .eq("id", routineId)
      .eq("user_id", user.id)
      .single();
    if (data) {
      routine = data as typeof routine;
    }
  }

  return (
    <ActiveWorkoutView routine={routine} unit={unit} userId={user.id} />
  );
}
