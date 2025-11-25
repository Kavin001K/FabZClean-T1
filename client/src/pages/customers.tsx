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
  DollarSign,
  Clock,
  FileText,
  UserPlus
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
import type { Customer, Order } from '../../../shared/schema';

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

  if (totalSpent >= 50000) return { label: 'VIP', color: 'bg-yellow-500', variant: 'default' as const };
  if (totalSpent >= 20000 || totalOrders >= 10) return { label: 'Premium', color: 'bg-purple-500', variant: 'secondary' as const };
  if (totalOrders > 0) return { label: 'Regular', color: 'bg-blue-500', variant: 'outline' as const };
  return { label: 'Inactive', color: 'bg-gray-400', variant: 'outline' as const };
};

const getSpendingTier = (totalSpent: number) => {
  if (totalSpent >= 50000) return { label: 'Elite', icon: Award, color: 'text-yellow-600' };
  if (totalSpent >= 20000) return { label: 'Gold', icon: TrendingUp, color: 'text-purple-600' };
  if (totalSpent >= 10000) return { label: 'Silver', icon: ShoppingBag, color: 'text-blue-600' };
  return { label: 'Bronze', icon: Users, color: 'text-gray-600' };
};

export default function Customers() {
  // State management
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch customers data
  const {
    data: customersData,
    isLoading: customersLoading,
    isError: customersError,
    error: customersErrorDetails,
  } = useQuery({
    queryKey: ['customers'],
    queryFn: customersApi.getAll,
    staleTime: 5 * 60 * 1000,
    retry: 3,
  });

  // Ensure customers is always an array
  const customers = useMemo(() => {
    if (!customersData) return [];
    if (Array.isArray(customersData)) return customersData;
    // Handle case where API returns wrapped data
    if (customersData && typeof customersData === 'object') {
      const wrappedData = customersData as { data?: unknown };
      if ('data' in wrappedData && Array.isArray(wrappedData.data)) {
        return wrappedData.data as Customer[];
      }
    }
    return [];
  }, [customersData]);

  // Fetch orders for customer analytics
  const {
    data: orders = [],
  } = useQuery({
    queryKey: ['orders'],
    queryFn: ordersApi.getAll,
    staleTime: 5 * 60 * 1000,
  });

  // Computed metrics
  const metrics = useMemo(() => {
    const totalCustomers = customers.length;
    const totalRevenue = customers.length > 0
      ? customers.reduce((sum, c) => sum + safeParseFloat(c.totalSpent), 0)
      : 0;
    const totalOrders = customers.length > 0
      ? customers.reduce((sum, c) => sum + (c.totalOrders ?? 0), 0)
      : 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

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
      totalRevenue,
      totalOrders,
      avgOrderValue,
      vipCustomers,
      premiumCustomers,
      regularCustomers,
      inactiveCustomers,
    };
  }, [customers]);

  // Filtered and sorted customers
  const filteredCustomers = useMemo(() => {
    let filtered = customers.filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone?.includes(searchQuery);

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

  const handleCreateCustomer = (customerData: Partial<Customer>) => {
    createCustomerMutation.mutate(customerData);
  };

  const handleUpdateCustomer = (customerData: Partial<Customer>) => {
    if (!selectedCustomer) return;
    editCustomerMutation.mutate({
      customerId: selectedCustomer.id,
      customerData,
    });
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
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent flex items-center gap-3">
                <Users className="h-10 w-10 text-primary" />
                Customer Management
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage customers, track lifetime value, and analyze purchasing behavior
              </p>
            </div>
            <div className="flex gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleExportPDF}>
                    <FileText className="mr-2 h-4 w-4" />
                    All Customers (PDF)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportExcel}>
                    <FileText className="mr-2 h-4 w-4" />
                    All Customers (Excel)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleExportSegmented('vip')}>
                    <Award className="mr-2 h-4 w-4" />
                    VIP Customers
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportSegmented('premium')}>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Premium Customers
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportSegmented('regular')}>
                    <Users className="mr-2 h-4 w-4" />
                    Regular Customers
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2 gradient-primary">
                <UserPlus className="h-4 w-4" />
                Add Customer
              </Button>
            </div>
          </div>
        </FadeIn>

        {/* KPI Cards */}
        <FadeIn delay={0.2}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="glass hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Customers
                </CardTitle>
                <Users className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.totalCustomers}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.inactiveCustomers} inactive
                </p>
              </CardContent>
            </Card>

            <Card className="glass hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">₹{metrics.totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg: ₹{metrics.avgOrderValue.toFixed(2)}/order
                </p>
              </CardContent>
            </Card>

            <Card className="glass hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  VIP Customers
                </CardTitle>
                <Award className="h-5 w-5 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.vipCustomers}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.premiumCustomers} premium
                </p>
              </CardContent>
            </Card>

            <Card className="glass hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Orders
                </CardTitle>
                <ShoppingBag className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.totalOrders}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  From {metrics.totalCustomers} customers
                </p>
              </CardContent>
            </Card>
          </div>
        </FadeIn>

        {/* Search and Filter Bar */}
        <FadeIn delay={0.3}>
          <Card className="glass mb-6">
            <CardContent className="pt-6">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col md:flex-row gap-4"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  <AnimatePresence>
                    {searchQuery && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => setSearchQuery('')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Segment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Segments</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                    <SelectItem value="spending">Highest Spending</SelectItem>
                    <SelectItem value="orders">Most Orders</SelectItem>
                    <SelectItem value="recent">Recent Activity</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="mt-4 flex items-center gap-4 text-sm text-muted-foreground"
              >
                <span>
                  Showing <strong className="text-foreground">{filteredCustomers.length}</strong> of{' '}
                  <strong className="text-foreground">{customers.length}</strong> customers
                </span>
                <AnimatePresence>
                  {(searchQuery || segmentFilter !== 'all') && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchQuery('');
                          setSegmentFilter('all');
                        }}
                        className="h-7"
                      >
                        Clear filters
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
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
                        className="glass hover:shadow-xl transition-all duration-300 cursor-pointer group h-full"
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

                          {/* Stats */}
                          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Total Orders</div>
                              <div className="text-2xl font-bold text-primary">
                                {customer.totalOrders || 0}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Lifetime Value</div>
                              <div className="text-2xl font-bold text-green-600">
                                ₹{totalSpent.toFixed(0)}
                              </div>
                            </div>
                          </div>

                          {/* Last Order */}
                          <div className="flex items-center justify-between text-sm pt-2 border-t">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>Last order:</span>
                            </div>
                            <span className="font-medium">{lastOrderDate}</span>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 gap-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (customer.email) {
                                  window.location.href = `mailto:${customer.email}`;
                                }
                              }}
                              disabled={!customer.email}
                            >
                              <Mail className="h-4 w-4" />
                              Email
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 gap-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (customer.phone) {
                                  window.location.href = `tel:${customer.phone}`;
                                }
                              }}
                              disabled={!customer.phone}
                            >
                              <Phone className="h-4 w-4" />
                              Call
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
          selectedCustomer={selectedCustomer}
          isViewDialogOpen={isViewDialogOpen}
          isEditDialogOpen={isEditDialogOpen}
          isCreateDialogOpen={isCreateDialogOpen}
          isCreating={createCustomerMutation.isPending}
          isUpdating={editCustomerMutation.isPending}
          onCloseViewDialog={() => setIsViewDialogOpen(false)}
          onCloseEditDialog={() => setIsEditDialogOpen(false)}
          onCloseCreateDialog={() => setIsCreateDialogOpen(false)}
          onEditCustomer={handleUpdateCustomer}
          onCreateCustomer={handleCreateCustomer}
          orders={orders}
        />
      </div>
    </PageTransition>
  );
};
