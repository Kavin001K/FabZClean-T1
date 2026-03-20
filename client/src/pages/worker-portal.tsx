import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Truck,
  MapPin,
  QrCode,
  CheckCircle2,
  Clock,
  Navigation,
  Package,
  User,
  Phone,
  Calendar,
  Star,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Menu,
  Bell,
  Settings,
  LogOut,
  Eye,
  Map,
  Route,
  Zap,
  Target,
  TrendingUp
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { PageTransition, FadeIn } from '@/components/ui/page-transition';

import { useAuth } from '@/contexts/auth-context';

// Import child components
import WorkerDeliveryList from '@/components/worker-portal/worker-delivery-list';
import WorkerRouteOptimizer from '@/components/worker-portal/worker-route-optimizer';
import WorkerQRScanner from '@/components/worker-portal/worker-qr-scanner';
import WorkerStatusUpdater from '@/components/worker-portal/worker-status-updater';

// (Mocks removed)

// Temporary type definitions
interface Delivery {
  id: string;
  orderId: string;
  driverId: string;
  status: string;
  pickupAddress: string;
  deliveryAddress: string;
  scheduledPickup: string;
  scheduledDelivery: string;
  actualPickup?: string;
  actualDelivery?: string;
  customerName: string;
  customerPhone: string;
  specialInstructions?: string;
  priority: 'low' | 'medium' | 'high';
  estimatedTime: number;
  distance: number;
  createdAt: string;
  updatedAt: string;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  email?: string;
  licenseNumber: string;
  vehicleNumber: string;
  vehicleType: string;
  status: string;
  currentLatitude?: number;
  currentLongitude?: number;
  lastActive?: string;
  rating: number;
  totalDeliveries: number;
  totalEarnings: string;
  createdAt: string;
  updatedAt: string;
}

