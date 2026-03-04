import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Routine, RoutineExercise, Exercise } from "@/lib/types";

const muscleGroupColors: Record<string, "primary" | "success" | "warning" | "danger" | "neutral"> = {
  chest: "primary",
  back: "success",
  shoulders: "warning",
  arms: "danger",
  legs: "neutral",
  core: "neutral",
  cardio: "neutral",
};

export default async function RoutinesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: routines } = await supabase
    .from("routines")
    .select("*, routine_exercises(*, exercise:exercises(*))")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="px-4 safe-top">
      <div className="flex items-center justify-between pt-4 mb-6">
        <h1 className="text-2xl font-bold text-white">Routines</h1>
        <Link href="/routines/new">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5v14M5 12h14"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </Link>
      </div>

      {!routines?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-white mb-2">
            No Routines Yet
          </h2>
          <p className="text-text-secondary mb-6 max-w-xs">
            Create your first routine to quickly start workouts.
          </p>
          <Link
            href="/routines/new"
            className="bg-primary text-white px-6 py-3 rounded-ios font-semibold"
          >
            Create Routine
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {(routines as (Routine & { routine_exercises: (RoutineExercise & { exercise: Exercise })[] })[]).map(
            (routine) => {
              const exercises = routine.routine_exercises || [];
              const uniqueGroups = [
                ...new Set(exercises.map((re) => re.exercise?.muscle_group)),
              ].filter(Boolean);

              return (
                <div key={routine.id} className="relative group">
                  <Link href={`/workout?routine=${routine.id}`}>
                    <Card className="active:opacity-80 transition-opacity">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white text-lg truncate">
                            {routine.name}
                          </h3>
                          <p className="text-text-secondary text-sm">
                            {exercises.length} exercise
                            {exercises.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/routines/${routine.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="w-8 h-8 rounded-full bg-card-elevated flex items-center justify-center active:opacity-60"
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <path
                                d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
                                stroke="#8E8E93"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                              <path
                                d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                                stroke="#8E8E93"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                          </Link>
                        </div>
                      </div>

                      {/* Exercise list preview */}
                      {exercises.length > 0 && (
                        <div className="space-y-1 mb-3">
                          {exercises.slice(0, 4).map((re) => (
                            <div
                              key={re.id}
                              className="flex items-center justify-between"
                            >
                              <p className="text-text-secondary text-sm truncate flex-1">
                                {re.exercise?.name}
                              </p>
                              <p className="text-text-secondary text-xs ml-2">
                                {re.default_sets}×{re.default_reps}
                              </p>
                            </div>
                          ))}
                          {exercises.length > 4 && (
                            <p className="text-text-secondary text-xs">
                              +{exercises.length - 4} more
                            </p>
                          )}
                        </div>
                      )}

                      {/* Muscle group tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {uniqueGroups.map((group) => (
                          <Badge
                            key={group}
                            variant={muscleGroupColors[group] || "neutral"}
                          >
                            {group}
                          </Badge>
                        ))}
                      </div>
                    </Card>
                  </Link>
                </div>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}
