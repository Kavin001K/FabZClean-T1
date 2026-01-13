import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Navigation,
  Truck,
  Package,
  Target,
  Activity,
  TrendingUp,
  Calendar,
  Timer,
  Zap,
  Settings,
  Bell,
  Phone
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { useToast } from '@/hooks/use-toast';

// Temporary type definitions
interface Driver {
  id: string;
  name: string;
  phone: string;
  email?: string;
  licenseNumber: string;
  vehicleNumber: string;
  vehicleType: string;
  status: string;
  currentLatitude?: number;
  currentLongitude?: number;
  lastActive?: string;
  rating: number;
  totalDeliveries: number;
  totalEarnings: string;
  createdAt: string;
  updatedAt: string;
}

interface WorkerStatusUpdaterProps {
  driver: Driver;
}

const WorkerStatusUpdater: React.FC<WorkerStatusUpdaterProps> = ({ driver }) => {
  const [currentStatus, setCurrentStatus] = useState(driver.status);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const { toast } = useToast();

  // Mock daily stats
  const dailyStats = {
    deliveriesCompleted: 8,
    deliveriesRemaining: 4,
    totalDistance: 45.2,
    totalTime: 6.5,
    fuelUsed: 12.5,
    earnings: 1250,
    efficiency: 92
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCurrentStatus(newStatus);
      toast({
        title: "Status Updated",
        description: `Your status has been updated to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLocationUpdate = async () => {
    if (!location.trim()) {
      toast({
        title: "Error",
        description: "Please enter your current location",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Location Updated",
        description: `Location updated to ${location}`,
      });
      
      setLocation('');
      setShowLocationDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update location",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNotesUpdate = async () => {
    setIsUpdating(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Notes Updated",
        description: "Your notes have been saved",
      });
      
      setNotes('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notes",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-500 bg-green-50';
      case 'busy':
        return 'text-orange-500 bg-orange-50';
      case 'offline':
        return 'text-gray-500 bg-gray-50';
      case 'break':
        return 'text-blue-500 bg-blue-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return CheckCircle2;
      case 'busy':
        return Truck;
      case 'offline':
        return Clock;
      case 'break':
        return Timer;
      default:
        return Activity;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Current Status */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Current Status
          </CardTitle>
          <CardDescription>
            Update your working status and location
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Update */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {(() => {
                  const StatusIcon = getStatusIcon(currentStatus);
                  return (
                    <div className={`p-3 rounded-full ${getStatusColor(currentStatus)}`}>
                      <StatusIcon className="h-6 w-6" />
                    </div>
                  );
                })()}
                <div>
                  <h3 className="font-semibold">Current Status</h3>
                  <Badge className={`${getStatusColor(currentStatus)}`}>
                    {currentStatus.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={currentStatus === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusUpdate('active')}
                  disabled={isUpdating}
                  className="gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Active
                </Button>
                <Button
                  variant={currentStatus === 'busy' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusUpdate('busy')}
                  disabled={isUpdating}
                  className="gap-2"
                >
                  <Truck className="h-4 w-4" />
                  Busy
                </Button>
                <Button
                  variant={currentStatus === 'break' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusUpdate('break')}
                  disabled={isUpdating}
                  className="gap-2"
                >
                  <Timer className="h-4 w-4" />
                  Break
                </Button>
                <Button
                  variant={currentStatus === 'offline' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusUpdate('offline')}
                  disabled={isUpdating}
                  className="gap-2"
                >
                  <Clock className="h-4 w-4" />
                  Offline
                </Button>
              </div>
            </div>

            {/* Location Update */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-blue-50">
                  <MapPin className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Current Location</h3>
                  <p className="text-sm text-muted-foreground">
                    Last updated: {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full gap-2">
                    <Navigation className="h-4 w-4" />
                    Update Location
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Update Location</DialogTitle>
                    <DialogDescription>
                      Enter your current location or landmark
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Enter your current location..."
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleLocationUpdate}
                        disabled={isUpdating}
                        className="flex-1"
                      >
                        {isUpdating ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                            Updating...
                          </>
                        ) : (
                          'Update Location'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowLocationDialog(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Progress */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Today's Progress
          </CardTitle>
          <CardDescription>
            Your delivery performance for today
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Deliveries Completed</span>
                <span>{dailyStats.deliveriesCompleted} / {dailyStats.deliveriesCompleted + dailyStats.deliveriesRemaining}</span>
              </div>
              <Progress 
                value={(dailyStats.deliveriesCompleted / (dailyStats.deliveriesCompleted + dailyStats.deliveriesRemaining)) * 100} 
                className="h-2"
              />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Deliveries</span>
                </div>
                <p className="text-2xl font-bold">{dailyStats.deliveriesCompleted}</p>
                <p className="text-xs text-muted-foreground">{dailyStats.deliveriesRemaining} remaining</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Navigation className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Distance</span>
                </div>
                <p className="text-2xl font-bold">{dailyStats.totalDistance} km</p>
                <p className="text-xs text-muted-foreground">Total driven</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Timer className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Time</span>
                </div>
                <p className="text-2xl font-bold">{dailyStats.totalTime}h</p>
                <p className="text-xs text-muted-foreground">Active time</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Earnings</span>
                </div>
                <p className="text-2xl font-bold">₹{dailyStats.earnings}</p>
                <p className="text-xs text-muted-foreground">Today's total</p>
              </Card>
            </div>

            {/* Efficiency */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">Efficiency Score</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={dailyStats.efficiency} className="w-20 h-2" />
                  <span className="text-sm font-bold">{dailyStats.efficiency}%</span>
                </div>
              </div>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Common actions and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2"
              onClick={() => window.open(`tel:${driver.phone}`, '_self')}
            >
              <Phone className="h-5 w-5" />
              <span className="text-xs">Call Support</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2"
              onClick={() => toast({
                title: "Break Started",
                description: "Your break time has been recorded",
              })}
            >
              <Timer className="h-5 w-5" />
              <span className="text-xs">Start Break</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2"
              onClick={() => toast({
                title: "Location Shared",
                description: "Your location has been shared with dispatch",
              })}
            >
              <MapPin className="h-5 w-5" />
              <span className="text-xs">Share Location</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2"
              onClick={() => toast({
                title: "Help Requested",
                description: "Help request sent to dispatch",
              })}
            >
              <Bell className="h-5 w-5" />
              <span className="text-xs">Request Help</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Notes & Updates
          </CardTitle>
          <CardDescription>
            Add notes about deliveries, issues, or updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="Add notes about deliveries, traffic, issues, or any updates..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-24"
            />
            <Button
              onClick={handleNotesUpdate}
              disabled={isUpdating || !notes.trim()}
              className="gap-2"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Save Notes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default WorkerStatusUpdater;
