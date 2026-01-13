import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  Package,
  Plus,
  Minus,
  ShoppingCart,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Info,
  Star,
  Gift,
  Zap,
  Shield,
  Truck,
  User,
  Phone,
  Mail,
  Search,
  Filter,
  X,
  ChevronRight,
  ChevronDown,
  Calendar as CalendarIcon,
  Timer,
  DollarSign,
  Tag,
  Award
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
// import type { Customer } from '@shared/schema';

// Temporary type definition
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

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  duration: string;
  icon: string;
  popular?: boolean;
  discount?: number;
  loyaltyPoints?: number;
}

interface BookingFormData {
  services: ServiceItem[];
  pickupDate: string;
  deliveryDate: string;
  specialInstructions: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
  };
  paymentMethod: string;
  loyaltyPointsUsed: number;
}

interface CustomerServiceBookingProps {
  customer: Customer;
}

export default function CustomerServiceBooking({ customer }: CustomerServiceBookingProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedServices, setSelectedServices] = useState<ServiceItem[]>([]);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState<BookingFormData>({
    services: [],
    pickupDate: '',
    deliveryDate: '',
    specialInstructions: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      phone: customer.phone || ''
    },
    paymentMethod: 'credit',
    loyaltyPointsUsed: 0
  });
  const { toast } = useToast();

  // Mock services data
  const services: ServiceItem[] = [
    {
      id: 'dry-cleaning',
      name: 'Dry Cleaning',
      description: 'Professional dry cleaning for suits, coats, and delicate fabrics',
      category: 'Cleaning',
      price: 400,
      duration: '2-3 days',
      icon: '🧥',
      popular: true,
      loyaltyPoints: 50
    },
    {
      id: 'laundry',
      name: 'Laundry Service',
      description: 'Wash, dry, and fold your regular clothing items',
      category: 'Cleaning',
      price: 150,
      duration: '1-2 days',
      icon: '👕',
      popular: true,
      loyaltyPoints: 20
    },
    {
      id: 'ironing',
      name: 'Ironing Service',
      description: 'Professional pressing and ironing of clothes',
      category: 'Finishing',
      price: 200,
      duration: 'Same day',
      icon: '👔',
      loyaltyPoints: 25
    },
    {
      id: 'alterations',
      name: 'Alterations',
      description: 'Hemming, resizing, and garment adjustments',
      category: 'Repair',
      price: 300,
      duration: '3-5 days',
      icon: '✂️',
      loyaltyPoints: 40
    },
    {
      id: 'shoe-repair',
      name: 'Shoe Repair',
      description: 'Sole replacement, heel repair, and shoe maintenance',
      category: 'Repair',
      price: 500,
      duration: '5-7 days',
      icon: '👞',
      loyaltyPoints: 60
    },
    {
      id: 'leather-cleaning',
      name: 'Leather Cleaning',
      description: 'Specialized cleaning and conditioning for leather items',
      category: 'Cleaning',
      price: 600,
      duration: '3-4 days',
      icon: '👜',
      loyaltyPoints: 75
    },
    {
      id: 'curtain-cleaning',
      name: 'Curtain Cleaning',
      description: 'Professional cleaning for curtains and drapes',
      category: 'Home',
      price: 800,
      duration: '4-6 days',
      icon: '🏠',
      loyaltyPoints: 100
    },
    {
      id: 'rug-cleaning',
      name: 'Rug Cleaning',
      description: 'Deep cleaning and restoration for rugs and carpets',
      category: 'Home',
      price: 1200,
      duration: '5-7 days',
      icon: '🪞',
      loyaltyPoints: 150
    }
  ];

  // Filter services
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.category.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (categoryFilter === 'all') return true;
      return service.category.toLowerCase() === categoryFilter.toLowerCase();
    });
  }, [searchQuery, categoryFilter]);

  // Get categories
  const categories = useMemo(() => {
    const cats = ['all', ...Array.from(new Set(services.map(s => s.category)))];
    return cats;
  }, []);

  // Calculate total price
  const totalPrice = useMemo(() => {
    return selectedServices.reduce((total, service) => total + service.price, 0);
  }, [selectedServices]);

  // Calculate loyalty points earned
  const loyaltyPointsEarned = useMemo(() => {
    return selectedServices.reduce((total, service) => total + (service.loyaltyPoints || 0), 0);
  }, [selectedServices]);

  // Calculate discount from loyalty points
  const loyaltyDiscount = useMemo(() => {
    return Math.min(bookingForm.loyaltyPointsUsed * 0.1, totalPrice * 0.2); // 10 points = ₹1, max 20% discount
  }, [bookingForm.loyaltyPointsUsed, totalPrice]);

  // Final price after discount
  const finalPrice = useMemo(() => {
    return Math.max(0, totalPrice - loyaltyDiscount);
  }, [totalPrice, loyaltyDiscount]);

  // Handle service selection
  const handleServiceToggle = (service: ServiceItem) => {
    setSelectedServices(prev => {
      const isSelected = prev.find(s => s.id === service.id);
      if (isSelected) {
        return prev.filter(s => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
  };

  // Handle quantity change
  const handleQuantityChange = (serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      setSelectedServices(prev => prev.filter(s => s.id !== serviceId));
      return;
    }

    setSelectedServices(prev => {
      const service = services.find(s => s.id === serviceId);
      if (!service) return prev;

      const existingService = prev.find(s => s.id === serviceId);
      if (existingService) {
        return prev.map(s => s.id === serviceId ? { ...s, quantity } : s);
      } else {
        return [...prev, { ...service, quantity }];
      }
    });
  };

  // Handle booking form changes
  const handleBookingFormChange = (field: string, value: any) => {
    setBookingForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle address change
  const handleAddressChange = (field: string, value: string) => {
    setBookingForm(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };

  // Handle booking submission
  const handleBookingSubmit = () => {
    if (selectedServices.length === 0) {
      toast({
        title: "No Services Selected",
        description: "Please select at least one service to continue.",
        variant: "destructive"
      });
      return;
    }

    if (!bookingForm.pickupDate || !bookingForm.deliveryDate) {
      toast({
        title: "Missing Dates",
        description: "Please select pickup and delivery dates.",
        variant: "destructive"
      });
      return;
    }

    // Simulate booking submission
    toast({
      title: "Booking Confirmed!",
      description: `Your order has been placed successfully. Total: ₹${finalPrice.toFixed(2)}`,
    });

    // Reset form
    setSelectedServices([]);
    setBookingForm({
      services: [],
      pickupDate: '',
      deliveryDate: '',
      specialInstructions: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        phone: customer.phone || ''
      },
      paymentMethod: 'credit',
      loyaltyPointsUsed: 0
    });
    setIsBookingDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Book a Service</h2>
          <p className="text-gray-600">Choose from our range of professional cleaning and repair services</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Gift className="h-3 w-3" />
            {(customer as any).loyaltyPoints || 0} Points
          </Badge>
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Services Grid */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredServices.map((service, index) => {
                const isSelected = selectedServices.find(s => s.id === service.id);
                const quantity = isSelected ? (isSelected as any).quantity || 1 : 0;

                return (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    layout
                  >
                    <Card className={`hover:shadow-lg transition-all duration-300 cursor-pointer ${
                      isSelected ? 'ring-2 ring-primary' : ''
                    }`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{service.icon}</div>
                            <div>
                              <CardTitle className="text-lg">{service.name}</CardTitle>
                              <CardDescription className="text-sm">
                                {service.category}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {service.popular && (
                              <Badge variant="secondary" className="text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                Popular
                              </Badge>
                            )}
                            {service.discount && (
                              <Badge variant="destructive" className="text-xs">
                                -{service.discount}%
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          {service.description}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <span className="font-semibold">₹{service.price}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Timer className="h-4 w-4 text-blue-600" />
                              <span>{service.duration}</span>
                            </div>
                          </div>
                          {service.loyaltyPoints && (
                            <div className="flex items-center gap-1 text-xs text-purple-600">
                              <Gift className="h-3 w-3" />
                              <span>{service.loyaltyPoints} pts</span>
                            </div>
                          )}
                        </div>

                        {/* Quantity Controls */}
                        {isSelected ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuantityChange(service.id, quantity - 1)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center font-medium">{quantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuantityChange(service.id, quantity + 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleServiceToggle(service)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <Button
                            className="w-full"
                            onClick={() => handleServiceToggle(service)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add to Cart
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Cart Summary */}
        <div className="space-y-6">
          {/* Selected Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Selected Services
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedServices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No services selected</p>
                  <p className="text-sm">Choose services to add to your cart</p>
                </div>
              ) : (
                <>
                  {selectedServices.map((service, index) => (
                    <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-lg">{service.icon}</div>
                        <div>
                          <div className="font-medium text-sm">{service.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {(service as any).quantity || 1}x • {service.duration}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">₹{service.price * ((service as any).quantity || 1)}</div>
                        {service.loyaltyPoints && (
                          <div className="text-xs text-purple-600">
                            +{(service.loyaltyPoints * ((service as any).quantity || 1))} pts
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span>Subtotal:</span>
                      <span>₹{totalPrice.toFixed(2)}</span>
                    </div>
                    {loyaltyDiscount > 0 && (
                      <div className="flex items-center justify-between text-green-600">
                        <span>Loyalty Discount:</span>
                        <span>-₹{loyaltyDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between font-semibold text-lg">
                      <span>Total:</span>
                      <span>₹{finalPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => setIsBookingDialogOpen(true)}
                    disabled={selectedServices.length === 0}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Proceed to Booking
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Loyalty Points */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Loyalty Points
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Available Points:</span>
                <span className="font-semibold">{(customer as any).loyaltyPoints || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Points to Earn:</span>
                <span className="font-semibold text-green-600">+{loyaltyPointsEarned}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Use 100 points to get ₹10 discount (max 20% of order value)
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Member Benefits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Free pickup & delivery
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Priority processing
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Earn loyalty points
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                24/7 customer support
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Your Booking</DialogTitle>
            <DialogDescription>
              Provide your details to complete the service booking
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Selected Services Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Selected Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedServices.map((service, index) => (
                    <div key={service.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{service.icon}</span>
                        <span>{service.name}</span>
                        <span className="text-sm text-muted-foreground">
                          ({(service as any).quantity || 1}x)
                        </span>
                      </div>
                      <span>₹{service.price * ((service as any).quantity || 1)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between font-semibold pt-2 border-t">
                    <span>Total:</span>
                    <span>₹{finalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pickup & Delivery Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickupDate">Pickup Date</Label>
                <Input
                  id="pickupDate"
                  type="date"
                  value={bookingForm.pickupDate}
                  onChange={(e) => handleBookingFormChange('pickupDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryDate">Delivery Date</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={bookingForm.deliveryDate}
                  onChange={(e) => handleBookingFormChange('deliveryDate', e.target.value)}
                  min={bookingForm.pickupDate || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Delivery Address */}
            <div className="space-y-4">
              <h3 className="font-semibold">Delivery Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    value={bookingForm.address.street}
                    onChange={(e) => handleAddressChange('street', e.target.value)}
                    placeholder="Enter street address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={bookingForm.address.city}
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                    placeholder="Enter city"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={bookingForm.address.state}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                    placeholder="Enter state"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    value={bookingForm.address.zipCode}
                    onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                    placeholder="Enter ZIP code"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={bookingForm.address.phone}
                    onChange={(e) => handleAddressChange('phone', e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
            </div>

            {/* Special Instructions */}
            <div className="space-y-2">
              <Label htmlFor="instructions">Special Instructions</Label>
              <Textarea
                id="instructions"
                value={bookingForm.specialInstructions}
                onChange={(e) => handleBookingFormChange('specialInstructions', e.target.value)}
                placeholder="Any special instructions or requests..."
                rows={3}
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={bookingForm.paymentMethod} onValueChange={(value) => handleBookingFormChange('paymentMethod', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Credit Card</SelectItem>
                  <SelectItem value="debit">Debit Card</SelectItem>
                  <SelectItem value="cash">Cash on Delivery</SelectItem>
                  <SelectItem value="mobile">Mobile Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Loyalty Points */}
            <div className="space-y-2">
              <Label>Use Loyalty Points (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max={Math.min((customer as any).loyaltyPoints || 0, Math.floor(finalPrice * 2))}
                  value={bookingForm.loyaltyPointsUsed}
                  onChange={(e) => handleBookingFormChange('loyaltyPointsUsed', parseInt(e.target.value) || 0)}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground">
                  Max: {Math.min((customer as any).loyaltyPoints || 0, Math.floor(finalPrice * 2))}
                </span>
              </div>
              {loyaltyDiscount > 0 && (
                <p className="text-sm text-green-600">
                  You'll save ₹{loyaltyDiscount.toFixed(2)} with these points
                </p>
              )}
            </div>

            {/* Final Total */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Subtotal:</span>
                    <span>₹{totalPrice.toFixed(2)}</span>
                  </div>
                  {loyaltyDiscount > 0 && (
                    <div className="flex items-center justify-between text-green-600">
                      <span>Loyalty Discount:</span>
                      <span>-₹{loyaltyDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between font-semibold text-lg pt-2 border-t">
                    <span>Total Amount:</span>
                    <span>₹{finalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button
              className="w-full"
              onClick={handleBookingSubmit}
              disabled={selectedServices.length === 0 || !bookingForm.pickupDate || !bookingForm.deliveryDate}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Confirm Booking - ₹{finalPrice.toFixed(2)}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
