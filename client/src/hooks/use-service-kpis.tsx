import { useQuery } from '@tanstack/react-query';
import { servicesApi } from '@/lib/data-service';

interface ServiceKpiData {
  totalServices: number;
  activeServices: number;
  averagePrice: number;
  totalRevenue: number;
  totalServicesChange: number;
  activeServicesChange: number;
  averagePriceChange: number;
  totalRevenueChange: number;
}

// Mock API function for service KPIs - in real app this would be a proper endpoint
const fetchServiceKPIs = async (): Promise<ServiceKpiData> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Get current services data
  const services = await servicesApi.getAll();
  
  // Calculate KPIs (in real app, these would come from the backend)
  const totalServices = services.length;
  const activeServices = services.filter(service => service.status === 'Active').length;
  
  // Calculate average price
  const totalPrice = services.reduce((sum, service) => 
    sum + parseFloat(service.price), 0
  );
  const averagePrice = totalServices > 0 ? totalPrice / totalServices : 0;
  
  // Calculate total revenue (mock calculation)
  const totalRevenue = totalPrice * 10; // Mock multiplier for revenue calculation
  
  // Mock change percentages (in real app, these would be calculated from historical data)
  const totalServicesChange = Math.random() * 15 - 3; // -3% to +12%
  const activeServicesChange = Math.random() * 20 - 5; // -5% to +15%
  const averagePriceChange = Math.random() * 10 - 2; // -2% to +8%
  const totalRevenueChange = Math.random() * 25 - 5; // -5% to +20%
  
  return {
    totalServices,
    activeServices,
    averagePrice,
    totalRevenue,
    totalServicesChange,
    activeServicesChange,
    averagePriceChange,
    totalRevenueChange,
  };
};

export const useServiceKPIs = () => {
  return useQuery({
    queryKey: ['service-kpis'],
    queryFn: fetchServiceKPIs,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};
