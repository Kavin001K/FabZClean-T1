import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { InventoryItem } from '@/lib/data-service';

// Form validation schemas
const inventoryItemFormSchema = z.object({
  name: z.string().min(2, 'Item name must be at least 2 characters').max(50, 'Item name must be less than 50 characters'),
  sku: z.string().min(1, 'SKU is required').max(20, 'SKU must be less than 20 characters'),
  category: z.string().min(1, 'Category is required'),
  price: z.string().min(1, 'Price is required').refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, 'Price must be a positive number'),
  stock: z.string().min(1, 'Stock is required').refine((val) => !isNaN(parseInt(val)) && parseInt(val) >= 0, 'Stock must be a non-negative integer'),
  reorderLevel: z.string().min(1, 'Reorder level is required').refine((val) => !isNaN(parseInt(val)) && parseInt(val) >= 0, 'Reorder level must be a non-negative integer'),
  supplier: z.string().optional(),
  description: z.string().optional(),
});

type InventoryItemFormData = z.infer<typeof inventoryItemFormSchema>;

interface InventoryDialogsProps {
  selectedItem: InventoryItem | null;
  isEditDialogOpen: boolean;
  isCreateDialogOpen: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  onCloseEditDialog: () => void;
  onCloseCreateDialog: () => void;
  onEditItem: (data: InventoryItemFormData) => void;
  onCreateItem: (data: InventoryItemFormData) => void;
}

const itemCategories = [
  'Cleaning Supplies',
  'Fabric Care',
  'Equipment',
  'Chemicals',
  'Packaging',
  'Tools',
  'Safety Equipment',
  'Office Supplies',
  'General'
];

