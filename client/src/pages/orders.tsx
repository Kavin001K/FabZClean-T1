import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Plus, List, Kanban, Calendar, Clock, User, DollarSign, Package } from "lucide-react";
import { formatCurrency, getStatusColor } from "@/lib/data";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@shared/schema";

type ViewMode = "list" | "kanban" | "calendar";

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const { toast } = useToast();

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const filteredOrders = orders?.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const statusCounts = orders?.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Organize orders by status for Kanban view
  const kanbanColumns = [
    { id: "pending", title: "Pending Orders", color: "bg-yellow-500", orders: filteredOrders.filter(order => order.status === "pending") },
    { id: "processing", title: "In Processing", color: "bg-blue-500", orders: filteredOrders.filter(order => order.status === "processing") },
    { id: "ready", title: "Ready for Pickup", color: "bg-purple-500", orders: filteredOrders.filter(order => order.status === "ready") },
    { id: "completed", title: "Completed", color: "bg-green-500", orders: filteredOrders.filter(order => order.status === "completed") }
  ];

  if (isLoading) {
    return (
      <div className="p-8" data-testid="orders-page">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-bold text-3xl text-foreground">Orders</h1>
            <p className="text-muted-foreground mt-1">Manage customer orders and fulfillment</p>
          </div>
        </div>
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8" data-testid="orders-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-3xl text-foreground">Order Lifecycle Management</h1>
          <p className="text-muted-foreground mt-1">Track orders through their complete lifecycle with intelligent workflow management</p>
        </div>
        <div className="flex items-center gap-4">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 px-3"
            >
              <List className="w-4 h-4 mr-1" />
              List
            </Button>
            <Button
              variant={viewMode === "kanban" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("kanban")}
              className="h-8 px-3"
            >
              <Kanban className="w-4 h-4 mr-1" />
              Kanban
            </Button>
            <Button
              variant={viewMode === "calendar" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("calendar")}
              className="h-8 px-3"
            >
              <Calendar className="w-4 h-4 mr-1" />
              Calendar
            </Button>
          </div>
          <Button 
            data-testid="create-order"
            onClick={() => {
              // In a real app, this would open a modal or navigate to order creation
              console.log("Creating new order...");
              toast({
                title: "Order Creation",
                description: "Order creation feature coming soon! This would open a modal to create a new order.",
              });
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Order
          </Button>
        </div>
      </div>

      {/* Order Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bento-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-display font-bold text-foreground">
                  {statusCounts.pending || 0}
                </p>
              </div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bento-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-2xl font-display font-bold text-foreground">
                  {statusCounts.processing || 0}
                </p>
              </div>
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bento-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-display font-bold text-foreground">
                  {statusCounts.completed || 0}
                </p>
              </div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bento-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-display font-bold text-foreground">
                  {orders?.length || 0}
                </p>
              </div>
              <div className="w-3 h-3 rounded-full bg-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
              data-testid="search-orders"
            />
          </div>
          <Button variant="outline" size="sm" data-testid="filter-orders">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Conditional View Rendering */}
      {viewMode === "list" && (
        <Card className="bento-card">
          <CardHeader>
            <CardTitle className="font-display font-semibold text-xl text-foreground">
              All Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} data-testid={`order-row-${order.orderNumber}`}>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.customerName}</p>
                        <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.paymentStatus)}>
                        {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(parseFloat(order.totalAmount))}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {order.createdAt && formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" data-testid={`view-order-${order.orderNumber}`}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Kanban Board View */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {kanbanColumns.map((column) => (
            <Card key={column.id} className="bento-card h-fit">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display font-semibold text-lg text-foreground flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${column.color}`}></div>
                    {column.title}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {column.orders.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {column.orders.map((order) => (
                  <Card key={order.id} className="kanban-order-card p-4 hover:shadow-md transition-all duration-200 cursor-pointer border border-border/50 hover:border-primary/20">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-foreground">{order.orderNumber}</span>
                        <Badge variant="outline" className="text-xs">
                          {formatCurrency(parseFloat(order.totalAmount))}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="w-3 h-3" />
                        <span className="truncate">{order.customerName}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{order.createdAt && formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}</span>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-border/30">
                        <Badge className={getStatusColor(order.paymentStatus)} variant="outline">
                          <DollarSign className="w-3 h-3 mr-1" />
                          {order.paymentStatus}
                        </Badge>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                          View
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
                
                {column.orders.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No orders in this stage</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <Card className="bento-card">
          <CardHeader>
            <CardTitle className="font-display font-semibold text-xl text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Order Calendar
            </CardTitle>
            <p className="text-sm text-muted-foreground">Track orders by delivery dates and schedule pickups</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - date.getDay() + i);
                const dayOrders = orders?.filter(order => {
                  if (!order.createdAt) return false;
                  const orderDate = new Date(order.createdAt);
                  return orderDate.toDateString() === date.toDateString();
                }) || [];
                
                return (
                  <div 
                    key={i} 
                    className={`min-h-[80px] p-2 border border-border rounded-lg ${
                      date.toDateString() === new Date().toDateString() 
                        ? 'bg-primary/10 border-primary' 
                        : 'bg-muted/30'
                    }`}
                  >
                    <div className="text-sm font-medium text-foreground mb-1">
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayOrders.slice(0, 2).map((order, idx) => (
                        <div 
                          key={idx}
                          className={`text-xs p-1 rounded ${
                            order.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                            order.status === 'processing' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                            order.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                            'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          }`}
                        >
                          {order.orderNumber}
                        </div>
                      ))}
                      {dayOrders.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayOrders.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Processing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Cancelled</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
