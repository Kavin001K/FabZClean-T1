import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { safeParseFloat } from '@/lib/safe-utils';
import { useDebounce } from '@/hooks/use-debounce';
import {
  PlusCircle,
  Download,
  Printer,
  Star,
  Clock,
  TrendingUp,
  Package,
  ShoppingCart,
  Filter,
  Search,
  Grid3x3,
  List,
  CheckCircle,
  XCircle,
  Sparkles,
  FileText,
  Upload,
  Trash
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Import data service and types
import { servicesApi } from '@/lib/data-service';
import type { Service } from '@shared/schema';
import { EnhancedPDFExport, exportServicesEnhanced } from '@/lib/enhanced-pdf-export';
import { exportServicesToExcel } from '@/lib/excel-exports';
import { ServiceImportDialog } from '@/components/services/service-import-dialog';

// Service icon mapping
const getServiceIcon = (category: string) => {
  const icons: Record<string, any> = {
    'Cleaning': Sparkles,
    'Laundry': ShoppingCart,
    'Maintenance': Package,
    'Repair': Package,
    'Installation': Package,
    'default': Package
  };
  return icons[category] || icons.default;
};

// Format currency
const formatCurrency = (amount: string | number) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num) || num === null || num === undefined) {
    return '₹0.00';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
};

