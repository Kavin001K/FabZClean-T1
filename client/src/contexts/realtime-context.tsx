import React, { createContext, useContext, useEffect, useState } from 'react';
import { useWebSocket } from '@/hooks/use-websocket';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface RealtimeContextType {
  analyticsData: any;
  driverLocations: any[];
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [driverLocations, setDriverLocations] = useState([]);

  const { subscribe } = useWebSocket({
    url: `ws://${window.location.hostname}:3003`,
    onMessage: (message) => {
      console.log('Realtime update:', message);
      const { type, data } = message;

      if (type === 'analytics_update') {
        setAnalyticsData(data);
        return;
      }

      if (type === 'driver_locations') {
        setDriverLocations(data.drivers);
        return;
      }

      if (type === 'driver_assigned' || type === 'driver_status_update') {
        queryClient.invalidateQueries({ queryKey: ['live-tracking-drivers'] });
        toast({ title: 'Driver Update', description: 'Driver information has been updated.' });
      }

      // Invalidate queries to refetch data
      if (type.startsWith('order_')) {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['order', data?.id] });
        queryClient.invalidateQueries({ queryKey: ['live-tracking-orders'] });
        toast({ title: 'Orders updated', description: 'The list of orders has been updated in real-time.' });
      }

      if (type.startsWith('customer_')) {
        queryClient.invalidateQueries({ queryKey: ['customers'] });
        queryClient.invalidateQueries({ queryKey: ['customer', data?.id] });
        toast({ title: 'Customers updated', description: 'The list of customers has been updated in real-time.' });
      }

      if (type.startsWith('employee_')) {
        queryClient.invalidateQueries({ queryKey: ['employees'] });
        queryClient.invalidateQueries({ queryKey: ['employee', data?.id] });
        toast({ title: 'Employees updated', description: 'The list of employees has been updated in real-time.' });
      }
      
      if (type.startsWith('product_')) {
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['product', data?.id] });
        queryClient.invalidateQueries({ queryKey: ['inventory-items'] }); // For inventory page
        queryClient.invalidateQueries({ queryKey: ['inventory-kpis'] }); // For inventory KPIs
        toast({ title: 'Products updated', description: 'The list of products has been updated in real-time.' });
      }
      
      if (type.startsWith('service_')) {
        queryClient.invalidateQueries({ queryKey: ['services'] });
        queryClient.invalidateQueries({ queryKey: ['service', data?.id] });
        toast({ title: 'Services updated', description: 'The list of services has been updated in real-time.' });
      }

      if (type.startsWith('invoice_')) {
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        queryClient.invalidateQueries({ queryKey: ['invoice', data?.id] });
        queryClient.invalidateQueries({ queryKey: ['accounts-receivable'] });
        queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
        toast({ title: 'Invoices updated', description: 'Invoice data has been updated in real-time.' });
      }

      if (type.startsWith('expense_')) {
        queryClient.invalidateQueries({ queryKey: ['expenses'] });
        queryClient.invalidateQueries({ queryKey: ['expense', data?.id] });
        toast({ title: 'Expenses updated', description: 'Expense data has been updated in real-time.' });
      }

      if (type.startsWith('budget_')) {
        queryClient.invalidateQueries({ queryKey: ['budgets'] });
        queryClient.invalidateQueries({ queryKey: ['budget', data?.id] });
        queryClient.invalidateQueries({ queryKey: ['budget-vs-actual'] });
        toast({ title: 'Budgets updated', description: 'Budget data has been updated in real-time.' });
      }

      if (type.startsWith('taxRate_')) {
        queryClient.invalidateQueries({ queryKey: ['tax-rates'] });
        queryClient.invalidateQueries({ queryKey: ['taxRate', data?.id] });
        toast({ title: 'Tax Rates updated', description: 'Tax rate data has been updated in real-time.' });
      }

      if (type.startsWith('account_')) {
        queryClient.invalidateQueries({ queryKey: ['accounts'] });
        queryClient.invalidateQueries({ queryKey: ['account', data?.id] });
        queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
        queryClient.invalidateQueries({ queryKey: ['general-ledger'] });
        queryClient.invalidateQueries({ queryKey: ['trial-balance'] });
        queryClient.invalidateQueries({ queryKey: ['balance-sheet'] });
        queryClient.invalidateQueries({ queryKey: ['income-statement'] });
        toast({ title: 'Accounts updated', description: 'Account data has been updated in real-time.' });
      }

      if (type.startsWith('journalEntry_')) {
        queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
        queryClient.invalidateQueries({ queryKey: ['journalEntry', data?.id] });
        queryClient.invalidateQueries({ queryKey: ['general-ledger'] });
        queryClient.invalidateQueries({ queryKey: ['trial-balance'] });
        queryClient.invalidateQueries({ queryKey: ['balance-sheet'] });
        queryClient.invalidateQueries({ queryKey: ['income-statement'] });
        toast({ title: 'Journal Entry updated', description: 'Journal entry has been updated in real-time.' });
      }

      if (type.startsWith('payment_')) {
        queryClient.invalidateQueries({ queryKey: ['payments'] });
        queryClient.invalidateQueries({ queryKey: ['payment', data?.id] });
        queryClient.invalidateQueries({ queryKey: ['accounts-receivable'] });
        queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
        toast({ title: 'Payment updated', description: 'Payment data has been updated in real-time.' });
      }

      if (type.startsWith('posTransaction_')) {
        queryClient.invalidateQueries({ queryKey: ['pos/transactions'] });
        queryClient.invalidateQueries({ queryKey: ['posTransaction', data?.id] });
        toast({ title: 'POS Transaction updated', description: 'Transaction has been updated in real-time.' });
      }

      if (type.startsWith('setting_')) {
        queryClient.invalidateQueries({ queryKey: ['settings'] });
        queryClient.invalidateQueries({ queryKey: ['setting', data?.key] });
        toast({ title: 'Settings updated', description: 'Settings have been updated in real-time.' });
      }
    },
  });

  useEffect(() => {
    subscribe([
        'order_created', 'order_updated', 'order_deleted',
        'customer_created', 'customer_updated', 'customer_deleted',
        'employee_created', 'employee_updated', 'employee_deleted',
        'product_created', 'product_updated', 'product_deleted',
        'service_created', 'service_updated', 'service_deleted',
        'invoice_created', 'invoice_updated', 'invoice_deleted',
        'expense_created', 'expense_updated', 'expense_deleted',
        'budget_created', 'budget_updated', 'budget_deleted',
        'taxRate_created', 'taxRate_updated', 'taxRate_deleted',
        'account_created', 'account_updated', 'account_deleted',
        'journalEntry_created', 'journalEntry_posted', 'journalEntry_voided',
        'payment_created', 'payment_updated', 'payment_deleted',
        'posTransaction_created', 'posTransaction_updated', 'posTransaction_deleted',
        'setting_updated',
        'analytics_update',
        'driver_locations', 'driver_assigned', 'driver_status_update'
    ]);
  }, [subscribe]);

  return (
    <RealtimeContext.Provider value={{ analyticsData, driverLocations }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};
