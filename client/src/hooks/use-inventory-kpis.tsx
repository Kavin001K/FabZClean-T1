import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '@/lib/data-service';
import type { InventoryItem } from '@/lib/data-service';

interface InventoryKpiData {
  totalItems: number;
  totalValue: number;
  inStockItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalItemsChange: number;
  totalValueChange: number;
  inStockItemsChange: number;
  lowStockItemsChange: number;
  outOfStockItemsChange: number;
}

// Mock API function for inventory KPIs - in real app this would be a proper endpoint
const fetchInventoryKPIs = async (): Promise<InventoryKpiData> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Get current inventory data
  const inventory = await inventoryApi.getAll();
  
  // Calculate KPIs (in real app, these would come from the backend)
  const totalItems = inventory.length;
  const inStockItems = inventory.filter(item => item.status === 'In Stock').length;
  const lowStockItems = inventory.filter(item => item.status === 'Low Stock').length;
  const outOfStockItems = inventory.filter(item => item.status === 'Out of Stock').length;
  
  // Calculate total value
  const totalValue = inventory.reduce((sum, item) => {
    const price = item.price || 0;
    const stock = item.stock || 0;
    return sum + (price * stock);
  }, 0);
  
  // Mock change percentages (in real app, these would be calculated from historical data)
  const totalItemsChange = Math.random() * 15 - 3; // -3% to +12%
  const totalValueChange = Math.random() * 25 - 5; // -5% to +20%
  const inStockItemsChange = Math.random() * 10 - 2; // -2% to +8%
  const lowStockItemsChange = Math.random() * 20 - 10; // -10% to +10%
  const outOfStockItemsChange = Math.random() * 30 - 15; // -15% to +15%
  
  return {
    totalItems,
    totalValue,
    inStockItems,
    lowStockItems,
    outOfStockItems,
    totalItemsChange,
    totalValueChange,
    inStockItemsChange,
    lowStockItemsChange,
    outOfStockItemsChange,
  };
};

export const useInventoryKPIs = () => {
  return useQuery({
    queryKey: ['inventory-kpis'],
    queryFn: fetchInventoryKPIs,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};
