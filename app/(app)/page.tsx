import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Workout, Routine, WorkoutSet, Exercise } from "@/lib/types";

function formatDuration(start: string, end: string) {
  const diff = Math.floor(
    (new Date(end).getTime() - new Date(start).getTime()) / 1000
  );
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getWeeklyVolume(sets: WorkoutSet[]): number {
  return sets.reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0), 0);
}

function getStreak(workouts: Workout[]): number {
  if (!workouts.length) return 0;
  const sorted = [...workouts]
    .filter((w) => w.finished_at)
    .sort(
      (a, b) =>
        new Date(b.finished_at!).getTime() - new Date(a.finished_at!).getTime()
    );
  if (!sorted.length) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const workoutDays = new Set(
    sorted.map((w) => {
      const d = new Date(w.finished_at!);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );

  const check = new Date(today);
  while (workoutDays.has(check.getTime())) {
    streak++;
    check.setDate(check.getDate() - 1);
  }
  return streak;
}

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Fetch last 10 workouts
  const { data: workouts } = await supabase
    .from("workouts")
    .select("*, workout_sets(*, exercise:exercises(*))")
    .eq("user_id", user.id)
    .not("finished_at", "is", null)
    .order("finished_at", { ascending: false })
    .limit(10);

  // Fetch recent routines
  const { data: routines } = await supabase
    .from("routines")
    .select("*, routine_exercises(*, exercise:exercises(*))")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(3);

  // Weekly volume — workouts in last 7 days
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weeklyWorkouts = (workouts || []).filter(
    (w: Workout) =>
      w.finished_at && new Date(w.finished_at) >= oneWeekAgo
  );
  const allWeeklySets = weeklyWorkouts.flatMap(
    (w: Workout & { workout_sets?: WorkoutSet[] }) => w.workout_sets || []
  );
  const weeklyVolume = getWeeklyVolume(allWeeklySets);
  const streak = getStreak(workouts || []);
  const lastWorkout = workouts?.[0] as
    | (Workout & { workout_sets?: WorkoutSet[] })
    | undefined;

  const unit = profile?.unit_preference || "lbs";
  const displayName = profile?.display_name || user.email?.split("@")[0];

  return (
    <div className="px-4 safe-top">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pt-4">
        <div>
          <p className="text-text-secondary text-sm">Good day,</p>
          <h1 className="text-2xl font-bold text-white">{displayName} 👋</h1>
        </div>
        <Link href="/profile">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg">
            {(displayName || "U")[0].toUpperCase()}
          </div>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="text-center">
          <p className="text-4xl font-bold text-primary">{streak}</p>
          <p className="text-text-secondary text-sm mt-1">Day Streak 🔥</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-white">
            {weeklyVolume > 0
              ? weeklyVolume >= 1000
                ? `${(weeklyVolume / 1000).toFixed(1)}k`
                : weeklyVolume.toFixed(0)
              : "0"}
          </p>
          <p className="text-text-secondary text-sm mt-1">
            Weekly Volume ({unit})
          </p>
        </Card>
      </div>

      {/* Last Workout */}
      <h2 className="text-lg font-semibold text-white mb-3">Last Workout</h2>
      {lastWorkout ? (
        <Link href={`/workout/${lastWorkout.id}`}>
          <Card className="mb-6 active:opacity-80 transition-opacity">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-white">{lastWorkout.name}</h3>
                <p className="text-text-secondary text-sm">
                  {formatDate(lastWorkout.finished_at!)}
                  {lastWorkout.finished_at &&
                    ` · ${formatDuration(lastWorkout.started_at, lastWorkout.finished_at)}`}
                </p>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                className="text-text-secondary mt-1"
              >
                <path
                  d="M9 18l6-6-6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex flex-wrap gap-2">
              {lastWorkout.workout_sets &&
                [
                  ...new Map(
                    lastWorkout.workout_sets.map(
                      (s: WorkoutSet & { exercise?: Exercise }) => [s.exercise_id, s]
                    )
                  ).values(),
                ]
                  .slice(0, 4)
                  .map((s: WorkoutSet & { exercise?: Exercise }, i) => (
                    <Badge key={i} variant="neutral">
                      {s.exercise?.name || "Exercise"}
                    </Badge>
                  ))}
              {lastWorkout.workout_sets && lastWorkout.workout_sets.length > 0 && (
                <Badge variant="neutral">
                  {lastWorkout.workout_sets.filter((s: WorkoutSet) => s.completed).length} sets done
                </Badge>
              )}
            </div>
          </Card>
        </Link>
      ) : (
        <Card className="mb-6 text-center py-8">
          <p className="text-text-secondary">No workouts yet</p>
          <p className="text-text-secondary text-sm mt-1">
            Start your first workout below!
          </p>
        </Card>
      )}

      {/* Quick Start */}
      <h2 className="text-lg font-semibold text-white mb-3">Quick Start</h2>
      <div className="space-y-2 mb-6">
        <Link href="/workout">
          <Card className="flex items-center gap-3 active:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <polygon points="5,3 19,12 5,21" fill="#0A84FF" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-white">Empty Workout</p>
              <p className="text-text-secondary text-sm">Start from scratch</p>
            </div>
          </Card>
        </Link>

        {(routines as (Routine & { routine_exercises: { exercise: Exercise }[] })[])?.map((routine) => (
          <Link key={routine.id} href={`/workout?routine=${routine.id}`}>
            <Card className="flex items-center gap-3 active:opacity-80 transition-opacity mt-2">
              <div className="w-10 h-10 rounded-full bg-card-elevated flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
                    stroke="#8E8E93"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <rect
                    x="9"
                    y="3"
                    width="6"
                    height="4"
                    rx="1"
                    stroke="#8E8E93"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{routine.name}</p>
                <p className="text-text-secondary text-sm">
                  {routine.routine_exercises?.length || 0} exercises
                </p>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                className="text-text-secondary flex-shrink-0"
              >
                <path
                  d="M9 18l6-6-6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
