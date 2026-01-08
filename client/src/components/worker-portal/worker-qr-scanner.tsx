import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from "wouter";
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Package,
  User,
  MapPin,
  Clock,
  Phone,
  RefreshCw,
  Flashlight,
  FlashlightOff,
  X,
  Eye,
  Navigation,
  Target
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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

interface ScannedOrder {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  deliveryAddress: string;
  status: string;
  priority: 'low' | 'medium' | 'high';
  scheduledPickup: string;
  scheduledDelivery: string;
  specialInstructions?: string;
  items: Array<{
    name: string;
    quantity: number;
    service: string;
  }>;
}

interface WorkerQRScannerProps {
  driver: Driver;
}

const WorkerQRScanner: React.FC<WorkerQRScannerProps> = ({ driver }) => {
  const [, setLocation] = useLocation();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<ScannedOrder | null>(null);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScannedOrder[]>([]);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  // Mock QR code data for demonstration
  const mockQRData: Record<string, ScannedOrder> = {
    'ORDER-123': {
      id: 'ORDER-123',
      orderId: 'ORDER-123',
      customerName: 'John Doe',
      customerPhone: '9876543210',
      pickupAddress: '123 Main Street, Bangalore',
      deliveryAddress: '456 Park Avenue, Bangalore',
      status: 'assigned',
      priority: 'medium',
      scheduledPickup: '2024-01-15T10:00:00Z',
      scheduledDelivery: '2024-01-15T14:00:00Z',
      specialInstructions: 'Handle with care - fragile items',
      items: [
        { name: 'Cotton Shirt', quantity: 2, service: 'Dry Cleaning' },
        { name: 'Silk Dress', quantity: 1, service: 'Premium Cleaning' }
      ]
    },
    'ORDER-456': {
      id: 'ORDER-456',
      orderId: 'ORDER-456',
      customerName: 'Jane Smith',
      customerPhone: '9876543211',
      pickupAddress: '789 Oak Street, Bangalore',
      deliveryAddress: '321 Pine Street, Bangalore',
      status: 'picked_up',
      priority: 'high',
      scheduledPickup: '2024-01-15T11:00:00Z',
      scheduledDelivery: '2024-01-15T15:00:00Z',
      specialInstructions: 'Express delivery required',
      items: [
        { name: 'Wool Jacket', quantity: 1, service: 'Dry Cleaning' },
        { name: 'Leather Bag', quantity: 1, service: 'Leather Care' }
      ]
    }
  };

  const startScanning = () => {
    setIsScanning(true);
    setIsResultOpen(false);
    setScannedData(null);

    // In a real app, this would initialize the camera
    toast({
      title: "Scanner Started",
      description: "Point your camera at a QR code to scan",
    });
  };

  const stopScanning = () => {
    setIsScanning(false);
  };

  const simulateQRScan = (orderId: string) => {
    // Deep Linking Logic
    // If scanning a URL or direct Order ID, redirect instantly
    if (orderId.startsWith("http") || orderId.startsWith("ORDER-")) {
      // Extract ID if URL
      const id = orderId.split('/').pop() || orderId;

      // If it's a known mock ID, show details (optional), 
      // BUT user asked to "open Order Edit modal immediately".
      // We'll redirect to the orders page with a query param.
      // Assuming /orders can handle ?edit=ID or user manually opens it.
      // For "Realtime" feeling, we just navigate.
      if (!mockQRData[id as keyof typeof mockQRData]) {
        toast({
          title: "Opening Order",
          description: `Navigating to Order ${id}...`
        });
        setLocation(`/orders?edit=${id}`);
        return;
      }
    }

    const orderData = mockQRData[orderId as keyof typeof mockQRData];

    if (orderData) {
      setScannedData(orderData);
      setScanHistory(prev => [orderData, ...prev.slice(0, 9)]); // Keep last 10 scans
      setIsResultOpen(true);
      setIsScanning(false);

      toast({
        title: "QR Code Scanned",
        description: `Order ${orderData.orderId} scanned successfully`,
      });
    } else {
      toast({
        title: "Invalid QR Code",
        description: "QR code not recognized",
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = (newStatus: string) => {
    if (scannedData) {
      // In a real app, this would update the order status via API
      toast({
        title: "Status Updated",
        description: `Order ${scannedData.orderId} status updated to ${newStatus}`,
      });

      // Update the scanned data
      setScannedData(prev => prev ? { ...prev, status: newStatus } : null);

      // Update scan history
      setScanHistory(prev => prev.map(item =>
        item.id === scannedData.id ? { ...item, status: newStatus } : item
      ));
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500 bg-red-50';
      case 'medium':
        return 'text-yellow-500 bg-yellow-50';
      case 'low':
        return 'text-green-500 bg-green-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned':
        return 'text-blue-500 bg-blue-50';
      case 'picked_up':
        return 'text-orange-500 bg-orange-50';
      case 'in_transit':
        return 'text-purple-500 bg-purple-50';
      case 'delivered':
        return 'text-green-500 bg-green-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* QR Scanner */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code Scanner
          </CardTitle>
          <CardDescription>
            Scan QR codes on packages to view order details and update status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isScanning ? (
            <div className="text-center py-8">
              <div className="relative w-64 h-64 mx-auto mb-6">
                <div className="w-full h-full border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center">
                  <Camera className="h-16 w-16 text-muted-foreground" />
                </div>
                <div className="absolute inset-0 border-4 border-primary/20 rounded-lg animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Ready to Scan</h3>
              <p className="text-muted-foreground mb-6">
                Start scanning to view order information and update delivery status.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={startScanning}
                  className="gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Start Scanning
                </Button>
                <Button
                  variant="outline"
                  onClick={() => simulateQRScan('ORDER-123')}
                  className="gap-2"
                >
                  <Package className="h-4 w-4" />
                  Demo Scan
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Scanner Interface */}
              <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-4 border-primary rounded-lg relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFlashOn(!isFlashOn)}
                    className="gap-2"
                  >
                    {isFlashOn ? <FlashlightOff className="h-4 w-4" /> : <Flashlight className="h-4 w-4" />}
                    Flash
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={stopScanning}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Stop
                  </Button>
                </div>
              </div>

              {/* Quick Scan Buttons */}
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => simulateQRScan('ORDER-123')}
                  className="gap-2"
                >
                  <Package className="h-4 w-4" />
                  Scan Order 123
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => simulateQRScan('ORDER-456')}
                  className="gap-2"
                >
                  <Package className="h-4 w-4" />
                  Scan Order 456
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Recent Scans
            </CardTitle>
            <CardDescription>
              Your recent QR code scans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scanHistory.slice(0, 5).map((scan, index) => (
                <motion.div
                  key={scan.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setScannedData(scan);
                      setIsResultOpen(true);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Package className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm">Order #{scan.orderId}</h4>
                            <p className="text-sm text-muted-foreground">{scan.customerName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getStatusColor(scan.status)}`}>
                            {scan.status}
                          </Badge>
                          <Badge className={`${getPriorityColor(scan.priority)}`}>
                            {scan.priority}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scan Result Dialog */}
      <Dialog open={isResultOpen} onOpenChange={setIsResultOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Order Details
            </DialogTitle>
            <DialogDescription>
              Order information from scanned QR code
            </DialogDescription>
          </DialogHeader>

          {scannedData && (
            <div className="space-y-6">
              {/* Order Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Order #{scannedData.orderId}</h3>
                  <p className="text-muted-foreground">Scanned at {new Date().toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <Badge className={`${getStatusColor(scannedData.status)}`}>
                    {scannedData.status}
                  </Badge>
                  <Badge className={`${getPriorityColor(scannedData.priority)}`}>
                    {scannedData.priority} Priority
                  </Badge>
                </div>
              </div>

              {/* Customer Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="font-medium">{scannedData.customerName}</p>
                    <p className="text-sm text-muted-foreground">{scannedData.customerPhone}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`tel:${scannedData.customerPhone}`, '_self')}
                    className="gap-2"
                  >
                    <Phone className="h-4 w-4" />
                    Call Customer
                  </Button>
                </CardContent>
              </Card>

              {/* Address Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Pickup Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{scannedData.pickupAddress}</p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Scheduled: {new Date(scannedData.scheduledPickup).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Delivery Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{scannedData.deliveryAddress}</p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Scheduled: {new Date(scannedData.scheduledDelivery).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Items */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {scannedData.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <Badge variant="outline">{item.service}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Special Instructions */}
              {scannedData.specialInstructions && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Special Instructions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{scannedData.specialInstructions}</p>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  className="flex-1 gap-2"
                >
                  <Navigation className="h-4 w-4" />
                  Navigate
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleStatusUpdate('picked_up')}
                  className="gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark Picked Up
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleStatusUpdate('delivered')}
                  className="gap-2"
                >
                  <Package className="h-4 w-4" />
                  Mark Delivered
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default WorkerQRScanner;
