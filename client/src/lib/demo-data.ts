// Comprehensive demo data for client demonstration
export const demoEmployees = [
  {
    id: '1',
    employeeId: 'EMP-001',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@fabzclean.com',
    phone: '+91 98765 43210',
    address: '123 Main St, Bangalore, KA 560001',
    position: 'Dry Cleaning Specialist',
    department: 'Operations',
    hireDate: '2024-01-15',
    salaryType: 'monthly' as 'hourly' | 'monthly',
    baseSalary: 45000,
    workingHours: 8,
    status: 'active' as 'active' | 'inactive' | 'terminated',
    emergencyContact: 'John Johnson - +91 98765 43211',
    qualifications: 'Bachelor in Textile Engineering, 3 years experience',
    notes: 'Excellent performance, team player',
    createdAt: '2024-01-15T00:00:00Z'
  },
  {
    id: '2',
    employeeId: 'EMP-002',
    name: 'Mike Chen',
    email: 'mike.chen@fabzclean.com',
    phone: '+91 98765 43212',
    address: '456 Oak Ave, Bangalore, KA 560002',
    position: 'Delivery Driver',
    department: 'Logistics',
    hireDate: '2024-02-01',
    salaryType: 'hourly' as 'hourly' | 'monthly',
    baseSalary: 0,
    hourlyRate: 250,
    workingHours: 8,
    status: 'active' as 'active' | 'inactive' | 'terminated',
    emergencyContact: 'Lisa Chen - +91 98765 43213',
    qualifications: 'Valid Driving License, 5 years experience',
    notes: 'Reliable driver, good customer service',
    createdAt: '2024-02-01T00:00:00Z'
  },
  {
    id: '3',
    employeeId: 'EMP-003',
    name: 'Lisa Wang',
    email: 'lisa.wang@fabzclean.com',
    phone: '+91 98765 43214',
    address: '789 Pine St, Bangalore, KA 560003',
    position: 'Customer Service Representative',
    department: 'Customer Service',
    hireDate: '2024-03-01',
    salaryType: 'monthly' as 'hourly' | 'monthly',
    baseSalary: 38000,
    workingHours: 8,
    status: 'active' as 'active' | 'inactive' | 'terminated',
    emergencyContact: 'David Wang - +91 98765 43215',
    qualifications: 'MBA in Customer Relations, 2 years experience',
    notes: 'Great communication skills',
    createdAt: '2024-03-01T00:00:00Z'
  },
  {
    id: '4',
    employeeId: 'EMP-004',
    name: 'David Wilson',
    email: 'david.wilson@fabzclean.com',
    phone: '+91 98765 43216',
    address: '321 Elm St, Bangalore, KA 560004',
    position: 'Quality Inspector',
    department: 'Quality Control',
    hireDate: '2024-01-20',
    salaryType: 'monthly' as 'hourly' | 'monthly',
    baseSalary: 42000,
    workingHours: 8,
    status: 'active' as 'active' | 'inactive' | 'terminated',
    emergencyContact: 'Mary Wilson - +91 98765 43217',
    qualifications: 'Textile Technology Diploma, 4 years experience',
    notes: 'Detail-oriented, quality focused',
    createdAt: '2024-01-20T00:00:00Z'
  },
  {
    id: '5',
    employeeId: 'EMP-005',
    name: 'Maria Garcia',
    email: 'maria.garcia@fabzclean.com',
    phone: '+91 98765 43218',
    address: '654 Maple Ave, Bangalore, KA 560005',
    position: 'Driver',
    department: 'Logistics',
    hireDate: '2024-02-15',
    salaryType: 'hourly' as 'hourly' | 'monthly',
    baseSalary: 0,
    hourlyRate: 280,
    workingHours: 8,
    status: 'active' as 'active' | 'inactive' | 'terminated',
    emergencyContact: 'Carlos Garcia - +91 98765 43219',
    qualifications: 'Commercial Driving License, 6 years experience',
    notes: 'Safe driver, punctual',
    createdAt: '2024-02-15T00:00:00Z'
  },
  {
    id: '6',
    employeeId: 'EMP-006',
    name: 'John Smith',
    email: 'john.smith@fabzclean.com',
    phone: '+91 98765 43220',
    address: '987 Cedar St, Bangalore, KA 560006',
    position: 'Machine Operator',
    department: 'Operations',
    hireDate: '2024-03-10',
    salaryType: 'monthly' as 'hourly' | 'monthly',
    baseSalary: 35000,
    workingHours: 8,
    status: 'active' as 'active' | 'inactive' | 'terminated',
    emergencyContact: 'Jane Smith - +91 98765 43221',
    qualifications: 'Technical Diploma, 3 years experience',
    notes: 'Skilled operator, safety conscious',
    createdAt: '2024-03-10T00:00:00Z'
  }
];

