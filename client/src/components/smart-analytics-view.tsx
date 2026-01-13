import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowUpRight, ArrowDownRight, Minus, TrendingUp } from 'lucide-react';
import {
    linearRegression,
    mean,
    standardDeviation,
    calculateGrowthRate
} from '@/lib/statistics';

interface SmartAnalyticsProps {
    dailyData: any[];
    franchiseData: any[];
}

export const SmartAnalyticsView: React.FC<SmartAnalyticsProps> = ({ dailyData, franchiseData }) => {

    // Memoize heavy calculations
    const insights = useMemo(() => {
        if (!dailyData || dailyData.length < 5) return null;

        // Prepare data for statistics (reverse to have chronological order if needed, but usually APIs return chronological or reverse-chron depending on sort)
        // Assuming API returns DESC (newest first) based on charts usage usually.
        // The provided charts code in reports.tsx slices and uses as is for XAxis?
        // User's code: `sortedData = [...dailyData].reverse();`
        // Let's assume dailyData is descending (newest first).

        const sortedData = [...dailyData].reverse();
        const revenueValues = sortedData.map(d => Number(d.total_revenue));
        // const orderValues = sortedData.map(d => Number(d.total_orders));

        // 1. Forecast Revenue (Next 7 Days) using Linear Regression
        const timePoints = revenueValues.map((_, i) => ({ x: i, y: revenueValues[i] }));
        const regression = linearRegression(timePoints);
        const nextDayPrediction = regression.slope * revenueValues.length + regression.intercept;
        const weeklyForecast = Array.from({ length: 7 }).reduce((acc: number, _, i) => {
            // Forecast i days ahead
            const dayIndex = revenueValues.length + i;
            const val = regression.slope * dayIndex + regression.intercept;
            return acc + Math.max(0, val);
        }, 0);

        // 2. Volatility Analysis (Standard Deviation)
        const revStdDev = standardDeviation(revenueValues);
        const revMean = mean(revenueValues);
        const volatility = revMean > 0 ? (revStdDev / revMean) * 100 : 0; // Coefficient of variation

        // 3. Growth Rate
        const currentRev = revenueValues[revenueValues.length - 1] || 0;
        const prevRev = revenueValues[revenueValues.length - 2] || 0;
        const dailyGrowth = calculateGrowthRate(currentRev, prevRev);

        // 4. Franchise Concentration (Gini-like metric - are sales dependent on one franchise?)
        const revenues = franchiseData.map(f => Number(f.total_revenue));
        const maxRev = Math.max(...revenues);
        const totalRev = revenues.reduce((a, b) => a + b, 0);
        const relianceRisk = totalRev > 0 ? (maxRev / totalRev) * 100 : 0;

        return {
            slope: regression.slope,
            r2: regression.r2,
            trend: regression.slope > 0 ? 'Growing' : 'Declining',
            nextDayPrediction,
            weeklyForecast,
            volatility,
            dailyGrowth,
            relianceRisk,
            isHighRisk: relianceRisk > 40 // If one franchise has >40% of revenue
        };
    }, [dailyData, franchiseData]);

    if (!insights) return <div>Not enough data for smart analytics.</div>;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Forecast Card */}
            <Card className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950 dark:to-background border-l-4 border-l-indigo-500">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">7-Day Revenue Forecast</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(insights.weeklyForecast)}
                    </div>
                    <div className="flex items-center text-xs mt-1">
                        {insights.trend === 'Growing' ? (
                            <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                        ) : (
                            <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                        )}
                        <span className={insights.trend === 'Growing' ? 'text-green-600' : 'text-red-600'}>
                            Trend is {insights.trend} (R²: {insights.r2.toFixed(2)})
                        </span>
                    </div>
                    <Progress value={insights.r2 * 100} className="h-1 mt-3" />
                    <p className="text-xs text-muted-foreground mt-1">Confidence Level</p>
                </CardContent>
            </Card>

            {/* Stability Card */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Market Stability</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{insights.volatility.toFixed(1)}%</div>
                    <CardDescription className="text-xs mt-1">Revenue Volatility Index</CardDescription>
                    <div className="mt-3 flex gap-2">
                        {insights.volatility < 15 ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Stable</Badge>
                        ) : (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Volatile</Badge>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Growth Card */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Daily Growth</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${insights.dailyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {insights.dailyGrowth > 0 ? '+' : ''}{insights.dailyGrowth.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">vs Yesterday</p>
                    <div className="mt-3">
                        <span className="text-xs text-muted-foreground">
                            Predicted tomorrow: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(insights.nextDayPrediction)}
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Risk Card */}
            <Card className={insights.isHighRisk ? "border-red-200 bg-red-50 dark:bg-red-900/10" : ""}>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Franchise Dependency</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{insights.relianceRisk.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground mt-1">Revenue from Top Franchise</p>
                    {insights.isHighRisk && (
                        <div className="flex items-center mt-2 text-red-600 text-xs font-medium">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            High concentration risk
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
