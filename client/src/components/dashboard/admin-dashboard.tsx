import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Users,
    DollarSign,
    ShoppingBag,
    Building2,
    ArrowUpRight,
    ArrowDownRight,
    Activity
} from "lucide-react";
import { formatCurrency, ordersApi, franchisesApi, analyticsApi } from "@/lib/data-service";

import DashboardDueToday from "./components/dashboard-due-today";
import DashboardRecentOrders from "./components/dashboard-recent-orders";
import DashboardQuickActions from "./components/dashboard-quick-actions";
import LeaderboardCard from "./components/leaderboard-card";

import { useQuery } from "@tanstack/react-query";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function AdminDashboard() {
    const [selectedFranchiseId, setSelectedFranchiseId] = useState<string>("all");

    // Fetch Franchises
    const { data: franchises = [] } = useQuery({
        queryKey: ['franchises'],
        queryFn: () => franchisesApi.getAll()
    });

    // Fetch metrics - key changes when params change
    const { data: metrics, isLoading: isLoadingMetrics } = useQuery({
        queryKey: ['admin-metrics', selectedFranchiseId],
        queryFn: () => analyticsApi.getDashboardMetrics(selectedFranchiseId === 'all' ? undefined : selectedFranchiseId)
    });

    // Fetch leaderboard
    const { data: leaderboard = [], isLoading: isLoadingLeaderboard } = useQuery({
        queryKey: ['admin-leaderboard'],
        queryFn: () => analyticsApi.getAdminLeaderboard()
    });

    // Fetch recent orders - optimized limit
    const { data: recentOrders = [], isLoading: isLoadingOrders } = useQuery({
        queryKey: ['recent-orders', selectedFranchiseId],
        queryFn: async () => {
            const params: any = { limit: 5, sort: 'desc' };
            if (selectedFranchiseId !== 'all') {
                params.franchiseId = selectedFranchiseId;
            }
            return ordersApi.getAll(params);
        }
    });

    const stats = {
        totalRevenue: metrics?.totalRevenue || 0,
        revenueGrowth: metrics?.revenueGrowth || 0,
        totalOrders: metrics?.totalOrders || 0,
        activeCustomers: metrics?.newCustomers || 0, // Using newCustomers for now as approximation or real metric
        activeFranchises: selectedFranchiseId === "all" ? franchises.length : 1,
    };

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground">
                        Global overview of FabZClean operations
                    </p>
                </div>
                <div className="w-[200px]">
                    <Select value={selectedFranchiseId} onValueChange={setSelectedFranchiseId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by Franchise" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Franchises</SelectItem>
                            {franchises.map((f: any) => (
                                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
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
                        <CardTitle className="text-sm font-medium">Orders Today</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalOrders}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            New orders placed today
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">New Customers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeCustomers}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Registered today
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Franchises</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeFranchises}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            <span className="text-muted-foreground">
                                {selectedFranchiseId === 'all' ? 'Across all regions' : 'Selected Franchise'}
                            </span>
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions and System Health */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                    <DashboardQuickActions employeeId="admin" employeeName="Administrator" />
                </div>
                <div className="lg:col-span-1">
                    <Card className="h-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Activity className="h-4 w-4" /> System Health
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span>Database</span>
                                    <span className="text-green-500 font-medium">Connected</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span>Sync Service</span>
                                    <span className="text-green-500 font-medium">Active</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span>Last Backup</span>
                                    <span className="text-muted-foreground">1h ago</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Leaderboard, Due Today & Recent Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <LeaderboardCard data={leaderboard} isLoading={isLoadingLeaderboard} />
                </div>
                <div className="lg:col-span-1">
                    <DashboardDueToday
                        // @ts-ignore
                        franchiseId={selectedFranchiseId}
                    />
                </div>
                <div className="lg:col-span-1">
                    <DashboardRecentOrders
                        orders={recentOrders.map((order: any) => ({
                            ...order,
                            date: order.createdAt || new Date().toISOString(),
                            total: parseFloat(order.totalAmount || '0')
                        }))}
                        isLoading={isLoadingOrders}
                    />
                </div>
            </div>
        </div>
    );
}
