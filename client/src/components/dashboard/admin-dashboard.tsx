import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
    Users,
    IndianRupee,
    ShoppingBag,
    ArrowUpRight,
    ArrowDownRight,
    CalendarIcon,
    CalendarDays,
    X,
    Clock,
    TrendingUp,
    UserPlus,
} from "lucide-react";
import { formatCurrency } from "@/lib/data";
import { ordersApi, customersApi } from "@/lib/data-service";
import DashboardDueToday from "./components/dashboard-due-today";
import DashboardRecentOrders from "./components/dashboard-recent-orders";
import DashboardQuickActions from "./components/dashboard-quick-actions";
import WeatherWidget from "./components/weather-widget";
import DashboardOrdersByDate from "./components/orders-by-date";
import DashboardNewCustomers from "./components/new-customers";
import { format, startOfDay, endOfDay, isWithinInterval, isSameDay, subDays, startOfMonth, startOfQuarter, startOfYear } from "date-fns";
import { cn } from "@/lib/utils";

import { useQuery } from "@tanstack/react-query";

type FilterMode = 'all' | 'preset' | 'date' | 'range';
type PresetPeriod = 'day' | 'week' | 'fortnight' | 'month' | 'quarter' | 'year';

const PERIOD_FILTERS: Array<{ value: PresetPeriod; label: string }> = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Weekly' },
    { value: 'fortnight', label: 'Fortnightly' },
    { value: 'month', label: 'Monthly' },
    { value: 'quarter', label: 'Quarterly' },
    { value: 'year', label: 'Year-on' },
];

