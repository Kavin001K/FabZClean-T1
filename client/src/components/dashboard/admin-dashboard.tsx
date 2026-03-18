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
        queryFn: () => ordersApi.getAll()
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

    return (
        <div className="p-3 sm:p-4 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 gradient-mesh min-h-screen">
            {/* Header */}
            <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent flex items-center gap-2">
                    <span className="truncate">Dashboard</span>
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                    Overview of FabZClean POS operations
                </p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <Card className="glass hover:shadow-lg transition-all duration-300 border-t-primary/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl sm:text-2xl font-bold truncate">{formatCurrency(stats.totalRevenue)}</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1 h-5">
                            {stats.revenueGrowth !== null ? (
                                <>
                                    {stats.revenueGrowth > 0 ? (
                                        <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                                    ) : (
                                        <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                                    )}
                                    <span className={stats.revenueGrowth > 0 ? "text-green-500" : "text-red-500"}>
                                        {Math.abs(stats.revenueGrowth)}%
                                    </span>
                                    <span className="ml-1 hidden sm:inline">from last {stats.revenueLabel}</span>
                                </>
                            ) : (
                                <span className="text-muted-foreground italic">No comparison data</span>
                            )}
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass hover:shadow-lg transition-all duration-300 border-t-accent/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl sm:text-2xl font-bold">{stats.totalOrders}</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1 h-5">
                            {stats.ordersGrowth !== null ? (
                                <>
                                    {stats.ordersGrowth > 0 ? (
                                        <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                                    ) : (
                                        <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                                    )}
                                    <span className={stats.ordersGrowth > 0 ? "text-green-500" : "text-red-500"}>
                                        {Math.abs(stats.ordersGrowth)}%
                                    </span>
                                    <span className="ml-1 hidden sm:inline">from last {stats.ordersLabel}</span>
                                </>
                            ) : (
                                <span className="text-muted-foreground italic">No comparison data</span>
                            )}
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass hover:shadow-lg transition-all duration-300 border-t-blue-500/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl sm:text-2xl font-bold">{stats.activeCustomers}</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1 h-5">
                            {stats.customersGrowth !== null ? (
                                <>
                                    {stats.customersGrowth > 0 ? (
                                        <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                                    ) : (
                                        <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                                    )}
                                    <span className={stats.customersGrowth > 0 ? "text-green-500" : "text-red-500"}>
                                        {Math.abs(stats.customersGrowth)}%
                                    </span>
                                    <span className="ml-1 hidden sm:inline">from last {stats.customersLabel}</span>
                                </>
                            ) : (
                                <span className="text-muted-foreground italic">No comparison data</span>
                            )}
                        </p>
                    </CardContent>
                </Card>

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
