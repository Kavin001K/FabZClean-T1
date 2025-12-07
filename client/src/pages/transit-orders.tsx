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
      const response = await fetch(`/api/transit-orders/${transitOrderId}/status-history`);
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
const generateTransitPDF = (
  transitId: string,
  orders: OrderInBatch[],
  batchType: 'store_to_factory' | 'factory_to_store',
  createdBy: string = 'Current User',
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

  const pageWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const margin = 15;
  let currentY = margin;

  // Mock data if not provided
  const store: StoreDetails = storeDetails || {
    name: 'FabZ Clean - Store #1',
    address: '123 Main Street, Bangalore - 560001',
    phone: '+91 98765 43210',
    managerName: 'Rajesh Kumar',
    storeCode: 'STR001',
  };

  const factory: FactoryDetails = factoryDetails || {
    name: 'FabZ Clean - Central Factory',
    address: '456 Industrial Area, Bangalore - 560099',
    phone: '+91 98765 43211',
    managerName: 'Suresh Patel',
    factoryCode: 'FAC001',
  };

  const vehicle: VehicleDetails = vehicleDetails || {
    vehicleNumber: 'KA-01-AB-1234',
    vehicleType: 'Tempo Traveller',
    driverName: 'Vijay Singh',
    driverPhone: '+91 98765 43212',
    driverLicense: 'KA0120230012345',
  };

  const employee: EmployeeDetails = employeeDetails || {
    name: createdBy,
    employeeId: 'EMP' + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
    designation: 'Store Executive',
    phone: '+91 98765 43213',
  };

  // ===== HEADER SECTION =====
  // Company Logo Area (placeholder)
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(margin, currentY, 40, 20);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('FABZ CLEAN', margin + 20, currentY + 10, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text('Laundry Services', margin + 20, currentY + 14, { align: 'center' });

  // Document Title
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('TRANSIT ORDER', pageWidth / 2, currentY + 8, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(batchType === 'store_to_factory' ? 'Store to Factory' : 'Factory to Store', pageWidth / 2, currentY + 15, { align: 'center' });

  currentY += 25;

  // Transit ID Barcode
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, transitId, {
    format: 'CODE128',
    width: 2,
    height: 50,
    displayValue: true,
    fontSize: 16,
    textMargin: 2,
    margin: 0,
  });
  const barcodeDataUrl = canvas.toDataURL('image/png');
  doc.addImage(barcodeDataUrl, 'PNG', (pageWidth - 100) / 2, currentY, 100, 20);
  currentY += 25;

  // Date & Time Box
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN');
  const timeStr = now.toLocaleTimeString('en-IN');

  doc.setFillColor(240, 240, 240);
  doc.rect(margin, currentY, pageWidth - 2 * margin, 12, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Date & Time:', margin + 3, currentY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${dateStr} | ${timeStr}`, margin + 30, currentY + 5);

  doc.setFont('helvetica', 'bold');
  doc.text('Transit ID:', pageWidth - margin - 60, currentY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(transitId, pageWidth - margin - 35, currentY + 5);

  doc.setFont('helvetica', 'bold');
  doc.text('Status:', margin + 3, currentY + 9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 128, 0);
  doc.text('IN TRANSIT', margin + 30, currentY + 9);
  doc.setTextColor(0, 0, 0);

  currentY += 15;

  // ===== ORIGIN & DESTINATION SECTION =====
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('SHIPMENT DETAILS', margin, currentY);
  currentY += 6;

  const origin = batchType === 'store_to_factory' ? store : factory;
  const destination = batchType === 'store_to_factory' ? factory : store;

  // Origin Box
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.rect(margin, currentY, (pageWidth - 2 * margin - 5) / 2, 28);

  doc.setFillColor(52, 152, 219);
  doc.rect(margin, currentY, (pageWidth - 2 * margin - 5) / 2, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('FROM (ORIGIN)', margin + 3, currentY + 4);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(origin.name, margin + 3, currentY + 10);
  doc.setFont('helvetica', 'normal');

  const originLines = doc.splitTextToSize(origin.address, 80);
  doc.text(originLines, margin + 3, currentY + 14);

  doc.setFontSize(7);
  doc.text(`Phone: ${origin.phone}`, margin + 3, currentY + 22);
  doc.text(`Code: ${batchType === 'store_to_factory' ? (origin as StoreDetails).storeCode : (origin as FactoryDetails).factoryCode}`, margin + 3, currentY + 26);

  // Destination Box
  const destX = margin + (pageWidth - 2 * margin - 5) / 2 + 5;
  doc.rect(destX, currentY, (pageWidth - 2 * margin - 5) / 2, 28);

  doc.setFillColor(231, 76, 60);
  doc.rect(destX, currentY, (pageWidth - 2 * margin - 5) / 2, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('TO (DESTINATION)', destX + 3, currentY + 4);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(destination.name, destX + 3, currentY + 10);
  doc.setFont('helvetica', 'normal');

  const destLines = doc.splitTextToSize(destination.address, 80);
  doc.text(destLines, destX + 3, currentY + 14);

  doc.setFontSize(7);
  doc.text(`Phone: ${destination.phone}`, destX + 3, currentY + 22);
  doc.text(`Code: ${batchType === 'store_to_factory' ? (destination as FactoryDetails).factoryCode : (destination as StoreDetails).storeCode}`, destX + 3, currentY + 26);

  currentY += 32;

  // ===== EMPLOYEE & VEHICLE DETAILS =====
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PERSONNEL & VEHICLE DETAILS', margin, currentY);
  currentY += 6;

  // Employee Details Box
  doc.setDrawColor(0);
  doc.rect(margin, currentY, (pageWidth - 2 * margin - 5) / 2, 24);

  doc.setFillColor(155, 89, 182);
  doc.rect(margin, currentY, (pageWidth - 2 * margin - 5) / 2, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('EMPLOYEE DETAILS', margin + 3, currentY + 4);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.text(`Name: ${employee.name}`, margin + 3, currentY + 10);
  doc.text(`ID: ${employee.employeeId}`, margin + 3, currentY + 14);
  doc.text(`Designation: ${employee.designation}`, margin + 3, currentY + 18);
  doc.text(`Phone: ${employee.phone}`, margin + 3, currentY + 22);

  // Vehicle & Driver Details Box
  doc.rect(destX, currentY, (pageWidth - 2 * margin - 5) / 2, 24);

  doc.setFillColor(230, 126, 34);
  doc.rect(destX, currentY, (pageWidth - 2 * margin - 5) / 2, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('VEHICLE & DRIVER DETAILS', destX + 3, currentY + 4);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.text(`Driver: ${vehicle.driverName}`, destX + 3, currentY + 10);
  doc.text(`Vehicle: ${vehicle.vehicleNumber}`, destX + 3, currentY + 14);
  doc.text(`Type: ${vehicle.vehicleType}`, destX + 3, currentY + 18);
  doc.text(`License: ${vehicle.driverLicense}`, destX + 3, currentY + 22);

  currentY += 28;

  // ===== ORDER DETAILS TABLE =====
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('ORDER DETAILS', margin, currentY);
  currentY += 2;

  const totalItems = orders.reduce((sum, order) => sum + order.itemCount, 0);
  const totalWeight = orders.reduce((sum, order) => sum + (order.weight || 0), 0);

  const tableData = orders.map((order, index) => [
    (index + 1).toString(),
    order.orderNumber,
    order.customerName,
    order.customerId,
    order.serviceType || 'Dry Clean',
    order.itemCount.toString(),
    order.weight ? order.weight.toFixed(1) + ' kg' : 'N/A',
  ]);

  autoTable(doc, {
    startY: currentY + 2,
    head: [['#', 'Order ID', 'Customer Name', 'Customer ID', 'Service', 'Items', 'Weight']],
    body: tableData,
    foot: [['', '', 'TOTAL', '', '', totalItems.toString(), totalWeight.toFixed(1) + ' kg']],
    theme: 'grid',
    headStyles: {
      fillColor: [52, 73, 94],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7,
    },
    footStyles: {
      fillColor: [236, 240, 241],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 30 },
      2: { cellWidth: 40 },
      3: { cellWidth: 30 },
      4: { cellWidth: 25 },
      5: { cellWidth: 15, halign: 'center' },
      6: { cellWidth: 20, halign: 'center' },
    },
    margin: { left: margin, right: margin },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // ===== SIGNATURE SECTION =====
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('SIGNATURES', margin, currentY);
  currentY += 6;

  const signBoxWidth = (pageWidth - 2 * margin - 10) / 3;
  const signBoxHeight = 30;

  // Store Manager Signature
  doc.setDrawColor(0);
  doc.rect(margin, currentY, signBoxWidth, signBoxHeight);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Store Manager', margin + signBoxWidth / 2, currentY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(store.managerName, margin + signBoxWidth / 2, currentY + 8, { align: 'center' });

  doc.setDrawColor(150);
  doc.line(margin + 3, currentY + signBoxHeight - 10, margin + signBoxWidth - 3, currentY + signBoxHeight - 10);
  doc.setFontSize(6);
  doc.text('Signature & Date', margin + signBoxWidth / 2, currentY + signBoxHeight - 5, { align: 'center' });
  doc.text('Name:', margin + 3, currentY + signBoxHeight - 2);

  // Driver Signature
  const driverX = margin + signBoxWidth + 5;
  doc.rect(driverX, currentY, signBoxWidth, signBoxHeight);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Driver', driverX + signBoxWidth / 2, currentY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(vehicle.driverName, driverX + signBoxWidth / 2, currentY + 8, { align: 'center' });

  doc.line(driverX + 3, currentY + signBoxHeight - 10, driverX + signBoxWidth - 3, currentY + signBoxHeight - 10);
  doc.setFontSize(6);
  doc.text('Signature & Date', driverX + signBoxWidth / 2, currentY + signBoxHeight - 5, { align: 'center' });
  doc.text('Name:', driverX + 3, currentY + signBoxHeight - 2);

  // Factory Manager Signature
  const factoryX = driverX + signBoxWidth + 5;
  doc.rect(factoryX, currentY, signBoxWidth, signBoxHeight);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Factory Manager', factoryX + signBoxWidth / 2, currentY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(factory.managerName, factoryX + signBoxWidth / 2, currentY + 8, { align: 'center' });

  doc.line(factoryX + 3, currentY + signBoxHeight - 10, factoryX + signBoxWidth - 3, currentY + signBoxHeight - 10);
  doc.setFontSize(6);
  doc.text('Signature & Date', factoryX + signBoxWidth / 2, currentY + signBoxHeight - 5, { align: 'center' });
  doc.text('Name:', factoryX + 3, currentY + signBoxHeight - 2);

  currentY += signBoxHeight + 8;

  // ===== IMPORTANT NOTES =====
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('IMPORTANT NOTES:', margin, currentY);
  currentY += 5;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const notes = [
    '1. Please verify all items before accepting the shipment.',
    '2. Any damages or missing items must be reported immediately.',
    '3. This document must be signed by all parties involved.',
    '4. Keep this copy for your records.',
    '5. Scan the barcode at destination to update order status.',
  ];

  notes.forEach((note) => {
    doc.text(note, margin + 2, currentY);
    currentY += 4;
  });

  // ===== FOOTER =====
  doc.setDrawColor(52, 73, 94);
  doc.setLineWidth(0.5);
  doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

  doc.setFontSize(7);
  doc.setTextColor(100);
  doc.text('FabZ Clean - Laundry Management System', pageWidth / 2, pageHeight - 10, { align: 'center' });
  doc.text(`Generated on ${dateStr} at ${timeStr}`, pageWidth / 2, pageHeight - 6, { align: 'center' });
  doc.text('This is a computer-generated document. For any queries, contact support.', pageWidth / 2, pageHeight - 3, { align: 'center' });

  // Save PDF
  doc.save(`Transit_${transitId}_${dateStr.replace(/\//g, '-')}.pdf`);

  return doc;
};

export default function TransitOrdersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { employee } = useAuth();

  // State for current batch
  const [currentBatch, setCurrentBatch] = useState<OrderInBatch[]>([]);
  const [batchType, setBatchType] = useState<'store_to_factory' | 'factory_to_store'>('store_to_factory');
  const [showAddOrderDialog, setShowAddOrderDialog] = useState(false);
  const [searchOrdersQuery, setSearchOrdersQuery] = useState('');
  const [selectedEligibleOrders, setSelectedEligibleOrders] = useState<string[]>([]);

  // Dialog states
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [orderToRemove, setOrderToRemove] = useState<string | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
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

  // Fetch eligible orders for adding to batch
  const { data: eligibleOrders = [], isLoading: isLoadingEligible } = useQuery({
    queryKey: ['eligible-transit-orders', batchType, employee?.franchiseId],
    queryFn: async () => {
      if (!employee?.franchiseId) return [];
      const response = await fetch(`/api/transit-orders/eligible?type=${batchType === 'store_to_factory' ? 'To Factory' : 'Return to Store'}&franchiseId=${employee.franchiseId}`);
      if (!response.ok) throw new Error('Failed to fetch eligible orders');
      return response.json();
    },
    enabled: showAddOrderDialog && !!employee?.franchiseId
  });

  // Fetch transit history
  const { data: transitHistory = [], isLoading: isLoadingHistory } = useQuery<TransitBatch[]>({
    queryKey: ['transit-batches', employee?.franchiseId],
    queryFn: async () => {
      const url = employee?.franchiseId
        ? `/api/transit-orders?franchiseId=${employee.franchiseId}`
        : `/api/transit-orders`;

      const response = await fetch(url);
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
        status: order.status.toLowerCase().replace(' ', '_'),
        orders: order.orders || [], // In real app, might need to fetch items separately if not included
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
      id: o.id
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
      if (!employee?.franchiseId) {
        toast({ title: "Error", description: "Employee franchise ID missing", variant: "destructive" });
        return;
      }

      const storeDetails: StoreDetails = {
        name: 'FabZ Clean - Store',
        address: '123 Main Street',
        phone: '+91 98765 43210',
        managerName: 'Manager',
        storeCode: 'STR001',
      };

      const factoryDetails: FactoryDetails = {
        name: 'FabZ Clean - Factory',
        address: '456 Ind Area',
        phone: '+91 98765 43211',
        managerName: 'Manager',
        factoryCode: 'FAC001',
      };

      const transitReqData = {
        type: batchType === 'store_to_factory' ? 'To Factory' : 'Return to Store',
        vehicleNumber: transitDetails.vehicleNumber,
        vehicleType: transitDetails.vehicleType,
        driverName: transitDetails.driverName,
        driverPhone: transitDetails.driverPhone,
        driverLicense: transitDetails.driverLicense,
        employeeId: employee.id, // Auth Context ID
        franchiseId: employee.franchiseId,
        employeeName: employee.username,
        employeePhone: employee.phone,
        designation: employee.role,
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transitReqData),
      });

      if (!response.ok) throw new Error('Failed to create transit order');
      const result = await response.json();

      // Generate PDF
      generateTransitPDF(
        result.transitId,
        currentBatch,
        batchType,
        transitDetails.employeeName,
        storeDetails,
        factoryDetails,
        { ...transitDetails },
        {
          name: transitDetails.employeeName,
          employeeId: transitDetails.employeeId,
          designation: transitDetails.designation,
          phone: transitDetails.employeePhone
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
      console.error('Failed to create transit:', error);
      toast({
        title: 'Error',
        description: 'Failed to create transit order.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStatus = async (batchId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/transit-orders/${batchId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
            <Select value={batchType} onValueChange={(value: any) => { setBatchType(value); setCurrentBatch([]); }}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="store_to_factory"><div className="flex items-center gap-2"><Store className="h-4 w-4" /> Store → Factory</div></SelectItem>
                <SelectItem value="factory_to_store"><div className="flex items-center gap-2"><Factory className="h-4 w-4" /> Factory → Store</div></SelectItem>
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
            </DialogHeader>
            {selectedBatch && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><strong>Type:</strong> {selectedBatch.type}</div>
                  <div><strong>Status:</strong> {selectedBatch.status}</div>
                  <div><strong>Created By:</strong> {selectedBatch.createdBy}</div>
                  <div><strong>Vehicle:</strong> {selectedBatch.vehicleDetails?.vehicleNumber}</div>
                </div>
                <div className="border rounded-md p-2 max-h-[200px] overflow-y-auto">
                  <h4 className="font-semibold mb-2">Orders</h4>
                  <ul className="text-sm space-y-1">
                    {selectedBatch.orders.map((o, i) => (
                      <li key={i}>{o.orderNumber} - {o.customerName}</li>
                    ))}
                  </ul>
                </div>
                {/* Action Buttons */}
                <div className="flex justify-end gap-2">
                  {selectedBatch.status === 'in_transit' && (
                    <>
                      <Button onClick={() => handleUpdateStatus(selectedBatch.id, 'Received')}>Mark as Received</Button>
                      <Button onClick={() => handleUpdateStatus(selectedBatch.id, 'Completed')} variant="default">Mark Completed</Button>
                    </>
                  )}
                  {selectedBatch.status !== 'in_transit' && (
                    <Button variant="outline" disabled>
                      {selectedBatch.status}
                    </Button>
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
            <DialogHeader><DialogTitle>Confirm Transit</DialogTitle></DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label>Vehicle Number</Label>
                <Input value={transitDetails.vehicleNumber} onChange={e => setTransitDetails({ ...transitDetails, vehicleNumber: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Driver Name</Label>
                <Input value={transitDetails.driverName} onChange={e => setTransitDetails({ ...transitDetails, driverName: e.target.value })} />
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

      </div>
    </PageTransition>
  );
}
