import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Clock, CheckCircle, AlertCircle, Zap } from "lucide-react";

interface ServiceStatus {
  id: string;
  name: string;
  type: 'express' | 'standard' | 'premium';
  status: 'active' | 'busy' | 'maintenance';
  ordersInQueue: number;
  avgProcessingTime: string;
  efficiency: number;
}

export default function ServiceStatus() {
  // Mock service data for dry cleaning services
  const services: ServiceStatus[] = [
    {
      id: '1',
      name: 'Express Cleaning',
      type: 'express',
      status: 'active',
      ordersInQueue: 3,
      avgProcessingTime: '2 hours',
      efficiency: 95
    },
    {
      id: '2',
      name: 'Standard Cleaning',
      type: 'standard',
      status: 'busy',
      ordersInQueue: 8,
      avgProcessingTime: '24 hours',
      efficiency: 88
    },
    {
      id: '3',
      name: 'Premium Care',
      type: 'premium',
      status: 'active',
      ordersInQueue: 2,
      avgProcessingTime: '48 hours',
      efficiency: 92
    },
    {
      id: '4',
      name: 'Wedding Dress Care',
      type: 'premium',
      status: 'maintenance',
      ordersInQueue: 0,
      avgProcessingTime: '72 hours',
      efficiency: 85
    },
    {
      id: '5',
      name: 'Leather & Suede',
      type: 'premium',
      status: 'active',
      ordersInQueue: 1,
      avgProcessingTime: '36 hours',
      efficiency: 90
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'busy':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'maintenance':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-200 text-green-900 dark:bg-green-500 dark:text-white font-semibold';
      case 'busy':
        return 'bg-yellow-200 text-yellow-900 dark:bg-yellow-500 dark:text-white font-semibold';
      case 'maintenance':
        return 'bg-red-200 text-red-900 dark:bg-red-500 dark:text-white font-semibold';
      default:
        return 'bg-blue-200 text-blue-900 dark:bg-blue-500 dark:text-white font-semibold';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'express':
        return <Zap className="w-4 h-4 text-blue-500" />;
      case 'premium':
        return <Sparkles className="w-4 h-4 text-purple-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <Card className="bento-card" data-testid="service-status">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-h3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Service Status
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="status-indicator status-online"></div>
            <span className="text-caption text-muted-foreground">Live Updates</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 sm:space-y-4">
          {services.map((service, index) => (
            <div 
              key={service.id} 
              className="p-3 sm:p-5 rounded-lg border border-border hover:shadow-sm transition-shadow duration-200"
              data-testid={`service-item-${service.id}`}
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <p className="text-xs sm:text-label font-medium text-foreground">{service.name}</p>
                    <div className="flex items-center gap-1 sm:gap-2 mt-1">
                      {getTypeIcon(service.type)}
                      <span className="text-xs sm:text-caption text-muted-foreground capitalize">{service.type}</span>
                    </div>
                  </div>
                </div>
                <Badge className={`${getStatusColor(service.status)} text-xs sm:text-sm`}>
                  {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                </Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                <div className="p-2 sm:p-3 bg-primary/10 dark:bg-primary/20 rounded-lg border border-primary/30 dark:border-primary/40">
                  <p className="text-xs sm:text-caption text-primary dark:text-white font-semibold mb-1">Queue</p>
                  <p className="text-sm sm:text-label font-bold text-primary dark:text-white">{service.ordersInQueue}</p>
                </div>
                <div className="p-2 sm:p-3 bg-secondary/10 dark:bg-secondary/20 rounded-lg border border-secondary/30 dark:border-secondary/40">
                  <p className="text-xs sm:text-caption text-secondary dark:text-white font-semibold mb-1">Avg Time</p>
                  <p className="text-sm sm:text-label font-bold text-secondary dark:text-white">{service.avgProcessingTime}</p>
                </div>
                <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-500 rounded-lg border border-green-300 dark:border-green-400">
                  <p className="text-xs sm:text-caption text-green-900 dark:text-white font-semibold mb-1">Efficiency</p>
                  <p className="text-sm sm:text-label font-bold text-green-900 dark:text-white">{service.efficiency}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="text-caption text-muted-foreground">
              Total Active Services: {services.filter(s => s.status === 'active').length}
            </div>
            <Button variant="outline" size="sm" className="text-caption">
              View All Services
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