export const demoAttendanceRecords = [
  // Today's records
  {
    id: 'att-1-today',
    employeeId: '1',
    employeeName: 'Sarah Johnson',
    date: new Date().toISOString().split('T')[0],
    checkIn: '08:45',
    checkOut: '17:30',
    breakStart: '12:00',
    breakEnd: '13:00',
    totalHours: 8.75,
    overtimeHours: 0.75,
    status: 'present' as 'present' | 'absent' | 'late' | 'half_day' | 'on_leave',
    location: 'Main Branch',
    notes: 'Regular day'
  },
  {
    id: 'att-2-today',
    employeeId: '2',
    employeeName: 'Mike Chen',
    date: new Date().toISOString().split('T')[0],
    checkIn: '08:30',
    checkOut: '17:15',
    breakStart: '12:30',
    breakEnd: '13:30',
    totalHours: 8.25,
    overtimeHours: 0.25,
    status: 'present' as 'present' | 'absent' | 'late' | 'half_day' | 'on_leave',
    location: 'Delivery Route',
    notes: 'Delivery completed'
  },
  {
    id: 'att-3-today',
    employeeId: '3',
    employeeName: 'Lisa Wang',
    date: new Date().toISOString().split('T')[0],
    checkIn: '09:15',
    checkOut: null,
    breakStart: null,
    breakEnd: null,
    totalHours: 7.5,
    overtimeHours: 0,
    status: 'late' as 'present' | 'absent' | 'late' | 'half_day' | 'on_leave',
    location: 'Main Branch',
    notes: 'Traffic delay'
  },
  {
    id: 'att-4-today',
    employeeId: '4',
    employeeName: 'David Wilson',
    date: new Date().toISOString().split('T')[0],
    checkIn: null,
    checkOut: null,
    breakStart: null,
    breakEnd: null,
    totalHours: 0,
    overtimeHours: 0,
    status: 'absent' as 'present' | 'absent' | 'late' | 'half_day' | 'on_leave',
    location: 'Main Branch',
    notes: 'Sick leave'
  },
  {
    id: 'att-5-today',
    employeeId: '5',
    employeeName: 'Maria Garcia',
    date: new Date().toISOString().split('T')[0],
    checkIn: '08:00',
    checkOut: '16:30',
    breakStart: '12:00',
    breakEnd: '13:00',
    totalHours: 8.5,
    overtimeHours: 0.5,
    status: 'present' as 'present' | 'absent' | 'late' | 'half_day' | 'on_leave',
    location: 'Delivery Route',
    notes: 'Early pickup'
  },
  {
    id: 'att-6-today',
    employeeId: '6',
    employeeName: 'John Smith',
    date: new Date().toISOString().split('T')[0],
    checkIn: '09:05',
    checkOut: null,
    breakStart: null,
    breakEnd: null,
    totalHours: 7.0,
    overtimeHours: 0,
    status: 'late' as 'present' | 'absent' | 'late' | 'half_day' | 'on_leave',
    location: 'Processing Center',
    notes: 'Machine maintenance'
  }
];

export const demoServices = [
  {
    id: '1',
    name: 'Dry Cleaning - Suit',
    description: 'Professional dry cleaning for formal suits',
    price: '450.00',
    category: 'Dry Cleaning',
    estimatedTime: '2-3 days',
    image: '/services/suit-cleaning.jpg'
  },
  {
    id: '2',
    name: 'Wash & Fold - Regular',
    description: 'Standard wash and fold service for everyday clothes',
    price: '120.00',
    category: 'Wash & Fold',
    estimatedTime: '1 day',
    image: '/services/wash-fold.jpg'
  },
  {
    id: '3',
    name: 'Premium Dry Cleaning - Wedding Dress',
    description: 'Specialized cleaning for delicate wedding dresses',
    price: '1200.00',
    category: 'Premium',
    estimatedTime: '5-7 days',
    image: '/services/wedding-dress.jpg'
  },
  {
    id: '4',
    name: 'Express Service - Shirt',
    description: 'Same-day service for dress shirts',
    price: '80.00',
    category: 'Express',
    estimatedTime: 'Same day',
    image: '/services/express-shirt.jpg'
  },
  {
    id: '5',
    name: 'Leather Cleaning',
    description: 'Professional leather jacket and bag cleaning',
    price: '350.00',
    category: 'Specialty',
    estimatedTime: '3-4 days',
    image: '/services/leather.jpg'
  }
];

