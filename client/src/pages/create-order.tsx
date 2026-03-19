import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Switch } from "@/components/ui/switch";
import { PlusCircle, User, Calendar as CalendarIcon, Truck, IndianRupee, Search, CheckCircle, X, Loader2, AlertCircle, History, Package, TrendingUp, Clock, ShoppingBag, Zap, CreditCard, Phone, Mail, TrendingDown, ShoppingCart, List, Store, MapPin } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Service, Order, Customer } from "@shared/schema";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/use-notifications";
import { ordersApi, customersApi, servicesApi } from '@/lib/data-service';
import { useInvoicePrint } from '@/hooks/use-invoice-print';
import { motion, AnimatePresence } from "framer-motion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CustomerAutocomplete } from "@/components/customer-autocomplete";
import { ServiceCombobox } from "@/components/orders/service-combobox";
import { OrderConfirmationDialog } from "@/components/orders/order-confirmation-dialog";
import OrderDetailsDialog from "@/components/orders/order-details-dialog";
import { useAuth } from "@/contexts/auth-context";
import { generateOrderNumberSync } from "@/lib/franchise-config";
import { createAddressObject, parseAndFormatAddress } from "@/lib/address-utils";
import { formatCurrencyWithSettings, roundInvoiceAmount } from "@/lib/settings-utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface ServiceItem {
  service: Service;
  quantity: number;
  // Allows per‑order price override without mutating the original service price
  priceOverride: number;
  subtotal: number;
  // Editable service name for this order
  customName: string;
  // Note to print on the tag for this service
  tagNote: string;
  // Unique barcode for tracking lifecycle
  garmentBarcode?: string;
}

const safeParseFloat = (val: any) => {
  const parsed = parseFloat(val);
  return isNaN(parsed) ? 0 : parsed;
};

