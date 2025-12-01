
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Users,
    DollarSign,
    ShoppingBag,
    Activity,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";
import { formatCurrency } from "@/lib/data";
import { DashboardDueToday } from "./components/dashboard-due-today";
import { DashboardRecentOrders } from "./components/dashboard-recent-orders";
import { useQuery } from "@tanstack/react-query";

export default function AdminDashboard() {
    // Mock data for Admin Dashboard - in a real app this would come from an API
    // that aggregates data across all franchises
    const { data: stats } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            // Simulate API call
            return {
                totalRevenue: 450000,
                revenueGrowth: 12.5,
                totalOrders: 1250,
                ordersGrowth: 8.2,
                activeCustomers: 3200,
                customersGrowth: 5.4,
                activeFranchises: 12,
                franchiseGrowth: 0
            };
        },
        initialData: {
            totalRevenue: 450000,
            revenueGrowth: 12.5,
            totalOrders: 1250,
            ordersGrowth: 8.2,
            activeCustomers: 3200,
            customersGrowth: 5.4,
            activeFranchises: 12,
            franchiseGrowth: 0
        }
    });

    // Fetch orders for the widgets
    const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
        queryKey: ['admin-orders'],
        queryFn: async () => {
            const response = await fetch('/api/orders');
            if (!response.ok) throw new Error('Failed to fetch orders');
            return response.json();
        }
    });

    const dueTodayOrders = orders.filter((order: any) => {
        if (!order.pickupDate && !order.deliveryDate) return false;
        const date = new Date(order.pickupDate || order.deliveryDate);
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    });

    const recentOrders = [...orders].sort((a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, 5);

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground">
                    Global overview of FabZClean operations
                </p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                            {stats.revenueGrowth > 0 ? (
                                <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                            ) : (
                                <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                            )}
                            <span className={stats.revenueGrowth > 0 ? "text-green-500" : "text-red-500"}>
                                {Math.abs(stats.revenueGrowth)}%
                            </span>
                            <span className="ml-1">from last month</span>
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalOrders}</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                            {stats.ordersGrowth > 0 ? (
                                <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                            ) : (
                                <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                            )}
                            <span className={stats.ordersGrowth > 0 ? "text-green-500" : "text-red-500"}>
                                {Math.abs(stats.ordersGrowth)}%
                            </span>
                            <span className="ml-1">from last month</span>
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeCustomers}</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                            {stats.customersGrowth > 0 ? (
                                <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                            ) : (
                                <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                            )}
                            <span className={stats.customersGrowth > 0 ? "text-green-500" : "text-red-500"}>
                                {Math.abs(stats.customersGrowth)}%
                            </span>
                            <span className="ml-1">from last month</span>
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Franchises</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeFranchises}</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                            <span className="text-muted-foreground">Stable</span>
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Due Today & Recent Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DashboardDueToday
                    dueTodayOrders={dueTodayOrders}
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
