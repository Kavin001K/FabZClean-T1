import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Switch } from "@/components/ui/switch";
import { PlusCircle, User, Calendar as CalendarIcon, Truck, IndianRupee, Search, CheckCircle, X, Loader2, AlertCircle, History, Package, TrendingUp, Clock, ShoppingBag, Zap, CreditCard, Phone, Mail, TrendingDown, ShoppingCart, List, Store, MapPin, ChevronUp, ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, toTitleCase } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Service, Order, Customer, OrderStoreCode } from "@shared/schema";
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
import { createAddressObject, parseAndFormatAddress } from "@/lib/address-utils";
import {
  ORDER_STORE_OPTIONS,
  getOrderStoreLabel,
  resolveOrderStoreCodeFromEmployee,
} from "@/lib/order-store";
import { formatCurrencyWithSettings, roundInvoiceAmount } from "@/lib/settings-utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface ServiceItem {
  /** Unique ID for this cart line item (allows same service added multiple times) */
  instanceKey: string;
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

let instanceCounter = 0;
const nextInstanceKey = (serviceId: string) => `${serviceId}_${++instanceCounter}_${Date.now()}`;

const safeParseFloat = (val: any) => {
  const parsed = parseFloat(val);
  return isNaN(parsed) ? 0 : parsed;
};

const toDateOnly = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate());
const DEFAULT_DUE_DATE_OFFSET_DAYS = 15;

const toOrderCreatedAt = (value: Date) =>
  new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate(), 12, 0, 0)).toISOString();

