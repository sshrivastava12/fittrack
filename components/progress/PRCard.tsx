import { PersonalRecord, Exercise } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface PRCardProps {
  pr: PersonalRecord & { exercise: Exercise };
}

const muscleGroupColors: Record<string, "primary" | "success" | "warning" | "danger" | "neutral"> = {
  chest: "primary",
  back: "success",
  shoulders: "warning",
  arms: "danger",
  legs: "neutral",
  core: "neutral",
  cardio: "neutral",
};

export function PRCard({ pr }: PRCardProps) {
  const date = new Date(pr.achieved_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card className="flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white truncate">{pr.exercise.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge
            variant={muscleGroupColors[pr.exercise.muscle_group] || "neutral"}
          >
            {pr.exercise.muscle_group}
          </Badge>
          <p className="text-text-secondary text-xs">{date}</p>
        </div>
      </div>
      <div className="text-right ml-4 flex-shrink-0">
        <p className="text-white font-bold text-lg">
          {pr.weight} {pr.unit}
        </p>
        <p className="text-text-secondary text-sm">{pr.reps} reps</p>
      </div>
    </Card>
  );
}
