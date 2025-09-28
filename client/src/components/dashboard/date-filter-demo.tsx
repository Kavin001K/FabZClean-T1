import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DueTodayOrders from './due-today-orders';

// Sample data for testing
const sampleOrders = [
  {
    id: '1',
    orderNumber: 'ORD-001',
    customerName: 'John Doe',
    customerPhone: '+1234567890',
    status: 'pending' as const,
    paymentStatus: 'pending' as const,
    total: 50.00,
    service: 'Dry Cleaning',
    pickupDate: new Date().toISOString().split('T')[0], // Today
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    orderNumber: 'ORD-002',
    customerName: 'Jane Smith',
    customerPhone: '+1234567891',
    status: 'processing' as const,
    paymentStatus: 'paid' as const,
    total: 75.00,
    service: 'Laundry',
    pickupDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Yesterday
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    orderNumber: 'ORD-003',
    customerName: 'Bob Johnson',
    customerPhone: '+1234567892',
    status: 'pending' as const,
    paymentStatus: 'pending' as const,
    total: 100.00,
    service: 'Ironing',
    pickupDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
    createdAt: new Date().toISOString(),
  },
];

export default function DateFilterDemo() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Date Filter Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            This demo shows how the Due Today widget can filter orders by different dates.
            Try clicking the Yesterday, Today, and Tomorrow buttons to see the filtering in action.
          </p>
          <DueTodayOrders 
            orders={sampleOrders}
            isLoading={false}
            limit={10}
            showDateSelector={true}
            showViewAll={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}
