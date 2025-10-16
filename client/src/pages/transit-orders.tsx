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
  status: 'in_transit' | 'completed';
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
  audio.play().catch(() => {});
};

const playErrorSound = () => {
  const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm01IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ0PVK3n77BdGAg+ltjyvW0gBSyBzvLZiTYIGWi77eeeTRAMUKnk8LdlHAU4kNfyzHksBSR3x/DdkEAKFF606+uoVRQKRp/g8r5sIQUxh9Hz04IzBh5uwO/jmVENEFSu5++wXRgI');
  audio.play().catch(() => {});
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
              className={`absolute -left-[29px] mt-1.5 h-4 w-4 rounded-full border-2 ${
                index === 0 ? 'bg-primary border-primary' : 'bg-background border-muted'
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
  doc.text(`Code: ${batchType === 'store_to_factory' ? origin.storeCode : origin.factoryCode}`, margin + 3, currentY + 26);

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
  doc.text(`Code: ${batchType === 'store_to_factory' ? destination.factoryCode : destination.storeCode}`, destX + 3, currentY + 26);

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
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // State for current batch
  const [currentBatch, setCurrentBatch] = useState<OrderInBatch[]>([]);
  const [batchType, setBatchType] = useState<'store_to_factory' | 'factory_to_store'>('store_to_factory');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);

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
    employeeName: 'Current User',
    employeeId: 'EMP001',
    designation: 'Store Executive',
    employeePhone: '+91 98765 43213',
  });

  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch recent orders for smart suggestions
  const { data: recentOrders = [], isLoading: isLoadingRecentOrders } = useQuery({
    queryKey: ['recent-orders', batchType],
    queryFn: async () => {
      const response = await fetch('/api/orders/recent');
      if (!response.ok) {
        throw new Error('Failed to fetch recent orders');
      }
      const allOrders = await response.json();

      // Filter orders based on batch type and appropriate statuses
      const validStatuses = batchType === 'store_to_factory'
        ? ['in_store', 'ready_for_transit', 'pending']
        : ['processing', 'completed', 'ready_for_delivery'];

      return allOrders
        .filter((order: any) => validStatuses.includes(order.status))
        .slice(0, 10); // Show last 10 recent orders
    },
    enabled: isScanning, // Only fetch when scanning is active
  });

  // Fetch transit orders from API
  const { data: transitHistory = [], isLoading } = useQuery<TransitBatch[]>({
    queryKey: ['transit-batches'],
    queryFn: async () => {
      const response = await fetch('/api/transit-orders');
      if (!response.ok) {
        throw new Error('Failed to fetch transit orders');
      }
      const data = await response.json();
      // Map database format to component format
      return data.map((order: any) => ({
        id: order.id,
        transitId: order.transitId,
        type: order.type,
        origin: order.origin,
        destination: order.destination,
        createdBy: order.createdBy,
        createdAt: order.createdAt,
        status: order.status,
        orders: order.orders || [],
        itemCount: order.totalItems || 0,
        storeDetails: order.storeDetails,
        factoryDetails: order.factoryDetails,
        vehicleDetails: order.vehicleNumber ? {
          vehicleNumber: order.vehicleNumber,
          vehicleType: order.vehicleType,
          driverName: order.driverName,
          driverPhone: order.driverPhone,
          driverLicense: order.driverLicense,
        } : undefined,
        employeeDetails: order.employeeName ? {
          name: order.employeeName,
          employeeId: order.employeeId,
          designation: order.designation,
          phone: order.employeePhone,
        } : undefined,
      }));
    },
  });

  // Auto-focus barcode input when scanning starts
  useEffect(() => {
    if (isScanning && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [isScanning]);

  const handleStartNewBatch = () => {
    if (currentBatch.length > 0) {
      setShowClearConfirm(true);
    } else {
      startNewBatch();
    }
  };

  const startNewBatch = () => {
    setCurrentBatch([]);
    setBarcodeInput('');
    setIsScanning(true);
    setShowClearConfirm(false);
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 100);
  };

  const handleQuickAddOrder = async (orderData: any) => {
    // Check if already in batch
    if (currentBatch.some((order) => order.orderNumber === orderData.orderNumber)) {
      playErrorSound();
      toast({
        title: 'Already Added',
        description: 'Order already in batch',
        variant: 'destructive',
      });
      return;
    }

    // Calculate total items and weight from order items
    const itemCount = orderData.items?.length || 0;
    const totalWeight = orderData.items?.reduce((sum: number, item: any) => sum + (item.weight || 0), 0) || 0;

    const orderInBatch: OrderInBatch = {
      orderNumber: orderData.orderNumber,
      customerId: orderData.customerId,
      customerName: orderData.customerName,
      itemCount: itemCount,
      status: orderData.status,
      serviceType: orderData.serviceType || 'Dry Clean',
      weight: parseFloat(totalWeight.toFixed(1)),
    };

    playSuccessSound();
    setCurrentBatch([...currentBatch, orderInBatch]);

    toast({
      title: 'Order Added',
      description: `Order ${orderData.orderNumber} added to batch (${itemCount} items)`,
    });
  };

  const handleAddOrder = async () => {
    if (!barcodeInput.trim()) return;

    const orderId = barcodeInput.trim();

    // Check if already in batch
    if (currentBatch.some((order) => order.orderNumber === orderId)) {
      playErrorSound();
      toast({
        title: 'Error',
        description: 'Order already in batch',
        variant: 'destructive',
      });
      setBarcodeInput('');
      return;
    }

    try {
      // Fetch order details from API
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) {
        playErrorSound();
        toast({
          title: 'Error',
          description: 'Order not found',
          variant: 'destructive',
        });
        setBarcodeInput('');
        return;
      }

      const orderData = await response.json();

      // Validate order status for transit type
      const validStatuses = batchType === 'store_to_factory'
        ? ['in_store', 'ready_for_transit', 'pending']
        : ['processing', 'completed', 'ready_for_delivery'];

      if (!validStatuses.includes(orderData.status)) {
        playErrorSound();
        toast({
          title: 'Invalid Order Status',
          description: `Order status "${orderData.status}" is not valid for ${batchType === 'store_to_factory' ? 'store to factory' : 'factory to store'} transit`,
          variant: 'destructive',
        });
        setBarcodeInput('');
        return;
      }

      // Calculate total items and weight from order items
      const itemCount = orderData.items?.length || 0;
      const totalWeight = orderData.items?.reduce((sum: number, item: any) => sum + (item.weight || 0), 0) || 0;

      const orderInBatch: OrderInBatch = {
        orderNumber: orderData.orderNumber,
        customerId: orderData.customerId,
        customerName: orderData.customerName,
        itemCount: itemCount,
        status: orderData.status,
        serviceType: orderData.serviceType || 'Dry Clean',
        weight: parseFloat(totalWeight.toFixed(1)),
      };

      playSuccessSound();
      setCurrentBatch([...currentBatch, orderInBatch]);
      setBarcodeInput('');
      barcodeInputRef.current?.focus();

      toast({
        title: 'Order Added',
        description: `Order ${orderId} added to batch (${itemCount} items)`,
      });
    } catch (error) {
      playErrorSound();
      toast({
        title: 'Error',
        description: 'Failed to fetch order details',
        variant: 'destructive',
      });
      setBarcodeInput('');
    }
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

    // Show dialog to collect vehicle and employee details
    setShowTransitDetailsDialog(true);
  };

  const confirmGenerateTransitCopy = async () => {
    // Generate Transit ID
    const transitId = `TRN-${Date.now().toString().slice(-6)}`;

    try {
      // Prepare details
      const storeDetails: StoreDetails = {
        name: 'FabZ Clean - Store #1',
        address: '123 Main Street, Bangalore - 560001',
        phone: '+91 98765 43210',
        managerName: 'Rajesh Kumar',
        storeCode: 'STR001',
      };

      const factoryDetails: FactoryDetails = {
        name: 'FabZ Clean - Central Factory',
        address: '456 Industrial Area, Bangalore - 560099',
        phone: '+91 98765 43211',
        managerName: 'Suresh Patel',
        factoryCode: 'FAC001',
      };

      const vehicleDetails: VehicleDetails = {
        vehicleNumber: transitDetails.vehicleNumber,
        vehicleType: transitDetails.vehicleType,
        driverName: transitDetails.driverName,
        driverPhone: transitDetails.driverPhone,
        driverLicense: transitDetails.driverLicense,
      };

      const employeeDetails: EmployeeDetails = {
        name: transitDetails.employeeName,
        employeeId: transitDetails.employeeId,
        designation: transitDetails.designation,
        phone: transitDetails.employeePhone,
      };

      // Calculate totals
      const totalOrders = currentBatch.length;
      const totalItems = currentBatch.reduce((sum, order) => sum + order.itemCount, 0);
      const totalWeight = currentBatch.reduce((sum, order) => sum + (order.weight || 0), 0);

      // Prepare transit order data for database
      const transitOrderData = {
        transitId,
        type: batchType,
        status: 'in_transit',
        origin: batchType === 'store_to_factory' ? storeDetails.name : factoryDetails.name,
        destination: batchType === 'store_to_factory' ? factoryDetails.name : storeDetails.name,
        createdBy: employeeDetails.name,
        vehicleNumber: vehicleDetails.vehicleNumber,
        vehicleType: vehicleDetails.vehicleType,
        driverName: vehicleDetails.driverName,
        driverPhone: vehicleDetails.driverPhone,
        driverLicense: vehicleDetails.driverLicense,
        employeeName: employeeDetails.name,
        employeeId: employeeDetails.employeeId,
        designation: employeeDetails.designation,
        employeePhone: employeeDetails.phone,
        totalOrders,
        totalItems,
        totalWeight,
        orders: currentBatch,
        storeDetails,
        factoryDetails,
      };

      // Create transit order in database
      const response = await fetch('/api/transit-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transitOrderData),
      });

      if (!response.ok) {
        throw new Error('Failed to create transit order');
      }

      const createdTransitOrder = await response.json();

      // Update all order statuses based on transit type
      // Store to Factory: pending/in_store → processing (when transit created)
      // Factory to Store: Keep current status until delivered
      const statusUpdatePromises = currentBatch.map((order) => {
        const newOrderStatus = batchType === 'store_to_factory' ? 'processing' : order.status;

        return fetch(`/api/orders/${order.orderNumber}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: newOrderStatus,
            notes: batchType === 'store_to_factory'
              ? `Added to transit ${transitId} - Processing started at factory`
              : `Added to transit ${transitId} - Returning to store`,
            updatedBy: employeeDetails.name,
          }),
        });
      });

      await Promise.all(statusUpdatePromises);

      // Generate PDF with all details
      generateTransitPDF(
        transitId,
        currentBatch,
        batchType,
        transitDetails.employeeName,
        storeDetails,
        factoryDetails,
        vehicleDetails,
        employeeDetails
      );

      toast({
        title: 'Transit Order Created',
        description: `Transit ID: ${transitId} - PDF downloaded and ${totalOrders} orders updated`,
        duration: 5000,
      });

      // Reset batch
      setCurrentBatch([]);
      setIsScanning(false);
      setBarcodeInput('');
      setShowTransitDetailsDialog(false);

      // Refresh transit history
      queryClient.invalidateQueries({ queryKey: ['transit-batches'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    } catch (error) {
      console.error('Failed to create transit order:', error);
      toast({
        title: 'Error',
        description: 'Failed to create transit order. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const totalItems = currentBatch.reduce((sum, order) => sum + order.itemCount, 0);

  const filteredHistory = transitHistory.filter((batch) => {
    const matchesSearch = batch.transitId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || batch.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    inTransit: transitHistory.filter((b) => b.status === 'in_transit').length,
    completed: transitHistory.filter((b) => b.status === 'completed').length,
    storeToFactory: transitHistory.filter((b) => b.type === 'store_to_factory').length,
    factoryToStore: transitHistory.filter((b) => b.type === 'factory_to_store').length,
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
              <Truck className="h-10 w-10 text-primary" />
              Transit Order Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Create transit batches for store-to-factory and factory-to-store shipments
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={batchType} onValueChange={(value: any) => setBatchType(value)}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="store_to_factory">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    Store → Factory
                  </div>
                </SelectItem>
                <SelectItem value="factory_to_store">
                  <div className="flex items-center gap-2">
                    <Factory className="h-4 w-4" />
                    Factory → Store
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleStartNewBatch} size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Start New Transit Batch
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">In Transit</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.inTransit}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Store → Factory</CardTitle>
              <Store className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.storeToFactory}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Factory → Store</CardTitle>
              <Factory className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.factoryToStore}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Current Batch Creation */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Barcode className="h-5 w-5" />
                Current Batch
                {currentBatch.length > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {currentBatch.length} orders • {totalItems} items
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Scan order barcodes to add them to the current transit batch
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Barcode Input */}
              <div className="space-y-2">
                <Label htmlFor="barcode-input">Scan or Enter Order ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="barcode-input"
                    ref={barcodeInputRef}
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddOrder();
                      }
                    }}
                    placeholder="Scan barcode or type Order ID..."
                    disabled={!isScanning}
                    className="flex-1"
                    autoFocus
                  />
                  <Button onClick={handleAddOrder} disabled={!isScanning || !barcodeInput.trim()}>
                    Add
                  </Button>
                </div>
              </div>

              {/* Recent Orders Smart Suggestions */}
              {isScanning && recentOrders.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Quick Add - Recent Orders</Label>
                    <Badge variant="outline" className="text-xs">
                      {recentOrders.length} suggested
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-2 border rounded-lg bg-muted/30">
                    {recentOrders.map((order: any) => (
                      <motion.div
                        key={order.orderNumber}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-2 rounded-md border-2 transition-all cursor-pointer ${
                          currentBatch.some(b => b.orderNumber === order.orderNumber)
                            ? 'border-green-500 bg-green-50 opacity-50 cursor-not-allowed'
                            : 'border-border bg-background hover:border-primary hover:shadow-sm'
                        }`}
                        onClick={() => handleQuickAddOrder(order)}
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-semibold">{order.orderNumber}</span>
                            {currentBatch.some(b => b.orderNumber === order.orderNumber) && (
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground truncate">{order.customerName}</span>
                          <div className="flex items-center justify-between text-xs">
                            <Badge variant="secondary" className="text-[10px] px-1 py-0">
                              {order.items?.length || 0} items
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Batch List */}
              {currentBatch.length > 0 ? (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-center">Items</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {currentBatch.map((order, index) => (
                          <motion.tr
                            key={order.orderNumber}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="border-b"
                          >
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell>{order.orderNumber}</TableCell>
                            <TableCell>{order.customerName}</TableCell>
                            <TableCell className="text-center">{order.itemCount} pcs</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveOrder(order.orderNumber)}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-12 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No orders in batch</p>
                  <p className="text-sm">
                    {isScanning
                      ? 'Scan order barcodes to add them to this batch'
                      : 'Click "Start New Transit Batch" to begin'}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleGenerateTransitCopy}
                  disabled={currentBatch.length === 0}
                  className="flex-1 gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Generate Transit Copy
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowClearConfirm(true)}
                  disabled={currentBatch.length === 0}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear Batch
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Right: Transit History */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Transit History
              </CardTitle>
              <CardDescription>View and reprint past transit batches</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by Transit ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* History List */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((batch) => (
                    <motion.div
                      key={batch.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{batch.transitId}</h4>
                            <Badge
                              variant={batch.status === 'completed' ? 'default' : 'secondary'}
                              className={
                                batch.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }
                            >
                              {batch.status === 'completed' ? 'Completed' : 'In Transit'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(batch.createdAt).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {batch.createdBy}
                            </div>
                            <div className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              {batch.itemCount} items
                            </div>
                            <div className="flex items-center gap-1">
                              {batch.type === 'store_to_factory' ? (
                                <>
                                  <Store className="h-3 w-3" />
                                  Store → Factory
                                </>
                              ) : (
                                <>
                                  <Factory className="h-3 w-3" />
                                  Factory → Store
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedBatch(batch);
                              setShowViewDialog(true);
                            }}
                            className="gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => {
                              generateTransitPDF(
                                batch.transitId,
                                batch.orders,
                                batch.type,
                                batch.createdBy
                              );
                              toast({
                                title: 'Transit Copy Printed',
                                description: `PDF for ${batch.transitId} downloaded successfully`,
                              });
                            }}
                          >
                            <Printer className="h-3 w-3" />
                            Print
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No transit batches found</p>
                    <p className="text-sm">Create your first transit batch to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clear Batch Confirmation Dialog */}
        <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear Current Batch?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to discard the current batch? All {currentBatch.length} scanned order(s)
                will be removed. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={startNewBatch} className="bg-destructive hover:bg-destructive/90">
                Yes, Clear Batch
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Remove Order Confirmation Dialog */}
        <AlertDialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Order from Batch?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove Order ID <strong>{orderToRemove}</strong> from this batch?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setOrderToRemove(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmRemoveOrder} className="bg-destructive hover:bg-destructive/90">
                Yes, Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* View Batch Details Dialog */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Transit Batch Details</DialogTitle>
              <DialogDescription>
                {selectedBatch?.transitId} - {selectedBatch?.type === 'store_to_factory' ? 'Store to Factory' : 'Factory to Store'}
              </DialogDescription>
            </DialogHeader>
            {selectedBatch && (
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="orders">Orders</TabsTrigger>
                  <TabsTrigger value="history">Status History</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Created By</Label>
                      <p className="font-medium">{selectedBatch.createdBy}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Date Created</Label>
                      <p className="font-medium">
                        {new Date(selectedBatch.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Origin</Label>
                      <p className="font-medium">{selectedBatch.origin}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Destination</Label>
                      <p className="font-medium">{selectedBatch.destination}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Status</Label>
                      <Badge
                        variant={selectedBatch.status === 'completed' ? 'default' : 'secondary'}
                        className={
                          selectedBatch.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {selectedBatch.status === 'completed' ? 'Completed' : 'In Transit'}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Total Orders</Label>
                      <p className="font-medium">{selectedBatch.orders?.length || 0}</p>
                    </div>
                  </div>
                  <Separator />
                  {selectedBatch.vehicleDetails && (
                    <>
                      <div>
                        <h4 className="font-semibold mb-2">Vehicle Details</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-muted-foreground">Vehicle Number</Label>
                            <p className="font-medium">{selectedBatch.vehicleDetails.vehicleNumber}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Vehicle Type</Label>
                            <p className="font-medium">{selectedBatch.vehicleDetails.vehicleType}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Driver Name</Label>
                            <p className="font-medium">{selectedBatch.vehicleDetails.driverName}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Driver Phone</Label>
                            <p className="font-medium">{selectedBatch.vehicleDetails.driverPhone}</p>
                          </div>
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}
                  <div>
                    <Label>Transit Barcode</Label>
                    <div className="mt-2 p-4 bg-muted rounded-lg text-center">
                      <Barcode className="h-12 w-12 mx-auto mb-2" />
                      <p className="text-xl font-mono font-bold">{selectedBatch.transitId}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="orders" className="mt-4">
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Service</TableHead>
                          <TableHead className="text-right">Items</TableHead>
                          <TableHead className="text-right">Weight</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedBatch.orders?.map((order, index) => (
                          <TableRow key={order.orderNumber}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell className="font-medium">{order.orderNumber}</TableCell>
                            <TableCell>{order.customerName}</TableCell>
                            <TableCell>{order.serviceType || 'Dry Clean'}</TableCell>
                            <TableCell className="text-right">{order.itemCount}</TableCell>
                            <TableCell className="text-right">
                              {order.weight ? `${order.weight.toFixed(1)} kg` : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                  <TransitStatusHistory transitOrderId={selectedBatch.id} />
                </TabsContent>
              </Tabs>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                Close
              </Button>
              {selectedBatch && selectedBatch.status === 'in_transit' && (
                <Button
                  className="gap-2"
                  onClick={async () => {
                    try {
                      // Update transit order status to completed
                      const response = await fetch(`/api/transit-orders/${selectedBatch.id}/status`, {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          status: 'completed',
                          notes: 'Transit completed and delivered',
                          updatedBy: 'Current User',
                        }),
                      });

                      if (!response.ok) {
                        throw new Error('Failed to update transit status');
                      }

                      // If factory to store transit, mark all orders as completed (ready for delivery)
                      if (selectedBatch.type === 'factory_to_store' && selectedBatch.orders) {
                        const orderStatusUpdates = selectedBatch.orders.map((order) =>
                          fetch(`/api/orders/${order.orderNumber}/status`, {
                            method: 'PATCH',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              status: 'ready_for_delivery',
                              notes: `Transit ${selectedBatch.transitId} completed - Returned from factory, ready for delivery`,
                              updatedBy: 'Current User',
                            }),
                          })
                        );

                        await Promise.all(orderStatusUpdates);

                        toast({
                          title: 'Transit Completed',
                          description: `Transit ${selectedBatch.transitId} completed and ${selectedBatch.orders.length} orders marked as ready for delivery`,
                        });
                      } else {
                        toast({
                          title: 'Transit Completed',
                          description: `Transit ${selectedBatch.transitId} marked as completed`,
                        });
                      }

                      setShowViewDialog(false);
                      queryClient.invalidateQueries({ queryKey: ['transit-batches'] });
                      queryClient.invalidateQueries({ queryKey: ['orders'] });
                    } catch (error) {
                      toast({
                        title: 'Error',
                        description: 'Failed to update transit status',
                        variant: 'destructive',
                      });
                    }
                  }}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark as Completed
                </Button>
              )}
              <Button
                className="gap-2"
                onClick={() => {
                  if (selectedBatch) {
                    generateTransitPDF(
                      selectedBatch.transitId,
                      selectedBatch.orders,
                      selectedBatch.type,
                      selectedBatch.createdBy,
                      selectedBatch.storeDetails,
                      selectedBatch.factoryDetails,
                      selectedBatch.vehicleDetails,
                      selectedBatch.employeeDetails
                    );
                    toast({
                      title: 'Transit Copy Reprinted',
                      description: `PDF for ${selectedBatch.transitId} downloaded successfully`,
                    });
                  }
                }}
              >
                <Printer className="h-4 w-4" />
                Reprint Transit Copy
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Transit Details Dialog - Collect Vehicle & Employee Info */}
        <Dialog open={showTransitDetailsDialog} onOpenChange={setShowTransitDetailsDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Transit Order Details
              </DialogTitle>
              <DialogDescription>
                Please provide vehicle and employee details for this transit order
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Vehicle Details Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-orange-600" />
                  <h3 className="text-lg font-semibold">Vehicle & Driver Details</h3>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicleNumber">Vehicle Number *</Label>
                    <Input
                      id="vehicleNumber"
                      value={transitDetails.vehicleNumber}
                      onChange={(e) => setTransitDetails({ ...transitDetails, vehicleNumber: e.target.value })}
                      placeholder="KA-01-AB-1234"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleType">Vehicle Type *</Label>
                    <Select
                      value={transitDetails.vehicleType}
                      onValueChange={(value) => setTransitDetails({ ...transitDetails, vehicleType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tempo Traveller">Tempo Traveller</SelectItem>
                        <SelectItem value="Mini Van">Mini Van</SelectItem>
                        <SelectItem value="Pickup Truck">Pickup Truck</SelectItem>
                        <SelectItem value="Small Van">Small Van</SelectItem>
                        <SelectItem value="Large Truck">Large Truck</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="driverName">Driver Name *</Label>
                    <Input
                      id="driverName"
                      value={transitDetails.driverName}
                      onChange={(e) => setTransitDetails({ ...transitDetails, driverName: e.target.value })}
                      placeholder="Enter driver name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="driverPhone">Driver Phone *</Label>
                    <Input
                      id="driverPhone"
                      value={transitDetails.driverPhone}
                      onChange={(e) => setTransitDetails({ ...transitDetails, driverPhone: e.target.value })}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="driverLicense">Driver License Number *</Label>
                    <Input
                      id="driverLicense"
                      value={transitDetails.driverLicense}
                      onChange={(e) => setTransitDetails({ ...transitDetails, driverLicense: e.target.value })}
                      placeholder="KA0120230012345"
                    />
                  </div>
                </div>
              </div>

              {/* Employee Details Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-semibold">Employee Details</h3>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employeeName">Employee Name *</Label>
                    <Input
                      id="employeeName"
                      value={transitDetails.employeeName}
                      onChange={(e) => setTransitDetails({ ...transitDetails, employeeName: e.target.value })}
                      placeholder="Enter employee name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employeeId">Employee ID *</Label>
                    <Input
                      id="employeeId"
                      value={transitDetails.employeeId}
                      onChange={(e) => setTransitDetails({ ...transitDetails, employeeId: e.target.value })}
                      placeholder="EMP001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="designation">Designation *</Label>
                    <Select
                      value={transitDetails.designation}
                      onValueChange={(value) => setTransitDetails({ ...transitDetails, designation: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Store Executive">Store Executive</SelectItem>
                        <SelectItem value="Store Manager">Store Manager</SelectItem>
                        <SelectItem value="Warehouse Manager">Warehouse Manager</SelectItem>
                        <SelectItem value="Logistics Coordinator">Logistics Coordinator</SelectItem>
                        <SelectItem value="Supervisor">Supervisor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employeePhone">Employee Phone *</Label>
                    <Input
                      id="employeePhone"
                      value={transitDetails.employeePhone}
                      onChange={(e) => setTransitDetails({ ...transitDetails, employeePhone: e.target.value })}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
              </div>

              {/* Batch Summary */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Batch Summary</h3>
                </div>
                <Separator />
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Transit Type:</span>
                    <span className="text-sm">{batchType === 'store_to_factory' ? 'Store → Factory' : 'Factory → Store'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total Orders:</span>
                    <span className="text-sm font-bold">{currentBatch.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total Items:</span>
                    <span className="text-sm font-bold">{totalItems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total Weight:</span>
                    <span className="text-sm font-bold">
                      {currentBatch.reduce((sum, order) => sum + (order.weight || 0), 0).toFixed(1)} kg
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowTransitDetailsDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmGenerateTransitCopy}
                className="gap-2"
                disabled={
                  !transitDetails.vehicleNumber ||
                  !transitDetails.driverName ||
                  !transitDetails.employeeName
                }
              >
                <Printer className="h-4 w-4" />
                Generate & Print Transit Copy
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
