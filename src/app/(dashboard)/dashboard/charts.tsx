"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer as BarResponsive } from "recharts";
import { formatKES } from "@/lib/currency";
import type { CategorySpending, MonthlyTrend } from "./actions";

interface SpendingChartProps {
  data: CategorySpending[];
}

interface TrendChartProps {
  data: MonthlyTrend[];
}

// Custom tooltip for pie chart
function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: CategorySpending }> }) {
  if (!active || !payload || payload.length === 0) return null;
  
  const data = payload[0].payload;
  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <p className="font-medium">{data.icon} {data.name}</p>
      <p className="text-sm text-muted-foreground">{formatKES(data.amount)}</p>
      <p className="text-xs text-muted-foreground">{data.percentage}% of total</p>
    </div>
  );
}

// Custom legend for pie chart
function PieLegend({ payload }: { payload?: Array<{ value: string; color: string; payload: { icon: string } }> }) {
  if (!payload) return null;
  
  return (
    <div className="mt-4 flex flex-wrap justify-center gap-3">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-1.5 text-sm">
          <span 
            className="h-3 w-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span>{entry.payload?.icon} {entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function SpendingPieChart({ data }: SpendingChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        No spending data this month
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="amount"
          nameKey="name"
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<PieTooltip />} />
        <Legend content={<PieLegend />} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// Custom tooltip for bar chart
function BarTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  
  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <p className="font-medium">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.dataKey === "income" ? "Income" : "Expenses"}: {formatKES(entry.value)}
        </p>
      ))}
    </div>
  );
}

export function TrendBarChart({ data }: TrendChartProps) {
  if (data.length === 0 || data.every(d => d.income === 0 && d.expenses === 0)) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        No transaction data yet
      </div>
    );
  }

  return (
    <BarResponsive width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="month" 
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
        />
        <Tooltip content={<BarTooltip />} />
        <Bar dataKey="income" fill="#22C55E" radius={[4, 4, 0, 0]} name="Income" />
        <Bar dataKey="expenses" fill="#EF4444" radius={[4, 4, 0, 0]} name="Expenses" />
      </BarChart>
    </BarResponsive>
  );
}

// Legend for bar chart
export function TrendLegend() {
  return (
    <div className="flex justify-center gap-6">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-success" />
        <span className="text-sm">Income</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-danger" />
        <span className="text-sm">Expenses</span>
      </div>
    </div>
  );
}
