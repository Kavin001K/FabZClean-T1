import { useState, useEffect } from "react";
import { PlusCircle, User, Calendar, Truck, DollarSign, Search, CheckCircle, X, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Service, Order, Customer } from "../../../shared/schema";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/use-notifications";
import { ordersApi, customersApi } from "@/lib/data-service";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ServiceItem {
  service: Service;
  quantity: number;
  subtotal: number;
}

export default function CreateOrder() {
  // Customer state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

  // Customer creation popup
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [newCustomerNotes, setNewCustomerNotes] = useState('');

  // Services state
  const [selectedServices, setSelectedServices] = useState<ServiceItem[]>([]);

  // Payment state
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | 'none'>('none');
  const [discountValue, setDiscountValue] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [extraCharges, setExtraCharges] = useState(0);
  const [extraChargesLabel, setExtraChargesLabel] = useState('');

  // Order details
  const [pickupDate, setPickupDate] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [advancePayment, setAdvancePayment] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // Calculation state
  const [subtotal, setSubtotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  // Success modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Fetch services
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

  // Customer search by phone
  const handleFetchCustomer = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter at least 10 digits",
        variant: "destructive",
      });
      return;
    }

    setSearchingCustomer(true);
    try {
      const customer = await customersApi.searchByPhone(phoneNumber);

      if (customer) {
        setFoundCustomer(customer);
        setCustomerName(customer.name || "");
        setCustomerEmail(customer.email || "");
        setCustomerPhone(customer.phone || phoneNumber);
        setCustomerAddress(typeof customer.address === 'string' ? customer.address : JSON.stringify(customer.address) || "");

        toast({
          title: "Customer Found!",
          description: `Auto-filled data for ${customer.name}`,
        });
      } else {
        setFoundCustomer(null);
        setNewCustomerPhone(phoneNumber);
        setShowCustomerDialog(true);
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
      toast({
        title: "Error",
        description: "Failed to search for customer",
        variant: "destructive",
      });
    } finally {
      setSearchingCustomer(false);
    }
  };

  // Create new customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: Partial<Customer>) => {
      return await customersApi.create(customerData);
    },
    onSuccess: (newCustomer) => {
      if (newCustomer) {
        setFoundCustomer(newCustomer);
        setCustomerName(newCustomer.name || "");
        setCustomerEmail(newCustomer.email || "");
        setCustomerPhone(newCustomer.phone || "");
        setCustomerAddress(typeof newCustomer.address === 'string' ? newCustomer.address : JSON.stringify(newCustomer.address) || "");

        queryClient.invalidateQueries({ queryKey: ["customers"] });

        toast({
          title: "Customer Created!",
          description: `${newCustomer.name} has been added successfully.`,
        });

        setShowCustomerDialog(false);
        // Reset new customer form
        setNewCustomerName('');
        setNewCustomerPhone('');
        setNewCustomerEmail('');
        setNewCustomerAddress('');
        setNewCustomerNotes('');
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

  // Handle creating new customer
  const handleCreateCustomer = () => {
    if (!newCustomerName || !newCustomerPhone) {
      toast({
        title: "Validation Error",
        description: "Name and Phone are required",
        variant: "destructive",
      });
      return;
    }

    createCustomerMutation.mutate({
      name: newCustomerName,
      phone: newCustomerPhone,
      email: newCustomerEmail || undefined,
      address: newCustomerAddress || undefined,
    });
  };

  // Add service to order
  const handleAddService = (serviceId: string) => {
    const serviceToAdd = services?.find(s => s.id === serviceId);
    if (!serviceToAdd) return;

    const existingIndex = selectedServices.findIndex(s => s.service.id === serviceId);

    if (existingIndex >= 0) {
      // Increase quantity
      const updated = [...selectedServices];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].subtotal = updated[existingIndex].quantity * parseFloat(serviceToAdd.price);
      setSelectedServices(updated);
    } else {
      // Add new service
      setSelectedServices([...selectedServices, {
        service: serviceToAdd,
        quantity: 1,
        subtotal: parseFloat(serviceToAdd.price),
      }]);
    }
  };

  // Update service quantity
  const handleUpdateQuantity = (serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveService(serviceId);
      return;
    }

    const updated = selectedServices.map(item => {
      if (item.service.id === serviceId) {
        return {
          ...item,
          quantity,
          subtotal: quantity * parseFloat(item.service.price),
        };
      }
      return item;
    });
    setSelectedServices(updated);
  };

  // Remove service
  const handleRemoveService = (serviceId: string) => {
    setSelectedServices(selectedServices.filter(s => s.service.id !== serviceId));
  };

  // Calculate subtotal
  useEffect(() => {
    const newSubtotal = selectedServices.reduce((sum, item) => sum + item.subtotal, 0);
    setSubtotal(newSubtotal);
  }, [selectedServices]);

  // Calculate total with discounts and charges
  useEffect(() => {
    let calculatedTotal = subtotal;

    // Apply discount
    if (discountType === 'percentage') {
      calculatedTotal -= (subtotal * discountValue) / 100;
    } else if (discountType === 'fixed') {
      calculatedTotal -= discountValue;
    }

    // Add extra charges
    calculatedTotal += extraCharges;

    // Ensure total is not negative
    setTotalAmount(Math.max(0, calculatedTotal));
  }, [subtotal, discountType, discountValue, extraCharges]);

  // Create order mutation
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

        // Reset form
        resetForm();
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

  // Reset form
  const resetForm = () => {
    setPhoneNumber('');
    setFoundCustomer(null);
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setCustomerAddress('');
    setCustomerNotes('');
    setSelectedServices([]);
    setDiscountType('none');
    setDiscountValue(0);
    setCouponCode('');
    setExtraCharges(0);
    setExtraChargesLabel('');
    setPickupDate('');
    setSpecialInstructions('');
    setAdvancePayment('');
    setPaymentMethod('cash');
  };

  // Validate phone number
  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^[0-9]{10,15}$/;
    return phoneRegex.test(phone);
  };

  // Handle create order
  const handleCreateOrder = async () => {
    // Validation
    if (!customerName || !customerPhone) {
      toast({
        title: "Validation Error",
        description: "Customer name and phone are required",
        variant: "destructive",
      });
      return;
    }

    if (!validatePhoneNumber(customerPhone)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid phone number (10-15 digits)",
        variant: "destructive",
      });
      return;
    }

    if (selectedServices.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one service",
        variant: "destructive",
      });
      return;
    }

    let currentCustomerId = foundCustomer?.id;

    // If no customer found, create a new one
    if (!currentCustomerId) {
      try {
        const newCustomer = await customersApi.create({
          name: customerName,
          phone: customerPhone,
          email: customerEmail || undefined,
          address: customerAddress || undefined,
        });

        if (newCustomer) {
          currentCustomerId = newCustomer.id;
          queryClient.invalidateQueries({ queryKey: ["customers"] });
        } else {
          throw new Error("Failed to create new customer");
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to create customer. Please try again.",
          variant: "destructive",
        });
        return;
      }
    }

    if (!currentCustomerId) {
      toast({
        title: "Error",
        description: "Could not determine customer ID for the order.",
        variant: "destructive",
      });
      return;
    }

    const orderData: Partial<Order> = {
      orderNumber: `ORD-${Date.now()}`,
      customerId: currentCustomerId,
      customerName,
      customerEmail: customerEmail || undefined,
      customerPhone,
      status: "pending",
      paymentStatus: "pending",
      totalAmount: totalAmount.toFixed(2),
      items: selectedServices.map(item => ({
        productId: item.service.id,
        productName: item.service.name,
        quantity: item.quantity,
        price: item.service.price,
      })),
      shippingAddress: {
        instructions: specialInstructions,
        pickupDate: pickupDate || undefined,
      },
      advancePaid: advancePayment ? advancePayment : "0",
      paymentMethod: paymentMethod,
      discountType: discountType === 'none' ? undefined : discountType,
      discountValue: discountValue > 0 ? discountValue.toFixed(2) : undefined,
      couponCode: couponCode || undefined,
      extraCharges: extraCharges > 0 ? extraCharges.toFixed(2) : undefined,
    };

    createOrderMutation.mutate(orderData);
  };

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

  const discountAmount = discountType === 'percentage'
    ? (subtotal * discountValue) / 100
    : discountType === 'fixed'
      ? discountValue
      : 0;

  return (
    <div className="p-4 md:p-6 lg:p-8 animate-fade-in">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Create New Order</h1>
        <Button
          onClick={handleCreateOrder}
          disabled={createOrderMutation.isPending}
          size="lg"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          {createOrderMutation.isPending ? "Creating..." : "Create Order"}
        </Button>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Customer and Service Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Search Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="h-5 w-5 mr-2" />
                  Customer Search
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="phoneSearch">Phone Number</Label>
                    <Input
                      id="phoneSearch"
                      placeholder="Enter phone number to search customer"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleFetchCustomer()}
                      type="tel"
                      disabled={searchingCustomer}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleFetchCustomer}
                      disabled={searchingCustomer || !phoneNumber}
                    >
                      {searchingCustomer ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Fetch
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <AnimatePresence>
                  {foundCustomer && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-semibold text-green-800 dark:text-green-200">
                              Customer Found!
                            </p>
                            <p className="text-sm text-green-600 dark:text-green-400">
                              {foundCustomer.name} - {foundCustomer.phone}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          {/* Customer Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Name *</Label>
                    <Input
                      id="customerName"
                      placeholder="Customer's full name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Phone Number *</Label>
                    <Input
                      id="customerPhone"
                      placeholder="Phone number"
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Email Address</Label>
                  <Input
                    id="customerEmail"
                    placeholder="Email (optional)"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerAddress">Address</Label>
                  <Textarea
                    id="customerAddress"
                    placeholder="Customer's address (optional)"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Services Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="h-5 w-5 mr-2" />
                  Services Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Add Service *</Label>
                  <Select onValueChange={handleAddService} value="">
                    <SelectTrigger>
                      <SelectValue placeholder="Select a service to add..." />
                    </SelectTrigger>
                    <SelectContent>
                      {services && services.length > 0 ? (
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

                {selectedServices.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No services added yet. Select a service from the dropdown above.</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Service</TableHead>
                          <TableHead className="w-24">Quantity</TableHead>
                          <TableHead className="w-28">Price</TableHead>
                          <TableHead className="w-28">Subtotal</TableHead>
                          <TableHead className="w-16"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence>
                          {selectedServices.map((item) => (
                            <motion.tr
                              key={item.service.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{ duration: 0.2 }}
                              className="border-b"
                            >
                              <TableCell className="font-medium">{item.service.name}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateQuantity(item.service.id, parseInt(e.target.value) || 0)}
                                  className="w-20"
                                />
                              </TableCell>
                              <TableCell>₹{parseFloat(item.service.price).toFixed(2)}</TableCell>
                              <TableCell className="font-semibold">₹{item.subtotal.toFixed(2)}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveService(item.service.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Scheduling */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Scheduling & Instructions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment Adjustments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Pricing Adjustments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="discountType">Discount Type</Label>
                    <Select value={discountType} onValueChange={(value: 'percentage' | 'fixed' | 'none') => setDiscountType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Discount</SelectItem>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discountValue">Discount Value</Label>
                    <Input
                      id="discountValue"
                      type="number"
                      placeholder="0"
                      value={discountValue || ''}
                      onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                      disabled={discountType === 'none'}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="couponCode">Coupon Code</Label>
                  <Input
                    id="couponCode"
                    placeholder="Enter coupon code (optional)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="extraChargesLabel">Extra Charges Label</Label>
                    <Input
                      id="extraChargesLabel"
                      placeholder="e.g., Delivery, Express"
                      value={extraChargesLabel}
                      onChange={(e) => setExtraChargesLabel(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="extraCharges">Extra Charges Amount</Label>
                    <Input
                      id="extraCharges"
                      type="number"
                      placeholder="0"
                      value={extraCharges || ''}
                      onChange={(e) => setExtraCharges(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Advance Payment */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Advance Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="advancePayment">Advance Amount</Label>
                    <Input
                      id="advancePayment"
                      type="number"
                      placeholder="0.00"
                      value={advancePayment}
                      onChange={(e) => setAdvancePayment(e.target.value)}
                      max={totalAmount > 0 ? totalAmount : undefined}
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
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="sticky top-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="font-semibold text-sm text-muted-foreground">Selected Services:</p>
                  {selectedServices.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No services selected</p>
                  ) : (
                    <div className="space-y-1">
                      {selectedServices.map(item => (
                        <div key={item.service.id} className="flex justify-between text-sm">
                          <span>{item.service.name} x {item.quantity}</span>
                          <span className="font-medium">₹{item.subtotal.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                  </div>

                  <AnimatePresence>
                    {discountType !== 'none' && discountValue > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex justify-between text-sm text-red-600"
                      >
                        <span>
                          Discount {discountType === 'percentage' ? `(${discountValue}%)` : ''}
                        </span>
                        <span>-₹{discountAmount.toFixed(2)}</span>
                      </motion.div>
                    )}

                    {extraCharges > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex justify-between text-sm text-blue-600"
                      >
                        <span>{extraChargesLabel || 'Extra Charges'}</span>
                        <span>+₹{extraCharges.toFixed(2)}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Total Amount</span>
                    <span>₹{totalAmount.toFixed(2)}</span>
                  </div>

                  <AnimatePresence>
                    {advancePayment && parseFloat(advancePayment) > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2 pt-2 border-t"
                      >
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Advance Payment</span>
                          <span>₹{parseFloat(advancePayment || '0').toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-red-600">
                          <span>Balance Due</span>
                          <span>₹{(totalAmount - parseFloat(advancePayment || '0')).toFixed(2)}</span>
                        </div>
                        <Badge variant="outline" className="w-full justify-center">
                          {paymentMethod.toUpperCase()}
                        </Badge>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {couponCode && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Coupon: <strong>{couponCode}</strong>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Customer Creation Dialog */}
      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newCustomerName">Name *</Label>
              <Input
                id="newCustomerName"
                placeholder="Customer's full name"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newCustomerPhone">Phone Number *</Label>
              <Input
                id="newCustomerPhone"
                placeholder="Phone number"
                type="tel"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newCustomerEmail">Email</Label>
              <Input
                id="newCustomerEmail"
                placeholder="Email (optional)"
                type="email"
                value={newCustomerEmail}
                onChange={(e) => setNewCustomerEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newCustomerAddress">Address</Label>
              <Textarea
                id="newCustomerAddress"
                placeholder="Customer's address (optional)"
                value={newCustomerAddress}
                onChange={(e) => setNewCustomerAddress(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newCustomerNotes">Notes</Label>
              <Textarea
                id="newCustomerNotes"
                placeholder="Additional notes (optional)"
                value={newCustomerNotes}
                onChange={(e) => setNewCustomerNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCustomerDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCustomer}
              disabled={createCustomerMutation.isPending}
            >
              {createCustomerMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Customer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
              >
                <CheckCircle className="h-6 w-6 text-green-600" />
              </motion.div>
              Order Created Successfully!
            </DialogTitle>
          </DialogHeader>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="py-4 space-y-4"
          >
            <p>Your new order has been created and saved to the database.</p>
            {createdOrder && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p><strong>Order Number:</strong> {createdOrder.orderNumber}</p>
                <p><strong>Customer:</strong> {createdOrder.customerName}</p>
                <p><strong>Services:</strong> {selectedServices.map(s => `${s.service.name} (x${s.quantity})`).join(', ')}</p>
                <p><strong>Subtotal:</strong> ₹{subtotal.toFixed(2)}</p>
                {discountType !== 'none' && discountValue > 0 && (
                  <p><strong>Discount:</strong> {discountType === 'percentage' ? `${discountValue}%` : `₹${discountValue.toFixed(2)}`}</p>
                )}
                {extraCharges > 0 && (
                  <p><strong>{extraChargesLabel || 'Extra Charges'}:</strong> ₹{extraCharges.toFixed(2)}</p>
                )}
                <p><strong>Total Amount:</strong> ₹{parseFloat(createdOrder.totalAmount).toFixed(2)}</p>
                {advancePayment && parseFloat(advancePayment) > 0 && (
                  <>
                    <p><strong>Advance Paid:</strong> ₹{parseFloat(advancePayment).toFixed(2)}</p>
                    <p><strong>Balance Due:</strong> ₹{(parseFloat(createdOrder.totalAmount) - parseFloat(advancePayment)).toFixed(2)}</p>
                  </>
                )}
                <p><strong>Status:</strong> <Badge variant="secondary">{createdOrder.status}</Badge></p>
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
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
