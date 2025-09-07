import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Truck } from "lucide-react";
import { getStatusColor } from "@/lib/data";
import { format } from "date-fns";
import type { Delivery } from "@shared/schema";

export default function DeliveryTracking() {
  const { data: deliveries, isLoading } = useQuery<Delivery[]>({
    queryKey: ["/api/deliveries"],
    select: (data) => data?.slice(0, 3) || [], // Show only 3 deliveries
  });

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case "pending": return 0;
      case "in_transit": return 75;
      case "delivered": return 100;
      default: return 0;
    }
  };

  if (isLoading) {
    return (
      <Card className="bento-card" data-testid="delivery-tracking">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-display font-semibold text-lg text-foreground">
              Delivery Tracking
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-border rounded-lg p-4 animate-pulse">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-muted rounded"></div>
                    <div className="w-20 h-4 bg-muted rounded"></div>
                  </div>
                  <div className="w-16 h-5 bg-muted rounded"></div>
                </div>
                <div className="w-32 h-3 bg-muted rounded mb-2"></div>
                <div className="w-full h-2 bg-muted rounded"></div>
                <div className="w-24 h-3 bg-muted rounded mt-2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bento-card" data-testid="delivery-tracking">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-display font-semibold text-sm sm:text-lg text-foreground">
            Delivery Tracking
          </CardTitle>
          <Button 
            variant="link" 
            size="sm" 
            data-testid="view-map"
            className="text-xs sm:text-sm"
            onClick={() => {
              console.log("Opening delivery map...");
              alert("Delivery map feature coming soon! This would show real-time delivery locations and routes.");
            }}
          >
            View Map
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 sm:space-y-4">
          {deliveries?.map((delivery) => (
            <div 
              key={delivery.id} 
              className="border border-border rounded-lg p-3 sm:p-4"
              data-testid={`delivery-${delivery.vehicleId}`}
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="flex items-center gap-1 sm:gap-2">
                  <Truck className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                  <span className="font-medium text-xs sm:text-sm text-foreground">{delivery.vehicleId}</span>
                </div>
                <Badge className={`text-xs ${getStatusColor(delivery.status)}`}>
                  {delivery.status.replace('_', ' ').charAt(0).toUpperCase() + delivery.status.replace('_', ' ').slice(1)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Driver: {delivery.driverName}
              </p>
              <Progress 
                value={getProgressPercentage(delivery.status)} 
                className="w-full h-1.5 sm:h-2 mb-2" 
              />
              <p className="text-xs text-muted-foreground">
                {delivery.estimatedDelivery && delivery.status !== "delivered" && (
                  <>ETA: {format(new Date(delivery.estimatedDelivery), "h:mm a")}</>
                )}
                {delivery.actualDelivery && delivery.status === "delivered" && (
                  <>Completed: {format(new Date(delivery.actualDelivery), "h:mm a")}</>
                )}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