export default function WorkerPortal() {
  const [activeTab, setActiveTab] = useState('deliveries');
  const [searchQuery, setSearchQuery] = useState('');
  const { employee, signOut } = useAuth();

  // Fetch orders data
  const {
    data: ordersData = [],
    isLoading: deliveriesLoading,
    error: deliveriesError,
  } = useQuery({
    queryKey: ['orders'],
  });

  const ordersList = (ordersData as any)?.data || ordersData || [];

  // Map authenticated employee to Driver shape
  const currentDriver: Driver = {
    id: employee?.id || '',
    name: employee?.fullName || 'Driver',
    phone: employee?.phone || '',
    email: employee?.email || '',
    licenseNumber: employee?.employeeId || '',
    vehicleNumber: 'N/A',
    vehicleType: 'Delivery',
    status: employee?.isActive ? 'active' : 'inactive',
    rating: parseFloat((employee as any)?.performanceRating || '0'),
    totalDeliveries: 0,
    totalEarnings: '0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Filter deliveries by current driver and shape them for the UI
  const currentDeliveries = useMemo(() => {
    return ordersList
      .filter((order: any) => order.deliveryPartnerId === employee?.id)
      .map((order: any) => ({
        id: order.id,
        orderId: order.orderNumber,
        driverId: order.deliveryPartnerId,
        status: order.status,
        pickupAddress: 'Store Location', // Or franchise address if available
        deliveryAddress: order.deliveryAddress ? `${order.deliveryAddress.street || ''}, ${order.deliveryAddress.city || ''}` : 'Address saved',
        scheduledPickup: order.pickupDate || new Date().toISOString(),
        scheduledDelivery: order.pickupDate || new Date().toISOString(),
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        specialInstructions: order.specialInstructions || '',
        priority: order.priority || 'normal',
        estimatedTime: 30, // Default estimate
        distance: 0, // Default estimate
        createdAt: order.createdAt || new Date().toISOString(),
        updatedAt: order.updatedAt || new Date().toISOString(),
        // Pass original order object to ensure we can capture payment details too
        _original: order
      }));
  }, [ordersList, employee]);

  // Calculate driver metrics
  const driverMetrics = {
    totalDeliveries: currentDriver.totalDeliveries || 0,
    totalEarnings: parseFloat(currentDriver.totalEarnings || '0'),
    rating: currentDriver.rating || 0,
    activeDeliveries: currentDeliveries.filter((delivery: any) => delivery.status === 'out_for_delivery').length,
    completedToday: currentDeliveries.filter((delivery: any) => {
      const today = new Date().toDateString();
      return delivery.status === 'delivered' && new Date(delivery.actualDelivery || '').toDateString() === today;
    }).length,
    averageDeliveryTime: 45, // Mock value in minutes
    onTimeDeliveryRate: 94, // Mock value in percentage
  };

  // Get status icon and color
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'out_for_delivery':
        return { icon: Truck, color: 'text-orange-500', bgColor: 'bg-orange-50' };
      case 'delivered':
        return { icon: CheckCircle2, color: 'text-green-500', bgColor: 'bg-green-50' };
      case 'failed':
        return { icon: AlertTriangle, color: 'text-red-500', bgColor: 'bg-red-50' };
      default:
        return { icon: Clock, color: 'text-gray-500', bgColor: 'bg-gray-50' };
    }
  };

  if (deliveriesLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4 animate-pulse">
              <div className="h-10 w-10 rounded-full bg-muted mx-auto" />
              <div className="h-4 bg-muted rounded w-3/4 mx-auto" />
              <div className="h-3 bg-muted rounded w-1/2 mx-auto" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="container-desktop min-h-screen py-4 gradient-mesh">
        {/* Header Section - Mobile Optimized */}
        <FadeIn delay={0.1}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-primary to-accent text-white">
                  {currentDriver.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Welcome, {currentDriver.name.split(' ')[0]}!
                </h1>
                <p className="text-sm text-muted-foreground">
                  Driver ID: {currentDriver.licenseNumber}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Bell className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Menu className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Eye className="mr-2 h-4 w-4" />
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </FadeIn>

        {/* Quick Stats - Mobile Grid */}
        <FadeIn delay={0.2}>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card className="glass p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Active Deliveries</p>
                  <p className="text-2xl font-bold">{driverMetrics.activeDeliveries}</p>
                </div>
                <Truck className="h-8 w-8 text-blue-500" />
              </div>
            </Card>

            <Card className="glass p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Completed Today</p>
                  <p className="text-2xl font-bold">{driverMetrics.completedToday}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </Card>

            <Card className="glass p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Rating</p>
                  <p className="text-2xl font-bold">{driverMetrics.rating}</p>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
            </Card>

            <Card className="glass p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Earnings</p>
                  <p className="text-2xl font-bold">₹{driverMetrics.totalEarnings.toFixed(0)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </Card>
          </div>
        </FadeIn>

        {/* Tabs Navigation - Mobile Optimized */}
        <FadeIn delay={0.3}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-4 h-12">
              <TabsTrigger value="deliveries" className="flex items-center gap-1 text-xs">
                <Truck className="h-4 w-4" /> Deliveries
              </TabsTrigger>
              <TabsTrigger value="route" className="flex items-center gap-1 text-xs">
                <Map className="h-4 w-4" /> Route
              </TabsTrigger>
              <TabsTrigger value="scanner" className="flex items-center gap-1 text-xs">
                <QrCode className="h-4 w-4" /> Scanner
              </TabsTrigger>
              <TabsTrigger value="status" className="flex items-center gap-1 text-xs">
                <RefreshCw className="h-4 w-4" /> Status
              </TabsTrigger>
            </TabsList>

            <TabsContent value="deliveries" className="mt-6">
              <WorkerDeliveryList deliveries={currentDeliveries as Delivery[]} driver={currentDriver as Driver} />
            </TabsContent>

            <TabsContent value="route" className="mt-6">
              <WorkerRouteOptimizer deliveries={currentDeliveries as Delivery[]} driver={currentDriver as Driver} />
            </TabsContent>

            <TabsContent value="scanner" className="mt-6">
              <WorkerQRScanner driver={currentDriver} />
            </TabsContent>

            <TabsContent value="status" className="mt-6">
              <WorkerStatusUpdater driver={currentDriver} />
            </TabsContent>
          </Tabs>
        </FadeIn>
      </div>
    </PageTransition>
  );
}
