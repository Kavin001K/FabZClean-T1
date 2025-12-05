import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { PlusCircle, User, Calendar as CalendarIcon, Truck, DollarSign, Search, CheckCircle, X, Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Service, Order, Customer } from "../../../shared/schema";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/use-notifications";
import { ordersApi, customersApi, servicesApi } from '@/lib/data-service';
import { useInvoicePrint } from '@/hooks/use-invoice-print';
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CustomerAutocomplete } from "@/components/customer-autocomplete";
import { OrderConfirmationDialog } from "@/components/orders/order-confirmation-dialog";

interface ServiceItem {
  service: Service;
  quantity: number;
  // Allows per‑order price override without mutating the original service price
  priceOverride: number;
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
  const [pickupDate, setPickupDate] = useState<Date>();
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [advancePayment, setAdvancePayment] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [enableGST, setEnableGST] = useState(false);
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');

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
  const { printInvoice } = useInvoicePrint();

  // Fetch services - only active ones
  const { data: servicesData, isLoading: servicesLoading, isError: servicesError } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: async () => {
      const allServices = await servicesApi.getAll();
      // Filter to only show Active services (case-insensitive)
      return allServices.filter(service =>
        service.status?.toLowerCase() === 'active'
      );
    },
  });

  // Ensure services is always an array
  const services = Array.isArray(servicesData) ? servicesData : [];

  // Fetch all customers for autocomplete
  const { data: customersData } = useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: () => customersApi.getAll(),
  });

  const customers = Array.isArray(customersData) ? customersData : [];

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

        // Handle address which could be jsonb or string
        let addressStr = "";
        if (customer.address) {
          try {
            const rawAddr = customer.address;
            // If it's a string, try to parse it first
            const addrObj = typeof rawAddr === 'string' && rawAddr.startsWith('{')
              ? JSON.parse(rawAddr)
              : rawAddr;

            if (typeof addrObj === 'object' && addrObj !== null) {
              // It's an object (or parsed object), look for line1
              if (addrObj.line1) {
                addressStr = addrObj.line1;
              } else {
                // Fallback: stringify the whole object if no line1
                addressStr = JSON.stringify(addrObj);
              }
            } else {
              // It's a simple string
              addressStr = String(addrObj);
            }
          } catch (e) {
            // If parsing fails, use as is
            addressStr = String(customer.address);
          }
        }
        setCustomerAddress(addressStr);

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

  // Handle customer selection from autocomplete
  const handleSelectCustomer = (customer: Customer) => {
    setFoundCustomer(customer);
    setCustomerName(customer.name || "");
    setCustomerEmail(customer.email || "");
    setCustomerPhone(customer.phone || "");

    // Handle address which could be jsonb or string
    let addressStr = "";
    if (customer.address) {
      try {
        const rawAddr = customer.address;
        // If it's a string, try to parse it first
        const addrObj = typeof rawAddr === 'string' && rawAddr.startsWith('{')
          ? JSON.parse(rawAddr)
          : rawAddr;

        if (typeof addrObj === 'object' && addrObj !== null) {
          // It's an object (or parsed object), look for line1
          if (addrObj.line1) {
            addressStr = addrObj.line1;
          } else {
            // Fallback: stringify the whole object if no line1
            addressStr = JSON.stringify(addrObj);
          }
        } else {
          // It's a simple string
          addressStr = String(addrObj);
        }
      } catch (e) {
        // If parsing fails, use as is
        addressStr = String(customer.address);
      }
    }
    setCustomerAddress(addressStr);

    toast({
      title: "Customer Selected!",
      description: `Details loaded for ${customer.name}`,
    });
  };

  // Create new customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: Partial<Customer>) => {
      const result = await customersApi.create(customerData);
      if (!result) throw new Error("Failed to create customer");
      return result;
    },
    onSuccess: (newCustomer) => {
      if (newCustomer) {
        setFoundCustomer(newCustomer);
        setCustomerName(newCustomer.name || "");
        setCustomerEmail(newCustomer.email || "");
        setCustomerPhone(newCustomer.phone || "");

        // Handle address which could be jsonb or string
        let addressStr = "";
        if (newCustomer.address) {
          try {
            const rawAddr = newCustomer.address;
            // If it's a string, try to parse it first
            const addrObj = typeof rawAddr === 'string' && rawAddr.startsWith('{')
              ? JSON.parse(rawAddr)
              : rawAddr;

            if (typeof addrObj === 'object' && addrObj !== null) {
              // It's an object (or parsed object), look for line1
              if (addrObj.line1) {
                addressStr = addrObj.line1;
              } else {
                // Fallback: stringify the whole object if no line1
                addressStr = JSON.stringify(addrObj);
              }
            } else {
              // It's a simple string
              addressStr = String(addrObj);
            }
          } catch (e) {
            // If parsing fails, use as is
            addressStr = String(newCustomer.address);
          }
        }
        setCustomerAddress(addressStr);

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
        description: error instanceof Error ? error.message : "Failed to create customer. Please try again.",
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

    // Validate email if provided
    if (newCustomerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCustomerEmail)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    createCustomerMutation.mutate({
      name: newCustomerName,
      phone: newCustomerPhone,
      email: newCustomerEmail || undefined,
      // Send address as an object to satisfy jsonb requirement
      address: newCustomerAddress ? { line1: newCustomerAddress } : undefined,
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
      const price = updated[existingIndex].priceOverride;
      updated[existingIndex].subtotal = updated[existingIndex].quantity * price;
      setSelectedServices(updated);
    } else {
      // Add new service with its base price as the default override
      setSelectedServices([...selectedServices, {
        service: serviceToAdd,
        quantity: 1,
        priceOverride: parseFloat(serviceToAdd.price),
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
        const price = item.priceOverride;
        return {
          ...item,
          quantity,
          subtotal: quantity * price,
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

    // Apply GST if enabled (18%)
    if (enableGST) {
      calculatedTotal += calculatedTotal * 0.18;
    }

    // Ensure total is not negative
    setTotalAmount(Math.max(0, calculatedTotal));
  }, [subtotal, discountType, discountValue, extraCharges, enableGST]);

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: Partial<Order>) => {
      return await ordersApi.create(orderData);
    },
    onSuccess: async (responseOrder) => {
      if (responseOrder) {
        // 🛡️ DEFENSIVE FIX: Normalize order data using form state as fallback
        // This ensures the dialog works even if the backend returns snake_case or missing fields
        const newOrder: any = { ...responseOrder };

        // 1. Ensure Customer Phone (Critical for WhatsApp)
        if (!newOrder.customerPhone) {
          newOrder.customerPhone = newOrder.customer_phone || customerPhone;
        }

        // 2. Ensure Items (Critical for Tags/Bill)
        if (!newOrder.items || !Array.isArray(newOrder.items) || newOrder.items.length === 0) {
          console.warn('⚠️ Backend returned no items, using form state');
          newOrder.items = selectedServices.map(item => ({
            productId: item.service.id,
            productName: item.service.name,
            quantity: item.quantity,
            price: item.priceOverride,
            service: item.service.name // Ensure service name is present
          }));
        }

        // 3. Ensure Total Amount
        if (!newOrder.totalAmount || newOrder.totalAmount === '0' || newOrder.totalAmount === 0) {
          newOrder.totalAmount = newOrder.total_amount || totalAmount.toString();
        }

        // 4. Ensure Order Number
        if (!newOrder.orderNumber) {
          newOrder.orderNumber = newOrder.order_number;
        }

        // 5. Ensure Customer Name
        if (!newOrder.customerName) {
          newOrder.customerName = newOrder.customer_name || customerName;
        }

        console.log('✅ Normalized Order for Dialog:', newOrder);

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

        // Automatically send WhatsApp notification with PDF
        // Customer phone is mandatory, use it from order data
        if (newOrder.customerPhone) {
          // Run in background
          setTimeout(async () => {
            try {
              const { WhatsAppService } = await import('@/lib/whatsapp-service');

              // Calculate total
              let totalAmount = 0;
              if (typeof newOrder.totalAmount === 'string') {
                totalAmount = parseFloat(newOrder.totalAmount.replace(/[^0-9.]/g, '')) || 0;
              } else {
                totalAmount = Number(newOrder.totalAmount) || 0;
              }

              // Fallback to items calculation
              if (totalAmount === 0 && Array.isArray(newOrder.items) && newOrder.items.length > 0) {
                totalAmount = newOrder.items.reduce((sum: number, item: any) => {
                  const price = parseFloat(String(item.price || 0));
                  const qty = parseInt(String(item.quantity || 1));
                  return sum + (price * qty);
                }, 0);
              }

              const billUrl = `${window.location.origin}/bill/${newOrder.orderNumber}`;

              // Generate PDF
              let pdfUrl: string | undefined;
              try {
                toast({
                  title: "📄 Preparing invoice...",
                  description: "Generating PDF",
                });

                const { PDFService } = await import('@/lib/pdf-service');
                pdfUrl = await PDFService.generateAndUploadBillPDF(newOrder.orderNumber, enableGST);
                console.log('✅ PDF generated:', pdfUrl);
              } catch (pdfError) {
                console.warn('⚠️ PDF failed, sending link only:', pdfError);
              }

              // Send WhatsApp using customer phone from order
              const success = await WhatsAppService.sendOrderBill(
                newOrder.customerPhone,
                newOrder.orderNumber,
                newOrder.customerName || 'Valued Customer',
                totalAmount,
                billUrl,
                pdfUrl
              );

              if (success) {
                toast({
                  title: "📱 WhatsApp Sent!",
                  description: pdfUrl
                    ? `Invoice PDF sent to ${newOrder.customerPhone}`
                    : `Bill link sent to ${newOrder.customerPhone}`,
                });
              } else {
                console.warn('⚠️ Auto WhatsApp failed - customer can use manual button');
              }
            } catch (error) {
              console.error('❌ Auto WhatsApp error:', error);
              // Silent fail - manual button still available
            }
          }, 1000);
        } else {
          console.warn('⚠️ No customer phone in order - skipping auto WhatsApp');
        }

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
    setPickupDate(undefined);
    setSpecialInstructions('');
    setAdvancePayment('');
    setPaymentMethod('cash');
    setPaymentStatus('pending');
    setEnableGST(true);
    setGstNumber('');
    setPanNumber('');
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
        // Validate email if provided
        if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
          toast({
            title: "Validation Error",
            description: "Please enter a valid email address",
            variant: "destructive",
          });
          return;
        }

        const newCustomer = await customersApi.create({
          name: customerName,
          phone: customerPhone,
          email: customerEmail || undefined,
          // Send address as an object to satisfy jsonb requirement
          address: customerAddress ? { line1: customerAddress } : undefined,
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

    const orderData: any = {
      orderNumber: `ORD-${Date.now()}`,
      customerId: currentCustomerId,
      customerName,
      customerEmail: customerEmail || undefined,
      customerPhone,
      status: "pending",
      paymentStatus: paymentStatus,
      totalAmount: totalAmount.toFixed(2),
      items: selectedServices.map(item => ({
        serviceId: item.service.id,
        serviceName: item.service.name,
        quantity: item.quantity,
        // Use the overridden price for this order only
        price: item.priceOverride.toString(),
        subtotal: (item.quantity * item.priceOverride).toString()
      })),
      pickupDate: pickupDate ? new Date(pickupDate).toISOString() : undefined,
      specialInstructions: specialInstructions,
      shippingAddress: customerAddress ? {
        street: customerAddress,
        city: "Bangalore", // Default or extract
        zip: "560000", // Default
        country: "India"
      } : undefined,
      advancePaid: advancePayment ? advancePayment : "0",
      paymentMethod: paymentMethod,
      discountType: discountType === 'none' ? undefined : discountType,
      discountValue: discountValue > 0 ? discountValue.toFixed(2) : undefined,
      couponCode: couponCode || undefined,
      extraCharges: extraCharges > 0 ? extraCharges.toFixed(2) : undefined,
      gstEnabled: enableGST,
      gstRate: enableGST ? "18.00" : "0.00",
      gstAmount: enableGST ? (
        (subtotal - (discountType === 'percentage' ? (subtotal * discountValue) / 100 : discountType === 'fixed' ? discountValue : 0) + extraCharges) * 0.18
      ).toFixed(2) : "0.00",
      gstNumber: enableGST ? gstNumber : undefined,
      panNumber: enableGST ? panNumber : undefined,
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
                <p className="text-sm text-muted-foreground mt-1">
                  Type to search by name, phone, or email - results appear as you type
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <CustomerAutocomplete
                  customers={customers}
                  onSelect={handleSelectCustomer}
                  onCreateNew={(query) => {
                    // Pre-fill based on query type (phone or name)
                    const isPhone = /^\d+$/.test(query.replace(/[\s\-\(\)]/g, ''));
                    if (isPhone) {
                      setNewCustomerPhone(query);
                      setNewCustomerName('');
                    } else {
                      setNewCustomerName(query);
                      setNewCustomerPhone('');
                    }
                    setShowCustomerDialog(true);
                  }}
                  placeholder="Search by name, phone, or email..."
                />

                <AnimatePresence>
                  {foundCustomer && (
                    <motion.div
                      key="customer-found"
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
                              Customer Selected!
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
                  {servicesLoading ? (
                    <div className="flex items-center justify-center p-3 border rounded-md bg-muted/50">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      <span className="text-sm text-muted-foreground">Loading services...</span>
                    </div>
                  ) : servicesError ? (
                    <div className="flex items-center justify-center p-3 border rounded-md bg-destructive/10 text-destructive">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      <span className="text-sm">Failed to load services. Please refresh the page.</span>
                    </div>
                  ) : (
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
                  )}
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
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.priceOverride}
                                  onChange={(e) => {
                                    const newPrice = parseFloat(e.target.value) || 0;
                                    const updated = selectedServices.map(s =>
                                      s.service.id === item.service.id ? { ...s, priceOverride: newPrice, subtotal: s.quantity * newPrice } : s
                                    );
                                    setSelectedServices(updated);
                                  }}
                                  className="w-24"
                                />
                              </TableCell>
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
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Scheduling & Instructions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !pickupDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {pickupDate ? format(pickupDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={pickupDate}
                        onSelect={setPickupDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
                <div className="flex items-center justify-between space-x-2 border p-3 rounded-md bg-muted/20">
                  <div className="space-y-0.5">
                    <Label htmlFor="gst-mode" className="text-base">Enable GST (18%)</Label>
                    <p className="text-xs text-muted-foreground">
                      Apply 18% Goods & Services Tax to the order total
                    </p>
                  </div>
                  <Switch
                    id="gst-mode"
                    checked={enableGST}
                    onCheckedChange={setEnableGST}
                  />
                </div>

                <AnimatePresence>
                  {enableGST && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 pt-2"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="gstNumber">GST Number</Label>
                          <Input
                            id="gstNumber"
                            placeholder="Enter GSTIN"
                            value={gstNumber}
                            onChange={(e) => setGstNumber(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="panNumber">PAN Number</Label>
                          <Input
                            id="panNumber"
                            placeholder="Enter PAN"
                            value={panNumber}
                            onChange={(e) => setPanNumber(e.target.value)}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

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
                        key="discount-summary"
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
                        key="extra-charges-summary"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex justify-between text-sm text-blue-600"
                      >
                        <span>{extraChargesLabel || 'Extra Charges'}</span>
                        <span>+₹{extraCharges.toFixed(2)}</span>
                      </motion.div>
                    )}

                    {enableGST && (
                      <motion.div
                        key="gst-summary"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex justify-between text-sm text-amber-600"
                      >
                        <span>GST (18%)</span>
                        <span>+₹{((subtotal - (discountType === 'percentage' ? (subtotal * discountValue) / 100 : discountType === 'fixed' ? discountValue : 0) + extraCharges) * 0.18).toFixed(2)}</span>
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
                        key="advance-payment-summary"
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
            <DialogDescription>
              Enter details to create a new customer record.
            </DialogDescription>
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
      <OrderConfirmationDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        order={createdOrder}
        enableGST={enableGST}
        onClose={() => {
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}
