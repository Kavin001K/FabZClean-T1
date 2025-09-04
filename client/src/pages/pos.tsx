import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ShoppingCart, CreditCard, DollarSign, Plus, Minus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/data";
import type { Product, PosTransaction } from "@shared/schema";

interface CartItem {
  product: Product;
  quantity: number;
}

export default function POS() {
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery<PosTransaction[]>({
    queryKey: ["/api/pos/transactions"],
  });

  const filteredProducts = products?.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.product.id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.product.id !== productId));
    } else {
      setCart(prev =>
        prev.map(item =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const cartTotal = cart.reduce((total, item) => 
    total + (parseFloat(item.product.price) * item.quantity), 0
  );

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer("");
  };

  const processPayment = () => {
    // In a real application, this would process the payment
    // For now, we'll just clear the cart
    clearCart();
    // Show success message
  };

  const todayTransactions = transactions?.filter(transaction => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(transaction.createdAt) >= today;
  }) || [];

  const todayRevenue = todayTransactions.reduce((sum, transaction) => 
    sum + parseFloat(transaction.totalAmount), 0
  );

  return (
    <div className="p-8 animate-fade-in" data-testid="pos-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-expressive text-4xl text-foreground mb-2">Point of Sale</h1>
          <p className="text-muted-foreground text-lg">Touch-optimized transaction processing</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="status-indicator-enhanced bg-green-500"></div>
          <span className="text-sm font-medium text-foreground">POS System Online</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Product Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bento-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Today's Sales</p>
                    <p className="text-xl font-display font-bold text-foreground">
                      {todayTransactions.length}
                    </p>
                  </div>
                  <ShoppingCart className="w-6 h-6 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bento-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="text-xl font-display font-bold text-foreground">
                      {formatCurrency(todayRevenue)}
                    </p>
                  </div>
                  <DollarSign className="w-6 h-6 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bento-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Sale</p>
                    <p className="text-xl font-display font-bold text-foreground">
                      {formatCurrency(todayTransactions.length > 0 ? todayRevenue / todayTransactions.length : 0)}
                    </p>
                  </div>
                  <CreditCard className="w-6 h-6 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Product Grid */}
          <Card className="bento-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-display font-semibold text-lg text-foreground">
                  Product Catalog
                </CardTitle>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                    data-testid="search-pos-products"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="p-4 border border-border rounded-lg animate-pulse">
                      <div className="w-full h-4 bg-muted rounded mb-2"></div>
                      <div className="w-16 h-3 bg-muted rounded mb-2"></div>
                      <div className="w-20 h-6 bg-muted rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <div 
                      key={product.id}
                      className="pos-product-card interactive-press animate-scale-in"
                      onClick={() => addToCart(product)}
                      data-testid={`pos-product-${product.sku}`}
                      style={{ animationDelay: `${filteredProducts.indexOf(product) * 0.05}s` }}
                    >
                      {/* Product Image Placeholder */}
                      <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center mb-4 mx-auto">
                        <span className="text-2xl font-bold text-primary">
                          {product.name.charAt(0)}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="font-semibold text-foreground text-center leading-tight">
                          {product.name}
                        </h3>
                        <p className="text-xs text-muted-foreground text-center">
                          SKU: {product.sku}
                        </p>
                        
                        <div className="flex items-center justify-between pt-2">
                          <span className="font-display font-bold text-xl text-foreground">
                            {formatCurrency(parseFloat(product.price))}
                          </span>
                          <Badge 
                            variant={product.stockQuantity > 0 ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {product.stockQuantity > 0 ? "In Stock" : "Out of Stock"}
                          </Badge>
                        </div>
                        
                        {/* Stock indicator */}
                        <div className="flex items-center justify-center gap-1 pt-1">
                          <div className={`w-2 h-2 rounded-full ${
                            product.stockQuantity > 10 ? 'bg-green-500' :
                            product.stockQuantity > 0 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <span className="text-xs text-muted-foreground">
                            {product.stockQuantity} available
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cart and Checkout */}
        <div className="space-y-6">
          {/* Current Transaction */}
          <Card className="bento-card">
            <CardHeader>
              <CardTitle className="font-display font-semibold text-lg text-foreground flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Current Sale ({cartItemCount} items)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No items in cart. Click on products to add them.
                </p>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div 
                      key={item.product.id} 
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      data-testid={`cart-item-${item.product.sku}`}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm text-foreground">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(parseFloat(item.product.price))} each
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="pos-touch-target interactive-press"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          data-testid={`decrease-quantity-${item.product.sku}`}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-12 text-center font-semibold text-lg">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="pos-touch-target interactive-press"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          data-testid={`increase-quantity-${item.product.sku}`}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="pos-touch-target interactive-press"
                          onClick={() => removeFromCart(item.product.id)}
                          data-testid={`remove-item-${item.product.sku}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(cartTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax:</span>
                      <span className="font-medium">{formatCurrency(cartTotal * 0.08)}</span>
                    </div>
                    <div className="flex justify-between text-2xl font-bold">
                      <span>Total:</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Payment Methods */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-foreground">Payment Method</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="pos-payment-method selected">
                          <CreditCard className="w-5 h-5 text-primary" />
                          <span className="font-medium">Card</span>
                        </div>
                        <div className="pos-payment-method">
                          <DollarSign className="w-5 h-5 text-muted-foreground" />
                          <span className="font-medium">Cash</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      className="pos-checkout-button interactive-press"
                      onClick={handleCheckout}
                      disabled={cart.length === 0}
                      data-testid="pos-checkout-button"
                    >
                      <CreditCard className="w-5 h-5 mr-2" />
                      Process Payment
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
