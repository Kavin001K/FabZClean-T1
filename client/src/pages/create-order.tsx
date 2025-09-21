import { useState } from "react";
import { PlusCircle, User, Calendar, Truck, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Service, Order } from "../../shared/schema";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/use-notifications";
import { ordersApi } from "@/lib/data-service";
import { useLocation } from "wouter";

export default function CreateOrder() {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [advancePayment, setAdvancePayment] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: services, isLoading: servicesLoading, isError: servicesError } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: async () => {
      const response = await fetch("/api/services");
      if (!response.ok) {
        throw new Error("Failed to fetch services");
      }
      return response.json();
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: Partial<Order>) => {
      return await ordersApi.create(orderData);
    },
    onSuccess: (newOrder) => {
      if (newOrder) {
        setCreatedOrder(newOrder);
        setIsModalOpen(true);
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard/metrics"] });
        
        // Add notification
        addNotification({
          type: 'success',
          title: 'Order Created Successfully!',
          message: `Order ${newOrder.orderNumber} has been created for ${newOrder.customerName}`,
          actionUrl: '/orders',
          actionText: 'View Orders'
        });
        
        toast({
          title: "Order Created Successfully!",
          description: `Order ${newOrder.orderNumber} has been created and saved.`,
        });
      }
    },
    onError: (error) => {
      console.error('Failed to create order:', error);
      toast({
        title: "Error",
        description: "Failed to create order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateOrder = () => {
    if (!customerName || !customerPhone || !selectedService) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Name, Phone, Service).",
        variant: "destructive",
      });
      return;
    }

    const selectedServiceDetails = services?.find(s => s.id === selectedService);
    if (!selectedServiceDetails) {
      toast({
        title: "Error",
        description: "Selected service not found.",
        variant: "destructive",
      });
      return;
    }

    const orderData: Partial<Order> = {
      orderNumber: `ORD-${Date.now()}`,
      customerName,
      customerEmail: customerEmail || undefined,
      customerPhone,
      status: "pending",
      paymentStatus: "pending",
      totalAmount: selectedServiceDetails.price,
      items: [{
        productId: selectedServiceDetails.id,
        productName: selectedServiceDetails.name,
        quantity: 1,
        price: selectedServiceDetails.price,
      }],
      shippingAddress: {
        instructions: specialInstructions,
        pickupDate: pickupDate || undefined,
      },
      advancePaid: advancePayment ? advancePayment : "0",
      paymentMethod: paymentMethod,
    };

    createOrderMutation.mutate(orderData);
  };

  const selectedServiceDetails = services?.find(s => s.id === selectedService);

  // Handle loading state
  if (servicesLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 animate-fade-in">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Create New Order</h1>
        </header>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading services...</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (servicesError) {
    return (
      <div className="p-4 md:p-6 lg:p-8 animate-fade-in">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Create New Order</h1>
        </header>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive mb-4">Failed to load services. Please try again.</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 animate-fade-in">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Create New Order</h1>
        <Button 
          onClick={handleCreateOrder}
          disabled={createOrderMutation.isPending}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          {createOrderMutation.isPending ? "Creating..." : "Create Order"}
        </Button>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Customer and Service Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Name</Label>
                <Input
                    id="customerName"
                    placeholder="Enter customer's full name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone Number *</Label>
                <Input
                    id="customerPhone"
                    placeholder="Enter customer's phone number"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email Address</Label>
                <Input
                    id="customerEmail"
                    placeholder="Enter customer's email (optional)"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="h-5 w-5 mr-2" />
                Service &amp; Scheduling
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Service *</Label>
                <Select onValueChange={setSelectedService} value={selectedService} required>
                    <SelectTrigger>
                    <SelectValue placeholder="Select a service..." />
                    </SelectTrigger>
                    <SelectContent>
                    {servicesLoading ? (
                        <SelectItem value="loading" disabled>Loading services...</SelectItem>
                    ) : services && services.length > 0 ? (
                        services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                            {service.name} - ₹{parseFloat(service.price).toFixed(2)}
                        </SelectItem>
                        ))
                    ) : (
                        <SelectItem value="no-services" disabled>No services available</SelectItem>
                    )}
                    </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickupDate">Pickup Date</Label>
                <Input
                    id="pickupDate"
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialInstructions">Special Instructions</Label>
                <Textarea
                    id="specialInstructions"
                    placeholder="e.g., gate code, specific drop-off location"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                />
              </div>
              
              {/* Advance Payment Section */}
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  <Label className="text-base font-semibold">Advance Payment (Optional)</Label>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="advancePayment">Advance Amount</Label>
                    <Input
                        id="advancePayment"
                        type="number"
                        placeholder="0.00"
                        value={advancePayment}
                        onChange={(e) => setAdvancePayment(e.target.value)}
                        max={selectedServiceDetails ? parseFloat(selectedServiceDetails.price) : undefined}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Credit/Debit Card</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {selectedServiceDetails && advancePayment && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>Total Amount:</span>
                      <span className="font-medium">₹{parseFloat(selectedServiceDetails.price).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Advance Payment:</span>
                      <span className="font-medium text-green-600">₹{parseFloat(advancePayment || '0').toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold border-t pt-1 mt-1">
                      <span>Balance Due:</span>
                      <span className="text-red-600">₹{(parseFloat(selectedServiceDetails.price) - parseFloat(advancePayment || '0')).toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Service</span>
                <span>{selectedServiceDetails ? selectedServiceDetails.name : "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span>Service Price</span>
                <span>{selectedServiceDetails ? `₹${parseFloat(selectedServiceDetails.price).toFixed(2)}` : "₹0.00"}</span>
              </div>
              
              {advancePayment && (
                <>
                  <div className="flex justify-between text-green-600">
                    <span>Advance Payment</span>
                    <span>-₹{parseFloat(advancePayment || '0').toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Balance Due</span>
                    <span className="text-red-600 font-semibold">
                      ₹{selectedServiceDetails ? (parseFloat(selectedServiceDetails.price) - parseFloat(advancePayment || '0')).toFixed(2) : "0.00"}
                    </span>
                  </div>
                </>
              )}
              
              <div className="border-t pt-4 flex justify-between font-bold text-lg">
                <span>Total Amount</span>
                <span>{selectedServiceDetails ? `₹${parseFloat(selectedServiceDetails.price).toFixed(2)}` : "₹0.00"}</span>
              </div>
              
              {advancePayment && (
                <div className="text-center">
                  <Badge variant="outline" className="text-green-600">
                    {paymentMethod.toUpperCase()} Payment: ₹{parseFloat(advancePayment).toFixed(2)}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Order Created Successfully!</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <p>Your new order has been created and saved to the database.</p>
                {createdOrder && (
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <p><strong>Order Number:</strong> {createdOrder.orderNumber}</p>
                    <p><strong>Customer:</strong> {createdOrder.customerName}</p>
                    <p><strong>Service:</strong> {selectedServiceDetails?.name}</p>
                    <p><strong>Total Amount:</strong> ₹{parseFloat(createdOrder.totalAmount).toFixed(2)}</p>
                    <p><strong>Status:</strong> <span className="capitalize">{createdOrder.status}</span></p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button onClick={() => setIsModalOpen(false)} variant="outline">
                    Close
                  </Button>
                  <Button onClick={() => {
                    setIsModalOpen(false);
                    setLocation('/orders');
                  }}>
                    View Orders
                  </Button>
                </div>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
