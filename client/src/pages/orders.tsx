import React, { useState, useEffect, useCallback, useMemo } from "react";
import { VirtualScroll } from "@/components/ui/virtual-scroll";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/use-notifications";
import { useInvoicePrint } from "@/hooks/use-invoice-print";
import { safeParseFloat, safeFormatDate } from "@/lib/safe-utils";

// Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageTransition, FadeIn } from "@/components/ui/page-transition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import OrderDetailsDialog from "@/components/orders/order-details-dialog";
import EditOrderDialog from "@/components/orders/edit-order-dialog";
import OrderPaymentModal from "@/components/order-payment-modal";
import * as LoadingSkeleton from "@/components/ui/loading-skeleton";

// Icons
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  MoreHorizontal,
  Eye,
  Edit,
  Printer,
  Trash2,
  Package,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  ShoppingCart,
  Users,
  Calendar as CalendarIcon,
  FileText,
  List,
  Grid3x3,
  PlusCircle,
  Settings,
  Zap,
} from "lucide-react";

// Data Service
import { ordersApi, formatCurrency, formatDate, authorizedFetch } from '@/lib/data-service';
import { exportOrdersToCSV } from '@/lib/export-utils';
import { exportOrdersEnhanced } from '@/lib/enhanced-pdf-export';
import { exportOrdersToExcel } from '@/lib/excel-exports';
import type { Order } from "@shared/schema";
import { cn } from "@/lib/utils";
import { isElectron } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

// Types
interface OrderFilters {
  status: string[];
  paymentStatus: string[];
  search: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  amountMin: string;
  amountMax: string;
}

interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

type ViewMode = 'table' | 'timeline';

