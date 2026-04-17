/**
 * Dashboard New Customers Widget
 *
 * Displays real customer counts from server-side SQL COUNT queries.
 * Uses getCustomerAnalyticsStats() which never loads all rows — O(1) at any DB size.
 *
 * Previously broken: listCustomers() defaulted to limit:50, so totalCustomers and
 * newCustomersPastMonth both showed 50 regardless of actual DB size (e.g. 1846 customers).
 * Fixed: backend runs 5 parallel COUNT queries via Supabase head:true — no row data fetched.
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, TrendingUp, CalendarDays } from 'lucide-react';
import { TEST_IDS, getTestId } from '@/lib/test-ids';
import { customersApi } from '@/lib/data-service';
import Skeleton from '@/components/ui/loading-skeleton';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export const DashboardNewCustomers: React.FC = React.memo(() => {
  const [, setLocation] = useLocation();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['customer-analytics'],
    queryFn: () => customersApi.getAnalytics(),
    staleTime: 60_000, // re-fetch at most once per minute
  });

  const d = analytics?.data;
  const totalCount: number = d?.totalCustomers ?? 0;
  const newMonth: number = d?.newCustomersPastMonth ?? 0;
  const newWeek: number = d?.newCustomersPastWeek ?? 0;
  const newToday: number = d?.newCustomersToday ?? 0;
  const growthVelocity: number = d?.growthVelocityPct ?? 0;
  const recentCustomers: any[] = d?.recentCustomers ?? [];

  const growthStatus = growthVelocity > 10 ? 'High' : growthVelocity > 5 ? 'Stable' : 'Moderate';

  return (
    <Card
      data-testid={getTestId(TEST_IDS.DASHBOARD.WIDGET, 'new-customers')}
      className="flex h-full min-h-[24rem] flex-col overflow-hidden border-border bg-card shadow-sm"
    >
      <CardHeader className="flex flex-col gap-3 border-b border-border/50 pb-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Users className="h-5 w-5 text-blue-500" />
          Customer Growth
        </CardTitle>
        <Badge
          variant={growthVelocity > 5 ? 'default' : 'secondary'}
          className={cn('text-[10px] h-5', growthStatus === 'High' && 'bg-emerald-500 hover:bg-emerald-600')}
        >
          {growthStatus} Growth
        </Badge>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col pt-4 sm:pt-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-5">

            {/* Primary stats: New 30d + All-time Total */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <div className="bg-blue-500/5 rounded-2xl p-4 border border-blue-500/10 relative overflow-hidden group">
                <div className="absolute -right-2 -top-2 opacity-10 group-hover:scale-110 transition-transform">
                  <UserPlus className="h-12 w-12 text-blue-500" />
                </div>
                <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">New (30d)</div>
                <div className="text-2xl font-black text-foreground">{newMonth.toLocaleString()}</div>
                <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  {growthVelocity.toFixed(1)}% of total base
                </div>
              </div>

              <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 relative overflow-hidden group">
                <div className="absolute -right-2 -top-2 opacity-10 group-hover:scale-110 transition-transform">
                  <Users className="h-12 w-12 text-primary" />
                </div>
                <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Total</div>
                <div className="text-2xl font-black text-foreground">{totalCount.toLocaleString()}</div>
                <div className="text-[10px] text-muted-foreground mt-1">All-time customers</div>
              </div>
            </div>

            {/* Secondary breakdown: This week + Today */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 bg-muted/40 rounded-xl px-3 py-2">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wider">This week</div>
                  <div className="text-sm font-bold text-foreground">{newWeek.toLocaleString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-muted/40 rounded-xl px-3 py-2">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Today</div>
                  <div className="text-sm font-bold text-foreground">{newToday.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Recently joined — served from analytics endpoint, newest first */}
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Recently Joined</div>
                <Badge variant="outline" className="h-5 rounded-full px-2 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  {recentCustomers.length} customers
                </Badge>
              </div>

              {recentCustomers.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center text-xs text-muted-foreground">
                  No recent customers
                </div>
              ) : (
                <ScrollArea className="min-h-[13rem] flex-1 rounded-2xl border border-border/60 bg-muted/15">
                  <div className="space-y-2 p-2.5">
                    {recentCustomers.map((customer: any) => (
                      <div
                        key={customer.id}
                        className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-transparent p-2.5 transition-colors hover:border-border/50 hover:bg-muted/50"
                        onClick={() => setLocation(`/customers?id=${customer.id}`)}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-xs font-bold text-muted-foreground uppercase">
                            {customer.name?.substring(0, 2) || 'NA'}
                          </div>
                          <div className="overflow-hidden">
                            <div className="truncate text-xs font-bold text-foreground">{customer.name}</div>
                            <div className="truncate text-[10px] text-muted-foreground">{customer.phone}</div>
                          </div>
                        </div>
                        <Badge variant="outline" className="h-5 shrink-0 rounded-full border-emerald-100 bg-emerald-50 px-2 text-[9px] font-bold text-emerald-600">
                          NEW
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            <Button
              className="mt-auto h-10 w-full gap-2 rounded-xl text-xs font-bold"
              onClick={() => setLocation('/customers')}
            >
              <Users className="h-3.5 w-3.5" />
              Manage All Customers
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

DashboardNewCustomers.displayName = 'DashboardNewCustomers';

export default DashboardNewCustomers;
