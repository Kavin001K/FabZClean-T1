import { ServiceImportDialog } from '@/components/services/service-import-dialog';

// ... (keep existing imports)

export default function Services() {
  // State for dialog management
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  // UI State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  // ... (keep existing state)

  // ... (keep queries/mutations)

  const handlePrintPriceList = () => {
    // ... (keep existing)
  };

  // Error state
  if (servicesError) {
    // ... (keep existing)
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
          {/* ... (Print and Export buttons) */}
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

          <Button variant="outline" size="sm" onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>

          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        </div>
      </motion.div>

      {/* ... (Rest of UI) */}

      <ServiceImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
      />


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

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{service.duration}</span>
                      </div>

                      <div className="pt-3 border-t">
                        <div className="flex items-end justify-between mb-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Service Price</p>
                            <p className="text-2xl font-bold text-lime-600">
                              {formatCurrency(service.price)}
                            </p>
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
                            className="flex-1 group-hover:bg-lime-600"
                            size="sm"
                            onClick={() => handleAddToOrder(service)}
                            disabled={service.status !== 'Active'}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Add to Order
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
                            onClick={() => handleAddToOrder(service)}
                            disabled={service.status !== 'Active'}
                            className="whitespace-nowrap"
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Add to Order
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

      {/* Add to Order Dialog */}
      <AddToOrderDialog
        open={isOrderDialogOpen}
        onClose={() => {
          setIsOrderDialogOpen(false);
          setSelectedService(null);
        }}
        service={selectedService}
      />

      {/* Excel Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Import Services from Excel
            </DialogTitle>
            <DialogDescription>
              Review the parsed data before importing. Services with the same name will be updated.
            </DialogDescription>
          </DialogHeader>

          {importResult && (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 text-center">
                  <p className="text-2xl font-bold">{importResult.totalRows}</p>
                  <p className="text-sm text-muted-foreground">Total Rows</p>
                </Card>
                <Card className="p-4 text-center border-green-200 bg-green-50">
                  <p className="text-2xl font-bold text-green-600">{importResult.validRows}</p>
                  <p className="text-sm text-muted-foreground">Valid</p>
                </Card>
                <Card className="p-4 text-center border-red-200 bg-red-50">
                  <p className="text-2xl font-bold text-red-600">{importResult.invalidRows}</p>
                  <p className="text-sm text-muted-foreground">With Errors</p>
                </Card>
              </div>

              {/* Errors */}
              {importResult.errors.length > 0 && (
                <Card className="border-red-200 bg-red-50/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-red-600 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Validation Errors ({importResult.errors.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm max-h-32 overflow-y-auto">
                    <ul className="space-y-1">
                      {importResult.errors.slice(0, 10).map((error, i) => (
                        <li key={i} className="text-red-600">{error}</li>
                      ))}
                      {importResult.errors.length > 10 && (
                        <li className="text-red-500 font-medium">...and {importResult.errors.length - 10} more errors</li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Preview Table */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Preview ({importResult.validRows} services will be imported)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="p-2 text-left">Status</th>
                          <th className="p-2 text-left">Name</th>
                          <th className="p-2 text-left">Category</th>
                          <th className="p-2 text-right">Price</th>
                          <th className="p-2 text-left">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importResult.parsedServices.slice(0, 20).map((service, i) => (
                          <tr key={i} className={service.isValid ? '' : 'bg-red-50'}>
                            <td className="p-2">
                              {service.isValid ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              )}
                            </td>
                            <td className="p-2 font-medium">{service.name || '-'}</td>
                            <td className="p-2">{service.category || '-'}</td>
                            <td className="p-2 text-right">₹{service.price}</td>
                            <td className="p-2">{service.duration || '-'}</td>
                          </tr>
                        ))}
                        {importResult.parsedServices.length > 20 && (
                          <tr>
                            <td colSpan={5} className="p-2 text-center text-muted-foreground">
                              ...and {importResult.parsedServices.length - 20} more rows
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Progress */}
              {isImporting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Importing services...</span>
                    <span>{importProgress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-lime-500 transition-all duration-300"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsImportDialogOpen(false);
                setImportResult(null);
              }}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkImport}
              disabled={isImporting || !importResult || importResult.validRows === 0}
            >
              {isImporting ? (
                <>Importing...</>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import {importResult?.validRows || 0} Services
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

// Add to Order Dialog Component
function AddToOrderDialog({
  open,
  onClose,
  service
}: {
  open: boolean;
  onClose: () => void;
  service: Service | null;
}) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  if (!service) return null;

  const handleAddToOrder = () => {
    onClose();
    setLocation(`/create-order?serviceId=${service.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          <DialogHeader>
            <DialogTitle>Add Service to Order</DialogTitle>
            <DialogDescription>
              Review service details before adding to order
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <h3 className="font-semibold text-lg">{service.name}</h3>
              <Badge variant="outline" className="mt-1">{service.category}</Badge>
            </div>

            {service.description && (
              <p className="text-sm text-muted-foreground">{service.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-medium">{service.duration}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="text-xl font-bold text-lime-600">
                  {formatCurrency(service.price)}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleAddToOrder}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Confirm & Add
            </Button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}