function OrdersComponent() {
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  useEffect(() => {
    document.title = "Active Orders | FabzClean";
  }, []);

  // State Management
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [sortField, setSortField] = useState<keyof Order | null>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [isBulkOperationLoading, setIsBulkOperationLoading] = useState(false);
  const [filters, setFilters] = useState<OrderFilters>({
    status: [],
    paymentStatus: [],
    search: '',
    dateFrom: undefined,
    dateTo: undefined,
    amountMin: '',
    amountMax: '',
  });
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    pageSize: 25,
    totalPages: 1,
  });

  // Dialog States
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentOrder, setSelectedPaymentOrder] = useState<Order | null>(null);

  // Data Fetching with React Query
  const {
    data: orders = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['orders'],
    queryFn: ordersApi.getAll,
    staleTime: 5000,
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Deep Link Handling for Order Edit
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get('edit');

    if (editId && orders.length > 0) {
      const targetOrder = orders.find(o => o.orderNumber === editId || o.id === editId);

      if (targetOrder) {
        setEditingOrder(targetOrder);
        setIsEditDialogOpen(true);

        toast({
          title: "Order Found",
          description: `Opening editor for ${targetOrder.orderNumber}`
        });

        // Clean up URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [orders]);


  // Filtered and Sorted Orders
  const filteredOrders = useMemo(() => {
    // Pre-compute filter values once
    const searchLower = filters.search?.toLowerCase();
    const hasStatusFilter = filters.status.length > 0;
    const hasPaymentFilter = filters.paymentStatus.length > 0;
    const minAmount = filters.amountMin ? safeParseFloat(filters.amountMin) : null;
    const maxAmount = filters.amountMax ? safeParseFloat(filters.amountMax) : null;

    // Single pass filtering for better performance
    const filtered = orders.filter(order => {
      // Search filter
      if (searchLower) {
        const matchesSearch =
          order.id.toLowerCase().includes(searchLower) ||
          order.customerName.toLowerCase().includes(searchLower) ||
          order.orderNumber.toLowerCase().includes(searchLower) ||
          (order as any).customerPhone?.toLowerCase().includes(searchLower) ||
          (order as any).service?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (hasStatusFilter && !filters.status.includes(order.status)) {
        return false;
      }

      // Payment status filter
      if (hasPaymentFilter) {
        const paymentStatus = (order as any).paymentStatus || 'pending';
        if (!filters.paymentStatus.includes(paymentStatus)) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateFrom || filters.dateTo) {
        const orderDate = new Date(order.createdAt || new Date());
        const orderDateStr = orderDate.toISOString();
        if (filters.dateFrom && new Date(orderDateStr) < filters.dateFrom) return false;
        if (filters.dateTo && new Date(orderDateStr) > filters.dateTo) return false;
      }

      // Amount range filter
      const orderAmount = safeParseFloat(order.totalAmount);
      if (minAmount !== null && !isNaN(minAmount) && orderAmount < minAmount) return false;
      if (maxAmount !== null && !isNaN(maxAmount) && orderAmount > maxAmount) return false;

      return true;
    });

    // Apply sorting
    if (sortField) {
      filtered.sort((a, b) => {
        const aValue = (a as any)[sortField];
        const bValue = (b as any)[sortField];

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }

        // Handle dates
        if (aValue instanceof Date && bValue instanceof Date) {
          return sortDirection === 'asc'
            ? aValue.getTime() - bValue.getTime()
            : bValue.getTime() - aValue.getTime();
        }

        // Handle date strings
        const aDate = new Date(aValue as any);
        const bDate = new Date(bValue as any);
        if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
          return sortDirection === 'asc'
            ? aDate.getTime() - bDate.getTime()
            : bDate.getTime() - aDate.getTime();
        }

        return 0;
      });
    }

    return filtered;
  }, [orders, filters, sortField, sortDirection]);

  // Pagination
  const paginatedOrders = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return filteredOrders.slice(startIndex, endIndex);
  }, [filteredOrders, pagination]);

  // Update pagination when filtered orders change
  useEffect(() => {
    const totalPages = Math.ceil(filteredOrders.length / pagination.pageSize);
    setPagination(prev => ({
      ...prev,
      totalPages,
      currentPage: prev.currentPage > totalPages ? 1 : prev.currentPage,
    }));
  }, [filteredOrders.length, pagination.pageSize]);

  // Mutations
  const updateOrderMutation = useMutation({
    mutationFn: ({ orderId, updates }: { orderId: string; updates: Partial<Order> }) =>
      ordersApi.update(orderId, updates),
    onMutate: async ({ orderId, updates }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['orders'] });

      // Snapshot the previous value
      const previousOrders = queryClient.getQueryData<Order[]>(['orders']);

      // Optimistically update to the new value
      queryClient.setQueryData<Order[]>(['orders'], (old) => {
        if (!old) return [];
        return old.map((order) =>
          order.id === orderId ? { ...order, ...updates } : order
        );
      });

      // Close dialog immediately for "zero latency" feel
      setIsEditDialogOpen(false);
      setEditingOrder(null);

      // Return a context object with the snapshotted value
      return { previousOrders };
    },
    onSuccess: (updatedOrder, { orderId }) => {
      if (updatedOrder) {
        toast({
          title: "Order Updated",
          description: `Order ${orderId} has been updated successfully`,
        });
      }
    },
    onError: (error, _variables, context) => {
      // Rollback to the previous value
      if (context?.previousOrders) {
        queryClient.setQueryData(['orders'], context.previousOrders);
      }
      console.error('Failed to update order:', error);
      toast({
        title: "Error",
        description: "Failed to update order. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ orderId, newStatus }: { orderId: string; newStatus: string }) =>
      ordersApi.update(orderId, { status: newStatus as any }),
    onMutate: async ({ orderId, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['orders'] });
      const previousOrders = queryClient.getQueryData<Order[]>(['orders']);

      queryClient.setQueryData<Order[]>(['orders'], (old) => {
        if (!old) return [];
        return old.map((order) =>
          order.id === orderId ? { ...order, status: newStatus as any } : order
        );
      });

      return { previousOrders };
    },
    onSuccess: (updatedOrder, { orderId, newStatus }) => {
      if (updatedOrder) {
        addNotification({
          type: 'info',
          title: 'Order Status Updated',
          message: `Order ${orderId} has been moved to ${newStatus}`,
          actionUrl: '/orders',
          actionText: 'View Orders'
        });

        toast({
          title: "Order Status Updated",
          description: `Order ${orderId} moved to ${newStatus}`,
        });
      }
    },
    onError: (error, _variables, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(['orders'], context.previousOrders);
      }
      console.error('Failed to update order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const markOrderPaidMutation = useMutation({
    mutationFn: ({ orderId, paymentMethod }: { orderId: string; paymentMethod?: string }) =>
      ordersApi.markAsPaid(orderId, paymentMethod || 'cash'),
    onSuccess: (updatedOrder, { orderId }) => {
      if (!updatedOrder) {
        toast({
          title: "Payment Update Failed",
          description: "Could not mark this order as paid. Please retry.",
          variant: "destructive",
        });
        return;
      }

      queryClient.setQueryData<Order[]>(['orders'], (old) =>
        Array.isArray(old) ? old.map((order) => (order.id === orderId ? { ...order, ...updatedOrder } : order)) : old
      );
      setSelectedOrder((prev) => (prev && prev.id === orderId ? { ...prev, ...updatedOrder } : prev));

      toast({
        title: "Order Marked Paid",
        description: `Order ${updatedOrder.orderNumber || orderId} is now fully paid.`,
      });
    },
    onError: (error) => {
      console.error('Failed to mark order as paid:', error);
      toast({
        title: "Payment Update Failed",
        description: "Could not mark this order as paid.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-management', 'customers'] });
      queryClient.invalidateQueries({ queryKey: ['credits'] });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: (orderId: string) => ordersApi.delete(orderId),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: "Order Deleted",
        description: "Order has been deleted successfully",
      });
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
    },
    onError: (error) => {
      console.error('Failed to delete order:', error);
      toast({
        title: "Error",
        description: "Failed to delete order. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Event Handlers
  const handleSort = useCallback((field: keyof Order) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  const handleSelectOrder = useCallback((orderId: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedOrders.length === paginatedOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(paginatedOrders.map(order => order.id));
    }
  }, [selectedOrders.length, paginatedOrders]);

  const handleClearSelection = useCallback(() => {
    setSelectedOrders([]);
  }, []);

  const handleViewOrder = useCallback((order: Order) => {
    setSelectedOrder(order);
    setIsOrderDetailsOpen(true);
  }, []);

  const handleDeleteOrder = useCallback((orderId: string) => {
    if (window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      deleteOrderMutation.mutate(orderId);
    }
  }, [deleteOrderMutation]);

  const handleEditOrder = useCallback((order: Order) => {
    setEditingOrder(order);
    setIsEditDialogOpen(true);
  }, []);

  const handleCancelOrder = useCallback((order: Order) => {
    updateOrderStatusMutation.mutate({
      orderId: order.id,
      newStatus: 'cancelled'
    });
  }, [updateOrderStatusMutation]);

  const { printInvoice } = useInvoicePrint({
    onSuccess: (invoiceData) => {
      console.log('Invoice printed successfully:', invoiceData);
    },
    onError: (error) => {
      console.error('Invoice print failed:', error);
    }
  });

  const handlePrintInvoice = useCallback((order: Order) => {
    printInvoice(order);
  }, [printInvoice]);

  const handleNextStep = useCallback((order: Order) => {
    let nextStatus: string | null = null;
    if (order.status === 'pending') {
      nextStatus = 'processing';
    } else if (order.status === 'processing') {
      nextStatus = (order as any).fulfillmentType === 'delivery' ? 'out_for_delivery' : 'ready_for_pickup';
    } else if (order.status === 'out_for_delivery' || order.status === 'ready_for_pickup') {
      nextStatus = 'completed';
    }

    if (nextStatus) {
      updateOrderStatusMutation.mutate({
        orderId: order.id,
        newStatus: nextStatus
      });
    }
  }, [updateOrderStatusMutation]);

  const handleUpdateStatus = useCallback((orderId: string, newStatus: string) => {
    const order = orders.find(o => o.id === orderId);
    if ((newStatus === 'completed' || newStatus === 'delivered') && order && order.paymentStatus !== 'paid' && order.paymentStatus !== 'credit') {
      toast({
        title: "Cannot Complete Order",
        description: "Order must be marked as Paid or Credit before it can be completed.",
        variant: "destructive",
      });
      return;
    }
    updateOrderStatusMutation.mutate({ orderId, newStatus });
  }, [updateOrderStatusMutation, orders, toast]);

  const handleDebitFromWallet = useCallback(async (order: Order) => {
    const customerId = (order as any).customerId;
    if (!customerId) {
      toast({
        title: "Customer missing",
        description: "Cannot run wallet debit without a linked customer.",
        variant: "destructive",
      });
      return;
    }

    const total = parseFloat(order.totalAmount || "0");
    const advance = parseFloat((order as any).advancePaid || "0");
    const remaining = Math.max(0, total - advance);

    if (remaining <= 0) {
      toast({
        title: "Nothing due",
        description: "Order is already fully settled.",
      });
      return;
    }

    try {
      const res = await authorizedFetch(`/orders/${order.id}/checkout`, {
        method: "POST",
        body: JSON.stringify({
          customerId,
          cashAmount: 0,
          useWallet: true,
          walletDebitRequested: remaining,
          walletAmount: remaining, // legacy alias
          paymentMethod: "CREDIT_WALLET",
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error?.message || payload?.message || "Failed to debit wallet");
      }

      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["credits", customerId] });
      queryClient.invalidateQueries({ queryKey: ["customer", customerId] });

      const split = payload?.data?.split || {};
      toast({
        title: "Wallet debit processed",
        description: `Wallet: ₹${Number(split.walletDebited || 0).toFixed(2)} • Credit: ₹${Number(split.creditAssigned || 0).toFixed(2)}`,
      });
    } catch (error: any) {
      toast({
        title: "Wallet debit failed",
        description: error?.message || "Unable to process wallet debit.",
        variant: "destructive",
      });
    }
  }, [queryClient, toast]);

  const handleMarkOrderPaid = useCallback((order: Order, status: 'paid' | 'credit') => {
    if (status !== 'paid') {
      updateOrderMutation.mutate({
        orderId: order.id,
        updates: { paymentStatus: status as any },
      });
      return;
    }

    markOrderPaidMutation.mutate({
      orderId: order.id,
      paymentMethod: (order as any).paymentMethod || 'cash',
    });
  }, [markOrderPaidMutation, updateOrderMutation]);

  const handleBulkStatusUpdate = useCallback(async (newStatus: string) => {
    if (selectedOrders.length === 0) {
      toast({
        title: "No Orders Selected",
        description: "Please select at least one order to update.",
        variant: "destructive",
      });
      return;
    }

    setIsBulkOperationLoading(true);
    try {
      const results = await Promise.allSettled(
        selectedOrders.map(orderId =>
          ordersApi.update(orderId, { status: newStatus as any })
        )
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (successful > 0) {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        toast({
          title: "Bulk Update Complete",
          description: `${successful} orders updated${failed > 0 ? `, ${failed} failed` : ''}`,
        });
      }

      if (failed > 0 && successful === 0) {
        throw new Error('All updates failed');
      }

      setSelectedOrders([]);
    } catch (error) {
      console.error('Bulk update failed:', error);
      toast({
        title: "Error",
        description: "Failed to update orders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBulkOperationLoading(false);
    }
  }, [selectedOrders, queryClient, toast]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedOrders.length === 0) {
      toast({
        title: "No Orders Selected",
        description: "Please select at least one order to delete.",
        variant: "destructive",
      });
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedOrders.length} orders? This action cannot be undone.`)) {
      setIsBulkOperationLoading(true);
      try {
        const results = await Promise.allSettled(
          selectedOrders.map(orderId => ordersApi.delete(orderId))
        );

        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        if (successful > 0) {
          queryClient.invalidateQueries({ queryKey: ['orders'] });
          toast({
            title: "Orders Deleted",
            description: `${successful} orders deleted${failed > 0 ? `, ${failed} failed` : ''}`,
          });
        }

        if (failed > 0 && successful === 0) {
          throw new Error('All deletions failed');
        }

        setSelectedOrders([]);
      } catch (error) {
        console.error('Bulk delete failed:', error);
        toast({
          title: "Error",
          description: "Failed to delete orders. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsBulkOperationLoading(false);
      }
    }
  }, [selectedOrders, queryClient, toast]);

  const handleExportCSV = useCallback(() => {
    if (filteredOrders.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There are no orders to export.",
        variant: "destructive",
      });
      return;
    }
    exportOrdersToCSV(filteredOrders);
    toast({
      title: "Export Started",
      description: `Exporting ${filteredOrders.length} orders to CSV...`,
    });
  }, [filteredOrders, toast]);

  const handleExportPDF = useCallback(() => {
    if (filteredOrders.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There are no orders to export.",
        variant: "destructive",
      });
      return;
    }
    exportOrdersEnhanced(filteredOrders);
    toast({
      title: "PDF Export Started",
      description: `Generating enhanced PDF for ${filteredOrders.length} orders...`,
    });
  }, [filteredOrders, toast]);

  const handleExportExcel = useCallback(() => {
    if (filteredOrders.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There are no orders to export.",
        variant: "destructive",
      });
      return;
    }

    const filterInfo = {
      status: filters.status,
      paymentStatus: filters.paymentStatus,
      dateRange: filters.dateFrom || filters.dateTo
        ? `${filters.dateFrom ? formatDate(filters.dateFrom.toISOString()) : 'Any'} - ${filters.dateTo ? formatDate(filters.dateTo.toISOString()) : 'Any'}`
        : undefined,
      amountRange: filters.amountMin || filters.amountMax
        ? `${filters.amountMin || 'Any'} - ${filters.amountMax || 'Any'}`
        : undefined,
    };

    exportOrdersToExcel(filteredOrders, filterInfo);
    toast({
      title: "Excel Export Successful",
      description: `Exported ${filteredOrders.length} orders to Excel.`,
    });
  }, [filteredOrders, filters, toast]);

  const handleExportSelected = useCallback(() => {
    if (selectedOrders.length === 0) {
      toast({
        title: "No Orders Selected",
        description: "Please select orders to export.",
        variant: "destructive",
      });
      return;
    }
    const selectedOrdersData = orders.filter(order => selectedOrders.includes(order.id));
    exportOrdersEnhanced(selectedOrdersData);
    toast({
      title: "Export Started",
      description: `Exporting ${selectedOrdersData.length} selected orders...`,
    });
  }, [orders, selectedOrders, toast]);

  const handleRefresh = useCallback(() => {
    refetch();
    toast({
      title: "Data Refreshed",
      description: "Orders data has been refreshed",
    });
  }, [refetch, toast]);

  const handleSearchChange = useCallback((query: string) => {
    setFilters(prev => ({ ...prev, search: query }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  const handleStatusFilterChange = useCallback((status: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      status: checked
        ? [...prev.status, status]
        : prev.status.filter(s => s !== status)
    }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      status: [],
      paymentStatus: [],
      search: '',
      dateFrom: undefined,
      dateTo: undefined,
      amountMin: '',
      amountMax: '',
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  // Calculate Quick Stats
  const stats = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.length > 0
      ? filteredOrders.reduce((sum, order) => sum + safeParseFloat(order.totalAmount), 0)
      : 0;
    const completedOrders = filteredOrders.filter(o => o.status === 'completed').length;
    const pendingOrders = filteredOrders.filter(o => o.status === 'pending').length;
    const processingOrders = filteredOrders.filter(o => o.status === 'processing').length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const now = new Date();
    
    // Growth calculation helper
    const getGrowth = (current: number, period: 'month' | 'week' | 'day') => {
      let pastDate = new Date();
      let label = "";
      
      if (period === 'month') {
        pastDate.setMonth(now.getMonth() - 1);
        label = "from last month";
      } else if (period === 'week') {
        pastDate.setDate(now.getDate() - 7);
        label = "from last week";
      } else {
        pastDate.setDate(now.getDate() - 1);
        label = "from yesterday";
      }

      const pastOrders = orders.filter(o => new Date(o.createdAt || now) < pastDate && new Date(o.createdAt || now) >= new Date(pastDate.getTime() - (now.getTime() - pastDate.getTime())));
      
      // Simplify: Let's use a more robust comparison logic similar to AdminDashboard
      const getPeriodStats = (startDate: Date, endDate: Date) => {
        const periodOrders = orders.filter(o => {
          const d = new Date(o.createdAt || now);
          return d >= startDate && d < endDate;
        });
        return {
          count: periodOrders.length,
          revenue: periodOrders.reduce((sum, o) => sum + safeParseFloat(o.totalAmount), 0)
        };
      };

      // Current Period (Last 30 days, 7 days, or 1 day)
      const currentMonth = getPeriodStats(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), now);
      const lastMonth = getPeriodStats(new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
      
      const currentWeek = getPeriodStats(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), now);
      const lastWeek = getPeriodStats(new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
      
      const currentDay = getPeriodStats(new Date(now.getTime() - 24 * 60 * 60 * 1000), now);
      const lastDay = getPeriodStats(new Date(now.getTime() - 48 * 24 * 60 * 60 * 1000), new Date(now.getTime() - 24 * 60 * 60 * 1000));

      // Try Month -> Week -> Day
      if (lastMonth.count > 0) return { 
        orders: ((currentMonth.count - lastMonth.count) / lastMonth.count) * 100,
        revenue: lastMonth.revenue > 0 ? ((currentMonth.revenue - lastMonth.revenue) / lastMonth.revenue) * 100 : 0,
        label: "from last month"
      };
      
      if (lastWeek.count > 0) return {
        orders: ((currentWeek.count - lastWeek.count) / lastWeek.count) * 100,
        revenue: lastWeek.revenue > 0 ? ((currentWeek.revenue - lastWeek.revenue) / lastWeek.revenue) * 100 : 0,
        label: "from last week"
      };
      
      if (lastDay.count > 0) return {
        orders: ((currentDay.count - lastDay.count) / lastDay.count) * 100,
        revenue: lastDay.revenue > 0 ? ((currentDay.revenue - lastDay.revenue) / lastDay.revenue) * 100 : 0,
        label: "from yesterday"
      };

      return null;
    };

    const growth = getGrowth(totalOrders, 'month');

    return {
      totalOrders,
      totalRevenue,
      completedOrders,
      pendingOrders,
      processingOrders,
      avgOrderValue,
      ordersChange: growth?.orders ?? null,
      revenueChange: growth?.revenue ?? null,
      comparisonLabel: growth?.label ?? "No comparison data"
    };
  }, [filteredOrders, orders]);

  // ... (inside component)

  const handlePrintView = useCallback(() => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Orders Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; background: white; }

          .header {
            background: #84cc16;
            color: white;
            padding: 20px;
            margin: -20px -20px 30px -20px;
            border-bottom: 3px solid #fb923c;
          }

          .header h1 {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }

          .header .subtitle {
            font-size: 12px;
            opacity: 0.9;
          }

          .stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 25px;
          }

          .stat-box {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-left: 3px solid #84cc16;
            padding: 12px;
            border-radius: 4px;
          }

          .stat-label {
            font-size: 11px;
            color: #6b7280;
            text-transform: uppercase;
            margin-bottom: 5px;
          }

          .stat-value {
            font-size: 20px;
            font-weight: bold;
            color: #1f2937;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }

          thead {
            background: #84cc16;
            color: white;
          }

          th {
            padding: 12px 8px;
            text-align: left;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
          }

          td {
            padding: 10px 8px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 12px;
            color: #374151;
          }

          tbody tr:nth-child(even) {
            background: #f9fafb;
          }

          tbody tr:hover {
            background: #f3f4f6;
          }

          .status-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 600;
            text-transform: capitalize;
          }

          .status-pending { background: #fef3c7; color: #92400e; }
          .status-processing { background: #dbeafe; color: #1e40af; }
          .status-completed { background: #d1fae5; color: #065f46; }
          .status-cancelled { background: #fee2e2; color: #991b1b; }

          .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            font-size: 11px;
            color: #6b7280;
          }

          @media print {
            body { padding: 0; }
            .header { margin: 0 0 20px 0; }
            @page { margin: 1cm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Orders Report</h1>
          <div class="subtitle">Generated on: ${new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}</div>
        </div>

        <div class="stats">
          <div class="stat-box">
            <div class="stat-label">Total Orders</div>
            <div class="stat-value">${stats.totalOrders}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Total Revenue</div>
            <div class="stat-value">₹${stats.totalRevenue.toFixed(2)}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Completed</div>
            <div class="stat-value">${stats.completedOrders}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Avg Order Value</div>
            <div class="stat-value">₹${stats.avgOrderValue.toFixed(2)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Service</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Amount</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${filteredOrders.map(order => `
              <tr>
                <td><strong>${order.orderNumber}</strong></td>
                <td>${order.customerName}</td>
                <td>${order.service || 'N/A'}</td>
                <td><span class="status-badge status-${order.status}">${order.status}</span></td>
                <td>${order.paymentStatus || 'N/A'}</td>
                <td><strong>₹${safeParseFloat(order.totalAmount).toFixed(2)}</strong></td>
                <td>${safeFormatDate(order.createdAt, 'en-US', { dateStyle: 'medium' })}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p><strong>FabzClean - Point of Sale Management</strong></p>
          <p>Total Records: ${filteredOrders.length} | Generated: ${new Date().toLocaleDateString()}</p>
        </div>
      </body>
      </html>
    `;

    if (isElectron()) {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();

        iframe.contentWindow?.focus();
        setTimeout(() => {
          iframe.contentWindow?.print();
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 5000);
        }, 500);
      }
    } else {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  }, [filteredOrders, stats]);

  // Helper functions for status and payment status
  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'processing': return <Clock className="h-4 w-4" />;
      case 'pending': return <AlertCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200';
      case 'credit': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const hasActiveFilters = useMemo(() => {
    return filters.search ||
      filters.status.length > 0 ||
      filters.paymentStatus.length > 0 ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.amountMin ||
      filters.amountMax;
  }, [filters]);

  const ordersGridColumns = "grid-cols-[48px_140px_minmax(180px,1fr)_120px_140px_120px_110px_120px_120px_80px]";
  const ordersTableMinWidth = "min-w-[1200px]";
  const virtualTableBodyHeight = "calc(100vh - 420px)";

  const renderOrderRow = useCallback((order: Order, index: number) => {
    if (isMobile) {
      return (
        <motion.div
          key={order.id}
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.02 }}
          className={cn(
            "p-5 rounded-2xl border bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all active:scale-[0.99]",
            selectedOrders.includes(order.id) ? "ring-2 ring-primary bg-primary/5" : "hover:border-primary/20"
          )}
          onClick={() => handleViewOrder(order)}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div onClick={(e) => e.stopPropagation()} className="pt-0.5">
                <Checkbox checked={selectedOrders.includes(order.id)} onCheckedChange={() => handleSelectOrder(order.id)} />
              </div>
              <div className="min-w-0">
                <p className="font-mono font-black text-primary text-sm tracking-tighter uppercase">{order.orderNumber}</p>
                <p className="text-[11px] text-muted-foreground font-medium">{formatDate((order.createdAt || new Date()).toString())}</p>
              </div>
            </div>
            <Badge className={cn("text-[10px] uppercase font-bold px-2 py-0 h-5 border-none", getStatusColor(order.status))}>
              {order.status}
            </Badge>
          </div>

          <div className="space-y-3 mb-5">
            <div className="flex justify-between items-baseline gap-2">
              <h3 className="text-base font-bold text-foreground truncate">{order.customerName}</h3>
              <span className="text-lg font-black text-foreground shrink-0 tabular-nums">
                {formatCurrency(parseFloat(order.totalAmount || "0"))}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/30 text-[11px] text-muted-foreground">
                <Package className="h-3 w-3" />
                <span className="truncate max-w-[120px]">{(order as any).service || 'Dry Cleaning'}</span>
              </div>
              <Badge variant="outline" className={cn("text-[9px] font-bold h-5 px-1.5 py-0 border-primary/10", getPaymentStatusColor((order as any).paymentStatus || 'pending'))}>
                {(order as any).paymentStatus?.toUpperCase() || 'PENDING'}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-dashed">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-10 font-bold bg-background shadow-sm border-primary/10 hover:bg-primary/5 hover:text-primary transition-all"
              onClick={(e) => { e.stopPropagation(); handlePrintInvoice(order); }}
            >
              <Printer className="h-4 w-4 mr-2" /> Print
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                className="flex-1 h-10 font-bold"
                onClick={(e) => { e.stopPropagation(); handleEditOrder(order); }}
              >
                <Edit className="h-4 w-4 mr-2" /> Edit
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-full hover:bg-muted" onClick={(e) => e.stopPropagation()}>
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => handleViewOrder(order)}>
                    <Eye className="mr-2 h-4 w-4" /> View Details
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {order.paymentStatus !== 'paid' && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedPaymentOrder(order); setIsPaymentModalOpen(true); }}>
                      <IndianRupee className="mr-2 h-4 w-4" /> Process Payment
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => handleCancelOrder(order)} className="text-destructive focus:text-destructive">
                    <XCircle className="mr-2 h-4 w-4" /> Cancel Order
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </motion.div>
      );
    }

    return (
      <div
        key={order.id}
        className={cn(
          `grid ${ordersGridColumns} gap-4 items-center px-4 h-full border-b hover:bg-muted/50 transition-colors text-sm`,
          selectedOrders.includes(order.id) && "bg-muted"
        )}
        onClick={() => handleViewOrder(order)}
      >
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox checked={selectedOrders.includes(order.id)} onCheckedChange={() => handleSelectOrder(order.id)} />
        </div>
        <div className="min-w-0 truncate font-mono font-medium flex items-center gap-2">
          {order.orderNumber}
          {((order as any).isExpressOrder) && (
            <Badge className="bg-orange-500 text-white text-[9px] px-1.5 py-0 h-5">EXPRESS</Badge>
          )}
        </div>
        <div className="truncate flex flex-col">
          <span className="font-medium">{order.customerName}</span>
          <span className="text-[10px] text-muted-foreground font-mono leading-tight">{order.customerId || (order as any).customers?.id}</span>
        </div>
        <div className="truncate text-muted-foreground">{(order as any).service || 'Dry Cleaning'}</div>
        <div onClick={(e) => e.stopPropagation()}>
          <Badge className={cn("border gap-1.5 w-fit", getStatusColor(order.status))}>
            {getStatusIcon(order.status)} <span className="capitalize">{order.status}</span>
          </Badge>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <Badge className={cn("border w-fit", getPaymentStatusColor((order as any).paymentStatus || 'pending'))}>
            {(order as any).paymentStatus || 'Pending'}
          </Badge>
        </div>
        <div className="text-right font-semibold">
          {formatCurrency(parseFloat(order.totalAmount || "0"))}
        </div>
        <div className="text-muted-foreground truncate">{formatDate((order.createdAt || new Date()).toString())}</div>
        <div className="truncate">{(order as any).pickupDate ? formatDate(new Date((order as any).pickupDate).toString()) : 'N/A'}</div>
        <div onClick={(e) => e.stopPropagation()} className="flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="h-9 w-9 p-0 shadow-sm border hover:bg-accent transition-colors">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleViewOrder(order)}>
                <Eye className="mr-2 h-4 w-4" /> View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditOrder(order)}>
                <Edit className="mr-2 h-4 w-4" /> Edit Order
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePrintInvoice(order)}>
                <Printer className="mr-2 h-4 w-4" /> Print Invoice
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {order.status === 'processing' && <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'completed')}>Mark as Completed</DropdownMenuItem>}
              {order.paymentStatus !== 'paid' && order.paymentStatus !== 'credit' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedPaymentOrder(order); setIsPaymentModalOpen(true); }}>
                    <IndianRupee className="mr-2 h-4 w-4" /> Process Payment
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDebitFromWallet(order)} className="text-orange-600 focus:text-orange-600">
                    💳 Debit from Wallet
                  </DropdownMenuItem>
                </>
              )}
              {order.status !== 'completed' && order.status !== 'cancelled' && (
                <DropdownMenuItem onClick={() => handleCancelOrder(order)} className="text-red-600 focus:text-red-600">
                  <X className="mr-2 h-4 w-4" /> Cancel Order
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }, [isMobile, selectedOrders, ordersGridColumns, getStatusColor, getStatusIcon, getPaymentStatusColor, handleSelectOrder, handleViewOrder, handleEditOrder, handlePrintInvoice, handleUpdateStatus, handleDebitFromWallet, handleCancelOrder, setIsPaymentModalOpen, setSelectedPaymentOrder]);

  const OrderHeaders = (
    <div className={`grid ${ordersGridColumns} gap-4 items-center px-4 py-3 bg-muted/50 border-b text-xs font-medium text-muted-foreground uppercase select-none`}>
      <div><Checkbox checked={filteredOrders.length > 0 && selectedOrders.length === filteredOrders.length} onCheckedChange={handleSelectAll} /></div>
      <div className="cursor-pointer hover:text-foreground flex items-center gap-1" onClick={() => handleSort('orderNumber')}>Order # <ArrowUpDown className="h-3 w-3" /></div>
      <div className="cursor-pointer hover:text-foreground flex items-center gap-1" onClick={() => handleSort('customerName')}>Customer <ArrowUpDown className="h-3 w-3" /></div>
      <div>Service</div>
      <div className="cursor-pointer hover:text-foreground flex items-center gap-1" onClick={() => handleSort('status')}>Status <ArrowUpDown className="h-3 w-3" /></div>
      <div>Payment</div>
      <div className="cursor-pointer hover:text-foreground justify-end flex items-center gap-1" onClick={() => handleSort('totalAmount')}>Amount <ArrowUpDown className="h-3 w-3" /></div>
      <div className="cursor-pointer hover:text-foreground flex items-center gap-1" onClick={() => handleSort('createdAt')}>Date <ArrowUpDown className="h-3 w-3" /></div>
      <div className="cursor-pointer hover:text-foreground flex items-center gap-1" onClick={() => handleSort('pickupDate')}>Due Date <ArrowUpDown className="h-3 w-3" /></div>
      <div className="text-center">Actions</div>
    </div>
  );

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) {
        switch (event.key) {
          case 'f':
            event.preventDefault();
            const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
            searchInput?.focus();
            break;
          case 'r':
            event.preventDefault();
            handleRefresh();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRefresh]);

  return (
    <PageTransition>
      <div className="container-desktop min-h-screen p-3 sm:p-4 md:p-8 space-y-4 sm:space-y-8 gradient-mesh pb-24 lg:pb-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-primary/5 pb-4 lg:pb-0 lg:border-none"
        >
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-2 lg:gap-3">
              <Package className="h-6 w-6 sm:h-10 sm:w-10 text-primary" />
              Orders
            </h1>
          </div>
          <Button
            size="lg"
            className="gap-2 shadow-lg hover:shadow-xl transition-all w-full sm:w-auto shrink-0 h-11 sm:h-12 hidden sm:flex"
            onClick={() => window.location.href = '/create-order'}
          >
            <PlusCircle className="h-5 w-5" />
            Create Order
          </Button>
        </motion.div>

        {/* Quick Stats Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6"
        >
          <Card className="glass hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary shadow-xl">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                  <p className="text-xl sm:text-3xl font-bold mt-2 truncate">{stats.totalOrders}</p>
                  <div className={cn("flex items-center gap-1 mt-2 text-sm", (stats.ordersChange ?? 0) < 0 ? "text-red-500" : "text-green-600")}>
                    {stats.ordersChange !== null && (
                      <>
                        {(stats.ordersChange ?? 0) < 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                        <span className="hidden sm:inline">
                          {`${(stats.ordersChange ?? 0) > 0 ? '+' : ''}${(stats.ordersChange ?? 0).toFixed(1)}% ${stats.comparisonLabel}`}
                        </span>
                        <span className="sm:hidden">
                          {`${(stats.ordersChange ?? 0) > 0 ? '+' : ''}${(stats.ordersChange ?? 0).toFixed(1)}%`}
                        </span>
                      </>
                    )}
                    {stats.ordersChange === null && <span className="text-muted-foreground italic">No comparison data</span>}
                  </div>
                </div>
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Package className="h-7 w-7 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass hover:shadow-lg transition-all duration-300 border-l-4 border-l-accent shadow-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-xl sm:text-3xl font-bold mt-2 truncate">{formatCurrency(stats.totalRevenue)}</p>
                  <div className={cn("flex items-center gap-1 mt-2 text-sm", (stats.revenueChange ?? 0) < 0 ? "text-red-500" : "text-green-600")}>
                    {stats.revenueChange !== null && (
                      <>
                        {(stats.revenueChange ?? 0) < 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                        <span className="hidden sm:inline">
                          {`${(stats.revenueChange ?? 0) > 0 ? '+' : ''}${(stats.revenueChange ?? 0).toFixed(1)}% ${stats.comparisonLabel}`}
                        </span>
                        <span className="sm:hidden">
                          {`${(stats.revenueChange ?? 0) > 0 ? '+' : ''}${(stats.revenueChange ?? 0).toFixed(1)}%`}
                        </span>
                      </>
                    )}
                    {stats.revenueChange === null && <span className="text-muted-foreground italic">No comparison data</span>}
                  </div>
                </div>
                <div className="h-14 w-14 rounded-full bg-accent/10 flex items-center justify-center">
                  <IndianRupee className="h-7 w-7 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 shadow-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
                  <p className="text-xl sm:text-3xl font-bold mt-2 truncate">{formatCurrency(stats.avgOrderValue)}</p>
                  <div className="flex items-center gap-1 mt-2 text-sm text-blue-600">
                    <TrendingUp className="h-4 w-4" />
                    <span>Per order average</span>
                  </div>
                </div>
                <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center">
                  <ShoppingCart className="h-7 w-7 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500 shadow-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-xl sm:text-3xl font-bold mt-2 truncate">{stats.completedOrders}</p>
                  <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="truncate">{stats.pendingOrders} pending</span>
                  </div>
                </div>
                <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-7 w-7 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="shadow-xl">
            <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-accent/5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg sm:text-2xl">All Orders</CardTitle>
                  <CardDescription className="text-sm sm:text-base mt-1">
                    Showing {filteredOrders.length} of {orders.length} orders
                    {hasActiveFilters && <span className="text-primary ml-2">(Filtered)</span>}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrintView}
                    className="gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    <span className="hidden sm:inline">Print</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span className="hidden sm:inline">Refresh</span>
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-3 sm:p-6 space-y-4 sm:space-y-6">
              {/* Enhanced Toolbar */}
              <div className="space-y-4">
                {/* Search and Primary Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  {/* Search Bar */}
                  <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      placeholder="Search orders, customers, services..."
                      value={filters.search}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-10 pr-10 h-10 text-sm border-primary/10 focus:border-primary/30 transition-all bg-muted/20"
                    />
                    {filters.search && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 opacity-60 hover:opacity-100"
                        onClick={() => handleSearchChange('')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Advanced Filters Button */}
                  <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="lg"
                        className={cn(
                          "gap-2",
                          hasActiveFilters && "border-primary bg-primary/10"
                        )}
                      >
                        <Filter className="h-5 w-5" />
                        Advanced Filters
                        {hasActiveFilters && (
                          <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                            {(filters.status.length || 0) +
                              (filters.paymentStatus.length || 0) +
                              (filters.dateFrom ? 1 : 0) +
                              (filters.dateTo ? 1 : 0) +
                              (filters.amountMin ? 1 : 0) +
                              (filters.amountMax ? 1 : 0)}
                          </Badge>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[500px] p-4 sm:p-6" align="start">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">Advanced Filters</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearFilters}
                            className="text-muted-foreground"
                          >
                            Clear All
                          </Button>
                        </div>

                        {/* Order Status */}
                        <div className="space-y-3">
                          <label className="text-sm font-medium">Order Status</label>
                          <div className="grid grid-cols-2 gap-2">
                            {['pending', 'processing', 'completed', 'cancelled'].map((status) => (
                              <div key={status} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`status-${status}`}
                                  checked={filters.status.includes(status)}
                                  onCheckedChange={(checked) => {
                                    handleStatusFilterChange(status, checked as boolean);
                                  }}
                                />
                                <label
                                  htmlFor={`status-${status}`}
                                  className="text-sm font-medium capitalize cursor-pointer flex items-center gap-2"
                                >
                                  <div className={cn("w-2 h-2 rounded-full", {
                                    'bg-yellow-500': status === 'pending',
                                    'bg-blue-500': status === 'processing',
                                    'bg-green-500': status === 'completed',
                                    'bg-red-500': status === 'cancelled',
                                  })} />
                                  {status}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Payment Status */}
                        <div className="space-y-3">
                          <label className="text-sm font-medium">Payment Status</label>
                          <div className="grid grid-cols-2 gap-2">
                            {['paid', 'pending', 'credit', 'failed'].map((status) => (
                              <div key={status} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`payment-${status}`}
                                  checked={filters.paymentStatus.includes(status)}
                                  onCheckedChange={(checked) => {
                                    setFilters(prev => ({
                                      ...prev,
                                      paymentStatus: checked
                                        ? [...prev.paymentStatus, status]
                                        : prev.paymentStatus.filter(s => s !== status),
                                    }));
                                  }}
                                />
                                <label
                                  htmlFor={`payment-${status}`}
                                  className="text-sm font-medium capitalize cursor-pointer"
                                >
                                  {status}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Date Range */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">From Date</label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {filters.dateFrom ? format(filters.dateFrom, "PPP") : 'Pick date'}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={filters.dateFrom}
                                  onSelect={(date) => setFilters(prev => ({ ...prev, dateFrom: date }))}
                                  disabled={(date) => date > new Date()}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">To Date</label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {filters.dateTo ? format(filters.dateTo, "PPP") : 'Pick date'}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={filters.dateTo}
                                  onSelect={(date) => setFilters(prev => ({ ...prev, dateTo: date }))}
                                  disabled={(date) => date > new Date()}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>

                        {/* Amount Range */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label htmlFor="filter-amount-min" className="text-sm font-medium">Min Amount</label>
                            <Input
                              id="filter-amount-min"
                              type="number"
                              placeholder="0"
                              min="0"
                              step="0.01"
                              value={filters.amountMin}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || parseFloat(value) >= 0) {
                                  setFilters(prev => ({ ...prev, amountMin: value }));
                                }
                              }}
                              aria-label="Minimum amount filter"
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="filter-amount-max" className="text-sm font-medium">Max Amount</label>
                            <Input
                              id="filter-amount-max"
                              type="number"
                              placeholder="10000"
                              min="0"
                              step="0.01"
                              value={filters.amountMax}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || parseFloat(value) >= 0) {
                                  setFilters(prev => ({ ...prev, amountMax: value }));
                                }
                              }}
                              aria-label="Maximum amount filter"
                            />
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Bulk Actions */}
                  <AnimatePresence>
                    {selectedOrders.length > 0 && (
                      <motion.div
                        key="bulk-actions"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex items-center gap-2"
                      >
                        <Badge variant="secondary" className="h-11 px-4 text-base">
                          {selectedOrders.length} selected
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="lg" className="gap-2" disabled={isBulkOperationLoading}>
                              {isBulkOperationLoading ? (
                                <>
                                  <RefreshCw className="h-5 w-5 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <Settings className="h-5 w-5" />
                                  Bulk Actions
                                </>
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleBulkStatusUpdate('processing')}
                              disabled={isBulkOperationLoading}
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              Mark as Processing
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleBulkStatusUpdate('completed')}
                              disabled={isBulkOperationLoading}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Mark as Completed
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleExportSelected} disabled={isBulkOperationLoading}>
                              <Download className="mr-2 h-4 w-4" />
                              Export Selected
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={handleBulkDelete}
                              disabled={isBulkOperationLoading}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Selected
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={handleClearSelection}
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="hidden flex-1 sm:block" />

                  {/* Export Options */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="lg" className="gap-2">
                        <Download className="h-5 w-5" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleExportCSV}>
                        <FileText className="mr-2 h-4 w-4" />
                        Export as CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExportPDF}>
                        <FileText className="mr-2 h-4 w-4" />
                        Export as PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExportExcel}>
                        <FileText className="mr-2 h-4 w-4" />
                        Export as Excel
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-1 border rounded-lg p-1">
                    <Button
                      variant={viewMode === 'table' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                      className="gap-2"
                    >
                      <List className="h-4 w-4" />
                      Table
                    </Button>
                    <Button
                      variant={viewMode === 'timeline' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('timeline')}
                      className="gap-2"
                    >
                      <Grid3x3 className="h-4 w-4" />
                      Timeline
                    </Button>
                  </div>
                </div>

                {/* Active Filters Display */}
                {hasActiveFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 flex-wrap"
                  >
                    <span className="text-sm text-muted-foreground">Active filters:</span>
                    {filters.status.map((status) => (
                      <Badge key={status} variant="secondary" className="gap-1">
                        {status}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => handleStatusFilterChange(status, false)}
                        />
                      </Badge>
                    ))}
                    {filters.paymentStatus.map((status) => (
                      <Badge key={status} variant="secondary" className="gap-1">
                        Payment: {status}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => setFilters(prev => ({
                            ...prev,
                            paymentStatus: prev.paymentStatus.filter(s => s !== status),
                          }))}
                        />
                      </Badge>
                    ))}
                    {filters.dateFrom && (
                      <Badge variant="secondary" className="gap-1">
                        From: {format(filters.dateFrom, "PPP")}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => setFilters(prev => ({ ...prev, dateFrom: undefined }))}
                        />
                      </Badge>
                    )}
                    {filters.dateTo && (
                      <Badge variant="secondary" className="gap-1">
                        To: {format(filters.dateTo, "PPP")}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => setFilters(prev => ({ ...prev, dateTo: undefined }))}
                        />
                      </Badge>
                    )}
                    {(filters.amountMin || filters.amountMax) && (
                      <Badge variant="secondary" className="gap-1">
                        Amount: {filters.amountMin || '0'} - {filters.amountMax || '∞'}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => setFilters(prev => ({ ...prev, amountMin: '', amountMax: '' }))}
                        />
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFilters}
                      className="h-6 px-2 text-xs"
                    >
                      Clear All
                    </Button>
                  </motion.div>
                )}
              </div>

              {/* Orders Table or Timeline View */}
              {viewMode === 'table' ? (
                <div className="rounded-lg border">
                  {isLoading ? (
                    <div className="p-8">
                      <LoadingSkeleton.TableSkeleton rows={10} />
                    </div>
                  ) : error ? (
                    <div className="p-12 text-center">
                      <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Failed to load orders</h3>
                      <p className="text-muted-foreground mb-4">
                        {error.message || 'Something went wrong'}
                      </p>
                      <Button onClick={() => refetch()}>Try Again</Button>
                    </div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="p-12 text-center">
                      <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-xl font-semibold mb-2">No orders found</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        {hasActiveFilters
                          ? 'No orders match your current filters. Try adjusting your search criteria.'
                          : 'Get started by creating your first order.'}
                      </p>
                      <div className="flex gap-2 justify-center">
                        {hasActiveFilters && (
                          <Button variant="outline" onClick={handleClearFilters}>
                            Clear Filters
                          </Button>
                        )}
                        <Button onClick={() => window.location.href = '/create-order'}>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Create Order
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border bg-background shadow-sm overflow-hidden flex flex-col min-h-[500px] h-[calc(100vh-420px)]">
                      {!isMobile ? (
                        <VirtualScroll
                          items={filteredOrders}
                          itemHeight={64}
                          containerHeight={window.innerHeight - 450}
                          header={OrderHeaders}
                          renderItem={renderOrderRow}
                          emptyMessage="No orders found matching your criteria"
                          className={cn("scrollbar-thin h-full", ordersTableMinWidth)}
                        />
                      ) : (
                        <div className="flex-1 overflow-y-auto p-3 space-y-3">
                          {filteredOrders.map((order, idx) => renderOrderRow(order, idx))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Timeline View */
                <div className="space-y-6">
                  {/* Timeline grouped by date */}
                  {Object.entries(
                    paginatedOrders.reduce((acc, order) => {
                      const createdAt = order.createdAt || new Date().toISOString();
                      const date = new Date(createdAt).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      });
                      if (!acc[date]) acc[date] = [];
                      acc[date].push(order);
                      return acc;
                    }, {} as Record<string, typeof paginatedOrders>)
                  ).map(([date, orders], dateIndex) => (
                    <motion.div
                      key={date}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: dateIndex * 0.1 }}
                      className="relative"
                    >
                      {/* Date Header */}
                      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-3 mb-4">
                        <div className="flex items-center gap-3">
                          <CalendarIcon className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold">{date}</h3>
                          <div className="flex-1 h-px bg-border ml-4" />
                          <Badge variant="secondary">{orders.length} orders</Badge>
                        </div>
                      </div>

                      {/* Timeline Items */}
                      <div className="space-y-4 ml-8 border-l-2 border-primary/30 pl-6 relative">
                        {orders.map((order, orderIndex) => {
                          const statusIcon = order.status === 'completed' ? CheckCircle :
                            order.status === 'processing' ? Clock :
                              order.status === 'pending' ? AlertCircle :
                                XCircle;
                          const StatusIcon = statusIcon;

                          const statusColor = order.status === 'completed' ? 'text-green-500 bg-green-500/10 border-green-500/20' :
                            order.status === 'processing' ? 'text-blue-500 bg-blue-500/10 border-blue-500/20' :
                              order.status === 'pending' ? 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' :
                                'text-red-500 bg-red-500/10 border-red-500/20';

                          return (
                            <motion.div
                              key={order.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: (dateIndex * 0.1) + (orderIndex * 0.05) }}
                              className="relative group"
                            >
                              {/* Timeline Dot */}
                              <div className={cn(
                                "absolute -left-[29px] top-6 w-4 h-4 rounded-full border-2 border-background",
                                statusColor,
                                "group-hover:scale-125 transition-transform duration-200"
                              )} />

                              {/* Order Card */}
                              <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                                <CardContent className="p-6">
                                  <div className="flex items-start gap-4">
                                    {/* Status Icon */}
                                    <div className={cn(
                                      "p-3 rounded-xl border-2",
                                      statusColor
                                    )}>
                                      <StatusIcon className="h-6 w-6" />
                                    </div>

                                    {/* Order Details */}
                                    <div className="flex-1 min-w-0">
                                      {/* Header Row */}
                                      <div className="flex items-start justify-between gap-4 mb-3">
                                        <div>
                                          <div className="flex items-center gap-2 mb-1">
                                            <h4 className="text-lg font-semibold">
                                              Order #{order.orderNumber}
                                            </h4>
                                            <Badge
                                              variant={
                                                order.status === 'completed' ? 'default' :
                                                  order.status === 'processing' ? 'secondary' :
                                                    order.status === 'pending' ? 'outline' :
                                                      'destructive'
                                              }
                                              className="capitalize"
                                            >
                                              {order.status.replace('_', ' ')}
                                            </Badge>
                                          </div>
                                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {new Date(order.createdAt || new Date()).toLocaleTimeString('en-US', {
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            })}
                                          </p>
                                        </div>

                                        <div className="text-right">
                                          <p className="text-2xl font-bold text-primary">
                                            {formatCurrency(parseFloat(order.totalAmount))}
                                          </p>
                                          {order.paymentStatus && (
                                            <Badge
                                              variant={order.paymentStatus === 'paid' ? 'default' : 'outline'}
                                              className="mt-1"
                                            >
                                              {order.paymentStatus}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>

                                      {/* Customer Info */}
                                      <div className="flex items-center gap-6 mb-4 p-3 bg-muted/50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                          <Users className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-sm font-medium">{order.customerName}</span>
                                        </div>
                                        {(order as any).service && (
                                          <div className="flex items-center gap-2">
                                            <Package className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm text-muted-foreground">
                                              {(order as any).service}
                                            </span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Actions */}
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setSelectedOrder(order);
                                            setIsOrderDetailsOpen(true);
                                          }}
                                          className="gap-2"
                                        >
                                          <Eye className="h-4 w-4" />
                                          View Details
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setEditingOrder(order);
                                            setIsEditDialogOpen(true);
                                          }}
                                          className="gap-2"
                                        >
                                          <Edit className="h-4 w-4" />
                                          Edit
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handlePrintInvoice(order)}
                                          className="gap-2"
                                        >
                                          <Printer className="h-4 w-4" />
                                          Print
                                        </Button>

                                        {/* More Actions Dropdown */}
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                              <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'pending')}>
                                              Mark as Pending
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'in_progress')}>
                                              Mark as In Progress
                                            </DropdownMenuItem>
                                            {order.paymentStatus !== 'paid' && order.paymentStatus !== 'credit' && (
                                              <>
                                                <DropdownMenuItem onClick={() => {
                                                  setSelectedPaymentOrder(order);
                                                  setIsPaymentModalOpen(true);
                                                }}>
                                                  Process Payment
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDebitFromWallet(order)}>
                                                  Debit from Wallet
                                                </DropdownMenuItem>
                                              </>
                                            )}
                                            <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'completed')}>
                                              Mark as Completed
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                              onClick={() => handleDeleteOrder(order.id)}
                                              className="text-destructive"
                                            >
                                              <Trash2 className="h-4 w-4 mr-2" />
                                              Delete Order
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  ))}

                  {/* Empty State */}
                  {paginatedOrders.length === 0 && (
                    <div className="text-center py-12">
                      <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-lg text-muted-foreground">No orders found</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Try adjusting your filters or search query
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Pagination */}
              {/* Pagination Removed - Virtual Scroll Active */}
            </CardContent>
          </Card>
        </motion.div>

        {/* Keyboard Shortcuts Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-6 text-sm text-muted-foreground"
        >
          <span className="flex items-center gap-2">
            <kbd className="px-2 py-1 rounded bg-muted text-xs">⌘F</kbd> Search
          </span>
          <span className="flex items-center gap-2">
            <kbd className="px-2 py-1 rounded bg-muted text-xs">⌘R</kbd> Refresh
          </span>
          <span className="flex items-center gap-2">
            Click column headers to sort
          </span>
        </motion.div>
      </div>

      {/* Dialogs */}
      <OrderDetailsDialog
        order={selectedOrder}
        isOpen={isOrderDetailsOpen}
        onClose={() => {
          setIsOrderDetailsOpen(false);
          setSelectedOrder(null);
        }}
        onEdit={handleEditOrder}
        onCancel={handleCancelOrder}
        onNextStep={handleNextStep}
        onPrintInvoice={handlePrintInvoice}
        onUpdatePaymentStatus={handleMarkOrderPaid}
      />

      <EditOrderDialog
        order={editingOrder}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingOrder(null);
        }}
        onSave={(orderId, updates) => {
          updateOrderMutation.mutate({ orderId, updates });
        }}
        isLoading={updateOrderMutation.isPending}
      />

      {selectedPaymentOrder && (
        <OrderPaymentModal
          order={selectedPaymentOrder as any}
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedPaymentOrder(null);
          }}
          onPaymentUpdate={(id, data) => {
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            setSelectedPaymentOrder(data as any);
          }}
        />
      )}
    </PageTransition>
  );
}

export default function Orders() {
  return <OrdersComponent />;
}
