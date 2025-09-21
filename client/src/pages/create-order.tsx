import { useState, useEffect } from "react";
import { PlusCircle, User, Calendar, Truck, DollarSign, Search, CheckCircle, Scale, Package, Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
  const [orderType, setOrderType] = useState<"piece_based" | "weight_based">("piece_based");
  const [urgency, setUrgency] = useState<"low" | "normal" | "high" | "urgent">("normal");
  const [garmentItems, setGarmentItems] = useState([
    {
      id: Date.now().toString(),
      garmentType: "",
      fabric: "",
      color: "",
      condition: "good",
      quantity: 1,
      weight: "",
      specialCare: "",
      stainDetails: "",
      damageNotes: ""
    }
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [manuallyEdited, setManuallyEdited] = useState({
    name: false,
    email: false
  });
  
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

  // Query for fetching customer data by phone number
  const { data: customerData, isLoading: customerLoading } = useQuery({
    queryKey: ["customer", customerPhone],
    queryFn: async () => {
      if (!customerPhone || customerPhone.length < 10) {
        return null;
      }
      const response = await fetch(`/api/customers?phone=${encodeURIComponent(customerPhone)}`);
      if (!response.ok) {
        throw new Error("Failed to fetch customer data");
      }
      return response.json();
    },
    enabled: customerPhone.length >= 10, // Only fetch when phone number is complete
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Auto-populate customer data when fetched
  useEffect(() => {
    if (customerData && customerData.length > 0) {
      const customer = customerData[0]; // Get first matching customer
      
      // Only auto-fill if fields haven't been manually edited
      if (!manuallyEdited.name) {
        setCustomerName(customer.name || "");
      }
      if (!manuallyEdited.email) {
        setCustomerEmail(customer.email || "");
      }
      
      // Show notification that customer data was auto-filled
      toast({
        title: "Customer Found!",
        description: `Auto-filled data for ${customer.name}`,
      });
    }
  }, [customerData, toast, manuallyEdited]);

  // Garment management functions
  const addGarmentItem = () => {
    setGarmentItems([...garmentItems, {
      id: Date.now().toString(),
      garmentType: "",
      fabric: "",
      color: "",
      condition: "good",
      quantity: 1,
      weight: "",
      specialCare: "",
      stainDetails: "",
      damageNotes: ""
    }]);
  };

  const removeGarmentItem = (id: string) => {
    if (garmentItems.length > 1) {
      setGarmentItems(garmentItems.filter(item => item.id !== id));
    }
  };

  const updateGarmentItem = (id: string, field: string, value: any) => {
    setGarmentItems(garmentItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Calculate totals
  const totalPieces = garmentItems.reduce((sum, item) =>
    orderType === "piece_based" || orderType === "mixed" ? sum + item.quantity : sum, 0);

  const totalWeight = garmentItems.reduce((sum, item) =>
    sum + (parseFloat(item.weight) || 0), 0);

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
      orderType,
      urgency,
      totalPieces,
      totalWeight: totalWeight.toString(),
      specialInstructions,
      garmentTypes: [...new Set(garmentItems.map(item => item.garmentType).filter(Boolean))],
      items: garmentItems.map(item => ({
        productId: selectedServiceDetails.id,
        productName: selectedServiceDetails.name,
        garmentType: item.garmentType,
        fabric: item.fabric,
        color: item.color,
        condition: item.condition,
        quantity: item.quantity,
        weight: item.weight,
        price: selectedServiceDetails.price,
        specialCare: item.specialCare,
        stainDetails: item.stainDetails,
        damageNotes: item.damageNotes,
        itemType: orderType
      })),
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
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      setManuallyEdited(prev => ({ ...prev, name: true }));
                    }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone Number *</Label>
                <div className="relative">
                  <Input
                      id="customerPhone"
                      placeholder="Enter customer's phone number"
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value);
                        // Reset manual edit tracking when phone number changes
                        setManuallyEdited({ name: false, email: false });
                      }}
                      required
                      className={customerLoading ? "pr-10" : customerData && customerData.length > 0 ? "pr-10 border-green-500" : ""}
                  />
                  {customerLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Search className="w-4 h-4 animate-pulse text-blue-500" />
                    </div>
                  )}
                  {customerData && customerData.length > 0 && !customerLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                  )}
                </div>
                {customerData && customerData.length > 0 && (
                  <div className="text-sm text-green-600 bg-green-50 dark:bg-green-900/20 p-2 rounded-md">
                    ✓ Customer found: {customerData[0].name}
                  </div>
                )}
                {customerPhone.length >= 10 && !customerLoading && (!customerData || customerData.length === 0) && (
                  <div className="text-sm text-blue-600 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md">
                    ℹ New customer - fill in the details below
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email Address</Label>
                <Input
                    id="customerEmail"
                    placeholder="Enter customer's email (optional)"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => {
                      setCustomerEmail(e.target.value);
                      setManuallyEdited(prev => ({ ...prev, email: true }));
                    }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Order Type &amp; Priority
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Order Type *</Label>
                  <Select value={orderType} onValueChange={(value: any) => setOrderType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="piece_based">
                        <div className="flex items-center">
                          <Package className="h-4 w-4 mr-2" />
                          Piece-Based
                        </div>
                      </SelectItem>
                      <SelectItem value="weight_based">
                        <div className="flex items-center">
                          <Scale className="h-4 w-4 mr-2" />
                          Weight-Based
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Urgency</Label>
                  <Select value={urgency} onValueChange={(value: any) => setUrgency(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Total Pieces:</span>
                  <span className="font-medium">{totalPieces}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Weight:</span>
                  <span className="font-medium">{totalWeight.toFixed(2)} kg</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Shirt className="h-5 w-5 mr-2" />
                  Garment Details
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addGarmentItem}>
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {garmentItems.map((item, index) => (
                <div key={item.id} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Garment {index + 1}</Label>
                    {garmentItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeGarmentItem(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`garmentType-${item.id}`}>Type</Label>
                      <Select
                        value={item.garmentType}
                        onValueChange={(value) => updateGarmentItem(item.id, 'garmentType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="shirt">Shirt</SelectItem>
                          <SelectItem value="pants">Pants</SelectItem>
                          <SelectItem value="suit">Suit</SelectItem>
                          <SelectItem value="dress">Dress</SelectItem>
                          <SelectItem value="jacket">Jacket</SelectItem>
                          <SelectItem value="curtains">Curtains</SelectItem>
                          <SelectItem value="comforter">Comforter</SelectItem>
                          <SelectItem value="carpet">Carpet</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`fabric-${item.id}`}>Fabric</Label>
                      <Select
                        value={item.fabric}
                        onValueChange={(value) => updateGarmentItem(item.id, 'fabric', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select fabric..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cotton">Cotton</SelectItem>
                          <SelectItem value="silk">Silk</SelectItem>
                          <SelectItem value="wool">Wool</SelectItem>
                          <SelectItem value="polyester">Polyester</SelectItem>
                          <SelectItem value="linen">Linen</SelectItem>
                          <SelectItem value="cashmere">Cashmere</SelectItem>
                          <SelectItem value="leather">Leather</SelectItem>
                          <SelectItem value="mixed">Mixed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`color-${item.id}`}>Color</Label>
                      <Input
                        id={`color-${item.id}`}
                        placeholder="e.g., Blue, White"
                        value={item.color}
                        onChange={(e) => updateGarmentItem(item.id, 'color', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`condition-${item.id}`}>Condition</Label>
                      <Select
                        value={item.condition}
                        onValueChange={(value) => updateGarmentItem(item.id, 'condition', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="worn">Worn</SelectItem>
                          <SelectItem value="damaged">Damaged</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {orderType !== "weight_based" && (
                      <div className="space-y-2">
                        <Label htmlFor={`quantity-${item.id}`}>Quantity</Label>
                        <Input
                          id={`quantity-${item.id}`}
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateGarmentItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        />
                      </div>
                    )}

                    {orderType !== "piece_based" && (
                      <div className="space-y-2">
                        <Label htmlFor={`weight-${item.id}`}>Weight (kg)</Label>
                        <Input
                          id={`weight-${item.id}`}
                          type="number"
                          step="0.1"
                          placeholder="0.0"
                          value={item.weight}
                          onChange={(e) => updateGarmentItem(item.id, 'weight', e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`specialCare-${item.id}`}>Special Care</Label>
                      <Input
                        id={`specialCare-${item.id}`}
                        placeholder="e.g., Dry clean only"
                        value={item.specialCare}
                        onChange={(e) => updateGarmentItem(item.id, 'specialCare', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`stainDetails-${item.id}`}>Stain Details</Label>
                      <Input
                        id={`stainDetails-${item.id}`}
                        placeholder="e.g., Oil stain on sleeve"
                        value={item.stainDetails}
                        onChange={(e) => updateGarmentItem(item.id, 'stainDetails', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`damageNotes-${item.id}`}>Damage Notes</Label>
                      <Input
                        id={`damageNotes-${item.id}`}
                        placeholder="e.g., Small tear"
                        value={item.damageNotes}
                        onChange={(e) => updateGarmentItem(item.id, 'damageNotes', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
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
