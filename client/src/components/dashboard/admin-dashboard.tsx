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
import DashboardOrdersByDate from "./components/orders-by-date";
import DashboardNewCustomers from "./components/new-customers";
import { format, startOfDay, endOfDay, isWithinInterval, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";

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
                    variant={filterMode === 'all' ? 'pills' : 'outline'}
                    size="sm"
                    className="h-10 rounded-xl px-5 font-bold text-xs shadow-sm transition-all hover:scale-105"
                    onClick={clearFilter}
                >
                    All Time
                </Button>
                <Button
                    variant={filterMode === 'today' ? 'pills' : 'outline'}
                    size="sm"
                    className="h-10 rounded-xl px-5 font-bold text-xs shadow-sm transition-all hover:scale-105"
                    onClick={() => {
                        setFilterMode('today');
                        setSelectedDate(new Date());
                    }}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Today
                </Button>

                {/* Date Picker */}
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant={filterMode === 'date' ? 'pills' : 'outline'}
                            size="sm"
                            className="h-10 rounded-xl px-5 font-bold text-xs shadow-sm transition-all hover:scale-105"
                            onClick={() => {
                                setFilterMode('date');
                                setCalendarOpen(true);
                            }}
                        >
                            <CalendarDays className="mr-2 h-4 w-4" />
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
                    variant={filterMode === 'range' ? 'pills' : 'outline'}
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
                                            "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all",
                                            card.growth > 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                                        )}>
                                            {card.growth > 0 ? (
                                                <ArrowUpRight className="h-3 w-3" />
                                            ) : (
                                                <ArrowDownRight className="h-3 w-3" />
                                            )}
                                            {Math.abs(card.growth)}%
                                            <span className="text-muted-foreground/60 font-medium">vs last {card.label}</span>
                                        </div>
                                    ) : filterMode !== 'all' ? (
                                        <Badge variant="outline" className="text-[9px] h-5 border-border/50 font-bold uppercase tracking-tight text-muted-foreground/60">Filtered view</Badge>
                                    ) : (
                                        <span className="text-[10px] text-muted-foreground/40 font-medium">No comparison data</span>
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
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:auto-rows-fr xl:grid-cols-3">
                <DashboardOrdersByDate />
                <DashboardDueToday
                    orders={dueTodayOrders}
                    isLoading={isLoadingOrders}
                />
                <DashboardRecentOrders
                    recentOrders={recentOrders}
                    isLoading={isLoadingOrders}
                />
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
