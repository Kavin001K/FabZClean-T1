
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Users,
    DollarSign,
    ShoppingBag,
    Activity,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Building2
} from "lucide-react";
import { formatCurrency } from "@/lib/data";
import { DashboardDueToday } from "./components/dashboard-due-today";
import { DashboardRecentOrders } from "./components/dashboard-recent-orders";
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
        queryFn: async () => {
            const res = await fetch('/api/franchises');
            if (!res.ok) return [];
            return res.json();
        }
    });

    // Fetch orders
    const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
        queryKey: ['admin-orders'],
        queryFn: async () => {
            const response = await fetch('/api/orders');
            if (!response.ok) throw new Error('Failed to fetch orders');
            return response.json();
        }
    });

    // Filter orders based on selected franchise
    const filteredOrders = useMemo(() => {
        if (selectedFranchiseId === "all") return orders;
        return orders.filter((order: any) => order.franchiseId === selectedFranchiseId);
    }, [orders, selectedFranchiseId]);

    // Calculate stats based on filtered orders
    const stats = useMemo(() => {
        const totalRevenue = filteredOrders.reduce((sum: number, order: any) => sum + parseFloat(order.totalAmount || 0), 0);
        const totalOrders = filteredOrders.length;
        const activeCustomers = new Set(filteredOrders.map((o: any) => o.customerId)).size;

        return {
            totalRevenue,
            revenueGrowth: 12.5, // Mock growth for now
            totalOrders,
            ordersGrowth: 8.2,
            activeCustomers,
            customersGrowth: 5.4,
            activeFranchises: selectedFranchiseId === "all" ? franchises.length : 1,
            franchiseGrowth: 0
        };
    }, [filteredOrders, franchises.length, selectedFranchiseId]);

    const dueTodayOrders = filteredOrders.filter((order: any) => {
        if (!order.pickupDate && !order.deliveryDate) return false;
        const date = new Date(order.pickupDate || order.deliveryDate);
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    });

    const recentOrders = [...filteredOrders].sort((a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, 5);

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
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeFranchises}</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                            <span className="text-muted-foreground">
                                {selectedFranchiseId === 'all' ? 'Across all regions' : 'Selected Franchise'}
                            </span>
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
