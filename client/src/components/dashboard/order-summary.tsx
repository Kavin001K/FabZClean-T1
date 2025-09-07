import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { formatCurrency } from "@/lib/data";
import type { PosTransaction } from "@shared/schema";

export default function OrderSummary() {
  const { data: transactions, isLoading } = useQuery<PosTransaction[]>({
    queryKey: ["/api/pos/transactions"],
  });

  const { data: metrics } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
  });

  const todayTransactions = transactions?.filter(transaction => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(transaction.createdAt) >= today;
  }) || [];

  const todayRevenue = todayTransactions.reduce((sum, transaction) => 
    sum + parseFloat(transaction.totalAmount), 0
  );

  const averageTransaction = todayTransactions.length > 0 
    ? todayRevenue / todayTransactions.length 
    : 0;

  if (isLoading) {
    return (
      <Card className="bento-card" data-testid="pos-integration">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-display font-semibold text-lg text-foreground">
              POS Integration
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 bg-muted/50 rounded-lg animate-pulse">
              <div className="w-12 h-8 bg-muted rounded mx-auto mb-1"></div>
              <div className="w-16 h-3 bg-muted rounded mx-auto"></div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg animate-pulse">
              <div className="w-16 h-8 bg-muted rounded mx-auto mb-1"></div>
              <div className="w-20 h-3 bg-muted rounded mx-auto"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bento-card" data-testid="order-summary">
      <CardHeader>
        <CardTitle className="text-lg font-semibold tracking-tight">
          Order Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="text-center p-3 sm:p-4 bg-muted/50 rounded-lg">
            <p className="text-lg sm:text-xl lg:text-2xl font-display font-bold text-foreground" data-testid="pos-daily-transactions">
              {todayTransactions.length}
            </p>
            <p className="text-xs text-muted-foreground">Today's Sales</p>
          </div>
          <div className="text-center p-3 sm:p-4 bg-muted/50 rounded-lg">
            <p className="text-lg sm:text-xl lg:text-2xl font-display font-bold text-foreground" data-testid="pos-daily-revenue">
              {formatCurrency(todayRevenue)}
            </p>
            <p className="text-xs text-muted-foreground">Daily Revenue</p>
          </div>
        </div>

        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">Peak Hours</span>
            <span className="font-medium text-foreground">10 AM - 2 PM</span>
          </div>
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">Avg. Transaction</span>
            <span className="font-medium text-foreground" data-testid="pos-avg-transaction">
              {formatCurrency(averageTransaction)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">Top Product</span>
            <span className="font-medium text-foreground">Fab Clean Pro</span>
          </div>
        </div>

        <Button 
          size="sm" 
          variant="outline" 
          className="mt-4 w-full" 
          data-testid="create-new-order"
          onClick={() => {
            window.location.href = '/create-order';
          }}
        >
          Create New Order
        </Button>
      </CardContent>
    </Card>
  );
}
