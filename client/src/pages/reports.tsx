import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDownRight, ArrowUpRight, BadgeIndianRupee, BarChart3, BrainCircuit, ChevronDown, CircleDollarSign, Download, FileSpreadsheet, LineChart, Loader2, Package2, Sparkles, TrendingUp, Users, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { authorizedFetch } from '@/lib/data-service';
import { exportToExcelAdvanced } from '@/lib/excel-export-service';
import { generateExecutiveOverviewReport, generateFinanceReport, generateOperationsReport, generateStorePerformanceReport } from '@/lib/pdf-templates';
import { REFRESH_DATA_EVENT } from '@/lib/shortcut-events';
import { useToast } from '@/hooks/use-toast';

const CHART_COLORS = ['#4f8cff', '#34c38f', '#f5b74f', '#fb8c4c', '#9b8cff', '#56cfe1'];

const CustomAxisTick = ({ x, y, payload, vertical, ...props }: any) => {
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={vertical ? 4 : 12}
        textAnchor={vertical ? "end" : "middle"}
        fill="currentColor"
        className="text-[10px] font-bold text-muted-foreground/90"
        {...props}
      >
        {payload.value}
      </text>
    </g>
  );
};

const CustomYAxisTick = ({ x, y, payload, formatter, ...props }: any) => {
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={-10}
        y={4}
        textAnchor="end"
        fill="currentColor"
        className="text-[10px] font-bold text-muted-foreground/90"
        {...props}
      >
        {formatter ? formatter(payload.value) : payload.value}
      </text>
    </g>
  );
};

type OverviewResponse = {
  meta: {
    generatedAt: string;
    startDate: string;
    endDate: string;
    days: number;
    scopedStore: string | null;
  };
  summary: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalEmployees: number;
    averageOrderValue: number;
    completedOrders: number;
    pendingOrders: number;
    creditOutstanding: number;
    walletBalance: number;
    revenueDelta: number;
    ordersDelta: number;
    customersDelta: number;
    completionRate: number;
  };
  insights: Array<{
    id: string;
    severity: 'low' | 'medium' | 'high';
    title: string;
    summary: string;
    action: string;
  }>;
  franchisePerformance: Array<{
    franchiseCode: string;
    franchiseName: string;
    storeName: string;
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalEmployees: number;
    avgOrderValue: number;
    completedOrders: number;
    pendingOrders: number;
    creditOutstanding: number;
    topService: string;
    lastOrderAt: string | null;
    revenueShare: number;
    orderShare?: number;
  }>;
  employeePerformance: Array<{
    employeeId: string;
    employeeCode: string;
    name: string;
    role: string;
    storeCode: string;
    totalOrders: number;
    revenueGenerated: number;
    completionRate: number;
    avgOrderValue: number;
  }>;
  dailySummary: Array<{
    date: string;
    totalRevenue: number;
    totalOrders: number;
    completedOrders: number;
    averageOrderValue: number;
  }>;
  topServices: Array<{
    name: string;
    orderCount: number;
    itemCount: number;
    revenue: number;
    customersCount: number;
    avgTicket: number;
    topStore: string;
  }>;
  topCustomers: Array<{
    customerKey: string;
    customerId: string | null;
    customerName: string;
    phone: string;
    orders: number;
    revenue: number;
    avgOrderValue: number;
    creditBalance: number;
    walletBalance: number;
    lastOrderAt: string | null;
    topServices: string[];
  }>;
  pnl: {
    revenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    totalOrders: number;
    expenseByCategory: Record<string, number>;
    expenses: Array<{
      id: string;
      amount: number;
      category: string;
      note?: string;
      incurred_at: string;
      store_code?: string;
    }>;
  };
  serviceMix: Array<{
    name: string;
    label: string;
    value: number;
    revenue: number;
    share: number;
  }>;
};

type DetailTarget =
  | { type: 'metric'; key: string; title: string }
  | { type: 'customer'; key: string; title: string }
  | { type: 'service'; key: string; title: string }
  | { type: 'franchise'; key: string; title: string };

const RANGE_OPTIONS = [
  { value: '1', label: 'Day-wise Sales' },
  { value: '7', label: 'Weekly Sales' },
  { value: '14', label: 'Fortnightly Sales' },
  { value: '30', label: 'Monthly Sales' },
  { value: '90', label: 'Quarterly Sales' },
  { value: '365', label: 'Year-on Sales' },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const formatCompactCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(amount || 0));

const formatDate = (value?: string | null) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getDeltaTone = (value: number) => {
  if (value > 0) return 'text-emerald-500';
  if (value < 0) return 'text-rose-500';
  return 'text-muted-foreground';
};

