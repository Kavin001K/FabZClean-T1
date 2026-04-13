/**
 * Dashboard New Customers Widget
 * 
 * Displays the count of customers created in the past 30 days and the total customer count.
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, TrendingUp, ChevronRight } from 'lucide-react';
import { TEST_IDS, getTestId } from '@/lib/test-ids';
import { customersApi } from '@/lib/data-service';
import Skeleton from '@/components/ui/loading-skeleton';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';

export const DashboardNewCustomers: React.FC = React.memo(() => {
  const [, setLocation] = useLocation();

  // Fetch customer analytics
  const { data: analytics, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['customer-analytics'],
    queryFn: () => customersApi.getAnalytics(),
  });

  // Fetch recent customers to show in a list
  const { data: customersRes, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['recent-customers-widget'],
    queryFn: () => customersApi.getAll({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
  });

  const isLoading = isLoadingAnalytics || isLoadingCustomers;
  const newCount = analytics?.data?.newCustomersPastMonth || 0;
  const totalCount = analytics?.data?.totalCustomers || 0;
  const recentCustomers = Array.isArray(customersRes) ? customersRes : (customersRes as any)?.data || [];

  // Precision Algorithm: Calculate growth velocity (AI Insight)
  const growthVelocity = totalCount > 0 ? (newCount / totalCount) * 100 : 0;
  const growthStatus = growthVelocity > 10 ? 'High' : growthVelocity > 5 ? 'Stable' : 'Moderate';
  const growthColor = growthVelocity > 10 ? 'text-emerald-500' : growthVelocity > 5 ? 'text-blue-500' : 'text-amber-500';

  return (
    <Card
      data-testid={getTestId(TEST_IDS.DASHBOARD.WIDGET, 'new-customers')}
      className="h-full overflow-hidden border-border bg-card shadow-sm"
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/50">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Users className="h-5 w-5 text-blue-500" />
          Customer Growth
        </CardTitle>
        <Badge variant={growthVelocity > 5 ? "default" : "secondary"} className={cn("text-[10px] h-5", growthStatus === 'High' && "bg-emerald-500 hover:bg-emerald-600")}>
          {growthStatus} Growth
        </Badge>
      </CardHeader>

      <CardContent className="pt-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-500/5 rounded-2xl p-4 border border-blue-500/10 relative overflow-hidden group">
                <div className="absolute -right-2 -top-2 opacity-10 group-hover:scale-110 transition-transform">
                  <UserPlus className="h-12 w-12 text-blue-500" />
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">New (30d)</span>
                </div>
                <div className="text-2xl font-black text-foreground">{newCount}</div>
                <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  +{growthVelocity.toFixed(1)}% velocity
                </div>
              </div>
              
              <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 relative overflow-hidden group">
                <div className="absolute -right-2 -top-2 opacity-10 group-hover:scale-110 transition-transform">
                  <Users className="h-12 w-12 text-primary" />
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Total</span>
                </div>
                <div className="text-2xl font-black text-foreground">{totalCount}</div>
                <div className="text-[10px] text-muted-foreground mt-1">Acquirer Database</div>
              </div>
            </div>

            {/* Recent Customers List */}
            <div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Recently Joined</div>
              <div className="space-y-2">
                {recentCustomers.length === 0 ? (
                  <div className="py-4 text-center text-xs text-muted-foreground">No recent customers</div>
                ) : (
                  recentCustomers.slice(0, 3).map((customer: any) => (
                    <div 
                      key={customer.id}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer border border-transparent hover:border-border/50"
                      onClick={() => setLocation(`/customers?id=${customer.id}`)}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0 uppercase">
                          {customer.name?.substring(0, 2)}
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-xs font-bold text-foreground truncate">{customer.name}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{customer.phone}</div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-emerald-50 text-emerald-600 border-emerald-100 font-bold shrink-0">
                        ACTIVE
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Button 
              className="w-full h-10 rounded-xl font-bold text-xs gap-2"
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
