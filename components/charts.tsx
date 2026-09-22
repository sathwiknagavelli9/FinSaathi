"use client";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { money } from "@/lib/api";
import type { Category } from "@/lib/types";
const colors = [
  "#0d9488",
  "#4169d1",
  "#e4aa45",
  "#8764bd",
  "#e47b68",
  "#55a4bf",
  "#8fae64",
];
export function CashChart({
  data,
}: {
  data: { month: string; income?: number; expenses: number }[];
}) {
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ left: 0, right: 16, top: 15, bottom: 0 }}
        >
          <defs>
            <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0d9488" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#0d9488" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 4"
            vertical={false}
            stroke="var(--border)"
          />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            width={52}
            tickFormatter={(n) => `${n / 1000}k`}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(v) => money(Number(v))}
            contentStyle={{
              background: "var(--surface)",
              borderColor: "var(--border)",
              borderRadius: 12,
            }}
          />
          <Legend />
          <Area
            name="Income"
            dataKey="income"
            stroke="#0d9488"
            fill="url(#incomeFill)"
            strokeWidth={2.5}
          />
          <Area
            name="Expenses"
            dataKey="expenses"
            stroke="#7088dc"
            fill="transparent"
            strokeWidth={2.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
export function Donut({ data }: { data: Category[] }) {
  return (
    <div>
      <div className="chart donut-chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="name"
              innerRadius="65%"
              outerRadius="90%"
              paddingAngle={3}
              stroke="none"
            >
              {data.map((d, i) => (
                <Cell key={d.name} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => money(Number(v))}
              contentStyle={{
                background: "var(--surface)",
                borderColor: "var(--border)",
                borderRadius: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="legend-list">
        {data.map((d, i) => (
          <div className="spread" key={d.name}>
            <span>
              <i style={{ background: colors[i % colors.length] }} />
              {d.name}
            </span>
            <strong>{money(d.amount)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
export function Bars({ data }: { data: Category[] }) {
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis
            width={55}
            tickFormatter={(n) => `${n / 1000}k`}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(v) => money(Number(v))}
            contentStyle={{ background: "var(--surface)" }}
          />
          <Bar dataKey="amount" fill="#0d9488" radius={[5, 5, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
export function ScoreChart({
  data,
}: {
  data: { month: string; score: number }[];
}) {
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="var(--border)" />
          <XAxis dataKey="month" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Line dataKey="score" stroke="#0d9488" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
