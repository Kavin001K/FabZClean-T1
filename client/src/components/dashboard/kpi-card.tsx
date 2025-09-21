import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, HelpCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
  animationDelay?: number;
  details?: React.ReactNode;
  description?: string;
  isLoading?: boolean;
  className?: string;
}

export default React.memo(function KpiCard({ 
  title, 
  value, 
  change, 
  changeType = "neutral", 
  icon, 
  animationDelay = 0, 
  details,
  description,
  isLoading = false,
  className 
}: KpiCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `₹${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `₹${(val / 1000).toFixed(1)}K`;
      }
      return `₹${val.toLocaleString()}`;
    }
    return val;
  };

  const getChangeColor = () => {
    switch (changeType) {
      case "positive": return "text-green-600";
      case "negative": return "text-red-600";
      default: return "text-muted-foreground";
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case "positive": return <TrendingUp className="h-3 w-3" />;
      case "negative": return <TrendingDown className="h-3 w-3" />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-4 w-4 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-16 bg-muted rounded mb-2" />
          <div className="h-3 w-20 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const cardContent = (
    <Card className={cn(
      "group hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4",
      changeType === "positive" && "border-l-green-500 hover:border-l-green-600",
      changeType === "negative" && "border-l-red-500 hover:border-l-red-600",
      changeType === "neutral" && "border-l-blue-500 hover:border-l-blue-600",
      className
    )} style={{ animationDelay: `${animationDelay}ms` }}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {description && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="text-muted-foreground group-hover:text-primary transition-colors">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-1">
          {formatValue(value)}
        </div>
        {change && (
          <p className={cn("text-xs flex items-center", getChangeColor())}>
            {getChangeIcon() && <span className="mr-1">{getChangeIcon()}</span>}
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  );

  if (details) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          {cardContent}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span>{title}</span>
              {icon}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {details}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return cardContent;
});
