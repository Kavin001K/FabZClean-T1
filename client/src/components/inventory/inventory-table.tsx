import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Plus,
  Minus,
  Package,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import * as LoadingSkeleton from '@/components/ui/loading-skeleton';
import { formatCurrency } from '@/lib/data-service';
import { cn } from '@/lib/utils';
import type { InventoryItem } from '@/lib/data-service';

interface InventoryTableProps {
  inventory: InventoryItem[];
  isLoading: boolean;
  selectedItems: string[];
  onSelectItem: (itemId: string) => void;
  onSelectAll: (checked: boolean) => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (itemId: string) => void;
  onUpdateStock: (itemId: string, newStock: number) => void;
  onViewHistory: (item: InventoryItem) => void;
  isUpdatingStock?: boolean;
  isDeleting?: boolean;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

interface InventoryRowProps {
  item: InventoryItem;
  isSelected: boolean;
  onSelect: (itemId: string) => void;
  onEdit: (item: InventoryItem) => void;
  onDelete: (itemId: string) => void;
  onUpdateStock: (itemId: string, newStock: number) => void;
  onViewHistory: (item: InventoryItem) => void;
  isUpdatingStock?: boolean;
  isDeleting?: boolean;
}

const InventoryRow: React.FC<InventoryRowProps> = React.memo(({
  item,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onUpdateStock,
  onViewHistory,
  isUpdatingStock = false,
  isDeleting = false
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Low Stock':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Out of Stock':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleStockChange = (delta: number) => {
    const newStock = Math.max(0, item.stock + delta);
    onUpdateStock(item.id, newStock);
  };

  const handleQuickStockUpdate = (newStock: number) => {
    if (newStock >= 0) {
      onUpdateStock(item.id, newStock);
    }
  };

  return (
    <TableRow className={cn(
      "hover:bg-muted/50 transition-colors",
      isSelected && "bg-primary/5"
    )}>
      <TableCell className="w-12">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(item.id)}
        />
      </TableCell>

      <TableCell>
        <div className="space-y-1">
          <div className="font-medium cursor-pointer hover:underline" onClick={() => onViewHistory(item)}>{item.name}</div>
          {item.sku && (
            <div className="text-sm text-muted-foreground font-mono">{item.sku}</div>
          )}
          {item.category && (
            <div className="text-xs text-muted-foreground">{item.category}</div>
          )}
        </div>
      </TableCell>

      <TableCell>
        <div className="flex flex-col gap-2 min-w-[140px]">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className={cn(
              "font-semibold",
              item.stock <= (item.reorderLevel || 10) ? "text-red-500" : "text-green-600"
            )}>
              {item.stock} {item.unitType || 'units'}
            </span>
            <span className="text-muted-foreground">{Math.round((item.stock / (item.reorderLevel ? item.reorderLevel * 3 : 100)) * 100)}%</span>
          </div>
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
            <div
              className={cn("h-full transition-all duration-300",
                item.stock <= (item.reorderLevel || 10) ? "bg-red-500 animate-pulse" : "bg-green-500"
              )}
              style={{ width: `${Math.min(100, (item.stock / (item.reorderLevel ? item.reorderLevel * 3 : 100)) * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6 rounded-full"
                onClick={() => handleStockChange(-1)}
                disabled={isUpdatingStock || item.stock <= 0}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6 rounded-full"
                onClick={() => handleStockChange(1)}
                disabled={isUpdatingStock}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            {item.reorderLevel && item.stock <= item.reorderLevel && (
              <span className="text-[10px] text-red-500 font-medium">Reorder</span>
            )}
          </div>
        </div>
      </TableCell>

      <TableCell>
        <Badge className={cn("text-xs", getStatusColor(item.status))}>
          {item.status}
        </Badge>
      </TableCell>

      <TableCell>
        {item.price ? formatCurrency(item.price) : 'N/A'}
      </TableCell>

      <TableCell>
        {item.supplier || 'N/A'}
      </TableCell>

      <TableCell>
        <div onClick={(e) => e.stopPropagation()}>
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onViewHistory(item)}>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  View History
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(item)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Item
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Item
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Inventory Item</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete <strong>{item.name}</strong>?
                  This action cannot be undone and will permanently remove the item
                  from your inventory.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(item.id)}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Item'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
});

export const InventoryTable: React.FC<InventoryTableProps> = React.memo(({
  inventory,
  isLoading,
  selectedItems,
  onSelectItem,
  onSelectAll,
  onEditItem,
  onDeleteItem,
  onUpdateStock,
  onViewHistory,
  isUpdatingStock = false,
  isDeleting = false,
  sortField,
  sortDirection,
  onSort,
}) => {
  const allSelected = inventory.length > 0 && selectedItems.length === inventory.length;
  const someSelected = selectedItems.length > 0 && selectedItems.length < inventory.length;

  const handleSort = (field: string) => {
    if (onSort) {
      onSort(field);
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ?
      <TrendingUp className="h-4 w-4 ml-1" /> :
      <TrendingDown className="h-4 w-4 ml-1" />;
  };

  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox disabled />
            </TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <LoadingSkeleton.CustomerRowSkeleton key={i} />
          ))}
        </TableBody>
      </Table>
    );
  }

  if (inventory.length === 0) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox disabled />
            </TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={7} className="text-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="rounded-full bg-muted p-4">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">No inventory items found</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Get started by adding your first inventory item to the system.
                  </p>
                </div>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox
              checked={allSelected}
              ref={(el: any) => {
                if (el) el.indeterminate = someSelected;
              }}
              onCheckedChange={(checked) => onSelectAll(!!checked)}
            />
          </TableHead>
          <TableHead
            className="cursor-pointer hover:text-primary"
            onClick={() => handleSort('name')}
          >
            <div className="flex items-center">
              Item
              {getSortIcon('name')}
            </div>
          </TableHead>
          <TableHead
            className="cursor-pointer hover:text-primary"
            onClick={() => handleSort('stock')}
          >
            <div className="flex items-center">
              Stock
              {getSortIcon('stock')}
            </div>
          </TableHead>
          <TableHead
            className="cursor-pointer hover:text-primary"
            onClick={() => handleSort('status')}
          >
            <div className="flex items-center">
              Status
              {getSortIcon('status')}
            </div>
          </TableHead>
          <TableHead
            className="cursor-pointer hover:text-primary"
            onClick={() => handleSort('price')}
          >
            <div className="flex items-center">
              Price
              {getSortIcon('price')}
            </div>
          </TableHead>
          <TableHead
            className="cursor-pointer hover:text-primary"
            onClick={() => handleSort('supplier')}
          >
            <div className="flex items-center">
              Supplier
              {getSortIcon('supplier')}
            </div>
          </TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {inventory.map((item) => (
          <InventoryRow
            key={item.id}
            item={item}
            isSelected={selectedItems.includes(item.id)}
            onSelect={onSelectItem}
            onEdit={onEditItem}
            onDelete={onDeleteItem}
            onUpdateStock={onUpdateStock}
            onViewHistory={onViewHistory}
            isUpdatingStock={isUpdatingStock}
            isDeleting={isDeleting}
          />
        ))}
      </TableBody>
    </Table>
  );
});

export default InventoryTable;
