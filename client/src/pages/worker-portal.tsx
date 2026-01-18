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

// Import child components
import WorkerDeliveryList from '@/components/worker-portal/worker-delivery-list';
import WorkerRouteOptimizer from '@/components/worker-portal/worker-route-optimizer';
import WorkerQRScanner from '@/components/worker-portal/worker-qr-scanner';
import WorkerStatusUpdater from '@/components/worker-portal/worker-status-updater';

// Mock data services for development
const deliveriesApi = {
  getByDriver: async (driverId: string) => {
    // Mock deliveries data
    return [
      {
        id: 'delivery-1',
        orderId: 'ORDER-123',
        driverId: driverId,
        status: 'assigned',
        pickupAddress: '123 Main Street, Bangalore',
        deliveryAddress: '456 Park Avenue, Bangalore',
        scheduledPickup: '2024-01-15T10:00:00Z',
        scheduledDelivery: '2024-01-15T14:00:00Z',
        customerName: 'John Doe',
        customerPhone: '9876543210',
        specialInstructions: 'Handle with care',
        priority: 'medium',
        estimatedTime: 30,
        distance: 5.2,
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-15T09:00:00Z'
      },
      {
        id: 'delivery-2',
        orderId: 'ORDER-456',
        driverId: driverId,
        status: 'picked_up',
        pickupAddress: '789 Oak Street, Bangalore',
        deliveryAddress: '321 Pine Street, Bangalore',
        scheduledPickup: '2024-01-15T11:00:00Z',
        scheduledDelivery: '2024-01-15T15:00:00Z',
        customerName: 'Jane Smith',
        customerPhone: '9876543211',
        specialInstructions: 'Express delivery',
        priority: 'high',
        estimatedTime: 45,
        distance: 8.5,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      }
    ];
  }
};

const driversApi = {
  getById: async (driverId: string) => {
    // Mock driver data
    return {
      id: driverId,
      name: 'Rajesh Kumar',
      phone: '9876543210',
      email: 'rajesh.kumar@fabzclean.com',
      licenseNumber: 'DL123456789',
      vehicleNumber: 'KA01AB1234',
      vehicleType: 'Two Wheeler',
      status: 'active',
      currentLatitude: 12.9716,
      currentLongitude: 77.5946,
      lastActive: new Date().toISOString(),
      rating: 4.8,
      totalDeliveries: 245,
      totalEarnings: '45000',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
};

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
  const [driverId] = useState('driver123'); // In a real app, this would come from auth

  // Fetch driver data
  const {
    data: driverData,
    isLoading: driverLoading,
    isError: driverError,
    error: driverErrorDetails,
  } = useQuery({
    queryKey: ['driver', driverId],
    queryFn: () => driversApi.getById(driverId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });

  // Fetch deliveries data
  const {
    data: deliveries = [],
    isLoading: deliveriesLoading,
    error: deliveriesError,
  } = useQuery({
    queryKey: ['driver-deliveries', driverId],
    queryFn: () => deliveriesApi.getByDriver(driverId),
    staleTime: 30 * 1000, // 30 seconds for real-time updates
    retry: 3,
  });

  // Mock driver data for development
  const currentDriver: Driver = driverData || {
    id: driverId,
    name: 'Rajesh Kumar',
    phone: '9876543210',
    email: 'rajesh.kumar@fabzclean.com',
    licenseNumber: 'DL123456789',
    vehicleNumber: 'KA01AB1234',
    vehicleType: 'Two Wheeler',
    status: 'active',
    currentLatitude: 12.9716,
    currentLongitude: 77.5946,
    lastActive: new Date().toISOString(),
    rating: 4.8,
    totalDeliveries: 245,
    totalEarnings: '45000',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Filter deliveries by current driver
  const currentDeliveries = useMemo(() => {
    return deliveries.filter((delivery: any) => delivery.driverId === currentDriver.id);
  }, [deliveries, currentDriver]);

  // Calculate driver metrics
  const driverMetrics = {
    totalDeliveries: currentDriver.totalDeliveries || 0,
    totalEarnings: parseFloat(currentDriver.totalEarnings || '0'),
    rating: currentDriver.rating || 0,
    activeDeliveries: currentDeliveries.filter((delivery: any) => delivery.status === 'in_transit' || delivery.status === 'assigned').length,
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
      case 'assigned':
        return { icon: Clock, color: 'text-blue-500', bgColor: 'bg-blue-50' };
      case 'picked_up':
        return { icon: Package, color: 'text-orange-500', bgColor: 'bg-orange-50' };
      case 'in_transit':
        return { icon: Truck, color: 'text-purple-500', bgColor: 'bg-purple-50' };
      case 'delivered':
        return { icon: CheckCircle2, color: 'text-green-500', bgColor: 'bg-green-50' };
      case 'failed':
        return { icon: AlertTriangle, color: 'text-red-500', bgColor: 'bg-red-50' };
      default:
        return { icon: Clock, color: 'text-gray-500', bgColor: 'bg-gray-50' };
    }
  };

  // Error state
  if (driverError) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-destructive text-lg font-semibold">
                Failed to load driver data
              </div>
              <p className="text-sm text-muted-foreground">
                {driverErrorDetails?.message || 'An unexpected error occurred'}
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

  if (driverLoading) {
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
                  <DropdownMenuItem>
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
              <WorkerDeliveryList deliveries={currentDeliveries} driver={currentDriver} />
            </TabsContent>

            <TabsContent value="route" className="mt-6">
              <WorkerRouteOptimizer deliveries={currentDeliveries} driver={currentDriver} />
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
