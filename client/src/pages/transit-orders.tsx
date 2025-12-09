import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  Package,
  Plus,
  Search,
  X,
  Trash2,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  Navigation,
  Barcode,
  FileText,
  ArrowRight,
  Building2,
  Factory,
  Store,
  User,
  Calendar,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import JsBarcode from 'jsbarcode';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/auth-context';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageTransition, FadeIn } from '@/components/ui/page-transition';
import { Separator } from '@/components/ui/separator';

interface OrderInBatch {
  orderNumber: string;
  customerId: string;
  customerName: string;
  itemCount: number;
  status: string;
  serviceType?: string;
  weight?: number;
  id?: string;
  franchiseId?: string;
}

interface StoreDetails {
  name: string;
  address: string;
  phone: string;
  managerName: string;
  storeCode: string;
}

interface FactoryDetails {
  name: string;
  address: string;
  phone: string;
  managerName: string;
  factoryCode: string;
}

interface VehicleDetails {
  vehicleNumber: string;
  vehicleType: string;
  driverName: string;
  driverPhone: string;
  driverLicense: string;
}

interface EmployeeDetails {
  name: string;
  employeeId: string;
  designation: string;
  phone: string;
}

interface TransitBatch {
  id: string;
  transitId: string;
  type: 'store_to_factory' | 'factory_to_store';
  origin: string;
  destination: string;
  createdBy: string;
  createdAt: string;
  status: string;
  orders: OrderInBatch[];
  itemCount: number;
  storeDetails?: StoreDetails;
  factoryDetails?: FactoryDetails;
  vehicleDetails?: VehicleDetails;
  employeeDetails?: EmployeeDetails;
}

// Audio feedback
const playSuccessSound = () => {
  const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ0PVK3n77BdGAg+ltjyvW0gBSyBzvLZiTYIGWi77eeeTRAMUKnk8LdlHAU4kNfyzHksBSR3x/DdkEAKFF606+uoVRQKRp/g8r5sIQUxh9Hz04IzBh5uwO/jmVENEFSu5++wXRgIPpbX8r1tIAUsgc7y2Yk2CBlou+3nnk0QDFCp5PC3ZRwFOJDX8sx5LAUkd8fw3ZBACxVetOvrqVUUCkae4fK+bCAFMIfR89OCMwYdbsDv45lRDRBUrufvsF0YCD6W1/K9bSAFLIHO8tmJNggZaLvt555NEAxQqeTwt2UcBTiQ1/LMeSwFJHfH8N2QQAsVXrTr66lVFApGnuHyvmwgBTCH0fPTgjMGHW7A7+OZUQwQVK7n77BdGAg+ltfyvW0gBSyBzvLZiTYIGWi77eeeTRAMUKnk8LdlHAU4kNfyzHksBSR3x/DdkEALFV606+upVRQKRp7h8r5sIAUwh9Hz04IzBh1uwO/jmVEMEFSu5++wXRgIPpbX8r1tIAUsgc7y2Yk2CBlou+3nnk0QDFCp5PC3ZRwFOJDX8sx5LAUkd8fw3ZBACxVetOvrqVUUCkae4fK+bCAFMIfR89OCMwYdbsDv45lRDRBUrufvsF0YCD6W1/K9bSAFLIHO8tmJNggZaLvt555NEAxQqeTwt2UcBTiQ1/LMeSwFJHfH8N2QQAsVXrTr66lVFApGnuHyvmwgBTCH0fPTgjMGHW7A7+OZUQwQVK7n77BdGAg+ltfyvW0gBSyBzvLZiTYIGWi77eeeTRAMUKnk8LdlHAU4kNfyzHksBSR3x/DdkEALFV606+upVRQKRp7h8r5sIAUwh9Hz04IzBh1uwO/jmVEMEFSu5++wXRgIPpbX8r1tIAUsgc7y2Yk2CBlouv3nnk0QDFCp5PC3ZRwFOJDX8sx5LAUkd8fw3ZBACxVetOvrqVUUCkae4fK+bCAFMIfR89OCMwYdbsDv45lRDRBUrufvsF0YCD6W1/K9bSAFLIHO8tmJNggZaLvt555NEAxQqeTwt2UcBTiQ1/LMeSwFJHfH8N2QQAsVXrTr66lVFApGnuHyvmwgBTCH0fPTgjMGHW7A7+OZUQwQVK7n77BdGAg+ltfyvW0gBSyBzvLZiTYIGWi77eeeTRAMUKnk8LdlHAU4kNfyzHksBSR3x/DdkEALFV606+upVRQKRp7h8r5sIAUwh9Hz04IzBh1uwO/jmVEMEFSu5++wXRgI');
  audio.play().catch(() => { });
};

const playErrorSound = () => {
  const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm01IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ0PVK3n77BdGAg+ltjyvW0gBSyBzvLZiTYIGWi77eeeTRAMUKnk8LdlHAU4kNfyzHksBSR3x/DdkEAKFF606+uoVRQKRp/g8r5sIQUxh9Hz04IzBh5uwO/jmVENEFSu5++wXRgI');
  audio.play().catch(() => { });
};

