import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Plus, Package, AlertTriangle, CheckCircle, Brain, TrendingUp, Zap, Target, BarChart3, Clock, Bell } from "lucide-react";
import { getStockStatusColor, getStockStatusText, formatCurrency } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
// Import dummy data
import { dummyInventory, type InventoryItem } from '@/lib/dummy-data';

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [products, setProducts] = useState<InventoryItem[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<InventoryItem[]>([]);
  const { toast } = useToast();

  // Use dummy data instead of API calls
  useEffect(() => {
    setProducts(dummyInventory);
    // Check for low stock items
    const lowStock = dummyInventory.filter(item => item.status === 'Low Stock' || item.status === 'Out of Stock');
    setLowStockAlerts(lowStock);
    
    // Show alerts for low stock items
    if (lowStock.length > 0) {
      lowStock.forEach(item => {
        toast({
          title: "Low Stock Alert",
          description: `${item.name} is ${item.status.toLowerCase()}. Current stock: ${item.stock}`,
          variant: item.status === 'Out of Stock' ? 'destructive' : 'default',
        });
      });
    }
  }, [toast]);

  const filteredProducts = products?.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === "in_stock") {
      matchesStatus = product.status === 'In Stock';
    } else if (statusFilter === "low_stock") {
      matchesStatus = product.status === 'Low Stock';
    } else if (statusFilter === "out_of_stock") {
      matchesStatus = product.status === 'Out of Stock';
    }
    
    return matchesSearch && matchesStatus;
  }) || [];

  const inventoryStats = products?.reduce((acc, product) => {
    const totalValue = acc.totalValue + (product.stock * 100); // Mock price calculation
    if (product.status === 'Out of Stock') {
      acc.outOfStock++;
    } else if (product.status === 'Low Stock') {
      acc.lowStock++;
    } else {
      acc.inStock++;
    }
    return { ...acc, totalValue };
  }, { inStock: 0, lowStock: 0, outOfStock: 0, totalValue: 0 }) || { inStock: 0, lowStock: 0, outOfStock: 0, totalValue: 0 };

  // Add a function to manually trigger low stock alerts
  const triggerLowStockAlerts = () => {
    if (lowStockAlerts.length > 0) {
      lowStockAlerts.forEach(item => {
        toast({
          title: "Low Stock Alert",
          description: `${item.name} is ${item.status.toLowerCase()}. Current stock: ${item.stock}`,
          variant: item.status === 'Out of Stock' ? 'destructive' : 'default',
        });
      });
    } else {
      toast({
        title: "Stock Status",
        description: "All items are well stocked!",
      });
    }
  };

  return (
    <div className="p-8" data-testid="inventory-page">
      {/* Intelligence Command Center Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-display font-bold text-3xl text-foreground">Inventory Intelligence</h1>
              <div className="status-indicator-enhanced bg-green-500"></div>
              <span className="text-sm text-muted-foreground">AI Active</span>
            </div>
            <p className="text-muted-foreground">Predictive analytics and intelligent stock management</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            data-testid="ai-insights"
            onClick={() => {
              console.log("Opening AI insights...");
              alert("AI Insights feature coming soon! This would show predictive analytics, demand forecasting, and intelligent recommendations.");
            }}
          >
            <Zap className="w-4 h-4 mr-2" />
            AI Insights
          </Button>
          <Button 
            data-testid="add-product"
            onClick={() => {
              console.log("Adding new product...");
              // Using toast instead of alert for better UX
              console.log("Product creation feature coming soon! This would open a modal to add a new product.");
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Low Stock Alerts Section */}
      {lowStockAlerts.length > 0 && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <Bell className="h-5 w-5" />
                Low Stock Alerts ({lowStockAlerts.length})
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={triggerLowStockAlerts}
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                <Bell className="h-4 w-4 mr-2" />
                Show Alerts
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockAlerts.map((item) => (
                <div key={item.id} className="p-3 bg-white rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">Stock: {item.stock}</p>
                    </div>
                    <Badge 
                      className={
                        item.status === 'Out of Stock' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-orange-100 text-orange-800'
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Predictive Analytics Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <Card className="bento-card lg:col-span-2 animate-fade-in">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-foreground">Demand Forecast</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Next 30 days prediction</p>
                </div>
              </div>
              <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs sm:text-sm">
                94% Accuracy
              </Badge>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Dry Cleaning Services</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="w-4/5 h-full bg-blue-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium">+18%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Laundry Detergents</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="w-3/5 h-full bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium">+12%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Fabric Softeners</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="w-2/5 h-full bg-yellow-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium">+8%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bento-card animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-foreground">Restock Alerts</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">AI recommendations</p>
              </div>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between p-2 sm:p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-red-700 dark:text-red-400">Critical</p>
                  <p className="text-xs text-red-600 dark:text-red-500">3 items need restocking</p>
                </div>
                <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
              </div>
              <div className="flex items-center justify-between p-2 sm:p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-yellow-700 dark:text-yellow-400">Warning</p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-500">5 items low stock</p>
                </div>
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <Card className="bento-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Value</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-display font-bold text-foreground">
                  {formatCurrency(inventoryStats.totalValue)}
                </p>
              </div>
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bento-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">In Stock</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-display font-bold text-foreground">
                  {inventoryStats.inStock}
                </p>
              </div>
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bento-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Low Stock</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-display font-bold text-foreground">
                  {inventoryStats.lowStock}
                </p>
              </div>
              <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bento-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Out of Stock</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-display font-bold text-foreground">
                  {inventoryStats.outOfStock}
                </p>
              </div>
              <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card className="bento-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-display font-semibold text-xl text-foreground">
              Product Inventory
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                  data-testid="search-products"
                />
              </div>
              <Button variant="outline" size="sm" data-testid="filter-products">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id} data-testid={`product-row-${product.id}`}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{product.name}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{product.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{product.stock}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={
                        product.status === 'In Stock' 
                          ? 'bg-green-100 text-green-800' 
                          : product.status === 'Low Stock'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" data-testid={`edit-product-${product.id}`}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