export default function Services() {
  // State for dialog management
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  // UI State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'popular'>('name');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch services data with React Query
  const {
    data: servicesData,
    isLoading: servicesLoading,
    isError: servicesError,
    error: servicesErrorDetails,
  } = useQuery({
    queryKey: ['services'],
    queryFn: servicesApi.getAll,
    staleTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Ensure services is always an array
  const services: Service[] = useMemo(() => {
    if (!servicesData) return [];
    if (Array.isArray(servicesData)) return servicesData;
    // If data is wrapped in an object, try to extract the array
    if (typeof servicesData === 'object' && 'data' in servicesData) {
      const wrappedData = (servicesData as any).data;
      return Array.isArray(wrappedData) ? wrappedData : [];
    }
    return [];
  }, [servicesData]);

  // Get unique categories from services
  const categories = useMemo(() => {
    const cats = new Set(services.map(s => s.category));
    return ['all', ...Array.from(cats)];
  }, [services]);

  // Filter and sort services
  const filteredServices = useMemo(() => {
    let filtered = [...services];

    // Search filter
    if (debouncedSearchQuery) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        service.description?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        service.category.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(service => service.category === selectedCategory);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(service => service.status === selectedStatus);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'price') {
        const priceA = parseFloat(a.price) || 0;
        const priceB = parseFloat(b.price) || 0;
        return priceA - priceB;
      }
      return 0;
    });

    return filtered;
  }, [services, debouncedSearchQuery, selectedCategory, selectedStatus, sortBy]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalServices = services.length;
    const activeServices = services.filter(s => s.status === 'Active').length;
    const totalRevenue = services.length > 0
      ? services.reduce((sum, s) => sum + safeParseFloat(s.price), 0)
      : 0;
    const avgPrice = totalServices > 0 ? totalRevenue / totalServices : 0;

    return {
      totalServices,
      activeServices,
      totalRevenue,
      avgPrice,
    };
  }, [services]);

  // Service creation mutation
  const createServiceMutation = useMutation({
    mutationFn: async (serviceData: Partial<Service>) => {
      return await servicesApi.create(serviceData);
    },
    onSuccess: (newService) => {
      if (newService) {
        queryClient.invalidateQueries({ queryKey: ["services"] });
        toast({
          title: "Service Created Successfully",
          description: `Service ${newService.name} has been added to the catalog.`,
        });
        setIsCreateDialogOpen(false);
      }
    },
    onError: (error) => {
      console.error('Failed to create service:', error);
      toast({
        title: "Error",
        description: "Failed to create service. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Service update mutation
  const updateServiceMutation = useMutation({
    mutationFn: async ({ serviceId, serviceData }: { serviceId: string; serviceData: Partial<Service> }) => {
      return await servicesApi.update(serviceId, serviceData);
    },
    onSuccess: (updatedService) => {
      if (updatedService) {
        queryClient.invalidateQueries({ queryKey: ["services"] });
        toast({
          title: "Service Updated Successfully",
          description: `Service ${updatedService.name} has been updated.`,
        });
        setIsEditDialogOpen(false);
        setSelectedService(null);
      }
    },
    onError: (error) => {
      console.error('Failed to update service:', error);
      toast({
        title: "Error",
        description: "Failed to update service. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Service delete mutation
  const deleteServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      return await servicesApi.delete(serviceId);
    },
    onSuccess: (success) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: ["services"] });
        toast({
          title: "Service Deleted Successfully",
          description: "Service has been removed from the catalog.",
        });
      }
    },
    onError: (error) => {
      console.error('Failed to delete service:', error);
      toast({
        title: "Error",
        description: "Failed to delete service. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handler functions
  const handleEditService = (service: Service) => {
    setSelectedService(service);
    setIsEditDialogOpen(true);
  };

  const handleDeleteService = (serviceId: string) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      deleteServiceMutation.mutate(serviceId);
    }
  };

  const handleUpdateService = (data: Partial<Service>) => {
    if (!selectedService) return;
    updateServiceMutation.mutate({
      serviceId: selectedService.id,
      serviceData: data,
    });
  };



  const handleExportPDF = () => {
    exportServicesEnhanced(filteredServices);

    toast({
      title: "PDF Downloaded",
      description: "Service catalog has been exported successfully.",
    });
  };

  const handleExportExcel = () => {
    const filters = {
      category: selectedCategory,
      status: selectedStatus,
    };
    exportServicesToExcel(filteredServices, filters);

    toast({
      title: "Excel Export Successful",
      description: `Exported ${filteredServices.length} services to Excel.`,
    });
  };

  const handlePrintPriceList = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Service Price List</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #84cc16; border-bottom: 3px solid #84cc16; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #84cc16; color: white; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .footer { margin-top: 30px; text-align: center; color: #666; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <h1>Service Price List</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              <th>Service Name</th>
              <th>Category</th>
              <th>Duration</th>
              <th>Price</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${services.map(service => `
              <tr>
                <td><strong>${service.name}</strong></td>
                <td>${service.category}</td>
                <td>${service.duration}</td>
                <td><strong>${formatCurrency(service.price)}</strong></td>
                <td>${service.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          <p>Total Services: ${services.length} | Generated: ${new Date().toLocaleDateString()}</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  // Error state
  if (servicesError) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-destructive text-lg font-semibold">
                Failed to load services
              </div>
              <p className="text-sm text-muted-foreground">
                {servicesErrorDetails?.message || 'An unexpected error occurred'}
              </p>
              <Button
                onClick={() => queryClient.invalidateQueries({ queryKey: ['services'] })}
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

  return (
    <div className="flex-1 space-y-6 p-4 sm:px-6 sm:py-6 md:gap-8">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Service Catalog</h1>
          <p className="text-muted-foreground">
            Browse and manage your premium service offerings
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintPriceList}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Price List
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Catalog
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileText className="mr-2 h-4 w-4" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportExcel}>
                <FileText className="mr-2 h-4 w-4" />
                Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportDialogOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Service
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          {
            title: 'Total Services',
            value: stats.totalServices,
            icon: Package,
            subtitle: 'Complete catalog',
            color: 'border-l-lime-500',
            delay: 0.1
          },
          {
            title: 'Active Services',
            value: stats.activeServices,
            icon: CheckCircle,
            subtitle: 'Ready to book',
            color: 'border-l-green-500',
            valueColor: 'text-green-600',
            delay: 0.15
          },
          {
            title: 'Average Price',
            value: formatCurrency(stats.avgPrice),
            icon: TrendingUp,
            subtitle: 'Per service',
            color: 'border-l-blue-500',
            delay: 0.2
          },
          {
            title: 'Categories',
            value: categories.length - 1,
            icon: Filter,
            subtitle: 'Service types',
            color: 'border-l-orange-500',
            delay: 0.25
          }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: stat.delay,
                ease: [0.4, 0, 0.2, 1]
              }}
            >
              <Card className={`${stat.color} border-l-4 hover:shadow-lg transition-shadow duration-300`}>
                <CardHeader className="pb-3">
                  <CardDescription>{stat.title}</CardDescription>
                  <CardTitle className={`text-3xl ${stat.valueColor || ''}`}>{stat.value}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Icon className="h-4 w-4 mr-1" />
                    {stat.subtitle}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Search and Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search services by name, description, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  aria-label="Search services by name, description, or category"
                />
              </div>
              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px]" aria-label="Filter by category">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat === 'all' ? 'All Categories' : cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[140px]" aria-label="Filter by status">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                  <SelectTrigger className="w-[140px]" aria-label="Sort services">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="popular">Popular</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex border rounded-md">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {(searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all') && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <span>Showing {filteredServices.length} of {services.length} services</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                      setSelectedStatus('all');
                    }}
                  >
                    Clear filters
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Service Cards Grid/List */}
      {servicesLoading ? (
        <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredServices.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No services found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or add a new service
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredServices.map((service, index) => {
              const ServiceIcon = getServiceIcon(service.category);
              const servicePrice = parseFloat(service.price) || 0;
              const isPopular = servicePrice > stats.avgPrice;

              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.05,
                    ease: [0.4, 0, 0.2, 1]
                  }}
                  whileHover={{
                    scale: 1.03,
                    y: -5,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.98 }}
                  layout
                >
                  <Card className="group hover:shadow-lg transition-all duration-300 relative overflow-hidden h-full"
                  >
                    {isPopular && (
                      <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-400 text-white px-3 py-1 rounded-bl-lg text-xs font-semibold flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        Popular
                      </div>
                    )}

                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="p-3 rounded-lg bg-lime-100 text-lime-600 group-hover:bg-lime-500 group-hover:text-white transition-colors">
                          <ServiceIcon className="h-6 w-6" />
                        </div>
                        <Badge
                          variant={service.status === 'Active' ? 'default' : 'secondary'}
                          className={service.status === 'Active' ? 'bg-green-500' : ''}
                        >
                          {service.status === 'Active' ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {service.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl mt-3">{service.name}</CardTitle>
                      <Badge variant="outline" className="w-fit">
                        {service.category}
                      </Badge>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                        {service.description || 'Professional service with quality guarantee'}
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/30 p-1.5 rounded">
                          <Clock className="h-3.5 w-3.5 text-blue-500" />
                          <span className="font-medium">{service.leadTimeHours || 24}h Turnaround</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/30 p-1.5 rounded">
                          <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                          <span className="truncate">{service.pricingModel?.replace('per_', '/') || '/ piece'}</span>
                        </div>
                      </div>

                      {/* Health / KPI Mock */}
                      <div className="text-[10px] text-muted-foreground flex items-center justify-between border-t pt-2 mt-1">
                        <span>Used 42 times this week</span>
                        <span className="text-green-600 font-medium">+12% vs last week</span>
                      </div>

                      <div className="pt-2">
                        <div className="flex items-end justify-between mb-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Base Price</p>
                            <div className="flex items-baseline gap-1">
                              <p className="text-2xl font-bold text-lime-600">
                                {formatCurrency(service.price)}
                              </p>
                              {service.pricingModel && (
                                <span className="text-xs text-muted-foreground font-medium">/{service.pricingModel.replace('per_', '')}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditService(service);
                            }}
                            className="flex-1"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteService(service.id);
                            }}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredServices.map((service, index) => {
              const ServiceIcon = getServiceIcon(service.category);
              const servicePrice = parseFloat(service.price) || 0;
              const isPopular = servicePrice > stats.avgPrice;

              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.05,
                    ease: [0.4, 0, 0.2, 1]
                  }}
                  whileHover={{
                    x: 5,
                    transition: { duration: 0.2 }
                  }}
                  layout
                >
                  <Card className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-6">
                        <div className="p-4 rounded-lg bg-lime-100 text-lime-600">
                          <ServiceIcon className="h-8 w-8" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-semibold">{service.name}</h3>
                            {isPopular && (
                              <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                                <Star className="h-3 w-3 mr-1 fill-current" />
                                Popular
                              </Badge>
                            )}
                            <Badge variant="outline">{service.category}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {service.description || 'Professional service with quality guarantee'}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              {service.duration}
                            </div>
                            <Badge
                              variant={service.status === 'Active' ? 'default' : 'secondary'}
                              className={service.status === 'Active' ? 'bg-green-500' : ''}
                            >
                              {service.status}
                            </Badge>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-sm text-muted-foreground mb-1">Service Price</p>
                          <p className="text-3xl font-bold text-lime-600">
                            {formatCurrency(service.price)}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditService(service);
                            }}
                            className="whitespace-nowrap"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200 whitespace-nowrap"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteService(service.id);
                            }}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>

                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Edit Service Dialog */}
      <EditServiceDialog
        open={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedService(null);
        }}
        onSubmit={handleUpdateService}
        isLoading={updateServiceMutation.isPending}
        service={selectedService}
      />

      {/* Create Service Dialog */}
      <CreateServiceDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={(data) => createServiceMutation.mutate(data)}
        isLoading={createServiceMutation.isPending}
      />

      {/* Import Service Dialog */}
      <ServiceImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
      />
    </div>
  );
}

// Edit Service Dialog Component
function EditServiceDialog({
  open,
  onClose,
  onSubmit,
  isLoading,
  service
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Service>) => void;
  isLoading: boolean;
  service: Service | null;
}) {
  const [formData, setFormData] = useState({
    name: service?.name || '',
    category: service?.category || '',
    description: service?.description || '',
    price: service?.price || '',
    duration: service?.duration || '',
    status: (service?.status || 'Active') as const,
  });

  React.useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        category: service.category,
        description: service.description || '',
        price: service.price,
        duration: service.duration,
        status: service.status,
      });
    }
  }, [service]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>
              Update service information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-service-name">Service Name</Label>
                <Input
                  id="edit-service-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Deep Cleaning Service"
                  required
                  aria-required="true"
                  minLength={2}
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-service-category">Category</Label>
                <Input
                  id="edit-service-category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Cleaning"
                  required
                  aria-required="true"
                  minLength={2}
                  maxLength={50}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-service-description">Description</Label>
                <Textarea
                  id="edit-service-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your service..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-service-price">Price (₹)</Label>
                  <Input
                    id="edit-service-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    required
                    aria-required="true"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-service-duration">Duration</Label>
                  <Input
                    id="edit-service-duration"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 2 hours"
                    required
                    aria-required="true"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-service-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v as 'Active' | 'Inactive' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Service'}
              </Button>
            </DialogFooter>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

// Create Service Dialog Component
function CreateServiceDialog({
  open,
  onClose,
  onSubmit,
  isLoading
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Service>) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    duration: '',
    status: 'Active' as const,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      name: '',
      category: '',
      description: '',
      price: '',
      duration: '',
      status: 'Active',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
            <DialogDescription>
              Create a new service in your catalog
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Service Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Deep Cleaning Service"
                  required
                  aria-required="true"
                  minLength={2}
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Cleaning"
                  required
                  aria-required="true"
                  minLength={2}
                  maxLength={50}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your service..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    required
                    aria-required="true"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 2 hours"
                    required
                    aria-required="true"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v as 'Active' | 'Inactive' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Service'}
              </Button>
            </DialogFooter>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}