export default function CreateOrder() {
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();
  const { printInvoice } = useInvoicePrint();
  const { employee: currentUser } = useAuth();
  const isMobile = useIsMobile();

  // Customer state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const serviceComboboxRef = React.useRef<HTMLButtonElement>(null);
  const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

  // Services state (must be before useEffect that references it)
  const [selectedServices, setSelectedServices] = useState<ServiceItem[]>([]);

  // Order details (must be before useEffect that references it)
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Abandoned Cart Recovery
  const ABANDONED_CART_KEY = "fabzclean_cart_draft_v1";

  // Load draft on mount
  useEffect(() => {
    const saved = localStorage.getItem(ABANDONED_CART_KEY);
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        if (draft.phoneNumber) setPhoneNumber(draft.phoneNumber);
        if (draft.customerName) setCustomerName(draft.customerName);
        if (draft.customerPhone) setCustomerPhone(draft.customerPhone);
        if (draft.foundCustomer) setFoundCustomer(draft.foundCustomer);
        if (draft.selectedServices) setSelectedServices(draft.selectedServices);
        if (draft.specialInstructions) setSpecialInstructions(draft.specialInstructions);

        toast({ title: "Draft Restored", description: "Taking you back to where you left off." });
      } catch (e) {
        console.error("Failed to restore draft", e);
      }
    }
  }, []);

  // Save draft on change
  useEffect(() => {
    const draft = {
      phoneNumber, customerName, customerPhone, selectedServices, specialInstructions, foundCustomer
    };
    localStorage.setItem(ABANDONED_CART_KEY, JSON.stringify(draft));
  }, [phoneNumber, customerName, customerPhone, selectedServices, specialInstructions, foundCustomer]);

  // Customer creation popup
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  // Separate address fields for clean data collection
  const [newCustomerStreet, setNewCustomerStreet] = useState('');
  const [newCustomerCity, setNewCustomerCity] = useState('');
  const [newCustomerPincode, setNewCustomerPincode] = useState('');
  const [newCustomerNotes, setNewCustomerNotes] = useState('');

  // Payment state
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | 'none'>('none');
  const [discountValue, setDiscountValue] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [extraCharges, setExtraCharges] = useState(0);
  const [extraChargesLabel, setExtraChargesLabel] = useState('');

  // Order details
  const [pickupDate, setPickupDate] = useState<Date>();
  const [advancePayment, setAdvancePayment] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [enableGST, setEnableGST] = useState(false);
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');

  // Fulfillment state
  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCharges, setDeliveryCharges] = useState(0);

  // Wallet state
  const [useWallet, setUseWallet] = useState(false);

  // Credit Balance Alert
  useEffect(() => {
    if (foundCustomer?.creditBalance && Number(foundCustomer.creditBalance) > 0) {
      toast({
        title: "Credit Balance Due",
        description: `This customer has a pending credit balance of ₹${Number(foundCustomer.creditBalance).toLocaleString('en-IN')}`,
        variant: "destructive",
        duration: 5000,
      });
    }
  }, [foundCustomer, toast]);

  // Sync payment status with payment method
  useEffect(() => {
    if (paymentMethod === 'credit') {
      if (paymentStatus !== 'credit') {
        setPaymentStatus('credit');
      }
    } else if (paymentStatus === 'credit') {
      // Revert from credit if user switches to something else (cash/upi/etc)
      setPaymentStatus('pending');
    }
  }, [paymentMethod]); // ONLY depend on paymentMethod to avoid loops

  // Express Order - Priority with 50% extra charge and 2-day turnaround
  const [isExpressOrder, setIsExpressOrder] = useState(false);

  // Success modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  // History order details
  const [selectedHistoryOrder, setSelectedHistoryOrder] = useState<Order | null>(null);
  const [isHistoryDetailsOpen, setIsHistoryDetailsOpen] = useState(false);

  // Credit Limit Error Dialog
  const [creditOverridePrompt, setCreditOverridePrompt] = useState<{
    message: string;
    customerId: string;
    customerName: string;
    walletBalance: number;
    outstandingBefore: number;
    creditLimit: number;
    projectedCreditRequired: number;
    pendingOrderData: any;
  } | null>(null);

  // Calculation state - using useMemo for derived values
  const baseSubtotal = useMemo(() => {
    return selectedServices.reduce((sum, item) => sum + item.subtotal, 0);
  }, [selectedServices]);

  const expressSurcharge = useMemo(() => {
    return isExpressOrder ? baseSubtotal * 0.5 : 0;
  }, [baseSubtotal, isExpressOrder]);

  const subtotal = useMemo(() => {
    return (baseSubtotal + expressSurcharge);
  }, [baseSubtotal, expressSurcharge]);

  const discountAmount = useMemo(() => {
    if (discountType === 'percentage') {
      return (subtotal * discountValue) / 100;
    } else if (discountType === 'fixed') {
      return discountValue;
    }
    return 0;
  }, [subtotal, discountType, discountValue]);

  const gstAmount = useMemo(() => {
    if (!enableGST) return 0;
    const afterDiscount = subtotal - discountAmount;
    return (afterDiscount + extraCharges + deliveryCharges) * 0.18;
  }, [enableGST, subtotal, discountAmount, extraCharges, deliveryCharges]);

  const totalAmount = useMemo(() => {
    let calculatedTotal = subtotal - discountAmount + extraCharges + deliveryCharges;
    if (enableGST) {
      calculatedTotal += gstAmount;
    }
    return roundInvoiceAmount(Math.max(0, calculatedTotal));
  }, [subtotal, discountAmount, extraCharges, deliveryCharges, enableGST, gstAmount]);

  // Wallet and Payable logic
  const walletLimit = useMemo(() => {
    return parseFloat(foundCustomer?.walletBalanceCache || '0');
  }, [foundCustomer?.walletBalanceCache]);

  const walletApplied = useMemo(() => {
    if (!useWallet) return 0;
    return Math.min(totalAmount, walletLimit);
  }, [useWallet, totalAmount, walletLimit]);

  const finalPayable = useMemo(() => {
    return Math.max(0, totalAmount - walletApplied);
  }, [totalAmount, walletApplied]);

  // Fetch services - only active ones
  const { data: servicesData, isLoading: servicesLoading, isError: servicesError } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: async () => {
      const allServices = await servicesApi.getAll();
      if (!allServices || !Array.isArray(allServices)) return [];

      // Map and filter services to ensure they have the expected structure
      return allServices
        .map(s => {
          // Normalization: Ensure price field exists (fallback to price_per_unit)
          const priceStr = s.price || (s as any).price_per_unit || "0";
          return {
            ...s,
            price: priceStr,
            status: s.status || "Active" // Fallback to Active
          };
        })
        .filter(service =>
          // Case-insensitive active check, or assume active if status is missing
          !service.status || service.status.toLowerCase() === 'active'
        );
    },
  });

  // Ensure services is always an array
  const services = Array.isArray(servicesData) ? servicesData : [];

  const searchCustomers = React.useCallback(async (query: string) => {
    const trimmed = query.trim();
    // Allow empty queries to fetch recent customers
    return customersApi.autocomplete(trimmed, 10);
  }, []);

  // Fetch customer's order history when a customer is selected
  const { data: customerOrdersData, isLoading: customerOrdersLoading } = useQuery<Order[]>({
    queryKey: ["customer-orders", foundCustomer?.id],
    queryFn: async () => {
      if (!foundCustomer?.id) return [];

      try {
        // PERF: Priority endpoint: Fetch specifically by customerId for accuracy
        // Fallback to phone search if needed, but and prioritize the ID endpoint
        const responseData = await ordersApi.getByCustomerId(foundCustomer.id);
        const orders = Array.isArray(responseData) ? responseData : [];
        
        // Final sanity sort for display
        return orders
          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
          .slice(0, 10);
      } catch (error) {
        console.warn('⚠️ Fetching by ID failed, falling back to search', error);
        // Fallback search by phone
        let orders: Order[] = [];
        if (foundCustomer.phone) orders = await ordersApi.search(foundCustomer.phone);
        return orders
          .filter(order => order.customerId === foundCustomer.id)
          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
          .slice(0, 10);
      }
    },
    enabled: !!foundCustomer?.id,
  });

  const customerOrders = Array.isArray(customerOrdersData) ? customerOrdersData : [];

  // Calculate customer stats
  const customerStats = React.useMemo(() => {
    if (!customerOrders.length) return null;

    const totalSpent = customerOrders.reduce((sum, order) =>
      sum + parseFloat(order.totalAmount || '0'), 0);
    const completedOrders = customerOrders.filter(o =>
      o.status === 'completed' || o.status === 'delivered').length;
    const avgOrderValue = totalSpent / customerOrders.length;

    // Find most used services
    const serviceCounts: Record<string, number> = {};
    customerOrders.forEach(order => {
      const items = (order.items as any[]) || [];
      items.forEach(item => {
        const name = item.serviceName || item.productName || 'Unknown';
        serviceCounts[name] = (serviceCounts[name] || 0) + item.quantity;
      });
    });

    const topServices = Object.entries(serviceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);

    return {
      totalOrders: customerOrders.length,
      totalSpent,
      completedOrders,
      avgOrderValue,
      topServices,
      lastOrderDate: customerOrders[0]?.createdAt,
    };
  }, [customerOrders]);

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

        // Use centralized address utility for proper formatting
        const formattedAddress = parseAndFormatAddress(customer.address);
        setCustomerAddress(formattedAddress === 'Address not provided' ? '' : formattedAddress);

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

    // Use centralized address utility for proper formatting
    const formattedAddress = parseAndFormatAddress(customer.address);
    setCustomerAddress(formattedAddress === 'Address not provided' ? '' : formattedAddress);

    toast({
      title: "Customer Selected!",
      description: `Details loaded for ${customer.name}`,
    });

    // Auto-focus the services section to streamline the workflow
    setTimeout(() => {
      serviceComboboxRef.current?.focus();
    }, 100);
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

        // Use centralized address utility for proper formatting
        const formattedAddress = parseAndFormatAddress(newCustomer.address);
        setCustomerAddress(formattedAddress === 'Address not provided' ? '' : formattedAddress);

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
        setNewCustomerStreet('');
        setNewCustomerCity('');
        setNewCustomerPincode('');
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

    // Validate pincode if provided (6 digits)
    if (newCustomerPincode && !/^\d{6}$/.test(newCustomerPincode)) {
      toast({
        title: "Validation Error",
        description: "Pincode must be 6 digits",
        variant: "destructive",
      });
      return;
    }

    // Create proper address object
    const addressObj = newCustomerStreet ? createAddressObject({
      street: newCustomerStreet,
      city: newCustomerCity,
      pincode: newCustomerPincode,
    }) : undefined;

    createCustomerMutation.mutate({
      name: newCustomerName,
      phone: newCustomerPhone,
      email: newCustomerEmail || undefined,
      address: addressObj,
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
        customName: serviceToAdd.name,
        tagNote: '',
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

  // Auto-set due date: 2 days for express, 7 days for regular
  useEffect(() => {
    const today = new Date();
    const daysToAdd = isExpressOrder ? 2 : 7;
    const dueDate = new Date(today.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    setPickupDate(dueDate);
  }, [isExpressOrder]);

  // Mutation for updating order status from history
  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ orderId, newStatus }: { orderId: string; newStatus: string }) =>
      ordersApi.update(orderId, { status: newStatus as any }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-orders", foundCustomer?.id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast({
        title: "Order Updated",
        description: "Status successfully changed.",
      });
    },
    onError: (error) => {
      console.error("Order status update failed:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update order status.",
        variant: "destructive",
      });
    }
  });

  // Mutation for updating generic order fields
  const updateOrderMutation = useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Partial<Order>) =>
      ordersApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-orders", foundCustomer?.id] });
      toast({
        title: "Order Updated",
        description: "Order information updated.",
      });
    }
  });

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

        // 6. Ensure Special Instructions (Order Notes) - critical for tags
        if (!newOrder.specialInstructions) {
          newOrder.specialInstructions = newOrder.special_instructions || specialInstructions;
        }

        // 7. Ensure Express Order flag
        if (newOrder.isExpressOrder === undefined) {
          newOrder.isExpressOrder = newOrder.is_express_order || isExpressOrder;
        }

        // 8. Ensure items have tagNote for garment tags
        if (newOrder.items && Array.isArray(newOrder.items)) {
          newOrder.items = newOrder.items.map((item: any, index: number) => {
            const formItem = selectedServices[index];
            return {
              ...item,
              serviceName: item.serviceName || item.service_name || item.productName || formItem?.service?.name || 'Unknown',
              customName: item.customName || item.custom_name || formItem?.customName,
              tagNote: item.tagNote || item.tag_note || formItem?.tagNote || '',
              garmentBarcode: item.garmentBarcode || item.garment_barcode || formItem?.garmentBarcode,
            };
          });
        }

        // 9. Enrich with customer outstanding balance & checkout split for invoice display
        {
          const walletUsed = safeParseFloat(newOrder.walletUsed ?? newOrder.wallet_used ?? newOrder.split?.walletDebited ?? 0);
          const creditUsed = safeParseFloat(newOrder.creditUsed ?? newOrder.credit_used ?? newOrder.split?.creditAssigned ?? 0);
          const previousOutstanding = safeParseFloat(foundCustomer?.creditBalance ?? 0);

          // Ensure wallet/credit fields are on the order for invoice generation
          if (!newOrder.walletUsed && walletUsed > 0) newOrder.walletUsed = String(walletUsed);
          if (!newOrder.creditUsed && creditUsed > 0) newOrder.creditUsed = String(creditUsed);

          // Attach customer outstanding balance info for the invoice payment breakdown
          newOrder.customerOutstandingBefore = previousOutstanding;
          newOrder.customerOutstandingAfter = previousOutstanding + creditUsed;
        }

        console.log('✅ Normalized Order for Dialog:', newOrder);

        setCreatedOrder(newOrder);
        setIsModalOpen(true);
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        queryClient.invalidateQueries({ queryKey: ["print-queue"] });
        queryClient.invalidateQueries({ queryKey: ["customers"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard/metrics"] });

        // Add notification - highlight express orders
        const isExpress = (newOrder as any).isExpressOrder;
        addNotification({
          type: isExpress ? 'warning' : 'success',
          title: isExpress ? '⚡ EXPRESS Order Created!' : 'Order Created Successfully!',
          message: isExpress
            ? `PRIORITY: Order ${newOrder.orderNumber} for ${newOrder.customerName} - 2 day turnaround`
            : `Order ${newOrder.orderNumber} has been created for ${newOrder.customerName}`,
          actionUrl: '/orders',
          actionText: 'View Orders'
        });

        // If express order, add additional priority notification
        if (isExpress) {
          addNotification({
            type: 'warning',
            title: '🔥 Fast Track Required',
            message: `Express order ${newOrder.orderNumber} needs priority transit processing`,
            actionUrl: '/transit-orders',
            actionText: 'Go to Transit'
          });
        }

        toast({
          title: isExpress ? "⚡ Express Order Created!" : "Order Created Successfully!",
          description: isExpress
            ? `Priority order ${newOrder.orderNumber} - 50% surcharge applied, 2-day turnaround`
            : `Order ${newOrder.orderNumber} has been created and saved.`,
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
    onError: (error: any, variables: Partial<Order>) => {
      console.error('Failed to create order:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create order. Please try again.";

      if (error?.requiresCreditOverride && error?.creditOverride) {
        setCreditOverridePrompt({
          message: error.creditOverride.message || errorMessage,
          customerId: error.creditOverride.customerId || foundCustomer?.id || '',
          customerName: customerName,
          walletBalance: Number(foundCustomer?.walletBalanceCache || 0),
          outstandingBefore: Number(error.creditOverride.outstandingBefore || 0),
          creditLimit: Number(error.creditOverride.creditLimit || 1000),
          projectedCreditRequired: Number(error.creditOverride.projectedCreditRequired || 0),
          pendingOrderData: variables,
        });
        return;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Reset form
  const resetForm = () => {
    localStorage.removeItem(ABANDONED_CART_KEY);
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
    // Reset express order and fulfillment
    setIsExpressOrder(false);
    setFulfillmentType('pickup');
    setDeliveryAddress('');
    setDeliveryCharges(0);
    setUseWallet(false);
    setCreditOverridePrompt(null);
  };

  // Validate phone number - flexible to accept various international formats
  const validatePhoneNumber = (phone: string): boolean => {
    if (!phone || phone.trim().length === 0) return false;

    // Remove all non-digit characters (spaces, dashes, parentheses, plus, dots)
    const digitsOnly = phone.replace(/[^\d]/g, '');

    // Accept 7-15 digits to support:
    // - Local numbers without country code (10 digits in India, 7-10 in other countries)
    // - International numbers with country code (1-4 digit code + 7-12 digit number)
    // Examples: +1-555-0128 (8 digits), 9876543210 (10 digits), +91 9876543210 (12 digits)
    return digitsOnly.length >= 7 && digitsOnly.length <= 15;
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
        description: "Please enter a valid phone number (7-15 digits, any format)",
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
    } else if (foundCustomer) {
      // PERF: Fire-and-forget profile update — don't block order creation
      const existingFormattedAddress = parseAndFormatAddress(foundCustomer.address);
      const orderLevelAddress = deliveryAddress || customerAddress;
      
      const hasNameChanged = foundCustomer.name !== customerName;
      const hasPhoneChanged = foundCustomer.phone !== customerPhone;
      const hasEmailChanged = foundCustomer.email !== (customerEmail || null);
      const hasAddressChanged = orderLevelAddress && orderLevelAddress !== existingFormattedAddress && orderLevelAddress !== 'Address not provided';

      if (hasNameChanged || hasPhoneChanged || hasEmailChanged || hasAddressChanged) {
        const updates: any = {};
        if (hasNameChanged) updates.name = customerName;
        if (hasPhoneChanged) updates.phone = customerPhone;
        if (hasEmailChanged) updates.email = customerEmail || null;
        if (hasAddressChanged) updates.address = { line1: orderLevelAddress };

        customersApi.update(currentCustomerId, updates).then(() => {
          console.log("Customer profile synchronized automatically");
          queryClient.invalidateQueries({ queryKey: ["customers"] });
        }).catch((e) => {
          console.warn("Soft fail: could not auto-sync customer profile", e);
        });
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

    // Don't set orderNumber here - let server generate it with proper sequential format
    const orderData: any = {
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
        subtotal: (item.quantity * item.priceOverride).toString(),
        customName: item.customName,
        tagNote: item.tagNote,
        garmentBarcode: item.garmentBarcode
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
        (subtotal - (discountType === 'percentage' ? (subtotal * discountValue) / 100 : discountType === 'fixed' ? discountValue : 0) + extraCharges + deliveryCharges) * 0.18
      ).toFixed(2) : "0.00",
      gstNumber: enableGST ? gstNumber : undefined,
      panNumber: enableGST ? panNumber : undefined,
      fulfillmentType: fulfillmentType,
      deliveryCharges: deliveryCharges.toString(),
      deliveryAddress: fulfillmentType === 'delivery' ? deliveryAddress : undefined,
      // Express/Priority Order
      isExpressOrder: isExpressOrder,
      priority: isExpressOrder ? 'high' : 'normal',
      // Wallet usage
      useWallet: useWallet,
    };

    createOrderMutation.mutate(orderData);
  };

  // Handle loading state
  if (servicesLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 animate-fade-in">
        <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
        <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Create New Order</h1>
        <Button
          onClick={handleCreateOrder}
          disabled={createOrderMutation.isPending}
          size="lg"
          className="w-full sm:w-auto"
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
                {!foundCustomer ? (
                  <CustomerAutocomplete
                    searchCustomers={searchCustomers}
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
                    placeholder="Search by name, ID, phone, or email..."
                  />
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-between p-4 rounded-xl border-2 border-primary/20 bg-primary/5 shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg leading-none">{foundCustomer.name}</h3>
                          {foundCustomer.id && (
                            <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0 h-4 bg-slate-100 text-slate-600 border-slate-200">
                              {foundCustomer.id}
                            </Badge>
                          )}
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 text-[10px] h-5 uppercase tracking-wider font-bold">
                            Active Customer
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-sm">
                          <Phone className="h-3.5 w-3.5" /> {foundCustomer.phone}
                          {foundCustomer.email && (
                            <>
                              <span className="mx-1 opacity-30">•</span>
                              <Mail className="h-3.5 w-3.5" /> {foundCustomer.email}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setFoundCustomer(null);
                        setCustomerName('');
                        setCustomerPhone('');
                        setCustomerEmail('');
                        setCustomerAddress('');
                      }}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Change
                    </Button>
                  </motion.div>
                )}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Name *</Label>
                    <Input
                      id="customerName"
                      placeholder="Customer's full name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                      className="bg-background"
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
                      className="bg-background"
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
                  <ServiceCombobox 
                    ref={serviceComboboxRef}
                    services={services} 
                    onSelect={handleAddService} 
                    disabled={servicesLoading} 
                  />
                  )}
                </div>

                {selectedServices.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No services added yet. Select a service from the dropdown above.</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[180px]">Service</TableHead>
                            <TableHead className="w-24">Quantity</TableHead>
                            <TableHead className="w-28">Price</TableHead>
                            <TableHead className="w-28">Subtotal</TableHead>
                            <TableHead className="w-16"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <AnimatePresence>
                            {selectedServices.map((item) => (
                              <React.Fragment key={item.service.id}>
                                <motion.tr
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 20 }}
                                  transition={{ duration: 0.2 }}
                                  className="border-b-0"
                                >
                                  <TableCell className="font-medium">
                                    <Input
                                      value={item.customName}
                                      onChange={(e) => {
                                        const updated = selectedServices.map(s =>
                                          s.service.id === item.service.id ? { ...s, customName: e.target.value } : s
                                        );
                                        setSelectedServices(updated);
                                      }}
                                      className="w-full font-medium"
                                      placeholder="Service name"
                                    />
                                  </TableCell>
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
                                {/* Tag Note & Barcode Row */}
                                <motion.tr
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="border-b bg-muted/30"
                                >
                                  <TableCell colSpan={5} className="py-2 px-4">
                                    <div className="flex flex-col md:flex-row gap-4">
                                      <div className="flex items-center gap-2 flex-1">
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">Tag Note:</span>
                                        <Input
                                          value={item.tagNote}
                                          onChange={(e) => {
                                            const updated = selectedServices.map(s =>
                                              s.service.id === item.service.id ? { ...s, tagNote: e.target.value } : s
                                            );
                                            setSelectedServices(updated);
                                          }}
                                          className="h-8 text-sm flex-1"
                                          placeholder="e.g., Delicate fabric, No bleach"
                                        />
                                      </div>
                                      <div className="flex items-center gap-2 flex-1">
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">Barcode:</span>
                                        <Input
                                          value={item.garmentBarcode || ''}
                                          onChange={(e) => {
                                            const updated = selectedServices.map(s =>
                                              s.service.id === item.service.id ? { ...s, garmentBarcode: e.target.value } : s
                                            );
                                            setSelectedServices(updated);

                                            // Mock Check for History (Garment Lifecycle)
                                            if (e.target.value.length > 5) {
                                              // In real app, query API. Here we mock warning.
                                              if (e.target.value.endsWith('50')) { // Test condition
                                                toast({
                                                  title: "Garment Lifecycle Warning",
                                                  description: "This garment has been washed 50 times! Inspect for wear and tear.",
                                                  variant: "destructive"
                                                });
                                              }
                                            }
                                          }}
                                          className="h-8 text-sm flex-1"
                                          placeholder="Scan permanent tag..."
                                        />
                                      </div>
                                    </div>
                                  </TableCell>
                                </motion.tr>
                              </React.Fragment>
                            ))}
                          </AnimatePresence>
                        </TableBody>
                      </Table>
                    </div>
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
                        disabled={(date) => {
                          // Disable past dates and today - only allow future dates
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date <= today;
                        }}
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

          {/* Fulfillment Type */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.35 }}
          >
            <Card className="overflow-hidden border-2 transition-all duration-300">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b pb-4">
                <CardTitle className="flex items-center text-lg font-bold">
                  <Truck className="h-5 w-5 mr-2 text-primary" />
                  Fulfillment Type
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <Tabs 
                  defaultValue="pickup" 
                  value={fulfillmentType} 
                  onValueChange={(v) => {
                    const type = v as 'pickup' | 'delivery';
                    setFulfillmentType(type);
                    if (type === 'delivery' && deliveryCharges === 0) {
                      setDeliveryCharges(50);
                    } else if (type === 'pickup') {
                      setDeliveryCharges(0);
                    }
                  }}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-2 w-full h-12 p-1 bg-slate-100 dark:bg-slate-800">
                    <TabsTrigger value="pickup" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm font-bold gap-2">
                      <Store className="h-4 w-4" /> Store Pickup
                    </TabsTrigger>
                    <TabsTrigger value="delivery" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm font-bold gap-2">
                      <MapPin className="h-4 w-4" /> Home Delivery
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="pickup" className="pt-4 animate-in fade-in slide-in-from-top-1 duration-300">
                    <div className="rounded-xl border bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/50 p-4 flex items-start gap-4">
                      <div className="bg-emerald-100 dark:bg-emerald-900/50 p-3 rounded-lg shadow-sm">
                        <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-bold text-emerald-900 dark:text-emerald-300 text-sm">Customer will pick up from store</p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 leading-relaxed">No delivery charges apply for store pickup.</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="delivery" className="pt-4 space-y-4 animate-in fade-in slide-in-from-top-1 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">Delivery Address</Label>
                          {foundCustomer && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 text-[10px] gap-1 text-primary hover:text-primary hover:bg-primary/5 px-2"
                              onClick={() => setDeliveryAddress(parseAndFormatAddress(foundCustomer.address))}
                            >
                              <User className="h-3 w-3" /> Use Profile Address
                            </Button>
                          )}
                        </div>
                        <div className="relative group">
                          <Textarea 
                            placeholder="Enter detailed delivery address..." 
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            className="min-h-[100px] bg-white border-slate-200 focus:ring-primary/20 transition-all text-sm leading-relaxed shadow-sm lg:pr-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Delivery Charges (₹)</Label>
                        <div className="relative group">
                          <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                          <Input 
                            type="number" 
                            min="0"
                            placeholder="0.00"
                            value={deliveryCharges || ''}
                            onChange={(e) => setDeliveryCharges(safeParseFloat(e.target.value))}
                            className="pl-9 h-12 bg-slate-50 border-slate-200 focus:ring-primary/20 transition-all font-bold text-lg"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {[0, 20, 30, 50].map(amt => (
                            <Button 
                              key={amt}
                              type="button"
                              variant="outline" 
                              size="sm" 
                              className={cn(
                                "h-7 px-3 text-[10px] font-bold transition-all",
                                deliveryCharges === amt ? "bg-primary text-white border-primary" : "hover:border-primary hover:text-primary"
                              )}
                              onClick={() => setDeliveryCharges(amt)}
                            >
                              ₹{amt}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
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
                  <IndianRupee className="h-5 w-5 mr-2" />
                  Pricing Adjustments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Express Order Toggle - Priority with 50% surcharge */}
                <div className={cn(
                  "flex items-center justify-between space-x-2 p-4 rounded-lg border-2 transition-all",
                  isExpressOrder
                    ? "border-orange-500 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30"
                    : "border-dashed border-gray-300 bg-muted/10"
                )}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="express-mode" className="text-base font-semibold">
                        ⚡ Express Order
                      </Label>
                      {isExpressOrder && (
                        <Badge className="bg-orange-500 text-white animate-pulse">
                          PRIORITY
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isExpressOrder
                        ? "🔥 50% surcharge applied • 2-day turnaround • Fast tracked transit"
                        : "Enable for priority processing (+50% charge, 2-day turnaround)"
                      }
                    </p>
                  </div>
                  <Switch
                    id="express-mode"
                    checked={isExpressOrder}
                    onCheckedChange={setIsExpressOrder}
                    className={isExpressOrder ? "data-[state=checked]:bg-orange-500" : ""}
                  />
                </div>

                {/* GST Toggle */}
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
                      className="pt-2"
                    >
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-800 font-medium">
                          ✓ GST Invoice will be generated
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          GSTIN: 33AITPD3522F1ZK • 18% GST (9% CGST + 9% SGST)
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="discountType">Discount Type</Label>
                    <Select value={discountType} onValueChange={(value: 'percentage' | 'fixed' | 'none') => setDiscountType(value)}>
                      <SelectTrigger className="bg-background">
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
                      className="bg-background"
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
          
          {/* Wallet Balance Usage */}
          <AnimatePresence>
            {foundCustomer && (Number(foundCustomer.walletBalanceCache || 0) > 0 || useWallet) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, delay: 0.45 }}
              >
                <Card className={cn(
                  "overflow-hidden border-2 transition-all duration-300",
                  useWallet 
                    ? "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20" 
                    : "border-slate-200 dark:border-slate-800"
                )}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg transition-colors",
                        useWallet ? "bg-emerald-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      )}>
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Use Wallet Balance</p>
                        <p className="text-xs text-muted-foreground">
                          Available: <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{parseFloat(String(foundCustomer.walletBalanceCache || 0)).toFixed(2)}</span>
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={useWallet}
                      onCheckedChange={setUseWallet}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Advance Payment */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <IndianRupee className="h-5 w-5 mr-2" />
                  Advance Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="advancePayment">Advance Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                      <Input
                        id="advancePayment"
                        type="number"
                        placeholder="0.00"
                        value={advancePayment}
                        onChange={(e) => setAdvancePayment(e.target.value)}
                        max={totalAmount > 0 ? totalAmount : undefined}
                        className="pl-7 bg-background"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="credit">Credit</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column: Order Summary & Activity Tracker */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="sticky top-24 z-10"
          >
            <Card className="border-none shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800 rounded-2xl md:rounded-xl">
              <div className="h-1.5 w-full bg-primary" />
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                    Bill Summary
                  </span>
                  {selectedServices.length > 0 && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                      {selectedServices.length} {selectedServices.length === 1 ? 'Item' : 'Items'}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {selectedServices.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed rounded-lg bg-slate-50/50 dark:bg-slate-900/50">
                      <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-sm text-slate-400">Add services to see summary</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 scrollbar-thin">
                      {selectedServices.map(item => (
                        <div key={item.service.id} className="flex justify-between items-start text-sm group">
                          <div className="flex-1">
                            <p className="font-medium group-hover:text-primary transition-colors">{item.service.name}</p>
                            <p className="text-[11px] text-muted-foreground whitespace-nowrap">₹{safeParseFloat(item.priceOverride).toFixed(2)} × {item.quantity}</p>
                          </div>
                          <span className="font-bold text-slate-700 dark:text-slate-300">₹{item.subtotal.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between text-sm text-slate-900 dark:text-slate-100 font-medium">
                      <span className="opacity-70 dark:opacity-80">Services Subtotal</span>
                      <span className="font-black">₹{baseSubtotal.toFixed(2)}</span>
                    </div>
  
                    <AnimatePresence>
                      {isExpressOrder && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="flex justify-between text-sm text-amber-600 dark:text-amber-400 font-bold"
                        >
                          <span className="flex items-center gap-1">
                            <Zap className="h-3.5 w-3.5" /> Express Charge (50%)
                          </span>
                          <span>+₹{expressSurcharge.toFixed(2)}</span>
                        </motion.div>
                      )}
  
                      {discountAmount > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400 font-bold"
                        >
                          <span className="flex items-center gap-1">
                            <TrendingDown className="h-3.5 w-3.5" /> 
                            Discount {discountType === 'percentage' ? `(${discountValue}%)` : '(Fixed)'}
                          </span>
                          <span>-₹{discountAmount.toFixed(2)}</span>
                        </motion.div>
                      )}
  
                      {extraCharges > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="flex justify-between text-sm text-foreground/80 dark:text-slate-300"
                        >
                          <span className="flex items-center gap-1 italic">
                            <PlusCircle className="h-3.5 w-3.5 text-blue-500" />
                            {extraChargesLabel || 'Extra Charges'}
                          </span>
                          <span>+₹{extraCharges.toFixed(2)}</span>
                        </motion.div>
                      )}
  
                      {enableGST && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="flex justify-between text-sm text-slate-900 dark:text-slate-100 font-medium"
                        >
                          <span className="opacity-70 dark:opacity-80">GST (18%)</span>
                          <span className="font-black">+₹{gstAmount.toFixed(2)}</span>
                        </motion.div>
                      )}
                  </AnimatePresence>

                  <div className="mt-4 p-5 rounded-2xl bg-primary text-white shadow-2xl transition-all duration-300 hover:scale-[1.03] ring-4 ring-primary/10">
                    <div className="flex justify-between items-center">
                      <div>
                         <span className="text-[10px] uppercase tracking-[0.2em] font-black opacity-80">{useWallet && walletApplied > 0 ? 'Balance Due' : 'Payable Amount'}</span>
                         {isExpressOrder && <p className="text-[10px] text-amber-300 font-black uppercase mt-0.5 tracking-wider">Express Order</p>}
                      </div>
                      <span className="text-3xl font-black tabular-nums">₹{finalPayable.toFixed(2)}</span>
                    </div>
                  </div>

                  <AnimatePresence>
                    {useWallet && walletApplied > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-2 flex justify-between text-sm text-emerald-600 dark:text-emerald-400 font-bold px-1"
                      >
                        <span className="flex items-center gap-1">
                          <CreditCard className="h-3.5 w-3.5" /> Wallet Applied
                        </span>
                        <span>-₹{walletApplied.toFixed(2)}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {advancePayment && parseFloat(advancePayment) > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 space-y-2"
                      >
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Advance Paid</p>
                          <span className="text-lg font-bold text-emerald-600">₹{parseFloat(advancePayment).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-emerald-100 dark:border-emerald-800 pt-1">
                          <p className="text-xs font-bold text-red-600">Balance Due</p>
                          <span className="text-sm font-bold text-red-600">₹{(totalAmount - parseFloat(advancePayment)).toFixed(2)}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className={cn(
                  "mt-2",
                  isMobile && "fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-lg border-t z-50 shadow-[0_-8px_30px_rgb(0,0,0,0.12)]"
                )}>
                  <Button
                    onClick={handleCreateOrder}
                    disabled={createOrderMutation.isPending || selectedServices.length === 0 || !customerName || !customerPhone}
                    className="w-full h-12 text-lg font-black shadow-lg shadow-primary/25 hover:scale-[1.01] active:scale-[0.98] transition-all bg-primary hover:bg-primary/90"
                  >
                    {createOrderMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Creating Order...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-5 w-5" />
                        Place Order • ₹{Math.max(0, finalPayable - (parseFloat(advancePayment) || 0)).toFixed(0)}
                      </>
                    )}
                  </Button>
                  
                  {isMobile && (
                    <p className="text-[9px] text-center text-muted-foreground mt-2 italic leading-tight">
                      Automatic WhatsApp bill will be sent.
                    </p>
                  )}
                </div>
                
                {!isMobile && (
                  <p className="text-[10px] text-center text-muted-foreground px-4 italic leading-relaxed">
                    By placing this order, you agree to the service terms. A WhatsApp bill will be sent automatically.
                  </p>
                )}
              </CardContent>
            </Card>



            {/* Customer History Section */}
            <AnimatePresence>
            {foundCustomer && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="mt-4"
              >
                <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div className="p-1.5 rounded-lg bg-primary/10">
                        <History className="h-4 w-4 text-primary" />
                      </div>
                      Customer History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {customerOrdersLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-sm text-muted-foreground">Loading history...</span>
                      </div>
                    ) : customerStats ? (
                      <>
                        {/* Customer Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 p-3 rounded-lg border border-emerald-200/50 dark:border-emerald-800/50">
                            <div className="flex items-center gap-2 mb-1">
                              <ShoppingBag className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-[10px] uppercase tracking-wider font-medium text-emerald-600 dark:text-emerald-400">Total Orders</span>
                            </div>
                            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{customerStats.totalOrders}</p>
                          </div>

                          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 p-3 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                            <div className="flex items-center gap-2 mb-1">
                              <TrendingUp className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                              <span className="text-[10px] uppercase tracking-wider font-medium text-blue-600 dark:text-blue-400">Total Spent</span>
                            </div>
                            <p className="text-xl font-bold text-blue-700 dark:text-blue-300">₹{customerStats.totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                          </div>

                          <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 p-3 rounded-lg border border-green-200/50 dark:border-green-800/50">
                            <div className="flex items-center gap-2 mb-1">
                              <CreditCard className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                              <span className="text-[10px] uppercase tracking-wider font-medium text-green-600 dark:text-green-400">Wallet Balance</span>
                            </div>
                            <p className="text-xl font-bold text-green-700 dark:text-green-300">
                              ₹{parseFloat(String(foundCustomer?.walletBalanceCache || 0)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </p>
                          </div>

                          <div className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 p-3 rounded-lg border border-red-200/50 dark:border-red-800/50">
                            <div className="flex items-center gap-2 mb-1">
                              <AlertCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                              <span className="text-[10px] uppercase tracking-wider font-medium text-red-600 dark:text-red-400">Credit Due</span>
                            </div>
                            {(() => {
                              const due = foundCustomer?.creditBalance ? Number(foundCustomer.creditBalance) : 0;
                              const limit = Math.max(0, Number((foundCustomer as any)?.creditLimit ?? 1000));
                              const dueClass = due > limit ? "text-red-700 dark:text-red-300" : due === 0 ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300";
                              return (
                                <p className={`text-xl font-bold ${dueClass}`}>
                                  ₹{due.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                </p>
                              );
                            })()}
                          </div>

                          <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 p-3 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                              <span className="text-[10px] uppercase tracking-wider font-medium text-amber-600 dark:text-amber-400">Credit Limit</span>
                            </div>
                            <p className="text-xl font-bold text-amber-700 dark:text-amber-300">
                              ₹{Math.max(0, Number((foundCustomer as any)?.creditLimit ?? 1000)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </p>
                          </div>
                        </div>


                        {/* Favorite Services */}
                        {customerStats.topServices.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              Favorite Services
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {customerStats.topServices.map((service, idx) => (
                                <Badge
                                  key={idx}
                                  variant="secondary"
                                  className="text-[10px] bg-primary/10 text-primary hover:bg-primary/20"
                                >
                                  {service}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Last Order Date */}
                        {customerStats.lastOrderDate && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
                            <Clock className="h-3 w-3" />
                            <span>Last order: {format(new Date(customerStats.lastOrderDate), 'dd MMM yyyy')}</span>
                          </div>
                        )}

                        {/* Recent Orders List */}
                        {customerOrders.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">Recent Orders</p>
                            <div className="max-h-[180px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                              {customerOrders.slice(0, 5).map((order, idx) => (
                                <div
                                  key={order.id || idx}
                                  onClick={() => {
                                    setSelectedHistoryOrder(order);
                                    setIsHistoryDetailsOpen(true);
                                  }}
                                  className="flex items-center justify-between p-2.5 bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors border border-transparent hover:border-primary/10 cursor-pointer"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-mono font-medium text-primary truncate">
                                        {order.orderNumber || `#${order.id?.slice(0, 8)}`}
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className={cn(
                                          "text-[9px] px-1.5 py-0",
                                          order.status === 'completed' || order.status === 'delivered'
                                            ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400"
                                            : order.status === 'processing'
                                              ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400"
                                              : order.status === 'cancelled'
                                                ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400"
                                                : "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400"
                                        )}
                                      >
                                        {order.status?.replace(/_/g, ' ')}
                                      </Badge>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                      {order.createdAt ? format(new Date(order.createdAt), 'dd MMM yy') : 'N/A'}
                                    </p>
                                  </div>
                                  <span className="text-sm font-semibold text-foreground">
                                    ₹{parseFloat(order.totalAmount || '0').toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-6">
                        <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                          <Package className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                        <p className="text-sm text-muted-foreground">No previous orders</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">This is a new customer!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
          </motion.div>


        </div>
      </div >


      {/* Bottom Page Area */}
      <div className="mt-8">
                {/* Session Activity Tracker */}
        <Card className="mt-6 border-slate-200 dark:border-slate-800 bg-transparent shadow-none border-dashed text-center">
          <CardHeader className="py-4">
            <CardTitle className="text-sm flex items-center justify-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Session Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground flex flex-col items-center justify-center py-6 opacity-60">
                 <List className="h-5 w-5 mb-2 opacity-30" />
                 <p>Completed orders will appear here</p>
              </div>
            </div>
          </CardContent>
            </Card>
      </div>

      {/* Customer Creation Dialog */}
      < Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog} >
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
            {/* Address Fields - Collected Separately */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-semibold text-sm text-muted-foreground">Address (Optional)</h4>
              <div className="space-y-2">
                <Label htmlFor="newCustomerStreet">Street Address</Label>
                <Input
                  id="newCustomerStreet"
                  placeholder="e.g., 1/85 Zamin Kottampatty"
                  value={newCustomerStreet}
                  onChange={(e) => setNewCustomerStreet(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newCustomerCity">City</Label>
                  <Input
                    id="newCustomerCity"
                    placeholder="e.g., Pollachi"
                    value={newCustomerCity}
                    onChange={(e) => setNewCustomerCity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newCustomerPincode">Pincode</Label>
                  <Input
                    id="newCustomerPincode"
                    placeholder="e.g., 642123"
                    value={newCustomerPincode}
                    onChange={(e) => setNewCustomerPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                State: Tamil Nadu, Country: India (default)
              </p>
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


      {/* Credit Override Dialog */}
      <Dialog open={!!creditOverridePrompt} onOpenChange={(open) => !open && setCreditOverridePrompt(null)}>
        <DialogContent className="max-w-2xl border-none shadow-2xl p-0 overflow-hidden bg-slate-50 dark:bg-slate-950">
          <div className="h-1.5 w-full bg-amber-500" />
          
          <div className="p-6 space-y-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-amber-600 dark:text-amber-500 flex items-center gap-2">
                <AlertCircle className="h-6 w-6" />
                Credit Limit Overview
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {creditOverridePrompt?.customerName} has reached their credit threshold. Review details before proceeding.
              </DialogDescription>
            </DialogHeader>

            {creditOverridePrompt && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Financial Overview */}
                <div className="space-y-4">
                  <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h4 className="text-[10px] uppercase tracking-wider font-black text-slate-400 mb-3">Balance Summary</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Current Dues</span>
                        <span className="font-bold text-red-600">₹{creditOverridePrompt.outstandingBefore.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Credit Limit</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">₹{creditOverridePrompt.creditLimit.toFixed(2)}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-sm">
                        <span className="text-amber-600 font-bold uppercase text-[10px]">Over Limit By</span>
                        <span className="font-black text-amber-600 font-mono">₹{Math.max(0, creditOverridePrompt.outstandingBefore + creditOverridePrompt.projectedCreditRequired - creditOverridePrompt.creditLimit).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900/50">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[10px] uppercase font-black text-emerald-600 dark:text-emerald-400 tracking-wider">Wallet Balance</p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-500 opacity-70 mt-0.5">Available for partial payment</p>
                      </div>
                      <span className="text-xl font-black text-emerald-600">₹{creditOverridePrompt.walletBalance.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Orders Snapshot */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h4 className="text-[10px] uppercase tracking-wider font-black text-slate-400 mb-3">Recent Activity</h4>
                  <div className="space-y-2.5">
                    {customerOrders?.slice(0, 3).map((order: any) => (
                      <div key={order.id} className="flex justify-between items-center text-[11px] border-b border-slate-50 dark:border-slate-800 pb-2 last:border-0 last:pb-0">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-700 dark:text-slate-300 truncate">{order.orderNumber || 'Legacy Order'}</p>
                          <p className="text-muted-foreground opacity-70">{format(new Date(order.createdAt), 'dd MMM')}</p>
                        </div>
                        <div className="text-right ml-2">
                          <p className="font-black text-slate-600 dark:text-slate-400">₹{parseFloat(order.totalAmount).toFixed(0)}</p>
                          <Badge variant="outline" className="text-[8px] h-3 px-1 bg-muted/50">{order.status}</Badge>
                        </div>
                      </div>
                    ))}
                    {customerOrders.length === 0 && (
                      <div className="text-center py-4">
                        <p className="text-xs text-muted-foreground opacity-50 italic">No recent order history</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4 text-[11px] leading-relaxed text-amber-800 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30">
               <strong>POLICY:</strong> High outstanding balances can affect store cashflow. Please request the customer to clear some dues or use their wallet balance if possible. You can continue if the customer is trusted.
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                onClick={() => setCreditOverridePrompt(null)}
                className="w-full sm:w-auto font-bold border-slate-200 translate-y-0 active:translate-y-0.5 transition-transform"
              >
                Cancel Order
              </Button>
              <Button
                onClick={() => {
                  if (!creditOverridePrompt?.pendingOrderData) return;
                  const forceOrderData = {
                    ...creditOverridePrompt.pendingOrderData,
                    creditOverrideApproved: true,
                  };
                  setCreditOverridePrompt(null);
                  createOrderMutation.mutate(forceOrderData);
                }}
                disabled={createOrderMutation.isPending}
                className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-black shadow-lg shadow-amber-600/20 translate-y-0 active:translate-y-0.5 transition-transform"
              >
                {createOrderMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                Continue Anyway
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      < OrderConfirmationDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        order={createdOrder}
        enableGST={enableGST}
        onClose={() => {
          setIsModalOpen(false);
          // 🧹 CLEAR FORM After Successful Order
          setSelectedServices([]);
          setFoundCustomer(null);
          setCustomerName('');
          setCustomerPhone('');
          setCustomerEmail('');
          setCustomerAddress('');
          setSpecialInstructions('');
          setIsExpressOrder(false);
          setDiscountValue(0);
          setExtraCharges(0);
          localStorage.removeItem(ABANDONED_CART_KEY);
          // Show refreshing state briefly
          toast({ title: "Form Cleared", description: "Ready for next order." });
        }}
      />

      {/* History Order Details Dialog */}
      <OrderDetailsDialog
        order={selectedHistoryOrder}
        isOpen={isHistoryDetailsOpen}
        onClose={() => setIsHistoryDetailsOpen(false)}
        onEdit={(order) => {
          // Future: Load order into form
          setIsHistoryDetailsOpen(false);
          toast({
            title: "Edit Mode",
            description: "Loading historical orders into the form is coming soon.",
          });
        }}
        onCancel={(order) => {
          if (window.confirm("Are you sure you want to cancel this order?")) {
            updateOrderStatusMutation.mutate({
              orderId: order.id,
              newStatus: 'cancelled'
            });
            setIsHistoryDetailsOpen(false);
          }
        }}
        onNextStep={(order) => {
          const statusFlow = ['pending', 'processing', 'ready_for_pickup', 'completed'];
          const currentIndex = statusFlow.indexOf(order.status);
          const nextStatus = statusFlow[currentIndex + 1];
          if (nextStatus) {
            updateOrderStatusMutation.mutate({
              orderId: order.id,
              newStatus: nextStatus
            });
          }
        }}
        onPrintInvoice={(order) => {
          // Printing is handled inside the dialog, but we could add extra logic here
        }}
        onUpdatePaymentStatus={(orderId, status) => {
          updateOrderMutation.mutate({
            id: orderId,
            paymentStatus: status
          } as any);
        }}
      />
    </div>
  );
}
