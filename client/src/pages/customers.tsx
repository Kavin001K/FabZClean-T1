import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Filter, 
  Plus, 
  Users, 
  DollarSign, 
  ShoppingBag, 
  TrendingUp,
  Mail,
  Phone,
  MapPin,
  Calendar
} from "lucide-react";
import { formatCurrency, formatNumber, getStatusColor } from "@/lib/data";
import { formatDistanceToNow } from "date-fns";
import type { Customer, Order } from "@shared/schema";

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const { data: customers, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const filteredCustomers = customers?.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Calculate customer metrics
  const totalCustomers = customers?.length || 0;
  const totalRevenue = customers?.reduce((sum, customer) => 
    sum + parseFloat(customer.totalSpent || "0"), 0) || 0;
  const averageOrderValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
  const topCustomers = customers?.sort((a, b) => 
    parseFloat(b.totalSpent || "0") - parseFloat(a.totalSpent || "0")
  ).slice(0, 5) || [];

  // Get customer orders
  const getCustomerOrders = (customerId: string) => {
    return orders?.filter(order => 
      customers?.find(c => c.id === customerId)?.name === order.customerName
    ) || [];
  };

  const isLoading = customersLoading || ordersLoading;

  if (isLoading) {
    return (
      <div className="p-8" data-testid="customers-page">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-bold text-3xl text-foreground">Customers</h1>
            <p className="text-muted-foreground mt-1">Manage customer relationships and profiles</p>
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
    <div className="p-8" data-testid="customers-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-3xl text-foreground">Customers</h1>
          <p className="text-muted-foreground mt-1">Manage customer relationships and profiles</p>
        </div>
        <Button 
          data-testid="add-customer"
          onClick={() => {
            console.log("Adding new customer...");
            alert("Customer creation feature coming soon! This would open a modal to add a new customer.");
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Customer Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bento-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-display font-bold text-foreground">
                  {formatNumber(totalCustomers)}
                </p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bento-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-display font-bold text-foreground">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bento-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Order Value</p>
                <p className="text-2xl font-display font-bold text-foreground">
                  {formatCurrency(averageOrderValue)}
                </p>
              </div>
              <ShoppingBag className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bento-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Growth Rate</p>
                <p className="text-2xl font-display font-bold text-foreground">
                  +12.3%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Customer List */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bento-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-display font-semibold text-xl text-foreground">
                  All Customers
                </CardTitle>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search customers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                      data-testid="search-customers"
                    />
                  </div>
                  <Button variant="outline" size="sm" data-testid="filter-customers">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Last Order</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => {
                    const customerOrders = getCustomerOrders(customer.id);
                    const lastOrder = customerOrders
                      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())[0];
                    
                    return (
                      <TableRow 
                        key={customer.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedCustomer(customer)}
                        data-testid={`customer-row-${customer.id}`}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                              <span className="text-xs text-primary-foreground font-medium">
                                {customer.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{customer.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Customer since {customer.createdAt && 
                                  new Date(customer.createdAt).getFullYear()}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            {customer.email && (
                              <p className="text-sm text-foreground">{customer.email}</p>
                            )}
                            {customer.phone && (
                              <p className="text-sm text-muted-foreground">{customer.phone}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {customer.totalOrders || 0}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(parseFloat(customer.totalSpent || "0"))}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {lastOrder?.createdAt && 
                            formatDistanceToNow(new Date(lastOrder.createdAt), { addSuffix: true })
                          }
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCustomer(customer);
                            }}
                            data-testid={`view-customer-${customer.id}`}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Customer Details / Top Customers */}
        <div className="space-y-6">
          {selectedCustomer ? (
            /* Customer Detail View */
            <Card className="bento-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display font-semibold text-lg text-foreground">
                    Customer Details
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSelectedCustomer(null)}
                    data-testid="close-customer-details"
                  >
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Customer Info */}
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-lg text-primary-foreground font-medium">
                        {selectedCustomer.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg text-foreground">{selectedCustomer.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Customer since {selectedCustomer.createdAt && 
                        new Date(selectedCustomer.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-foreground">Contact Information</h4>
                    {selectedCustomer.email && (
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{selectedCustomer.email}</span>
                      </div>
                    )}
                    {selectedCustomer.phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{selectedCustomer.phone}</span>
                      </div>
                    )}
                    {selectedCustomer.address && (
                      <div className="flex items-start gap-3 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div className="text-foreground">
                          {typeof selectedCustomer.address === 'object' && selectedCustomer.address && (
                            <>
                              <p>{(selectedCustomer.address as any).street}</p>
                              <p>{(selectedCustomer.address as any).city}, {(selectedCustomer.address as any).state} {(selectedCustomer.address as any).zip}</p>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Customer Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-lg font-display font-bold text-foreground">
                        {selectedCustomer.totalOrders || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Orders</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-lg font-display font-bold text-foreground">
                        {formatCurrency(parseFloat(selectedCustomer.totalSpent || "0"))}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Spent</p>
                    </div>
                  </div>

                  {/* Recent Orders */}
                  <div>
                    <h4 className="font-medium text-foreground mb-3">Recent Orders</h4>
                    <div className="space-y-2">
                      {getCustomerOrders(selectedCustomer.id).slice(0, 3).map((order) => (
                        <div 
                          key={order.id}
                          className="flex items-center justify-between p-3 border border-border rounded-lg"
                          data-testid={`customer-order-${order.orderNumber}`}
                        >
                          <div>
                            <p className="font-medium text-sm text-foreground">{order.orderNumber}</p>
                            <p className="text-xs text-muted-foreground">
                              {order.createdAt && formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm text-foreground">
                              {formatCurrency(parseFloat(order.totalAmount))}
                            </p>
                            <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Top Customers */
            <Card className="bento-card">
              <CardHeader>
                <CardTitle className="font-display font-semibold text-lg text-foreground">
                  Top Customers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topCustomers.map((customer, index) => (
                    <div 
                      key={customer.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
                      onClick={() => setSelectedCustomer(customer)}
                      data-testid={`top-customer-${index + 1}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-xs text-primary-foreground font-medium">
                            {customer.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">{customer.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {customer.totalOrders || 0} orders
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm text-foreground">
                          {formatCurrency(parseFloat(customer.totalSpent || "0"))}
                        </p>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-primary">#{index + 1}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
