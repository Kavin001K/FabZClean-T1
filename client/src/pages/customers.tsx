import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { safeParseFloat } from '@/lib/safe-utils';
import {
  Users,
  Mail,
  Phone,
  TrendingUp,
  Award,
  Download,
  Search,
  Filter,
  X,
  ShoppingBag,
  IndianRupee,
  Clock,
  FileText,
  Edit,
  Upload,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Calendar
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { PageTransition, FadeIn } from '@/components/ui/page-transition';

// Import child components
import { CustomerDialogs } from '@/components/customers/customer-dialogs';

// Import data service and types
import { customersApi, ordersApi } from '@/lib/data-service';
import { exportCustomersEnhanced } from '@/lib/enhanced-pdf-export';
import { exportCustomersToExcel } from '@/lib/excel-exports';
import { createAddressObject } from '@/lib/address-utils';
import { REFRESH_DATA_EVENT } from '@/lib/shortcut-events';
import type { Customer, Order } from '@shared/schema';
import * as XLSX from 'xlsx';

// Import New Import Component (I'll define it below or just use a dialog here)

// Helper functions
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getCustomerSegment = (customer: Customer) => {
  const totalSpent = parseFloat(customer.totalSpent || '0');
  const totalOrders = customer.totalOrders || 0;
  const createdAt = new Date(customer.createdAt || 0);
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  if (createdAt >= oneMonthAgo) return { label: 'New', color: 'bg-blue-500', variant: 'default' as const };
  if (totalSpent >= 50000) return { label: 'VIP', color: 'bg-primary', variant: 'default' as const };
  if (totalSpent >= 20000 || totalOrders >= 10) return { label: 'Premium', color: 'bg-accent', variant: 'secondary' as const };
  return { label: 'Regular', color: 'bg-secondary', variant: 'outline' as const };
};

const getSpendingTier = (totalSpent: number) => {
  if (totalSpent >= 50000) return { label: 'Elite', icon: Award, color: 'text-primary' };
  if (totalSpent >= 20000) return { label: 'Gold', icon: TrendingUp, color: 'text-accent' };
  if (totalSpent >= 10000) return { label: 'Silver', icon: ShoppingBag, color: 'text-secondary' };
  return { label: 'Bronze', icon: Users, color: 'text-muted-foreground' };
};

export default function Customers() {
  useEffect(() => {
    document.title = "Customers | FabzClean";
  }, []);

  // State management
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  
  // CRM & Intelligence Dashboard states
  const [viewMode, setViewMode] = useState<'directory' | 'crm'>('directory');
  const [crmTab, setCrmTab] = useState<'top100' | 'active' | 'recent' | 'sales' | 'timeline'>('top100');
  const [activeDays, setActiveDays] = useState<number>(30);
  const [recentMonthOffset, setRecentMonthOffset] = useState<number>(0);
  
  // Pagination state: cap 'All' to 1000 (Supabase max-rows safe limit)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(1000); // Default to 'All' (capped at 1000)

  // Debounce search input → server query (300ms)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to page 1 on new search
    }, 300);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchQuery]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleRefreshData = (event: Event) => {
      event.preventDefault();
      void queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: 'Customers Refreshed',
        description: 'Customer data has been updated.',
        duration: 1500,
      });
    };

    window.addEventListener(REFRESH_DATA_EVENT, handleRefreshData);
    return () => window.removeEventListener(REFRESH_DATA_EVENT, handleRefreshData);
  }, [queryClient, toast]);

  // Fetch customers data...
  const {
    data: customersResponse,
    isLoading: customersLoading,
    isError: customersError,
    error: customersErrorDetails,
  } = useQuery({
    queryKey: ['customers', page, pageSize, debouncedSearch, sortBy],
    queryFn: () => customersApi.getAll({ 
      page, 
      limit: pageSize, 
      search: debouncedSearch || undefined,
      sortBy 
    }),
    staleTime: 30000, 
    refetchOnWindowFocus: true,
    retry: 2,
  });

  // Handle URL parameters (e.g. ?id=...) to open customer details directly
  // Must be placed AFTER useQuery so customersResponse is declared
  useEffect(() => {
    if (!customersResponse) return;
    
    // Extract ID from URL if present
    const params = new URLSearchParams(window.location.search);
    const customerId = params.get('id');
    
    if (customerId) {
      // Find customer in loaded data, or use API if it's the right way
      // But since we might paginate, ideally we'd fetch directly if not in current page
      // Here we just search the current page, which is 'All' by default
      let dataList: Customer[] = [];
      if (typeof customersResponse === 'object' && 'data' in customersResponse && Array.isArray(customersResponse.data)) {
        dataList = customersResponse.data as Customer[];
      } else if (Array.isArray(customersResponse)) {
        dataList = customersResponse;
      }
      
      const found = dataList.find(c => c.id === customerId);
      if (found) {
        setSelectedCustomer(found);
        setIsViewDialogOpen(true);
        // Clear the URL to avoid reopening on every re-render or layout shift
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      } else {
        // If not found in current page, try fetching it directly
        customersApi.getById(customerId).then((cust) => {
          if (cust) {
            setSelectedCustomer(cust);
            setIsViewDialogOpen(true);
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
          }
        }).catch(console.error);
      }
    }
  }, [customersResponse]);

  // Ensure customers is always an array and get total count
  const { customers, totalCount } = useMemo(() => {
    if (!customersResponse) return { customers: [], totalCount: 0 };
    
    // Handle the new response format { data, totalCount }
    if (typeof customersResponse === 'object' && 'data' in customersResponse && Array.isArray(customersResponse.data)) {
      return {
        customers: customersResponse.data as Customer[],
        totalCount: (customersResponse as any).totalCount || 0
      };
    }
    
    // Legacy support for plain arrays
    if (Array.isArray(customersResponse)) {
      return {
        customers: customersResponse,
        totalCount: customersResponse.length
      };
    }
    
    return { customers: [], totalCount: 0 };
  }, [customersResponse]);

  // Fetch orders for customer analytics
  const {
    data: orders = [],
  } = useQuery({
    queryKey: ['orders'],
    queryFn: ordersApi.getAll,
    staleTime: 60000,
    refetchOnWindowFocus: true,
  });

  // Fetch all customers for CRM analytics (caches all customers when switching to CRM view)
  const { data: allCustomers = [], isLoading: allCustomersLoading } = useQuery({
    queryKey: ['all-customers-crm'],
    queryFn: async () => {
      let allList: Customer[] = [];
      let currentPage = 1;
      let hasMore = true;
      const fetchLimit = 1000;
      
      while (hasMore) {
        const response = await customersApi.getAll({
          page: currentPage,
          limit: fetchLimit
        });
        if (response && response.data && response.data.length > 0) {
          allList = [...allList, ...response.data];
          if (response.data.length < fetchLimit || allList.length >= response.totalCount) {
            hasMore = false;
          } else {
            currentPage++;
          }
        } else {
          hasMore = false;
        }
      }
      return allList;
    },
    enabled: viewMode === 'crm',
    staleTime: 60000,
  });

  // Onboarding limit check/warning
  const customerCountWarning = null;

  // Top 100 customers by total spent
  const top100Customers = useMemo(() => {
    return [...allCustomers]
      .sort((a, b) => safeParseFloat(b.totalSpent) - safeParseFloat(a.totalSpent))
      .slice(0, 100);
  }, [allCustomers]);

  // Active customers - placed at least 1 order in the last X days
  const activeCustomersList = useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - activeDays);
    
    const activeCustomerIds = new Set(
      orders
        .filter(o => o.createdAt && new Date(o.createdAt) >= cutoffDate && o.status !== 'cancelled')
        .map(o => o.customerId)
    );
    
    return allCustomers.filter(c => activeCustomerIds.has(c.id));
  }, [allCustomers, orders, activeDays]);

  // Recent Customers View: only last 2–3 months of customers, with month filters.
  // We handle month boundary date checks timezone-safely
  const recentCustomersList = useMemo(() => {
    const now = new Date();
    // month offset: 0 = current month, 1 = last month, 2 = 2 months ago
    const targetMonthDate = new Date(now.getFullYear(), now.getMonth() - recentMonthOffset, 1);
    const targetYear = targetMonthDate.getFullYear();
    const targetMonth = targetMonthDate.getMonth();
    
    const startOfMonth = new Date(targetYear, targetMonth, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);
    
    return allCustomers.filter(c => {
      if (!c.createdAt) return false;
      const createdDate = new Date(c.createdAt);
      return createdDate >= startOfMonth && createdDate <= endOfMonth;
    });
  }, [allCustomers, recentMonthOffset]);

  // Meaningful Recent Update Timeline
  const { data: auditLogs = [] } = useQuery({
    queryKey: ['audit-logs-crm-tab'],
    queryFn: async () => {
      const response = await fetch('/api/audit-logs?limit=100');
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      const data = await response.json();
      return data?.data || [];
    },
    enabled: viewMode === 'crm' && crmTab === 'timeline',
    staleTime: 30000,
  });

  const timelineUpdates = useMemo(() => {
    return auditLogs
      .filter((log: any) => ['create_customer', 'update_customer', 'delete_customer'].includes(log.action))
      .map((log: any) => ({
        id: log.id,
        action: log.action,
        timestamp: log.createdAt,
        operator: log.employeeName || 'System',
        description: log.description || 'Customer profile was modified',
        details: typeof log.details === 'string' ? JSON.parse(log.details) : (log.details || {}),
      }));
  }, [auditLogs]);

  const renderTop100 = () => {
    return (
      <Card className="glass border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold">Top 100 High-Value Customers</CardTitle>
          <CardDescription>Ranked by lifetime revenue contribution.</CardDescription>
        </CardHeader>
        <CardContent>
          {top100Customers.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">No customer records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-muted-foreground text-xs font-bold uppercase select-none">
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Phone / Email</th>
                    <th className="py-3 px-4 text-right">Orders</th>
                    <th className="py-3 px-4 text-right">AOV</th>
                    <th className="py-3 px-4 text-right">Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {top100Customers.map((c, index) => {
                    const spent = safeParseFloat(c.totalSpent);
                    const ordersCount = c.totalOrders || 0;
                    const aov = ordersCount > 0 ? spent / ordersCount : 0;
                    return (
                      <tr 
                        key={c.id} 
                        onClick={() => {
                          setSelectedCustomer(c);
                          setIsViewDialogOpen(true);
                        }}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <td className="py-4 px-4 font-mono font-bold text-muted-foreground">#{index + 1}</td>
                        <td className="py-4 px-4 font-semibold text-foreground">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7 text-[10px] font-bold bg-primary/10 border border-primary/20 text-primary">
                              <AvatarFallback>{c.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            {c.name}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-xs font-medium text-foreground">{c.phone}</div>
                          {c.email && <div className="text-[10px] text-muted-foreground">{c.email}</div>}
                        </td>
                        <td className="py-4 px-4 text-right font-semibold">{ordersCount}</td>
                        <td className="py-4 px-4 text-right font-medium text-muted-foreground">Rs. {aov.toFixed(1)}</td>
                        <td className="py-4 px-4 text-right font-bold text-emerald-500">Rs. {spent.toLocaleString('en-IN')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderActive = () => {
    return (
      <Card className="glass border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold">Active Customer Base ({activeDays} Days)</CardTitle>
          <CardDescription>Customers with successful orders in this period.</CardDescription>
        </CardHeader>
        <CardContent>
          {activeCustomersList.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">No customers were active in the last {activeDays} days.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeCustomersList.map((c) => {
                const spent = safeParseFloat(c.totalSpent);
                const activeOrders = orders.filter(o => o.customerId === c.id && o.status !== 'cancelled');
                const lastActiveOrder = activeOrders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0];
                
                return (
                  <Card 
                    key={c.id}
                    onClick={() => {
                      setSelectedCustomer(c);
                      setIsViewDialogOpen(true);
                    }}
                    className="glass border-muted hover:border-primary/20 transition-all cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8 text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                            <AvatarFallback>{c.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="text-sm font-bold text-foreground">{c.name}</h4>
                            <p className="text-[10px] text-muted-foreground">{c.phone}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-bold text-emerald-500 border-emerald-500/20 bg-emerald-500/5">
                          Active
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-white/5 py-2">
                        <div>
                          <span className="text-muted-foreground block text-[9px] uppercase font-bold">Recent Orders</span>
                          <span className="font-bold text-foreground">{activeOrders.length} orders</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[9px] uppercase font-bold">Total Spent</span>
                          <span className="font-bold text-foreground text-emerald-500">Rs. {spent.toFixed(0)}</span>
                        </div>
                      </div>

                      {lastActiveOrder && (
                        <div className="text-[10px] text-muted-foreground flex justify-between items-center">
                          <span>Last Order: <span className="font-bold text-foreground">{lastActiveOrder.orderNumber}</span></span>
                          <span>{new Date(lastActiveOrder.createdAt || '').toLocaleDateString()}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderRecent = () => {
    return (
      <Card className="glass border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold">Recent Customers Cohort</CardTitle>
          <CardDescription>Customers registered in the selected calendar month.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentCustomersList.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">No customers onboarded during this month.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-muted-foreground text-xs font-bold uppercase select-none">
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Register Date</th>
                    <th className="py-3 px-4 text-right">Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCustomersList.map((c) => {
                    const spent = safeParseFloat(c.totalSpent);
                    return (
                      <tr 
                        key={c.id} 
                        onClick={() => {
                          setSelectedCustomer(c);
                          setIsViewDialogOpen(true);
                        }}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <td className="py-4 px-4 font-semibold text-foreground">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7 text-[10px] font-bold bg-primary/10 border border-primary/20 text-primary">
                              <AvatarFallback>{c.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            {c.name}
                          </div>
                        </td>
                        <td className="py-4 px-4 font-mono text-xs text-muted-foreground">{c.email || 'N/A'}</td>
                        <td className="py-4 px-4">
                          <Badge variant={c.status === 'active' ? 'default' : 'outline'} className="text-[10px] font-bold">
                            {c.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-xs font-medium">
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : 'N/A'}
                        </td>
                        <td className="py-4 px-4 text-right font-bold text-emerald-500">Rs. {spent.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderSales = () => {
    const maxSpent = top100Customers.length > 0 ? safeParseFloat(top100Customers[0].totalSpent) : 1;
    
    return (
      <Card className="glass border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold">Sales & Customer Revenue Share</CardTitle>
          <CardDescription>Analysis of client contribution to overall sales.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {top100Customers.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">No sales records found.</div>
          ) : (
            <div className="space-y-4">
              {top100Customers.slice(0, 10).map((c) => {
                const spent = safeParseFloat(c.totalSpent);
                const percentOfMax = (spent / maxSpent) * 100;
                const customerOrders = orders.filter(o => o.customerId === c.id);
                const activeOrders = customerOrders.filter(o => o.status !== 'cancelled');
                
                return (
                  <div key={c.id} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground hover:underline cursor-pointer" onClick={() => {
                          setSelectedCustomer(c);
                          setIsViewDialogOpen(true);
                        }}>{c.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">({c.phone})</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-500 mr-2">Rs. {spent.toLocaleString('en-IN')}</span>
                        <span className="text-xs text-muted-foreground font-bold">({activeOrders.length} orders)</span>
                      </div>
                    </div>
                    <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${percentOfMax}%` }} 
                      />
                    </div>
                    {activeOrders.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1 pl-2">
                        {activeOrders.slice(0, 4).map(o => (
                          <Badge 
                            key={o.id}
                            variant="outline"
                            onClick={() => {
                              window.location.href = `/orders?id=${o.id}`;
                            }}
                            className="text-[9px] font-mono cursor-pointer hover:bg-white/5 hover:text-foreground transition-all gap-1 py-0 px-1.5"
                          >
                            {o.orderNumber} (Rs. {Number(o.totalAmount || 0).toFixed(0)})
                          </Badge>
                        ))}
                        {activeOrders.length > 4 && (
                          <span className="text-[9px] text-muted-foreground font-medium">+{activeOrders.length - 4} more</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderTimeline = () => {
    return (
      <Card className="glass border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold">Customer Update & Audit Log</CardTitle>
          <CardDescription>Chronological timeline of meaningful modifications.</CardDescription>
        </CardHeader>
        <CardContent>
          {timelineUpdates.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">No recent modifications found.</div>
          ) : (
            <div className="relative pl-6 border-l border-white/10 space-y-6 py-2">
              {timelineUpdates.map((update) => {
                const isCreation = update.action === 'create_customer';
                const isDeletion = update.action === 'delete_customer';
                
                return (
                  <div key={update.id} className="relative group">
                    <div className={`absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 border-background transition-colors ${
                      isCreation 
                        ? 'bg-blue-500 group-hover:bg-blue-400' 
                        : isDeletion
                          ? 'bg-red-500 group-hover:bg-red-400'
                          : 'bg-amber-500 group-hover:bg-amber-400'
                    }`} />
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 justify-between">
                        <span className="font-bold text-sm text-foreground">
                          {isCreation ? 'Customer Registered' : isDeletion ? 'Customer Deleted' : 'Profile Updated'}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(update.timestamp).toLocaleString()}
                        </span>
                      </div>
                      
                      <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                        {update.description}
                      </p>
                      
                      <div className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                        <span>Operator:</span>
                        <span className="text-foreground">{update.operator}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Computed metrics
  const metrics = useMemo(() => {
    const totalCustomers = totalCount;
    // Metrics based on loaded page (approximate for UI) or ideally from another endpoint
    const loadedRevenue = (customers || []).reduce((sum, c) => sum + safeParseFloat(c.totalSpent), 0);
    const loadedOrders = (customers || []).reduce((sum, c) => sum + (c.totalOrders ?? 0), 0);
    
    const avgOrderValue = loadedOrders > 0 ? loadedRevenue / loadedOrders : 0;

    const vipCustomers = (customers || []).filter(c => {
      const spent = safeParseFloat(c.totalSpent);
      return spent >= 50000;
    }).length;
    const premiumCustomers = (customers || []).filter(c => {
      const spent = safeParseFloat(c.totalSpent);
      return spent >= 20000 && spent < 50000;
    }).length;
    const regularCustomers = (customers || []).filter(c => {
      const spent = safeParseFloat(c.totalSpent);
      return (c.totalOrders ?? 0) > 0 && spent < 20000;
    }).length;
    const inactiveCustomers = (customers || []).filter(c => (c.totalOrders ?? 0) === 0).length;

    return {
      totalCustomers,
      totalRevenue: loadedRevenue,
      totalOrders: loadedOrders,
      avgOrderValue,
      vipCustomers,
      premiumCustomers,
      regularCustomers,
    };
  }, [customers, totalCount]);

  // Filtered and sorted customers
  // Client-side post-filtering: ONLY segment filter is applied here.
  // Search is already handled server-side by the API, so we don't re-filter by searchQuery.
  const filteredCustomers = useMemo(() => {
    let filtered = customers;

    // Segment filter (client-side only)
    if (segmentFilter !== 'all') {
      filtered = customers.filter(customer => {
        if (segmentFilter === 'new') {
          const createdAt = new Date(customer.createdAt || 0);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          thirtyDaysAgo.setHours(0, 0, 0, 0);
          return createdAt >= thirtyDaysAgo;
        }
        const segment = getCustomerSegment(customer);
        return segment.label.toLowerCase() === segmentFilter.toLowerCase();
      });
    }

    // Sort customers (client-side refinement on server-sorted data)
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'totalSpent':
          return parseFloat(b.totalSpent || '0') - parseFloat(a.totalSpent || '0');
        case 'totalOrders':
          return (b.totalOrders || 0) - (a.totalOrders || 0);
        case 'updatedAt':
          return new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime();
        default:
          return 0;
      }
    });

    return sorted;
  }, [customers, segmentFilter, sortBy]);

  const hasNextPage = (page * pageSize) < totalCount;
  const hasPrevPage = page > 1;

  // Mutations
  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: Partial<Customer>) => {
      return await customersApi.create(customerData);
    },
    onSuccess: (newCustomer) => {
      if (newCustomer) {
        queryClient.invalidateQueries({ queryKey: ["customers"] });
        toast({
          title: "Customer Created Successfully",
          description: `Customer ${newCustomer.name} has been added to the system.`,
        });
        setIsCreateDialogOpen(false);
      }
    },
    onError: (error) => {
      console.error('Failed to create customer:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create customer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const editCustomerMutation = useMutation({
    mutationFn: async ({ customerId, customerData }: { customerId: string; customerData: Partial<Customer> }) => {
      return await customersApi.update(customerId, customerData);
    },
    onSuccess: (updatedCustomer) => {
      if (updatedCustomer) {
        queryClient.invalidateQueries({ queryKey: ["customers"] });
        queryClient.invalidateQueries({ queryKey: ["customers", updatedCustomer.id, "profile"] });
        toast({
          title: "Customer Updated Successfully",
          description: `Customer ${updatedCustomer.name} has been updated.`,
        });
        setSelectedCustomer(updatedCustomer);
        setIsEditDialogOpen(false);
      }
    },
    onError: (error) => {
      console.error('Failed to update customer:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update customer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (customerId: string) => {
      return await customersApi.delete(customerId);
    },
    onSuccess: (success) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: ["customers"] });
        toast({
          title: "Customer Deleted Successfully",
          description: "Customer has been deleted.",
        });
        setIsEditDialogOpen(false);
        setIsViewDialogOpen(false);
        setSelectedCustomer(null);
      }
    },
    onError: (error) => {
      console.error('Failed to delete customer:', error);
      toast({
        title: "Error",
        description: "Failed to delete customer. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handler functions
  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsViewDialogOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditDialogOpen(true);
  };

  const handleDeleteCustomer = (customerId: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      deleteCustomerMutation.mutate(customerId);
    }
  };

  const handleCreateCustomer = (customerData: any) => {
    // Transform address fields to proper address object
    const addressObj = createAddressObject({
      street: customerData.addressStreet || '',
      city: customerData.addressCity || '',
      pincode: customerData.addressPincode || '',
    });

    const parsedCreditLimit = customerData.creditLimit !== undefined && customerData.creditLimit !== ''
      ? Number(customerData.creditLimit)
      : undefined;
    const normalizedCreditLimit = parsedCreditLimit !== undefined && !Number.isNaN(parsedCreditLimit)
      ? Math.abs(parsedCreditLimit).toString()
      : undefined;
    const transformedData: Partial<Customer> = {
      name: customerData.name,
      phone: customerData.phone,
      secondaryPhone: customerData.secondaryPhone || undefined,
      email: customerData.email || undefined,
      address: addressObj.street ? addressObj : undefined,
      creditLimit: normalizedCreditLimit,
      creditBalance: customerData.creditBalance !== undefined && customerData.creditBalance !== '' 
        ? customerData.creditBalance.toString() 
        : undefined,
      notes: customerData.notes || undefined,
      companyName: customerData.companyName || undefined,
      taxId: customerData.taxId || undefined,
      dateOfBirth: customerData.dateOfBirth || undefined,
      paymentTerms: customerData.paymentTerms || undefined,
      status: customerData.status || 'active',
    };

    createCustomerMutation.mutate(transformedData);
  };

  const handleUpdateCustomer = (customerData: any) => {
    if (!selectedCustomer) return;

    // Transform address fields to proper address object
    const addressObj = createAddressObject({
      street: customerData.addressStreet || '',
      city: customerData.addressCity || '',
      pincode: customerData.addressPincode || '',
    });

    const parsedCreditLimit = customerData.creditLimit !== undefined && customerData.creditLimit !== ''
      ? Number(customerData.creditLimit)
      : undefined;
    const normalizedCreditLimit = parsedCreditLimit !== undefined && !Number.isNaN(parsedCreditLimit)
      ? Math.abs(parsedCreditLimit).toString()
      : undefined;
    const transformedData: Partial<Customer> = {
      name: customerData.name,
      phone: customerData.phone,
      secondaryPhone: customerData.secondaryPhone || undefined,
      email: customerData.email || undefined,
      address: addressObj.street ? addressObj : undefined,
      creditLimit: normalizedCreditLimit,
      creditBalance: customerData.creditBalance !== undefined && customerData.creditBalance !== '' 
        ? customerData.creditBalance.toString() 
        : undefined,
      status: customerData.status || 'active',
      notes: customerData.notes || undefined,
      companyName: customerData.companyName || undefined,
      taxId: customerData.taxId || undefined,
      dateOfBirth: customerData.dateOfBirth || undefined,
      paymentTerms: customerData.paymentTerms || undefined,
    };

    editCustomerMutation.mutate({
      customerId: selectedCustomer.id,
      customerData: transformedData,
    });
  };

  const downloadTemplate = () => {
    const data = [
      ['Name*', 'Phone*', 'Email', 'Address Street', 'Address City', 'Address Pincode', 'Notes', 'Company Name', 'Tax ID', 'Date of Birth (YYYY-MM-DD)'],
      ['John Doe', '9876543210', 'john@example.com', '123 Main St', 'Coimbatore', '641001', 'Regular customer', 'Example Inc', 'GST12345', '1990-01-01']
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");
    XLSX.writeFile(wb, "Customer_Import_Template.xlsx");
  };

  const handleExportPDF = () => {
    exportCustomersEnhanced(filteredCustomers);
    toast({
      title: "Export Successful",
      description: `Exported ${filteredCustomers.length} customers to PDF.`,
    });
  };

  const handleExportExcel = () => {
    const filters = {
      segment: segmentFilter,
      search: searchQuery,
    };
    exportCustomersToExcel(filteredCustomers, filters);
    toast({
      title: "Excel Export Successful",
      description: `Exported ${filteredCustomers.length} customers to Excel.`,
    });
  };

  const handleExportSegmented = (segment: string) => {
    const segmentedCustomers = customers.filter(c => {
      const seg = getCustomerSegment(c);
      return seg.label.toLowerCase() === segment.toLowerCase();
    });
    exportCustomersEnhanced(segmentedCustomers);
    toast({
      title: "Export Successful",
      description: `Exported ${segmentedCustomers.length} ${segment} customers to PDF.`,
    });
  };

  // Error state
  if (customersError) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-destructive text-lg font-semibold">
                Failed to load customers
              </div>
              <p className="text-sm text-muted-foreground">
                {customersErrorDetails?.message || 'An unexpected error occurred'}
              </p>
              <Button
                onClick={() => queryClient.invalidateQueries({ queryKey: ['customers'] })}
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="container-desktop min-h-screen py-8 gradient-mesh">
        {/* Header Section */}
        <FadeIn delay={0.1}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6 mb-6 lg:mb-10 pb-4 lg:pb-6 border-b border-white/5">
            <div className="space-y-1 lg:space-y-2">
              <div className="flex items-center gap-3 lg:gap-4">
                <div className="p-2 lg:p-3 rounded-xl lg:rounded-2xl bg-primary/10 border border-primary/20 shadow-inner">
                  <Users className="h-5 w-5 lg:h-7 lg:w-7 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-4xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60">
                    Customers
                  </h1>
                  <div className="text-muted-foreground text-[10px] lg:text-sm font-medium flex items-center gap-2">
                    <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Managing {totalCount} active relationships
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <div className="flex items-center gap-2 bg-muted/20 p-1.5 rounded-xl border border-white/5 shadow-inner">
                <Button 
                  onClick={handleExportExcel} 
                  variant="ghost" 
                  size="sm" 
                  className="h-9 px-4 gap-2 text-xs font-bold hover:bg-emerald-500/10 hover:text-emerald-500 transition-all"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span className="hidden sm:inline">Excel</span>
                </Button>
                <Button 
                  onClick={handleExportPDF} 
                  variant="ghost" 
                  size="sm" 
                  className="h-9 px-4 gap-2 text-xs font-bold hover:bg-blue-500/10 hover:text-blue-500 transition-all"
                >
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">PDF Report</span>
                </Button>
              </div>

              <div className="w-px h-8 bg-white/5 hidden md:block mx-1" />

              <Button 
                onClick={() => setIsImportDialogOpen(true)} 
                variant="outline" 
                size="sm" 
                className="h-11 px-5 gap-2 border-white/10 hover:bg-white/5 text-sm font-semibold transition-all rounded-xl"
              >
                <Upload className="h-4 w-4 text-primary" />
                <span>Import</span>
              </Button>

              <Button 
                onClick={() => setIsCreateDialogOpen(true)} 
                size="sm" 
                className="h-11 px-6 gap-2 gradient-primary shadow-xl shadow-primary/20 text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] rounded-xl"
              >
                <UserPlus className="h-4 w-4" />
                <span>Add Customer</span>
              </Button>
            </div>
          </div>
        </FadeIn>

        {/* KPI Cards */}
        <FadeIn delay={0.2}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8">
            <Card className="glass border-muted border-l-4 border-l-primary shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center gap-2 lg:gap-4">
                  <div className="h-8 w-8 lg:h-12 lg:w-12 rounded-lg lg:rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4 lg:h-6 lg:w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-[8px] lg:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Customers</p>
                    <h3 className="text-lg lg:text-2xl font-black tracking-tight text-foreground">
                      {customersLoading ? '...' : metrics.totalCustomers}
                    </h3>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-muted border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center gap-2 lg:gap-4">
                  <div className="h-8 w-8 lg:h-12 lg:w-12 rounded-lg lg:rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <IndianRupee className="h-4 w-4 lg:h-6 lg:w-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[8px] lg:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Revenue</p>
                    <h3 className="text-lg lg:text-2xl font-black tracking-tight text-emerald-600">Rs. {metrics.totalRevenue.toFixed(0)}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-muted border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center gap-2 lg:gap-4">
                  <div className="h-8 w-8 lg:h-12 lg:w-12 rounded-lg lg:rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Award className="h-4 w-4 lg:h-6 lg:w-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-[8px] lg:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">VIP</p>
                    <h3 className="text-lg lg:text-2xl font-black tracking-tight text-amber-600">{metrics.vipCustomers}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-muted border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center gap-2 lg:gap-4">
                  <div className="h-8 w-8 lg:h-12 lg:w-12 rounded-lg lg:rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <ShoppingBag className="h-4 w-4 lg:h-6 lg:w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[8px] lg:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Orders</p>
                    <h3 className="text-lg lg:text-2xl font-black tracking-tight text-blue-600">{metrics.totalOrders}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </FadeIn>

        {/* View Switcher Tabs */}
        <div className="flex border-b border-white/10 mb-8 mt-2">
          <button
            onClick={() => setViewMode('directory')}
            className={`px-6 py-3 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${
              viewMode === 'directory'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="h-4 w-4" />
            Customer Directory
          </button>
          <button
            onClick={() => setViewMode('crm')}
            className={`px-6 py-3 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${
              viewMode === 'crm'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            CRM & Intelligence
          </button>
        </div>

        {viewMode === 'directory' ? (
          <>
            <FadeIn delay={0.3}>
            <Card className="glass mb-8 overflow-hidden border-muted">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative flex-1 lg:max-w-xl group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-search-input
                    className="pl-9 h-11 border-muted bg-muted/5 focus-visible:ring-primary/20"
                  />
                  <AnimatePresence>
                    {searchQuery && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-transparent"
                          onClick={() => setSearchQuery('')}
                        >
                          <X className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                    <SelectTrigger className="w-[140px] sm:w-[160px] h-10 border-border bg-card shadow-sm hover:bg-muted/50 transition-all font-medium">
                      <Filter className="h-4 w-4 mr-2 text-primary" />
                      <SelectValue placeholder="Segment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Segments</SelectItem>
                      <SelectItem value="new">New Customers</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="regular">Regular</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[140px] sm:w-[160px] h-10 border-border bg-card shadow-sm hover:bg-muted/50 transition-all font-medium">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                      <SelectItem value="totalSpent">Highest Spending</SelectItem>
                      <SelectItem value="totalOrders">Most Orders</SelectItem>
                      <SelectItem value="updatedAt">Recent Activity</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="h-11 w-px bg-muted/50 mx-1 hidden sm:block" />

                  <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(parseInt(v)); setPage(1); }}>
                    <SelectTrigger className="w-[100px] sm:w-[120px] h-11 border-muted bg-transparent focus:ring-primary/20">
                      <SelectValue placeholder="Page size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1000">Show All</SelectItem>
                      <SelectItem value="50">50 / page</SelectItem>
                      <SelectItem value="100">100 / page</SelectItem>
                      <SelectItem value="500">500 / page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>
                    Showing <strong className="text-foreground">{customers.length}</strong> of{' '}
                    <strong className="text-foreground">{totalCount}</strong> customers
                  </span>
                  {(searchQuery || segmentFilter !== 'all') && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => {
                        setSearchQuery('');
                        setSegmentFilter('all');
                      }}
                      className="h-auto p-0 text-primary hover:text-primary/80 decoration-primary/30"
                    >
                      Clear all filters
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Customer Cards Grid */}
        <FadeIn delay={0.4}>
          {customersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="glass">
                  <CardContent className="pt-6">
                    <div className="animate-pulse space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-muted" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4" />
                          <div className="h-3 bg-muted rounded w-1/2" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-muted rounded" />
                        <div className="h-3 bg-muted rounded w-5/6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCustomers.length === 0 ? (
            <Card className="glass">
              <CardContent className="pt-12 pb-12">
                <div className="text-center space-y-4">
                  <div className="rounded-full bg-muted p-6 w-20 h-20 mx-auto flex items-center justify-center">
                    <Users className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">No customers found</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      {searchQuery || segmentFilter !== 'all'
                        ? 'Try adjusting your filters'
                        : 'Get started by adding your first customer'}
                    </p>
                  </div>
                  {!searchQuery && segmentFilter === 'all' && (
                    <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                      <UserPlus className="h-4 w-4" />
                      Add First Customer
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredCustomers.map((customer, index) => {
                  const segment = getCustomerSegment(customer);
                  const tier = getSpendingTier(parseFloat(customer.totalSpent || '0'));
                  const TierIcon = tier.icon;
                  const totalSpent = parseFloat(customer.totalSpent || '0');
                  const outstandingCredit = parseFloat(customer.creditBalance || '0');
                  const customerCreditLimit = Math.max(0, parseFloat((customer as any).creditLimit || '1000'));
                  const availableCredit = Math.max(0, customerCreditLimit - outstandingCredit);
                  const isCreditLimitExceeded = outstandingCredit > customerCreditLimit;
                  const outstandingColorClass = isCreditLimitExceeded
                    ? 'text-red-500'
                    : outstandingCredit === 0
                      ? 'text-emerald-500'
                      : 'text-amber-500';
                  const lastOrderDate = customer.lastOrder
                    ? new Date(customer.lastOrder).toLocaleDateString()
                    : 'No orders';

                  return (
                    <motion.div
                      key={customer.id}
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -20 }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.05,
                        ease: [0.4, 0, 0.2, 1]
                      }}
                      whileHover={{
                        scale: 1.02,
                        transition: { duration: 0.2 }
                      }}
                      whileTap={{ scale: 0.98 }}
                      layout
                    >
                      <Card
                        className="glass border-primary/5 shadow-lg hover:shadow-primary/20 hover:-translate-y-1.5 transition-all duration-500 cursor-pointer group h-full overflow-hidden rounded-2xl"
                        onClick={() => handleViewCustomer(customer)}
                      >
                        <CardHeader className="pb-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <Avatar className="h-16 w-16 border-2 border-primary/20 group-hover:border-primary transition-colors">
                                <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-primary to-accent text-white">
                                  {getInitials(customer.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                                    {customer.name}
                                  </h3>
                                  <Badge variant={segment.variant} className="shrink-0">
                                    {segment.label}
                                  </Badge>
                                </div>
                                <div className="flex flex-col gap-1 mt-1">
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                    <TierIcon className={`h-3.5 w-3.5 ${tier.color}`} />
                                    <span className={tier.color}>{tier.label} Tier</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70">
                                    <Calendar className="h-3 w-3" />
                                    <span>Joined {new Date(customer.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          {/* Contact Info */}
                          <div className="space-y-2">
                            {customer.email && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="truncate">{customer.email}</span>
                              </div>
                            )}
                            {customer.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span>
                                  {customer.phone}
                                  {(customer as any).secondaryPhone ? `, ${(customer as any).secondaryPhone}` : ''}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Credit Wallet Summary */}
                          <div className="space-y-2 py-2 px-3 bg-white/5 rounded-md border border-white/5 text-[11px]">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground font-medium">Wallet Balance</span>
                              <span className="font-bold text-emerald-500">
                                Rs. {parseFloat((customer as any).walletBalanceCache || '0').toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between border-t border-white/5 pt-1">
                              <span className="text-muted-foreground font-medium">Outstanding Credit</span>
                              <span className={`font-bold ${outstandingColorClass}`}>
                                Rs. {outstandingCredit.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                              <span className={isCreditLimitExceeded ? "text-red-500 font-semibold" : ""}>Limit Rs. {customerCreditLimit.toFixed(0)}</span>
                              <span className={isCreditLimitExceeded ? "text-red-500 font-semibold" : ""}>
                                {isCreditLimitExceeded
                                  ? `Exceeded Rs. ${(outstandingCredit - customerCreditLimit).toFixed(0)}`
                                  : `Available Rs. ${availableCredit.toFixed(0)}`}
                              </span>
                            </div>
                          </div>

                          {/* Stats - Only show if they have orders */}
                          {(customer.totalOrders || 0) > 0 && (
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                              <div>
                                <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Orders</div>
                                <div className="text-2xl font-bold text-primary">
                                  {customer.totalOrders || 0}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">LTV</div>
                                <div className="text-2xl font-bold text-primary">
                                  Rs. {totalSpent.toFixed(0)}
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-sm pt-3 border-t border-white/5">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span className="whitespace-nowrap">Last visited Neetly:</span>
                            </div>
                            <span className="font-medium text-foreground">{lastOrderDate}</span>
                          </div>

                          {/* Quick Actions */}
                          <div className="grid grid-cols-3 gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full gap-2 text-[10px] h-9"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (customer.email) {
                                  window.location.href = `mailto:${customer.email}`;
                                }
                              }}
                              disabled={!customer.email}
                            >
                              <Mail className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Email</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full gap-2 text-[10px] h-9"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (customer.phone) {
                                  window.location.href = `tel:${customer.phone}`;
                                }
                              }}
                              disabled={!customer.phone}
                            >
                              <Phone className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Call</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full gap-2 text-[10px] h-9 group-hover:bg-primary group-hover:text-white transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditCustomer(customer);
                              }}
                            >
                              <Edit className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Edit</span>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </FadeIn>
      </>
    ) : (
        <FadeIn delay={0.3}>
          {/* Limit Warning banner if any */}
          {customerCountWarning && (
            <div className={`mb-6 p-4 rounded-xl border flex items-center justify-between gap-4 ${
              customerCountWarning.severity === 'destructive'
                ? 'bg-red-500/10 border-red-500/20 text-red-500'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
            }`}>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-current animate-pulse" />
                <p className="text-sm font-semibold">{customerCountWarning.message}</p>
              </div>
              <Badge variant={customerCountWarning.severity === 'destructive' ? 'destructive' : 'secondary'}>
                Subscription Limit: 130
              </Badge>
            </div>
          )}

          {/* CRM Sub-Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/10 p-2 rounded-2xl border border-white/5 mb-8">
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'top100', label: 'Top 100 Customers', icon: Award },
                { id: 'active', label: 'Active Status', icon: Users },
                { id: 'recent', label: 'Recent Cohort', icon: Calendar },
                { id: 'sales', label: 'Sales Performance', icon: TrendingUp },
                { id: 'timeline', label: 'Update Timeline', icon: Clock },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    onClick={() => setCrmTab(tab.id as any)}
                    variant={crmTab === tab.id ? 'default' : 'ghost'}
                    className="h-10 rounded-xl px-4 gap-2 font-bold text-xs transition-all"
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </Button>
                );
              })}
            </div>

            {/* Sub-tab controls */}
            {crmTab === 'active' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-semibold">Active in:</span>
                <Select value={String(activeDays)} onValueChange={(val) => setActiveDays(Number(val))}>
                  <SelectTrigger className="w-[120px] h-9 rounded-lg border-white/5 bg-background">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="60">Last 60 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {crmTab === 'recent' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-semibold">Joined in:</span>
                <Select value={String(recentMonthOffset)} onValueChange={(val) => setRecentMonthOffset(Number(val))}>
                  <SelectTrigger className="w-[150px] h-9 rounded-lg border-white/5 bg-background">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 3 }).map((_, offset) => {
                      const date = new Date();
                      date.setMonth(date.getMonth() - offset);
                      const label = date.toLocaleDateString('default', { month: 'long', year: 'numeric' });
                      return (
                        <SelectItem key={offset} value={String(offset)}>
                          {label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Sub-Tab content */}
          {allCustomersLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-sm text-muted-foreground font-medium">Crunching customer analytics...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {crmTab === 'top100' && renderTop100()}
              {crmTab === 'active' && renderActive()}
              {crmTab === 'recent' && renderRecent()}
              {crmTab === 'sales' && renderSales()}
              {crmTab === 'timeline' && renderTimeline()}
            </div>
          )}
        </FadeIn>
      )}

        {/* Customer Dialogs */}
      <CustomerDialogs
        isCreateDialogOpen={isCreateDialogOpen}
        onCloseCreateDialog={() => setIsCreateDialogOpen(false)}
        isEditDialogOpen={isEditDialogOpen}
        onCloseEditDialog={() => setIsEditDialogOpen(false)}
        isViewDialogOpen={isViewDialogOpen}
        onCloseViewDialog={() => setIsViewDialogOpen(false)}
        selectedCustomer={selectedCustomer}
        onCreateCustomer={handleCreateCustomer}
        onEditCustomer={handleUpdateCustomer}
        onDeleteCustomer={handleDeleteCustomer}
        isCreating={createCustomerMutation.isPending}
        isUpdating={editCustomerMutation.isPending}
        orders={[]} 
      />

      {/* Pagination Controls */}
      {viewMode === 'directory' && !customersLoading && filteredCustomers.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pb-12">
          <p className="text-sm text-muted-foreground order-2 sm:order-1">
            Showing <span className="font-medium text-foreground">{(page - 1) * pageSize + 1}</span> to{' '}
            <span className="font-medium text-foreground">{Math.min(page * pageSize, metrics.totalCustomers)}</span> of{' '}
            <span className="font-medium text-foreground">{metrics.totalCustomers}</span> customers
          </p>
          <div className="flex items-center gap-2 order-1 sm:order-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={!hasPrevPage}
              className="gap-1 h-9"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center justify-center min-w-[32px] font-medium text-sm">
              {page}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={!hasNextPage}
              className="gap-1 h-9"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      {/* Import Dialog */}
      {isImportDialogOpen && (
        <ImportCustomerModal
          isOpen={isImportDialogOpen}
          onClose={() => setIsImportDialogOpen(false)}
          onDownloadTemplate={downloadTemplate}
          onImport={(data: any) => {
            customersApi.importMany(data).then((res) => {
              toast({
                title: "Import Successful",
                description: `Imported ${res.inserted_count} customers. ${res.skipped_phones.length} duplicates skipped.`,
              });
              queryClient.invalidateQueries({ queryKey: ["customers"] });
              setIsImportDialogOpen(false);
            }).catch(err => {
              toast({
                title: "Import Failed",
                description: err.message,
                variant: "destructive"
              });
            });
          }}
        />
      )}
      </div>
    </PageTransition>
  );
}

// Separate component for Import Modal for cleaner code
function ImportCustomerModal({ isOpen, onClose, onDownloadTemplate, onImport }: any) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsProcessing(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Map Excel columns to Customer fields with more flexibility
        const mappedData = jsonData.map((row: any) => {
          // Normalize column access
          const getValue = (keys: string[]) => {
            for (const key of keys) {
              if (row[key] !== undefined && row[key] !== null) return row[key];
            }
            return undefined;
          };

          const name = getValue(['Name*', 'Name', 'Full Name', 'Customer Name', 'name']);
          const phone = String(getValue(['Phone*', 'Phone', 'Mobile', 'Contact', 'phone', 'Mobile Number']) || '').trim();
          
          if (!name || !phone) return null;

          const phoneClean = phone.replace(/\D/g, "");
          const phoneNormalized = (phoneClean.length === 12 && phoneClean.startsWith('91')) 
            ? phoneClean.slice(2) 
            : (phoneClean.length === 11 && phoneClean.startsWith('0')) 
              ? phoneClean.slice(1) 
              : phoneClean;

          if (phoneNormalized.length !== 10) return null; // Skip invalid phone rows

          const emailRaw = getValue(['Email', 'email', 'E-mail']);
          const emailVal = emailRaw ? String(emailRaw).trim() : '';
          const isValidEmail = !emailVal || /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(emailVal);

          return {
            name: String(name).trim(),
            phone: phoneNormalized,
            email: isValidEmail && emailVal ? emailVal : undefined,
            address: createAddressObject({
              street: String(getValue(['Address Street', 'Street', 'Address Line 1', 'address_street']) || '').trim(),
              city: String(getValue(['Address City', 'City', 'address_city']) || 'Pollachi').trim(),
              pincode: String(getValue(['Address Pincode', 'Pincode', 'Zip Code', 'address_pincode']) || '').trim(),
            }),
            notes: getValue(['Notes', 'Notes', 'Remarks', 'notes']),
            companyName: getValue(['Company Name', 'Company', 'company_name']),
            taxId: getValue(['Tax ID', 'TaxID', 'GST No', 'GST', 'tax_id']),
            dateOfBirth: getValue(['Date of Birth (YYYY-MM-DD)', 'Birthday', 'DOB', 'date_of_birth']),
            creditLimit: String(getValue(['Credit Limit', 'CreditLimit', 'Limit', 'credit_limit']) || '1000').trim(),
            status: getValue(['Status', 'Account Status', 'status']) || 'active',
            paymentTerms: getValue(['Payment Terms', 'Terms', 'payment_terms']),
            franchiseId: getValue(['Franchise ID', 'Franchise', 'franchise_id']),
            totalOrders: getValue(['Total Orders', 'Orders', 'total_orders']),
            totalSpent: getValue(['Total Spent', 'Revenue', 'LTV', 'total_spent']),
          };
        }).filter(Boolean); // Filter out rows with missing required fields

        if (mappedData.length === 0) {
          throw new Error("No valid customer data found. Ensure Name and Phone columns exist.");
        }

        onImport(mappedData);
      } catch (err: any) {
        alert("Error parsing file: " + err.message);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Import Customers
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={isProcessing}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Upload an Excel or CSV file to import customers in bulk.
            </p>
            <Button variant="link" size="sm" onClick={onDownloadTemplate} className="text-primary font-medium gap-2">
              <Download className="h-4 w-4" />
              Download Template
            </Button>
          </div>

          <div 
            className={`border-2 border-dashed rounded-lg p-10 text-center transition-all cursor-pointer hover:bg-muted/50 ${file ? 'border-primary/50 bg-primary/5' : 'border-muted-foreground/20'}`}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <input 
              type="file" 
              id="file-upload" 
              className="hidden" 
              accept=".xlsx, .xls, .csv" 
              onChange={handleFileChange}
            />
            {file ? (
              <div className="space-y-4">
                <FileSpreadsheet className="h-12 w-12 text-primary mx-auto" />
                <div>
                  <p className="font-semibold text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setFile(null); }} className="h-8 text-destructive">
                  Remove file
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground mt-1">Excel or CSV files only</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!file || isProcessing}
              className="gradient-primary relative"
            >
              {isProcessing ? (
                <>
                  <span className="animate-spin mr-2">◌</span>
                  Importing...
                </>
              ) : (
                'Import Now'
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
