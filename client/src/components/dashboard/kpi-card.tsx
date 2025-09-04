import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
  subtitle?: string;
}

export default function KPICard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "text-primary",
  subtitle
}: KPICardProps) {
  const changeColors = {
    positive: "text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30",
    negative: "text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30",
    neutral: "text-muted-foreground bg-muted"
  };

  return (
    <Card className="bento-card metric-card" data-testid={`kpi-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 bg-${iconColor.split('-')[1]}/10 rounded-lg flex items-center justify-center`}>
            <Icon className={`${iconColor} text-xl`} />
          </div>
          {change && (
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${changeColors[changeType]}`}>
              {change}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <p className="font-display font-bold text-3xl text-foreground" data-testid={`kpi-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