export const demoOrders = [
  {
    id: 'ORD-001',
    orderNumber: 'ORD-001',
    customerName: 'Rajesh Kumar',
    customerPhone: '+91 98765 12345',
    customerEmail: 'rajesh.kumar@email.com',
    status: 'pending',
    totalAmount: '450.00',
    advancePaid: '100.00',
    paymentStatus: 'partial' as 'pending' | 'paid' | 'partial' | 'failed',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    items: [
      {
        id: '1',
        productId: '1',
        productName: 'Dry Cleaning - Suit',
        quantity: 1,
        price: '450.00'
      }
    ],
    shippingAddress: {
      instructions: 'Call before delivery',
      pickupDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  },
  {
    id: 'ORD-002',
    orderNumber: 'ORD-002',
    customerName: 'Priya Sharma',
    customerPhone: '+91 98765 23456',
    customerEmail: 'priya.sharma@email.com',
    status: 'in_progress',
    totalAmount: '120.00',
    advancePaid: '120.00',
    paymentStatus: 'paid' as 'pending' | 'paid' | 'partial' | 'failed',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    items: [
      {
        id: '2',
        productId: '2',
        productName: 'Wash & Fold - Regular',
        quantity: 1,
        price: '120.00'
      }
    ],
    shippingAddress: {
      instructions: 'Leave at gate',
      pickupDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  },
  {
    id: 'ORD-003',
    orderNumber: 'ORD-003',
    customerName: 'Amit Patel',
    customerPhone: '+91 98765 34567',
    customerEmail: 'amit.patel@email.com',
    status: 'completed',
    totalAmount: '80.00',
    advancePaid: '0.00',
    paymentStatus: 'paid' as 'pending' | 'paid' | 'partial' | 'failed',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    items: [
      {
        id: '3',
        productId: '4',
        productName: 'Express Service - Shirt',
        quantity: 1,
        price: '80.00'
      }
    ],
    shippingAddress: {
      instructions: 'Office delivery',
      pickupDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  }
];

export const demoDeliveries = [
  {
    id: 'DEL-001',
    orderId: 'ORD-001',
    customerName: 'Rajesh Kumar',
    customerPhone: '+91 98765 12345',
    address: '123 MG Road, Bangalore, KA 560001',
    status: 'scheduled',
    driverId: '2',
    driverName: 'Mike Chen',
    scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    estimatedTime: '14:00',
    instructions: 'Call before delivery'
  },
  {
    id: 'DEL-002',
    orderId: 'ORD-002',
    customerName: 'Priya Sharma',
    customerPhone: '+91 98765 23456',
    address: '456 Brigade Road, Bangalore, KA 560025',
    status: 'in_transit',
    driverId: '5',
    driverName: 'Maria Garcia',
    scheduledDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    estimatedTime: '11:00',
    instructions: 'Leave at gate',
    actualPickupTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    currentLocation: {
      lat: 12.9716,
      lng: 77.5946,
      address: 'Near UB City, Bangalore'
    }
  },
  {
    id: 'DEL-003',
    orderId: 'ORD-003',
    customerName: 'Amit Patel',
    customerPhone: '+91 98765 34567',
    address: '789 Indiranagar, Bangalore, KA 560038',
    status: 'delivered',
    driverId: '2',
    driverName: 'Mike Chen',
    scheduledDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    estimatedTime: '10:00',
    instructions: 'Office delivery',
    actualPickupTime: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
    actualDeliveryTime: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString()
  }
];

export const franchiseMetrics = {
  totalEmployees: 24,
  presentToday: 20,
  absentToday: 2,
  lateToday: 2,
  totalRevenue: 125000,
  activeDeliveries: 8,
  customerSatisfaction: 4.7,
  averageOrderValue: 850,
  monthlyTarget: 150000,
  targetProgress: 83
};

export const demoNotifications = [
  {
    id: '1',
    type: 'success',
    title: 'Order Completed Successfully!',
    message: 'Order ORD-003 has been delivered to Amit Patel.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    actionUrl: '/orders',
    actionText: 'View Order',
    read: false
  },
  {
    id: '2',
    type: 'info',
    title: 'New Order Received',
    message: 'New order ORD-004 from Suresh Reddy for Dry Cleaning service.',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    actionUrl: '/orders',
    actionText: 'View Order',
    read: false
  },
  {
    id: '3',
    type: 'warning',
    title: 'Payment Pending',
    message: 'Order ORD-001 has pending balance of ₹350.00',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    actionUrl: '/orders',
    actionText: 'Collect Payment',
    read: true
  },
  {
    id: '4',
    type: 'success',
    title: 'Employee Checked In',
    message: 'Sarah Johnson checked in at 08:45 AM',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    actionUrl: '/franchise-dashboard',
    actionText: 'View Dashboard',
    read: true
  }
];

// Utility function to get demo data based on type
export const getDemoData = (type: string) => {
  switch (type) {
    case 'employees':
      return demoEmployees;
    case 'attendance':
      return demoAttendanceRecords;
    case 'services':
      return demoServices;
    case 'orders':
      return demoOrders;
    case 'deliveries':
      return demoDeliveries;
    case 'metrics':
      return franchiseMetrics;
    case 'notifications':
      return demoNotifications;
    default:
      return [];
  }
};
