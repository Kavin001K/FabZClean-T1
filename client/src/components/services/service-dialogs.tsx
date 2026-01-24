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
import type { Service } from '@shared/schema';

// Form validation schemas
const serviceFormSchema = z.object({
  name: z.string().min(2, 'Service name must be at least 2 characters').max(50, 'Service name must be less than 50 characters'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  price: z.string().min(1, 'Price is required').refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 'Price must be a positive number'),
  duration: z.string().optional(), // Now optional as we use leadTimeHours
  status: z.enum(['Active', 'Inactive', 'Archived']),
  // New Fields
  leadTimeHours: z.coerce.number().min(0).default(24),
  pricingModel: z.enum(['per_piece', 'per_kg', 'per_sqft', 'fixed']).default('per_piece'),
  hsnSacCode: z.string().optional(),
  technicianNotes: z.string().optional(),
  isAddOn: z.boolean().default(false),
  parentServiceId: z.string().optional(),
});

const productFormSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters').max(50, 'Product name must be less than 50 characters'),
  price: z.string().min(1, 'Price is required').refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 'Price must be a positive number'),
  duration: z.string().min(1, 'Duration is required'),
  status: z.enum(['Active', 'Inactive']),
});

type ServiceFormData = z.infer<typeof serviceFormSchema>;
type ProductFormData = z.infer<typeof productFormSchema>;

interface ServiceDialogsProps {
  selectedService: Service | null;
  isEditDialogOpen: boolean;
  isCreateDialogOpen: boolean;
  isProductDialogOpen: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  onCloseEditDialog: () => void;
  onCloseCreateDialog: () => void;
  onCloseProductDialog: () => void;
  onEditService: (data: ServiceFormData) => void;
  onCreateService: (data: ServiceFormData) => void;
  onCreateProduct: (data: ProductFormData) => void;
}

const serviceCategories = [
  'Dry Cleaning',
  'Laundry',
  'Ironing',
  'Stain Removal',
  'Leather Care',
  'Premium Services',
  'Wash & Fold',
  'Alterations'
];

const durationOptions = [
  'Same Day',
  '24 Hours',
  '48 Hours',
  '3 Days',
  '5 Days',
  '1 Week'
];

