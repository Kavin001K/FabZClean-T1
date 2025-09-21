import { useQuery } from '@tanstack/react-query';
import { logisticsApi } from '@/lib/data-service';

interface LogisticsKpiData {
  totalRoutes: number;
  activeRoutes: number;
  completedRoutes: number;
  totalDrivers: number;
  availableDrivers: number;
  onTimeRate: number;
  averageDeliveryTime: number;
  totalRoutesChange: number;
  activeRoutesChange: number;
  completedRoutesChange: number;
  totalDriversChange: number;
  availableDriversChange: number;
  onTimeRateChange: number;
  averageDeliveryTimeChange: number;
}

// Mock API function for logistics KPIs - in real app this would be a proper endpoint
const fetchLogisticsKPIs = async (): Promise<LogisticsKpiData> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Get current logistics data
  const [routes, drivers] = await Promise.all([
    logisticsApi.getRoutes(),
    logisticsApi.getDrivers()
  ]);
  
  // Calculate KPIs (in real app, these would come from the backend)
  const totalRoutes = routes.length;
  const activeRoutes = routes.filter(route => route.status === 'in_progress').length;
  const completedRoutes = routes.filter(route => route.status === 'completed').length;
  const totalDrivers = drivers.length;
  const availableDrivers = drivers.filter(driver => driver.status === 'available').length;
  
  // Calculate on-time rate (mock calculation)
  const completedRoutesWithStops = routes.filter(route => 
    route.status === 'completed' && route.stops.length > 0
  );
  const onTimeDeliveries = completedRoutesWithStops.filter(route => {
    // Mock logic: 85% of completed routes are on time
    return Math.random() > 0.15;
  }).length;
  const onTimeRate = completedRoutesWithStops.length > 0 
    ? (onTimeDeliveries / completedRoutesWithStops.length) * 100 
    : 0;
  
  // Calculate average delivery time (mock calculation)
  const averageDeliveryTime = routes.reduce((sum, route) => {
    return sum + (route.estimatedDuration || 30);
  }, 0) / Math.max(routes.length, 1);
  
  // Mock change percentages (in real app, these would be calculated from historical data)
  const totalRoutesChange = Math.random() * 20 - 5; // -5% to +15%
  const activeRoutesChange = Math.random() * 30 - 10; // -10% to +20%
  const completedRoutesChange = Math.random() * 25 - 5; // -5% to +20%
  const totalDriversChange = Math.random() * 10 - 2; // -2% to +8%
  const availableDriversChange = Math.random() * 40 - 20; // -20% to +20%
  const onTimeRateChange = Math.random() * 15 - 5; // -5% to +10%
  const averageDeliveryTimeChange = Math.random() * 20 - 10; // -10% to +10%
  
  return {
    totalRoutes,
    activeRoutes,
    completedRoutes,
    totalDrivers,
    availableDrivers,
    onTimeRate,
    averageDeliveryTime,
    totalRoutesChange,
    activeRoutesChange,
    completedRoutesChange,
    totalDriversChange,
    availableDriversChange,
    onTimeRateChange,
    averageDeliveryTimeChange,
  };
};

export const useLogisticsKPIs = () => {
  return useQuery({
    queryKey: ['logistics-kpis'],
    queryFn: fetchLogisticsKPIs,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};
