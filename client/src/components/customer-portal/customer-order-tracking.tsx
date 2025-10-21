import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Clock,
  MapPin,
  Truck,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  Eye,
  Download,
  Phone,
  MessageCircle,
  Calendar,
  CreditCard,
  User,
  Mail,
  Phone as PhoneIcon,
  Search,
  Filter,
  ArrowRight,
  Timer,
  Route,
  Navigation
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useFuzzySearch } from '@/hooks/use-fuzzy-search';
// import { usePagination } from '@/hooks/use-pagination';
// import type { Order, Customer } from '../../../shared/schema';

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

interface CustomerOrderTrackingProps {
  orders: Order[];
  customer: Customer;
}

export default function CustomerOrderTracking({ orders, customer }: CustomerOrderTrackingProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const { toast } = useToast();

  // Filter and search orders
  const filteredOrders = useMemo(() => {
    let filtered = orders.filter(order => {
      const matchesSearch = order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some((item: any) => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (statusFilter === 'all') return true;
      return order.status === statusFilter;
    });

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return filtered;
  }, [orders, searchQuery, statusFilter]);

  // Simple pagination implementation
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredOrders.slice(startIndex, endIndex);
  
  const goToPage = (page: number) => setCurrentPage(page);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // Get status info
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          label: 'Completed',
          description: 'Order has been delivered successfully'
        };
      case 'processing':
        return {
          icon: RefreshCw,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          label: 'Processing',
          description: 'Order is being processed'
        };
      case 'pending':
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          label: 'Pending',
          description: 'Order is waiting to be processed'
        };
      case 'cancelled':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          label: 'Cancelled',
          description: 'Order has been cancelled'
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          label: 'Unknown',
          description: 'Status unknown'
        };
    }
  };

  // Get payment status info
  const getPaymentStatusInfo = (status: string) => {
    switch (status) {
      case 'paid':
        return { color: 'text-green-600', bgColor: 'bg-green-100', label: 'Paid' };
      case 'pending':
        return { color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: 'Pending' };
      case 'failed':
        return { color: 'text-red-600', bgColor: 'bg-red-100', label: 'Failed' };
      default:
        return { color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'Unknown' };
    }
  };

  // Calculate estimated delivery time
  const getEstimatedDelivery = (order: Order) => {
    if (order.deliveryDate) {
      return new Date(order.deliveryDate).toLocaleDateString();
    }
    if (order.pickupDate) {
      const pickupDate = new Date(order.pickupDate);
      const deliveryDate = new Date(pickupDate.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days after pickup
      return deliveryDate.toLocaleDateString();
    }
    return 'TBD';
  };

  // Get order progress percentage
  const getOrderProgress = (order: Order) => {
    switch (order.status) {
      case 'pending':
        return 25;
      case 'processing':
        return 75;
      case 'completed':
        return 100;
      case 'cancelled':
        return 0;
      default:
        return 0;
    }
  };

  // Handle order actions
  const handleTrackOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailDialogOpen(true);
    toast({
      title: "Tracking Order",
      description: `Tracking details for ${order.orderNumber}`,
    });
  };

  const handleContactSupport = (order: Order) => {
    toast({
      title: "Contacting Support",
      description: `Support will contact you regarding ${order.orderNumber}`,
    });
  };

  const handleDownloadReceipt = (order: Order) => {
    toast({
      title: "Downloading Receipt",
      description: `Receipt for ${order.orderNumber} is being downloaded`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Order Tracking</h2>
          <p className="text-gray-600">Track your orders and view order history</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Orders
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders by number, items, or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {paginatedData.map((order, index) => {
            const statusInfo = getStatusInfo(order.status);
            const paymentInfo = getPaymentStatusInfo(order.paymentStatus);
            const StatusIcon = statusInfo.icon;
            const progress = getOrderProgress(order);

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                layout
              >
                <Card className="hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                        <CardDescription>
                          Placed on {new Date(order.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Order Status Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Order Progress</span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${statusInfo.bgColor.replace('bg-', 'bg-').replace('-100', '-500')}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span>{order.items.length} items • ₹{order.totalAmount}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline" className={paymentInfo.color}>
                          {paymentInfo.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Est. Delivery: {getEstimatedDelivery(order)}</span>
                      </div>
                    </div>

                    {/* Order Items Preview */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Items:</div>
                      <div className="space-y-1">
                  {order.items.slice(0, 2).map((item: any, itemIndex: number) => (
                    <div key={itemIndex} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{item.name}</span>
                      <span className="font-medium">₹{item.price}</span>
                    </div>
                  ))}
                        {order.items.length > 2 && (
                          <div className="text-sm text-muted-foreground">
                            +{order.items.length - 2} more items
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleTrackOrder(order)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDownloadReceipt(order)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Receipt
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={prevPage}
            disabled={!hasPrevPage}
          >
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => (
              <Button
                key={i}
                variant={currentPage === i + 1 ? "default" : "outline"}
                size="sm"
                onClick={() => goToPage(i + 1)}
                className="w-8 h-8 p-0"
              >
                {i + 1}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={nextPage}
            disabled={!hasNextPage}
          >
            Next
          </Button>
        </div>
      )}

      {/* Empty State */}
      {filteredOrders.length === 0 && (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center space-y-4">
              <div className="rounded-full bg-muted p-6 w-20 h-20 mx-auto flex items-center justify-center">
                <Package className="h-10 w-10 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No orders found</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'You haven\'t placed any orders yet'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Details - {selectedOrder?.orderNumber}
            </DialogTitle>
            <DialogDescription>
              Complete information about your order
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(() => {
                      const statusInfo = getStatusInfo(selectedOrder.status);
                      const StatusIcon = statusInfo.icon;
                      return (
                        <>
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full ${statusInfo.bgColor}`}>
                              <StatusIcon className={`h-6 w-6 ${statusInfo.color}`} />
                            </div>
                            <div>
                              <div className="font-semibold">{statusInfo.label}</div>
                              <div className="text-sm text-muted-foreground">{statusInfo.description}</div>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full transition-all duration-300 ${statusInfo.bgColor.replace('bg-', 'bg-').replace('-100', '-500')}`}
                              style={{ width: `${getOrderProgress(selectedOrder)}%` }}
                            />
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">Quantity: {item.quantity}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">₹{item.price}</div>
                          <div className="text-sm text-muted-foreground">Total: ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-3 border-t font-semibold text-lg">
                      <span>Total Amount:</span>
                      <span>₹{selectedOrder.totalAmount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Delivery Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Pickup Date</div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedOrder.pickupDate ? new Date(selectedOrder.pickupDate).toLocaleDateString() : 'TBD'}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Delivery Date</div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedOrder.deliveryDate ? new Date(selectedOrder.deliveryDate).toLocaleDateString() : 'TBD'}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Delivery Address</div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        {selectedOrder.shippingAddress ? (
                          <div>
                            <div>{selectedOrder.shippingAddress.street}</div>
                            <div>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}</div>
                            <div>{selectedOrder.shippingAddress.zipCode}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No address provided</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedOrder.customerName}</span>
                  </div>
                  {selectedOrder.customerEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedOrder.customerEmail}</span>
                    </div>
                  )}
                  {selectedOrder.customerPhone && (
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedOrder.customerPhone}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-3">
                <Button className="flex-1">
                  <Phone className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
                <Button variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download Receipt
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
