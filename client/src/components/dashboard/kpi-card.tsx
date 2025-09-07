import { ReactNode, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LucideIcon, TrendingUp, TrendingDown, BarChart3, Calendar, Users, Package } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
  subtitle?: string;
  details?: {
    description: string;
    insights: string[];
    trends: Array<{ period: string; value: number; change: number }>;
    recommendations: string[];
  };
}

export default function KPICard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "text-primary",
  subtitle,
  details
}: KPICardProps) {
  const changeColors = {
    positive: "kpi-positive status-badge-success",
    negative: "kpi-negative status-badge-danger",
    neutral: "text-muted-foreground bg-muted"
  };

  const CardContent = () => (
    <div className="p-3 sm:p-4 relative">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center relative overflow-hidden`}
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
            <Icon className={`${iconColor} text-sm sm:text-base relative z-10`} />
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50"></div>
          </div>
          {change && (
            <div className={`text-xs px-2 py-1 rounded-full font-semibold ${changeColors[changeType]} backdrop-blur-sm`}>
              {change}
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
            {title}
          </p>
          <p className="kpi-value text-lg sm:text-xl lg:text-2xl leading-none" 
             data-testid={`kpi-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className="w-1 h-1 bg-current rounded-full opacity-50"></span>
              {subtitle}
            </p>
          )}
        </div>
        
        {/* Subtle highlight line */}
        <div className="absolute bottom-0 left-3 right-3 sm:left-4 sm:right-4 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
    </div>
  );

  if (details) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Card className="bento-card metric-card interactive-press animate-scale-in cursor-pointer hover:shadow-lg transition-all duration-200" 
                data-testid={`kpi-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            <CardContent />
          </Card>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto bg-white/95 backdrop-blur-sm text-gray-900 border border-gray-200 shadow-2xl">
          <DialogHeader className="pb-6 border-b border-gray-200">
            <DialogTitle className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-600">
                <Icon className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-h2 font-bold text-gray-900">{title}</h2>
                <p className="text-body text-gray-600 mt-1">Comprehensive Business Analysis</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-8 pt-6">
            {/* Current Value - Clean White Background with Transparency */}
            <div className="text-center p-8 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg">
              <div className="mb-4">
                <p className="text-5xl font-bold text-gray-900 mb-2">{value}</p>
                {change && (
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow-md ${
                    changeType === 'positive' ? 'bg-green-100 text-green-800 border border-green-300' :
                    changeType === 'negative' ? 'bg-red-100 text-red-800 border border-red-300' :
                    'bg-blue-100 text-blue-800 border border-blue-300'
                  }`}>
                    {changeType === 'positive' ? <TrendingUp className="w-4 h-4" /> : 
                     changeType === 'negative' ? <TrendingDown className="w-4 h-4" /> : null}
                    {change}
                  </div>
                )}
              </div>
              {subtitle && (
                <p className="text-body text-gray-600 font-medium">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-h3 font-bold text-gray-900 mb-4">Overview</h3>
              <div className="p-6 bg-white/70 backdrop-blur-sm rounded-lg border border-gray-200">
                <p className="text-body text-gray-700 leading-relaxed font-medium">{details.description}</p>
              </div>
            </div>

            {/* Key Insights */}
            <div>
              <h3 className="text-h3 font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Key Insights
              </h3>
              <div className="space-y-4">
                {details.insights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-4 p-5 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-lg hover:bg-white/80 transition-all duration-200">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-body text-gray-700 leading-relaxed font-medium">{insight}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Trends */}
            <div>
              <h3 className="text-h3 font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-600" />
                Recent Trends
              </h3>
              <div className="space-y-3">
                {details.trends.map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-5 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-lg hover:bg-white/80 transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-label font-semibold text-gray-900">{trend.period}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-label font-bold text-gray-900 mb-1">{trend.value.toLocaleString()}</p>
                      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-caption font-semibold shadow-sm ${
                        trend.change >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {trend.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {trend.change >= 0 ? '+' : ''}{trend.change}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h3 className="text-h3 font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-600" />
                Strategic Recommendations
              </h3>
              <div className="space-y-4">
                {details.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-4 p-5 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-lg hover:bg-white/80 transition-all duration-200">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Package className="w-4 h-4 text-purple-600" />
                    </div>
                    <p className="text-body text-gray-700 leading-relaxed font-medium">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card className="bento-card metric-card interactive-press animate-scale-in" data-testid={`kpi-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent />
    </Card>
  );
}
