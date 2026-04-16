import React from 'react';
// Customer Dialogs Component
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { formatAddress, parseAddress, createAddressObject } from '@/lib/address-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  IndianRupee,
  ShoppingBag,
  Star,
  Clock,
  Trash2,
  UserPlus
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate, formatCurrency } from '@/lib/data-service';
import { customersApi } from '@/lib/data-service';
import { navigateOnEnter } from '@/lib/enter-navigation';
import { cn } from '@/lib/utils';
import type { Customer, Order } from '@shared/schema';
import type { CustomerFeedbackRecord, CustomerOrderHistoryRecord, CustomerProfileDetails } from '@/lib/data-service';

// Import New Wallet Components
import { WalletRechargeModal } from '../wallet-recharge-modal';
import { CustomerWalletHistory } from '../customer-wallet-history';

// Form validation schemas - with separate address fields
const customerFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  email: z.string().refine((val) => !val || z.string().email().safeParse(val).success, {
    message: 'Please enter a valid email address',
  }).optional(),
  phone: z.string().refine((val) => /^\d{10}$/.test(val.replace(/[^\d]/g, '').replace(/^(91|0+)/, '')), { message: 'Phone number must be exactly 10 digits' }),
  secondaryPhone: z.string().refine((val) => !val || /^\d{10}$/.test(val.replace(/[^\d]/g, '').replace(/^(91|0+)/, '')), {
    message: 'Secondary phone must be exactly 10 digits',
  }).optional(),
  // Separate address fields for clean data collection
  addressStreet: z.string().min(1, 'Street address is required'),
  addressCity: z.string().optional(),
  addressPincode: z.string().refine((val) => !val || /^\d{6}$/.test(val.replace(/\s/g, '')), {
    message: 'Pincode must be 6 digits',
  }).optional(),
  notes: z.string().optional(),
  // New fields for enhanced customer management
  companyName: z.string().optional(),
  taxId: z.string().optional(),
  dateOfBirth: z.string().optional(),
  creditLimit: z.string().optional(),
  creditBalance: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  paymentTerms: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerFormSchema>;

