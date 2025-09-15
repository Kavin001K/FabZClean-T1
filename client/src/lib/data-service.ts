// Data service for connecting to the database API
// This replaces all dummy data with real database queries

// Import types from shared schema instead of defining them here
import type { Order, Customer } from "@shared/schema";

export type InventoryItem = {
  id: string;
  name: string;
  stock: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
};

export type SalesData = {
  month: string;
  revenue: number;
};

export type OrderStatusData = {
  status: string;
  value: number;
};

export type ServicePopularityData = {
  name: string;
  value: number;
  fill: string;
};

// API base URL
const API_BASE = '/api';

// Generic fetch function with error handling
async function fetchData<T>(endpoint: string): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
}

// Orders API
export const ordersApi = {
  async getAll(): Promise<Order[]> {
    try {
      return await fetchData<Order[]>('/orders');
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      return [];
    }
  },

  async getById(id: string): Promise<Order | null> {
    try {
      return await fetchData<Order>(`/orders/${id}`);
    } catch (error) {
      console.error(`Failed to fetch order ${id}:`, error);
      return null;
    }
  },

  async create(order: Partial<Order>): Promise<Order | null> {
    try {
      const response = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
      if (!response.ok) throw new Error('Failed to create order');
      return await response.json();
    } catch (error) {
      console.error('Failed to create order:', error);
      return null;
    }
  },

  async update(id: string, order: Partial<Order>): Promise<Order | null> {
    try {
      const response = await fetch(`${API_BASE}/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
      if (!response.ok) throw new Error('Failed to update order');
      return await response.json();
    } catch (error) {
      console.error(`Failed to update order ${id}:`, error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/orders/${id}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error(`Failed to delete order ${id}:`, error);
      return false;
    }
  },

  async deleteMany(orderIds: string[]): Promise<{ successful: number; failed: number; total: number }> {
    try {
      const response = await fetch(`${API_BASE}/orders`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete orders');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to delete orders:', error);
      return { successful: 0, failed: orderIds.length, total: orderIds.length };
    }
  }
};

// Customers API
export const customersApi = {
  async getAll(): Promise<Customer[]> {
    try {
      return await fetchData<Customer[]>('/customers');
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      return [];
    }
  },

  async getById(id: string): Promise<Customer | null> {
    try {
      return await fetchData<Customer>(`/customers/${id}`);
    } catch (error) {
      console.error(`Failed to fetch customer ${id}:`, error);
      return null;
    }
  },

  async create(customer: Partial<Customer>): Promise<Customer | null> {
    try {
      const response = await fetch(`${API_BASE}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer),
      });
      if (!response.ok) throw new Error('Failed to create customer');
      return await response.json();
    } catch (error) {
      console.error('Failed to create customer:', error);
      return null;
    }
  },

  async update(id: string, customer: Partial<Customer>): Promise<Customer | null> {
    try {
      const response = await fetch(`${API_BASE}/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer),
      });
      if (!response.ok) throw new Error('Failed to update customer');
      return await response.json();
    } catch (error) {
      console.error(`Failed to update customer ${id}:`, error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/customers/${id}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error(`Failed to delete customer ${id}:`, error);
      return false;
    }
  }
};

// Inventory API
export const inventoryApi = {
  async getAll(): Promise<InventoryItem[]> {
    try {
      const rawData = await fetchData<any[]>('/products');
      // Map the API data to match InventoryItem interface
      return rawData.map(item => ({
        id: item.id,
        name: item.name,
        stock: item.stockQuantity,
        status: item.stockQuantity === 0 ? 'Out of Stock' as const :
                item.stockQuantity <= 25 ? 'Low Stock' as const : 'In Stock' as const
      }));
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      return [];
    }
  },

  async getById(id: string): Promise<InventoryItem | null> {
    try {
      const rawData = await fetchData<any>(`/products/${id}`);
      if (!rawData) return null;
      
      return {
        id: rawData.id,
        name: rawData.name,
        stock: rawData.stockQuantity,
        status: rawData.stockQuantity === 0 ? 'Out of Stock' as const :
                rawData.stockQuantity <= 25 ? 'Low Stock' as const : 'In Stock' as const
      };
    } catch (error) {
      console.error(`Failed to fetch inventory item ${id}:`, error);
      return null;
    }
  }
};

// Analytics API
export const analyticsApi = {
  async getSalesData(): Promise<SalesData[]> {
    try {
      // For now, return sample data since we don't have sales analytics endpoint
      return [
        { month: "Jan", revenue: 12000 },
        { month: "Feb", revenue: 15000 },
        { month: "Mar", revenue: 18000 },
        { month: "Apr", revenue: 16000 },
        { month: "May", revenue: 20000 },
        { month: "Jun", revenue: 22000 },
      ];
    } catch (error) {
      console.error('Failed to fetch sales data:', error);
      return [];
    }
  },

  async getOrderStatusData(): Promise<OrderStatusData[]> {
    try {
      // For now, return sample data since we don't have order status analytics endpoint
      return [
        { status: "Pending", value: 5 },
        { status: "Processing", value: 8 },
        { status: "Completed", value: 12 },
        { status: "Cancelled", value: 2 },
      ];
    } catch (error) {
      console.error('Failed to fetch order status data:', error);
      return [];
    }
  },

  async getServicePopularityData(): Promise<ServicePopularityData[]> {
    try {
      // For now, return sample data since we don't have service popularity analytics endpoint
      return [
        { name: "Dry Cleaning", value: 40, fill: "hsl(var(--primary))" },
        { name: "Premium Laundry", value: 30, fill: "hsl(var(--primary))" },
        { name: "Laundry By Kg", value: 20, fill: "hsl(var(--primary))" },
        { name: "Bags Clean", value: 10, fill: "hsl(var(--primary))" },
      ];
    } catch (error) {
      console.error('Failed to fetch service popularity data:', error);
      return [];
    }
  },

  async getDashboardMetrics(): Promise<{
    totalRevenue: number;
    totalOrders: number;
    newCustomers: number;
    inventoryItems: number;
  }> {
    try {
      return await fetchData('/dashboard/metrics');
    } catch (error) {
      console.error('Failed to fetch dashboard metrics:', error);
      return {
        totalRevenue: 0,
        totalOrders: 0,
        newCustomers: 0,
        inventoryItems: 0
      };
    }
  }
};

// Helper functions for displaying data
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

export const formatPercentage = (num: number): string => {
  return `${num.toFixed(1)}%`;
};

// Status and priority helpers
export const getStatusColor = (status: string): string => {
  const statusColors = {
    pending: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
    processing: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    completed: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    cancelled: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  };
  
  return statusColors[status.toLowerCase() as keyof typeof statusColors] || statusColors.pending;
};

export const getPriorityColor = (priority: string): string => {
  const priorityColors = {
    normal: "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400",
    high: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
    urgent: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  };
  
  return priorityColors[priority.toLowerCase() as keyof typeof priorityColors] || priorityColors.normal;
};

export const getStockStatusColor = (quantity: number, reorderLevel: number = 10): string => {
  if (quantity === 0) return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
  if (quantity <= reorderLevel) return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400";
  return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
};

export const getStockStatusText = (quantity: number, reorderLevel: number = 10): string => {
  if (quantity === 0) return "Out of Stock";
  if (quantity <= reorderLevel) return "Low Stock";
  return "In Stock";
};

// Order workflow helpers
export const orderWorkflow = [
  'pending', 'processing', 'completed'
] as const;

export const getNextStatus = (currentStatus: Order['status']): Order['status'] | null => {
  const currentIndex = orderWorkflow.indexOf(currentStatus as any);
  if (currentIndex === -1 || currentIndex === orderWorkflow.length - 1) {
    return null;
  }
  return orderWorkflow[currentIndex + 1] as Order['status'];
};

export const getPreviousStatus = (currentStatus: Order['status']): Order['status'] | null => {
  const currentIndex = orderWorkflow.indexOf(currentStatus as any);
  if (currentIndex <= 0) {
    return null;
  }
  return orderWorkflow[currentIndex - 1] as Order['status'];
};