export default function AdminDashboard() {
    // Date filter state
    const [filterMode, setFilterMode] = useState<FilterMode>('preset');
    const [presetPeriod, setPresetPeriod] = useState<PresetPeriod>('month');
    const [isFilterActive, setIsFilterActive] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [rangeStart, setRangeStart] = useState<Date | undefined>(undefined);
    const [rangeEnd, setRangeEnd] = useState<Date | undefined>(undefined);
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [rangeStep, setRangeStep] = useState<'start' | 'end'>('start');

    const effectiveFilterMode = isFilterActive ? filterMode : 'preset';
    const effectivePresetPeriod = isFilterActive ? presetPeriod : 'month';

    // Fetch all orders (single-tenant, no franchise filtering)
    const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
        queryKey: ['admin-orders'],
        queryFn: () => ordersApi.getAll(),
        staleTime: 5000,
        refetchInterval: 5000, // Background auto-sync 5s
    });

    // Fetch all customers (single-tenant)
    const { data: customersResponse, isLoading: isLoadingCustomers } = useQuery({
        queryKey: ['admin-customers'],
        queryFn: () => customersApi.getAll({ limit: 1000 }),
        staleTime: 5000,
    });
    const customersList = useMemo(() => customersResponse?.data || [], [customersResponse]);

    // Filter orders by selected date/range
    const filteredOrders = useMemo(() => {
        if (effectiveFilterMode === 'all') return orders;

        const now = new Date();
        const todayStart = startOfDay(now);

        if (effectiveFilterMode === 'preset') {
            let start = todayStart;
            if (effectivePresetPeriod === 'week') {
                start = startOfDay(subDays(now, 6));
            } else if (effectivePresetPeriod === 'fortnight') {
                start = startOfDay(subDays(now, 13));
            } else if (effectivePresetPeriod === 'month') {
                start = startOfMonth(now);
            } else if (effectivePresetPeriod === 'quarter') {
                start = startOfQuarter(now);
            } else if (effectivePresetPeriod === 'year') {
                start = startOfYear(now);
            }
            return orders.filter((o: any) => {
                const d = new Date(o.createdAt || now);
                return isWithinInterval(d, { start, end: endOfDay(now) });
            });
        }

        if (effectiveFilterMode === 'date' && selectedDate) {
            return orders.filter((o: any) => {
                const d = new Date(o.createdAt || now);
                return isSameDay(d, selectedDate);
            });
        }

        if (effectiveFilterMode === 'range' && rangeStart && rangeEnd) {
            const start = startOfDay(rangeStart);
            const end = endOfDay(rangeEnd);
            return orders.filter((o: any) => {
                const d = new Date(o.createdAt || now);
                return isWithinInterval(d, { start, end });
            });
        }

        return orders;
    }, [orders, effectiveFilterMode, effectivePresetPeriod, selectedDate, rangeStart, rangeEnd]);

    // Calculate stats from calendar month, last 30 days, and same day last month
    const stats = useMemo(() => {
        const now = new Date();
        const startOfThisMonth = startOfMonth(now);
        const last30DaysStart = subDays(startOfThisMonth, 30);
        const last30DaysEnd = startOfThisMonth;
        const startOfToday = startOfDay(now);
        const todayEnd = endOfDay(now);

        // Helper to filter active orders (non-cancelled, non-refunded, non-deleted)
        const filterActive = (orderList: any[]) => orderList.filter((o: any) => {
            const status = String(o.status || '').toLowerCase();
            return status !== 'cancelled' && status !== 'refunded' && status !== 'deleted';
        });

        const allActiveOrders = filterActive(orders);

        let start: Date | null = null;
        let end: Date | null = null;
        let compStart: Date | null = null;
        let compEnd: Date | null = null;
        let periodLabel = 'all-time';

        if (effectiveFilterMode === 'preset') {
            if (effectivePresetPeriod === 'day') {
                start = startOfToday;
                end = todayEnd;
                compStart = startOfDay(subDays(now, 1));
                compEnd = endOfDay(subDays(now, 1));
                periodLabel = 'yesterday';
            } else if (effectivePresetPeriod === 'week') {
                start = startOfDay(subDays(now, 6));
                end = todayEnd;
                compStart = startOfDay(subDays(start, 7));
                compEnd = endOfDay(subDays(start, 1));
                periodLabel = 'prev week';
            } else if (effectivePresetPeriod === 'fortnight') {
                start = startOfDay(subDays(now, 13));
                end = todayEnd;
                compStart = startOfDay(subDays(start, 14));
                compEnd = endOfDay(subDays(start, 1));
                periodLabel = 'prev 14d';
            } else if (effectivePresetPeriod === 'month') {
                start = startOfThisMonth;
                end = todayEnd;
                compStart = last30DaysStart;
                compEnd = last30DaysEnd;
                periodLabel = 'prev 30d';
            } else if (effectivePresetPeriod === 'quarter') {
                start = startOfQuarter(now);
                end = todayEnd;
                compStart = subDays(start, 90);
                compEnd = start;
                periodLabel = 'prev 90d';
            } else if (effectivePresetPeriod === 'year') {
                start = startOfYear(now);
                end = todayEnd;
                compStart = subDays(start, 365);
                compEnd = start;
                periodLabel = 'prev year';
            }
        } else if (effectiveFilterMode === 'date' && selectedDate) {
            start = startOfDay(selectedDate);
            end = endOfDay(selectedDate);
            compStart = startOfDay(subDays(selectedDate, 1));
            compEnd = endOfDay(subDays(selectedDate, 1));
            periodLabel = 'prev day';
        } else if (effectiveFilterMode === 'range' && rangeStart && rangeEnd) {
            start = startOfDay(rangeStart);
            end = endOfDay(rangeEnd);
            const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
            compStart = startOfDay(subDays(start, diffDays));
            compEnd = endOfDay(subDays(start, 1));
            periodLabel = `prev ${diffDays}d`;
        }

        // Filter orders inside the selected period
        const periodOrders = allActiveOrders.filter((o: any) => {
            if (!start || !end) return true; // All Time
            const d = new Date(o.createdAt || now);
            return d >= start && d <= end;
        });

        const periodRevenue = periodOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || 0), 0);
        const periodOrdersCount = periodOrders.length;
        const periodActiveCustomers = new Set(periodOrders.map((o: any) => o.customerId)).size;

        // Filter orders inside the comparison period
        let comparisonOrdersCount = 0;
        let comparisonRevenue = 0;
        let comparisonActiveCustomers = 0;

        if (compStart && compEnd) {
            const comparisonOrders = allActiveOrders.filter((o: any) => {
                const d = new Date(o.createdAt || now);
                return d >= compStart && d <= compEnd;
            });
            comparisonRevenue = comparisonOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || 0), 0);
            comparisonOrdersCount = comparisonOrders.length;
            comparisonActiveCustomers = new Set(comparisonOrders.map((o: any) => o.customerId)).size;
        }

        // Helper to calculate growth percentage where division by zero is handled properly
        const getGrowth = (current: number, previous: number) => {
            if (previous > 0) return ((current - previous) / previous) * 100;
            return current > 0 ? 100 : 0;
        };

        const revenueGrowth = getGrowth(periodRevenue, comparisonRevenue);
        const ordersGrowth = getGrowth(periodOrdersCount, comparisonOrdersCount);
        const customersGrowth = getGrowth(periodActiveCustomers, comparisonActiveCustomers);

        // 3. Today's Revenue and Orders (always current day)
        const todayOrders = allActiveOrders.filter((o: any) => new Date(o.createdAt || now) >= startOfToday);
        const todayRevenue = todayOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || 0), 0);
        const todayOrderCount = todayOrders.length;

        // 4. Last Month Same Day Revenue
        const lastMonthSameDay = new Date(now);
        lastMonthSameDay.setMonth(now.getMonth() - 1);
        if (lastMonthSameDay.getDate() !== now.getDate()) {
            lastMonthSameDay.setDate(0); // Go to last day of previous month
        }
        const lmsdStart = startOfDay(lastMonthSameDay);
        const lmsdEnd = endOfDay(lastMonthSameDay);
        const lastMonthSameDayOrders = allActiveOrders.filter((o: any) => {
            const d = new Date(o.createdAt || now);
            return d >= lmsdStart && d <= lmsdEnd;
        });
        const lastMonthSameDayRevenue = lastMonthSameDayOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || 0), 0);
        const todayRevenueGrowth = getGrowth(todayRevenue, lastMonthSameDayRevenue);

        // 5. New Customers (this period vs comparison period, fallback to current month vs last 30 days for All Time)
        const custStart = start || startOfThisMonth;
        const custEnd = end || todayEnd;
        const custCompStart = compStart || last30DaysStart;
        const custCompEnd = compEnd || last30DaysEnd;
        const custLabel = periodLabel === 'all-time' ? '30 days' : periodLabel;

        const newCustomersThisPeriod = customersList.filter((c: any) => 
            c.createdAt && new Date(c.createdAt) >= custStart && new Date(c.createdAt) <= custEnd
        ).length;

        const newCustomersCompPeriod = customersList.filter((c: any) => 
            c.createdAt && new Date(c.createdAt) >= custCompStart && new Date(c.createdAt) <= custCompEnd
        ).length;

        const newCustomersGrowth = getGrowth(newCustomersThisPeriod, newCustomersCompPeriod);

        return {
            totalRevenue: periodRevenue,
            revenueGrowth: effectiveFilterMode === 'all' ? null : parseFloat(revenueGrowth.toFixed(1)),
            revenueLabel: periodLabel,
            comparisonRevenue: comparisonRevenue,
            totalOrders: periodOrdersCount,
            ordersGrowth: effectiveFilterMode === 'all' ? null : parseFloat(ordersGrowth.toFixed(1)),
            ordersLabel: periodLabel,
            comparisonOrdersCount: comparisonOrdersCount,
            activeCustomers: periodActiveCustomers,
            customersGrowth: effectiveFilterMode === 'all' ? null : parseFloat(customersGrowth.toFixed(1)),
            customersLabel: periodLabel,
            newCustomers: newCustomersThisPeriod,
            newCustomersGrowth: parseFloat(newCustomersGrowth.toFixed(1)),
            newCustomersLabel: custLabel,
            comparisonNewCustomers: newCustomersCompPeriod,
            todayRevenue,
            todayOrderCount,
            todayRevenueGrowth: parseFloat(todayRevenueGrowth.toFixed(1)),
            lastMonthSameDayRevenue,
        };
    }, [orders, customersList, effectiveFilterMode, effectivePresetPeriod, selectedDate, rangeStart, rangeEnd]);

    const dueTodayOrders: any[] = useMemo(() => {
        return filteredOrders.map((order: any) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            customerName: order.customerName || 'Unknown',
            status: order.status,
            paymentStatus: order.paymentStatus || 'pending',
            total: parseFloat(order.totalAmount || 0),
            service: order.items?.[0]?.serviceName,
            pickupDate: order.pickupDate,
            createdAt: order.createdAt
        }));
    }, [filteredOrders]);

    const recentOrders: any[] = useMemo(() => {
        return filteredOrders
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 10)
            .map((order: any) => ({
                id: order.id,
                orderNumber: order.orderNumber,
                customerName: order.customerName || 'Unknown',
                date: order.createdAt,
                status: order.status,
                paymentStatus: order.paymentStatus || 'pending',
                total: parseFloat(order.totalAmount || 0),
                service: order.items?.[0]?.serviceName,
                createdAt: order.createdAt,
                isExpressOrder: order.isExpress
            }));
    }, [filteredOrders]);

    // Filter label for display
    const filterLabel = useMemo(() => {
        if (filterMode === 'preset') {
            const selected = PERIOD_FILTERS.find((option) => option.value === presetPeriod);
            return `${selected?.label || 'Day'} Sales`;
        }
        if (filterMode === 'date' && selectedDate) return format(selectedDate, 'dd MMM yyyy');
        if (filterMode === 'range' && rangeStart && rangeEnd) return `${format(rangeStart, 'dd MMM')} — ${format(rangeEnd, 'dd MMM yyyy')}`;
        return 'All Time View';
    }, [filterMode, presetPeriod, selectedDate, rangeStart, rangeEnd]);

    const handleDateSelect = (date: Date | undefined) => {
        if (!date) return;
        if (filterMode === 'range') {
            if (rangeStep === 'start') {
                setRangeStart(date);
                setRangeEnd(undefined);
                setRangeStep('end');
            } else {
                // Ensure end >= start
                if (rangeStart && date < rangeStart) {
                    setRangeEnd(rangeStart);
                    setRangeStart(date);
                } else {
                    setRangeEnd(date);
                }
                setRangeStep('start');
                setCalendarOpen(false);
                setIsFilterActive(true);
            }
        } else {
            setSelectedDate(date);
            setFilterMode('date');
            setCalendarOpen(false);
            setIsFilterActive(true);
        }
    };

    const clearFilter = () => {
        setFilterMode('all');
        setPresetPeriod('day');
        setSelectedDate(undefined);
        setRangeStart(undefined);
        setRangeEnd(undefined);
        setRangeStep('start');
        setIsFilterActive(false);
    };

    const statCards = [
        {
            title: 'Revenue',
            value: formatCurrency(stats.totalRevenue),
            growth: stats.revenueGrowth,
            label: stats.revenueLabel,
            comparisonValue: formatCurrency(stats.comparisonRevenue),
            icon: IndianRupee,
        },
        {
            title: 'Orders',
            value: String(stats.totalOrders),
            growth: stats.ordersGrowth,
            label: stats.ordersLabel,
            comparisonValue: String(stats.comparisonOrdersCount),
            icon: ShoppingBag,
        },
        {
            title: 'New Customers',
            value: String(stats.newCustomers),
            growth: stats.newCustomersGrowth,
            label: stats.newCustomersLabel,
            comparisonValue: String(stats.comparisonNewCustomers),
            icon: UserPlus,
        },
    ];

    return (
        <div className="container-desktop space-y-6 py-2 sm:space-y-8 sm:py-4">
            <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                        <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <ShoppingBag className="h-6 w-6" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                            Dashboard
                        </h1>

                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm sm:w-auto sm:grid-cols-3">
                        <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Live sync</p>
                            <p className="mt-1 font-semibold text-foreground">Every 5s</p>
                        </div>
                        <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Orders</p>
                            <p className="mt-1 font-semibold text-foreground">{stats.totalOrders}</p>
                        </div>
                        <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Customers</p>
                            <p className="mt-1 font-semibold text-foreground">{stats.activeCustomers}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Date Filter Bar */}
            <section className="flex flex-wrap items-center gap-3">
                <Button
                    variant={isFilterActive && filterMode === 'all' ? 'pills' : 'outline'}
                    size="sm"
                    className="h-10 rounded-xl px-5 font-bold text-xs shadow-sm transition-all hover:scale-105"
                    onClick={() => {
                        setFilterMode('all');
                        setIsFilterActive(true);
                        setSelectedDate(undefined);
                        setRangeStart(undefined);
                        setRangeEnd(undefined);
                        setRangeStep('start');
                    }}
                >
                    All Time
                </Button>
                {PERIOD_FILTERS.map((period) => (
                    <Button
                        key={period.value}
                        variant={isFilterActive && filterMode === 'preset' && presetPeriod === period.value ? 'pills' : 'outline'}
                        size="sm"
                        className="h-10 rounded-xl px-5 font-bold text-xs shadow-sm transition-all hover:scale-105"
                        onClick={() => {
                            setFilterMode('preset');
                            setPresetPeriod(period.value);
                            setIsFilterActive(true);
                        }}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {period.label}
                    </Button>
                ))}

                {/* Date Picker */}
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant={isFilterActive && filterMode === 'date' ? 'pills' : 'outline'}
                            size="sm"
                            className="h-10 rounded-xl px-5 font-bold text-xs shadow-sm transition-all hover:scale-105"
                            onClick={() => {
                                setFilterMode('date');
                                setCalendarOpen(true);
                            }}
                        >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {isFilterActive && filterMode === 'date' && selectedDate
                                ? format(selectedDate, 'dd MMM yyyy')
                                : 'Select Date'}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-2" align="start">
                        <div className="p-4 pb-2 border-b">
                            <p className="text-sm font-black text-foreground">
                                {filterMode === 'range'
                                    ? (rangeStep === 'start' ? 'Select Start Date' : 'Select End Date')
                                    : 'Select a Date'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {filterMode === 'range' && rangeStart && rangeStep === 'end'
                                    ? `From: ${format(rangeStart, 'dd MMM yyyy')}`
                                    : 'Pick a date to view stats'}
                            </p>
                        </div>
                        <Calendar
                            mode="single"
                            selected={filterMode === 'range'
                                ? (rangeStep === 'start' ? rangeStart : rangeEnd)
                                : selectedDate}
                            onSelect={handleDateSelect}
                            disabled={(date) => date > new Date()}
                            initialFocus
                            className="rounded-b-2xl"
                        />
                    </PopoverContent>
                </Popover>

                {/* Date Range */}
                <Button
                    variant={isFilterActive && filterMode === 'range' ? 'pills' : 'outline'}
                    size="sm"
                    className="h-10 rounded-xl px-5 font-bold text-xs shadow-sm transition-all hover:scale-105"
                    onClick={() => {
                        setFilterMode('range');
                        setRangeStart(undefined);
                        setRangeEnd(undefined);
                        setRangeStep('start');
                        setCalendarOpen(true);
                    }}
                >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {isFilterActive && filterMode === 'range' && rangeStart && rangeEnd
                        ? `${format(rangeStart, 'dd MMM')} — ${format(rangeEnd, 'dd MMM')}`
                        : 'Date Range'}
                </Button>

                {/* Active filter indicator */}
                {isFilterActive && (
                    <Badge variant="secondary" className="rounded-full font-bold text-xs px-3 py-1 gap-1.5 bg-primary/10 text-primary border-primary/20">
                        {filterLabel}
                        <button onClick={clearFilter} className="ml-1 hover:bg-primary/20 rounded-full p-0.5">
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                )}
            </section>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
                {statCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Card key={card.title} className="group border-border bg-card shadow-sm rounded-2xl transition-all hover:shadow-md hover:border-border/80">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{card.title}</CardTitle>
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground group-hover:text-primary transition-colors">
                                    <Icon className="h-5 w-5" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="truncate text-3xl font-black text-foreground tracking-tight">{card.value}</div>
                                <div className="mt-3 flex min-h-5 items-center">
                                    {card.growth !== null ? (
                                        <div className={cn(
                                            "flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold transition-all",
                                            card.growth > 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                                        )}>
                                            {card.growth > 0 ? (
                                                <ArrowUpRight className="h-3.5 w-3.5" />
                                            ) : (
                                                <ArrowDownRight className="h-3.5 w-3.5" />
                                            )}
                                            {Math.abs(card.growth)}%
                                            <span className="text-muted-foreground/60 font-medium ml-1">vs {card.comparisonValue} ({card.label})</span>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-muted-foreground/40 font-medium">{card.title === 'New Customers' ? 'Monthly registration baseline' : 'All-time baseline'}</span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {/* Today's Revenue Widget — always visible */}
                <Card className="group border-emerald-200 dark:border-emerald-800/30 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/10 dark:to-card shadow-sm overflow-hidden rounded-2xl transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Today's Revenue</CardTitle>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="truncate text-3xl font-black text-emerald-800 dark:text-emerald-300 tabular-nums tracking-tight">
                            {formatCurrency(stats.todayRevenue)}
                        </div>
                        <div className="mt-3 flex min-h-5 items-center">
                            <div className={cn(
                                "flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold transition-all",
                                stats.todayRevenueGrowth > 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                            )}>
                                {stats.todayRevenueGrowth > 0 ? (
                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                ) : (
                                    <ArrowDownRight className="h-3.5 w-3.5" />
                                )}
                                {Math.abs(stats.todayRevenueGrowth)}%
                                <span className="text-muted-foreground/60 font-medium ml-1">
                                    vs {formatCurrency(stats.lastMonthSameDayRevenue)} (last month same day)
                                </span>
                            </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
                                <Clock className="h-3 w-3" />
                                {stats.todayOrderCount} order{stats.todayOrderCount !== 1 ? 's' : ''}
                            </div>
                            <span className="text-[10px] text-emerald-600/60 font-medium">Live sync</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <DashboardQuickActions />

            {/* Orders created today, Due Today & Recent Orders */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                <div className="overflow-hidden" style={{ height: '28rem' }}>
                    <DashboardOrdersByDate />
                </div>
                <div className="overflow-hidden" style={{ height: '28rem' }}>
                    <DashboardDueToday
                        orders={dueTodayOrders}
                        isLoading={isLoadingOrders}
                    />
                </div>
                <div className="overflow-hidden" style={{ height: '28rem' }}>
                    <DashboardRecentOrders
                        recentOrders={recentOrders}
                        isLoading={isLoadingOrders}
                    />
                </div>
            </div>

            {/* Customer growth insight */}
            <div className="grid grid-cols-1 gap-6 2xl:auto-rows-fr 2xl:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.35fr)]">
                <div className="h-full">
                    <DashboardNewCustomers />
                </div>
                <div className="h-full">
                    <WeatherWidget />
                </div>
            </div>
        </div>
    );
}
