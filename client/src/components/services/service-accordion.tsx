import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Plus, 
  Clock, 
  DollarSign,
  Package,
  ChevronRight
} from 'lucide-react';
import * as LoadingSkeleton from '@/components/ui/loading-skeleton';
import { formatCurrency } from '@/lib/data-service';
import type { Service } from '@shared/schema';

interface ServiceAccordionProps {
  services: Service[];
  isLoading: boolean;
  onEditService: (service: Service) => void;
  onDeleteService: (serviceId: string) => void;
  onAddProduct: (serviceId: string) => void;
  onEditProduct: (serviceId: string, productId: string) => void;
  onDeleteProduct: (serviceId: string, productId: string) => void;
  isDeleting?: boolean;
}

interface ServiceItemProps {
  service: Service;
  onEdit: (service: Service) => void;
  onDelete: (serviceId: string) => void;
  onAddProduct: (serviceId: string) => void;
  onEditProduct: (serviceId: string, productId: string) => void;
  onDeleteProduct: (serviceId: string, productId: string) => void;
  isDeleting?: boolean;
}

// Mock products data - in real app this would come from API
const mockProducts = {
  'service-1': [
    { id: '1', name: 'Shirt', price: 50, duration: '24 hours', status: 'Active' },
    { id: '2', name: 'Trousers', price: 75, duration: '24 hours', status: 'Active' },
    { id: '3', name: 'Blazer', price: 150, duration: '48 hours', status: 'Active' },
  ],
  'service-2': [
    { id: '4', name: 'Bed Sheets', price: 100, duration: '24 hours', status: 'Active' },
    { id: '5', name: 'Curtains', price: 120, duration: '48 hours', status: 'Active' },
  ],
  'service-3': [
    { id: '6', name: 'Saree', price: 200, duration: '72 hours', status: 'Active' },
    { id: '7', name: 'Lehenga', price: 500, duration: '5 days', status: 'Active' },
  ],
};

const ServiceItem: React.FC<ServiceItemProps> = React.memo(({ 
  service, 
  onEdit, 
  onDelete, 
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  isDeleting 
}) => {
  const products = mockProducts[service.id as keyof typeof mockProducts] || [];
  
  const getStatusColor = (status: string) => {
    return status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Dry Cleaning': 'bg-blue-100 text-blue-800',
      'Laundry': 'bg-green-100 text-green-800',
      'Ironing': 'bg-yellow-100 text-yellow-800',
      'Premium': 'bg-purple-100 text-purple-800',
      'Leather Care': 'bg-orange-100 text-orange-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <AccordionItem value={service.id} className="border rounded-lg mb-2">
      <AccordionTrigger className="px-4 py-3 hover:no-underline">
        <div className="flex items-center justify-between w-full mr-4">
          <div className="flex items-center gap-3">
            <div className="text-left">
              <div className="font-medium text-base">{service.name}</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getCategoryColor(service.category)} variant="secondary">
                  {service.category}
                </Badge>
                <Badge className={getStatusColor(service.status)} variant="secondary">
                  {service.status}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span className="font-medium">{formatCurrency(parseFloat(service.price))}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{service.duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <Package className="h-4 w-4" />
              <span>{products.length} items</span>
            </div>
          </div>
        </div>
      </AccordionTrigger>
      
      <AccordionContent className="px-4 pb-4">
        <div className="space-y-4">
          {/* Service Description */}
          {service.description && (
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              {service.description}
            </div>
          )}
          
          {/* Products Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-muted-foreground">Products & Items</h4>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAddProduct(service.id)}
                className="h-7 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Product
              </Button>
            </div>
            
            {products.length > 0 ? (
              <div className="grid gap-2">
                {products.map((product) => (
                  <Card key={product.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{product.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {product.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {formatCurrency(product.price)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {product.duration}
                          </span>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Product Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onEditProduct(service.id, product.id)}>
                            <Edit className="mr-2 h-3 w-3" />
                            Edit Product
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem 
                                className="text-red-600 focus:text-red-600"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Trash2 className="mr-2 h-3 w-3" />
                                Delete Product
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Product</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete <strong>{product.name}</strong>? 
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => onDeleteProduct(service.id, product.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete Product
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No products added yet</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAddProduct(service.id)}
                  className="mt-2"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add First Product
                </Button>
              </div>
            )}
          </div>
          
          {/* Service Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4 mr-2" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Service Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit(service)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Service
                </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem 
                      className="text-red-600 focus:text-red-600"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Service
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Service</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete <strong>{service.name}</strong>? 
                        This action cannot be undone and will permanently remove the service 
                        and all associated products.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => onDelete(service.id)}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isDeleting ? 'Deleting...' : 'Delete Service'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
});

export const ServiceAccordion: React.FC<ServiceAccordionProps> = React.memo(({
  services,
  isLoading,
  onEditService,
  onDeleteService,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  isDeleting = false
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-4">
            <LoadingSkeleton.CustomerRowSkeleton />
          </Card>
        ))}
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No services found</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Get started by adding your first service to the system.
        </p>
      </div>
    );
  }

  return (
    <Accordion type="multiple" className="w-full">
      {services.map((service) => (
        <ServiceItem
          key={service.id}
          service={service}
          onEdit={onEditService}
          onDelete={onDeleteService}
          onAddProduct={onAddProduct}
          onEditProduct={onEditProduct}
          onDeleteProduct={onDeleteProduct}
          isDeleting={isDeleting}
        />
      ))}
    </Accordion>
  );
});

export default ServiceAccordion;
