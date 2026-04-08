import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Users,
    IndianRupee,
    ShoppingBag,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";
import { formatCurrency } from "@/lib/data";
import { ordersApi } from "@/lib/data-service";
import DashboardDueToday from "./components/dashboard-due-today";
import DashboardRecentOrders from "./components/dashboard-recent-orders";
import DashboardQuickActions from "./components/dashboard-quick-actions";
import WeatherWidget from "./components/weather-widget";

import { useQuery } from "@tanstack/react-query";

export default function AdminDashboard() {
    // Fetch all orders (single-tenant, no franchise filtering)
    const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
        queryKey: ['admin-orders'],
        queryFn: () => ordersApi.getAll(),
        staleTime: 5000,
        refetchInterval: 5000, // Background auto-sync 5s
    });

    // Calculate stats
    const stats = useMemo(() => {
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const startOfThisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const startOfLastWeek = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

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

        const totalRevenue = orders.reduce((sum: number, order: any) => sum + parseFloat(order.totalAmount || 0), 0);
        const totalOrders = orders.length;
        const activeCustomers = new Set(orders.map((o: any) => o.customerId)).size;

        const getGrowth = (current: number, month: number, week: number, yesterday: number) => {
            if (month > 0) return { val: ((current - month) / month) * 100, label: 'month' };
            if (week > 0) return { val: ((current - week) / week) * 100, label: 'week' };
            if (yesterday > 0) return { val: ((current - yesterday) / yesterday) * 100, label: 'yesterday' };
            return { val: null, label: null };
        };

        // Revenue Growth
        const thisMonthRevenue = thisMonthOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || 0), 0);
        const lastMonthRevenue = lastMonthOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || 0), 0);
        const thisWeekRevenue = thisWeekOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || 0), 0);
        const lastWeekRevenue = lastWeekOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || 0), 0);
        const todayRevenue = todayOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || 0), 0);
        const yesterdayRevenue = yesterdayOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || 0), 0);

        const revGrowth = getGrowth(thisMonthRevenue, lastMonthRevenue, lastWeekRevenue, yesterdayRevenue);

        // Orders Growth
        const ordGrowth = getGrowth(thisMonthOrders.length, lastMonthOrders.length, lastWeekOrders.length, yesterdayOrders.length);

        // Customers Growth
        const activeThisMonth = new Set(thisMonthOrders.map((o: any) => o.customerId)).size;
        const activeLastMonth = new Set(lastMonthOrders.map((o: any) => o.customerId)).size;
        const activeThisWeek = new Set(thisWeekOrders.map((o: any) => o.customerId)).size;
        const activeLastWeek = new Set(lastWeekOrders.map((o: any) => o.customerId)).size;
        const activeToday = new Set(todayOrders.map((o: any) => o.customerId)).size;
        const activeYesterday = new Set(yesterdayOrders.map((o: any) => o.customerId)).size;

        const custGrowth = getGrowth(activeThisMonth, activeLastMonth, activeLastWeek, activeYesterday);

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
        };
    }, [orders]);

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
    }, [orders]);

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
                                    ) : (
                                        <span>No comparison data</span>
                                    )}
                                </p>
                            </CardContent>
                        </Card>
                    );
                })}
                <WeatherWidget />
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
