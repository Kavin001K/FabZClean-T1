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

// PDF Generation with Barcode
const generateTransitPDF = (
  transitId: string,
  orders: OrderInBatch[],
  batchType: 'store_to_factory' | 'factory_to_store',
  createdBy: string = 'Current User'
) => {
  const doc = new jsPDF();

  // Generate barcode as data URL
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, transitId, {
    format: 'CODE128',
    width: 2,
    height: 60,
    displayValue: true,
    fontSize: 14,
    textMargin: 5,
  });
  const barcodeDataUrl = canvas.toDataURL('image/png');

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('TRANSIT COPY', 105, 20, { align: 'center' });

  // Transit ID Barcode
  doc.addImage(barcodeDataUrl, 'PNG', 55, 30, 100, 25);

  // Transit Information
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString();

  const origin = batchType === 'store_to_factory' ? 'Store #1' : 'Central Factory';
  const destination = batchType === 'store_to_factory' ? 'Central Factory' : 'Store #1';

  // Information box
  doc.setDrawColor(200);
  doc.setFillColor(250, 250, 250);
  doc.rect(15, 65, 180, 35, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.text('Transit Type:', 20, 72);
  doc.setFont('helvetica', 'normal');
  doc.text(batchType === 'store_to_factory' ? 'Store → Factory' : 'Factory → Store', 60, 72);

  doc.setFont('helvetica', 'bold');
  doc.text('Origin:', 20, 80);
  doc.setFont('helvetica', 'normal');
  doc.text(origin, 60, 80);

  doc.setFont('helvetica', 'bold');
  doc.text('Destination:', 20, 88);
  doc.setFont('helvetica', 'normal');
  doc.text(destination, 60, 88);

  doc.setFont('helvetica', 'bold');
  doc.text('Date:', 120, 72);
  doc.setFont('helvetica', 'normal');
  doc.text(dateStr, 150, 72);

  doc.setFont('helvetica', 'bold');
  doc.text('Time:', 120, 80);
  doc.setFont('helvetica', 'normal');
  doc.text(timeStr, 150, 80);

  doc.setFont('helvetica', 'bold');
  doc.text('Created By:', 120, 88);
  doc.setFont('helvetica', 'normal');
  doc.text(createdBy, 150, 88);

  doc.setFont('helvetica', 'bold');
  doc.text('Total Orders:', 20, 96);
  doc.setFont('helvetica', 'normal');
  doc.text(orders.length.toString(), 60, 96);

  const totalItems = orders.reduce((sum, order) => sum + order.itemCount, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Items:', 120, 96);
  doc.setFont('helvetica', 'normal');
  doc.text(totalItems.toString(), 150, 96);

  // Order Table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Order Details', 20, 110);

  const tableData = orders.map((order, index) => [
    (index + 1).toString(),
    order.orderNumber,
    order.customerId,
    order.customerName,
    order.itemCount.toString(),
  ]);

  autoTable(doc, {
    startY: 115,
    head: [['#', 'Order ID', 'Customer ID', 'Customer Name', 'Items']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [66, 66, 66],
      fontSize: 9,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 35 },
      2: { cellWidth: 40 },
      3: { cellWidth: 60 },
      4: { cellWidth: 20, halign: 'center' },
    },
  });

  // Signature section
  const finalY = (doc as any).lastAutoTable.finalY || 200;

  doc.setDrawColor(200);
  doc.line(15, finalY + 40, 85, finalY + 40);
  doc.line(110, finalY + 40, 180, finalY + 40);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Store Manager Signature', 50, finalY + 45, { align: 'center' });
  doc.text('Factory Manager Signature', 145, finalY + 45, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Date: _______________', 20, finalY + 52);
  doc.text('Date: _______________', 115, finalY + 52);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128);
  doc.text('This is a computer-generated document. Please verify all items upon receipt.', 105, 285, {
    align: 'center',
  });

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

  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Mock data - replace with actual API call
  const { data: transitHistory = [], isLoading } = useQuery<TransitBatch[]>({
    queryKey: ['transit-batches'],
    queryFn: async () => {
      return [
        {
          id: '1',
          transitId: 'TRN-2025-001',
          type: 'store_to_factory',
          origin: 'Store #1',
          destination: 'Central Factory',
          createdBy: 'John Doe',
          createdAt: '2025-01-15T10:30:00Z',
          status: 'completed',
          orders: [],
          itemCount: 15,
        },
      ];
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

    // Mock validation - replace with actual API call
    // In real implementation, fetch order details from API
    const mockOrder: OrderInBatch = {
      orderNumber: orderId,
      customerId: `CUST-${Math.random().toString(36).substr(2, 9)}`,
      customerName: `Customer ${currentBatch.length + 1}`,
      itemCount: Math.floor(Math.random() * 10) + 1,
      status: batchType === 'store_to_factory' ? 'in_store' : 'processing',
    };

    playSuccessSound();
    setCurrentBatch([...currentBatch, mockOrder]);
    setBarcodeInput('');
    barcodeInputRef.current?.focus();

    toast({
      title: 'Order Added',
      description: `Order ${orderId} added to batch`,
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

    // Generate Transit ID
    const transitId = `TRN-${Date.now().toString().slice(-6)}`;

    try {
      // Generate PDF with barcode
      generateTransitPDF(transitId, currentBatch, batchType, 'Current User');

      // In real implementation:
      // 1. Create transit batch in database via API
      // 2. Update all order statuses
      // await fetch('/api/transit-batches', {
      //   method: 'POST',
      //   body: JSON.stringify({ transitId, orders: currentBatch, type: batchType })
      // });

      toast({
        title: 'Transit Copy Generated',
        description: `Transit ID: ${transitId} - PDF downloaded successfully`,
      });

      // Reset batch
      setCurrentBatch([]);
      setIsScanning(false);
      setBarcodeInput('');

      // Refresh transit history
      queryClient.invalidateQueries({ queryKey: ['transit-batches'] });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate transit copy',
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
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Transit Batch Details</DialogTitle>
              <DialogDescription>
                {selectedBatch?.transitId} - {selectedBatch?.type === 'store_to_factory' ? 'Store to Factory' : 'Factory to Store'}
              </DialogDescription>
            </DialogHeader>
            {selectedBatch && (
              <div className="space-y-4">
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
                </div>
                <Separator />
                <div>
                  <Label>Transit Barcode</Label>
                  <div className="mt-2 p-4 bg-muted rounded-lg text-center">
                    <Barcode className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-xl font-mono font-bold">{selectedBatch.transitId}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                Close
              </Button>
              <Button
                className="gap-2"
                onClick={() => {
                  if (selectedBatch) {
                    generateTransitPDF(
                      selectedBatch.transitId,
                      selectedBatch.orders,
                      selectedBatch.type,
                      selectedBatch.createdBy
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
      </div>
    </PageTransition>
  );
}
