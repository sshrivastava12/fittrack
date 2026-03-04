"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  date: string;
  value: number;
  label: string;
}

interface ProgressChartProps {
  data: DataPoint[];
  unit: string;
  label?: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-separator rounded-ios px-3 py-2">
        <p className="text-text-secondary text-xs">{label}</p>
        <p className="text-white font-semibold text-sm">
          {payload[0].value.toFixed(1)}
        </p>
      </div>
    );
  }
  return null;
}

export function ProgressChart({ data, unit, label = "Weight" }: ProgressChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-text-secondary">
        No data yet
      </div>
    );
  }

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#38383A" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#8E8E93", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: "#8E8E93", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            unit={` ${unit}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#0A84FF"
            strokeWidth={2.5}
            dot={{ fill: "#0A84FF", r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: "#0A84FF", strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