export default function CreateOrder() {
  useEffect(() => {
    document.title = "New Order | FabzClean";
  }, []);

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
  // Refs for keyboard-driven focus flow (inputs keyed by instanceKey)
  const nameRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const quantityRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const priceRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const tagNoteRefs = useRef<Record<string, HTMLInputElement | null>>({});
  // Track the last-added service instance for auto-focus
  const [lastAddedInstanceKey, setLastAddedInstanceKey] = useState<string | null>(null);
  // Collapsible extras state
  const [showCouponExtras, setShowCouponExtras] = useState(false);
  const [showCustomerInfo, setShowCustomerInfo] = useState(false);
  const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerSecondaryPhone, setCustomerSecondaryPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerStreet, setCustomerStreet] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerPincode, setCustomerPincode] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [storeCode, setStoreCode] = useState<OrderStoreCode>('POL');
  const [billDate, setBillDate] = useState<Date>(() => toDateOnly(new Date()));

  // Services state (must be before useEffect that references it)
  const [selectedServices, setSelectedServices] = useState<ServiceItem[]>([]);

  // Order details (must be before useEffect that references it)
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Abandoned Cart Recovery
  const ABANDONED_CART_KEY = "fabzclean_cart_draft_v1";

  useEffect(() => {
    const hasDraft = Boolean(localStorage.getItem(ABANDONED_CART_KEY));
    if (!hasDraft) {
      setStoreCode(resolveOrderStoreCodeFromEmployee(currentUser as any));
    }
  }, [currentUser]);

  // Load draft on mount
  useEffect(() => {
    const saved = localStorage.getItem(ABANDONED_CART_KEY);
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        if (draft.phoneNumber) setPhoneNumber(draft.phoneNumber);
        if (draft.customerName) setCustomerName(draft.customerName);
        if (draft.customerPhone) setCustomerPhone(draft.customerPhone);
        if (draft.customerSecondaryPhone) setCustomerSecondaryPhone(draft.customerSecondaryPhone);
        if (draft.foundCustomer) setFoundCustomer(draft.foundCustomer);
        if (draft.selectedServices) {
          // Add missing instanceKeys to support older carts
          const withKeys = draft.selectedServices.map((s: any) => ({
            ...s,
            instanceKey: s.instanceKey || nextInstanceKey(s.service?.id || 'old')
          }));
          setSelectedServices(withKeys);
        }
        if (draft.specialInstructions) setSpecialInstructions(draft.specialInstructions);
        if (draft.storeCode) setStoreCode(draft.storeCode);
        if (draft.billDate) setBillDate(toDateOnly(new Date(draft.billDate)));

        toast({ title: "Draft Restored", description: "Taking you back to where you left off." });
      } catch (e) {
        console.error("Failed to restore draft", e);
      }
    }
  }, []);

  // Save draft on change
  useEffect(() => {
    const draft = {
      phoneNumber, customerName, customerPhone, customerSecondaryPhone, selectedServices, specialInstructions, foundCustomer, storeCode, billDate
    };
    localStorage.setItem(ABANDONED_CART_KEY, JSON.stringify(draft));
  }, [phoneNumber, customerName, customerPhone, customerSecondaryPhone, selectedServices, specialInstructions, foundCustomer, storeCode, billDate]);

  // Customer creation popup
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerSecondaryPhone, setNewCustomerSecondaryPhone] = useState('');
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
  const [enableGST, setEnableGST] = useState(false); // GST defaults to OFF
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
  const [sessionOrders, setSessionOrders] = useState<Order[]>([]);

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

  // Session Activity stats
  const sessionStats = useMemo(() => {
    return sessionOrders.reduce((stats, order) => {
      stats.count += 1;
      stats.total += safeParseFloat(order.totalAmount || 0);
      return stats;
    }, { count: 0, total: 0 });
  }, [sessionOrders]);

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

  const positiveSelectedServices = useMemo(
    () => selectedServices.filter((item) => item.quantity > 0),
    [selectedServices]
  );

  const selectedServiceCount = positiveSelectedServices.length;
  const totalSelectedItemCount = useMemo(
    () => positiveSelectedServices.reduce((sum, item) => sum + item.quantity, 0),
    [positiveSelectedServices]
  );

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
        setCustomerSecondaryPhone(customer.secondaryPhone || "");

        // Use raw address object fields for our split state
        const addrObj = customer.address as { street?: string, city?: string, pincode?: string };
        setCustomerStreet(addrObj?.street || "");
        setCustomerCity(addrObj?.city || "");
        setCustomerPincode(addrObj?.pincode || "");

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
    setCustomerSecondaryPhone(customer.secondaryPhone || "");

    // Use raw address object fields for our split state
    const addrObj = customer.address as { street?: string, city?: string, pincode?: string };
    setCustomerStreet(addrObj?.street || "");
    setCustomerCity(addrObj?.city || "");
    setCustomerPincode(addrObj?.pincode || "");

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
        setCustomerSecondaryPhone(newCustomer.secondaryPhone || "");

        // Use raw address object fields for our split state
        const addrObj = newCustomer.address as { street?: string, city?: string, pincode?: string };
        setCustomerStreet(addrObj?.street || "");
        setCustomerCity(addrObj?.city || "");
        setCustomerPincode(addrObj?.pincode || "");

        queryClient.invalidateQueries({ queryKey: ["customers"] });

        toast({
          title: "Customer Created!",
          description: `${newCustomer.name} has been added successfully.`,
        });

        setShowCustomerDialog(false);
        // Reset new customer form
        setNewCustomerName('');
        setNewCustomerPhone('');
        setNewCustomerSecondaryPhone('');
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
    if (!newCustomerName || !newCustomerPhone || !newCustomerStreet) {
      toast({
        title: "Validation Error",
        description: "Name, Phone, and Street Address are required",
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
      secondaryPhone: newCustomerSecondaryPhone || undefined,
      email: newCustomerEmail || undefined,
      address: addressObj,
    });
  };

  // Add service to order — always as a NEW line item (never merge duplicates)
  const handleAddService = (serviceId: string) => {
    const serviceToAdd = services?.find(s => s.id === serviceId);
    if (!serviceToAdd) return;

    const key = nextInstanceKey(serviceId);
    setSelectedServices(prev => [...prev, {
      instanceKey: key,
      service: serviceToAdd,
      quantity: 1,
      priceOverride: parseFloat(serviceToAdd.price),
      subtotal: parseFloat(serviceToAdd.price),
      customName: serviceToAdd.name,
      tagNote: '',
    }]);
    setLastAddedInstanceKey(key);
  };

  // Update service quantity by instanceKey — allows 0 (waits for new input)
  const handleUpdateQuantity = (instanceKey: string | undefined, qty: number | string) => {
    if (!instanceKey) return;
    
    // If the input is empty or 0, we set it to 0 but DON'T remove the service.
    // This allows the user to backspace and type a new number.
    const safeQty = qty === "" ? 0 : Math.max(0, Number.isFinite(Number(qty)) ? Math.round(Number(qty)) : 0);
    
    const updated = selectedServices.map((item) => {
      if (item.instanceKey === instanceKey) {
        // Use the original price for subtotal calculation
        const price = Number(item.priceOverride ?? item.service.price ?? 0);
        return {
          ...item,
          quantity: safeQty,
          subtotal: safeQty * price,
        };
      }
      return item;
    });
    setSelectedServices(updated);
  };

  const handleUpdatePrice = (instanceKey: string | undefined, price: number) => {
    if (!instanceKey) return;
    const safePrice = Math.max(0, Number.isFinite(price) ? Math.round(price) : 0);
    const updated = selectedServices.map((item) =>
      item.instanceKey === instanceKey
        ? { ...item, priceOverride: safePrice, subtotal: item.quantity * safePrice }
        : item
    );
    setSelectedServices(updated);
  };

  const handleAdjustPrice = (instanceKey: string | undefined, delta: number) => {
    if (!instanceKey) return;
    const currentItem = selectedServices.find((item) => item.instanceKey === instanceKey);
    if (!currentItem) return;
    handleUpdatePrice(instanceKey, Math.max(0, currentItem.priceOverride + delta));
  };

  /**
   * Handle price input with arithmetic notation (+N/-N).
   * If value starts with + or -, treat as relative adjustment.
   * Arrow keys: Up/Down adjusts by ₹5 (handled in onKeyDown).
   */
  const handlePriceInputChange = (instanceKey: string, rawValue: string) => {
    const trimmed = rawValue.trim();
    // If starts with + or - followed by digits, treat as arithmetic
    const arithmeticMatch = trimmed.match(/^([+-])(\d+\.?\d*)$/);
    if (arithmeticMatch) {
      const [, op, numStr] = arithmeticMatch;
      const num = parseFloat(numStr);
      if (Number.isFinite(num) && num > 0) {
        const currentItem = selectedServices.find(i => i.instanceKey === instanceKey);
        if (currentItem) {
          const newPrice = op === '+' ? currentItem.priceOverride + num : currentItem.priceOverride - num;
          handleUpdatePrice(instanceKey, newPrice);
        }
      }
      return;
    }
    // Normal numeric input
    handleUpdatePrice(instanceKey, parseFloat(rawValue) || 0);
  };

  // Remove service by instanceKey
  const handleRemoveService = (instanceKey: string | undefined) => {
    if (!instanceKey) return;
    setSelectedServices(prev => prev.filter(s => s.instanceKey !== instanceKey));
  };

  // Auto-focus service name input when a new service is added
  useEffect(() => {
    if (lastAddedInstanceKey) {
      // Short delay for DOM to render
      const timer = setTimeout(() => {
        const nameInput = nameRefs.current[lastAddedInstanceKey];
        if (nameInput) {
          nameInput.focus();
          nameInput.select();
        } else {
          // Fallback to quantity if name ref not found
          const qtyInput = quantityRefs.current[lastAddedInstanceKey];
          if (qtyInput) { qtyInput.focus(); qtyInput.select(); }
        }
        setLastAddedInstanceKey(null);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [lastAddedInstanceKey, selectedServices]);

  // Auto-set due date: 15 days from the selected order creation date
  useEffect(() => {
    const dueDate = new Date(
      toDateOnly(billDate).getTime() + DEFAULT_DUE_DATE_OFFSET_DAYS * 24 * 60 * 60 * 1000
    );
    setPickupDate(dueDate);
  }, [billDate]);

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
          newOrder.items = positiveSelectedServices.map(item => ({
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

        // 4a. Ensure Bill Date for invoice/confirmation displays
        if (!newOrder.createdAt) {
          newOrder.createdAt = newOrder.created_at || toOrderCreatedAt(billDate);
        }

        // 4b. Ensure Store Code for tags and filtering
        if (!newOrder.storeCode) {
          newOrder.storeCode = newOrder.store_code || storeCode;
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
        setSessionOrders(prev => [newOrder, ...prev]);
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
    setCustomerSecondaryPhone('');
    setCustomerStreet('');
    setCustomerCity('');
    setCustomerPincode('');
    setCustomerNotes('');
    setSelectedServices([]);
    setDiscountType('none');
    setDiscountValue(0);
    setCouponCode('');
    setExtraCharges(0);
    setExtraChargesLabel('');
    setBillDate(toDateOnly(new Date()));
    setPickupDate(undefined);
    setSpecialInstructions('');
    setAdvancePayment('');
    setPaymentMethod('cash');
    setPaymentStatus('pending');
    setEnableGST(false);
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

    if (positiveSelectedServices.length === 0) {
      toast({
        title: "Validation Error",
        description: selectedServices.length === 0
          ? "Please select at least one service"
          : "Please enter quantity greater than 0 for at least one service",
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
          secondaryPhone: customerSecondaryPhone || undefined,
          email: customerEmail || undefined,
          // Send address as an object to satisfy jsonb requirement
          address: { street: customerStreet, city: customerCity, pincode: customerPincode },
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
      const hasNameChanged = foundCustomer.name !== customerName;
      const hasPhoneChanged = foundCustomer.phone !== customerPhone;
      const hasSecondaryPhoneChanged = foundCustomer.secondaryPhone !== customerSecondaryPhone;
      const hasEmailChanged = foundCustomer.email !== (customerEmail || null);
      
      const addrObj = foundCustomer.address as { street?: string, city?: string, pincode?: string };
      const hasAddressChanged = customerStreet !== (addrObj?.street || "") || 
                                customerCity !== (addrObj?.city || "") || 
                                customerPincode !== (addrObj?.pincode || "");

      if (hasNameChanged || hasPhoneChanged || hasSecondaryPhoneChanged || hasEmailChanged || hasAddressChanged) {
        const updates: any = {};
        if (hasNameChanged) updates.name = customerName;
        if (hasPhoneChanged) updates.phone = customerPhone;
        if (hasSecondaryPhoneChanged) updates.secondaryPhone = customerSecondaryPhone || null;
        if (hasEmailChanged) updates.email = customerEmail || null;
        if (hasAddressChanged) updates.address = { street: customerStreet, city: customerCity, pincode: customerPincode };

        try {
          await customersApi.update(currentCustomerId, updates);
          console.log("Customer profile synchronized automatically");
          // Ensure we refetch autocomplete and search data
          await queryClient.invalidateQueries({ queryKey: ["customers"] });
          // Also update the local state so the next order in the same session has latest data
          setFoundCustomer(prev => prev ? { ...prev, ...updates } : prev);
        } catch (e) {
          console.warn("Soft fail: could not auto-sync customer profile", e);
        }
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
      storeCode,
      customerName,
      customerEmail: customerEmail || undefined,
      customerPhone,
      secondaryPhone: customerSecondaryPhone || undefined,
      status: "pending",
      paymentStatus: paymentStatus,
      totalAmount: totalAmount.toFixed(2),
      items: positiveSelectedServices.map(item => ({
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
      createdAt: toOrderCreatedAt(billDate),
      pickupDate: pickupDate ? new Date(pickupDate).toISOString() : undefined,
      specialInstructions: specialInstructions,
      shippingAddress: {
        street: customerStreet || "",
        city: customerCity || "",
        pincode: customerPincode || "",
      },
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
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 animate-fade-in pb-24 lg:pb-8 bg-background dark:bg-slate-950 min-h-screen">
      <header className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Create New Order</h1>
        <Button
          onClick={handleCreateOrder}
          data-save-button
          disabled={createOrderMutation.isPending || selectedServiceCount === 0 || !customerName || !customerPhone}
          size="lg"
          className="hidden sm:inline-flex bg-primary hover:bg-primary/90 text-white shadow-lg"
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
            <Card className="border dark:border-slate-700/50 dark:bg-slate-900/40 shadow-sm">
              <CardHeader className="dark:border-slate-800">
                <CardTitle className="flex items-center text-slate-900 dark:text-white">
                  <Search className="h-5 w-5 mr-2 text-primary" />
                  Customer Search
                </CardTitle>
                <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1">
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
                      placeholder={isMobile ? "Search customer..." : "Search by name, ID, phone, or email..."}
                    />
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-between p-4 rounded-xl border-2 border-primary/20 bg-primary/5 dark:bg-primary/10 dark:border-primary/30 shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary dark:text-primary">
                        <User className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg leading-none text-slate-900 dark:text-white">{foundCustomer.name}</h3>
                          {foundCustomer.id && (
                            <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0 h-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700">
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
                        {foundCustomer.address && (
                          <div className="mt-2 space-y-1">
                            {(() => {
                              const addr = typeof foundCustomer.address === 'string' 
                                ? JSON.parse(foundCustomer.address) 
                                : foundCustomer.address;
                                
                              return (
                                <>
                                  {addr.street && (
                                    <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                                      <MapPin className="h-3 w-3 text-primary/70" /> {addr.street}
                                    </p>
                                  )}
                                  {(addr.city || addr.pincode) && (
                                    <div className="flex items-center gap-2 ml-4.5 pl-0.5">
                                      {addr.city && (
                                        <Badge variant="outline" className="text-[10px] h-4 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 font-normal">
                                          {addr.city}
                                        </Badge>
                                      )}
                                      {addr.pincode && (
                                        <Badge variant="outline" className="text-[10px] h-4 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 text-blue-600 dark:blue-400 font-mono">
                                          {addr.pincode}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        )}
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
                        setCustomerStreet('');
                        setCustomerCity('');
                        setCustomerPincode('');
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
            <Card className="border dark:border-slate-700/50 dark:bg-slate-900/40 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setShowCustomerInfo(prev => !prev)}
                className="w-full flex flex-row items-center justify-between p-6 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center font-semibold text-lg tracking-tight leading-none">
                  <User className="h-5 w-5 mr-2 text-primary" />
                  Customer Information
                </div>
                <ChevronRight className={cn("h-5 w-5 transition-transform duration-200 text-slate-500", showCustomerInfo && "rotate-90")} />
              </button>
              
              <AnimatePresence>
                {showCustomerInfo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t dark:border-slate-800" />
                    <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName" className="text-slate-700 dark:text-slate-300">Name *</Label>
                    <Input
                      id="customerName"
                      placeholder="Customer's full name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                      className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="customerPhone" className="text-slate-700 dark:text-slate-300">Primary Phone *</Label>
                      <Input
                        id="customerPhone"
                        placeholder="Primary phone"
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        required
                        className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerSecondaryPhone" className="text-slate-700 dark:text-slate-300">Secondary Phone</Label>
                      <Input
                        id="customerSecondaryPhone"
                        placeholder="Alt phone"
                        type="tel"
                        value={customerSecondaryPhone}
                        onChange={(e) => setCustomerSecondaryPhone(e.target.value)}
                        className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerEmail" className="text-slate-700 dark:text-slate-300">Email Address</Label>
                  <Input
                    id="customerEmail"
                    placeholder="Email (optional)"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="customerStreet" className="text-slate-700 dark:text-slate-300">Street Address</Label>
                    <Input
                      id="customerStreet"
                      placeholder="e.g., 1/85 Kavin Kottampatty"
                      value={customerStreet}
                      onChange={(e) => setCustomerStreet(toTitleCase(e.target.value))}
                      className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerCity" className="text-slate-700 dark:text-slate-300">City</Label>
                      <Input
                        id="customerCity"
                        placeholder="e.g., Pollachi"
                        value={customerCity}
                        onChange={(e) => setCustomerCity(toTitleCase(e.target.value))}
                        className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerPincode" className="text-slate-700 dark:text-slate-300">Pincode</Label>
                      <Input
                        id="customerPincode"
                        placeholder="e.g., 642123"
                        maxLength={6}
                        value={customerPincode}
                        onChange={(e) => setCustomerPincode(e.target.value.replace(/[^0-9]/g, ''))}
                        className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>

          {/* Services Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="border dark:border-slate-700/50 dark:bg-slate-900/40 shadow-sm">
              <CardHeader className="dark:border-slate-800">
                <CardTitle className="flex items-center text-slate-900 dark:text-white">
                  <Truck className="h-5 w-5 mr-2 text-primary" />
                  Services Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Add Service *</Label>
                  {servicesLoading ? (
                    <div className="flex items-center justify-center p-3 border rounded-md bg-slate-100 dark:bg-slate-800/50 dark:border-slate-700">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground dark:text-slate-400">Loading services...</span>
                    </div>
                  ) : servicesError ? (
                    <div className="flex items-center justify-center p-3 border rounded-md bg-destructive/10 dark:bg-red-950/20 dark:border-red-900/30 text-destructive dark:text-red-400">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      <span className="text-sm">Failed to load services. Please refresh the page.</span>
                    </div>
                  ) : (
                  <ServiceCombobox 
                    ref={serviceComboboxRef}
                    services={services} 
                    onSelect={handleAddService} 
                    disabled={servicesLoading}
                    customerOrders={customerOrders}
                  />
                  )}
                </div>

                {selectedServices.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground dark:text-slate-400">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50 dark:opacity-40" />
                    <p>No services added yet. Select a service from the dropdown above.</p>
                  </div>
                ) : (
                  <div className="border dark:border-slate-700 rounded-lg overflow-hidden dark:bg-slate-900/30">
                    {isMobile ? (
                      <div className="space-y-3 p-3">
                        <AnimatePresence>
                          {selectedServices.map((item) => (
                            <motion.div
                              key={item.instanceKey}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Service</p>
                                  <Input
                                    ref={(el) => { nameRefs.current[item.instanceKey] = el; }}
                                    value={item.customName}
                                    onChange={(e) => {
                                      const updated = selectedServices.map((s) =>
                                        s.instanceKey === item.instanceKey ? { ...s, customName: e.target.value } : s
                                      );
                                      setSelectedServices(updated);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        quantityRefs.current[item.instanceKey]?.focus();
                                        quantityRefs.current[item.instanceKey]?.select();
                                      }
                                    }}
                                    className="mt-2 h-11 rounded-xl border-slate-200 bg-white text-base font-semibold dark:border-slate-700 dark:bg-slate-800"
                                    placeholder="Service name"
                                  />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveService(item.instanceKey)}
                                  className="h-10 w-10 rounded-full text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="mt-4 grid grid-cols-2 gap-4">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/80">
                                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 mb-2">Quantity</p>
                                  <Input
                                    ref={(el) => { quantityRefs.current[item.instanceKey] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    value={item.quantity === 0 ? "" : item.quantity}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === "" || /^\d+$/.test(val)) {
                                        handleUpdateQuantity(item.instanceKey, val);
                                      }
                                    }}
                                    onFocus={(e) => e.target.select()}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        priceRefs.current[item.instanceKey]?.focus();
                                        priceRefs.current[item.instanceKey]?.select();
                                      }
                                    }}
                                    className="h-11 w-full text-center font-bold text-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:border-primary focus:ring-primary/20 transition-all"
                                  />
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/80">
                                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 mb-2">Price</p>
                                  <div className="flex items-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 h-11 pr-3">
                                    <span className="pl-3 text-slate-400 font-bold text-sm">₹</span>
                                    <Input
                                      ref={(el) => { priceRefs.current[item.instanceKey] = el; }}
                                      type="text"
                                      inputMode="numeric"
                                      value={item.priceOverride}
                                      onChange={(e) => handlePriceInputChange(item.instanceKey, e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'ArrowUp') { e.preventDefault(); handleAdjustPrice(item.instanceKey, 5); }
                                        if (e.key === 'ArrowDown') { e.preventDefault(); handleAdjustPrice(item.instanceKey, -5); }
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          tagNoteRefs.current[item.instanceKey]?.focus();
                                        }
                                      }}
                                      className="h-full border-0 bg-transparent text-right text-lg font-black dark:text-white focus-visible:ring-0 pr-0"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4 rounded-2xl bg-primary px-4 py-3 text-white shadow-lg shadow-primary/10">
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-xs font-black uppercase tracking-[0.18em] text-white/80">Subtotal</span>
                                  <span className="text-2xl font-black tabular-nums">₹{item.subtotal.toFixed(2)}</span>
                                </div>
                              </div>

                              <div className="mt-4 space-y-3">
                                <div className="space-y-1.5">
                                  <Label className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Tag note</Label>
                                  <Input
                                    ref={(el) => { tagNoteRefs.current[item.instanceKey] = el; }}
                                    value={item.tagNote}
                                    onChange={(e) => {
                                      const updated = selectedServices.map((s) =>
                                        s.instanceKey === item.instanceKey ? { ...s, tagNote: e.target.value } : s
                                      );
                                      setSelectedServices(updated);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        serviceComboboxRef.current?.focus();
                                      }
                                    }}
                                    className="h-10 rounded-xl"
                                    placeholder="Delicate fabric, no bleach"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Garment barcode</Label>
                                  <Input
                                    value={item.garmentBarcode || ''}
                                    onChange={(e) => {
                                      const updated = selectedServices.map((s) =>
                                        s.instanceKey === item.instanceKey ? { ...s, garmentBarcode: e.target.value } : s
                                      );
                                      setSelectedServices(updated);

                                      if (e.target.value.length > 5 && e.target.value.endsWith('50')) {
                                        toast({
                                          title: "Garment Lifecycle Warning",
                                          description: "This garment has been washed 50 times. Inspect it for wear before processing.",
                                          variant: "destructive"
                                        });
                                      }
                                    }}
                                    className="h-10 rounded-xl"
                                    placeholder="Scan permanent tag"
                                  />
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-700">
                            <TableRow>
                              <TableHead className="min-w-[180px] text-slate-700 dark:text-slate-300 font-bold">Service</TableHead>
                              <TableHead className="w-24 text-slate-700 dark:text-slate-300 font-bold">Quantity</TableHead>
                              <TableHead className="w-28 text-slate-700 dark:text-slate-300 font-bold">Price</TableHead>
                              <TableHead className="w-28 text-slate-700 dark:text-slate-300 font-bold">Subtotal</TableHead>
                              <TableHead className="w-16"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <AnimatePresence>
                              {selectedServices.map((item) => (
                                <React.Fragment key={item.instanceKey}>
                                  <motion.tr
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.2 }}
                                    className="border-b-0"
                                  >
                                    <TableCell className="font-medium py-2">
                                      <Input
                                        ref={(el) => { nameRefs.current[item.instanceKey] = el; }}
                                        value={item.customName}
                                        onChange={(e) => {
                                          const updated = selectedServices.map(s =>
                                            s.instanceKey === item.instanceKey ? { ...s, customName: e.target.value } : s
                                          );
                                          setSelectedServices(updated);
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            quantityRefs.current[item.instanceKey]?.focus();
                                            quantityRefs.current[item.instanceKey]?.select();
                                          }
                                        }}
                                        className="w-full font-medium text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                        placeholder="Service name"
                                      />
                                    </TableCell>
                                    <TableCell className="py-2">
                                      <Input
                                        ref={(el) => { quantityRefs.current[item.instanceKey] = el; }}
                                        type="text"
                                        inputMode="numeric"
                                        value={item.quantity === 0 ? "" : item.quantity}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          if (val === "" || /^\d+$/.test(val)) {
                                            handleUpdateQuantity(item.instanceKey, val);
                                          }
                                        }}
                                        onFocus={(e) => e.target.select()}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            priceRefs.current[item.instanceKey]?.focus();
                                            priceRefs.current[item.instanceKey]?.select();
                                          }
                                        }}
                                        className="h-10 w-24 text-center font-bold text-lg bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:border-primary focus:ring-primary/20 transition-all"
                                      />
                                    </TableCell>
                                    <TableCell className="py-2">
                                      <Input
                                        ref={(el) => { priceRefs.current[item.instanceKey] = el; }}
                                        type="text"
                                        inputMode="numeric"
                                        value={item.priceOverride}
                                        onChange={(e) => handlePriceInputChange(item.instanceKey, e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'ArrowUp') { e.preventDefault(); handleAdjustPrice(item.instanceKey, 5); }
                                          if (e.key === 'ArrowDown') { e.preventDefault(); handleAdjustPrice(item.instanceKey, -5); }
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            tagNoteRefs.current[item.instanceKey]?.focus();
                                          }
                                        }}
                                        className="w-24 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                                      />
                                    </TableCell>
                                    <TableCell className="font-semibold text-slate-900 dark:text-white py-2">₹{item.subtotal.toFixed(2)}</TableCell>
                                    <TableCell>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveService(item.instanceKey)}
                                        className="h-8 w-8 p-0"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </motion.tr>
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
                                            ref={(el) => { tagNoteRefs.current[item.instanceKey] = el; }}
                                            value={item.tagNote}
                                            onChange={(e) => {
                                              const updated = selectedServices.map(s =>
                                                s.instanceKey === item.instanceKey ? { ...s, tagNote: e.target.value } : s
                                              );
                                              setSelectedServices(updated);
                                            }}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                e.preventDefault();
                                                serviceComboboxRef.current?.focus();
                                              }
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
                                                s.instanceKey === item.instanceKey ? { ...s, garmentBarcode: e.target.value } : s
                                              );
                                              setSelectedServices(updated);

                                              if (e.target.value.length > 5 && e.target.value.endsWith('50')) {
                                                toast({
                                                  title: "Garment Lifecycle Warning",
                                                  description: "This garment has been washed 50 times! Inspect for wear and tear.",
                                                  variant: "destructive"
                                                });
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
                    )}
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
                  <Label>Bill Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(billDate, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={billDate}
                        onSelect={(date) => {
                          if (date) setBillDate(toDateOnly(date));
                        }}
                        disabled={(date) => date > toDateOnly(new Date())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">
                    Default is today. Choose an older date when you need to bill a missed order.
                  </p>
                </div>
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
                          return date < toDateOnly(billDate);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">
                    Default is 15 days from the order date.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialInstructions" className="text-slate-700 dark:text-slate-300">Special Instructions</Label>
                  <Textarea
                    id="specialInstructions"
                    placeholder="e.g., gate code, specific drop-off location"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    rows={3}
                    className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeCode" className="text-slate-700 dark:text-slate-300">Store Code</Label>
                  <Select value={storeCode} onValueChange={(value: OrderStoreCode) => setStoreCode(value)}>
                    <SelectTrigger id="storeCode" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                      <SelectValue placeholder="Select store">
                        {getOrderStoreLabel(storeCode)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STORE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Printed tags will show this branch code as `FAB CLEAN ({storeCode})`.
                  </p>
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
            <Card className="overflow-hidden border transition-all duration-300 dark:border-slate-700/50 dark:bg-slate-900/40 shadow-sm">
              <CardHeader className="bg-slate-50/50 dark:bg-primary/10 border-b dark:border-primary/20 pb-4">
                <CardTitle className="flex items-center text-lg font-bold text-slate-900 dark:text-white">
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
                  <TabsList className="grid grid-cols-2 w-full h-14 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-lg shadow-sm">
                    <TabsTrigger value="pickup" className="data-[state=active]:bg-white dark:data-[state=active]:bg-primary data-[state=active]:text-primary dark:data-[state=active]:text-white data-[state=active]:shadow-md font-bold gap-2 rounded-md transition-all text-sm">
                      <Store className="h-4 w-4" /> Store Pickup
                    </TabsTrigger>
                    <TabsTrigger value="delivery" className="data-[state=active]:bg-white dark:data-[state=active]:bg-primary data-[state=active]:text-primary dark:data-[state=active]:text-white data-[state=active]:shadow-md font-bold gap-2 rounded-md transition-all text-sm">
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
                          <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">Delivery Address</Label>
                          {foundCustomer && (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="h-7 text-[10px] font-semibold gap-1.5 px-3 shadow-sm hover:shadow-md transition-all bg-primary/10 hover:bg-primary/20 text-primary dark:bg-primary/20 dark:hover:bg-primary/30"
                              onClick={() => setDeliveryAddress(parseAndFormatAddress(foundCustomer.address))}
                            >
                              <User className="h-3.5 w-3.5" /> Auto-fill from Profile
                            </Button>
                          )}
                        </div>
                        <div className="relative group">
                          <Textarea 
                            placeholder="Enter detailed delivery address..." 
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            className="min-h-[100px] sm:min-h-[120px] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-primary/20 focus:border-primary dark:focus:border-primary transition-all text-sm leading-relaxed shadow-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">Delivery Charges (₹)</Label>
                        <div className="relative group">
                          <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 group-focus-within:text-primary transition-colors" />
                          <Input 
                            type="number" 
                            min="0"
                            placeholder="0.00"
                            value={deliveryCharges || ''}
                            onChange={(e) => setDeliveryCharges(safeParseFloat(e.target.value))}
                            className="pl-9 h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-primary/20 focus:border-primary dark:focus:border-primary transition-all font-bold text-lg"
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
                                "h-8 px-4 text-xs font-bold transition-all rounded-lg dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white",
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

                {/* Collapsible Coupon & Extra Charges */}
                <div className="border rounded-lg overflow-hidden transition-all">
                  <button
                    type="button"
                    onClick={() => setShowCouponExtras(prev => !prev)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <PlusCircle className="h-4 w-4" />
                      Coupon & Extra Charges
                    </span>
                    <ChevronRight className={cn("h-4 w-4 transition-transform duration-200", showCouponExtras && "rotate-90")} />
                  </button>
                  <AnimatePresence>
                    {showCouponExtras && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-4 border-t dark:border-slate-700">
                          <div className="space-y-2 pt-3">
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
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
          {/* Customer History Section - Now at the Top */}
          <AnimatePresence>
            {foundCustomer && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="mb-4"
              >
                <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5 shadow-sm">
                  <CardHeader className="pb-3 border-b border-primary/10">
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
                        {/* Customer Stats - Two Row Layout for Instant Insight */}
                        {/* Customer Stats - Professional Grid Layout */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pb-2">
                          {/* Row 1: Primary Transaction Stats */}
                          <div className="flex-1 min-w-[100px] bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-200/50 dark:border-emerald-800/50 shadow-sm transition-all hover:bg-emerald-100/50">
                            <div className="flex items-center gap-1.5 mb-1">
                              <ShoppingBag className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-600 dark:text-emerald-400 leading-none truncate">Orders</span>
                            </div>
                            <p className="text-xl font-black text-emerald-700 dark:text-emerald-300 tabular-nums">{customerStats.totalOrders}</p>
                          </div>

                          <div className="flex-1 min-w-[110px] bg-blue-50 dark:bg-blue-950/30 p-2.5 rounded-xl border border-blue-200/50 dark:border-blue-800/50 shadow-sm transition-all hover:bg-blue-100/50">
                            <div className="flex items-center gap-1.5 mb-1">
                              <TrendingUp className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                              <span className="text-[9px] uppercase tracking-wider font-extrabold text-blue-600 dark:text-blue-400 leading-none truncate">Spent</span>
                            </div>
                            <p className="text-xl font-black text-blue-700 dark:text-blue-300 tabular-nums">₹{customerStats.totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                          </div>

                          <div className="flex-1 min-w-[100px] bg-green-50 dark:bg-green-950/30 p-2.5 rounded-xl border border-green-200/50 dark:border-green-800/50 shadow-sm transition-all hover:bg-green-100/50">
                            <div className="flex items-center gap-1.5 mb-1">
                              <CreditCard className="h-3 w-3 text-green-600 dark:text-green-400" />
                              <span className="text-[9px] uppercase tracking-wider font-extrabold text-green-600 dark:text-green-400 leading-none truncate">Wallet</span>
                            </div>
                            <p className="text-xl font-black text-green-700 dark:text-green-300 tabular-nums">
                              ₹{parseFloat(String(foundCustomer?.walletBalanceCache || 0)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </p>
                          </div>

                          {/* Row 2: Credit & Limit Status */}
                          <div className="flex-[1.5] min-w-[140px] bg-red-50 dark:bg-red-950/30 p-2.5 rounded-xl border border-red-200/50 dark:border-red-800/50 shadow-sm transition-all hover:bg-red-100/50">
                            <div className="flex items-center gap-1.5 mb-1">
                              <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                              <span className="text-[9px] uppercase tracking-wider font-extrabold text-red-600 dark:text-red-400 leading-none truncate">Credit Due</span>
                            </div>
                            {(() => {
                              const due = foundCustomer?.creditBalance ? Number(foundCustomer.creditBalance) : 0;
                              const limit = Math.max(0, Number((foundCustomer as any)?.creditLimit ?? 1000));
                              const dueClass = due > limit ? "text-red-700 dark:text-red-300" : due === 0 ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300";
                              return (
                                <p className={`text-xl font-black ${dueClass} tabular-nums`}>
                                  ₹{due.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                </p>
                              );
                            })()}
                          </div>

                          <div className="flex-1 min-w-[100px] bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200/50 dark:border-amber-800/50 shadow-sm transition-all hover:bg-amber-100/50">
                            <div className="flex items-center gap-1.5 mb-1">
                              <CheckCircle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                              <span className="text-[9px] uppercase tracking-wider font-extrabold text-amber-600 dark:text-amber-400 leading-none truncate">Limit</span>
                            </div>
                            <p className="text-xl font-black text-amber-700 dark:text-amber-300 tabular-nums">
                              ₹{Math.max(0, Number((foundCustomer as any)?.creditLimit ?? 1000)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </p>
                          </div>
                        </div>

                        {/* Recent Transactions List */}
                        {customerOrders.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Recent Activity</p>
                            </div>
                            <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                              {customerOrders.slice(0, 5).map((order, idx) => (
                                <div
                                  key={order.id || idx}
                                  onClick={() => {
                                    setSelectedHistoryOrder(order);
                                    setIsHistoryDetailsOpen(true);
                                  }}
                                  className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-primary/30 rounded-xl transition-all cursor-pointer hover:shadow-sm"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <span className="text-sm font-black text-primary font-mono tracking-tighter">
                                        {order.orderNumber || `#${order.id?.slice(0, 8)}`}
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className={cn(
                                          "text-[9px] font-bold px-1.5 py-0 leading-tight",
                                          order.status === 'completed' || order.status === 'delivered'
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : order.status === 'processing'
                                              ? "bg-blue-50 text-blue-700 border-blue-200"
                                              : "bg-amber-50 text-amber-700 border-amber-200"
                                        )}
                                      >
                                        {order.status?.toUpperCase()}
                                      </Badge>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                                      {order.createdAt ? format(new Date(order.createdAt), 'dd MMM yyyy') : 'N/A'}
                                    </p>
                                  </div>
                                  <span className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                                    ₹{parseFloat(order.totalAmount || '0').toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8 bg-slate-50 dark:bg-slate-900/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <Package className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                        <p className="text-sm font-bold text-slate-400">First-time Customer</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bill Summary - Sticky Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="sticky top-24 z-10"
          >
            <Card className="border-none shadow-2xl bg-gradient-to-br from-white via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 overflow-hidden ring-1 ring-slate-200/60 dark:ring-slate-800 rounded-2xl md:rounded-xl">
              <div className="h-1.5 w-full bg-primary"></div>
              <CardHeader className="pb-4 border-b dark:border-slate-700/50">
                <CardTitle className="flex items-center justify-between text-slate-900 dark:text-white">
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                    Bill Summary
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {selectedServices.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                      <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-sm font-medium text-slate-400">Add services to see summary</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                      {selectedServices.map(item => (
                        <div key={item.instanceKey} className="flex justify-between items-start text-sm group gap-3 py-1">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold group-hover:text-primary transition-colors truncate">{item.service.name}</p>
                            <p className="text-[11px] font-black text-muted-foreground/80 truncate">
                              ₹{safeParseFloat(item.priceOverride).toFixed(2)} × {item.quantity}
                            </p>
                          </div>
                          <span className="font-black text-slate-800 dark:text-slate-200 flex-shrink-0">₹{item.subtotal.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between items-center gap-4 text-sm text-slate-900 dark:text-slate-100 font-bold">
                      <div className="flex items-center gap-2">
                        <span className="opacity-70 dark:opacity-80 min-w-0 truncate">Services Subtotal</span>
                        {selectedServiceCount > 0 && (
                          <div className="flex items-center gap-1.5 ml-1">
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] py-0 px-2 h-4 leading-none font-black">
                              {selectedServiceCount} Svc
                            </Badge>
                          </div>
                        )}
                      </div>
                      <span className="font-black flex-shrink-0 text-base">₹{baseSubtotal.toFixed(2)}</span>
                    </div>
  
                    <AnimatePresence>
                      {isExpressOrder && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="flex justify-between gap-4 text-sm text-amber-600 dark:text-amber-400 font-black"
                        >
                          <span className="flex items-center gap-1 min-w-0">
                            <Zap className="h-3.5 w-3.5 flex-shrink-0" /> <span className="truncate">Express (50%)</span>
                          </span>
                          <span className="flex-shrink-0">+₹{expressSurcharge.toFixed(2)}</span>
                        </motion.div>
                      )}
  
                      {discountAmount > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="flex justify-between gap-4 text-sm text-emerald-600 dark:text-emerald-400 font-black"
                        >
                          <span className="flex items-center gap-1 min-w-0">
                            <TrendingDown className="h-3.5 w-3.5 flex-shrink-0" /> 
                            <span className="truncate">Discount ({discountType === 'percentage' ? `${discountValue}%` : 'Fixed'})</span>
                          </span>
                          <span className="flex-shrink-0">-₹{discountAmount.toFixed(2)}</span>
                        </motion.div>
                      )}
  
                      {extraCharges > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="flex justify-between gap-4 text-sm text-foreground/80 dark:text-slate-300 font-medium"
                        >
                          <span className="flex items-center gap-1 italic min-w-0">
                            <PlusCircle className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                            <span className="truncate">{extraChargesLabel || 'Extra Charges'}</span>
                          </span>
                          <span className="flex-shrink-0">+₹{extraCharges.toFixed(2)}</span>
                        </motion.div>
                      )}
  
                      {enableGST && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="flex justify-between gap-4 text-sm text-slate-900 dark:text-slate-100 font-black"
                        >
                          <span className="opacity-70 dark:opacity-80 min-w-0 truncate">GST (18%)</span>
                          <span className="flex-shrink-0">+₹{gstAmount.toFixed(2)}</span>
                        </motion.div>
                      )}
                  </AnimatePresence>

                  <div className="mt-4 p-5 rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 ring-4 ring-primary/10 transition-transform active:scale-95">
                    <div className="flex justify-between items-center gap-4">
                      <div className="min-w-0">
                         <span className="text-[10px] uppercase tracking-[0.2em] font-black opacity-80 block truncate">
                           {useWallet && walletApplied > 0 ? 'Balance Due' : 'Payable Amount'}
                         </span>
                         {isExpressOrder && (
                           <p className="text-[10px] text-amber-300 font-black uppercase mt-0.5 tracking-wider truncate">
                             Express Order
                           </p>
                         )}
                      </div>
                      <span className="text-3xl font-black tabular-nums flex-shrink-0">₹{finalPayable.toFixed(2)}</span>
                    </div>
                  </div>

                  <AnimatePresence>
                    {useWallet && walletApplied > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-2 flex justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-black px-1 uppercase tracking-wider"
                      >
                        <span className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" /> Wallet Used
                        </span>
                        <span>-₹{walletApplied.toFixed(2)}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="mt-6">
                  <Button
                    onClick={handleCreateOrder}
                    data-save-button
                    disabled={createOrderMutation.isPending || selectedServiceCount === 0 || !customerName || !customerPhone}
                    className="w-full h-14 text-xl font-black shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-[0.98] transition-all bg-primary hover:bg-primary/90 rounded-2xl"
                  >
                    {createOrderMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-6 w-6" />
                        Place Order • ₹{Math.max(0, finalPayable - (parseFloat(advancePayment) || 0)).toFixed(0)}
                      </>
                    )}
                  </Button>
                  
                  <p className="text-[10px] text-center text-muted-foreground mt-3 italic leading-relaxed px-4">
                    By placing this order, you agree to the service terms. A WhatsApp bill will be sent automatically.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Bottom Page Area */}
      <div className="mt-8">
                {/* Session Activity Tracker */}
      {/* Session Activity Tracker */}
      <div className="mt-8">
        <Card className="mt-6 border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10 shadow-none border-dashed overflow-hidden">
          <CardHeader className="py-4 border-b border-dashed border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Session Activity
              </CardTitle>
              {sessionStats.count > 0 && (
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-2">
                     <span className="text-[10px] uppercase tracking-tighter font-extrabold text-slate-400">Total Billing</span>
                     <span className="text-sm font-black text-slate-700 dark:text-slate-300">₹{sessionStats.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  </div>
                  <Badge variant="outline" className="bg-white dark:bg-slate-900 font-bold border-primary/20 text-primary px-3 py-0.5 h-6">
                    {sessionStats.count} {sessionStats.count === 1 ? 'Order' : 'Orders'} Created
                  </Badge>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {sessionOrders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sessionOrders.map((order) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={order.id}
                    onClick={() => {
                      setSelectedHistoryOrder(order);
                      setIsHistoryDetailsOpen(true);
                    }}
                    className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl hover:border-primary/40 transition-all cursor-pointer group hover:shadow-lg active:scale-95"
                  >
                     <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-black text-primary font-mono tracking-tighter">{order.orderNumber}</span>
                          <Badge className={cn(
                            "text-[8px] h-3.5 px-1 leading-none uppercase font-black border-none",
                            order.status === 'completed' ? "bg-emerald-50 text-emerald-600" : "bg-primary/10 text-primary"
                          )}>
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">{order.customerName}</p>
                        <p className="text-[9px] font-medium text-slate-400 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {order.createdAt ? format(new Date(order.createdAt), 'hh:mm a') : 'Just now'}
                        </p>
                     </div>
                     <div className="text-right flex flex-col items-end gap-1 ml-3">
                        <span className="text-base font-black text-slate-900 dark:text-white tabular-nums">₹{parseFloat(order.totalAmount || '0').toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                        <div className="flex items-center gap-1">
                           <div className={cn(
                             "w-1.5 h-1.5 rounded-full",
                             order.paymentMethod === 'cash' ? "bg-emerald-400" : order.paymentMethod === 'upi' ? "bg-blue-400" : "bg-amber-400"
                           )}></div>
                           <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400">{order.paymentMethod}</span>
                        </div>
                     </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground flex flex-col items-center justify-center py-12 opacity-60">
                 <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                    <List className="h-8 w-8 opacity-20" />
                 </div>
                 <p className="font-bold text-slate-500 text-sm">Session activity is empty</p>
                 <p className="text-xs mt-1">Orders created in this window will appear here for fast tracking</p>
              </div>
            )}
          </CardContent>
        </Card>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newCustomerPhone">Primary Phone *</Label>
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
                <Label htmlFor="newCustomerSecondaryPhone">Secondary Phone</Label>
                <Input
                  id="newCustomerSecondaryPhone"
                  placeholder="Alt phone (optional)"
                  type="tel"
                  value={newCustomerSecondaryPhone}
                  onChange={(e) => setNewCustomerSecondaryPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Address Fields - Collected Separately */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-semibold text-sm text-muted-foreground">Address</h4>
              <div className="space-y-2">
                <Label htmlFor="newCustomerStreet">Street Address *</Label>
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
        <DialogContent className="max-w-2xl border-none shadow-2xl p-0 overflow-hidden bg-slate-50 dark:bg-slate-950 max-h-[90vh] flex flex-col">
          <div className="h-1.5 w-full bg-amber-500"></div>
          
          <div className="p-6 space-y-6 overflow-y-auto">
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
                    {customerOrders?.slice(0, 10).map((order: any) => (
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
                    {customerOrders && customerOrders.length === 0 && (
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
      <OrderConfirmationDialog
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
          setCustomerStreet('');
          setCustomerCity('');
          setCustomerPincode('');
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
          let nextStatus: string | null = null;
          if (order.status === 'pending') {
            nextStatus = 'processing';
          } else if (order.status === 'processing') {
            nextStatus = (order as any).fulfillmentType === 'delivery' ? 'out_for_delivery' : 'ready_for_pickup';
          } else if (order.status === 'out_for_delivery' || order.status === 'ready_for_pickup') {
            nextStatus = 'completed';
          }
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
        onUpdatePaymentStatus={(order, status) => {
          updateOrderMutation.mutate({
            id: order.id,
            paymentStatus: status
          } as any);
        }}
      />
    </div>
  );
}