const getSignalTone = (severity: string) => {
  if (severity === 'high') return 'border-destructive/20 bg-destructive/5 text-destructive dark:text-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10';
  if (severity === 'medium') return 'border-warning/20 bg-warning/5 text-warning dark:text-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10';
  return 'border-success/20 bg-success/5 text-success dark:text-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10';
};

const createExpense = async (payload: Record<string, any>) => {
  const response = await authorizedFetch('/reports/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.message || data?.error || 'Failed to save expense');
  }
  return (await response.json()).data;
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await authorizedFetch(url);
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload?.message || payload?.error || 'Failed to load report data');
  }
  const payload = await res.json();
  return payload.data as T;
}

function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center rounded-3xl border border-border bg-muted/20">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {label}
      </div>
    </div>
  );
}

function DetailMetricContent({ metricKey, overview }: { metricKey: string; overview: OverviewResponse }) {
  const { summary, pnl, dailySummary, topCustomers, topServices, franchisePerformance } = overview;

  if (metricKey === 'revenue') {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border bg-muted/20">
            <CardContent className="pt-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Range Revenue</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{formatCurrency(summary.totalRevenue)}</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-muted/20">
            <CardContent className="pt-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Average Ticket</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{formatCurrency(summary.averageOrderValue)}</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-muted/20">
            <CardContent className="pt-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Best Store</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{franchisePerformance[0]?.storeName || 'Not available'}</p>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Top Stores By Revenue</h4>
          <div className="space-y-3">
            {franchisePerformance.slice(0, 5).map((store) => (
              <div key={store.franchiseCode} className="rounded-2xl border border-border bg-muted/20 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-foreground">{store.storeName}</p>
                    <p className="text-sm text-muted-foreground">{store.totalOrders} orders</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{formatCurrency(store.totalRevenue)}</p>
                    <p className="text-xs text-muted-foreground">{store.revenueShare.toFixed(1)}% share</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (metricKey === 'orders') {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Orders In Range</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{summary.totalOrders}</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Completed</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{summary.completedOrders}</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Still Open</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{summary.pendingOrders}</p>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Daily Order Load</h4>
          <div className="space-y-3">
            {[...dailySummary].reverse().slice(0, 8).map((day) => (
              <div key={day.date} className="flex items-center justify-between rounded-2xl border border-border bg-muted/20 p-4">
                <div>
                  <p className="font-medium text-foreground">{formatDate(day.date)}</p>
                  <p className="text-sm text-muted-foreground">{day.completedOrders} completed</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">{day.totalOrders} orders</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(day.averageOrderValue)} avg ticket</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (metricKey === 'customers') {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Active Customers</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{summary.totalCustomers}</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Outstanding Credit</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{formatCurrency(summary.creditOutstanding)}</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Wallet Balance Held</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{formatCurrency(summary.walletBalance)}</p>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Highest Value Customers</h4>
          <div className="space-y-3">
            {topCustomers.slice(0, 8).map((customer) => (
              <div key={customer.customerKey} className="rounded-2xl border border-border bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-foreground">{customer.customerName}</p>
                    <p className="text-sm text-muted-foreground">{customer.phone || 'No phone'} • {customer.orders} orders</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{formatCurrency(customer.revenue)}</p>
                    <p className="text-xs text-muted-foreground">Credit {formatCurrency(customer.creditBalance)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Net Profit</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">{formatCurrency(pnl.netProfit)}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Profit Margin</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">{pnl.profitMargin.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Top Revenue Service</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{topServices[0]?.name || 'Not available'}</p>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Expense Breakdown</h4>
        <div className="space-y-3">
          {Object.entries(pnl.expenseByCategory || {}).sort((a, b) => b[1] - a[1]).map(([category, amount]) => (
            <div key={category} className="flex items-center justify-between rounded-2xl border border-border bg-muted/20 p-4">
              <p className="font-medium text-foreground capitalize">{category.replace(/_/g, ' ')}</p>
              <p className="font-semibold text-foreground">{formatCurrency(amount)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [rangeDays, setRangeDays] = useState('30');
  const [detailTarget, setDetailTarget] = useState<DetailTarget | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExpenseSheetOpen, setIsExpenseSheetOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    category: '',
    note: '',
    incurredAt: new Date().toISOString().slice(0, 10),
    storeCode: '',
  });

  useEffect(() => {
    document.title = 'Reports | FabzClean';
  }, []);

  useEffect(() => {
    const handleRefreshData = (event: Event) => {
      event.preventDefault();
      void queryClient.invalidateQueries({ queryKey: ['reports-overview'] });
    };

    window.addEventListener(REFRESH_DATA_EVENT, handleRefreshData);
    return () => window.removeEventListener(REFRESH_DATA_EVENT, handleRefreshData);
  }, [queryClient]);

  const createExpenseMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      toast({
        title: 'Expense added',
        description: 'The new expense has been recorded and report data is refreshing.',
      });
      setIsExpenseSheetOpen(false);
      setExpenseForm({ amount: '', category: '', note: '', incurredAt: new Date().toISOString().slice(0, 10), storeCode: '' });
      void queryClient.invalidateQueries({ queryKey: ['reports-overview'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to add expense',
        description: error?.message || 'Could not save the expense entry.',
        variant: 'destructive',
      });
    },
  });

  const handleCreateExpense = useCallback(() => {
    const amount = Number(expenseForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Enter a valid expense amount greater than zero.',
        variant: 'destructive',
      });
      return;
    }

    createExpenseMutation.mutate({
      amount,
      category: (expenseForm.category || 'other').trim().toLowerCase(),
      note: expenseForm.note?.trim() || null,
      incurredAt: expenseForm.incurredAt || undefined,
      storeCode: expenseForm.storeCode?.trim().toUpperCase() || null,
    });
  }, [createExpenseMutation, expenseForm, toast]);

  const handleProcessReport = useCallback(async () => {
    setIsProcessing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['reports-overview'] });
      toast({
        title: 'Report refreshed',
        description: 'Report metrics have been updated with latest data.',
      });
    } catch (error: any) {
      toast({
        title: 'Processing failed',
        description: error?.message || 'Unable to refresh report data.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [queryClient, toast]);

  const { data: overview, isLoading, isFetching } = useQuery({
    queryKey: ['reports-overview', rangeDays],
    queryFn: () => fetchJson<OverviewResponse>(`/reports/overview?days=${rangeDays}`),
    staleTime: 20_000,
  });

  const selectedRangeOption = useMemo(
    () => RANGE_OPTIONS.find((option) => option.value === rangeDays),
    [rangeDays],
  );

  const detailQuery = useQuery({
    queryKey: ['report-detail', detailTarget?.type, detailTarget?.key],
    enabled: Boolean(detailTarget && detailTarget.type !== 'metric'),
    queryFn: async () => {
      if (!detailTarget || detailTarget.type === 'metric') return null;
      if (detailTarget.type === 'customer') {
        return fetchJson<any>(`/reports/details/customer/${encodeURIComponent(detailTarget.key)}`);
      }
      if (detailTarget.type === 'service') {
        return fetchJson<any>(`/reports/details/service?name=${encodeURIComponent(detailTarget.key)}`);
      }
      return fetchJson<any>(`/reports/details/franchise/${encodeURIComponent(detailTarget.key)}`);
    },
  });

  const handleExportExcel = useCallback(() => {
    if (!overview) return;

    const summaryRows = [
      { metric: 'Total Revenue', value: overview.summary.totalRevenue },
      { metric: 'Orders Processed', value: overview.summary.totalOrders },
      { metric: 'Active Customers', value: overview.summary.totalCustomers },
      { metric: 'Completed Orders', value: overview.summary.completedOrders },
      { metric: 'Pending Orders', value: overview.summary.pendingOrders },
      { metric: 'Credit Outstanding', value: overview.summary.creditOutstanding },
      { metric: 'Average Order Value', value: overview.summary.averageOrderValue },
      { metric: 'Net Profit', value: overview.pnl.netProfit },
      { metric: 'Total Expenses', value: overview.pnl.totalExpenses },
      { metric: 'Profit Margin', value: overview.pnl.profitMargin },
    ];

    const expenseCategoryRows = Object.entries(overview.pnl.expenseByCategory || {}).map(([category, amount]) => ({
      category: category.replace(/_/g, ' '),
      amount,
    }));

    const expenseRows = overview.pnl.expenses.map((expense) => ({
      date: expense.incurred_at ? formatDate(expense.incurred_at) : '',
      category: expense.category,
      store: expense.store_code || '',
      amount: expense.amount,
      note: expense.note || '',
    }));

    exportToExcelAdvanced({
      filename: `FabClean_Report_${overview.meta.startDate}_${overview.meta.endDate}`,
      companyName: 'Fab Clean',
      title: `Fab Clean Report ${overview.meta.startDate} to ${overview.meta.endDate}`,
      filterInfo: `${selectedRangeOption?.label || `Last ${rangeDays} days`}${overview.meta.scopedStore ? ` • ${overview.meta.scopedStore}` : ''}`,
      sheets: [
        {
          name: 'Summary',
          columns: [
            { header: 'Metric', key: 'metric', width: 32, align: 'left' },
            { header: 'Value', key: 'value', width: 20, format: 'currency', align: 'right' },
          ],
          data: summaryRows,
        },
        {
          name: 'Expense Categories',
          columns: [
            { header: 'Category', key: 'category', width: 32, align: 'left' },
            { header: 'Amount', key: 'amount', width: 20, format: 'currency', align: 'right' },
          ],
          data: expenseCategoryRows,
          summary: [{ label: 'Total Expenses', value: overview.pnl.totalExpenses, format: 'currency' }],
        },
        {
          name: 'Expense Entries',
          columns: [
            { header: 'Date', key: 'date', width: 16, format: 'date', align: 'left' },
            { header: 'Category', key: 'category', width: 25, align: 'left' },
            { header: 'Store', key: 'store', width: 18, align: 'left' },
            { header: 'Amount', key: 'amount', width: 18, format: 'currency', align: 'right' },
            { header: 'Note', key: 'note', width: 36, align: 'left' },
          ],
          data: expenseRows,
        },
      ],
    });

    toast({
      title: 'Excel export ready',
      description: 'Report workbook generated successfully.',
    });
  }, [overview, rangeDays, selectedRangeOption, toast]);

  const pieData = useMemo(() => {
    if (!overview?.serviceMix?.length) return [];
    return overview.serviceMix;
  }, [overview]);

  const pieChartData = useMemo(() => {
    return pieData.filter((item) => item.value > 0);
  }, [pieData]);

  if (!overview && isLoading) {
    return (
      <div className="container-desktop space-y-6 py-8">
        <LoadingBlock label="Building the live reporting view..." />
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="container-desktop py-8">
        <Card className="border-rose-500/20 bg-rose-500/10">
          <CardContent className="pt-6 text-sm text-rose-100">
            Reporting data could not be loaded right now.
          </CardContent>
        </Card>
      </div>
    );
  }

  const { summary, insights, franchisePerformance, dailySummary, topServices, topCustomers, employeePerformance, pnl, meta } = overview;

  return (
    <div className="container-desktop space-y-8 py-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-3">
          <Badge className="w-fit rounded-full border border-[#c2d44e]/30 bg-[#c2d44e]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#d2e46b]">
            Live Reporting Workspace
          </Badge>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Operations dashboard for Fab Clean.</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>Window: {formatDate(meta.startDate)} to {formatDate(meta.endDate)}</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span>Generated {new Date(meta.generatedAt).toLocaleString('en-IN')}</span>
            {meta.scopedStore && (
              <>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span>Scoped to {meta.scopedStore}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={rangeDays} onValueChange={setRangeDays}>
            <SelectTrigger className="w-[170px] border-border bg-card text-foreground">
              <SelectValue placeholder="Select window" />
            </SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              className="border-border bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleProcessReport}
              disabled={isProcessing}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {isProcessing ? 'Refreshing...' : 'Refresh Report'}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="border-border bg-card text-foreground hover:bg-muted" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export report
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-card border border-border">
                <DropdownMenuLabel>Download outputs</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => generateExecutiveOverviewReport(overview)}>
                  Executive PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => generateOperationsReport(overview)}>
                  Operations PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => generateStorePerformanceReport(overview)}>
                  Store PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => generateFinanceReport(overview)}>
                  Finance PDF
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExportExcel}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Excel workbook
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              className="border-border bg-card text-foreground hover:bg-muted"
              onClick={() => setIsExpenseSheetOpen(true)}
            >
              <BadgeIndianRupee className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            key: 'revenue',
            title: 'Revenue In Window',
            value: formatCurrency(summary.totalRevenue),
            delta: summary.revenueDelta,
            note: `${formatCurrency(summary.averageOrderValue)} average ticket`,
            icon: BadgeIndianRupee,
          },
          {
            key: 'orders',
            title: 'Orders Processed',
            value: summary.totalOrders.toLocaleString(),
            delta: summary.ordersDelta,
            note: `${summary.pendingOrders} still open`,
            icon: Package2,
          },
          {
            key: 'customers',
            title: 'Active Customers',
            value: summary.totalCustomers.toLocaleString(),
            delta: summary.customersDelta,
            note: `${formatCurrency(summary.creditOutstanding)} credit due`,
            icon: Users,
          },
          {
            key: 'finance',
            title: 'Net Profit',
            value: formatCurrency(pnl.netProfit),
            delta: pnl.profitMargin,
            note: `${pnl.profitMargin.toFixed(1)}% margin`,
            icon: BadgeIndianRupee,
          },
        ].map((metric) => {
          const Icon = metric.icon;
          const deltaPositive = metric.key === 'finance' ? metric.delta >= 0 : metric.delta >= 0;
          return (
            <button
              key={metric.key}
              type="button"
              onClick={() => setDetailTarget({ type: 'metric', key: metric.key, title: metric.title })}
              className="group text-left"
            >
              <Card className="h-full border-border bg-card transition duration-200 hover:border-primary/40 hover:shadow-lg dark:hover:shadow-[0_24px_80px_rgba(10,17,34,0.4)]">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">{metric.title}</p>
                      <p className="text-3xl font-semibold text-foreground">{metric.value}</p>
                      <div className={`flex items-center gap-1 text-sm ${getDeltaTone(metric.delta)}`}>
                        {deltaPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                        <span>{Math.abs(metric.delta).toFixed(1)}%</span>
                        <span className="text-muted-foreground font-medium text-xs">vs last window</span>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border bg-primary/5 p-3 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-5 text-sm text-muted-foreground">{metric.note}</p>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        {insights.map((signal) => (
          <Card key={signal.id} className={`border ${getSignalTone(signal.severity)}`}>
            <CardContent className="pt-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <Badge variant="outline" className="border-current/30 bg-transparent text-[10px] uppercase tracking-[0.24em]">
                  Signal
                </Badge>
                <BrainCircuit className="h-4 w-4 opacity-70" />
              </div>
              <h3 className="text-base font-bold">{signal.title}</h3>
              <p className="mt-2 text-sm leading-6 font-medium">{signal.summary}</p>
              <p className="mt-4 text-xs font-black uppercase tracking-[0.18em]">{signal.action}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex w-full overflow-x-auto no-scrollbar justify-start gap-2 rounded-2xl border border-border bg-muted/50 p-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stores">Stores</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-foreground">Revenue Flow</CardTitle>
                  <CardDescription className="text-muted-foreground">Daily revenue and order movement for the selected window.</CardDescription>
                </div>
                {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </CardHeader>
              <CardContent>
                <div className="rounded-2xl bg-muted/60 p-4">
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={dailySummary}>
                    <defs>
                      <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" opacity={0.8} vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tick={<CustomAxisTick />} 
                      tickLine={false} 
                      axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }} 
                    />
                    <YAxis 
                      tick={<CustomYAxisTick formatter={(value: any) => `Rs. ${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`} />} 
                      tickLine={false} 
                      axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }} 
                    />
                    <Tooltip
                      contentStyle={{ 
                        background: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))', 
                        borderRadius: 12,
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        padding: '8px 12px'
                      }}
                      itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 700, fontSize: 12 }}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600, fontSize: 11, marginBottom: 4 }}
                      formatter={(value: number, name: string) => [name === 'totalRevenue' ? formatCurrency(value) : value, name === 'totalRevenue' ? 'Revenue' : 'Orders']}
                    />
                    <Area type="monotone" dataKey="totalRevenue" stroke="hsl(var(--primary))" strokeWidth={3} fill="url(#revenueFill)" />
                    <Bar dataKey="totalOrders" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} barSize={20} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Order Share By Store</CardTitle>
                <CardDescription className="text-muted-foreground">Fixed labels, readable share, and drill-down on click.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={72}
                      outerRadius={104}
                      paddingAngle={2}
                      stroke="hsl(var(--border) / 0.2)"
                      label={false}
                      labelLine={false}
                      onClick={(payload) => setDetailTarget({ type: 'franchise', key: payload?.name, title: payload?.label || payload?.name })}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, _name: string, payload: any) => [`${value} orders`, payload?.payload?.label || payload?.payload?.name]}
                      contentStyle={{ 
                        background: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))', 
                        borderRadius: 12,
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        padding: '8px 12px'
                      }}
                      itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600, fontSize: 12 }}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 500, fontSize: 11, marginBottom: 4 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid gap-2 sm:grid-cols-2">
                  {pieData.map((entry, index) => (
                    <button
                      key={entry.name}
                      type="button"
                      onClick={() => setDetailTarget({ type: 'franchise', key: entry.name, title: entry.label || entry.name })}
                      className="flex items-center justify-between rounded-2xl border border-border bg-muted/50 px-4 py-3 text-left transition hover:border-primary/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                        <div>
                          <p className="font-medium text-foreground">{entry.label}</p>
                          <p className="text-[10px] font-bold text-muted-foreground/80">{entry.value} orders</p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{entry.share.toFixed(1)}%</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stores" className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Store Performance</CardTitle>
              <CardDescription className="text-muted-foreground">Revenue, volume, backlog, credit exposure, and top service per store.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-2xl bg-muted/60 p-4">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={franchisePerformance}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" opacity={0.8} vertical={false} />
                  <XAxis 
                    dataKey="franchiseCode" 
                    tick={<CustomAxisTick />} 
                    tickLine={false} 
                    axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }} 
                  />
                  <YAxis 
                    tick={<CustomYAxisTick formatter={(value: any) => `Rs. ${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`} />} 
                    tickLine={false} 
                    axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))', 
                      borderRadius: 12,
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      padding: '8px 12px'
                    }}
                    itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 700, fontSize: 12 }}
                    labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600, fontSize: 11, marginBottom: 4 }}
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']} 
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    wrapperStyle={{ paddingTop: '20px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  />
                  <Bar 
                    name="Total Revenue"
                    dataKey="totalRevenue" 
                    radius={[6, 6, 0, 0]} 
                    fill="hsl(var(--primary))" 
                    barSize={40}
                    onClick={(payload) => setDetailTarget({ type: 'franchise', key: payload.franchiseCode, title: payload.storeName })} 
                  />
                </BarChart>
                </ResponsiveContainer>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Store</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Avg Ticket</TableHead>
                    <TableHead className="text-right">Customers</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                    <TableHead>Top Service</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {franchisePerformance.map((store) => (
                    <TableRow key={store.franchiseCode} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetailTarget({ type: 'franchise', key: store.franchiseCode, title: store.storeName })}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{store.storeName}</p>
                          <p className="text-xs text-muted-foreground">{store.franchiseCode}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{store.totalOrders}</TableCell>
                      <TableCell className="text-right">{formatCurrency(store.totalRevenue)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(store.avgOrderValue)}</TableCell>
                      <TableCell className="text-right">{store.totalCustomers}</TableCell>
                      <TableCell className="text-right">{store.pendingOrders}</TableCell>
                      <TableCell>{store.topService}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Service Performance</CardTitle>
              <CardDescription className="text-muted-foreground">Click a service to inspect customers, store mix, and recent order usage.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead className="text-right">Pieces</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Customers</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Avg Ticket</TableHead>
                    <TableHead>Lead Store</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topServices.map((service) => (
                    <TableRow key={service.name} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetailTarget({ type: 'service', key: service.name, title: service.name })}>
                      <TableCell className="font-medium text-foreground">{service.name}</TableCell>
                      <TableCell className="text-right">{service.itemCount}</TableCell>
                      <TableCell className="text-right">{service.orderCount}</TableCell>
                      <TableCell className="text-right">{service.customersCount}</TableCell>
                      <TableCell className="text-right">{formatCurrency(service.revenue)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(service.avgTicket)}</TableCell>
                      <TableCell>{service.topStore}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Customer Value Table</CardTitle>
              <CardDescription className="text-muted-foreground">Click a customer row for order history, credit, wallet, and service profile.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead>Top Services</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCustomers.map((customer) => (
                    <TableRow key={customer.customerKey} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetailTarget({ type: 'customer', key: customer.customerId || customer.customerKey, title: customer.customerName })}>
                      <TableCell className="font-medium text-foreground">{customer.customerName}</TableCell>
                      <TableCell>{customer.phone || '-'}</TableCell>
                      <TableCell className="text-right">{customer.orders}</TableCell>
                      <TableCell className="text-right">{formatCurrency(customer.revenue)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(customer.creditBalance)}</TableCell>
                      <TableCell>{customer.topServices.join(', ') || 'Not enough data'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Team Output</CardTitle>
              <CardDescription className="text-muted-foreground">Orders handled, revenue touched, completion quality, and store alignment.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Completion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeePerformance.map((employee) => (
                    <TableRow key={employee.employeeId}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{employee.name}</p>
                          <p className="text-xs text-muted-foreground">{employee.employeeCode}</p>
                        </div>
                      </TableCell>
                      <TableCell>{employee.role.replace(/_/g, ' ')}</TableCell>
                      <TableCell>{employee.storeCode}</TableCell>
                      <TableCell className="text-right">{employee.totalOrders}</TableCell>
                      <TableCell className="text-right">{formatCurrency(employee.revenueGenerated)}</TableCell>
                      <TableCell className="text-right">{employee.completionRate.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-border bg-card">
              <CardContent className="pt-6">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Revenue</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">{formatCurrency(pnl.revenue)}</p>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="pt-6">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Expenses</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">{formatCurrency(pnl.totalExpenses)}</p>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="pt-6">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Net Profit</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">{formatCurrency(pnl.netProfit)}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Expense Categories</CardTitle>
              <CardDescription className="text-muted-foreground">Actual expense entries recorded in the shared expense table.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
              <div className="space-y-3">
                {Object.entries(pnl.expenseByCategory || {}).sort((a, b) => b[1] - a[1]).map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between rounded-2xl border border-border bg-muted/50 px-4 py-3">
                    <p className="font-medium capitalize text-foreground">{category.replace(/_/g, ' ')}</p>
                    <p className="font-semibold text-foreground">{formatCurrency(amount)}</p>
                  </div>
                ))}
              </div>

              <div className="overflow-hidden rounded-3xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Store</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pnl.expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell>{expense.store_code || '-'}</TableCell>
                        <TableCell className="text-right">{formatCurrency(expense.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet open={isExpenseSheetOpen} onOpenChange={setIsExpenseSheetOpen}>
        <SheetContent side="right" className="w-full border-border bg-card text-foreground sm:max-w-2xl">
          <SheetHeader className="space-y-3">
            <Badge className="w-fit rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">
              Add Expense
            </Badge>
            <SheetTitle className="text-2xl font-semibold text-foreground">Record a new expense</SheetTitle>
            <SheetDescription className="text-muted-foreground">
              Capture expense details and immediately refresh the report totals.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-8 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-muted-foreground">
                Amount
                <input
                  type="number"
                  value={expenseForm.amount}
                  onChange={(event) => setExpenseForm((prev) => ({ ...prev, amount: event.target.value }))}
                  className="h-12 w-full rounded-2xl border border-border bg-muted/20 px-4 text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-primary/50"
                  placeholder="Enter amount"
                />
              </label>
              <label className="space-y-2 text-sm text-muted-foreground">
                Category
                <input
                  type="text"
                  value={expenseForm.category}
                  onChange={(event) => setExpenseForm((prev) => ({ ...prev, category: event.target.value }))}
                  className="h-12 w-full rounded-2xl border border-border bg-muted/20 px-4 text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-primary/50"
                  placeholder="E.g. materials, payroll, utilities"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-muted-foreground">
                Date incurred
                <input
                  type="date"
                  value={expenseForm.incurredAt}
                  onChange={(event) => setExpenseForm((prev) => ({ ...prev, incurredAt: event.target.value }))}
                  className="h-12 w-full rounded-2xl border border-border bg-muted/20 px-4 text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-primary/50"
                />
              </label>
              <label className="space-y-2 text-sm text-muted-foreground">
                Store code
                <input
                  type="text"
                  value={expenseForm.storeCode}
                  onChange={(event) => setExpenseForm((prev) => ({ ...prev, storeCode: event.target.value }))}
                  className="h-12 w-full rounded-2xl border border-border bg-muted/20 px-4 text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-primary/50"
                  placeholder="Optional store" 
                />
              </label>
            </div>

            <label className="space-y-2 text-sm text-muted-foreground">
              Note
              <textarea
                value={expenseForm.note}
                onChange={(event) => setExpenseForm((prev) => ({ ...prev, note: event.target.value }))}
                className="min-h-[120px] w-full rounded-2xl border border-border bg-muted/20 px-4 py-3 text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-primary/50"
                placeholder="Reason for expense"
              />
            </label>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button variant="outline" className="border-border bg-card text-foreground hover:bg-muted" onClick={() => setIsExpenseSheetOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-[#c2d44e] text-black hover:bg-[#d5e77d]"
                onClick={handleCreateExpense}
                disabled={createExpenseMutation.isPending || !expenseForm.amount}
              >
                {createExpenseMutation.isPending ? 'Saving expense...' : 'Save expense'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={Boolean(detailTarget)} onOpenChange={(open) => !open && setDetailTarget(null)}>
        <SheetContent side="right" className="w-full border-border bg-card text-foreground sm:max-w-2xl">
          <SheetHeader className="space-y-3">
            <Badge className="w-fit rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">
              {detailTarget?.type === 'metric' ? 'Report Metric' : 'Drill Down'}
            </Badge>
            <SheetTitle className="text-2xl font-semibold text-foreground">{detailTarget?.title}</SheetTitle>
            <SheetDescription className="text-muted-foreground">
              {detailTarget?.type === 'metric'
                ? 'Live breakdown for the selected KPI card.'
                : 'Expanded reporting detail based on current live data.'}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-8">
            {detailTarget?.type === 'metric' ? (
              <DetailMetricContent metricKey={detailTarget.key} overview={overview} />
            ) : detailQuery.isLoading ? (
              <LoadingBlock label="Loading detail view..." />
            ) : detailQuery.data && detailTarget?.type === 'customer' ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="border-border bg-card">
                    <CardContent className="pt-6">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Customer Snapshot</p>
                      <p className="mt-2 text-2xl font-semibold text-foreground">{detailQuery.data.customer.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{detailQuery.data.customer.phone || 'No phone'} {detailQuery.data.customer.email ? `• ${detailQuery.data.customer.email}` : ''}</p>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-2xl border border-border bg-muted/50 p-3">
                          <p className="text-muted-foreground">Revenue</p>
                          <p className="mt-1 font-semibold text-foreground">{formatCurrency(detailQuery.data.customer.totalRevenue)}</p>
                        </div>
                        <div className="rounded-2xl border border-border bg-muted/50 p-3">
                          <p className="text-muted-foreground">Orders</p>
                          <p className="mt-1 font-semibold text-foreground">{detailQuery.data.customer.totalOrders}</p>
                        </div>
                        <div className="rounded-2xl border border-border bg-muted/50 p-3">
                          <p className="text-muted-foreground">Credit</p>
                          <p className="mt-1 font-semibold text-foreground">{formatCurrency(detailQuery.data.customer.creditBalance)}</p>
                        </div>
                        <div className="rounded-2xl border border-border bg-muted/50 p-3">
                          <p className="text-muted-foreground">Wallet</p>
                          <p className="mt-1 font-semibold text-foreground">{formatCurrency(detailQuery.data.customer.walletBalance)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border bg-card">
                    <CardHeader>
                      <CardTitle className="text-base text-foreground">Top Services</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {detailQuery.data.topServices.map((service: any) => (
                        <div key={service.name} className="flex items-center justify-between rounded-2xl border border-border bg-muted/50 px-4 py-3">
                          <p className="font-medium text-foreground">{service.name}</p>
                          <p className="font-semibold text-foreground">{formatCurrency(service.revenue)}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="text-base text-foreground">Recent Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Store</TableHead>
                          <TableHead className="text-right">Items</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailQuery.data.recentOrders.map((order: any) => (
                          <TableRow key={order.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-foreground">{order.orderNumber}</p>
                                <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                              </div>
                            </TableCell>
                            <TableCell>{order.status}</TableCell>
                            <TableCell>{order.storeCode}</TableCell>
                            <TableCell className="text-right">{order.items}</TableCell>
                            <TableCell className="text-right">{formatCurrency(order.totalAmount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            ) : detailQuery.data && detailTarget?.type === 'service' ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                  {[
                    ['Revenue', formatCurrency(detailQuery.data.service.revenue)],
                    ['Pieces', detailQuery.data.service.pieces.toString()],
                    ['Orders', detailQuery.data.service.orderCount.toString()],
                    ['Customers', detailQuery.data.service.customerCount.toString()],
                  ].map(([label, value]) => (
                    <Card key={label} className="border-border bg-card">
                      <CardContent className="pt-6">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">{label}</p>
                        <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="text-base text-foreground">Customers Ordering This Service</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead className="text-right">Orders</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailQuery.data.topCustomers.map((customer: any) => (
                          <TableRow key={customer.customerKey}>
                            <TableCell className="font-medium text-foreground">{customer.customerName}</TableCell>
                            <TableCell>{customer.phone || '-'}</TableCell>
                            <TableCell className="text-right">{customer.orders}</TableCell>
                            <TableCell className="text-right">{formatCurrency(customer.revenue)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            ) : detailQuery.data && detailTarget?.type === 'franchise' ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                  {[
                    ['Orders', detailQuery.data.franchise.totalOrders.toString()],
                    ['Revenue', formatCurrency(detailQuery.data.franchise.totalRevenue)],
                    ['Avg Ticket', formatCurrency(detailQuery.data.franchise.averageOrderValue)],
                    ['Team', detailQuery.data.franchise.activeEmployees.toString()],
                  ].map(([label, value]) => (
                    <Card key={label} className="border-border bg-card">
                      <CardContent className="pt-6">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">{label}</p>
                        <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <Card className="border-border bg-card">
                    <CardHeader>
                      <CardTitle className="text-base text-foreground">Top Services</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {detailQuery.data.topServices.map((service: any) => (
                        <div key={service.name} className="flex items-center justify-between rounded-2xl border border-border bg-muted/50 px-4 py-3">
                          <p className="font-medium text-foreground">{service.name}</p>
                          <p className="font-semibold text-foreground">{formatCurrency(service.revenue)}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  <Card className="border-border bg-card">
                    <CardHeader>
                      <CardTitle className="text-base text-foreground">Top Customers</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {detailQuery.data.topCustomers.map((customer: any) => (
                        <div key={customer.customerKey} className="flex items-center justify-between rounded-2xl border border-border bg-muted/50 px-4 py-3">
                          <div>
                            <p className="font-medium text-foreground">{customer.customerName}</p>
                            <p className="text-xs text-muted-foreground">{customer.orders} orders</p>
                          </div>
                          <p className="font-semibold text-foreground">{formatCurrency(customer.revenue)}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <Card className="border-border bg-card">
                <CardContent className="pt-6 text-sm text-muted-foreground">
                  No detail data available for this selection.
                </CardContent>
              </Card>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
