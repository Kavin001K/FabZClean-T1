import { useQuery } from '@tanstack/react-query';
import { customersApi } from '@/lib/data-service';

interface CustomerKpiData {
  totalCustomers: number;
  newCustomers: number;
  repeatCustomers: number;
  averageSpend: number;
  totalCustomersChange: number;
  newCustomersChange: number;
  repeatCustomersChange: number;
  averageSpendChange: number;
  // Additional metrics for demo
  totalRevenue: number;
  totalRevenueChange: number;
  averageOrderValue: number;
  averageOrderValueChange: number;
  customerRetentionRate: number;
  customerRetentionRateChange: number;
}

// Mock API function for customer KPIs - in real app this would be a proper endpoint
const fetchCustomerKPIs = async (): Promise<CustomerKpiData> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Get current customers data
  const customers = await customersApi.getAll();
  
  // Calculate KPIs (in real app, these would come from the backend)
  const totalCustomers = customers.length;
  
  // Calculate new customers (joined in last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newCustomers = customers.filter(customer => 
    new Date(customer.createdAt || new Date()) > thirtyDaysAgo
  ).length;
  
  // Calculate repeat customers (more than 1 order)
  const repeatCustomers = customers.filter(customer => 
    (customer.totalOrders || 0) > 1
  ).length;
  
  // Calculate average spend
  const totalSpent = customers.reduce((sum, customer) => 
    sum + parseFloat(customer.totalSpent || '0'), 0
  );
  const averageSpend = totalCustomers > 0 ? totalSpent / totalCustomers : 0;
  
  // Calculate repeat rate percentage
  const repeatRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;
  
  // Calculate total orders for additional metrics
  const totalOrders = customers.reduce((sum, customer) => 
    sum + (customer.totalOrders || 0), 0
  );
  
  // Calculate additional metrics
  const totalRevenue = totalSpent;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const customerRetentionRate = repeatRate;

  // Mock change percentages (in real app, these would be calculated from historical data)
  const totalCustomersChange = Math.random() * 20 - 5; // -5% to +15%
  const newCustomersChange = Math.random() * 30 - 10; // -10% to +20%
  const repeatCustomersChange = Math.random() * 10 - 2; // -2% to +8%
  const averageSpendChange = Math.random() * 25 - 5; // -5% to +20%
  const totalRevenueChange = Math.random() * 30 - 8; // -8% to +22%
  const averageOrderValueChange = Math.random() * 15 - 3; // -3% to +12%
  const customerRetentionRateChange = Math.random() * 8 - 2; // -2% to +6%
  
  return {
    totalCustomers,
    newCustomers,
    repeatCustomers: repeatRate,
    averageSpend,
    totalCustomersChange,
    newCustomersChange,
    repeatCustomersChange,
    averageSpendChange,
    totalRevenue,
    totalRevenueChange,
    averageOrderValue,
    averageOrderValueChange,
    customerRetentionRate,
    customerRetentionRateChange,
  };
};

export const useCustomerKPIs = () => {
  return useQuery({
    queryKey: ['customer-kpis'],
    queryFn: fetchCustomerKPIs,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};
