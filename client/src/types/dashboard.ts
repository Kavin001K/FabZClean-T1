// Dashboard-specific TypeScript interfaces
export interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  newCustomers: number;
  inventoryItems: number;
  averageOrderValue?: number;
  onTimeDelivery?: number;
  customerSatisfaction?: number;
}

export interface SalesData {
  month: string;
  revenue: number;
  orders?: number;
  date?: string;
}

export interface OrderStatusData {
  status: string;
  value: number;
  color?: string;
}

export interface ServicePopularityData {
  name: string;
  value: number;
  fill: string;
  percentage?: number;
}

export interface CustomerData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  joinDate: string;
  totalSpent: number;
  loyaltyPoints?: number;
  avatar?: string;
}

export interface EmployeeData {
  id: string;
  name: string;
  position: string;
  salary: number;
  status: 'active' | 'inactive';
  joinDate: string;
  performance?: number;
  avatar?: string;
}

export interface AttendanceData {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
  hours?: number;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface DashboardFilters {
  dateRange: DateRange;
  serviceType?: string;
  status?: string;
  employeeId?: string;
}

export interface QuickActionForm {
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  order: {
    customerName: string;
    customerPhone: string;
    service: string;
    quantity: number;
    pickupDate: string;
  };
  employee: {
    name: string;
    phone: string;
    email: string;
    position: string;
    salary: string;
  };
}

export interface DashboardState {
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  filters: DashboardFilters;
  metrics: DashboardMetrics;
  salesData: SalesData[];
  orderStatusData: OrderStatusData[];
  servicePopularityData: ServicePopularityData[];
  recentOrders: any[];
  customers: CustomerData[];
  employees: EmployeeData[];
  attendance: AttendanceData[];
}
