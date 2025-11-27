"use client"

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useCategories } from "@/hooks/use-categories"

interface CategoryChartProps {
  data: Array<{ category: string; amount: number; color: string }>
  category: string
}

export function CategoryChart({ data, category }: CategoryChartProps) {
  data = [...data].sort((a, b) => b.amount - a.amount)

  const colors = [
    "#3b82f6", // blue-500
    "#22c55e", // green-500
    "#ef4444", // red-500
    "#eab308", // yellow-500
    "#8b5cf6", // violet-500
    "#14b8a6", // teal-500
    "#f97316", // orange-500
    "#84cc16", // lime-500
    "#ec4899", // pink-500
    "#0ea5e9", // sky-500
    "#d946ef", // fuchsia-500
    "#10b981", // emerald-500
    "#f43f5e", // rose-500
    "#a16207", // amber-700
    "#06b6d4", // cyan-500
    "#6366f1", // indigo-500
    "#0891b2", // cyan-700
    "#f59e0b", // amber-500
    "#34d399", // emerald-400
    "#fb7185", // rose-400
  ]

  // Income: lime → dark green
  const incomeExpenseColors = [
    "#008000", // green
    "#fe0000", // red
  ]

  const { expenseCategories } = useCategories()
  const expenseCategoryNames = expenseCategories.map((c) => c.name)
    
  const chartConfig = data.reduce(
    (config, item, index) => ({
      ...config,
      [item.category.toLowerCase()]: {
        label: item.category,
        color: colors[index % colors.length],
      },
    }),
    {},
  )

  return (
    <div className="flex gap-4 items-center">
    {/* Pie Chart */}
    <ChartContainer config={chartConfig} className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="amount"
            labelLine={false}
          >
            {data.map((entry, index) => {
              const palette =
                category !== "all"
                  ? colors
                  : incomeExpenseColors;

              return (
                <Cell
                  key={`cell-${index}`}
                  fill={palette[index % palette.length]}
                />
              );
            })}
          </Pie>

          <ChartTooltip content={<ChartTooltipContent />} />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>

    {/* Legend (labels on the side) */}
    <div className="flex flex-col gap-2 w-55">
      {data.map((entry, index) => {
        const palette =
          category !== "all"
            ? colors
            : incomeExpenseColors;

        return (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: palette[index % palette.length] }}
            ></div>
            <span className="text-xs font-medium">
              {entry.category} —{" "}
              {((entry.amount / data.reduce((a, b) => a + b.amount, 0)) * 100).toFixed(2)}%
            </span>
          </div>
        );
      })}
    </div>
  </div>
  )
}