export const ServiceDialogs: React.FC<ServiceDialogsProps> = React.memo(({
  selectedService,
  isEditDialogOpen,
  isCreateDialogOpen,
  isProductDialogOpen,
  isCreating,
  isUpdating,
  onCloseEditDialog,
  onCloseCreateDialog,
  onCloseProductDialog,
  onEditService,
  onCreateService,
  onCreateProduct,
}) => {
  const editForm = useForm<ServiceFormData>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: selectedService?.name || '',
      category: selectedService?.category || '',
      description: selectedService?.description || '',
      price: selectedService?.price || '',
      duration: selectedService?.duration || '',
      status: selectedService?.status || 'Active',
    },
  });

  const createForm = useForm<ServiceFormData>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: '',
      category: '',
      description: '',
      price: '',
      duration: '',
      status: 'Active',
    },
  });

  const productForm = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      price: '',
      duration: '',
      status: 'Active',
    },
  });

  // Reset forms when dialogs open/close
  React.useEffect(() => {
    if (isEditDialogOpen && selectedService) {
      editForm.reset({
        name: selectedService.name,
        category: selectedService.category,
        description: selectedService.description || '',
        price: selectedService.price,
        duration: selectedService.duration || '',
        status: (selectedService.status as 'Active' | 'Inactive' | 'Archived') || 'Active',
        // New Fields
        leadTimeHours: selectedService.leadTimeHours || 24,
        pricingModel: (selectedService.pricingModel as 'per_piece' | 'per_kg' | 'per_sqft' | 'fixed') || 'per_piece',
        hsnSacCode: selectedService.hsnSacCode || '',
        technicianNotes: selectedService.technicianNotes || '',
        isAddOn: selectedService.isAddOn || false,
        parentServiceId: selectedService.parentServiceId || '',
      });
    }
  }, [isEditDialogOpen, selectedService, editForm]);

  React.useEffect(() => {
    if (isCreateDialogOpen) {
      createForm.reset({
        name: '',
        category: '',
        description: '',
        price: '',
        duration: '',
        status: 'Active',
      });
    }
  }, [isCreateDialogOpen, createForm]);

  React.useEffect(() => {
    if (isProductDialogOpen) {
      productForm.reset({
        name: '',
        price: '',
        duration: '',
        status: 'Active',
      });
    }
  }, [isProductDialogOpen, productForm]);

  const handleEditSubmit = (data: ServiceFormData) => {
    onEditService(data);
  };

  const handleCreateSubmit = (data: ServiceFormData) => {
    onCreateService(data);
  };

  const handleProductSubmit = (data: ProductFormData) => {
    onCreateProduct(data);
  };

  return (
    <>
      {/* Edit Service Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={onCloseEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>
              Update service information below.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Service Name *</Label>
                <Input
                  id="edit-name"
                  {...editForm.register('name')}
                  className={cn(editForm.formState.errors.name && 'border-red-500')}
                />
                {editForm.formState.errors.name && (
                  <p className="text-sm text-red-500">{editForm.formState.errors.name.message}</p>
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
                    {serviceCategories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-pricing-model">Pricing Model</Label>
                <Select
                  value={editForm.watch('pricingModel') || 'per_piece'}
                  onValueChange={(value) => editForm.setValue('pricingModel', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Per Piece" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_piece">Per Piece</SelectItem>
                    <SelectItem value="per_kg">Per Kg</SelectItem>
                    <SelectItem value="per_sqft">Per Sq Ft</SelectItem>
                    <SelectItem value="fixed">Fixed Price</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-price">Price (₹) *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  {...editForm.register('price')}
                  className={cn(editForm.formState.errors.price && 'border-red-500')}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-hsn">HSN/SAC Code</Label>
                <Input
                  id="edit-hsn"
                  {...editForm.register('hsnSacCode')}
                  placeholder="e.g. 9997"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lead-time">Lead Time (Hours)</Label>
                <Input
                  type="number"
                  id="edit-lead-time"
                  {...editForm.register('leadTimeHours')}
                  placeholder="24"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-tech-notes">Technician Notes (Printed on Tag)</Label>
              <Textarea
                id="edit-tech-notes"
                {...editForm.register('technicianNotes')}
                placeholder="e.g. Wash cold, do not tumble dry"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Status *</Label>
              <Select
                value={editForm.watch('status')}
                onValueChange={(value) => editForm.setValue('status', value as 'Active' | 'Inactive' | 'Archived')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                {...editForm.register('description')}
                className={cn(editForm.formState.errors.description && 'border-red-500')}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onCloseEditDialog}>Cancel</Button>
              <Button type="submit" disabled={isUpdating}>{isUpdating ? 'Saving...' : 'Save Changes'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Service Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={onCloseCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
            <DialogDescription>
              Enter service information below. This will create a new service in your catalog.
            </DialogDescription>
          </DialogHeader>


          <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Service Name *</Label>
                <Input
                  id="create-name"
                  {...createForm.register('name')}
                  placeholder="e.g. Premium Dry Clean"
                  className={cn(createForm.formState.errors.name && 'border-red-500')}
                />
                {createForm.formState.errors.name && (
                  <p className="text-sm text-red-500">{createForm.formState.errors.name.message}</p>
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
                    {serviceCategories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-pricing-model">Pricing Model</Label>
                <Select
                  value={createForm.watch('pricingModel') || 'per_piece'}
                  onValueChange={(value) => createForm.setValue('pricingModel', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Per Piece" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_piece">Per Piece</SelectItem>
                    <SelectItem value="per_kg">Per Kg</SelectItem>
                    <SelectItem value="per_sqft">Per Sq Ft</SelectItem>
                    <SelectItem value="fixed">Fixed Price</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-price">Price (₹) *</Label>
                <Input
                  id="create-price"
                  type="number"
                  step="0.01"
                  {...createForm.register('price')}
                  placeholder="0.00"
                  className={cn(createForm.formState.errors.price && 'border-red-500')}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-hsn">HSN/SAC Code</Label>
                <Input
                  id="create-hsn"
                  {...createForm.register('hsnSacCode')}
                  placeholder="e.g. 9997"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-lead-time">Lead Time (Hours)</Label>
                <Input
                  type="number"
                  id="create-lead-time"
                  {...createForm.register('leadTimeHours')}
                  placeholder="24"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-tech-notes">Technician Notes (Printed on Tag)</Label>
              <Textarea
                id="create-tech-notes"
                {...createForm.register('technicianNotes')}
                placeholder="e.g. Wash cold, do not tumble dry"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-description">Description</Label>
              <Textarea
                id="create-description"
                {...createForm.register('description')}
                placeholder="Customer-facing description"
                className={cn(createForm.formState.errors.description && 'border-red-500')}
              />
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
                {isCreating ? 'Creating...' : 'Create Service'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Product Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={onCloseProductDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Product to Service</DialogTitle>
            <DialogDescription>
              Add a new product item to this service.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={productForm.handleSubmit(handleProductSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">Product Name *</Label>
              <Input
                id="product-name"
                {...productForm.register('name')}
                placeholder="Enter product name"
                className={cn(
                  productForm.formState.errors.name && 'border-red-500'
                )}
              />
              {productForm.formState.errors.name && (
                <p className="text-sm text-red-500">
                  {productForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-price">Price (₹) *</Label>
              <Input
                id="product-price"
                type="number"
                step="0.01"
                {...productForm.register('price')}
                placeholder="Enter product price"
                className={cn(
                  productForm.formState.errors.price && 'border-red-500'
                )}
              />
              {productForm.formState.errors.price && (
                <p className="text-sm text-red-500">
                  {productForm.formState.errors.price.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-duration">Duration *</Label>
              <Select
                value={productForm.watch('duration')}
                onValueChange={(value) => productForm.setValue('duration', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((duration) => (
                    <SelectItem key={duration} value={duration}>
                      {duration}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {productForm.formState.errors.duration && (
                <p className="text-sm text-red-500">
                  {productForm.formState.errors.duration.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-status">Status *</Label>
              <Select
                value={productForm.watch('status')}
                onValueChange={(value) => productForm.setValue('status', value as 'Active' | 'Inactive')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onCloseProductDialog}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
              >
                {isCreating ? 'Adding...' : 'Add Product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
});

export default ServiceDialogs;
