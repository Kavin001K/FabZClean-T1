import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Zap,
  Bell,
  AlertTriangle,
  Grid3x3,
  List,
  Package,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Sparkles,
  DollarSign,
  ShoppingCart,
  Archive,
  Barcode,
  CheckCircle,
  XCircle,
  Plus,
  Minus,
  Search,
  Download,
  Upload,
  Settings,
  Filter,
  SlidersHorizontal,
  Eye,
  RotateCw
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
import { Input } from '@/components/ui/input';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import BarcodeDisplay from '@/components/barcode-display';

// Import child components
import { InventoryKPIs } from '@/components/inventory/inventory-kpis';
import { InventoryTable } from '@/components/inventory/inventory-table';
import { InventoryToolbar } from '@/components/inventory/inventory-toolbar';
import { InventoryDialogs } from '@/components/inventory/inventory-dialogs';
import { InventoryAudit } from '@/components/inventory/inventory-audit';

// Import hooks
import { useInventoryKPIs } from '@/hooks/use-inventory-kpis';
import { useInventoryFilters } from '@/hooks/use-inventory-filters';

// Import data service and types
import { inventoryApi, formatCurrency } from '@/lib/data-service';
import type { InventoryItem } from '@/lib/data-service';
import { exportToExcel } from '@/lib/excel-export';
import { exportInventoryEnhanced } from '@/lib/enhanced-pdf-export';
import { exportInventoryToExcel } from '@/lib/excel-exports';
import { cn } from '@/lib/utils';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  },
  hover: {
    scale: 1.02,
    transition: { duration: 0.2 }
  }
};

