import React, { useState, useMemo } from 'react';
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
  FileSpreadsheet
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
  // State management
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch customers data
  const {
    data: customersResponse,
    isLoading: customersLoading,
    isError: customersError,
    error: customersErrorDetails,
  } = useQuery({
    queryKey: ['customers', page, pageSize, searchQuery, sortBy],
    queryFn: () => customersApi.getAll({ 
      page, 
      limit: pageSize, 
      search: searchQuery,
      sortBy 
    }),
    staleTime: 5000, 
    refetchInterval: 5000, // Background auto-sync 5s
    retry: 2,
  });

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
    staleTime: 5000,
    refetchInterval: 5000, // Background auto-sync 5s
  });

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
  const filteredCustomers = useMemo(() => {
    let filtered = customers.filter(customer => {
      // Normalize phone number for search Helper
      const normalizePhone = (phone: string | null | undefined) => {
        if (!phone) return '';
        return phone.replace(/[\s\-\(\)]/g, '').replace(/^0+/, '').replace(/^\+91/, '');
      };
      
      const normalizedQuery = normalizePhone(searchQuery);
      const normalizedCustomerPhone = normalizePhone(customer.phone);

      const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone?.includes(searchQuery) ||
        (normalizedQuery.length > 3 && normalizedCustomerPhone.includes(normalizedQuery)) ||
        (normalizedCustomerPhone && normalizedQuery && normalizedCustomerPhone === normalizedQuery);

      if (!matchesSearch) return false;

      if (segmentFilter === 'all') return true;

      const segment = getCustomerSegment(customer);
      return segment.label.toLowerCase() === segmentFilter.toLowerCase();
    });

    // Sort customers
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'spending':
          return parseFloat(b.totalSpent || '0') - parseFloat(a.totalSpent || '0');
        case 'orders':
          return (b.totalOrders || 0) - (a.totalOrders || 0);
        case 'recent':
          return new Date(b.lastOrder || 0).getTime() - new Date(a.lastOrder || 0).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [customers, searchQuery, segmentFilter, sortBy]);

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
        description: "Failed to create customer. Please try again.",
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
        toast({
          title: "Customer Updated Successfully",
          description: `Customer ${updatedCustomer.name} has been updated.`,
        });
        setIsEditDialogOpen(false);
        setSelectedCustomer(null);
      }
    },
    onError: (error) => {
      console.error('Failed to update customer:', error);
      toast({
        title: "Error",
        description: "Failed to update customer. Please try again.",
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
      email: customerData.email || undefined,
      address: addressObj.street ? addressObj : undefined,
      creditLimit: normalizedCreditLimit,
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
      email: customerData.email || undefined,
      address: addressObj.street ? addressObj : undefined,
      creditLimit: normalizedCreditLimit,
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
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10 pb-6 border-b border-white/5">
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 shadow-inner">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60">
                    Customer Directory
                  </h1>
                  <div className="text-muted-foreground text-sm font-medium flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Managing {totalCount} active customer relationships
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="glass border-muted border-l-4 border-l-primary shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Reached</p>
                    <h3 className="text-2xl font-black tracking-tight text-foreground">
                      {customersLoading ? '...' : metrics.totalCustomers}
                    </h3>
                    <div className="mt-1 text-[10px] text-slate-400 font-medium italic">Active customer base</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-muted border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <IndianRupee className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Revenue</p>
                    <h3 className="text-2xl font-black tracking-tight text-emerald-600">₹{metrics.totalRevenue.toFixed(0)}</h3>
                    <div className="mt-1 text-[10px] text-emerald-500/60 font-medium italic">₹{metrics.avgOrderValue.toFixed(0)} avg/order</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-muted border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Award className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">VIP Club</p>
                    <h3 className="text-2xl font-black tracking-tight text-amber-600">{metrics.vipCustomers}</h3>
                    <div className="mt-1 text-[10px] text-amber-500/60 font-medium italic">{metrics.premiumCustomers} premium tier</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-muted border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <ShoppingBag className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Orders</p>
                    <h3 className="text-2xl font-black tracking-tight text-blue-600">{metrics.totalOrders}</h3>
                    <div className="mt-1 text-[10px] text-blue-500/60 font-medium italic">Across entire base</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </FadeIn>

        {/* Search and Filter Bar */}
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
                    <SelectTrigger className="w-[140px] sm:w-[160px] h-11 border-muted bg-transparent focus:ring-primary/20">
                      <Filter className="h-3.5 w-3.5 mr-2 opacity-60" />
                      <SelectValue placeholder="Segment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Segments</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="regular">Regular</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[140px] sm:w-[160px] h-11 border-muted bg-transparent focus:ring-primary/20">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                      <SelectItem value="spending">Highest Spending</SelectItem>
                      <SelectItem value="orders">Most Orders</SelectItem>
                      <SelectItem value="recent">Recent Activity</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="h-11 w-px bg-muted/50 mx-1 hidden sm:block" />

                  <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(parseInt(v)); setPage(1); }}>
                    <SelectTrigger className="w-[100px] sm:w-[120px] h-11 border-muted bg-transparent focus:ring-primary/20">
                      <SelectValue placeholder="Page size" />
                    </SelectTrigger>
                    <SelectContent>
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
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <TierIcon className={`h-4 w-4 ${tier.color}`} />
                                  <span className={tier.color}>{tier.label}</span>
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
                                <span>{customer.phone}</span>
                              </div>
                            )}
                          </div>

                          {/* Credit Wallet Summary */}
                          <div className="space-y-2 py-2 px-3 bg-white/5 rounded-md border border-white/5 text-[11px]">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground font-medium">Wallet Balance</span>
                              <span className="font-bold text-emerald-500">
                                ₹{parseFloat((customer as any).walletBalanceCache || '0').toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between border-t border-white/5 pt-1">
                              <span className="text-muted-foreground font-medium">Outstanding Credit</span>
                              <span className={`font-bold ${outstandingColorClass}`}>
                                ₹{outstandingCredit.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                              <span className={isCreditLimitExceeded ? "text-red-500 font-semibold" : ""}>Limit ₹{customerCreditLimit.toFixed(0)}</span>
                              <span className={isCreditLimitExceeded ? "text-red-500 font-semibold" : ""}>
                                {isCreditLimitExceeded
                                  ? `Exceeded ₹${(outstandingCredit - customerCreditLimit).toFixed(0)}`
                                  : `Available ₹${availableCredit.toFixed(0)}`}
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
                                  ₹{totalSpent.toFixed(0)}
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-sm pt-3 border-t border-white/5">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>Last active:</span>
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
      {!customersLoading && filteredCustomers.length > 0 && (
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

          return {
            name: String(name).trim(),
            phone: phone,
            email: getValue(['Email', 'email', 'E-mail']),
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
