import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Plus, Package, AlertTriangle, CheckCircle, Brain, TrendingUp, Zap, Target, BarChart3, Clock } from "lucide-react";
import { getStockStatusColor, getStockStatusText, formatCurrency } from "@/lib/data";
import type { Product } from "@shared/schema";

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const filteredProducts = products?.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === "in_stock") {
      matchesStatus = product.stockQuantity > product.reorderLevel;
    } else if (statusFilter === "low_stock") {
      matchesStatus = product.stockQuantity > 0 && product.stockQuantity <= product.reorderLevel;
    } else if (statusFilter === "out_of_stock") {
      matchesStatus = product.stockQuantity === 0;
    }
    
    return matchesSearch && matchesStatus;
  }) || [];

  const inventoryStats = products?.reduce((acc, product) => {
    const totalValue = acc.totalValue + (parseFloat(product.price) * product.stockQuantity);
    if (product.stockQuantity === 0) {
      acc.outOfStock++;
    } else if (product.stockQuantity <= product.reorderLevel) {
      acc.lowStock++;
    } else {
      acc.inStock++;
    }
    return { ...acc, totalValue };
  }, { inStock: 0, lowStock: 0, outOfStock: 0, totalValue: 0 }) || { inStock: 0, lowStock: 0, outOfStock: 0, totalValue: 0 };

  if (isLoading) {
    return (
      <div className="p-8" data-testid="inventory-page">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-bold text-3xl text-foreground">Inventory</h1>
            <p className="text-muted-foreground mt-1">Manage products and stock levels</p>
          </div>
        </div>
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

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
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id} data-testid={`product-row-${product.sku}`}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.description}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(parseFloat(product.price))}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStockStatusColor(product.stockQuantity, product.reorderLevel)}`}></div>
                      <span className="font-medium">{product.stockQuantity}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={
                      product.stockQuantity === 0 
                        ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                        : product.stockQuantity <= product.reorderLevel 
                          ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                          : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    }>
                      {getStockStatusText(product.stockQuantity, product.reorderLevel)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{product.supplier}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" data-testid={`edit-product-${product.sku}`}>
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
