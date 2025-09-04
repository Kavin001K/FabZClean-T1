import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Plus, Package, AlertTriangle, CheckCircle } from "lucide-react";
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-3xl text-foreground">Inventory</h1>
          <p className="text-muted-foreground mt-1">Manage products and stock levels</p>
        </div>
        <Button data-testid="add-product">
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Inventory Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bento-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-display font-bold text-foreground">
                  {formatCurrency(inventoryStats.totalValue)}
                </p>
              </div>
              <Package className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bento-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Stock</p>
                <p className="text-2xl font-display font-bold text-foreground">
                  {inventoryStats.inStock}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bento-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-display font-bold text-foreground">
                  {inventoryStats.lowStock}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bento-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-display font-bold text-foreground">
                  {inventoryStats.outOfStock}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
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
