import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Eye,
  Navigation,
  Package,
  User,
  Calendar,
  Zap,
  Target,
  Filter,
  Search,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  X
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

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

interface WorkerDeliveryListProps {
  deliveries: Delivery[];
  driver: Driver;
}

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'assigned':
      return { 
        label: 'Assigned', 
        icon: Clock, 
        color: 'text-blue-500', 
        bgColor: 'bg-blue-50',
        description: 'Ready for pickup'
      };
    case 'picked_up':
      return { 
        label: 'Picked Up', 
        icon: Package, 
        color: 'text-orange-500', 
        bgColor: 'bg-orange-50',
        description: 'In transit to delivery location'
      };
    case 'in_transit':
      return { 
        label: 'In Transit', 
        icon: Truck, 
        color: 'text-purple-500', 
        bgColor: 'bg-purple-50',
        description: 'On the way to delivery'
      };
    case 'delivered':
      return { 
        label: 'Delivered', 
        icon: CheckCircle2, 
        color: 'text-green-500', 
        bgColor: 'bg-green-50',
        description: 'Successfully delivered'
      };
    case 'failed':
      return { 
        label: 'Failed', 
        icon: AlertTriangle, 
        color: 'text-red-500', 
        bgColor: 'bg-red-50',
        description: 'Delivery failed'
      };
    default:
      return { 
        label: 'Unknown', 
        icon: Clock, 
        color: 'text-gray-500', 
        bgColor: 'bg-gray-50',
        description: 'Status unknown'
      };
  }
};

const getPriorityInfo = (priority: string) => {
  switch (priority) {
    case 'high':
      return { label: 'High', color: 'text-red-500', bgColor: 'bg-red-50' };
    case 'medium':
      return { label: 'Medium', color: 'text-yellow-500', bgColor: 'bg-yellow-50' };
    case 'low':
      return { label: 'Low', color: 'text-green-500', bgColor: 'bg-green-50' };
    default:
      return { label: 'Normal', color: 'text-gray-500', bgColor: 'bg-gray-50' };
  }
};