// Transit Status History Component
interface StatusHistoryEntry {
  id: string;
  status: string;
  notes?: string;
  location?: string;
  updatedBy?: string;
  createdAt: string;
}

const TransitStatusHistory: React.FC<{ transitOrderId: string }> = ({ transitOrderId }) => {
  const { data: statusHistory = [], isLoading } = useQuery<StatusHistoryEntry[]>({
    queryKey: ['transit-status-history', transitOrderId],
    queryFn: async () => {
      const token = localStorage.getItem('employee_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/transit-orders/${transitOrderId}/status-history`, {
        headers
      });
      if (!response.ok) {
        throw new Error('Failed to fetch status history');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (statusHistory.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="font-medium">No status history available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative border-l-2 border-muted ml-4">
        {statusHistory.map((entry, index) => (
          <div key={entry.id} className="ml-6 pb-6 relative">
            <div
              className={`absolute -left-[29px] mt-1.5 h-4 w-4 rounded-full border-2 ${index === 0 ? 'bg-primary border-primary' : 'bg-background border-muted'
                }`}
            />
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <Badge
                    variant={entry.status === 'completed' ? 'default' : 'secondary'}
                    className={
                      entry.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : entry.status === 'in_transit'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                    }
                  >
                    {entry.status.replace(/_/g, ' ').toUpperCase()}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(entry.createdAt).toLocaleString()}
                </div>
              </div>
              {entry.notes && (
                <p className="text-sm text-muted-foreground">{entry.notes}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {entry.updatedBy && (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {entry.updatedBy}
                  </div>
                )}
                {entry.location && (
                  <div className="flex items-center gap-1">
                    <Navigation className="h-3 w-3" />
                    {entry.location}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// PDF Generation with Comprehensive Details - A4 Format
const FRANCHISE_ADDRESSES: Record<string, { address: string; phone: string; code: string }> = {
  'franchise-pollachi': {
    address: '14/1, New Scheme Road, Pollachi - 642001',
    phone: '+91 98422 12345',
    code: 'POL',
  },
  'franchise-kenathukadavu': {
    address: '45, Coimbatore Main Road, Kenathukadavu - 642109',
    phone: '+91 98422 67890',
    code: 'KKD',
  },
  'default': {
    address: 'FabZ Clean Store',
    phone: '+91 98422 00000',
    code: 'STR',
  }
};

const MAIN_FACTORY = {
  name: 'FabZ Clean - Central Factory',
  address: 'SF No. 123, Industrial Estate, Pollachi - 642003',
  phone: '+91 98422 99999',
  managerName: 'Factory Manager',
  factoryCode: 'FAC-MAIN'
};

const generateTransitPDF = async (
  transitId: string,
  orders: OrderInBatch[],
  batchType: 'store_to_factory' | 'factory_to_store',
  createdBy: string = 'Current User',
  createdById: string = '', // Added ID
  createdByDesignation: string = '', // Added Designation
  storeDetails?: StoreDetails,
  factoryDetails?: FactoryDetails,
  vehicleDetails?: VehicleDetails,
  employeeDetails?: EmployeeDetails
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 15;
  let currentY = margin;

  // Colors
  const COLOR_PRIMARY = [230, 81, 0]; // Deep Orange (FabZ Clean Brand)
  const COLOR_SECONDARY = [33, 33, 33]; // Dark Grey
  const COLOR_ACCENT = [255, 143, 0]; // Amber
  const COLOR_LIGHT = [250, 250, 250];

  // Load Logo
  try {
    const logoUrl = '/assets/logo.png'; // Prefer PNG
    // If using webp, might need conversion, but let's try assuming a PNG exists or we use text as fallback if fails
    // For now, let's use a text fallback if image fails, but try to load specific Asset
    const img = new Image();
    img.src = '/assets/logo.webp';
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = resolve; // Continue even if logo fails
    });
    doc.addImage(img, 'WEBP', margin, currentY, 40, 15);
  } catch (e) {
    console.warn("Logo load failed", e);
    // Fallback text
    doc.setFontSize(16);
    doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('FABZ CLEAN', margin, currentY + 10);
  }

  // Header Text
  doc.setFontSize(24);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('TRANSIT ORDER', pageWidth - margin, currentY + 10, { align: 'right' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(batchType === 'store_to_factory' ? 'Store to Factory' : 'Factory to Store', pageWidth - margin, currentY + 16, { align: 'right' });

  currentY += 25;

  // Transit Barcode
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, transitId, {
    format: 'CODE128',
    width: 2,
    height: 40,
    displayValue: true,
    fontSize: 14,
    textMargin: 2,
    margin: 0,
    lineColor: "#000"
  });
  const barcodeDataUrl = canvas.toDataURL('image/png');
  doc.addImage(barcodeDataUrl, 'PNG', (pageWidth - 80) / 2, currentY, 80, 20);
  currentY += 25;

  // Meta Info Box
  doc.setFillColor(245, 245, 245);
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, currentY, pageWidth - 2 * margin, 14, 'FD');

  const midPoint = margin + (pageWidth - 2 * margin) / 2;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Date & Time:', margin + 5, currentY + 5);
  doc.text('Status:', margin + 5, currentY + 10);

  doc.setFont('helvetica', 'normal');
  doc.text(`${new Date().toLocaleString('en-IN')}`, margin + 30, currentY + 5);
  doc.setTextColor(0, 150, 0);
  doc.text('IN TRANSIT', margin + 30, currentY + 10);

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Transit ID:', midPoint + 5, currentY + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(transitId, midPoint + 30, currentY + 8);

  currentY += 20;

  // Shipment Details Header
  doc.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.rect(margin, currentY, pageWidth - 2 * margin, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('SHIPMENT DETAILS', margin + 5, currentY + 5.5);
  currentY += 8;

  // Origin / Destination Grid
  const colWidth = (pageWidth - 2 * margin) / 2;

  // Origin
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, currentY, colWidth, 35);
  doc.setTextColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('FROM (ORIGIN)', margin + 5, currentY + 5);

  const origin = batchType === 'store_to_factory' ? storeDetails : factoryDetails;
  doc.setFontSize(9);
  doc.text(origin?.name || 'Unknown', margin + 5, currentY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  // Address wrap
  const originAddr = doc.splitTextToSize(origin?.address || '', colWidth - 10);
  doc.text(originAddr, margin + 5, currentY + 17);
  doc.text(`Phone: ${origin?.phone}`, margin + 5, currentY + 30);

  // Destination
  doc.rect(margin + colWidth, currentY, colWidth, 35);
  doc.setFont('helvetica', 'bold');
  doc.text('TO (DESTINATION)', margin + colWidth + 5, currentY + 5);

  const dest = batchType === 'store_to_factory' ? factoryDetails : storeDetails;
  doc.setFontSize(9);
  doc.text(dest?.name || 'Unknown', margin + colWidth + 5, currentY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const destAddr = doc.splitTextToSize(dest?.address || '', colWidth - 10);
  doc.text(destAddr, margin + colWidth + 5, currentY + 17);
  doc.text(`Phone: ${dest?.phone}`, margin + colWidth + 5, currentY + 30);

  currentY += 40;

  // Personnel & Vehicle
  doc.setFillColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
  doc.rect(margin, currentY, pageWidth - 2 * margin, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('LOGISTICS DETAILS', margin + 5, currentY + 5.5);
  currentY += 8;

  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, currentY, pageWidth - 2 * margin, 32);

  // Split into Employee and Driver columns
  // Employee
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('CREATED BY (EMPLOYEE)', margin + 5, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${createdBy}`, margin + 5, currentY + 12);
  doc.text(`ID: ${createdById || employeeDetails?.employeeId || '-'}`, margin + 5, currentY + 16);
  doc.text(`Role: ${createdByDesignation || employeeDetails?.designation || '-'}`, margin + 5, currentY + 20);
  doc.text(`Phone: ${employeeDetails?.phone || '-'}`, margin + 5, currentY + 24);

  // Divider
  doc.line(margin + colWidth, currentY, margin + colWidth, currentY + 32);

  // Driver
  doc.setFont('helvetica', 'bold');
  doc.text('DRIVER & VEHICLE', margin + colWidth + 5, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.text(`Driver Name: ${vehicleDetails?.driverName || '-'}`, margin + colWidth + 5, currentY + 12);
  doc.text(`Phone: ${vehicleDetails?.driverPhone || '-'}`, margin + colWidth + 5, currentY + 16);
  doc.text(`License No: ${vehicleDetails?.driverLicense || '-'}`, margin + colWidth + 5, currentY + 20);
  doc.text(`Vehicle No: ${vehicleDetails?.vehicleNumber || '-'}`, margin + colWidth + 5, currentY + 24);
  doc.text(`Type: ${vehicleDetails?.vehicleType || '-'}`, margin + colWidth + 5, currentY + 28);

  currentY += 38;

  // Orders Table
  (doc as any).autoTable({
    startY: currentY,
    head: [['#', 'Order ID', 'Customer', 'Service', 'Items', 'Weight']],
    body: orders.map((o, i) => [
      i + 1,
      o.orderNumber,
      o.customerName,
      o.serviceType || 'Laundry',
      o.itemCount || 0,
      o.weight ? `${o.weight} kg` : 'N/A'
    ]),
    theme: 'grid',
    headStyles: { fillColor: COLOR_PRIMARY, textColor: 255, fontSize: 9 },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 45 }, // Increased from 35
      2: { cellWidth: 65 }, // Increased from 45
      3: { cellWidth: 25 },
      4: { cellWidth: 15 },
      5: { cellWidth: 20 }
    },
    margin: { left: margin, right: margin }
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // Signatures
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);

  const signatureY = currentY + 20;

  doc.line(margin, signatureY, margin + 50, signatureY);
  doc.text('Store Manager', margin + 10, signatureY + 5);

  doc.line(midPoint - 25, signatureY, midPoint + 25, signatureY);
  doc.text('Driver Signature', midPoint - 10, signatureY + 5);

  doc.line(pageWidth - margin - 50, signatureY, pageWidth - margin, signatureY);
  doc.text('Factory Manager', pageWidth - margin - 40, signatureY + 5);

  // Footer Disclaimer
  doc.setFontSize(7);
  doc.text('This is a computer-generated document. No signature required.', pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });

  doc.save(`Transit_${transitId}.pdf`);
};


export default function TransitOrdersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { employee } = useAuth();
  const isFactoryManager = employee?.role === 'factory_manager';

  // State for current batch
  const [currentBatch, setCurrentBatch] = useState<OrderInBatch[]>([]);
  // Default batch type based on role
  const [batchType, setBatchType] = useState<'store_to_factory' | 'factory_to_store'>(
    isFactoryManager ? 'factory_to_store' : 'store_to_factory'
  );
  const [showAddOrderDialog, setShowAddOrderDialog] = useState(false);
  const [searchOrdersQuery, setSearchOrdersQuery] = useState('');
  const [selectedEligibleOrders, setSelectedEligibleOrders] = useState<string[]>([]);

  // Dialog states
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [orderToRemove, setOrderToRemove] = useState<string | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);

  // Lookup state
  const [showLookupDialog, setShowLookupDialog] = useState(false);
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const handleLookupOrder = async () => {
    if (!lookupQuery) return;
    setLookupLoading(true);
    setLookupResult(null);
    try {
      // Try precise ID match first, then search
      // For now assume full ID or we search list?
      // Let's use the eligible list for search if possible, or global search API
      // Using global search API is better: /api/orders?search=...
      const response = await fetch(`/api/orders?search=${encodeURIComponent(lookupQuery)}&limit=1`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        setLookupResult(data.data[0]);
      } else {
        toast({ title: 'Not Found', description: 'No order found matching query.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to lookup order.', variant: 'destructive' });
    } finally {
      setLookupLoading(false);
    }
  };

  const handleAddLookupToBatch = () => {
    if (!lookupResult) return;
    const order = lookupResult;

    // Check if already in batch
    if (currentBatch.some(o => o.orderNumber === order.orderNumber)) {
      toast({ title: 'Already Added', description: 'Order is already in the batch.' });
      return;
    }

    // Add to batch
    const newItem: OrderInBatch = {
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customerName: order.customerName,
      itemCount: order.items ? order.items.length : 0,
      status: order.status,
      serviceType: 'Laundry', // fallback
      weight: 0,
      id: order.id,
      franchiseId: order.franchiseId
    };

    setCurrentBatch(prev => [...prev, newItem]);
    toast({ title: 'Added', description: 'Order added to batch.' });
    setShowLookupDialog(false);
    setLookupQuery('');
    setLookupResult(null);
  };

  const [selectedBatch, setSelectedBatch] = useState<TransitBatch | null>(null);
  const [showTransitDetailsDialog, setShowTransitDetailsDialog] = useState(false);

  // Transit details state
  const [transitDetails, setTransitDetails] = useState({
    vehicleNumber: 'KA-01-AB-1234',
    vehicleType: 'Tempo Traveller',
    driverName: 'Vijay Singh',
    driverPhone: '+91 98765 43212',
    driverLicense: 'KA0120230012345',
    employeeName: employee?.username || 'Current User',
    employeeId: employee?.employeeId || 'EMP001',
    designation: employee?.role || 'Staff',
    employeePhone: employee?.phone || '+91 98765 43213',
  });

  // Search and filter for History
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Helper for auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('employee_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  // Fetch eligible orders for adding to batch
  const { data: eligibleOrders = [], isLoading: isLoadingEligible } = useQuery({
    queryKey: ['eligible-transit-orders', batchType, employee?.franchiseId],
    queryFn: async () => {
      if (!employee?.franchiseId && !isFactoryManager) return [];
      const typeParam = batchType === 'store_to_factory' ? 'To Factory' : 'Return to Store';

      let url = `/api/transit-orders/eligible?type=${encodeURIComponent(typeParam)}`;
      if (employee?.franchiseId) {
        url += `&franchiseId=${employee.franchiseId}`;
      }

      const response = await fetch(url, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch eligible orders');

      const data = await response.json();
      return data.map((order: any) => ({
        ...order,
        franchiseId: order.franchiseId // Ensure franchiseId is mapped
      }));
    },
    enabled: showAddOrderDialog && (!!employee?.franchiseId || isFactoryManager)
  });

  // Fetch transit history
  const { data: transitHistory = [], isLoading: isLoadingHistory } = useQuery<TransitBatch[]>({
    queryKey: ['transit-batches', employee?.franchiseId],
    queryFn: async () => {
      let url = `/api/transit-orders`;
      if (employee?.franchiseId) {
        url += `?franchiseId=${employee.franchiseId}`;
      }

      const response = await fetch(url, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch transit orders');

      const data = await response.json();
      return data.map((order: any) => ({
        id: order.id,
        transitId: order.transitId,
        type: order.type === 'To Factory' ? 'store_to_factory' : 'factory_to_store',
        origin: order.origin,
        destination: order.destination,
        createdBy: order.createdBy,
        createdAt: order.createdAt,
        status: order.status?.toLowerCase().replace(' ', '_') || 'pending',
        orders: order.orders || [],
        itemCount: order.totalItems || 0,
        storeDetails: order.storeDetails || {},
        factoryDetails: order.factoryDetails || {},
        vehicleDetails: {
          vehicleNumber: order.vehicleNumber,
          vehicleType: order.vehicleType,
          driverName: order.driverName,
          driverPhone: order.driverPhone,
          driverLicense: order.driverLicense
        },
        employeeDetails: {
          name: order.employeeName,
          employeeId: order.employeeId,
          designation: order.designation,
          phone: order.employeePhone
        }
      }));
    },
    enabled: !!employee
  });

  const handleStartNewBatch = () => {
    if (currentBatch.length > 0) {
      setShowClearConfirm(true);
    } else {
      startNewBatch();
    }
  };

  const startNewBatch = () => {
    setCurrentBatch([]);
    setSelectedEligibleOrders([]);
    setShowAddOrderDialog(true);
    setShowClearConfirm(false);
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedEligibleOrders(prev => [...prev, orderId]);
    } else {
      setSelectedEligibleOrders(prev => prev.filter(id => id !== orderId));
    }
  };

  const handleAddSelectedOrders = () => {
    // Convert selected IDs to OrderInBatch objects
    const selected = eligibleOrders.filter((o: any) => selectedEligibleOrders.includes(o.id || o.orderNumber)); // Adjust based on DB ID vs Order Number

    // Fallback: If eligibleOrders uses 'id' but we need 'orderNumber' or vice versa.
    // Assuming backend returns standard Order objects.

    const newItems: OrderInBatch[] = selected.map((o: any) => ({
      orderNumber: o.orderNumber,
      customerId: o.customerId,
      customerName: o.customerName,
      itemCount: Array.isArray(o.items) ? o.items.length : 0,
      status: o.status,
      serviceType: o.service || 'Laundry',
      weight: 0, // Placeholder
      id: o.id,
      franchiseId: o.franchiseId // Added franchiseId
    }));


    // Filter out duplicates
    const uniqueNewItems = newItems.filter(item => !currentBatch.some(cb => cb.orderNumber === item.orderNumber));

    setCurrentBatch(prev => [...prev, ...uniqueNewItems]);
    setShowAddOrderDialog(false);
    setSelectedEligibleOrders([]);

    toast({
      title: 'Orders Added',
      description: `Added ${uniqueNewItems.length} orders to the batch.`,
    });
  };

  const handleRemoveOrder = (orderNumber: string) => {
    setOrderToRemove(orderNumber);
    setShowRemoveConfirm(true);
  };

  const confirmRemoveOrder = () => {
    if (orderToRemove) {
      setCurrentBatch(currentBatch.filter((order) => order.orderNumber !== orderToRemove));
      toast({
        title: 'Order Removed',
        description: `Order ${orderToRemove} removed from batch`,
      });
    }
    setShowRemoveConfirm(false);
    setOrderToRemove(null);
  };

  const handleGenerateTransitCopy = async () => {
    if (currentBatch.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one order to the batch',
        variant: 'destructive',
      });
      return;
    }
    setShowTransitDetailsDialog(true);
  };

  const confirmGenerateTransitCopy = async () => {
    try {
      if (!employee?.franchiseId && !isFactoryManager) {
        toast({ title: "Error", description: "Employee franchise ID missing", variant: "destructive" });
        return;
      }

      // Handle Factory Manager Grouping (Return to Store)
      if (isFactoryManager && batchType === 'factory_to_store') {
        const groups: Record<string, OrderInBatch[]> = {};
        currentBatch.forEach(o => {
          const fid = o.franchiseId || 'unknown';
          if (!groups[fid]) groups[fid] = [];
          groups[fid].push(o);
        });

        let createdCount = 0;
        for (const franchiseId of Object.keys(groups)) {
          const batch = groups[franchiseId];

          // Use placeholders or backend-resolved data
          const transitReqData = {
            type: 'Return to Store',
            vehicleNumber: transitDetails.vehicleNumber,
            vehicleType: transitDetails.vehicleType,
            driverName: transitDetails.driverName,
            driverPhone: transitDetails.driverPhone,
            driverLicense: transitDetails.driverLicense,
            employeeId: employee?.id,
            franchiseId: franchiseId,
            employeeName: employee?.fullName || employee?.username,
            employeePhone: employee?.phone,
            designation: employee?.role,
            storeDetails: {}, // Backend should populate
            factoryDetails: MAIN_FACTORY,
            origin: MAIN_FACTORY.name,
            destination: 'Store',
            orderIds: batch.map(o => o.id)
          };

          const response = await fetch('/api/transit-orders', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(transitReqData)
          });

          if (!response.ok) {
            console.error(`Failed to create transit for franchise ${franchiseId}`);
            continue;
          }

          const result = await response.json();
          createdCount++;

          // Generate PDF using response data
          await generateTransitPDF(
            result.transitId,
            batch,
            batchType,
            employee?.fullName || 'Factory Manager',
            employee?.employeeId, // ID
            employee?.role, // Designation
            result.storeDetails || { name: 'Store', address: '', phone: '', managerName: '', storeCode: '' },
            result.factoryDetails || MAIN_FACTORY,
            { ...transitDetails },
            {
              name: employee?.fullName || employee?.username || 'Factory Manager',
              employeeId: employee?.employeeId || '',
              designation: employee?.role,
              phone: employee?.phone || ''
            }
          );
        }

        toast({
          title: 'Batch Completed',
          description: `Created ${createdCount} transit orders successfully.`,
          duration: 5000,
        });

        setCurrentBatch([]);
        setShowTransitDetailsDialog(false);
        queryClient.invalidateQueries({ queryKey: ['transit-batches'] });
        queryClient.invalidateQueries({ queryKey: ['eligible-transit-orders'] });
        return;
      }

      // Standard Store Logic (Store to Factory)
      const franchiseLoc = FRANCHISE_ADDRESSES[employee?.franchiseId || ''] || FRANCHISE_ADDRESSES['default'];

      const storeDetails: StoreDetails = {
        name: `FabZ Clean - ${employee?.franchiseId?.includes('pollachi') ? 'Pollachi' : 'Kenathukadavu'} Store`,
        address: franchiseLoc.address,
        phone: franchiseLoc.phone,
        managerName: employee?.fullName || 'Manager',
        storeCode: franchiseLoc.code,
      };

      const factoryDetails: FactoryDetails = MAIN_FACTORY;

      const transitReqData = {
        type: batchType === 'store_to_factory' ? 'To Factory' : 'Return to Store',
        vehicleNumber: transitDetails.vehicleNumber,
        vehicleType: transitDetails.vehicleType,
        driverName: transitDetails.driverName,
        driverPhone: transitDetails.driverPhone,
        driverLicense: transitDetails.driverLicense,
        employeeId: employee?.id, // Auth Context ID
        franchiseId: employee?.franchiseId,
        employeeName: employee?.fullName || employee?.username, // Use full name
        employeePhone: employee?.phone,
        designation: employee?.role,
        storeDetails,
        factoryDetails,
        origin: batchType === 'store_to_factory' ? storeDetails.name : factoryDetails.name,
        destination: batchType === 'store_to_factory' ? factoryDetails.name : storeDetails.name,
        orderIds: currentBatch.map(o => {
          // Use passed ID
          return o.id;
        })
      };

      const response = await fetch('/api/transit-orders', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(transitReqData),
      });

      if (!response.ok) throw new Error('Failed to create transit order');
      const result = await response.json();

      // Generate PDF with updated details
      await generateTransitPDF(
        result.transitId,
        currentBatch,
        batchType,
        employee?.fullName || employee?.username || 'Employee', // Name
        employee?.employeeId, // ID
        employee?.role, // Designation
        storeDetails,
        factoryDetails,
        { ...transitDetails },
        {
          name: employee?.fullName || employee?.username || 'Employee',
          employeeId: employee?.employeeId || '',
          designation: employee?.role,
          phone: employee?.phone || ''
        }
      );

      toast({
        title: 'Transit Order Created',
        description: `Transit ID: ${result.transitId} created successfully.`,
        duration: 5000,
      });

      setCurrentBatch([]);
      setShowTransitDetailsDialog(false);
      queryClient.invalidateQueries({ queryKey: ['transit-batches'] });
      queryClient.invalidateQueries({ queryKey: ['eligible-transit-orders'] });
    } catch (error) {
      console.error('Error creating transit order:', error);
      playErrorSound();
      toast({
        title: 'Creation Failed',
        description: 'Failed to create transit order. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStatus = async (batchId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/transit-orders/${batchId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: newStatus,
          location: 'Store/Factory', // Simplification
          updatedBy: employee?.username
        })
      });

      if (!response.ok) throw new Error("Failed to update status");

      toast({ title: "Status Updated", description: `Transit updated to ${newStatus}` });
      queryClient.invalidateQueries({ queryKey: ['transit-batches'] });
      setShowViewDialog(false);
    } catch (e) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  // Filter history
  const filteredHistory = transitHistory.filter((batch) => {
    const matchesSearch = batch.transitId.toLowerCase().includes(historySearchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || batch.status === statusFilter ||
      (statusFilter === 'in_transit' && batch.status === 'in_transit') ||
      (statusFilter === 'completed' && (batch.status === 'completed' || batch.status === 'received'));
    return matchesSearch && matchesStatus;
  });

  return (
    <PageTransition>
      <div className="min-h-screen bg-background p-6 space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
              <Truck className="h-10 w-10 text-primary" />
              Transit Order Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage store-to-factory and factory-to-store shipments
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isFactoryManager && (
              <Button onClick={() => setShowLookupDialog(true)} size="lg" variant="secondary" className="gap-2">
                <Search className="h-5 w-5" /> Lookup Order
              </Button>
            )}
            <Select value={batchType} onValueChange={(value: any) => { setBatchType(value); setCurrentBatch([]); }}>

              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {/* Store→Factory: Available to franchise_manager and staff */}
                {!isFactoryManager && (
                  <SelectItem value="store_to_factory">
                    <div className="flex items-center gap-2"><Store className="h-4 w-4" /> Store → Factory</div>
                  </SelectItem>
                )}
                {/* Factory→Store: Only for Factory Manager */}
                {isFactoryManager && (
                  <>
                    <SelectItem value="factory_to_store">
                      <div className="flex items-center gap-2"><Factory className="h-4 w-4" /> Factory → Store</div>
                    </SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
            <Button onClick={handleStartNewBatch} size="lg" className="gap-2">
              <Plus className="h-5 w-5" /> New Transit Batch
            </Button>
          </div>
        </motion.div>

        {/* Create Batch Card (Left) & History (Right) */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* LEFT: Current Batch */}
          <Card className="lg:col-span-1 h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Barcode className="h-5 w-5" /> Current Batch ({currentBatch.length})
              </CardTitle>
              <CardDescription>
                Orders selected for {batchType === 'store_to_factory' ? 'Store → Factory' : 'Factory → Store'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
              {/* Add Button */}
              <Button variant="outline" className="w-full text-primary border-primary border-dashed" onClick={() => setShowAddOrderDialog(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add Orders to Batch
              </Button>

              {/* Batch Table */}
              <div className="flex-1 border rounded-lg overflow-hidden relative min-h-[300px]">
                {currentBatch.length > 0 ? (
                  <div className="overflow-y-auto max-h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentBatch.map(order => (
                          <TableRow key={order.orderNumber}>
                            <TableCell className="font-medium">{order.orderNumber}</TableCell>
                            <TableCell>{order.customerName}</TableCell>
                            <TableCell>{order.status}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" onClick={() => handleRemoveOrder(order.orderNumber)} className="text-destructive">
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                    <Package className="h-12 w-12 mb-2 opacity-20" />
                    <p>No orders added yet</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-auto pt-4">
                <Button onClick={handleGenerateTransitCopy} disabled={currentBatch.length === 0} className="flex-1">
                  <Printer className="h-4 w-4 mr-2" /> Create & Print
                </Button>
                <Button variant="outline" onClick={() => setShowClearConfirm(true)} disabled={currentBatch.length === 0}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* RIGHT: Transit History */}
          <Card className="lg:col-span-1 h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">History</CardTitle>
              <div className="flex gap-2 mt-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search ID..." value={historySearchQuery} onChange={e => setHistorySearchQuery(e.target.value)} className="pl-8" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto max-h-[600px] space-y-3">
              {isLoadingHistory ? (
                <div className="text-center py-8"><RefreshCw className="animate-spin mx-auto" /></div>
              ) : filteredHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No records found</div>
              ) : filteredHistory.map(batch => (
                <div key={batch.id} className="border rounded-lg p-3 hover:bg-accent/50 transition-colors flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{batch.transitId}</span>
                      <Badge variant={batch.status === 'completed' || batch.status === 'received' ? 'default' : 'secondary'}>
                        {batch.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {new Date(batch.createdAt).toLocaleDateString()} | {batch.itemCount} Items
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      {batch.type === 'store_to_factory' ? <Store className="h-3 w-3" /> : <Factory className="h-3 w-3" />}
                      <span>{batch.type === 'store_to_factory' ? 'Store -> Fac' : 'Fac -> Store'}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => { setSelectedBatch(batch); setShowViewDialog(true); }}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

        </div>

        {/* Add Orders Dialog */}
        <Dialog open={showAddOrderDialog} onOpenChange={setShowAddOrderDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Add Orders to Batch</DialogTitle>
              <DialogDescription>
                Select eligible orders for {batchType === 'store_to_factory' ? 'Store to Factory' : 'Factory to Store'} transit.
              </DialogDescription>
            </DialogHeader>

            <div className="relative mb-4">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Filter orders..." value={searchOrdersQuery} onChange={e => setSearchOrdersQuery(e.target.value)} className="pl-8" />
            </div>

            <div className="flex-1 overflow-y-auto border rounded-md">
              {isLoadingEligible ? (
                <div className="p-8 text-center">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eligibleOrders
                      .filter((o: any) => o.orderNumber.toLowerCase().includes(searchOrdersQuery.toLowerCase()) || o.customerName.toLowerCase().includes(searchOrdersQuery.toLowerCase()))
                      .map((order: any) => {
                        const isSelected = selectedEligibleOrders.includes(order.id);
                        return (
                          <TableRow key={order.id} onClick={() => handleSelectOrder(order.id, !isSelected)} className="cursor-pointer">
                            <TableCell>
                              <Checkbox checked={isSelected} onCheckedChange={(c) => handleSelectOrder(order.id, c as boolean)} />
                            </TableCell>
                            <TableCell className="font-medium">{order.orderNumber}</TableCell>
                            <TableCell>{order.customerName}</TableCell>
                            <TableCell><Badge variant="outline">{order.status}</Badge></TableCell>
                          </TableRow>
                        );
                      })
                    }
                    {eligibleOrders.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-4">No eligible orders found</TableCell></TableRow>}
                  </TableBody>
                </Table>
              )}
            </div>
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-muted-foreground">{selectedEligibleOrders.length} orders selected</span>
              <Button onClick={handleAddSelectedOrders} disabled={selectedEligibleOrders.length === 0}>
                Add Selected
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Details Dialog */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Transit Details - {selectedBatch?.transitId}</DialogTitle>
              <DialogDescription>Details of transit batch {selectedBatch?.transitId}</DialogDescription>
            </DialogHeader>
            {selectedBatch && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><strong>Type:</strong> {selectedBatch.type}</div>
                  <div><strong>Status:</strong> <Badge variant={selectedBatch.status === 'in_transit' ? 'secondary' : 'default'}>{selectedBatch.status}</Badge></div>
                  <div><strong>Created By:</strong> {selectedBatch.createdBy}</div>
                  <div><strong>Vehicle:</strong> {selectedBatch.vehicleDetails?.vehicleNumber}</div>
                  <div><strong>Driver:</strong> {selectedBatch.vehicleDetails?.driverName || 'N/A'}</div>
                  <div><strong>Total Orders:</strong> {selectedBatch.orders.length}</div>
                </div>
                <div className="border rounded-md p-3 max-h-[250px] overflow-y-auto">
                  <h4 className="font-semibold mb-2">Orders in this Batch</h4>
                  <div className="space-y-2">
                    {selectedBatch.orders.map((o, i) => (
                      <div key={i} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <div>
                          <p className="font-medium">{o.orderNumber}</p>
                          <p className="text-sm text-muted-foreground">{o.customerName}</p>
                        </div>
                        <Badge variant="outline">{o.status || 'pending'}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Action Buttons - Only Factory Manager can mark as Received/Completed */}
                <div className="flex justify-end gap-2">
                  {selectedBatch.status === 'in_transit' && isFactoryManager && (
                    <>
                      <Button onClick={() => handleUpdateStatus(selectedBatch.id, 'Received')} className="bg-blue-600 hover:bg-blue-700">
                        Mark as Received
                      </Button>
                      <Button onClick={() => handleUpdateStatus(selectedBatch.id, 'Completed')} variant="default" className="bg-green-600 hover:bg-green-700">
                        Mark Completed
                      </Button>
                    </>
                  )}
                  {selectedBatch.status === 'in_transit' && !isFactoryManager && (
                    <p className="text-sm text-muted-foreground italic">Only Factory Manager can update transit status</p>
                  )}
                  {selectedBatch.status !== 'in_transit' && (
                    <Badge variant={selectedBatch.status === 'Completed' ? 'default' : 'secondary'} className="text-sm px-4 py-2">
                      {selectedBatch.status}
                    </Badge>
                  )}
                </div>
                <div className="mt-4">
                  <TransitStatusHistory transitOrderId={selectedBatch.id} />
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Create Transit Confirmation Dialog (Simplified) */}
        <Dialog open={showTransitDetailsDialog} onOpenChange={setShowTransitDetailsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Transit</DialogTitle>
              <DialogDescription>Please review the details before creating the transit order.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vehicle Number *</Label>
                  <Input
                    value={transitDetails.vehicleNumber}
                    onChange={e => setTransitDetails({ ...transitDetails, vehicleNumber: e.target.value })}
                    placeholder="KA-01-AB-1234"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vehicle Type</Label>
                  <Input
                    value={transitDetails.vehicleType}
                    onChange={e => setTransitDetails({ ...transitDetails, vehicleType: e.target.value })}
                    placeholder="Tempo / Van / Truck"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Driver Name *</Label>
                  <Input
                    value={transitDetails.driverName}
                    onChange={e => setTransitDetails({ ...transitDetails, driverName: e.target.value })}
                    placeholder="Driver's full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Driver Phone *</Label>
                  <Input
                    value={transitDetails.driverPhone}
                    onChange={e => setTransitDetails({ ...transitDetails, driverPhone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Driver License Number *</Label>
                <Input
                  value={transitDetails.driverLicense}
                  onChange={e => setTransitDetails({ ...transitDetails, driverLicense: e.target.value })}
                  placeholder="KA0120230012345"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTransitDetailsDialog(false)}>Cancel</Button>
              <Button onClick={confirmGenerateTransitCopy}>Confirm & Print</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Clear & Remove Alerts */}
        <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Clear Batch?</AlertDialogTitle></AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowClearConfirm(false)}>No</AlertDialogCancel>
              <AlertDialogAction onClick={startNewBatch}>Yes</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Remove Order?</AlertDialogTitle></AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowRemoveConfirm(false)}>No</AlertDialogCancel>
              <AlertDialogAction onClick={confirmRemoveOrder}>Yes</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Lookup Dialog */}
        <Dialog open={showLookupDialog} onOpenChange={setShowLookupDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Lookup Order</DialogTitle>
              <DialogDescription>Enter Order ID or Last 4 Digits to search.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Order ID / Number..."
                  value={lookupQuery}
                  onChange={e => setLookupQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLookupOrder()}
                />
                <Button onClick={handleLookupOrder} disabled={lookupLoading}>
                  {lookupLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>

              {lookupResult && (
                <div className="border rounded-md p-4 bg-muted/20 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{lookupResult.orderNumber}</h3>
                      <p className="text-sm text-muted-foreground">{lookupResult.customerName}</p>
                      <Badge className="mt-1">{lookupResult.status}</Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm">{lookupResult.franchiseId || 'Unknown Franchise'}</p>
                      <p className="text-xl font-bold">{lookupResult.totalAmount}</p>
                    </div>
                  </div>

                  <div className="text-sm border-t pt-2">
                    <p><strong>Items:</strong> {lookupResult.items?.length || 0}</p>
                    <p><strong>Service:</strong> {lookupResult.service || 'Laundry'}</p>
                  </div>

                  <Button onClick={handleAddLookupToBatch} className="w-full mt-2">
                    Add to Batch
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>


      </div>
    </PageTransition>
  );
}
