/**
 * ============================================================================
 * FABZCLEAN BUSINESS INTELLIGENCE DASHBOARD
 * ============================================================================
 * 
 * Enterprise-grade analytics dashboard featuring:
 * - Predictive KPI Ribbon (Projected Revenue, Staff Z-Scores, At-Risk Revenue)
 * - Revenue Velocity & Trend Analysis
 * - Little's Law Operational Bottleneck Detection
 * - Service Correlation Matrix
 * - Staff Performance Leaderboard
 * - Peak Demand Heatmap
 * - Anomaly Detection Panel
 * - GST Breakout Report
 * 
 * @version 1.0.0
 */

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer,
    RadialBarChart,
    RadialBar,
    ScatterChart,
    Scatter,
    ComposedChart,
} from "recharts";
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    AlertTriangle,
    Target,
    Users,
    Package,
    Clock,
    Activity,
    Zap,
    Star,
    Award,
    Shield,
    BarChart3,
    RefreshCw,
    Download,
    Brain,
    Gauge,
    AlertCircle,
    CheckCircle2,
    XCircle,
    ChevronUp,
    ChevronDown,
    Minus,
    Flame,
    Snowflake,
    ThermometerSun,
} from "lucide-react";
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/data-service";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface DailySummary {
    id: string;
    franchiseId: string;
    date: string;
    totalRevenue: number;
    orderCount: number;
    avgOrderValue: number;
    revenueGrowthDaily: number | null;
    revenueGrowthWeekly: number | null;
    projectedMonthEndRevenue: number | null;
    revenueVelocity: number | null;
    revenueVelocityTrend: 'accelerating' | 'decelerating' | 'stable' | null;
    atRiskRevenue: number;
    regressionSlope: number | null;
    regressionR2: number | null;
    forecastNext7Days: { date: string; predicted: number; confidence: { lower: number; upper: number } }[];
    customerCount: number;
    newCustomerCount: number;
    returningCustomerCount: number;
    avgCustomerClv: number | null;
    totalPlatinumCustomers: number;
    totalGoldCustomers: number;
    totalSilverCustomers: number;
    totalBronzeCustomers: number;
    avgTurnaroundHours: number | null;
    turnaroundStdDev: number | null;
    turnaroundConsistencyScore: number | null;
    percentWithinTarget: number | null;
    ordersArrivalRate: number | null;
    avgWaitTime: number | null;
    itemsInProcess: number | null;
    bottleneckType: 'volume' | 'processing' | 'balanced' | null;
    bottleneckRecommendation: string | null;
    avgStaffZScore: number | null;
    topPerformerEmployeeId: string | null;
    topPerformerName: string | null;
    topPerformerZScore: number | null;
    staffPerformance: any[];
    topServiceId: string | null;
    topServiceName: string | null;
    topServiceRevenue: number | null;
    serviceMixVariance: number | null;
    heroServicesCount: number;
    lossLeaderServicesCount: number;
    serviceMix: any[];
    serviceCorrelationTop5: any[];
    totalTaxCollected: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    taxableAmount: number;
    anomalyCount: number;
    anomalyDetails: any[];
    suspiciousOrderIds: string[];
    orderValueMean: number | null;
    orderValueMedian: number | null;
    orderValueStdDev: number | null;
    orderValueP95: number | null;
    peakDemandHour: number | null;
    peakDemandDayOfWeek: number | null;
    peakDemandScore: number | null;
    demandHeatmapTop10: any[];
    sma7DayRevenue: number | null;
    sma14DayRevenue: number | null;
    sma30DayRevenue: number | null;
    calculationDurationMs: number | null;
    dataQualityScore: number | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const COLORS = {
    primary: '#6366f1',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    muted: '#94a3b8',
    platinum: '#e5e7eb',
    gold: '#fbbf24',
    silver: '#9ca3af',
    bronze: '#b45309',
};

