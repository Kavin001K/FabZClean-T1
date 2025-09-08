import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface KpiCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative";
  icon: React.ReactNode;
  animationDelay?: number;
  details: React.ReactNode;
}

export default function KpiCard({ title, value, change, changeType, icon, animationDelay = 0, details }: KpiCardProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="animate-fade-in hover:scale-105 hover:shadow-lg transition-transform duration-200 cursor-pointer" style={{ animationDelay: `${animationDelay}ms` }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className={`text-xs ${changeType === "positive" ? "text-green-500" : "text-red-500"}`}>
              <span className="flex items-center">
                {changeType === "positive" ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                {change}
              </span>
            </p>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title} - Detailed View</DialogTitle>
        </DialogHeader>
        {details}
      </DialogContent>
    </Dialog>
  );
}
