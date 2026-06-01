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
    // Fetch all orders (single-tenant, no franchise filtering)
    const { data: orders = [], isLoading: isLoadingOrders, isError: ordersError, refetch: refetchOrders } = useQuery({
        queryKey: ['admin-orders'],
        queryFn: () => ordersApi.getAll(),
        staleTime: 10000,
        refetchInterval: 15000,
    });

    const { data: customersResponse, isLoading: isLoadingCustomers, isError: customersError } = useQuery({
        queryKey: ['admin-customers'],
        queryFn: () => customersApi.getAll({ limit: 1000 }),
        staleTime: 10000,
    });
    const customersList = useMemo(() => customersResponse?.data || [], [customersResponse]);

    // Use the latest order date in the database as the reference "now" date.
    // This ensures that when the database has data up to May 2026 and today is June 1st,
    // the monthly preset automatically defaults to May 2026 (the active calendar month with data),
    // rendering actual, useful metrics rather than empty zeros.
    // Loop is stack-safe and ignores NaN date strings.
    const now = useMemo(() => {
        let maxTime = 0;
        for (const o of orders) {
            if (!o.createdAt) continue;
            const t = new Date(o.createdAt).getTime();
            if (!isNaN(t) && t > maxTime) {
                maxTime = t;
            }
        }
        return maxTime > 0 ? new Date(maxTime) : new Date();
    }, [orders]);

    // Calculate stats from calendar month, last 30 days, and same day last month
    const stats = useMemo(() => {
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

        // Filter orders inside the current calendar month (startOfThisMonth to todayEnd)
        const periodOrders = allActiveOrders.filter((o: any) => {
            const d = new Date(o.createdAt || now);
            return d >= startOfThisMonth && d <= todayEnd;
        });

        const periodRevenue = periodOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || 0), 0);
        const periodOrdersCount = periodOrders.length;
        const periodActiveCustomers = new Set(periodOrders.map((o: any) => o.customerId)).size;

        // Filter orders inside the comparison period (last30DaysStart to last30DaysEnd)
        const comparisonOrders = allActiveOrders.filter((o: any) => {
            const d = new Date(o.createdAt || now);
            return d >= last30DaysStart && d <= last30DaysEnd;
        });
        const comparisonRevenue = comparisonOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || 0), 0);
        const comparisonOrdersCount = comparisonOrders.length;
        const comparisonActiveCustomers = new Set(comparisonOrders.map((o: any) => o.customerId)).size;

        // Helper to calculate growth percentage where division by zero is handled properly
        const getGrowth = (current: number, previous: number) => {
            if (previous > 0) return ((current - previous) / previous) * 100;
            return current > 0 ? 100 : 0;
        };

        const revenueGrowth = getGrowth(periodRevenue, comparisonRevenue);
        const ordersGrowth = getGrowth(periodOrdersCount, comparisonOrdersCount);
        const customersGrowth = getGrowth(periodActiveCustomers, comparisonActiveCustomers);

        // Today's Revenue and Orders (always current day based on reference date)
        const todayOrders = allActiveOrders.filter((o: any) => new Date(o.createdAt || now) >= startOfToday);
        const todayRevenue = todayOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || 0), 0);
        const todayOrderCount = todayOrders.length;

        // Last Month Same Day Revenue
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

        // New Customers (this calendar month vs last 30 days)
        const newCustomersThisPeriod = customersList.filter((c: any) => 
            c.createdAt && new Date(c.createdAt) >= startOfThisMonth && new Date(c.createdAt) <= todayEnd
        ).length;

        const newCustomersCompPeriod = customersList.filter((c: any) => 
            c.createdAt && new Date(c.createdAt) >= last30DaysStart && new Date(c.createdAt) <= last30DaysEnd
        ).length;

        const newCustomersGrowth = getGrowth(newCustomersThisPeriod, newCustomersCompPeriod);

        return {
            totalRevenue: periodRevenue,
            revenueGrowth: parseFloat(revenueGrowth.toFixed(1)),
            revenueLabel: 'prev 30d',
            comparisonRevenue: comparisonRevenue,
            totalOrders: periodOrdersCount,
            ordersGrowth: parseFloat(ordersGrowth.toFixed(1)),
            ordersLabel: 'prev 30d',
            comparisonOrdersCount: comparisonOrdersCount,
            activeCustomers: periodActiveCustomers,
            customersGrowth: parseFloat(customersGrowth.toFixed(1)),
            customersLabel: 'prev 30d',
            newCustomers: newCustomersThisPeriod,
            newCustomersGrowth: parseFloat(newCustomersGrowth.toFixed(1)),
            newCustomersLabel: 'prev 30d',
            comparisonNewCustomers: newCustomersCompPeriod,
            todayRevenue,
            todayOrderCount,
            todayRevenueGrowth: parseFloat(todayRevenueGrowth.toFixed(1)),
            lastMonthSameDayRevenue,
        };
    }, [orders, now, customersList]);

    const dueTodayOrders: any[] = useMemo(() => {
        return orders.map((order: any) => ({
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
    }, [orders]);

    const recentOrders: any[] = useMemo(() => {
        return orders
            .slice() // Create a shallow copy before sorting to avoid side effects
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
    }, [orders]);

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
            {(ordersError || customersError) && (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive flex items-center justify-between gap-3">
                    <span>Some dashboard data failed to load. Your local view may be stale.</span>
                    <Button variant="outline" size="sm" onClick={() => refetchOrders()}>Retry</Button>
                </div>
            )}
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
                            <p className="mt-1 font-semibold text-foreground">Every 15s</p>
                        </div>
                        <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Orders</p>
                            <p className="mt-1 font-semibold text-foreground">{orders.length}</p>
                        </div>
                        <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Customers</p>
                            <p className="mt-1 font-semibold text-foreground">{customersList.length}</p>
                        </div>
                    </div>
                </div>
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
