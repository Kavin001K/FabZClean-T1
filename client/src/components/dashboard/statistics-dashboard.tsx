import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Activity,
  Target,
} from 'lucide-react';
import {
  mean,
  median,
  standardDeviation,
  calculateGrowthRate,
  movingAverage,
  forecastLinear,
  confidenceInterval,
  detectAnomalies,
  calculateTrend,
  getTrendIndicator,
  summaryStatistics,
} from '@/lib/statistics';

interface StatisticsDashboardProps {
  data: number[];
  label: string;
  historicalData?: { date: Date; value: number }[];
  showForecast?: boolean;
  showAnomalies?: boolean;
  comparisonData?: number[];
  className?: string;
}

/**
 * Statistics Dashboard Component
 *
 * Displays comprehensive real-time statistical analysis including:
 * - Key metrics with sparklines
 * - Statistical summary (mean, median, std dev)
 * - Trend analysis with visual indicators
 * - Forecasts with confidence levels
 * - Anomaly detection alerts
 */
export default function StatisticsDashboard({
  data,
  label,
  historicalData,
  showForecast = true,
  showAnomalies = true,
  comparisonData,
  className = '',
}: StatisticsDashboardProps) {
  // Calculate comprehensive statistics
  const stats = useMemo(() => {
    if (data.length === 0) {
      return {
        summary: {
          count: 0,
          mean: 0,
          median: 0,
          stdDev: 0,
          min: 0,
          max: 0,
          range: 0,
        },
        trend: { arrow: '→', color: 'text-gray-600', direction: 'stable' as const },
        growth: 0,
        forecast: [],
        confidence: { lower: 0, upper: 0, margin: 0 },
        anomalies: [],
        ma7: [],
        ma30: [],
      };
    }

    const summary = summaryStatistics(data);

    // Calculate trend
    let trendDirection = 'stable' as 'increasing' | 'decreasing' | 'stable';
    if (historicalData && historicalData.length > 1) {
      trendDirection = calculateTrend(historicalData);
    }

    // Calculate growth rate (last vs previous)
    const growth =
      data.length >= 2
        ? calculateGrowthRate(data[data.length - 1], data[data.length - 2])
        : 0;

    const trendIndicator = getTrendIndicator(growth);

    // Moving averages
    const safeData = data || [];
    const ma7 = movingAverage(safeData, Math.min(7, safeData.length));
    const ma30 = movingAverage(safeData, Math.min(30, safeData.length));

    // Forecast next 7 periods
    const forecast = showForecast ? forecastLinear(data, 7) : [];

    // Confidence interval
    const confidence = confidenceInterval(data, 0.95);

    // Detect anomalies
    const anomalyIndices = showAnomalies ? detectAnomalies(data, 2.5) : [];

    return {
      summary,
      trend: trendIndicator,
      trendDirection,
      growth,
      forecast,
      confidence,
      anomalies: anomalyIndices,
      ma7,
      ma30,
    };
  }, [data, historicalData, showForecast, showAnomalies]);

  // Format numbers for display
  const formatNumber = (num: number, decimals: number = 2): string => {
    if (Math.abs(num) >= 1000000) {
      return `${(num / 1000000).toFixed(decimals)}M`;
    } else if (Math.abs(num) >= 1000) {
      return `${(num / 1000).toFixed(decimals)}K`;
    }
    return num.toFixed(decimals);
  };

  const formatCurrency = (num: number): string => {
    return `₹${formatNumber(num, 0)}`;
  };

  // Simple sparkline visualization
  const renderSparkline = (values: number[], color: string = 'text-primary') => {
    if (values.length === 0) return null;

    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;

    return (
      <div className="flex items-end h-8 gap-0.5">
        {(values || []).slice(-20).map((value, i) => {
          const height = ((value - min) / range) * 100;
          return (
            <div
              key={i}
              className={`flex-1 ${color} bg-current opacity-70 rounded-sm min-w-[2px]`}
              style={{ height: `${Math.max(height, 5)}%` }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Statistics Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <span>{label} - Statistical Analysis</span>
            </div>
            <Badge variant={stats.trend.direction === 'up' ? 'default' : 'secondary'}>
              <span className={stats.trend.color}>{stats.trend.arrow}</span>
              <span className="ml-1">
                {Math.abs(stats.growth).toFixed(1)}%
              </span>
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Summary Statistics */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Summary Statistics
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Mean:</span>
                  <span className="font-semibold">{formatCurrency(stats.summary.mean)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Median:</span>
                  <span className="font-semibold">{formatCurrency(stats.summary.median)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Std Dev:</span>
                  <span className="font-semibold">{formatCurrency(stats.summary.stdDev)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Range:</span>
                  <span className="font-semibold">
                    {formatCurrency(stats.summary.min)} - {formatCurrency(stats.summary.max)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Count:</span>
                  <span className="font-semibold">{stats.summary.count}</span>
                </div>
              </div>
            </div>

            {/* Trend Analysis */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Trend Analysis
              </h4>
              <div className="space-y-3">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Current Trend</span>
                    {stats.trendDirection === 'increasing' ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : stats.trendDirection === 'decreasing' ? (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    ) : (
                      <Minus className="h-5 w-5 text-gray-600" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">
                    {stats.trendDirection}
                  </p>
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm mb-2">Growth Rate</div>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${stats.trend.color}`}>
                      {stats.growth > 0 ? '+' : ''}
                      {stats.growth.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">7-Day Moving Avg</div>
                  {renderSparkline(stats.ma7, 'text-blue-500')}
                </div>
              </div>
            </div>

            {/* Forecast & Confidence */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Forecast & Confidence
              </h4>
              <div className="space-y-3">
                {showForecast && stats.forecast.length > 0 && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm mb-2">Next Period Forecast</div>
                    <div className="text-xl font-bold">
                      {formatCurrency(stats.forecast[0])}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      ±{formatCurrency(stats.confidence.margin)}
                    </div>
                  </div>
                )}

                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm mb-2">95% Confidence Interval</div>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lower:</span>
                      <span className="font-semibold">
                        {formatCurrency(stats.confidence.lower)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Upper:</span>
                      <span className="font-semibold">
                        {formatCurrency(stats.confidence.upper)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Forecast Trend</div>
                  {renderSparkline(stats.forecast, 'text-purple-500')}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Anomalies Alert */}
      {showAnomalies && stats.anomalies.length > 0 && (
        <Card className="border-yellow-500 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <AlertTriangle className="h-5 w-5" />
              Anomalies Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {stats.anomalies.length} unusual data point(s) detected that deviate significantly
                from the normal pattern.
              </p>
              <div className="flex flex-wrap gap-2">
                {stats.anomalies.slice(0, 5).map((index) => (
                  <Badge key={index} variant="outline" className="text-yellow-700">
                    Point #{index + 1}: {formatCurrency(data[index])}
                  </Badge>
                ))}
                {stats.anomalies.length > 5 && (
                  <Badge variant="outline">+{stats.anomalies.length - 5} more</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison with Previous Period */}
      {comparisonData && comparisonData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Period Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Current Period</div>
                <div className="text-2xl font-bold">{formatCurrency(mean(data))}</div>
                <div className="text-xs text-muted-foreground">Average</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Previous Period</div>
                <div className="text-2xl font-bold">{formatCurrency(mean(comparisonData))}</div>
                <div className="text-xs text-muted-foreground">Average</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Change</div>
                <div className={`text-2xl font-bold ${stats.trend.color}`}>
                  {stats.growth > 0 ? '+' : ''}
                  {calculateGrowthRate(mean(data), mean(comparisonData)).toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">Growth</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Statistical Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.trendDirection === 'increasing' && (
              <div className="flex items-start gap-2 p-2 bg-green-50 rounded-lg text-sm">
                <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                <p className="text-green-700">
                  {label} is showing an <strong>increasing trend</strong> with{' '}
                  <strong>{stats.growth.toFixed(1)}%</strong> growth.
                </p>
              </div>
            )}
            {stats.trendDirection === 'decreasing' && (
              <div className="flex items-start gap-2 p-2 bg-red-50 rounded-lg text-sm">
                <TrendingDown className="h-4 w-4 text-red-600 mt-0.5" />
                <p className="text-red-700">
                  {label} is showing a <strong>decreasing trend</strong> with{' '}
                  <strong>{Math.abs(stats.growth).toFixed(1)}%</strong> decline.
                </p>
              </div>
            )}
            {stats.summary.stdDev / stats.summary.mean < 0.2 && stats.summary.mean > 0 && (
              <div className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg text-sm">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <p className="text-blue-700">
                  Low variability detected (CV: {((stats.summary.stdDev / stats.summary.mean) * 100).toFixed(1)}
                  %). {label} shows <strong>consistent performance</strong>.
                </p>
              </div>
            )}
            {showForecast && stats.forecast[0] > stats.summary.mean && (
              <div className="flex items-start gap-2 p-2 bg-purple-50 rounded-lg text-sm">
                <TrendingUp className="h-4 w-4 text-purple-600 mt-0.5" />
                <p className="text-purple-700">
                  Forecast predicts <strong>{formatCurrency(stats.forecast[0])}</strong> for next
                  period, which is{' '}
                  <strong>
                    {calculateGrowthRate(stats.forecast[0], stats.summary.mean).toFixed(1)}% higher
                  </strong>{' '}
                  than current average.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
