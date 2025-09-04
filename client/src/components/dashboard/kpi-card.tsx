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
    <Card className="bento-card metric-card interactive-press animate-scale-in" data-testid={`kpi-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="p-6 relative">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center relative overflow-hidden`}
               style={{
                 background: `linear-gradient(135deg, ${iconColor.includes('primary') ? 'hsl(var(--primary))' : 
                   iconColor.includes('blue') ? 'hsl(221, 83%, 53%)' :
                   iconColor.includes('green') ? 'hsl(142, 71%, 45%)' :
                   iconColor.includes('purple') ? 'hsl(280, 65%, 60%)' : 'hsl(var(--primary))'}/10, ${
                   iconColor.includes('primary') ? 'hsl(var(--primary))' : 
                   iconColor.includes('blue') ? 'hsl(221, 83%, 53%)' :
                   iconColor.includes('green') ? 'hsl(142, 71%, 45%)' :
                   iconColor.includes('purple') ? 'hsl(280, 65%, 60%)' : 'hsl(var(--primary))'}/5)`
               }}>
            <Icon className={`${iconColor} text-xl relative z-10`} />
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50"></div>
          </div>
          {change && (
            <div className={`text-xs px-3 py-1.5 rounded-full font-semibold ${changeColors[changeType]} backdrop-blur-sm`}>
              {change}
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
            {title}
          </p>
          <p className="font-display font-bold text-4xl text-foreground leading-none" 
             data-testid={`kpi-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
              <span className="w-1 h-1 bg-current rounded-full opacity-50"></span>
              {subtitle}
            </p>
          )}
        </div>
        
        {/* Subtle highlight line */}
        <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
      </CardContent>
    </Card>
  );
}