const HEATMAP_COLORS = [
    '#f0fdf4',
    '#dcfce7',
    '#bbf7d0',
    '#86efac',
    '#4ade80',
    '#22c55e',
    '#16a34a',
    '#15803d',
    '#166534',
    '#14532d',
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function TrendIndicator({ value, suffix = '%' }: { value: number | null; suffix?: string }) {
    if (value === null || value === undefined) return <span className="text-muted-foreground">N/A</span>;

    const isPositive = value > 0;
    const isNegative = value < 0;

    return (
        <span className={cn(
            "inline-flex items-center gap-1 font-medium",
            isPositive && "text-green-600",
            isNegative && "text-red-600",
            !isPositive && !isNegative && "text-muted-foreground"
        )}>
            {isPositive && <ChevronUp className="h-4 w-4" />}
            {isNegative && <ChevronDown className="h-4 w-4" />}
            {!isPositive && !isNegative && <Minus className="h-4 w-4" />}
            {Math.abs(value).toFixed(1)}{suffix}
        </span>
    );
}

function VelocityIndicator({ trend }: { trend: 'accelerating' | 'decelerating' | 'stable' | null }) {
    if (!trend) return null;

    const icons = {
        accelerating: <Flame className="h-4 w-4 text-orange-500" />,
        decelerating: <Snowflake className="h-4 w-4 text-blue-500" />,
        stable: <ThermometerSun className="h-4 w-4 text-yellow-500" />,
    };

    const labels = {
        accelerating: 'Accelerating',
        decelerating: 'Decelerating',
        stable: 'Stable',
    };

    return (
        <Badge variant="outline" className="gap-1">
            {icons[trend]}
            {labels[trend]}
        </Badge>
    );
}

function ZScoreBadge({ score }: { score: number | null }) {
    if (score === null || score === undefined) return <Badge variant="outline">N/A</Badge>;

    let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
    let label = "Average";

    if (score >= 1.5) {
        label = "Exceptional";
        variant = "default";
    } else if (score >= 0.5) {
        label = "Above Average";
        variant = "secondary";
    } else if (score <= -1.5) {
        label = "Needs Improvement";
        variant = "destructive";
    } else if (score <= -0.5) {
        label = "Below Average";
        variant = "destructive";
    }

    return (
        <Badge variant={variant}>
            {score > 0 ? '+' : ''}{score.toFixed(2)} σ ({label})
        </Badge>
    );
}

function BottleneckIndicator({ type, recommendation }: { type: string | null; recommendation: string | null }) {
    if (!type) return null;

    const colors: Record<string, string> = {
        volume: 'bg-orange-100 text-orange-800 border-orange-200',
        processing: 'bg-red-100 text-red-800 border-red-200',
        balanced: 'bg-green-100 text-green-800 border-green-200',
    };

    const icons: Record<string, React.ReactNode> = {
        volume: <Package className="h-4 w-4" />,
        processing: <Clock className="h-4 w-4" />,
        balanced: <CheckCircle2 className="h-4 w-4" />,
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium", colors[type] || colors.balanced)}>
                        {icons[type] || icons.balanced}
                        <span className="capitalize">{type} Bottleneck</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                    <p>{recommendation || 'Operations are running within acceptable parameters.'}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function BusinessIntelligence() {
    const [selectedFranchise, setSelectedFranchise] = useState("all");
    const [dateRange, setDateRange] = useState("7");

    // Fetch BI summary data
    const { data: biData, isLoading, error, refetch } = useQuery<DailySummary>({
        queryKey: ['bi-summary', selectedFranchise, dateRange],
        queryFn: async () => {
            const params = new URLSearchParams({
                dateRange,
                ...(selectedFranchise !== 'all' && { franchiseId: selectedFranchise }),
            });

            const response = await fetch(`/api/analytics/bi-summary?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('employee_token')}`
                }
            });

            if (!response.ok) {
                // Return mock data for development
                return generateMockData();
            }

            return response.json();
        },
        // Refetch every 5 minutes
        refetchInterval: 5 * 60 * 1000,
    });

    // Generate mock data for development
    function generateMockData(): DailySummary {
        return {
            id: 'mock-1',
            franchiseId: 'franchise-pollachi',
            date: new Date().toISOString(),
            totalRevenue: 125600,
            orderCount: 342,
            avgOrderValue: 367.25,
            revenueGrowthDaily: 8.5,
            revenueGrowthWeekly: 12.3,
            projectedMonthEndRevenue: 485000,
            revenueVelocity: 115.2,
            revenueVelocityTrend: 'accelerating',
            atRiskRevenue: 12500,
            regressionSlope: 1250.5,
            regressionR2: 0.87,
            forecastNext7Days: [
                { date: '2026-01-25', predicted: 18500, confidence: { lower: 15200, upper: 21800 } },
                { date: '2026-01-26', predicted: 19200, confidence: { lower: 15800, upper: 22600 } },
                { date: '2026-01-27', predicted: 17800, confidence: { lower: 14500, upper: 21100 } },
                { date: '2026-01-28', predicted: 16200, confidence: { lower: 13000, upper: 19400 } },
                { date: '2026-01-29', predicted: 15800, confidence: { lower: 12700, upper: 18900 } },
                { date: '2026-01-30', predicted: 18900, confidence: { lower: 15600, upper: 22200 } },
                { date: '2026-01-31', predicted: 21500, confidence: { lower: 17800, upper: 25200 } },
            ],
            customerCount: 156,
            newCustomerCount: 23,
            returningCustomerCount: 133,
            avgCustomerClv: 8500,
            totalPlatinumCustomers: 12,
            totalGoldCustomers: 28,
            totalSilverCustomers: 45,
            totalBronzeCustomers: 71,
            avgTurnaroundHours: 26.5,
            turnaroundStdDev: 4.2,
            turnaroundConsistencyScore: 85,
            percentWithinTarget: 92.5,
            ordersArrivalRate: 48.5,
            avgWaitTime: 1.2,
            itemsInProcess: 58,
            bottleneckType: 'balanced',
            bottleneckRecommendation: 'Operations are running within acceptable parameters.',
            avgStaffZScore: 0.35,
            topPerformerEmployeeId: 'emp-001',
            topPerformerName: 'Priya Devi',
            topPerformerZScore: 1.85,
            staffPerformance: [
                { employeeId: 'emp-001', employeeName: 'Priya Devi', zScore: 1.85, percentile: 97, rating: 'Exceptional', weightedScore: 245 },
                { employeeId: 'emp-002', employeeName: 'Senthil Kumar', zScore: 1.2, percentile: 88, rating: 'Above Average', weightedScore: 198 },
                { employeeId: 'emp-003', employeeName: 'Karthik Raja', zScore: 0.4, percentile: 66, rating: 'Average', weightedScore: 142 },
                { employeeId: 'emp-004', employeeName: 'Ramesh Kumar', zScore: -0.3, percentile: 38, rating: 'Average', weightedScore: 95 },
            ],
            topServiceId: 'svc-dc-suit',
            topServiceName: 'Suit (3pc) - Dry Cleaning',
            topServiceRevenue: 31500,
            serviceMixVariance: 2850,
            heroServicesCount: 5,
            lossLeaderServicesCount: 2,
            serviceMix: [
                { serviceId: 'svc-1', serviceName: 'Suit (3pc)', revenue: 31500, actualPercent: 25.1, category: 'Hero' },
                { serviceId: 'svc-2', serviceName: 'Saree (Silk)', revenue: 22400, actualPercent: 17.8, category: 'Hero' },
                { serviceId: 'svc-3', serviceName: 'Shirt (Laundry)', revenue: 18200, actualPercent: 14.5, category: 'Performer' },
                { serviceId: 'svc-4', serviceName: 'Pant (Laundry)', revenue: 15600, actualPercent: 12.4, category: 'Performer' },
                { serviceId: 'svc-5', serviceName: 'Blanket (Double)', revenue: 12800, actualPercent: 10.2, category: 'Standard' },
            ],
            serviceCorrelationTop5: [
                { service1: 'Shirt', service2: 'Pant', correlation: 0.85, coOccurrences: 156 },
                { service1: 'Saree', service2: 'Blouse', correlation: 0.78, coOccurrences: 89 },
                { service1: 'Suit Coat', service2: 'Suit Pant', correlation: 0.92, coOccurrences: 67 },
                { service1: 'Bed Sheet', service2: 'Pillow Cover', correlation: 0.72, coOccurrences: 45 },
                { service1: 'Towel', service2: 'Bed Sheet', correlation: 0.65, coOccurrences: 38 },
            ],
            totalTaxCollected: 22608,
            cgstAmount: 11304,
            sgstAmount: 11304,
            igstAmount: 0,
            taxableAmount: 102992,
            anomalyCount: 2,
            anomalyDetails: [
                { orderId: 'ord-123', orderNumber: 'FZC-2026POL0089A', zScore: 3.5, flagReason: 'Order amount ₹8,500 is 3.5 std devs above average (₹367.25)' },
                { orderId: 'ord-456', orderNumber: 'FZC-2026POL0112A', zScore: -3.2, flagReason: 'Order amount ₹12 is 3.2 std devs below average (₹367.25)' },
            ],
            suspiciousOrderIds: ['ord-123', 'ord-456'],
            orderValueMean: 367.25,
            orderValueMedian: 320.00,
            orderValueStdDev: 185.50,
            orderValueP95: 850.00,
            peakDemandHour: 11,
            peakDemandDayOfWeek: 6,
            peakDemandScore: 0.95,
            demandHeatmapTop10: [
                { dayOfWeek: 6, hourOfDay: 11, demandScore: 0.95, label: 'Saturday 11:00 AM' },
                { dayOfWeek: 6, hourOfDay: 10, demandScore: 0.88, label: 'Saturday 10:00 AM' },
                { dayOfWeek: 0, hourOfDay: 11, demandScore: 0.82, label: 'Sunday 11:00 AM' },
                { dayOfWeek: 6, hourOfDay: 12, demandScore: 0.78, label: 'Saturday 12:00 PM' },
                { dayOfWeek: 5, hourOfDay: 18, demandScore: 0.75, label: 'Friday 6:00 PM' },
            ],
            sma7DayRevenue: 17943.00,
            sma14DayRevenue: 16850.00,
            sma30DayRevenue: 15200.00,
            calculationDurationMs: 245,
            dataQualityScore: 92,
        };
    }

    const summary = biData || generateMockData();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                    <p className="text-muted-foreground">Loading Business Intelligence data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Business Intelligence Suite
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Enterprise-grade analytics powered by advanced statistical models
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Last 7 Days</SelectItem>
                            <SelectItem value="14">Last 14 Days</SelectItem>
                            <SelectItem value="30">Last 30 Days</SelectItem>
                            <SelectItem value="90">Last 90 Days</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={() => refetch()}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Predictive KPI Ribbon */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Projected Month-End Revenue */}
                <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-indigo-100 flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Projected Month-End
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(summary.projectedMonthEndRevenue || 0)}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <TrendIndicator value={summary.revenueGrowthDaily} />
                            <span className="text-xs text-indigo-200">vs yesterday</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Revenue Velocity */}
                <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-0 shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-orange-100 flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            Revenue Velocity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {summary.revenueVelocity?.toFixed(1) || 100}%
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <VelocityIndicator trend={summary.revenueVelocityTrend} />
                        </div>
                    </CardContent>
                </Card>

                {/* Staff Efficiency */}
                <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-100 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Staff Efficiency
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {summary.avgStaffZScore !== null ? (summary.avgStaffZScore > 0 ? '+' : '') + summary.avgStaffZScore.toFixed(2) + 'σ' : 'N/A'}
                        </div>
                        <p className="text-xs text-emerald-200 mt-1">
                            Top: {summary.topPerformerName || 'N/A'}
                        </p>
                    </CardContent>
                </Card>

                {/* At-Risk Revenue */}
                <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-amber-100 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            At-Risk Revenue
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(summary.atRiskRevenue)}
                        </div>
                        <p className="text-xs text-amber-200 mt-1">
                            Orders past due date
                        </p>
                    </CardContent>
                </Card>

                {/* Turnaround Consistency */}
                <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white border-0 shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-100 flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Consistency Score
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {summary.turnaroundConsistencyScore || 0}%
                        </div>
                        <p className="text-xs text-blue-200 mt-1">
                            {summary.percentWithinTarget?.toFixed(0) || 0}% within ±2hrs
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Dashboard Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="bg-white dark:bg-slate-800 p-1 shadow-sm">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
                        <Brain className="h-4 w-4 mr-2" />
                        Intelligence Overview
                    </TabsTrigger>
                    <TabsTrigger value="forecasting" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Forecasting
                    </TabsTrigger>
                    <TabsTrigger value="operations" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
                        <Gauge className="h-4 w-4 mr-2" />
                        Operations
                    </TabsTrigger>
                    <TabsTrigger value="staff" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
                        <Award className="h-4 w-4 mr-2" />
                        Staff Analytics
                    </TabsTrigger>
                    <TabsTrigger value="anomalies" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
                        <Shield className="h-4 w-4 mr-2" />
                        Anomaly Detection
                    </TabsTrigger>
                </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Revenue Trend with Forecast */}
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-indigo-500" />
                                    Revenue Forecast (7 Day)
                                </CardTitle>
                                <CardDescription>
                                    Linear regression with 95% confidence interval (R² = {summary.regressionR2?.toFixed(2) || 'N/A'})
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <ComposedChart data={summary.forecastNext7Days}>
                                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                                        />
                                        <YAxis tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} />
                                        <RechartsTooltip
                                            formatter={(value: number) => [formatCurrency(value), '']}
                                            labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="confidence.upper"
                                            stroke="none"
                                            fill={COLORS.primary}
                                            fillOpacity={0.1}
                                            name="Upper Bound"
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="confidence.lower"
                                            stroke="none"
                                            fill="#fff"
                                            fillOpacity={1}
                                            name="Lower Bound"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="predicted"
                                            stroke={COLORS.primary}
                                            strokeWidth={3}
                                            dot={{ fill: COLORS.primary, strokeWidth: 2 }}
                                            name="Predicted Revenue"
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Service Performance Matrix */}
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Star className="h-5 w-5 text-yellow-500" />
                                    Service Contribution Analysis
                                </CardTitle>
                                <CardDescription>
                                    {summary.heroServicesCount} Hero Services | {summary.lossLeaderServicesCount} Loss Leaders
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={summary.serviceMix?.slice(0, 6) || []} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" horizontal={false} />
                                        <XAxis type="number" tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} />
                                        <YAxis dataKey="serviceName" type="category" width={120} tick={{ fontSize: 12 }} />
                                        <RechartsTooltip formatter={(value: number) => [formatCurrency(value), 'Revenue']} />
                                        <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                                            {(summary.serviceMix || []).map((entry, index) => (
                                                <Cell
                                                    key={index}
                                                    fill={
                                                        entry.category === 'Hero' ? COLORS.success :
                                                            entry.category === 'Performer' ? COLORS.info :
                                                                entry.category === 'Standard' ? COLORS.warning :
                                                                    COLORS.danger
                                                    }
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                                <div className="flex flex-wrap gap-2 mt-4 justify-center">
                                    <Badge className="bg-green-100 text-green-800">Hero</Badge>
                                    <Badge className="bg-blue-100 text-blue-800">Performer</Badge>
                                    <Badge className="bg-yellow-100 text-yellow-800">Standard</Badge>
                                    <Badge className="bg-red-100 text-red-800">Loss Leader</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Customer Tier Distribution */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-purple-500" />
                                    Customer Tier Distribution
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Platinum', value: summary.totalPlatinumCustomers, color: COLORS.platinum },
                                                { name: 'Gold', value: summary.totalGoldCustomers, color: COLORS.gold },
                                                { name: 'Silver', value: summary.totalSilverCustomers, color: COLORS.silver },
                                                { name: 'Bronze', value: summary.totalBronzeCustomers, color: COLORS.bronze },
                                            ]}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {[COLORS.platinum, COLORS.gold, COLORS.silver, COLORS.bronze].map((color, index) => (
                                                <Cell key={index} fill={color} />
                                            ))}
                                        </Pie>
                                        <Legend />
                                        <RechartsTooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="text-center mt-4">
                                    <p className="text-2xl font-bold">{formatCurrency(summary.avgCustomerClv || 0)}</p>
                                    <p className="text-sm text-muted-foreground">Average CLV</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Service Correlation */}
                        <Card className="shadow-lg col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-cyan-500" />
                                    Frequently Bought Together
                                </CardTitle>
                                <CardDescription>Service correlation matrix - top 5 pairs</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {(summary.serviceCorrelationTop5 || []).map((pair, index) => (
                                        <div key={index} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline">{pair.service1}</Badge>
                                                    <span className="text-muted-foreground">+</span>
                                                    <Badge variant="outline">{pair.service2}</Badge>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold">{(pair.correlation * 100).toFixed(0)}%</p>
                                                <p className="text-xs text-muted-foreground">{pair.coOccurrences} co-purchases</p>
                                            </div>
                                            <div className="w-24">
                                                <Progress value={pair.correlation * 100} className="h-2" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* FORECASTING TAB */}
                <TabsContent value="forecasting" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Moving Averages Comparison */}
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle>Revenue Moving Averages</CardTitle>
                                <CardDescription>SMA-7, SMA-14, SMA-30 comparison for trend analysis</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.sma7DayRevenue || 0)}</p>
                                        <p className="text-sm text-muted-foreground">7-Day SMA</p>
                                    </div>
                                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                        <p className="text-2xl font-bold text-purple-600">{formatCurrency(summary.sma14DayRevenue || 0)}</p>
                                        <p className="text-sm text-muted-foreground">14-Day SMA</p>
                                    </div>
                                    <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                                        <p className="text-2xl font-bold text-indigo-600">{formatCurrency(summary.sma30DayRevenue || 0)}</p>
                                        <p className="text-sm text-muted-foreground">30-Day SMA</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Short-term vs Long-term</span>
                                        <TrendIndicator
                                            value={summary.sma7DayRevenue && summary.sma30DayRevenue
                                                ? ((summary.sma7DayRevenue - summary.sma30DayRevenue) / summary.sma30DayRevenue) * 100
                                                : null
                                            }
                                        />
                                    </div>
                                    <Progress
                                        value={Math.min(100, Math.max(0,
                                            summary.sma7DayRevenue && summary.sma30DayRevenue
                                                ? ((summary.sma7DayRevenue / summary.sma30DayRevenue) * 50)
                                                : 50
                                        ))}
                                        className="h-3"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Statistical Distribution */}
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle>Order Value Distribution</CardTitle>
                                <CardDescription>Statistical breakdown of order amounts</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                            <p className="text-sm text-muted-foreground">Mean (μ)</p>
                                            <p className="text-xl font-bold">{formatCurrency(summary.orderValueMean || 0)}</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                            <p className="text-sm text-muted-foreground">Median</p>
                                            <p className="text-xl font-bold">{formatCurrency(summary.orderValueMedian || 0)}</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                            <p className="text-sm text-muted-foreground">Std Dev (σ)</p>
                                            <p className="text-xl font-bold">{formatCurrency(summary.orderValueStdDev || 0)}</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                            <p className="text-sm text-muted-foreground">95th Percentile</p>
                                            <p className="text-xl font-bold">{formatCurrency(summary.orderValueP95 || 0)}</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg">
                                        <p className="text-sm text-muted-foreground mb-2">Regression Model Quality</p>
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1">
                                                <Progress value={(summary.regressionR2 || 0) * 100} className="h-3" />
                                            </div>
                                            <p className="text-lg font-bold">R² = {summary.regressionR2?.toFixed(3) || 'N/A'}</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            {(summary.regressionR2 || 0) > 0.8 ? '✓ Strong predictive power' :
                                                (summary.regressionR2 || 0) > 0.5 ? '◐ Moderate predictive power' :
                                                    '✗ Weak predictive power'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* OPERATIONS TAB */}
                <TabsContent value="operations" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Little's Law Panel */}
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Gauge className="h-5 w-5 text-orange-500" />
                                    Little's Law Analysis
                                </CardTitle>
                                <CardDescription>L = λ × W (Operational bottleneck detection)</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                        <p className="text-xs text-muted-foreground">λ (Arrival)</p>
                                        <p className="text-lg font-bold text-orange-600">{summary.ordersArrivalRate?.toFixed(1) || 0}</p>
                                        <p className="text-xs text-muted-foreground">orders/day</p>
                                    </div>
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <p className="text-xs text-muted-foreground">W (Wait)</p>
                                        <p className="text-lg font-bold text-blue-600">{summary.avgWaitTime?.toFixed(1) || 0}</p>
                                        <p className="text-xs text-muted-foreground">days</p>
                                    </div>
                                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                        <p className="text-xs text-muted-foreground">L (In Process)</p>
                                        <p className="text-lg font-bold text-purple-600">{summary.itemsInProcess?.toFixed(0) || 0}</p>
                                        <p className="text-xs text-muted-foreground">orders</p>
                                    </div>
                                </div>
                                <div className="pt-4 border-t">
                                    <p className="text-sm font-medium mb-2">Bottleneck Status</p>
                                    <BottleneckIndicator
                                        type={summary.bottleneckType}
                                        recommendation={summary.bottleneckRecommendation}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Turnaround Time */}
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-blue-500" />
                                    Turnaround Performance
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-center mb-4">
                                    <ResponsiveContainer width={150} height={150}>
                                        <RadialBarChart
                                            cx="50%"
                                            cy="50%"
                                            innerRadius="60%"
                                            outerRadius="100%"
                                            data={[{ value: summary.percentWithinTarget || 0, fill: COLORS.success }]}
                                            startAngle={90}
                                            endAngle={-270}
                                        >
                                            <RadialBar dataKey="value" cornerRadius={10} />
                                        </RadialBarChart>
                                    </ResponsiveContainer>
                                    <div className="absolute text-center">
                                        <p className="text-2xl font-bold">{summary.percentWithinTarget?.toFixed(0) || 0}%</p>
                                        <p className="text-xs text-muted-foreground">On Target</p>
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Avg Turnaround</span>
                                        <span className="font-medium">{summary.avgTurnaroundHours?.toFixed(1) || 0} hrs</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Std Deviation</span>
                                        <span className="font-medium">±{summary.turnaroundStdDev?.toFixed(1) || 0} hrs</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Consistency Score</span>
                                        <span className="font-medium">{summary.turnaroundConsistencyScore || 0}/100</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Peak Demand */}
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Flame className="h-5 w-5 text-red-500" />
                                    Peak Demand Hours
                                </CardTitle>
                                <CardDescription>When your store is busiest</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {(summary.demandHeatmapTop10 || []).slice(0, 5).map((slot, index) => (
                                        <div key={index} className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                                                index === 0 ? "bg-red-500 text-white" :
                                                    index === 1 ? "bg-orange-500 text-white" :
                                                        index === 2 ? "bg-yellow-500 text-white" :
                                                            "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                                            )}>
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{slot.label}</p>
                                                <Progress value={slot.demandScore * 100} className="h-2 mt-1" />
                                            </div>
                                            <span className="text-sm font-medium">{(slot.demandScore * 100).toFixed(0)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* STAFF TAB */}
                <TabsContent value="staff" className="space-y-4">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Award className="h-5 w-5 text-yellow-500" />
                                Staff Performance Leaderboard
                            </CardTitle>
                            <CardDescription>
                                Weighted productivity scores with Z-Score normalization (complexity: Suit=3x, Shirt=1x)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {(summary.staffPerformance || []).map((staff, index) => (
                                    <div
                                        key={staff.employeeId}
                                        className={cn(
                                            "flex items-center gap-4 p-4 rounded-lg border",
                                            index === 0 && "bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200",
                                            index === 1 && "bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 border-slate-200",
                                            index === 2 && "bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200",
                                            index > 2 && "bg-white dark:bg-slate-800"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold",
                                            index === 0 ? "bg-yellow-400 text-yellow-900" :
                                                index === 1 ? "bg-slate-300 text-slate-700" :
                                                    index === 2 ? "bg-orange-400 text-orange-900" :
                                                        "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                                        )}>
                                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold">{staff.employeeName}</p>
                                                <ZScoreBadge score={staff.zScore} />
                                            </div>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                                <span>Percentile: {staff.percentile}th</span>
                                                <span>|</span>
                                                <span>Weighted Score: {staff.weightedScore}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold">
                                                {staff.zScore > 0 ? '+' : ''}{staff.zScore.toFixed(2)}σ
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ANOMALIES TAB */}
                <TabsContent value="anomalies" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Anomaly Summary */}
                        <Card className="shadow-lg border-l-4 border-l-amber-500">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                                    Anomaly Detection Summary
                                </CardTitle>
                                <CardDescription>Orders deviating &gt;3 standard deviations from mean</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-center">
                                        <p className="text-3xl font-bold text-amber-600">{summary.anomalyCount}</p>
                                        <p className="text-sm text-muted-foreground">Anomalies Detected</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                                        <p className="text-3xl font-bold">{summary.orderCount}</p>
                                        <p className="text-sm text-muted-foreground">Total Orders</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    <p className="text-sm font-medium mb-2">Detection Threshold</p>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">Mean: {formatCurrency(summary.orderValueMean || 0)}</Badge>
                                        <Badge variant="outline">±3σ: {formatCurrency((summary.orderValueStdDev || 0) * 3)}</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Flagged Orders */}
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-red-500" />
                                    Flagged Orders
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {(summary.anomalyDetails || []).length > 0 ? (
                                    <div className="space-y-3">
                                        {(summary.anomalyDetails || []).map((anomaly, index) => (
                                            <div key={index} className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <p className="font-mono font-semibold">{anomaly.orderNumber}</p>
                                                        <p className="text-sm text-muted-foreground mt-1">{anomaly.flagReason}</p>
                                                    </div>
                                                    <Badge variant="destructive">
                                                        {anomaly.zScore > 0 ? '+' : ''}{anomaly.zScore.toFixed(1)}σ
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                                        <p className="font-medium">No Anomalies Detected</p>
                                        <p className="text-sm text-muted-foreground">All orders are within normal parameters</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* GST Breakout */}
                        <Card className="shadow-lg col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-green-500" />
                                    GST Breakout Report
                                </CardTitle>
                                <CardDescription>Tax collection summary (CGST/SGST/IGST split)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-5 gap-4">
                                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                                        <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.taxableAmount)}</p>
                                        <p className="text-sm text-muted-foreground">Taxable Amount</p>
                                    </div>
                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.cgstAmount)}</p>
                                        <p className="text-sm text-muted-foreground">CGST (9%)</p>
                                    </div>
                                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                                        <p className="text-2xl font-bold text-purple-600">{formatCurrency(summary.sgstAmount)}</p>
                                        <p className="text-sm text-muted-foreground">SGST (9%)</p>
                                    </div>
                                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center">
                                        <p className="text-2xl font-bold text-orange-600">{formatCurrency(summary.igstAmount)}</p>
                                        <p className="text-sm text-muted-foreground">IGST (18%)</p>
                                    </div>
                                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-center">
                                        <p className="text-2xl font-bold text-indigo-600">{formatCurrency(summary.totalTaxCollected)}</p>
                                        <p className="text-sm text-muted-foreground">Total Tax</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Footer Stats */}
            <Card className="bg-slate-900 text-white shadow-lg">
                <CardContent className="py-4">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                            <Badge variant="outline" className="border-slate-600 text-slate-300">
                                Data Quality: {summary.dataQualityScore || 0}%
                            </Badge>
                            <span className="text-slate-400">
                                Last calculated: {summary.calculationDurationMs}ms
                            </span>
                        </div>
                        <div className="text-slate-400">
                            Powered by FabZClean BI Engine v1.0
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
