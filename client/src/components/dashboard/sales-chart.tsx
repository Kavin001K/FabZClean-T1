import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { SAMPLE_SALES_DATA } from "@/lib/data";

export default function SalesChart() {
  const data = useMemo(() => SAMPLE_SALES_DATA, []);

  const formatTooltipValue = (value: number, name: string) => {
    if (name === "revenue") {
      return `$${(value / 1000).toFixed(1)}k`;
    }
    return value;
  };

  return (
    <Card className="bento-card lg:col-span-2" data-testid="sales-chart">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-display font-semibold text-lg sm:text-xl text-foreground">
              Sales & Revenue Overview
            </CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground">Daily revenue and order trends</p>
          </div>
          <div className="flex gap-1 sm:gap-2">
            <Button size="sm" variant="default" data-testid="chart-period-7d" className="text-xs sm:text-sm">7D</Button>
            <Button size="sm" variant="secondary" data-testid="chart-period-30d" className="text-xs sm:text-sm">30D</Button>
            <Button size="sm" variant="secondary" data-testid="chart-period-90d" className="text-xs sm:text-sm">90D</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="day" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                yAxisId="revenue"
                orientation="left"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `$${(value / 1000)}k`}
              />
              <YAxis 
                yAxisId="orders"
                orientation="right"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--foreground))"
                }}
                formatter={formatTooltipValue}
              />
              <Legend />
              <Line
                yAxisId="revenue"
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-1))", r: 4 }}
                name="Revenue"
              />
              <Line
                yAxisId="orders"
                type="monotone"
                dataKey="orders"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-2))", r: 4 }}
                name="Orders"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
