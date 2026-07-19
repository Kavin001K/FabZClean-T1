import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
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
    const [filterMode, setFilterMode] = useState<FilterMode>('preset');
    const [presetPeriod, setPresetPeriod] = useState<PresetPeriod>('month');
    const [isFilterActive, setIsFilterActive] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [rangeStart, setRangeStart] = useState<Date | undefined>(undefined);
    const [rangeEnd, setRangeEnd] = useState<Date | undefined>(undefined);
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [rangeStep, setRangeStep] = useState<'start' | 'end'>('start');
    const [activeDetailsDialog, setActiveDetailsDialog] = useState<'revenue' | 'orders' | 'customers' | 'today-revenue' | null>(null);

    const effectiveFilterMode = isFilterActive ? filterMode : 'preset';
    const effectivePresetPeriod = isFilterActive ? presetPeriod : 'month';

    const minDate = useMemo(() => {
        const reference = new Date();
        if (effectiveFilterMode === 'all') return undefined;
        
        if (effectiveFilterMode === 'preset') {
            if (effectivePresetPeriod === 'day') {
                return startOfDay(subDays(reference, 1));
            } else if (effectivePresetPeriod === 'week') {
                return startOfDay(subDays(reference, 13));
            } else if (effectivePresetPeriod === 'fortnight') {
                return startOfDay(subDays(reference, 27));
            } else if (effectivePresetPeriod === 'month') {
                return startOfMonth(subDays(reference, 30));
            } else if (effectivePresetPeriod === 'quarter') {
                return startOfQuarter(subDays(reference, 90));
            } else if (effectivePresetPeriod === 'year') {
                return startOfYear(subDays(reference, 365));
            }
        }
        
        if (effectiveFilterMode === 'date' && selectedDate) {
            return startOfDay(subDays(selectedDate, 1));
        }
        
        if (effectiveFilterMode === 'range' && rangeStart && rangeEnd) {
            const start = startOfDay(rangeStart);
            const end = endOfDay(rangeEnd);
            const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
            return startOfDay(subDays(start, diffDays));
        }
        
        return startOfMonth(subDays(reference, 30));
    }, [effectiveFilterMode, effectivePresetPeriod, selectedDate, rangeStart, rangeEnd]);

    const dateFromParam = minDate ? minDate.toISOString() : undefined;

    // Fetch all orders (single-tenant, no franchise filtering)
    const { data: orders = [], isLoading: isLoadingOrders, isError: ordersError, refetch: refetchOrders } = useQuery({
        queryKey: ['admin-orders', dateFromParam],
        queryFn: () => ordersApi.getAll(dateFromParam ? { dateFrom: dateFromParam } : {}),
        staleTime: 10000,
        refetchInterval: 15000,
    });

    const { data: customersResponse, isLoading: isLoadingCustomers, isError: customersError } = useQuery({
        queryKey: ['admin-customers', dateFromParam],
        queryFn: () => customersApi.getAll({ 
            limit: 1000, 
            ...(dateFromParam ? { dateFrom: dateFromParam } : {}) 
        }),
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

    const filteredOrders = useMemo(() => {
        if (effectiveFilterMode === 'all') return orders;

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
    }, [orders, now, effectiveFilterMode, effectivePresetPeriod, selectedDate, rangeStart, rangeEnd]);

    const stats = useMemo(() => {
        const startOfThisMonth = startOfMonth(now);
        const last30DaysStart = subDays(startOfThisMonth, 30);
        const last30DaysEnd = startOfThisMonth;
        const startOfToday = startOfDay(now);
        const todayEnd = endOfDay(now);

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

        const periodOrders = allActiveOrders.filter((o: any) => {
            if (!start || !end) return true;
            const d = new Date(o.createdAt || now);
            return d >= start && d <= end;
        });

        const periodRevenue = periodOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || 0), 0);
        const periodOrdersCount = periodOrders.length;
        const periodActiveCustomers = new Set(periodOrders.map((o: any) => o.customerId)).size;

        let comparisonOrdersCount = 0;
        let comparisonRevenue = 0;
        let comparisonActiveCustomers = 0;

        if (compStart && compEnd) {
            const comparisonOrders = allActiveOrders.filter((o: any) => {
                const d = new Date(o.createdAt || now);
                return d >= compStart! && d <= compEnd!;
            });
            comparisonRevenue = comparisonOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || 0), 0);
            comparisonOrdersCount = comparisonOrders.length;
            comparisonActiveCustomers = new Set(comparisonOrders.map((o: any) => o.customerId)).size;
        }

        const getGrowth = (current: number, previous: number) => {
            if (previous > 0) return ((current - previous) / previous) * 100;
            return current > 0 ? 100 : 0;
        };

        const revenueGrowth = getGrowth(periodRevenue, comparisonRevenue);
        const ordersGrowth = getGrowth(periodOrdersCount, comparisonOrdersCount);
        const customersGrowth = getGrowth(periodActiveCustomers, comparisonActiveCustomers);

        const todayOrders = allActiveOrders.filter((o: any) => new Date(o.createdAt || now) >= startOfToday);
        const todayRevenue = todayOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || 0), 0);
        const todayOrderCount = todayOrders.length;

        const lastMonthSameDay = new Date(now);
        lastMonthSameDay.setMonth(now.getMonth() - 1);
        if (lastMonthSameDay.getDate() !== now.getDate()) {
            lastMonthSameDay.setDate(0);
        }
        const lmsdStart = startOfDay(lastMonthSameDay);
        const lmsdEnd = endOfDay(lastMonthSameDay);
        const lastMonthSameDayOrders = allActiveOrders.filter((o: any) => {
            const d = new Date(o.createdAt || now);
            return d >= lmsdStart && d <= lmsdEnd;
        });
        const lastMonthSameDayRevenue = lastMonthSameDayOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || 0), 0);
        const todayRevenueGrowth = getGrowth(todayRevenue, lastMonthSameDayRevenue);

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

        // Calculate Operational On-time Readiness
        let totalEvaluated = 0;
        let totalOnTime = 0;
        let totalDelayed = 0;
        let totalDelayMs = 0;

        for (const o of filteredOrders) {
            if (!o.pickupDate) continue;
            
            const expectedTime = new Date(o.pickupDate).getTime();
            const status = String(o.status || '').toLowerCase();
            const isReadyState = ['completed', 'delivered', 'ready_for_pickup', 'ready_for_delivery'].includes(status);
            
            if (isReadyState) {
                // Find actual ready time
                const readyTimeStr = (o.statusTimestamps as any)?.ready_for_pickup || (o.statusTimestamps as any)?.ready_for_delivery || o.deliveredAt || o.updatedAt || o.createdAt;
                const readyTime = new Date(readyTimeStr).getTime();
                
                totalEvaluated++;
                if (readyTime <= expectedTime) {
                    totalOnTime++;
                } else {
                    totalDelayed++;
                    totalDelayMs += (readyTime - expectedTime);
                }
            } else if (status !== 'cancelled' && status !== 'refunded' && status !== 'deleted') {
                // Overdue pending/processing orders
                const nowTime = now.getTime();
                if (nowTime > expectedTime) {
                    totalEvaluated++;
                    totalDelayed++;
                    totalDelayMs += (nowTime - expectedTime);
                }
            }
        }

        const readinessRate = totalEvaluated > 0 ? Math.round((totalOnTime / totalEvaluated) * 100) : 100;
        const avgDelayHours = totalDelayed > 0 ? Math.round(totalDelayMs / (1000 * 60 * 60 * totalDelayed)) : 0;
        const avgDelayStr = avgDelayHours >= 24 
            ? `${Math.round(avgDelayHours / 24)}d` 
            : `${avgDelayHours}h`;

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
            readinessRate,
            avgDelayStr,
            onTimeCount: totalOnTime,
            delayedCount: totalDelayed,
            totalEvaluated
        };
    }, [orders, now, customersList, effectiveFilterMode, effectivePresetPeriod, selectedDate, rangeStart, rangeEnd]);

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
            .slice() // Create a shallow copy before sorting to avoid side effects
            .sort((a: any, b: any) => (b.orderNumber || '').localeCompare(a.orderNumber || ''))
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

    const paymentBreakdown = useMemo(() => {
        let cash = 0;
        let upi = 0;
        let wallet = 0;
        let credit = 0;
        filteredOrders.forEach((o: any) => {
            const status = String(o.status || '').toLowerCase();
            if (status === 'cancelled' || status === 'refunded' || status === 'deleted') return;
            const pm = String(o.paymentMethod || o.payment_method || '').toLowerCase();
            const total = parseFloat(o.totalAmount || o.total_amount || 0);
            
            const wUsed = parseFloat(o.walletUsed || o.wallet_used || 0);
            const cUsed = parseFloat(o.creditUsed || o.credit_used || 0);
            
            wallet += wUsed;
            credit += cUsed;
            
            const cashOrUpiApplied = total - wUsed - cUsed;
            if (cashOrUpiApplied > 0) {
                if (pm === 'upi') {
                    upi += cashOrUpiApplied;
                } else {
                    cash += cashOrUpiApplied;
                }
            }
        });
        return { cash, upi, wallet, credit };
    }, [filteredOrders]);

    const delayedOrders = useMemo(() => {
        return filteredOrders.filter((o: any) => {
            if (!o.pickupDate) return false;
            const expectedTime = new Date(o.pickupDate).getTime();
            const status = String(o.status || '').toLowerCase();
            const isReadyState = ['completed', 'delivered', 'ready_for_pickup', 'ready_for_delivery'].includes(status);
            
            if (isReadyState) {
                const readyTimeStr = (o.statusTimestamps as any)?.ready_for_pickup || (o.statusTimestamps as any)?.ready_for_delivery || o.deliveredAt || o.updatedAt || o.createdAt;
                const readyTime = new Date(readyTimeStr).getTime();
                return readyTime > expectedTime;
            } else if (status !== 'cancelled' && status !== 'refunded' && status !== 'deleted') {
                const nowTime = now.getTime();
                return nowTime > expectedTime;
            }
            return false;
        });
    }, [filteredOrders, now]);

    const newCustomersList = useMemo(() => {
        if (effectiveFilterMode === 'all') return customersList;
        
        let start: Date | null = null;
        let end: Date | null = null;
        const todayStart = startOfDay(now);
        const todayEnd = endOfDay(now);
        
        if (effectiveFilterMode === 'preset') {
            start = todayStart;
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
            end = todayEnd;
        } else if (effectiveFilterMode === 'date' && selectedDate) {
            start = startOfDay(selectedDate);
            end = endOfDay(selectedDate);
        } else if (effectiveFilterMode === 'range' && rangeStart && rangeEnd) {
            start = startOfDay(rangeStart);
            end = endOfDay(rangeEnd);
        }
        
        if (!start || !end) return customersList;
        
        return customersList.filter((c: any) => {
            if (!c.createdAt) return false;
            const d = new Date(c.createdAt);
            return d >= start! && d <= end!;
        });
    }, [customersList, now, effectiveFilterMode, effectivePresetPeriod, selectedDate, rangeStart, rangeEnd]);

    const todayOrders = useMemo(() => {
        const startOfToday = startOfDay(now);
        return orders.filter((o: any) => {
            const status = String(o.status || '').toLowerCase();
            if (status === 'cancelled' || status === 'refunded' || status === 'deleted') return false;
            return new Date(o.createdAt || now) >= startOfToday;
        });
    }, [orders, now]);

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
        }
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
                            disabled={(date) => date > endOfDay(now)}
                            initialFocus
                            className="rounded-b-2xl"
                        />
                    </PopoverContent>
                </Popover>

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

                {isFilterActive && (
                    <Badge variant="secondary" className="rounded-full font-bold text-xs px-3 py-1 gap-1.5 bg-primary/10 text-primary border-primary/20">
                        {filterLabel}
                        <button onClick={clearFilter} className="ml-1 hover:bg-primary/20 rounded-full p-0.5" type="button" aria-label="Clear filter">
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
                        <Card 
                            key={card.title} 
                            className="group border-border bg-card shadow-sm rounded-2xl transition-all hover:shadow-md hover:border-border/80 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                            onClick={() => {
                                if (card.title === 'Revenue') setActiveDetailsDialog('revenue');
                                else if (card.title === 'Orders') setActiveDetailsDialog('orders');
                                else if (card.title === 'New Customers') setActiveDetailsDialog('customers');
                            }}
                        >
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
                <Card 
                    className="group border-emerald-200 dark:border-emerald-800/30 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/10 dark:to-card shadow-sm overflow-hidden rounded-2xl transition-all hover:shadow-md cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                    onClick={() => setActiveDetailsDialog('today-revenue')}
                >
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

            {/* On-Time Operational Readiness Chart & Analysis */}
            <Card className="border-border bg-card shadow-sm rounded-2xl p-6">
                <CardHeader className="pb-3 border-b border-border/50">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Operational On-Time Readiness
                    </CardTitle>
                    <CardDescription>
                        Detailed analysis of expected vs actual delivery time for the selected period ({filterLabel}).
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                        {/* Donut Chart */}
                        <div className="md:col-span-5 flex flex-col items-center justify-center relative min-h-[220px]">
                            {stats.totalEvaluated === 0 ? (
                                <div className="text-sm text-muted-foreground py-10">No orders evaluated in this period.</div>
                            ) : (
                                <>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'On-Time', value: stats.onTimeCount, color: '#10b981' },
                                                    { name: 'Delayed', value: stats.delayedCount, color: '#ef4444' }
                                                ]}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                <Cell fill="#10b981" />
                                                <Cell fill="#ef4444" />
                                            </Pie>
                                            <Tooltip 
                                                formatter={(value) => [`${value} order(s)`, 'Count']}
                                                contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#1e293b', color: '#fff' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute flex flex-col items-center justify-center">
                                        <span className="text-3xl font-black text-foreground">{stats.readinessRate}%</span>
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Readiness</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Metrics & Details */}
                        <div className="md:col-span-7 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl border bg-muted/30">
                                    <div className="text-xs text-muted-foreground uppercase font-bold">On-Time Deliveries</div>
                                    <div className="text-2xl font-black text-emerald-500 mt-1">{stats.onTimeCount}</div>
                                    <div className="text-[10px] text-muted-foreground/60 mt-1">Ready by expected date</div>
                                </div>
                                <div className="p-4 rounded-xl border bg-muted/30">
                                    <div className="text-xs text-muted-foreground uppercase font-bold">Delayed Orders</div>
                                    <div className="text-2xl font-black text-red-500 mt-1">{stats.delayedCount}</div>
                                    <div className="text-[10px] text-muted-foreground/60 mt-1">Exceeded expected date</div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-foreground">Interactive Analysis Details</h3>
                                <ul className="space-y-2 text-xs">
                                    <li className="flex justify-between items-center py-1.5 border-b border-border/40">
                                        <span className="text-muted-foreground">Total Evaluated Orders:</span>
                                        <span className="font-semibold text-foreground">{stats.totalEvaluated}</span>
                                    </li>
                                    <li className="flex justify-between items-center py-1.5 border-b border-border/40">
                                        <span className="text-muted-foreground">Average Delay Duration:</span>
                                        <span className="font-semibold text-foreground">{stats.avgDelayStr}</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Delayed Orders List */}
                            {delayedOrders.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-sm font-bold text-foreground">Overdue / Delayed Orders List</h3>
                                        <Badge variant="outline" className="text-red-500 bg-red-500/5 border-red-500/20 font-bold">{delayedOrders.length} total</Badge>
                                    </div>
                                    <ScrollArea className="h-[120px] rounded-xl border border-border/60 p-2">
                                        <div className="space-y-2">
                                            {delayedOrders.map((o: any) => {
                                                const expected = new Date(o.pickupDate).getTime();
                                                const readyTimeStr = (o.statusTimestamps as any)?.ready_for_pickup || (o.statusTimestamps as any)?.ready_for_delivery || o.deliveredAt || o.updatedAt || o.createdAt;
                                                const actual = new Date(readyTimeStr).getTime();
                                                const diff = actual - expected;
                                                const delayHours = diff > 0 ? Math.round(diff / (1000 * 60 * 60)) : 0;
                                                const delayStr = delayHours >= 24 ? `${Math.round(delayHours / 24)}d` : `${delayHours}h`;

                                                return (
                                                    <div key={o.id} className="flex justify-between items-center p-2 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors text-xs">
                                                        <div>
                                                            <span className="font-bold text-primary hover:underline cursor-pointer" onClick={() => window.location.href = `/orders?id=${o.id}`}>{o.orderNumber}</span>
                                                            <span className="text-muted-foreground ml-2">({o.customerName})</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="secondary" className="text-[10px] uppercase font-bold">{o.status}</Badge>
                                                            <Badge variant="destructive" className="text-[10px] font-bold">+{delayStr} delay</Badge>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </ScrollArea>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Customer growth insight */}
            <div className="grid grid-cols-1 gap-6 2xl:auto-rows-fr 2xl:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.35fr)]">
                <div className="h-full">
                    <DashboardNewCustomers />
                </div>
                <div className="h-full">
                    <WeatherWidget />
                </div>
            </div>

            {/* Interactive Details Dialog */}
            <Dialog open={activeDetailsDialog !== null} onOpenChange={(open) => !open && setActiveDetailsDialog(null)}>
                <DialogContent className="max-w-2xl bg-card border-border rounded-2xl shadow-2xl p-6">
                    <DialogHeader className="pb-3 border-b border-border/50">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                            {activeDetailsDialog === 'revenue' && <IndianRupee className="h-5 w-5 text-emerald-500" />}
                            {activeDetailsDialog === 'orders' && <ShoppingBag className="h-5 w-5 text-blue-500" />}
                            {activeDetailsDialog === 'customers' && <UserPlus className="h-5 w-5 text-indigo-500" />}
                            {activeDetailsDialog === 'today-revenue' && <TrendingUp className="h-5 w-5 text-emerald-500" />}
                            <span>
                                {activeDetailsDialog === 'revenue' && 'Revenue Breakdown'}
                                {activeDetailsDialog === 'orders' && 'Orders Listing'}
                                {activeDetailsDialog === 'customers' && 'New Registrations'}
                                {activeDetailsDialog === 'today-revenue' && "Today's Sales & Orders"}
                            </span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground mt-1">
                            Showing details for the selected period: <span className="font-bold text-foreground">{filterLabel}</span>
                        </DialogDescription>
                    </DialogHeader>

                    {activeDetailsDialog === 'revenue' && (
                        <div className="space-y-6 pt-4">
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                <div className="p-4 rounded-xl border bg-muted/20">
                                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Cash Share</div>
                                    <div className="text-lg font-black text-foreground mt-1">{formatCurrency(paymentBreakdown.cash)}</div>
                                </div>
                                <div className="p-4 rounded-xl border bg-muted/20">
                                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">UPI Share</div>
                                    <div className="text-lg font-black text-foreground mt-1">{formatCurrency(paymentBreakdown.upi)}</div>
                                </div>
                                <div className="p-4 rounded-xl border bg-muted/20">
                                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Wallet Share</div>
                                    <div className="text-lg font-black text-foreground mt-1">{formatCurrency(paymentBreakdown.wallet)}</div>
                                </div>
                                <div className="p-4 rounded-xl border bg-muted/20">
                                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Credit Share</div>
                                    <div className="text-lg font-black text-foreground mt-1">{formatCurrency(paymentBreakdown.credit)}</div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-foreground">Top Orders by Value in this Period</h3>
                                <ScrollArea className="h-[250px] rounded-xl border p-2">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Order #</TableHead>
                                                <TableHead>Customer</TableHead>
                                                <TableHead>Method</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredOrders
                                                .filter(o => !['cancelled', 'refunded'].includes(o.status))
                                                .sort((a, b) => parseFloat(String(b.totalAmount ?? 0)) - parseFloat(String(a.totalAmount ?? 0)))
                                                .slice(0, 20)
                                                .map((o: any) => (
                                                    <TableRow key={o.id}>
                                                        <TableCell className="font-bold text-primary hover:underline cursor-pointer" onClick={() => window.location.href = `/orders?id=${o.id}`}>{o.orderNumber}</TableCell>
                                                        <TableCell>{o.customerName || 'Unknown'}</TableCell>
                                                        <TableCell className="uppercase text-[10px] font-bold">{o.paymentMethod || o.payment_method || 'CASH'}</TableCell>
                                                        <TableCell className="capitalize text-[10px] font-bold">{o.status}</TableCell>
                                                        <TableCell className="text-right font-bold text-emerald-500">{formatCurrency(o.totalAmount)}</TableCell>
                                                    </TableRow>
                                                ))
                                            }
                                        </TableBody>
                                    </Table>
                                </ScrollArea>
                            </div>
                        </div>
                    )}

                    {activeDetailsDialog === 'orders' && (
                        <div className="space-y-4 pt-4">
                            <h3 className="text-sm font-bold text-foreground">Total Orders in Period: {filteredOrders.length}</h3>
                            <ScrollArea className="h-[320px] rounded-xl border p-2">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Order #</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredOrders.map((o: any) => (
                                            <TableRow key={o.id}>
                                                <TableCell className="font-bold text-primary hover:underline cursor-pointer" onClick={() => window.location.href = `/orders?id=${o.id}`}>{o.orderNumber}</TableCell>
                                                <TableCell>{o.customerName || 'Unknown'}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground">{o.createdAt ? format(new Date(o.createdAt), 'dd MMM yyyy HH:mm') : 'N/A'}</TableCell>
                                                <TableCell className="capitalize text-[10px] font-bold">{o.status}</TableCell>
                                                <TableCell className="text-right font-bold text-emerald-500">{formatCurrency(o.totalAmount)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </div>
                    )}

                    {activeDetailsDialog === 'customers' && (
                        <div className="space-y-4 pt-4">
                            <h3 className="text-sm font-bold text-foreground">New Registrations: {newCustomersList.length}</h3>
                            <ScrollArea className="h-[320px] rounded-xl border p-2">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Phone</TableHead>
                                            <TableHead>Registered Date</TableHead>
                                            <TableHead className="text-right">Total Spent</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {newCustomersList.map((c: any) => (
                                            <TableRow key={c.id}>
                                                <TableCell className="font-bold">{c.name}</TableCell>
                                                <TableCell className="font-mono text-xs">{c.phone}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground">{c.createdAt ? format(new Date(c.createdAt), 'dd MMM yyyy') : 'N/A'}</TableCell>
                                                <TableCell className="text-right font-bold text-emerald-500">{formatCurrency(c.totalSpent || c.total_spent)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </div>
                    )}

                    {activeDetailsDialog === 'today-revenue' && (
                        <div className="space-y-6 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl border bg-muted/20">
                                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Today's Revenue</div>
                                    <div className="text-2xl font-black text-emerald-500 mt-1">{formatCurrency(stats.todayRevenue)}</div>
                                </div>
                                <div className="p-4 rounded-xl border bg-muted/20">
                                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Today's Orders</div>
                                    <div className="text-2xl font-black text-primary mt-1">{stats.todayOrderCount}</div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-foreground">Today's Order List</h3>
                                <ScrollArea className="h-[250px] rounded-xl border p-2">
                                    {todayOrders.length === 0 ? (
                                        <div className="text-center py-10 text-xs text-muted-foreground">No orders placed today yet.</div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Order #</TableHead>
                                                    <TableHead>Customer</TableHead>
                                                    <TableHead>Time</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead className="text-right">Total</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {todayOrders.map((o: any) => (
                                                    <TableRow key={o.id}>
                                                        <TableCell className="font-bold text-primary hover:underline cursor-pointer" onClick={() => window.location.href = `/orders?id=${o.id}`}>{o.orderNumber}</TableCell>
                                                        <TableCell>{o.customerName || 'Unknown'}</TableCell>
                                                        <TableCell className="text-xs text-muted-foreground">{o.createdAt ? format(new Date(o.createdAt), 'HH:mm') : 'N/A'}</TableCell>
                                                        <TableCell className="capitalize text-[10px] font-bold">{o.status}</TableCell>
                                                        <TableCell className="text-right font-bold text-emerald-500">{formatCurrency(o.totalAmount)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </ScrollArea>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
