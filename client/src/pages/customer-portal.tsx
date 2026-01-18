import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Package,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  Calendar,
  Star,
  Bell,
  Settings,
  LogOut,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Truck,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  Heart,
  Gift,
  TrendingUp,
  Award,
  CreditCard,
  FileText,
  History,
  BookOpen,
  HelpCircle,
  MessageCircle,
  Shield,
  Zap
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useFuzzySearch } from '@/hooks/use-fuzzy-search';
// import { usePagination } from '@/hooks/use-pagination';

// Import child components
import CustomerOrderTracking from '@/components/customer-portal/customer-order-tracking';
import CustomerServiceBooking from '@/components/customer-portal/customer-service-booking';
import CustomerAccountManagement from '@/components/customer-portal/customer-account-management';
import CustomerNotifications from '@/components/customer-portal/customer-notifications';

// Import data service and types
import { ordersApi, customersApi } from '@/lib/data-service';
// import type { Order, Customer } from '@shared/schema';

// Temporary type definitions
interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  status: string;
  paymentStatus: string;
  totalAmount: string;
  items: any[];
  shippingAddress?: any;
  pickupDate?: string;
  deliveryDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: any;
  totalOrders?: number;
  totalSpent?: string;
  lastOrder?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function CustomerPortal() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [customerId] = useState('customer123'); // In a real app, this would come from auth
  const { toast } = useToast();

  // Fetch customer data
  const {
    data: customer,
    isLoading: customerLoading,
    error: customerError,
  } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => customersApi.getById(customerId),
    staleTime: 5 * 60 * 1000,
    retry: 3,
  });

  // Fetch customer orders
  const {
    data: orders = [],
    isLoading: ordersLoading,
    error: ordersError,
  } = useQuery({
    queryKey: ['customer-orders', customerId],
    queryFn: () => ordersApi.getAll(),
    staleTime: 30 * 1000, // 30 seconds for real-time updates
    retry: 3,
  });

  // Mock customer data for development
  const mockCustomer: Customer = {
    id: customerId,
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+91 98765 43210',
    address: {
      street: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
      country: 'India'
    },
    totalOrders: 15,
    totalSpent: '25000',
    lastOrder: new Date().toISOString(),
    // loyaltyPoints: 1250,
    // membershipTier: 'Gold',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Mock orders data for development
  const mockOrders: Order[] = [
    {
      id: 'order-1',
      orderNumber: 'FZC-2024-001',
      customerName: 'John Doe',
      customerEmail: 'john.doe@example.com',
      customerPhone: '+91 98765 43210',
      status: 'processing',
      paymentStatus: 'paid',
      totalAmount: '2500',
      items: [
        { name: 'Dry Cleaning - Suit', quantity: 2, price: '800' },
        { name: 'Laundry - Shirts', quantity: 5, price: '300' },
        { name: 'Ironing - Dresses', quantity: 3, price: '400' }
      ],
      shippingAddress: {
        street: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001'
      },
      pickupDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'order-2',
      orderNumber: 'FZC-2024-002',
      customerName: 'John Doe',
      customerEmail: 'john.doe@example.com',
      customerPhone: '+91 98765 43210',
      status: 'completed',
      paymentStatus: 'paid',
      totalAmount: '1800',
      items: [
        { name: 'Dry Cleaning - Coat', quantity: 1, price: '600' },
        { name: 'Laundry - Pants', quantity: 4, price: '320' }
      ],
      shippingAddress: {
        street: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001'
      },
      pickupDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      deliveryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ];

  // Use mock data for development
  const currentCustomer = customer || mockCustomer;
  const currentOrders = orders.length > 0 ? orders : mockOrders;

  // Calculate customer metrics
  const customerMetrics = {
    totalOrders: currentCustomer.totalOrders || 0,
    totalSpent: parseFloat(currentCustomer.totalSpent || '0'),
    loyaltyPoints: 1250, // Mock value
    membershipTier: 'Gold', // Mock value
    activeOrders: currentOrders.filter((order: any) => order.status === 'processing' || order.status === 'pending').length,
    completedOrders: currentOrders.filter((order: any) => order.status === 'completed').length,
    averageOrderValue: (currentCustomer.totalOrders || 0) > 0 ? parseFloat(currentCustomer.totalSpent || '0') / (currentCustomer.totalOrders || 1) : 0,
  };

  // Get status icon and color
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle, color: 'text-green-600' };
      case 'processing':
        return { icon: RefreshCw, color: 'text-blue-600' };
      case 'pending':
        return { icon: Clock, color: 'text-yellow-600' };
      case 'cancelled':
        return { icon: XCircle, color: 'text-red-600' };
      default:
        return { icon: AlertCircle, color: 'text-gray-600' };
    }
  };

  // Get membership tier info
  const getMembershipTier = (tier: string) => {
    switch (tier) {
      case 'Platinum':
        return { color: 'bg-gradient-to-r from-purple-500 to-pink-500', icon: Award, benefits: ['Free pickup/delivery', 'Priority service', '20% discount'] };
      case 'Gold':
        return { color: 'bg-gradient-to-r from-yellow-400 to-yellow-600', icon: Star, benefits: ['Free pickup/delivery', 'Priority service', '15% discount'] };
      case 'Silver':
        return { color: 'bg-gradient-to-r from-gray-300 to-gray-500', icon: TrendingUp, benefits: ['Free pickup/delivery', '10% discount'] };
      default:
        return { color: 'bg-gradient-to-r from-orange-400 to-orange-600', icon: Heart, benefits: ['5% discount'] };
    }
  };

  const membershipInfo = getMembershipTier(customerMetrics.membershipTier);
  const MembershipIcon = membershipInfo.icon;

  // Error state
  if (customerError || ordersError) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-destructive text-lg font-semibold">
                Failed to load customer data
              </div>
              <p className="text-sm text-muted-foreground">
                Please try again or contact support if the problem persists.
              </p>
              <Button
                onClick={() => window.location.reload()}
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <FadeIn delay={0.1}>
          <div className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                {/* Logo and Title */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <Package className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      FabZClean
                    </span>
                  </div>
                  <div className="hidden md:block text-sm text-muted-foreground">
                    Customer Portal
                  </div>
                </div>

                {/* Customer Info and Actions */}
                <div className="flex items-center gap-4">
                  {/* Notifications */}
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
                  </Button>

                  {/* Customer Profile Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm">
                            {currentCustomer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="hidden md:block text-left">
                          <div className="text-sm font-medium">{currentCustomer.name}</div>
                          <div className="text-xs text-muted-foreground">{customerMetrics.membershipTier} Member</div>
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <HelpCircle className="mr-2 h-4 w-4" />
                        Help & Support
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <FadeIn delay={0.2}>
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Welcome back, {currentCustomer.name.split(' ')[0]}! 👋
                  </h1>
                  <p className="text-gray-600">
                    Track your orders, book new services, and manage your account
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Membership Badge */}
                  <div className={`${membershipInfo.color} text-white px-4 py-2 rounded-lg flex items-center gap-2`}>
                    <MembershipIcon className="h-5 w-5" />
                    <span className="font-semibold">{customerMetrics.membershipTier} Member</span>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Quick Stats */}
          <FadeIn delay={0.3}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active Orders
                  </CardTitle>
                  <Package className="h-5 w-5 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{customerMetrics.activeOrders}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    In progress
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Orders
                  </CardTitle>
                  <History className="h-5 w-5 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{customerMetrics.totalOrders}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {customerMetrics.completedOrders} completed
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Loyalty Points
                  </CardTitle>
                  <Gift className="h-5 w-5 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{customerMetrics.loyaltyPoints}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Available to redeem
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Spent
                  </CardTitle>
                  <CreditCard className="h-5 w-5 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">₹{customerMetrics.totalSpent.toFixed(0)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Avg: ₹{customerMetrics.averageOrderValue.toFixed(0)}/order
                  </p>
                </CardContent>
              </Card>
            </div>
          </FadeIn>

          {/* Main Tabs */}
          <FadeIn delay={0.4}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="dashboard" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="orders" className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Track Orders
                </TabsTrigger>
                <TabsTrigger value="booking" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Book Service
                </TabsTrigger>
                <TabsTrigger value="account" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  My Account
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notifications
                </TabsTrigger>
              </TabsList>

              {/* Dashboard Tab */}
              <TabsContent value="dashboard" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Recent Orders */}
                  <div className="lg:col-span-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Package className="h-5 w-5" />
                          Recent Orders
                        </CardTitle>
                        <CardDescription>
                          Your latest orders and their current status
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {currentOrders.slice(0, 3).map((order: any, index: number) => {
                          const statusInfo = getStatusIcon(order.status);
                          const StatusIcon = statusInfo.icon;
                          
                          return (
                            <motion.div
                              key={order.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all duration-200"
                            >
                              <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-full ${statusInfo.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                                  <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                                </div>
                                <div>
                                  <div className="font-semibold">{order.orderNumber}</div>
                                  <div className="text-sm text-muted-foreground">
                                    ₹{order.totalAmount} • {order.items.length} items
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                                  {order.status}
                                </Badge>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {order.pickupDate ? new Date(order.pickupDate).toLocaleDateString() : 'N/A'}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                        <Button variant="outline" className="w-full mt-4">
                          View All Orders
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quick Actions & Membership */}
                  <div className="space-y-6">
                    {/* Quick Actions */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="h-5 w-5" />
                          Quick Actions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Button className="w-full justify-start" variant="outline">
                          <Plus className="mr-2 h-4 w-4" />
                          Book New Service
                        </Button>
                        <Button className="w-full justify-start" variant="outline">
                          <Truck className="mr-2 h-4 w-4" />
                          Track Package
                        </Button>
                        <Button className="w-full justify-start" variant="outline">
                          <Phone className="mr-2 h-4 w-4" />
                          Contact Support
                        </Button>
                        <Button className="w-full justify-start" variant="outline">
                          <FileText className="mr-2 h-4 w-4" />
                          Download Receipt
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Membership Benefits */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MembershipIcon className="h-5 w-5" />
                          {customerMetrics.membershipTier} Benefits
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {membershipInfo.benefits.map((benefit, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              {benefit}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Orders Tab */}
              <TabsContent value="orders">
                <CustomerOrderTracking orders={currentOrders} customer={currentCustomer} />
              </TabsContent>

              {/* Booking Tab */}
              <TabsContent value="booking">
                <CustomerServiceBooking customer={currentCustomer} />
              </TabsContent>

              {/* Account Tab */}
              <TabsContent value="account">
                <CustomerAccountManagement customer={currentCustomer} />
              </TabsContent>

              {/* Notifications Tab */}
              <TabsContent value="notifications">
                <CustomerNotifications customer={currentCustomer} />
              </TabsContent>
            </Tabs>
          </FadeIn>
        </div>
      </div>
    </PageTransition>
  );
}
