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
} from "lucide-react";
import { formatCurrency } from "@/lib/data";
import { ordersApi } from "@/lib/data-service";
import DashboardDueToday from "./components/dashboard-due-today";
import DashboardRecentOrders from "./components/dashboard-recent-orders";
import DashboardQuickActions from "./components/dashboard-quick-actions";
import WeatherWidget from "./components/weather-widget";
import { format, startOfDay, endOfDay, isWithinInterval, isSameDay } from "date-fns";

import { useQuery } from "@tanstack/react-query";

type FilterMode = 'all' | 'today' | 'date' | 'range';

export default function AdminDashboard() {
    // Date filter state
    const [filterMode, setFilterMode] = useState<FilterMode>('all');
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [rangeStart, setRangeStart] = useState<Date | undefined>(undefined);
    const [rangeEnd, setRangeEnd] = useState<Date | undefined>(undefined);
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [rangeStep, setRangeStep] = useState<'start' | 'end'>('start');

    // Fetch all orders (single-tenant, no franchise filtering)
    const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
        queryKey: ['admin-orders'],
        queryFn: () => ordersApi.getAll(),
        staleTime: 5000,
        refetchInterval: 5000, // Background auto-sync 5s
    });

    // Filter orders by selected date/range
    const filteredOrders = useMemo(() => {
        if (filterMode === 'all') return orders;

        const now = new Date();
        const todayStart = startOfDay(now);

        if (filterMode === 'today') {
            return orders.filter((o: any) => {
                const d = new Date(o.createdAt || now);
                return isSameDay(d, todayStart);
            });
        }

        if (filterMode === 'date' && selectedDate) {
            return orders.filter((o: any) => {
                const d = new Date(o.createdAt || now);
                return isSameDay(d, selectedDate);
            });
        }

        if (filterMode === 'range' && rangeStart && rangeEnd) {
            const start = startOfDay(rangeStart);
            const end = endOfDay(rangeEnd);
            return orders.filter((o: any) => {
                const d = new Date(o.createdAt || now);
                return isWithinInterval(d, { start, end });
            });
        }

        return orders;
    }, [orders, filterMode, selectedDate, rangeStart, rangeEnd]);

    // Calculate stats from filtered orders
    const stats = useMemo(() => {
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const startOfThisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const startOfLastWeek = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

        // Use filtered orders for primary stats
        const totalRevenue = filteredOrders.reduce((sum: number, order: any) => sum + parseFloat(order.totalAmount || 0), 0);
        const totalOrders = filteredOrders.length;
        const activeCustomers = new Set(filteredOrders.map((o: any) => o.customerId)).size;

        // Growth calculations always use ALL orders
        const thisMonthOrders = orders.filter((o: any) => new Date(o.createdAt || now) >= startOfThisMonth);
        const lastMonthOrders = orders.filter((o: any) => {
            const d = new Date(o.createdAt || now);
            return d >= startOfLastMonth && d < startOfThisMonth;
        });
        const thisWeekOrders = orders.filter((o: any) => new Date(o.createdAt || now) >= startOfThisWeek);
        const lastWeekOrders = orders.filter((o: any) => {
            const d = new Date(o.createdAt || now);
            return d >= startOfLastWeek && d < startOfThisWeek;
        });
        const todayOrders = orders.filter((o: any) => new Date(o.createdAt || now) >= startOfToday);
        const yesterdayOrders = orders.filter((o: any) => {
            const d = new Date(o.createdAt || now);
            return d >= startOfYesterday && d < startOfToday;
        });

        const getGrowth = (current: number, month: number, week: number, yesterday: number) => {
            if (month > 0) return { val: ((current - month) / month) * 100, label: 'month' };
            if (week > 0) return { val: ((current - week) / week) * 100, label: 'week' };
            if (yesterday > 0) return { val: ((current - yesterday) / yesterday) * 100, label: 'yesterday' };
            return { val: null, label: null };
        };

        // Revenue Growth (always from all orders)
        const thisMonthRevenue = thisMonthOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || 0), 0);
        const lastMonthRevenue = lastMonthOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || 0), 0);
        const lastWeekRevenue = lastWeekOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || 0), 0);
        const todayRevenue = todayOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || 0), 0);
        const yesterdayRevenue = yesterdayOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || 0), 0);

        const revGrowth = filterMode === 'all'
            ? getGrowth(thisMonthRevenue, lastMonthRevenue, lastWeekRevenue, yesterdayRevenue)
            : { val: null, label: null };

        // Orders Growth
        const ordGrowth = filterMode === 'all'
            ? getGrowth(thisMonthOrders.length, lastMonthOrders.length, lastWeekOrders.length, yesterdayOrders.length)
            : { val: null, label: null };

        // Customers Growth
        const activeThisMonth = new Set(thisMonthOrders.map((o: any) => o.customerId)).size;
        const activeLastMonth = new Set(lastMonthOrders.map((o: any) => o.customerId)).size;
        const activeLastWeek = new Set(lastWeekOrders.map((o: any) => o.customerId)).size;
        const activeYesterday = new Set(yesterdayOrders.map((o: any) => o.customerId)).size;

        const custGrowth = filterMode === 'all'
            ? getGrowth(activeThisMonth, activeLastMonth, activeLastWeek, activeYesterday)
            : { val: null, label: null };

        return {
            totalRevenue,
            revenueGrowth: revGrowth.val !== null ? parseFloat(revGrowth.val.toFixed(1)) : null,
            revenueLabel: revGrowth.label,
            totalOrders,
            ordersGrowth: ordGrowth.val !== null ? parseFloat(ordGrowth.val.toFixed(1)) : null,
            ordersLabel: ordGrowth.label,
            activeCustomers,
            customersGrowth: custGrowth.val !== null ? parseFloat(custGrowth.val.toFixed(1)) : null,
            customersLabel: custGrowth.label,
            todayRevenue: todayOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || 0), 0),
            todayOrderCount: todayOrders.length,
        };
    }, [orders, filteredOrders, filterMode]);

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
            .slice(0, 5)
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
        if (filterMode === 'today') return `Today — ${format(new Date(), 'dd MMM yyyy')}`;
        if (filterMode === 'date' && selectedDate) return format(selectedDate, 'dd MMM yyyy');
        if (filterMode === 'range' && rangeStart && rangeEnd) return `${format(rangeStart, 'dd MMM')} — ${format(rangeEnd, 'dd MMM yyyy')}`;
        return 'All Time';
    }, [filterMode, selectedDate, rangeStart, rangeEnd]);

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
            }
        } else {
            setSelectedDate(date);
            setFilterMode('date');
            setCalendarOpen(false);
        }
    };

    const clearFilter = () => {
        setFilterMode('all');
        setSelectedDate(undefined);
        setRangeStart(undefined);
        setRangeEnd(undefined);
        setRangeStep('start');
    };

    const statCards = [
        {
            title: 'Revenue',
            value: formatCurrency(stats.totalRevenue),
            growth: stats.revenueGrowth,
            label: stats.revenueLabel,
            icon: IndianRupee,
        },
        {
            title: 'Orders',
            value: String(stats.totalOrders),
            growth: stats.ordersGrowth,
            label: stats.ordersLabel,
            icon: ShoppingBag,
        },
        {
            title: 'Customers',
            value: String(stats.activeCustomers),
            growth: stats.customersGrowth,
            label: stats.customersLabel,
            icon: Users,
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
                        <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
                            A simple, live view of orders, customers, printing, and what needs attention today.
                        </p>
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
                    variant={filterMode === 'all' ? 'default' : 'outline'}
                    size="sm"
                    className="rounded-full font-bold text-xs"
                    onClick={clearFilter}
                >
                    All Time
                </Button>
                <Button
                    variant={filterMode === 'today' ? 'default' : 'outline'}
                    size="sm"
                    className="rounded-full font-bold text-xs"
                    onClick={() => {
                        setFilterMode('today');
                        setSelectedDate(new Date());
                    }}
                >
                    <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                    Today
                </Button>

                {/* Date Picker */}
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant={filterMode === 'date' ? 'default' : 'outline'}
                            size="sm"
                            className="rounded-full font-bold text-xs"
                            onClick={() => {
                                setFilterMode('date');
                                setCalendarOpen(true);
                            }}
                        >
                            <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                            {filterMode === 'date' && selectedDate
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
                    variant={filterMode === 'range' ? 'default' : 'outline'}
                    size="sm"
                    className="rounded-full font-bold text-xs"
                    onClick={() => {
                        setFilterMode('range');
                        setRangeStart(undefined);
                        setRangeEnd(undefined);
                        setRangeStep('start');
                        setCalendarOpen(true);
                    }}
                >
                    <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                    {filterMode === 'range' && rangeStart && rangeEnd
                        ? `${format(rangeStart, 'dd MMM')} — ${format(rangeEnd, 'dd MMM')}`
                        : 'Date Range'}
                </Button>

                {/* Active filter indicator */}
                {filterMode !== 'all' && (
                    <Badge variant="secondary" className="rounded-full font-bold text-xs px-3 py-1 gap-1.5 bg-primary/10 text-primary border-primary/20">
                        {filterLabel}
                        <button onClick={clearFilter} className="ml-1 hover:bg-primary/20 rounded-full p-0.5">
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                )}
            </section>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {statCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Card key={card.title} className="border-border bg-card shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                                    <Icon className="h-4 w-4" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="truncate text-2xl font-bold text-foreground">{card.value}</div>
                                <p className="mt-2 flex min-h-5 items-center text-xs text-muted-foreground">
                                    {card.growth !== null ? (
                                        <>
                                            {card.growth > 0 ? (
                                                <ArrowUpRight className="mr-1 h-4 w-4 text-green-600" />
                                            ) : (
                                                <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
                                            )}
                                            <span className={card.growth > 0 ? "text-green-600" : "text-red-500"}>
                                                {Math.abs(card.growth)}%
                                            </span>
                                            <span className="ml-1">vs last {card.label}</span>
                                        </>
                                    ) : filterMode !== 'all' ? (
                                        <span className="text-muted-foreground/60 italic">Filtered view</span>
                                    ) : (
                                        <span>No comparison data</span>
                                    )}
                                </p>
                            </CardContent>
                        </Card>
                    );
                })}

                {/* Today's Revenue Widget — always visible */}
                <Card className="border-emerald-200 dark:border-emerald-800/50 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-card shadow-sm overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Today's Revenue</CardTitle>
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                            <TrendingUp className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="truncate text-2xl font-black text-emerald-800 dark:text-emerald-300 tabular-nums">
                            {formatCurrency(stats.todayRevenue)}
                        </div>
                        <p className="mt-2 flex items-center text-xs text-emerald-600/80 dark:text-emerald-400/80 font-medium">
                            <Clock className="mr-1 h-3.5 w-3.5" />
                            {stats.todayOrderCount} order{stats.todayOrderCount !== 1 ? 's' : ''} today
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <DashboardQuickActions />

            {/* Due Today & Recent Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DashboardDueToday
                    orders={dueTodayOrders}
                    isLoading={isLoadingOrders}
                />
                <DashboardRecentOrders
                    recentOrders={recentOrders}
                    isLoading={isLoadingOrders}
                />
            </div>
        </div>
    );
}
