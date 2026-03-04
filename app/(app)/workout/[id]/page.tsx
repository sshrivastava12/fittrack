import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Workout, WorkoutSet, Exercise } from "@/lib/types";

function formatDuration(start: string, end: string) {
  const diff = Math.floor(
    (new Date(end).getTime() - new Date(start).getTime()) / 1000
  );
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: workout } = await supabase
    .from("workouts")
    .select("*, workout_sets(*, exercise:exercises(*))")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!workout) notFound();

  const w = workout as Workout & {
    workout_sets: (WorkoutSet & { exercise: Exercise })[];
  };

  // Group sets by exercise
  const byExercise = new Map<
    string,
    { exercise: Exercise; sets: (WorkoutSet & { exercise: Exercise })[] }
  >();
  for (const set of w.workout_sets || []) {
    if (!byExercise.has(set.exercise_id)) {
      byExercise.set(set.exercise_id, { exercise: set.exercise, sets: [] });
    }
    byExercise.get(set.exercise_id)!.sets.push(set);
  }

  const totalVolume = (w.workout_sets || []).reduce(
    (sum, s) => sum + (s.weight || 0) * (s.reps || 0),
    0
  );
  const totalSets = w.workout_sets?.filter((s) => s.completed).length || 0;

  return (
    <div className="px-4 safe-top">
      <div className="flex items-center gap-3 pt-4 mb-6">
        <Link href="/progress">
          <div className="w-9 h-9 rounded-full bg-card flex items-center justify-center active:opacity-60">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18l-6-6 6-6"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">{w.name}</h1>
          <p className="text-text-secondary text-sm">{formatDate(w.started_at)}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="text-center">
          <p className="text-lg font-bold text-white">{totalSets}</p>
          <p className="text-text-secondary text-xs mt-0.5">Sets</p>
        </Card>
        <Card className="text-center">
          <p className="text-lg font-bold text-white">
            {w.finished_at ? formatDuration(w.started_at, w.finished_at) : "—"}
          </p>
          <p className="text-text-secondary text-xs mt-0.5">Duration</p>
        </Card>
        <Card className="text-center">
          <p className="text-lg font-bold text-white">
            {totalVolume >= 1000
              ? `${(totalVolume / 1000).toFixed(1)}k`
              : totalVolume.toFixed(0)}
          </p>
          <p className="text-text-secondary text-xs mt-0.5">Volume</p>
        </Card>
      </div>

      {/* Exercise breakdown */}
      <h2 className="text-base font-semibold text-white mb-3">Exercises</h2>
      <div className="space-y-3">
        {[...byExercise.values()].map(({ exercise, sets }) => (
          <Card key={exercise.id} padding="sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-white">{exercise.name}</h3>
              <Badge variant="neutral" className="capitalize">
                {exercise.muscle_group}
              </Badge>
            </div>
            <div className="space-y-1">
              {sets.map((set, i) => (
                <div key={set.id} className="flex items-center gap-2">
                  <span className="text-text-secondary text-sm w-6">{i + 1}</span>
                  <span className="text-white text-sm">
                    {set.weight} {set.unit} × {set.reps} reps
                  </span>
                  {set.completed && (
                    <span className="text-success text-xs">✓</span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