const WorkerDeliveryList: React.FC<WorkerDeliveryListProps> = ({ deliveries, driver }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [isDeliveryDetailsOpen, setIsDeliveryDetailsOpen] = useState(false);
  const { toast } = useToast();

  // Filter and search deliveries
  const filteredDeliveries = useMemo(() => {
    let filtered = deliveries.filter(delivery => {
      const matchesSearch = delivery.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        delivery.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        delivery.pickupAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
        delivery.deliveryAddress.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter !== 'all') {
        if (delivery.status !== statusFilter) return false;
      }

      if (priorityFilter !== 'all') {
        if (delivery.priority !== priorityFilter) return false;
      }

      return true;
    });

    // Sort by priority (high first), then by scheduled time
    filtered.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return new Date(a.scheduledDelivery).getTime() - new Date(b.scheduledDelivery).getTime();
    });

    return filtered;
  }, [deliveries, searchQuery, statusFilter, priorityFilter]);

  // Simple pagination implementation
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const totalPages = Math.ceil(filteredDeliveries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredDeliveries.slice(startIndex, endIndex);
  
  const goToPage = (page: number) => setCurrentPage(page);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const handleViewDeliveryDetails = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setIsDeliveryDetailsOpen(true);
  };

  const handleUpdateStatus = async (deliveryId: string, newStatus: string) => {
    try {
      // In a real app, this would call the API
      toast({
        title: "Status Updated",
        description: `Delivery status updated to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update delivery status",
        variant: "destructive",
      });
    }
  };

  const handleStartNavigation = (delivery: Delivery) => {
    // In a real app, this would open the device's navigation app
    const address = delivery.status === 'assigned' ? delivery.pickupAddress : delivery.deliveryAddress;
    toast({
      title: "Navigation Started",
      description: `Opening navigation to ${address}`,
    });
  };

  const handleCallCustomer = (phone: string) => {
    // In a real app, this would initiate a phone call
    window.open(`tel:${phone}`, '_self');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Truck className="h-5 w-5" /> My Deliveries
          </CardTitle>
          <CardDescription>Manage your assigned deliveries and track progress.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search deliveries by order ID, customer, or address..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset pagination on search
                }}
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
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        setSearchQuery('');
                        setCurrentPage(1);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="picked_up">Picked Up</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Deliveries Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedData.map((delivery, index) => {
              const statusInfo = getStatusInfo(delivery.status);
              const priorityInfo = getPriorityInfo(delivery.priority);
              const StatusIcon = statusInfo.icon;
              
              return (
                <motion.div
                  key={delivery.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-full ${statusInfo.bgColor}`}>
                            <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Order #{delivery.orderId}</p>
                            <p className="text-xs text-muted-foreground">{delivery.customerName}</p>
                          </div>
                        </div>
                        <Badge className={`${priorityInfo.color} ${priorityInfo.bgColor}`}>
                          {priorityInfo.label}
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">
                            {delivery.status === 'assigned' ? delivery.pickupAddress : delivery.deliveryAddress}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {delivery.status === 'assigned' ? 'Pickup' : 'Delivery'}: {' '}
                            {new Date(delivery.status === 'assigned' ? delivery.scheduledPickup : delivery.scheduledDelivery).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <span>{delivery.distance} km • {delivery.estimatedTime} min</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStartNavigation(delivery)}
                            className="gap-1"
                          >
                            <Navigation className="h-3 w-3" />
                            Navigate
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCallCustomer(delivery.customerPhone)}
                            className="gap-1"
                          >
                            <Phone className="h-3 w-3" />
                            Call
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDeliveryDetails(delivery)}
                          className="gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredDeliveries.length === 0 && (
            <div className="text-center py-8">
              <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No deliveries found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'You have no deliveries assigned at the moment.'}
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredDeliveries.length)} of {filteredDeliveries.length} deliveries
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(1)}
                  disabled={!hasPrevPage}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevPage}
                  disabled={!hasPrevPage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium px-3">
                  {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={!hasNextPage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(totalPages)}
                  disabled={!hasNextPage}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delivery Details Dialog */}
      <Dialog open={isDeliveryDetailsOpen} onOpenChange={setIsDeliveryDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Delivery Details
            </DialogTitle>
            <DialogDescription>
              Complete information for delivery #{selectedDelivery?.orderId}
            </DialogDescription>
          </DialogHeader>
          
          {selectedDelivery && (
            <div className="space-y-6">
              {/* Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Customer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="font-medium">{selectedDelivery.customerName}</p>
                      <p className="text-sm text-muted-foreground">{selectedDelivery.customerPhone}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCallCustomer(selectedDelivery.customerPhone)}
                      className="gap-2"
                    >
                      <Phone className="h-4 w-4" />
                      Call Customer
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Delivery Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className={`${getStatusInfo(selectedDelivery.status).color} ${getStatusInfo(selectedDelivery.status).bgColor}`}>
                        {getStatusInfo(selectedDelivery.status).label}
                      </Badge>
                      <Badge className={`${getPriorityInfo(selectedDelivery.priority).color} ${getPriorityInfo(selectedDelivery.priority).bgColor}`}>
                        {getPriorityInfo(selectedDelivery.priority).label} Priority
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getStatusInfo(selectedDelivery.status).description}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Address Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Pickup Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedDelivery.pickupAddress}</p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Scheduled: {new Date(selectedDelivery.scheduledPickup).toLocaleString()}
                    </div>
                    {selectedDelivery.actualPickup && (
                      <div className="mt-1 text-xs text-green-600">
                        Completed: {new Date(selectedDelivery.actualPickup).toLocaleString()}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Delivery Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedDelivery.deliveryAddress}</p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Scheduled: {new Date(selectedDelivery.scheduledDelivery).toLocaleString()}
                    </div>
                    {selectedDelivery.actualDelivery && (
                      <div className="mt-1 text-xs text-green-600">
                        Completed: {new Date(selectedDelivery.actualDelivery).toLocaleString()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Special Instructions */}
              {selectedDelivery.specialInstructions && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Special Instructions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedDelivery.specialInstructions}</p>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => handleStartNavigation(selectedDelivery)}
                  className="flex-1 gap-2"
                >
                  <Navigation className="h-4 w-4" />
                  Start Navigation
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleUpdateStatus(selectedDelivery.id, 'picked_up')}
                  className="gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark Picked Up
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleUpdateStatus(selectedDelivery.id, 'delivered')}
                  className="gap-2"
                >
                  <Package className="h-4 w-4" />
                  Mark Delivered
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default WorkerDeliveryList;
