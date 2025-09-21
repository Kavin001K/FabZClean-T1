import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Star, 
  Clock, 
  Truck, 
  Navigation, 
  Fuel,
  TrendingUp,
  Award,
  Calendar,
  Activity,
  Gauge,
  Car,
  User,
  MessageSquare,
  X
} from 'lucide-react';

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
  experience: number;
  specialties: string[];
}

interface DriverProfileProps {
  driver: Driver | null;
  onClose: () => void;
  onCall?: (phone: string) => void;
  onMessage?: (driverId: string) => void;
  onTrack?: (driverId: string) => void;
}

export const DriverProfile: React.FC<DriverProfileProps> = ({
  driver,
  onClose,
  onCall,
  onMessage,
  onTrack
}) => {
  if (!driver) return null;

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

  const formatLastActive = (lastActive: string) => {
    const now = new Date();
    const active = new Date(lastActive);
    const diffInMinutes = Math.floor((now.getTime() - active.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const calculatePerformanceScore = () => {
    const ratingScore = (driver.rating / 5) * 40;
    const deliveryScore = Math.min((driver.totalDeliveries / 200) * 30, 30);
    const experienceScore = Math.min((driver.experience / 24) * 30, 30);
    return Math.round(ratingScore + deliveryScore + experienceScore);
  };

  const performanceScore = calculatePerformanceScore();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="text-3xl">{getVehicleIcon(driver.vehicleType)}</div>
            <div>
              <h2 className="text-2xl font-bold">{driver.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`${getStatusColor(driver.status)} text-white`}>
                  {getStatusText(driver.status)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formatLastActive(driver.lastActive)}
                </span>
              </div>
            </div>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{driver.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{driver.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Award className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">License Number</p>
                    <p className="text-sm text-muted-foreground">{driver.licenseNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">Current Location</p>
                    <p className="text-sm text-muted-foreground">
                      {driver.currentLocation 
                        ? `${driver.currentLocation.latitude.toFixed(4)}, ${driver.currentLocation.longitude.toFixed(4)}`
                        : 'Not available'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Car className="h-5 w-5" />
                Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <Truck className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">Vehicle Number</p>
                    <p className="text-sm text-muted-foreground">{driver.vehicleNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Gauge className="h-4 w-4 text-indigo-500" />
                  <div>
                    <p className="text-sm font-medium">Vehicle Model</p>
                    <p className="text-sm text-muted-foreground">{driver.vehicleModel}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xl">{getVehicleIcon(driver.vehicleType)}</div>
                  <div>
                    <p className="text-sm font-medium">Vehicle Type</p>
                    <p className="text-sm text-muted-foreground capitalize">{driver.vehicleType}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Overall Performance Score */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Performance</span>
                    <span className="text-sm font-bold">{performanceScore}/100</span>
                  </div>
                  <Progress value={performanceScore} className="h-2" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-2xl font-bold">{driver.rating.toFixed(1)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Average Rating</p>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <Navigation className="h-4 w-4 text-green-500" />
                      <span className="text-2xl font-bold">{driver.totalDeliveries}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Total Deliveries</p>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <Fuel className="h-4 w-4 text-purple-500" />
                      <span className="text-2xl font-bold">₹{driver.totalEarnings.toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Total Earnings</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Experience & Specialties */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Experience & Specialties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Experience</p>
                    <p className="text-sm text-muted-foreground">
                      {driver.experience} months of service
                    </p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-2">Specialties</p>
                  <div className="flex flex-wrap gap-2">
                    {driver.specialties.map((specialty, index) => (
                      <Badge key={index} variant="secondary">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Status changed to {getStatusText(driver.status)}</span>
                  <span className="text-muted-foreground ml-auto">{formatLastActive(driver.lastActive)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Completed delivery #ORD-{Math.random().toString(36).substr(2, 8).toUpperCase()}</span>
                  <span className="text-muted-foreground ml-auto">2h ago</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>Started shift</span>
                  <span className="text-muted-foreground ml-auto">6h ago</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              className="flex-1" 
              onClick={() => onCall?.(driver.phone)}
            >
              <Phone className="h-4 w-4 mr-2" />
              Call Driver
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => onMessage?.(driver.id)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Send Message
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => onTrack?.(driver.id)}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Track Location
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
