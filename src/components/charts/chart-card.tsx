"use client";

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import styles from "./chart-card.module.scss";

interface ChartCardProps {
  title: string;
  type: "pie" | "bar";
  data: any[];
  labelKey?: string;
  valueKey?: string;
}

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"];

export function ChartCard({ title, type, data, labelKey = "status", valueKey = "count" }: ChartCardProps) {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height={250}>
          {type === "pie" ? (
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey={valueKey}
                nameKey={labelKey}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--color-text)",
                }}
              />
              <Legend />
            </PieChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey={labelKey}
                tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
                axisLine={{ stroke: "var(--color-border)" }}
              />
              <YAxis
                tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
                axisLine={{ stroke: "var(--color-border)" }}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--color-text)",
                }}
              />
              <Bar dataKey={valueKey} fill={COLORS[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
