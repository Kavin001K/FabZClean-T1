import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getStockStatusColor, getStockStatusText } from "@/lib/data";
import type { Product } from "@shared/schema";

export default function InventoryStatus() {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    select: (data) => data?.slice(0, 5) || [], // Show only 5 products
  });

  if (isLoading) {
    return (
      <Card className="bento-card" data-testid="inventory-status">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-display font-semibold text-lg text-foreground">
              Inventory Status
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-muted rounded-full"></div>
                  <div>
                    <div className="w-32 h-4 bg-muted rounded"></div>
                    <div className="w-20 h-3 bg-muted rounded mt-1"></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="w-16 h-4 bg-muted rounded"></div>
                  <div className="w-12 h-3 bg-muted rounded mt-1"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bento-card" data-testid="inventory-status">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-display font-semibold text-lg text-foreground">
            Inventory Status
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="status-indicator status-online"></div>
            <span className="text-sm text-muted-foreground">Real-time</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products?.map((product) => (
            <div 
              key={product.id} 
              className="flex items-center justify-between"
              data-testid={`inventory-item-${product.sku}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${getStockStatusColor(product.stockQuantity, product.reorderLevel)}`}></div>
                <div>
                  <p className="font-medium text-sm text-foreground">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-sm text-foreground">{product.stockQuantity}</p>
                <p className={`text-xs ${
                  product.stockQuantity === 0 
                    ? "text-red-600 dark:text-red-400" 
                    : product.stockQuantity <= product.reorderLevel 
                      ? "text-yellow-600 dark:text-yellow-400" 
                      : "text-muted-foreground"
                }`}>
                  {getStockStatusText(product.stockQuantity, product.reorderLevel)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