export const InventoryDialogs: React.FC<InventoryDialogsProps> = React.memo(({
  selectedItem,
  isEditDialogOpen,
  isCreateDialogOpen,
  isCreating,
  isUpdating,
  onCloseEditDialog,
  onCloseCreateDialog,
  onEditItem,
  onCreateItem,
}) => {
  const editForm = useForm<InventoryItemFormData>({
    resolver: zodResolver(inventoryItemFormSchema),
    defaultValues: {
      name: selectedItem?.name || '',
      sku: selectedItem?.sku || '',
      category: selectedItem?.category || '',
      price: selectedItem?.price?.toString() || '',
      stock: selectedItem?.stock?.toString() || '',
      reorderLevel: selectedItem?.reorderLevel?.toString() || '',
      supplier: selectedItem?.supplier || '',
      description: '',
    },
  });

  const createForm = useForm<InventoryItemFormData>({
    resolver: zodResolver(inventoryItemFormSchema),
    defaultValues: {
      name: '',
      sku: '',
      category: '',
      price: '',
      stock: '',
      reorderLevel: '10',
      supplier: '',
      description: '',
    },
  });

  // Reset forms when dialogs open/close
  React.useEffect(() => {
    if (isEditDialogOpen && selectedItem) {
      editForm.reset({
        name: selectedItem.name,
        sku: selectedItem.sku || '',
        category: selectedItem.category || '',
        price: selectedItem.price?.toString() || '',
        stock: selectedItem.stock?.toString() || '',
        reorderLevel: selectedItem.reorderLevel?.toString() || '',
        supplier: selectedItem.supplier || '',
        description: '',
      });
    }
  }, [isEditDialogOpen, selectedItem, editForm]);

  React.useEffect(() => {
    if (isCreateDialogOpen) {
      createForm.reset({
        name: '',
        sku: '',
        category: '',
        price: '',
        stock: '',
        reorderLevel: '10',
        supplier: '',
        description: '',
      });
    }
  }, [isCreateDialogOpen, createForm]);

  const handleEditSubmit = (data: InventoryItemFormData) => {
    onEditItem(data);
  };

  const handleCreateSubmit = (data: InventoryItemFormData) => {
    onCreateItem(data);
  };

  return (
    <>
      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={onCloseEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
            <DialogDescription>
              Update inventory item information below.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Item Name *</Label>
              <Input
                id="edit-name"
                {...editForm.register('name')}
                className={cn(
                  editForm.formState.errors.name && 'border-red-500'
                )}
              />
              {editForm.formState.errors.name && (
                <p className="text-sm text-red-500">
                  {editForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-sku">SKU *</Label>
              <Input
                id="edit-sku"
                {...editForm.register('sku')}
                className={cn(
                  editForm.formState.errors.sku && 'border-red-500'
                )}
              />
              {editForm.formState.errors.sku && (
                <p className="text-sm text-red-500">
                  {editForm.formState.errors.sku.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">Category *</Label>
              <Select
                value={editForm.watch('category')}
                onValueChange={(value) => editForm.setValue('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {itemCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editForm.formState.errors.category && (
                <p className="text-sm text-red-500">
                  {editForm.formState.errors.category.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price (₹) *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  {...editForm.register('price')}
                  className={cn(
                    editForm.formState.errors.price && 'border-red-500'
                  )}
                />
                {editForm.formState.errors.price && (
                  <p className="text-sm text-red-500">
                    {editForm.formState.errors.price.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-stock">Stock *</Label>
                <Input
                  id="edit-stock"
                  type="number"
                  {...editForm.register('stock')}
                  className={cn(
                    editForm.formState.errors.stock && 'border-red-500'
                  )}
                />
                {editForm.formState.errors.stock && (
                  <p className="text-sm text-red-500">
                    {editForm.formState.errors.stock.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-reorder-level">Reorder Level *</Label>
              <Input
                id="edit-reorder-level"
                type="number"
                {...editForm.register('reorderLevel')}
                className={cn(
                  editForm.formState.errors.reorderLevel && 'border-red-500'
                )}
              />
              {editForm.formState.errors.reorderLevel && (
                <p className="text-sm text-red-500">
                  {editForm.formState.errors.reorderLevel.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-supplier">Supplier</Label>
              <Input
                id="edit-supplier"
                {...editForm.register('supplier')}
                placeholder="Enter supplier name"
                className={cn(
                  editForm.formState.errors.supplier && 'border-red-500'
                )}
              />
              {editForm.formState.errors.supplier && (
                <p className="text-sm text-red-500">
                  {editForm.formState.errors.supplier.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCloseEditDialog}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isUpdating}
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Item Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={onCloseCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Inventory Item</DialogTitle>
            <DialogDescription>
              Enter inventory item information below. This will add a new item to your inventory.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Item Name *</Label>
              <Input
                id="create-name"
                {...createForm.register('name')}
                placeholder="Enter item name"
                className={cn(
                  createForm.formState.errors.name && 'border-red-500'
                )}
              />
              {createForm.formState.errors.name && (
                <p className="text-sm text-red-500">
                  {createForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-sku">SKU *</Label>
              <Input
                id="create-sku"
                {...createForm.register('sku')}
                placeholder="Enter SKU"
                className={cn(
                  createForm.formState.errors.sku && 'border-red-500'
                )}
              />
              {createForm.formState.errors.sku && (
                <p className="text-sm text-red-500">
                  {createForm.formState.errors.sku.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-category">Category *</Label>
              <Select
                value={createForm.watch('category')}
                onValueChange={(value) => createForm.setValue('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {itemCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {createForm.formState.errors.category && (
                <p className="text-sm text-red-500">
                  {createForm.formState.errors.category.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-price">Price (₹) *</Label>
                <Input
                  id="create-price"
                  type="number"
                  step="0.01"
                  {...createForm.register('price')}
                  placeholder="Enter price"
                  className={cn(
                    createForm.formState.errors.price && 'border-red-500'
                  )}
                />
                {createForm.formState.errors.price && (
                  <p className="text-sm text-red-500">
                    {createForm.formState.errors.price.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-stock">Initial Stock *</Label>
                <Input
                  id="create-stock"
                  type="number"
                  {...createForm.register('stock')}
                  placeholder="Enter stock"
                  className={cn(
                    createForm.formState.errors.stock && 'border-red-500'
                  )}
                />
                {createForm.formState.errors.stock && (
                  <p className="text-sm text-red-500">
                    {createForm.formState.errors.stock.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-reorder-level">Reorder Level *</Label>
              <Input
                id="create-reorder-level"
                type="number"
                {...createForm.register('reorderLevel')}
                placeholder="Enter reorder level"
                className={cn(
                  createForm.formState.errors.reorderLevel && 'border-red-500'
                )}
              />
              {createForm.formState.errors.reorderLevel && (
                <p className="text-sm text-red-500">
                  {createForm.formState.errors.reorderLevel.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-supplier">Supplier</Label>
              <Input
                id="create-supplier"
                {...createForm.register('supplier')}
                placeholder="Enter supplier name"
                className={cn(
                  createForm.formState.errors.supplier && 'border-red-500'
                )}
              />
              {createForm.formState.errors.supplier && (
                <p className="text-sm text-red-500">
                  {createForm.formState.errors.supplier.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCloseCreateDialog}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isCreating}
              >
                {isCreating ? 'Creating...' : 'Create Item'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
});

export default InventoryDialogs;
