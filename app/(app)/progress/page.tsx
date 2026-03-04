"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ProgressChart } from "@/components/progress/ProgressChart";
import { PRCard } from "@/components/progress/PRCard";
import { Card } from "@/components/ui/Card";
import { Exercise, PersonalRecord, Workout, WorkoutSet } from "@/lib/types";
import Link from "next/link";

type Tab = "chart" | "prs" | "history";

function calc1RM(weight: number, reps: number) {
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatDateLong(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatDuration(start: string, end: string) {
  const diff = Math.floor(
    (new Date(end).getTime() - new Date(start).getTime()) / 1000
  );
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function ProgressPage() {
  const [tab, setTab] = useState<Tab>("chart");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [chartData, setChartData] = useState<
    { date: string; value: number; label: string }[]
  >([]);
  const [prs, setPrs] = useState<(PersonalRecord & { exercise: Exercise })[]>([]);
  const [workouts, setWorkouts] = useState<(Workout & { workout_sets: WorkoutSet[] })[]>([]);
  const [unit, setUnit] = useState("lbs");

  useEffect(() => {
    const supabase = createClient();
    // Load exercises for chart selector
    supabase
      .from("exercises")
      .select("*")
      .order("name")
      .then(({ data }) => {
        if (data) setExercises(data as Exercise[]);
      });

    // Load PRs
    supabase
      .from("personal_records")
      .select("*, exercise:exercises(*)")
      .order("weight", { ascending: false })
      .then(({ data }) => {
        if (data) setPrs(data as (PersonalRecord & { exercise: Exercise })[]);
      });

    // Load workout history
    supabase
      .from("workouts")
      .select("*, workout_sets(*)")
      .not("finished_at", "is", null)
      .order("finished_at", { ascending: false })
      .limit(30)
      .then(({ data }) => {
        if (data) setWorkouts(data as (Workout & { workout_sets: WorkoutSet[] })[]);
      });

    // Get unit preference
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from("profiles")
          .select("unit_preference")
          .eq("user_id", user.id)
          .single()
          .then(({ data }) => {
            if (data) setUnit(data.unit_preference);
          });
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedExercise) return;
    const supabase = createClient();

    // Load sets for this exercise, joined to workout date
    supabase
      .from("workout_sets")
      .select("*, workout:workouts(started_at, finished_at)")
      .eq("exercise_id", selectedExercise.id)
      .eq("completed", true)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (!data) return;

        // Group by workout date, take best 1RM per workout
        const byDate = new Map<string, number>();
        for (const set of data as (WorkoutSet & { workout: Workout })[]) {
          if (!set.workout?.started_at || !set.weight || !set.reps) continue;
          const date = set.workout.started_at.split("T")[0];
          const rm = calc1RM(set.weight, set.reps);
          if (!byDate.has(date) || byDate.get(date)! < rm) {
            byDate.set(date, rm);
          }
        }

        const sorted = [...byDate.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-20)
          .map(([date, value]) => ({
            date,
            value: Math.round(value * 10) / 10,
            label: formatDate(date),
          }));

        setChartData(sorted);
      });
  }, [selectedExercise]);

  return (
    <div className="px-4 safe-top">
      <h1 className="text-2xl font-bold text-white pt-4 mb-4">Progress</h1>

      {/* Tab switcher */}
      <div className="flex bg-card rounded-ios p-1 mb-6">
        {(
          [
            { id: "chart" as Tab, label: "Chart" },
            { id: "prs" as Tab, label: "PRs" },
            { id: "history" as Tab, label: "History" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-ios text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-primary text-white"
                : "text-text-secondary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Chart Tab */}
      {tab === "chart" && (
        <div>
          <div className="mb-4">
            <label className="text-sm text-text-secondary mb-2 block">
              Select Exercise
            </label>
            <select
              value={selectedExercise?.id ?? ""}
              onChange={(e) => {
                const ex = exercises.find((x) => x.id === e.target.value);
                setSelectedExercise(ex ?? null);
              }}
              className="w-full bg-card border border-separator rounded-ios px-4 py-3 text-white focus:outline-none focus:border-primary"
            >
              <option value="">Choose an exercise...</option>
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
          </div>

          {selectedExercise ? (
            <Card>
              <p className="text-white font-semibold mb-1">
                {selectedExercise.name}
              </p>
              <p className="text-text-secondary text-xs mb-4">
                Estimated 1RM over time
              </p>
              <ProgressChart data={chartData} unit={unit} />
            </Card>
          ) : (
            <Card className="text-center py-12">
              <p className="text-text-secondary">
                Select an exercise to view your progress chart
              </p>
            </Card>
          )}
        </div>
      )}

      {/* PRs Tab */}
      {tab === "prs" && (
        <div>
          {prs.length === 0 ? (
            <Card className="text-center py-12">
              <div className="text-4xl mb-3">🏆</div>
              <p className="text-text-secondary">No PRs yet</p>
              <p className="text-text-secondary text-sm mt-1">
                Log workouts to track your bests
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {prs.map((pr) => (
                <PRCard key={pr.id} pr={pr} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {tab === "history" && (
        <div>
          {workouts.length === 0 ? (
            <Card className="text-center py-12">
              <div className="text-4xl mb-3">📅</div>
              <p className="text-text-secondary">No workouts logged yet</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {workouts.map((w) => {
                const completed = (w.workout_sets || []).filter(
                  (s) => s.completed
                ).length;
                const volume = (w.workout_sets || []).reduce(
                  (sum, s) => sum + (s.weight || 0) * (s.reps || 0),
                  0
                );

                return (
                  <Link key={w.id} href={`/workout/${w.id}`}>
                    <Card className="flex items-center justify-between active:opacity-80 transition-opacity">
                      <div>
                        <p className="font-semibold text-white">{w.name}</p>
                        <p className="text-text-secondary text-sm">
                          {formatDateLong(w.started_at)}
                          {w.finished_at &&
                            ` · ${formatDuration(w.started_at, w.finished_at)}`}
                        </p>
                        <p className="text-text-secondary text-xs">
                          {completed} sets ·{" "}
                          {volume >= 1000
                            ? `${(volume / 1000).toFixed(1)}k`
                            : volume.toFixed(0)}{" "}
                          {unit} volume
                        </p>
                      </div>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="text-text-secondary"
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
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