interface CustomerDialogsProps {
  selectedCustomer: Customer | null;
  isViewDialogOpen: boolean;
  isEditDialogOpen: boolean;
  isCreateDialogOpen: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  onCloseViewDialog: () => void;
  onCloseEditDialog: () => void;
  onCloseCreateDialog: () => void;
  onEditCustomer: (data: CustomerFormData) => void;
  onCreateCustomer: (data: CustomerFormData) => void;
  onDeleteCustomer?: (customerId: string) => void;
  orders?: Order[];
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatRating = (rating?: number | null) => {
  if (rating === null || rating === undefined || Number.isNaN(Number(rating))) return 'N/A';
  return Number(rating).toFixed(2);
};

const formatFeedbackTimestamp = (dateValue?: string | null, timeValue?: string | null, createdAt?: string | null) => {
  const direct = [dateValue, timeValue].filter(Boolean).join(' ');
  if (direct) return direct;
  if (!createdAt) return 'Not timestamped';
  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) return 'Not timestamped';
  return parsed.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const CustomerDialogs: React.FC<CustomerDialogsProps> = React.memo(({
  selectedCustomer,
  isViewDialogOpen,
  isEditDialogOpen,
  isCreateDialogOpen,
  isCreating,
  isUpdating,
  onCloseViewDialog,
  onCloseEditDialog,
  onCloseCreateDialog,
  onEditCustomer,
  onCreateCustomer,
  onDeleteCustomer,
  orders = [],
}) => {
  const createSubmitButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const editSubmitButtonRef = React.useRef<HTMLButtonElement | null>(null);

  // Parse existing address for edit form
  const existingAddress = React.useMemo(() => {
    if (!selectedCustomer?.address) return { street: '', city: '', pincode: '' };
    const parsed = parseAddress(selectedCustomer.address);
    return {
      street: parsed.street,
      city: parsed.city,
      pincode: parsed.pincode,
    };
  }, [selectedCustomer?.address]);

  const [isRechargeModalOpen, setIsRechargeModalOpen] = React.useState(false);

  const editForm = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: selectedCustomer?.name || '',
      email: selectedCustomer?.email || '',
      phone: selectedCustomer?.phone || '',
      secondaryPhone: (selectedCustomer as any)?.secondaryPhone || '',
      addressStreet: existingAddress.street,
      addressCity: existingAddress.city,
      addressPincode: existingAddress.pincode,
      creditLimit: String((selectedCustomer as any)?.creditLimit ?? '1000'),
      creditBalance: selectedCustomer?.creditBalance || '0',
      notes: '',
    },
  });

  const createForm = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      secondaryPhone: '',
      addressStreet: '',
      addressCity: '',
      addressPincode: '',
      creditLimit: '1000',
      notes: '',
    },
  });

  // Reset forms when dialogs open/close
  React.useEffect(() => {
    if (isEditDialogOpen && selectedCustomer) {
      editForm.reset({
        name: selectedCustomer.name,
        email: selectedCustomer.email || '',
        phone: selectedCustomer.phone || '',
        secondaryPhone: (selectedCustomer as any)?.secondaryPhone || '',
        addressStreet: existingAddress.street,
        addressCity: existingAddress.city,
        addressPincode: existingAddress.pincode,
        creditLimit: String((selectedCustomer as any)?.creditLimit ?? '1000'),
        creditBalance: selectedCustomer.creditBalance || '0',
      });
    }
  }, [isEditDialogOpen, selectedCustomer, editForm, existingAddress.street, existingAddress.city, existingAddress.pincode]);

  React.useEffect(() => {
    if (isCreateDialogOpen) {
      createForm.reset();
    }
  }, [isCreateDialogOpen, createForm]);

  const handleEditSubmit = (data: CustomerFormData) => {
    onEditCustomer(data);
  };

  const handleCreateSubmit = (data: CustomerFormData) => {
    onCreateCustomer(data);
  };

  // Compute customer stats only when we have a selected customer (View/Edit dialogs)
  const totalSpent = selectedCustomer ? parseFloat(selectedCustomer.totalSpent || '0') : 0;
  const totalOrders = selectedCustomer?.totalOrders || 0;
  const customerSince = selectedCustomer ? new Date(selectedCustomer.createdAt || new Date()) : new Date();
  const daysSinceJoined = Math.max(1, Math.floor((Date.now() - customerSince.getTime()) / (1000 * 60 * 60 * 24)));
  const monthsSinceJoin = Math.max(1, Math.ceil(daysSinceJoined / 30));
  const orderFrequency = totalOrders > 0 ? (totalOrders / monthsSinceJoin).toFixed(1) : '0';
  const selectedOutstanding = selectedCustomer ? parseFloat(selectedCustomer.creditBalance || '0') : 0;
  const selectedCreditLimitAbs = selectedCustomer ? Math.max(0, parseFloat((selectedCustomer as any).creditLimit || '1000')) : 1000;
  const selectedLimitExceeded = selectedOutstanding > selectedCreditLimitAbs;
  const selectedOutstandingClass = selectedLimitExceeded ? 'text-red-500' : selectedOutstanding === 0 ? 'text-emerald-500' : 'text-amber-500';
  const selectedWalletBalance = selectedCustomer ? parseFloat((selectedCustomer as any).walletBalanceCache || '0') : 0;

  const customerProfileQuery = useQuery({
    queryKey: ['customers', selectedCustomer?.id, 'profile'],
    queryFn: () => selectedCustomer ? customersApi.getProfileDetails(selectedCustomer.id) : Promise.resolve(null),
    enabled: isViewDialogOpen && !!selectedCustomer?.id,
    staleTime: 15000,
  });

  const profileData = customerProfileQuery.data as CustomerProfileDetails | null;

  const fallbackOrders = React.useMemo(() => {
    if (!selectedCustomer || !orders) return [];
    return orders.filter(order => {
      if (selectedCustomer.id && order.customerId === selectedCustomer.id) return true;
      if (selectedCustomer.phone && order.customerPhone === selectedCustomer.phone) return true;
      if ((selectedCustomer as any).secondaryPhone && order.customerPhone === (selectedCustomer as any).secondaryPhone) return true;
      return false;
    }).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 10);
  }, [selectedCustomer, orders]);

  const customerOrders = (profileData?.recentOrders as CustomerOrderHistoryRecord[] | undefined)?.length
    ? profileData.recentOrders
    : fallbackOrders.map((order: any) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt || null,
        items: Array.isArray(order.items) ? order.items : null,
        rating: order.rating ?? null,
        feedback: order.feedback ?? null,
        feedbackDate: order.feedbackDate ?? null,
        feedbackTime: order.feedbackTime ?? null,
      }));

  const feedbackHistory = (profileData?.feedbackHistory || []) as CustomerFeedbackRecord[];
  const computedCustomerRating = profileData?.customerRating ?? ((selectedCustomer as any)?.customerRating ?? null);
  const rawAverageRating = profileData?.rawAverageRating ?? null;
  const reviewCount = profileData?.reviewCount ?? feedbackHistory.length;
  const positiveReviews = profileData?.positiveReviews ?? feedbackHistory.filter((entry) => entry.aiSentiment === 'positive').length;
  const neutralReviews = profileData?.neutralReviews ?? feedbackHistory.filter((entry) => entry.aiSentiment === 'neutral').length;
  const negativeReviews = profileData?.negativeReviews ?? feedbackHistory.filter((entry) => entry.aiSentiment === 'negative').length;

  return (
    <>
      {/* View Customer Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={onCloseViewDialog}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-4xl max-h-[90dvh] overflow-y-auto">
          {selectedCustomer ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-lg font-semibold text-primary">
                      {selectedCustomer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="text-xl font-semibold">{selectedCustomer.name}</div>
                    <div className="flex flex-col gap-0.5">
                      <div className="text-sm text-muted-foreground flex items-center gap-1.5 leading-none mb-1">
                        <Calendar className="h-3 w-3" />
                        Customer since {customerSince.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long'
                        })}
                      </div>
                      <div className="text-[12px] font-medium text-emerald-600 flex items-center gap-1.5 leading-none">
                        <Clock className="h-3 w-3" />
                        Last visited Neetly: {selectedCustomer.lastOrder ? new Date(selectedCustomer.lastOrder).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'No orders yet'}
                      </div>
                    </div>
                  </div>
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Detailed view of customer information, order history, and analytics
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Customer Info */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                      <p className="text-sm">{selectedCustomer.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                      <p className="text-sm">
                        {selectedCustomer.phone || 'Not provided'}
                        {(selectedCustomer as any).secondaryPhone ? `, ${(selectedCustomer as any).secondaryPhone}` : ''}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                      <p className="text-sm">
                        {formatAddress(parseAddress(selectedCustomer.address))}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="flex flex-col p-4 bg-muted/30 rounded-2xl border border-border/50 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <ShoppingBag className="h-4 w-4 text-blue-500" />
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Orders</span>
                        </div>
                        <div className="text-2xl font-black text-foreground">{totalOrders}</div>
                        <div className="text-[10px] text-muted-foreground mt-1">Total placed</div>
                      </div>

                      <div className="flex flex-col p-4 bg-muted/30 rounded-2xl border border-border/50 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <IndianRupee className="h-4 w-4 text-emerald-500" />
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Spent</span>
                        </div>
                        <div className="text-2xl font-black text-foreground text-emerald-600">
                          ₹{totalSpent.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1">Lifetime revenue</div>
                      </div>

                      <div 
                        className="flex flex-col p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 hover:bg-emerald-500/10 transition-all cursor-pointer group active:scale-[0.98]"
                        onClick={() => setIsRechargeModalOpen(true)}
                        title="Click to recharge wallet"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Wallet</span>
                          </div>
                          <div className="h-6 w-6 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                            <UserPlus className="h-3 w-3" />
                          </div>
                        </div>
                        <div className="text-2xl font-black text-emerald-600">
                          ₹{selectedWalletBalance.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-emerald-500/70 mt-1">Available balance</div>
                      </div>

                      <div className="flex flex-col p-4 bg-muted/30 rounded-2xl border border-border/50 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingDown className="h-4 w-4 text-amber-500" />
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Credit</span>
                        </div>
                        <div className={cn("text-2xl font-black", selectedOutstandingClass)}>
                          ₹{selectedOutstanding.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1 flex items-center justify-between">
                          <span>Outstanding</span>
                          {selectedLimitExceeded && <Badge variant="destructive" className="h-4 text-[8px] px-1 font-bold">OVER</Badge>}
                        </div>
                      </div>

                      <div className="flex flex-col p-4 bg-muted/30 rounded-2xl border border-border/50 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="h-4 w-4 text-amber-500" />
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Limit</span>
                        </div>
                        <div className="text-2xl font-black text-foreground">
                          ₹{selectedCreditLimitAbs.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1">Max credit allowance</div>
                      </div>
                    </div>

                    <div className="flex gap-1.5 pt-1">
                      <Badge variant={totalOrders > 5 ? 'default' : 'secondary'} className="rounded-lg px-2 py-0.5 text-[10px] font-bold">
                        {totalOrders > 5 ? 'LOYAL CUSTOMER' : 'REGULAR CUSTOMER'}
                      </Badge>
                      <Badge variant={totalSpent > 10000 ? 'default' : 'outline'} className="rounded-lg px-2 py-0.5 text-[10px] font-bold border-border/50">
                        {totalSpent > 10000 ? 'HIGH VALUE' : 'STANDARD'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Customer Insights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        Order Frequency
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        {orderFrequency}
                      </div>
                      <p className="text-xs text-muted-foreground">orders/month</p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <IndianRupee className="h-4 w-4 text-green-500" />
                        Average Order Value
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        ₹{totalOrders > 0 ? Math.round(totalSpent / totalOrders).toLocaleString('en-IN') : '0'}
                      </div>
                      <p className="text-xs text-muted-foreground">per order</p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Star className="h-4 w-4 text-purple-500" />
                        Customer Rating
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600">
                        {formatRating(computedCustomerRating)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {reviewCount > 0
                          ? `${reviewCount} feedback entr${reviewCount === 1 ? 'y' : 'ies'} | raw avg ${formatRating(rawAverageRating)}`
                          : 'No customer feedback yet'}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {(reviewCount > 0 || customerProfileQuery.isLoading) && (
                  <>
                    <Separator />

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                      <Card className="border-l-4 border-l-emerald-500">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">Positive</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-emerald-600">{positiveReviews}</div>
                          <p className="text-xs text-muted-foreground">AI-positive reviews</p>
                        </CardContent>
                      </Card>
                      <Card className="border-l-4 border-l-slate-500">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">Neutral</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-slate-600">{neutralReviews}</div>
                          <p className="text-xs text-muted-foreground">Needs no escalation</p>
                        </CardContent>
                      </Card>
                      <Card className="border-l-4 border-l-rose-500">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">Negative</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-rose-600">{negativeReviews}</div>
                          <p className="text-xs text-muted-foreground">Needs attention</p>
                        </CardContent>
                      </Card>
                      <Card className="border-l-4 border-l-amber-500">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">Review Coverage</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-amber-600">
                            {customerOrders.length > 0 ? `${Math.round((reviewCount / customerOrders.length) * 100)}%` : '0%'}
                          </div>
                          <p className="text-xs text-muted-foreground">orders with rating</p>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                )}

                <Separator />

                {/* Recent Orders */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
                  <div className="overflow-x-auto">
                    <Table className="min-w-[980px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order #</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Services</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Rating</TableHead>
                          <TableHead>Feedback</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customerOrders.length > 0 ? (
                          customerOrders.map((order) => {
                            const serviceNames = Array.isArray(order.items)
                              ? (order.items as any[]).map(item => item.productName || item.serviceName || 'Service').slice(0, 2)
                              : ['Services'];

                            return (
                              <TableRow key={order.id}>
                                <TableCell className="font-medium">{order.orderNumber}</TableCell>
                                <TableCell>
                                  <Badge className={getStatusColor(order.status)}>
                                    {order.status ? order.status.replace('_', ' ') : 'Unknown'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {serviceNames.map((service, i) => (
                                      <Badge key={i} variant="outline" className="text-xs">
                                        {service}
                                      </Badge>
                                    ))}
                                    {Array.isArray(order.items) && (order.items as any[]).length > 2 && (
                                      <Badge variant="outline" className="text-xs">+{(order.items as any[]).length - 2}</Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium">{formatCurrency(Number(order.totalAmount || 0))}</TableCell>
                                <TableCell>
                                  {order.rating ? (
                                    <div className="flex items-center gap-1 font-medium text-amber-600">
                                      <Star className="h-3.5 w-3.5 fill-current" />
                                      {Number(order.rating).toFixed(1)}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">No rating</span>
                                  )}
                                </TableCell>
                                <TableCell className="max-w-[260px]">
                                  <div className="text-sm text-muted-foreground line-clamp-2">
                                    {order.feedback || 'No written feedback'}
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {formatDate(order.createdAt ? new Date(order.createdAt).toISOString() : '')}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                              No orders found for this customer.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-4">Customer Feedback</h3>
                  {customerProfileQuery.isLoading ? (
                    <div className="text-sm text-muted-foreground">Loading feedback history...</div>
                  ) : feedbackHistory.length > 0 ? (
                    <div className="space-y-3">
                      {feedbackHistory.map((entry) => (
                        <Card key={entry.id} className="border border-border/60">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold">{entry.orderNumber || 'Order feedback'}</span>
                                  <Badge variant="outline">{entry.feedbackStatus || 'recorded'}</Badge>
                                  {entry.aiSentiment && (
                                    <Badge variant={entry.aiSentiment === 'positive' ? 'default' : entry.aiSentiment === 'negative' ? 'destructive' : 'secondary'}>
                                      {entry.aiSentiment}
                                    </Badge>
                                  )}
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                  {formatFeedbackTimestamp(entry.feedbackDate, entry.feedbackTime, entry.createdAt)}
                                </div>
                              </div>

                              <div className="flex items-center gap-1 text-amber-600 font-semibold">
                                <Star className="h-4 w-4 fill-current" />
                                {entry.rating.toFixed(1)}
                              </div>
                            </div>

                            <p className="text-sm leading-6 text-foreground/90">
                              {entry.feedback || 'Customer submitted a rating without written feedback.'}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No customer feedback found yet.</div>
                  )}
                </div>

                <Separator />

                {/* Customer Ledger */}
                <div>
                  <CustomerWalletHistory customerId={selectedCustomer.id} />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={onCloseViewDialog}>
                  Close
                </Button>
              </DialogFooter>
            </motion.div>) : null}
        </DialogContent>
      </Dialog>

      {/* Wallet Recharge Modal (Overlays the View Dialog) */}
      {selectedCustomer && (
        <WalletRechargeModal
          isOpen={isRechargeModalOpen}
          onClose={() => setIsRechargeModalOpen(false)}
          customerId={selectedCustomer.id}
          customerName={selectedCustomer.name}
          onRechargeSuccess={() => {
            // Trigger partial refresh or just let websockets handle it
            setIsRechargeModalOpen(false);
          }}
        />
      )}

      {/* Edit Customer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={onCloseEditDialog}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-3xl max-h-[90dvh] overflow-y-auto p-4 sm:p-6">
          {selectedCustomer ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <DialogHeader>
                <DialogTitle>Edit Customer</DialogTitle>
                <DialogDescription>
                  Update customer information below.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input
                    id="edit-name"
                    {...editForm.register('name')}
                    onKeyDown={(e) => navigateOnEnter(e, { next: document.getElementById('edit-phone') as HTMLElement | null })}
                    className={cn(
                      editForm.formState.errors.name && 'border-red-500'
                    )}
                  />
                  {editForm.formState.errors.name && (
                    <p className="text-sm text-red-500">
                      {editForm.formState.errors.name.message}
                    </p>
                  )}
                </div>



                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone *</Label>
                  <Input
                    id="edit-phone"
                    type="tel"
                    {...editForm.register('phone')}
                    onKeyDown={(e) => navigateOnEnter(e, { next: document.getElementById('edit-secondary-phone') as HTMLElement | null })}
                    className={cn(
                      editForm.formState.errors.phone && 'border-red-500'
                    )}
                  />
                  {editForm.formState.errors.phone && (
                    <p className="text-sm text-red-500">
                      {editForm.formState.errors.phone.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-secondary-phone">Secondary Phone</Label>
                  <Input
                    id="edit-secondary-phone"
                    type="tel"
                    {...editForm.register('secondaryPhone')}
                    onKeyDown={(e) => navigateOnEnter(e, { next: document.getElementById('edit-street') as HTMLElement | null })}
                  />
                  {editForm.formState.errors.secondaryPhone && (
                    <p className="text-sm text-red-500">
                      {editForm.formState.errors.secondaryPhone.message}
                    </p>
                  )}
                </div>

                {/* Address Fields - Collected Separately */}
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-semibold text-sm text-muted-foreground">Address</h4>

                  <div className="space-y-2">
                    <Label htmlFor="edit-street">Street Address *</Label>
                    <Input
                      id="edit-street"
                      {...editForm.register('addressStreet')}
                      placeholder="e.g., 1/85 Zamin Kottampatty"
                      onKeyDown={(e) => navigateOnEnter(e, { next: document.getElementById('edit-city') as HTMLElement | null })}
                      className={cn(
                        editForm.formState.errors.addressStreet && 'border-red-500'
                      )}
                    />
                    {editForm.formState.errors.addressStreet && (
                      <p className="text-sm text-red-500">
                        {editForm.formState.errors.addressStreet.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit-city">City</Label>
                      <Input
                        id="edit-city"
                        {...editForm.register('addressCity')}
                        placeholder="e.g., Pollachi"
                        onKeyDown={(e) => navigateOnEnter(e, { next: document.getElementById('edit-pincode') as HTMLElement | null })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-pincode">Pincode</Label>
                      <Input
                        id="edit-pincode"
                        {...editForm.register('addressPincode')}
                        placeholder="e.g., 642123"
                        maxLength={6}
                        onKeyDown={(e) => navigateOnEnter(e, { next: document.getElementById('edit-email') as HTMLElement | null })}
                        className={cn(
                          editForm.formState.errors.addressPincode && 'border-red-500'
                        )}
                      />
                      {editForm.formState.errors.addressPincode && (
                        <p className="text-sm text-red-500">
                          {editForm.formState.errors.addressPincode.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    State: Tamil Nadu, Country: India (default)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    {...editForm.register('email')}
                    onKeyDown={(e) => navigateOnEnter(e, { next: document.getElementById('edit-credit-limit') as HTMLElement | null })}
                    className={cn(
                      editForm.formState.errors.email && 'border-red-500'
                    )}
                  />
                  {editForm.formState.errors.email && (
                    <p className="text-sm text-red-500">
                      {editForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    {...editForm.register('notes')}
                    placeholder="Add any notes about this customer"
                    className={cn(
                      editForm.formState.errors.notes && 'border-red-500'
                    )}
                  />
                  {editForm.formState.errors.notes && (
                    <p className="text-sm text-red-500">
                      {editForm.formState.errors.notes.message}
                    </p>
                  )}
                </div>

                {/* Business Information */}
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-semibold text-sm text-muted-foreground">Business Information (Optional)</h4>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit-company">Company Name</Label>
                      <Input
                        id="edit-company"
                        {...editForm.register('companyName')}
                        placeholder="Company name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-tax">Tax ID / GST</Label>
                      <Input
                        id="edit-tax"
                        {...editForm.register('taxId')}
                        placeholder="Tax identification number"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit-dob">Date of Birth</Label>
                      <Input
                        id="edit-dob"
                        type="date"
                        {...editForm.register('dateOfBirth')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-payment-terms">Payment Terms</Label>
                      <select
                        id="edit-payment-terms"
                        {...editForm.register('paymentTerms')}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Select payment terms</option>
                        <option value="cash">Cash Only</option>
                        <option value="net15">Net 15 Days</option>
                        <option value="net30">Net 30 Days</option>
                        <option value="net60">Net 60 Days</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Credit Management */}
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-semibold text-sm text-muted-foreground">Credit Management</h4>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit-credit-limit">Credit Limit (₹)</Label>
                      <Input
                        id="edit-credit-limit"
                        type="number"
                        {...editForm.register('creditLimit')}
                        placeholder="0"
                        onKeyDown={(e) => navigateOnEnter(e, { next: editSubmitButtonRef.current, selectText: false })}
                      />
                      <p className="text-xs text-muted-foreground">Maximum credit allowed for this customer</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-credit-balance">Current Credit Balance (₹)</Label>
                      <Input
                        id="edit-credit-balance"
                        type="number"
                        value={selectedCustomer?.creditBalance || '0'}
                        placeholder="0"
                        readOnly
                        className={cn(
                          "bg-muted",
                          selectedLimitExceeded ? "border-red-500 text-red-500" : selectedOutstanding === 0 ? "border-emerald-500 text-emerald-500" : "border-amber-500 text-amber-500",
                        )}
                      />
                      <p className={cn("text-xs", selectedLimitExceeded ? "text-red-500" : "text-muted-foreground")}>
                        {selectedLimitExceeded
                          ? `Current outstanding credit exceeds limit by ₹${(selectedOutstanding - selectedCreditLimitAbs).toFixed(2)}`
                          : "Current outstanding credit amount"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Management */}
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-semibold text-sm text-muted-foreground">Account Status</h4>

                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-1">
                      <Label htmlFor="edit-status" className="text-base font-medium">
                        Customer Status
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Inactive customers cannot place new orders
                      </p>
                    </div>
                    <select
                      id="edit-status"
                      {...editForm.register('status')}
                      className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium"
                    >
                      <option value="active">✅ Active</option>
                      <option value="inactive">⛔ Inactive</option>
                    </select>
                  </div>
                </div>

                <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between w-full">
                  {onDeleteCustomer && selectedCustomer && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        onDeleteCustomer(selectedCustomer.id);
                      }}
                      disabled={isUpdating}
                      title="Delete Customer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <div className="flex gap-2 ml-auto">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onCloseEditDialog}
                      disabled={isUpdating}
                    >
                      Cancel
                    </Button>
                    <Button ref={editSubmitButtonRef} type="submit" disabled={isUpdating}>
                      {isUpdating ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </DialogFooter>
              </form>
            </motion.div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Create Customer Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={onCloseCreateDialog}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-3xl max-h-[90dvh] overflow-y-auto p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>
                Enter customer information below. They will receive a welcome email with special offers.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Name *</Label>
                <Input
                  id="create-name"
                  {...createForm.register('name')}
                  placeholder="Enter customer name"
                  onKeyDown={(e) => navigateOnEnter(e, { next: document.getElementById('create-phone') as HTMLElement | null })}
                  className={cn(
                    createForm.formState.errors.name && 'border-red-500'
                  )}
                />
                {createForm.formState.errors.name && (
                  <p className="text-sm text-red-500">
                    {createForm.formState.errors.name.message}
                  </p>
                )}
              </div>



              <div className="space-y-2">
                <Label htmlFor="create-phone">Phone *</Label>
                <Input
                  id="create-phone"
                  type="tel"
                  {...createForm.register('phone')}
                  placeholder="Enter phone number"
                  onKeyDown={(e) => navigateOnEnter(e, { next: document.getElementById('create-secondary-phone') as HTMLElement | null })}
                  className={cn(
                    createForm.formState.errors.phone && 'border-red-500'
                  )}
                />
                {createForm.formState.errors.phone && (
                  <p className="text-sm text-red-500">
                    {createForm.formState.errors.phone.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-secondary-phone">Secondary Phone</Label>
                <Input
                  id="create-secondary-phone"
                  type="tel"
                  {...createForm.register('secondaryPhone')}
                  placeholder="Optional secondary phone"
                  onKeyDown={(e) => navigateOnEnter(e, { next: document.getElementById('create-street') as HTMLElement | null })}
                />
                {createForm.formState.errors.secondaryPhone && (
                  <p className="text-sm text-red-500">
                    {createForm.formState.errors.secondaryPhone.message}
                  </p>
                )}
              </div>

              {/* Address Fields - Collected Separately */}
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-semibold text-sm text-muted-foreground">Address</h4>

                <div className="space-y-2">
                  <Label htmlFor="create-street">Street Address *</Label>
                  <Input
                    id="create-street"
                    {...createForm.register('addressStreet')}
                    placeholder="e.g., 1/85 Zamin Kottampatty"
                    onKeyDown={(e) => navigateOnEnter(e, { next: document.getElementById('create-city') as HTMLElement | null })}
                    className={cn(
                      createForm.formState.errors.addressStreet && 'border-red-500'
                    )}
                  />
                  {createForm.formState.errors.addressStreet && (
                    <p className="text-sm text-red-500">
                      {createForm.formState.errors.addressStreet.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="create-city">City</Label>
                    <Input
                      id="create-city"
                      {...createForm.register('addressCity')}
                      placeholder="e.g., Pollachi"
                      onKeyDown={(e) => navigateOnEnter(e, { next: document.getElementById('create-pincode') as HTMLElement | null })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-pincode">Pincode</Label>
                    <Input
                      id="create-pincode"
                      {...createForm.register('addressPincode')}
                      placeholder="e.g., 642123"
                      maxLength={6}
                      onKeyDown={(e) => navigateOnEnter(e, { next: document.getElementById('create-credit-limit') as HTMLElement | null })}
                      className={cn(
                        createForm.formState.errors.addressPincode && 'border-red-500'
                      )}
                    />
                    {createForm.formState.errors.addressPincode && (
                      <p className="text-sm text-red-500">
                        {createForm.formState.errors.addressPincode.message}
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  State: Tamil Nadu, Country: India (default)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-credit-limit">Credit Limit (₹)</Label>
                <Input
                  id="create-credit-limit"
                  type="number"
                  {...createForm.register('creditLimit')}
                  placeholder="1000"
                  onKeyDown={(e) => navigateOnEnter(e, { next: document.getElementById('create-email') as HTMLElement | null })}
                />
                <p className="text-xs text-muted-foreground">
                  Set the maximum unpaid amount allowed before staff are asked to collect payment.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-email">Email</Label>
                <Input
                  id="create-email"
                  type="email"
                  {...createForm.register('email')}
                  placeholder="Enter email address"
                  onKeyDown={(e) => navigateOnEnter(e, { next: createSubmitButtonRef.current, selectText: false })}
                  className={cn(
                    createForm.formState.errors.email && 'border-red-500'
                  )}
                />
                {createForm.formState.errors.email && (
                  <p className="text-sm text-red-500">
                    {createForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-notes">Notes</Label>
                <Textarea
                  id="create-notes"
                  {...createForm.register('notes')}
                  placeholder="Add any notes about this customer"
                  className={cn(
                    createForm.formState.errors.notes && 'border-red-500'
                  )}
                />
                {createForm.formState.errors.notes && (
                  <p className="text-sm text-red-500">
                    {createForm.formState.errors.notes.message}
                  </p>
                )}
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Welcome Package:</strong> New customers will receive a welcome email with
                  special offers and service information.
                </p>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCloseCreateDialog}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button ref={createSubmitButtonRef} type="submit" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Customer'}
                </Button>
              </DialogFooter>
            </form>
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  );
});

export { CustomerDialogs };
export default CustomerDialogs;