export default function Inventory() {
  // State for dialog management
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // View state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedBarcode, setSelectedBarcode] = useState<any>(null);
  const [isBarcodeDialogOpen, setIsBarcodeDialogOpen] = useState(false);
  const [isBulkStockDialogOpen, setIsBulkStockDialogOpen] = useState(false);
  const [bulkStockAmount, setBulkStockAmount] = useState(0);
  const [bulkStockOperation, setBulkStockOperation] = useState<'add' | 'subtract' | 'set'>('add');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<string>('all');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch inventory data with React Query
  const {
    data: inventory = [],
    isLoading: inventoryLoading,
    isError: inventoryError,
    error: inventoryErrorDetails,
  } = useQuery<InventoryItem[]>({
    queryKey: ['inventory-items'],
    queryFn: inventoryApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Fetch inventory KPIs
  const {
    data: kpiData,
    isLoading: kpisLoading,
    isError: kpisError,
  } = useInventoryKPIs();

  // Inventory filtering and search
  const {
    searchQuery,
    setSearchQuery,
    activeFilters,
    setActiveFilters,
    filteredAndSortedInventory: baseFilteredInventory,
    clearFilters,
    sortField,
    sortDirection,
    handleSort,
  } = useInventoryFilters(inventory);

  // Advanced filtering
  const filteredAndSortedInventory = useMemo(() => {
    let filtered = baseFilteredInventory;

    // Category filter
    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    // Supplier filter
    if (supplierFilter && supplierFilter !== 'all') {
      filtered = filtered.filter(item => item.supplier === supplierFilter);
    }

    // Stock status filter
    if (stockStatusFilter && stockStatusFilter !== 'all') {
      filtered = filtered.filter(item => {
        switch (stockStatusFilter) {
          case 'in_stock':
            return item.status === 'In Stock';
          case 'low_stock':
            return item.status === 'Low Stock';
          case 'out_of_stock':
            return item.status === 'Out of Stock';
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [baseFilteredInventory, categoryFilter, supplierFilter, stockStatusFilter]);

  // Get unique categories and suppliers for filters
  const categories = useMemo(() =>
    Array.from(new Set(inventory.map(item => item.category).filter(Boolean)))
    , [inventory]);

  const suppliers = useMemo(() =>
    Array.from(new Set(inventory.map(item => item.supplier).filter(Boolean)))
    , [inventory]);

  // Low stock alerts
  const lowStockItems = inventory.filter(item =>
    item.status === 'Low Stock' || item.status === 'Out of Stock'
  );

  // Analytics data
  const analytics = useMemo(() => {
    const totalValue = inventory.reduce((sum, item) => sum + ((item.price || 0) * item.stock), 0);
    const itemsNeedingReorder = inventory.filter(item =>
      item.stock <= (item.reorderLevel || 10)
    ).length;

    // Calculate stock turnover (simplified - would need historical data for accurate calculation)
    const averageStock = inventory.reduce((sum, item) => sum + item.stock, 0) / (inventory.length || 1);

    return {
      totalValue,
      itemsNeedingReorder,
      averageStock,
      categories: categories.length,
      suppliers: suppliers.length
    };
  }, [inventory, categories, suppliers]);

  // Item creation mutation
  const createItemMutation = useMutation({
    mutationFn: async (itemData: Partial<InventoryItem>) => {
      return await inventoryApi.create(itemData);
    },
    onSuccess: (newItem) => {
      if (newItem) {
        // Invalidate queries to refetch data
        queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
        queryClient.invalidateQueries({ queryKey: ["inventory-kpis"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard/metrics"] });

        toast({
          title: "Item Created Successfully",
          description: `${newItem.name} has been added to inventory.`,
        });

        setIsCreateDialogOpen(false);
      }
    },
    onError: (error) => {
      console.error('Failed to create inventory item:', error);
      toast({
        title: "Error",
        description: "Failed to create inventory item. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Item edit mutation
  const editItemMutation = useMutation({
    mutationFn: async ({ itemId, itemData }: { itemId: string; itemData: Partial<InventoryItem> }) => {
      return await inventoryApi.update(itemId, itemData);
    },
    onSuccess: (updatedItem) => {
      if (updatedItem) {
        // Invalidate queries to refetch data
        queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
        queryClient.invalidateQueries({ queryKey: ["inventory-kpis"] });

        toast({
          title: "Item Updated Successfully",
          description: `${updatedItem.name} has been updated.`,
        });

        setIsEditDialogOpen(false);
        setSelectedItem(null);
      }
    },
    onError: (error) => {
      console.error('Failed to update inventory item:', error);
      toast({
        title: "Error",
        description: "Failed to update inventory item. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Item delete mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return await inventoryApi.delete(itemId);
    },
    onSuccess: (success, itemId) => {
      if (success) {
        // Invalidate queries to refetch data
        queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
        queryClient.invalidateQueries({ queryKey: ["inventory-kpis"] });

        toast({
          title: "Item Deleted Successfully",
          description: "Inventory item has been removed.",
        });
      }
    },
    onError: (error) => {
      console.error('Failed to delete inventory item:', error);
      toast({
        title: "Error",
        description: "Failed to delete inventory item. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Stock update mutation
  const updateStockMutation = useMutation({
    mutationFn: async ({ itemId, newStock }: { itemId: string; newStock: number }) => {
      return await inventoryApi.updateStock(itemId, newStock);
    },
    onSuccess: (updatedItem) => {
      if (updatedItem) {
        // Invalidate queries to refetch data
        queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
        queryClient.invalidateQueries({ queryKey: ["inventory-kpis"] });

        toast({
          title: "Stock Updated",
          description: `${updatedItem.name} stock updated to ${updatedItem.stock}.`,
        });
      }
    },
    onError: (error) => {
      console.error('Failed to update stock:', error);
      toast({
        title: "Error",
        description: "Failed to update stock. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (itemIds: string[]) => {
      const promises = itemIds.map(id => inventoryApi.delete(id));
      const results = await Promise.all(promises);
      return results.every(result => result);
    },
    onSuccess: (success) => {
      if (success) {
        // Invalidate queries to refetch data
        queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
        queryClient.invalidateQueries({ queryKey: ["inventory-kpis"] });

        toast({
          title: "Items Deleted Successfully",
          description: `${selectedItems.length} items have been removed from inventory.`,
        });

        setSelectedItems([]);
      }
    },
    onError: (error) => {
      console.error('Failed to delete items:', error);
      toast({
        title: "Error",
        description: "Failed to delete selected items. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handler functions
  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsEditDialogOpen(true);
  };

  const handleDeleteItem = (itemId: string) => {
    deleteItemMutation.mutate(itemId);
  };

  const handleCreateItem = (data: any) => {
    const itemData: Partial<InventoryItem> = {
      ...data,
      stock: parseInt(data.stock),
      price: parseFloat(data.price),
      reorderLevel: parseInt(data.reorderLevel),
      costPerUnit: data.costPerUnit ? parseFloat(data.costPerUnit) : undefined,
      conversionFactor: data.conversionFactor ? parseFloat(data.conversionFactor) : undefined,
    };
    createItemMutation.mutate(itemData);
  };

  const handleUpdateItem = (data: any) => {
    if (!selectedItem) return;
    const itemData: Partial<InventoryItem> = {
      ...data,
      stock: parseInt(data.stock),
      price: parseFloat(data.price),
      reorderLevel: parseInt(data.reorderLevel),
      costPerUnit: data.costPerUnit ? parseFloat(data.costPerUnit) : undefined,
      conversionFactor: data.conversionFactor ? parseFloat(data.conversionFactor) : undefined,
    };
    editItemMutation.mutate({
      itemId: selectedItem.id,
      itemData,
    });
  };

  const handleUpdateStock = (itemId: string, newStock: number) => {
    updateStockMutation.mutate({ itemId, newStock });
  };

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(filteredAndSortedInventory.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedItems.length > 0) {
      bulkDeleteMutation.mutate(selectedItems);
    }
  };

  const handleExportCSV = useCallback(() => {
    exportToExcel({
      data: filteredAndSortedInventory.map(item => ({
        SKU: item.sku,
        Name: item.name,
        Category: item.category,
        Stock: item.stock,
        Price: item.price || 0,
        ReorderLevel: item.reorderLevel,
        Supplier: item.supplier,
        Status: item.status,
      })),
      fileName: `inventory-report-${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Inventory',
    });
    toast({
      title: "Export Successful",
      description: `Exported ${filteredAndSortedInventory.length} inventory items to CSV.`,
    });
  }, [filteredAndSortedInventory, toast]);

  const handleExportPDF = useCallback(() => {
    exportInventoryEnhanced(filteredAndSortedInventory);
    toast({
      title: "Export Successful",
      description: `Exported ${filteredAndSortedInventory.length} inventory items to PDF.`,
    });
  }, [filteredAndSortedInventory, toast]);

  const handleExportExcel = useCallback(() => {
    const filters = {
      status: stockStatusFilter,
      category: categoryFilter,
    };
    exportInventoryToExcel(filteredAndSortedInventory, filters);
    toast({
      title: "Excel Export Successful",
      description: `Exported ${filteredAndSortedInventory.length} inventory items to Excel.`,
    });
  }, [filteredAndSortedInventory, stockStatusFilter, categoryFilter, toast]);

  // Bulk stock adjustment
  const handleBulkStockAdjustment = useCallback(() => {
    if (selectedItems.length === 0) {
      toast({
        title: "No Items Selected",
        description: "Please select items to adjust stock.",
        variant: "destructive",
      });
      return;
    }

    selectedItems.forEach(itemId => {
      const item = inventory.find(i => i.id === itemId);
      if (!item) return;

      let newStock = item.stock;
      switch (bulkStockOperation) {
        case 'add':
          newStock = item.stock + bulkStockAmount;
          break;
        case 'subtract':
          newStock = Math.max(0, item.stock - bulkStockAmount);
          break;
        case 'set':
          newStock = bulkStockAmount;
          break;
      }

      updateStockMutation.mutate({ itemId, newStock });
    });

    setIsBulkStockDialogOpen(false);
    setBulkStockAmount(0);
    setSelectedItems([]);

    toast({
      title: "Bulk Stock Updated",
      description: `Updated stock for ${selectedItems.length} items.`,
    });
  }, [selectedItems, inventory, bulkStockOperation, bulkStockAmount, updateStockMutation, toast]);

  // View barcode
  const handleViewBarcode = useCallback((item: InventoryItem) => {
    // Generate mock barcode data (in real app, this would come from backend)
    const barcodeData = {
      id: `barcode-${item.id}`,
      code: item.sku || `BC-${item.id}`,
      type: 'barcode',
      entityType: 'product',
      entityId: item.id,
      createdAt: new Date().toISOString(),
      imageData: `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80">
        <rect width="200" height="80" fill="white"/>
        <text x="100" y="40" text-anchor="middle" font-size="12">${item.sku || item.id}</text>
        <rect x="20" y="50" width="2" height="20" fill="black"/>
        <rect x="25" y="50" width="4" height="20" fill="black"/>
        <rect x="32" y="50" width="2" height="20" fill="black"/>
        <rect x="37" y="50" width="6" height="20" fill="black"/>
        <rect x="46" y="50" width="3" height="20" fill="black"/>
        <rect x="52" y="50" width="2" height="20" fill="black"/>
        <rect x="57" y="50" width="4" height="20" fill="black"/>
        <rect x="64" y="50" width="2" height="20" fill="black"/>
      </svg>`)}`
    };

    setSelectedBarcode(barcodeData);
    setIsBarcodeDialogOpen(true);
  }, []);

  // Clear all filters
  const handleClearAllFilters = useCallback(() => {
    clearFilters();
    setCategoryFilter('all');
    setSupplierFilter('all');
    setStockStatusFilter('all');
  }, [clearFilters]);

  const handleViewHistory = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsAuditOpen(true);
  };

  const handleSmartReorder = () => {
    // In a real app, this would calculate reorder quantities and generate a PDF
    const lowStockCount = inventory.filter(i => i.stock <= (i.reorderLevel || 10)).length;

    if (lowStockCount === 0) {
      toast({
        title: "Stock Healthy",
        description: "No items are currently below their reorder level.",
      });
      return;
    }

    toast({
      title: "Purchase Draft Generated",
      description: `Created reorder list for ${lowStockCount} items. Downloading PDF...`,
    });

    // Trigger PDF export for low stock items only
    const lowStockItems = inventory.filter(i => i.stock <= (i.reorderLevel || 10));
    exportInventoryEnhanced(lowStockItems);
  };

  // Error state
  if (inventoryError) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-destructive text-lg font-semibold">
                Failed to load inventory
              </div>
              <p className="text-sm text-muted-foreground">
                {inventoryErrorDetails?.message || 'An unexpected error occurred'}
              </p>
              <Button
                onClick={() => queryClient.invalidateQueries({ queryKey: ['inventory-items'] })}
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Grid view component for inventory items
  const InventoryGridView = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4"
    >
      <AnimatePresence mode="popLayout">
        {filteredAndSortedInventory.map((item) => (
          <motion.div
            key={item.id}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            whileHover="hover"
            layout
          >
            <Card className={cn(
              "relative overflow-hidden transition-all duration-200",
              selectedItems.includes(item.id) && "ring-2 ring-primary"
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <Checkbox
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={() => handleSelectItem(item.id)}
                    className="mt-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewBarcode(item)}
                    className="h-8 w-8 p-0"
                  >
                    <Barcode className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle className="text-lg mt-2">{item.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  {item.sku && (
                    <Badge variant="outline" className="text-xs font-mono">
                      {item.sku}
                    </Badge>
                  )}
                  {item.category && (
                    <Badge variant="secondary" className="text-xs">
                      {item.category}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Stock Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Stock</span>
                  <Badge className={cn(
                    "text-xs",
                    item.status === 'In Stock' && "bg-green-100 text-green-800 border-green-200",
                    item.status === 'Low Stock' && "bg-yellow-100 text-yellow-800 border-yellow-200",
                    item.status === 'Out of Stock' && "bg-red-100 text-red-800 border-red-200"
                  )}>
                    {item.status}
                  </Badge>
                </div>

                {/* Stock Level with Progress */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.stock} units</span>
                    {item.reorderLevel && (
                      <span className="text-xs text-muted-foreground">
                        Min: {item.reorderLevel}
                      </span>
                    )}
                  </div>
                  <Progress
                    value={item.reorderLevel ? Math.min(100, (item.stock / (item.reorderLevel * 3)) * 100) : 50}
                    className="h-2"
                  />
                </div>

                {/* Quick Stock Adjustment */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateStock(item.id, Math.max(0, item.stock - 1))}
                    disabled={updateStockMutation.isPending || item.stock === 0}
                    className="flex-1"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateStock(item.id, item.stock + 1)}
                    disabled={updateStockMutation.isPending}
                    className="flex-1"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                {/* Price and Supplier */}
                <div className="space-y-2 pt-2 border-t">
                  {item.price && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Price</span>
                      <span className="font-semibold">{formatCurrency(item.price)}</span>
                    </div>
                  )}
                  {item.supplier && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Supplier</span>
                      <span className="text-xs">{item.supplier}</span>
                    </div>
                  )}
                  {item.price && item.stock > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Value</span>
                      <span className="font-semibold text-primary">
                        {formatCurrency(item.price * item.stock)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditItem(item)}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteItem(item.id)}
                    disabled={deleteItemMutation.isPending}
                    className="flex-1 text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8"
    >
      {/* Enhanced Header with Analytics */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col gap-4 mb-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center"
            >
              <Package className="w-6 h-6 text-primary" />
            </motion.div>
            <div>
              <h1 className="font-display font-bold text-3xl text-foreground">
                Smart Inventory Management
              </h1>
              <p className="text-muted-foreground">
                Real-time stock tracking with advanced analytics
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['inventory-items'] })}
            >
              <RotateCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Quick Analytics Bar */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4"
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-blue-700">Total Value</p>
                  <p className="text-lg font-bold text-blue-900">
                    {formatCurrency(analytics.totalValue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-orange-700">Need Reorder</p>
                  <p className="text-lg font-bold text-orange-900">
                    {analytics.itemsNeedingReorder}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <Archive className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-green-700">Avg Stock</p>
                  <p className="text-lg font-bold text-green-900">
                    {Math.round(analytics.averageStock)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Package className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-purple-700">Categories</p>
                  <p className="text-lg font-bold text-purple-900">
                    {analytics.categories}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-50 to-pink-100/50 border-pink-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-500 rounded-lg">
                  <ShoppingCart className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-pink-700">Suppliers</p>
                  <p className="text-lg font-bold text-pink-900">
                    {analytics.suppliers}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Low Stock Alerts Section */}
      <AnimatePresence>
        {lowStockItems.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="mb-6 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-orange-800">
                    <motion.div
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <Bell className="h-5 w-5" />
                    </motion.div>
                    Low Stock Alerts ({lowStockItems.length})
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStockStatusFilter('low_stock')}
                    className="border-orange-300 text-orange-700 hover:bg-orange-100"
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lowStockItems.slice(0, 6).map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-3 bg-white rounded-lg border border-orange-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-600">
                            Stock: <span className="font-semibold">{item.stock}</span>
                            {item.reorderLevel && (
                              <span className="text-muted-foreground">
                                {' '}/ Min: {item.reorderLevel}
                              </span>
                            )}
                          </p>
                        </div>
                        <Badge
                          className={cn(
                            item.status === 'Out of Stock'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-orange-100 text-orange-800'
                          )}
                        >
                          {item.status}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditItem(item)}
                        className="w-full mt-2"
                      >
                        Restock Now
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Cards */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <InventoryKPIs
          data={kpiData}
          isLoading={kpisLoading}
          isError={kpisError}
        />
      </motion.div>

      {/* Main Inventory Management Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="mt-8">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Inventory Items
                  <Badge variant="secondary">{filteredAndSortedInventory.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Manage your inventory with advanced filtering and bulk operations
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Advanced Filters */}
            <div className="space-y-4 mb-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Suppliers</SelectItem>
                    {suppliers.map(sup => (
                      <SelectItem key={sup} value={sup}>{sup}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={stockStatusFilter} onValueChange={setStockStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Stock Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="in_stock">In Stock</SelectItem>
                    <SelectItem value="low_stock">Low Stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={handleClearAllFilters}
                  disabled={!searchQuery && categoryFilter === 'all' && supplierFilter === 'all' && stockStatusFilter === 'all'}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>

              {/* Bulk Actions */}
              <AnimatePresence>
                {selectedItems.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20"
                  >
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span className="font-medium">
                      {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
                    </span>
                    <div className="flex-1" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsBulkStockDialogOpen(true)}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Bulk Stock Adjust
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportCSV}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Selected
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkDelete}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete Selected
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedItems([])}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Inventory Display */}
            {inventoryLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : viewMode === 'grid' ? (
              <InventoryGridView />
            ) : (
              <InventoryTable
                inventory={filteredAndSortedInventory}
                isLoading={inventoryLoading}
                selectedItems={selectedItems}
                onSelectItem={handleSelectItem}
                onSelectAll={handleSelectAll}
                onEditItem={handleEditItem}
                onDeleteItem={handleDeleteItem}
                onUpdateStock={handleUpdateStock}
                onViewHistory={handleViewHistory}
                isUpdatingStock={updateStockMutation.isPending}
                isDeleting={deleteItemMutation.isPending}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Inventory Dialogs */}
      <InventoryDialogs
        selectedItem={selectedItem}
        isEditDialogOpen={isEditDialogOpen}
        isCreateDialogOpen={isCreateDialogOpen}
        isCreating={createItemMutation.isPending}
        isUpdating={editItemMutation.isPending}
        onCloseEditDialog={() => setIsEditDialogOpen(false)}
        onCloseCreateDialog={() => setIsCreateDialogOpen(false)}
        onEditItem={handleUpdateItem}
        onCreateItem={handleCreateItem}
      />

      {/* Barcode Dialog */}
      <Dialog open={isBarcodeDialogOpen} onOpenChange={setIsBarcodeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Item Barcode</DialogTitle>
            <DialogDescription>
              View and print barcode for this inventory item
            </DialogDescription>
          </DialogHeader>
          {selectedBarcode && <BarcodeDisplay barcode={selectedBarcode} />}
        </DialogContent>
      </Dialog>

      {/* Bulk Stock Adjustment Dialog */}
      <Dialog open={isBulkStockDialogOpen} onOpenChange={setIsBulkStockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Stock Adjustment</DialogTitle>
            <DialogDescription>
              Adjust stock for {selectedItems.length} selected items
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Operation</Label>
              <Select
                value={bulkStockOperation}
                onValueChange={(value) => setBulkStockOperation(value as 'add' | 'subtract' | 'set')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add to current stock</SelectItem>
                  <SelectItem value="subtract">Subtract from current stock</SelectItem>
                  <SelectItem value="set">Set stock to specific value</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                value={bulkStockAmount}
                onChange={(e) => setBulkStockAmount(Number(e.target.value))}
                placeholder="Enter amount"
                min="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkStockDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkStockAdjustment}>
              Apply Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <InventoryAudit
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        selectedItem={selectedItem}
      />
    </motion.div>
  );
}