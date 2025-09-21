import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Truck, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Star,
  Navigation,
  Fuel,
  Gauge,
  User,
  Car
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  licenseNumber: string;
  vehicleNumber: string;
  vehicleType: 'bike' | 'car' | 'truck' | 'van';
  vehicleModel: string;
  status: 'available' | 'busy' | 'offline' | 'on_break';
  rating: number;
  totalDeliveries: number;
  totalEarnings: number;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  lastActive: string;
  experience: number; // in months
  specialties: string[];
}

interface DriverManagementProps {
  onDriverSelect?: (driver: Driver) => void;
  onDriverAssign?: (driverId: string, orderId: string) => void;
  selectedOrderId?: string;
}

export const DriverManagement: React.FC<DriverManagementProps> = ({
  onDriverSelect,
  onDriverAssign,
  selectedOrderId
}) => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Form state for new/edit driver
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    licenseNumber: '',
    vehicleNumber: '',
    vehicleType: 'bike' as Driver['vehicleType'],
    vehicleModel: '',
    experience: 0,
    specialties: [] as string[]
  });

  // Mock data for demo
  const mockDrivers: Driver[] = [
    {
      id: '1',
      name: 'Rajesh Kumar',
      phone: '+91 98765 43210',
      email: 'rajesh@fabzclean.com',
      licenseNumber: 'DL01-2023-1234567',
      vehicleNumber: 'DL-01-AB-1234',
      vehicleType: 'bike',
      vehicleModel: 'Honda Activa 6G',
      status: 'available',
      rating: 4.8,
      totalDeliveries: 156,
      totalEarnings: 45200,
      currentLocation: {
        latitude: 28.6139,
        longitude: 77.2090
      },
      lastActive: new Date().toISOString(),
      experience: 18,
      specialties: ['Dry Cleaning', 'Ironing']
    },
    {
      id: '2',
      name: 'Priya Sharma',
      phone: '+91 98765 43211',
      email: 'priya@fabzclean.com',
      licenseNumber: 'DL01-2023-1234568',
      vehicleNumber: 'DL-01-CD-5678',
      vehicleType: 'car',
      vehicleModel: 'Maruti Swift',
      status: 'busy',
      rating: 4.9,
      totalDeliveries: 203,
      totalEarnings: 67800,
      currentLocation: {
        latitude: 28.6140,
        longitude: 77.2091
      },
      lastActive: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      experience: 24,
      specialties: ['Premium Dry Cleaning', 'Wedding Dresses']
    },
    {
      id: '3',
      name: 'Amit Singh',
      phone: '+91 98765 43212',
      email: 'amit@fabzclean.com',
      licenseNumber: 'DL01-2023-1234569',
      vehicleNumber: 'DL-01-EF-9012',
      vehicleType: 'truck',
      vehicleModel: 'Tata Ace',
      status: 'available',
      rating: 4.6,
      totalDeliveries: 89,
      totalEarnings: 32100,
      currentLocation: {
        latitude: 28.6138,
        longitude: 77.2089
      },
      lastActive: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      experience: 12,
      specialties: ['Bulk Orders', 'Corporate Pickup']
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setDrivers(mockDrivers);
      setIsLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: Driver['status']) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      case 'on_break': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: Driver['status']) => {
    switch (status) {
      case 'available': return 'Available';
      case 'busy': return 'Busy';
      case 'offline': return 'Offline';
      case 'on_break': return 'On Break';
      default: return 'Unknown';
    }
  };

  const getVehicleIcon = (type: Driver['vehicleType']) => {
    switch (type) {
      case 'bike': return '🏍️';
      case 'car': return '🚗';
      case 'truck': return '🚚';
      case 'van': return '🚐';
      default: return '🚗';
    }
  };

  const handleAddDriver = () => {
    setEditingDriver(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      licenseNumber: '',
      vehicleNumber: '',
      vehicleType: 'bike',
      vehicleModel: '',
      experience: 0,
      specialties: []
    });
    setIsDialogOpen(true);
  };

  const handleEditDriver = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name,
      phone: driver.phone,
      email: driver.email,
      licenseNumber: driver.licenseNumber,
      vehicleNumber: driver.vehicleNumber,
      vehicleType: driver.vehicleType,
      vehicleModel: driver.vehicleModel,
      experience: driver.experience,
      specialties: driver.specialties
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (editingDriver) {
        // Update existing driver
        setDrivers(prev => prev.map(driver => 
          driver.id === editingDriver.id 
            ? { ...driver, ...formData }
            : driver
        ));
        toast({
          title: "Driver Updated",
          description: `${formData.name} has been updated successfully.`,
        });
      } else {
        // Add new driver
        const newDriver: Driver = {
          id: Date.now().toString(),
          ...formData,
          status: 'available',
          rating: 5.0,
          totalDeliveries: 0,
          totalEarnings: 0,
          lastActive: new Date().toISOString()
        };
        setDrivers(prev => [...prev, newDriver]);
        toast({
          title: "Driver Added",
          description: `${formData.name} has been added successfully.`,
        });
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save driver information.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDriver = (driverId: string) => {
    setDrivers(prev => prev.filter(driver => driver.id !== driverId));
    toast({
      title: "Driver Removed",
      description: "Driver has been removed successfully.",
    });
  };

  const handleAssignDriver = (driverId: string) => {
    if (selectedOrderId && onDriverAssign) {
      onDriverAssign(driverId, selectedOrderId);
      toast({
        title: "Driver Assigned",
        description: "Driver has been assigned to the order successfully.",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Driver Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading drivers...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Driver Management ({drivers.length})
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddDriver}>
                <Plus className="h-4 w-4 mr-2" />
                Add Driver
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingDriver ? 'Edit Driver' : 'Add New Driver'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter driver's full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="driver@fabzclean.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">License Number *</Label>
                    <Input
                      id="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                      placeholder="DL01-2023-1234567"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicleNumber">Vehicle Number *</Label>
                    <Input
                      id="vehicleNumber"
                      value={formData.vehicleNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, vehicleNumber: e.target.value }))}
                      placeholder="DL-01-AB-1234"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleType">Vehicle Type *</Label>
                    <Select 
                      value={formData.vehicleType} 
                      onValueChange={(value: Driver['vehicleType']) => 
                        setFormData(prev => ({ ...prev, vehicleType: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bike">Bike 🏍️</SelectItem>
                        <SelectItem value="car">Car 🚗</SelectItem>
                        <SelectItem value="truck">Truck 🚚</SelectItem>
                        <SelectItem value="van">Van 🚐</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicleModel">Vehicle Model</Label>
                    <Input
                      id="vehicleModel"
                      value={formData.vehicleModel}
                      onChange={(e) => setFormData(prev => ({ ...prev, vehicleModel: e.target.value }))}
                      placeholder="Honda Activa 6G"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experience">Experience (months)</Label>
                    <Input
                      id="experience"
                      type="number"
                      value={formData.experience}
                      onChange={(e) => setFormData(prev => ({ ...prev, experience: parseInt(e.target.value) || 0 }))}
                      placeholder="12"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : editingDriver ? 'Update Driver' : 'Add Driver'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {drivers.map((driver) => (
            <Card key={driver.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-2xl">
                    {getVehicleIcon(driver.vehicleType)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{driver.name}</h3>
                      <Badge className={`${getStatusColor(driver.status)} text-white`}>
                        {getStatusText(driver.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span>{driver.phone}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Car className="h-3 w-3" />
                        <span>{driver.vehicleNumber}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        <span>{driver.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {selectedOrderId && driver.status === 'available' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleAssignDriver(driver.id)}
                    >
                      Assign to Order
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onDriverSelect?.(driver)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View Details
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleEditDriver(driver)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDeleteDriver(driver.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="mt-3 grid grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Navigation className="h-3 w-3" />
                  <span>{driver.totalDeliveries} deliveries</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{driver.experience} months exp</span>
                </div>
                <div className="flex items-center gap-1">
                  <Fuel className="h-3 w-3" />
                  <span>₹{driver.totalEarnings.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{driver.specialties.join(', ')}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
