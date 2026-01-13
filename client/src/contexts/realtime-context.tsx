import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useWebSocket } from '@/hooks/use-websocket';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { getWebSocketUrl } from '@/lib/data-service';
import { useRealtime as useSupabaseRealtime } from '@/hooks/use-realtime';
import { useAuth } from './auth-context';

interface RealtimeContextType {
  analyticsData: any;
  driverLocations: any[];
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { employee } = useAuth();
  const [analyticsData, setAnalyticsData] = useState(null);

  // Get WebSocket URL that automatically handles production (wss://) vs development (ws://)
  // On Vercel, this will use wss:// automatically when on HTTPS
  const wsUrl = useMemo(() => getWebSocketUrl(), []);

  // Enable backend WebSocket in development as well to ensure realtime updates work
  // This serves as a fallback if Supabase Realtime is not configured or failing
  const skipBackendWS = false;

  // ✅ Use Supabase Realtime for driver locations (works on Vercel Serverless)
  const { data: supabaseDrivers } = useSupabaseRealtime({
    tableName: 'drivers',
    // Fix: Use correct snake_case column names. vehicle_type and vehicle_number DO exist.
    selectQuery: 'id, name, status, current_latitude, current_longitude, updated_at, vehicle_type, vehicle_number',
  });

  // Map Supabase drivers to DriverLocation format
  const driverLocations = useMemo(() => {
    if (!Array.isArray(supabaseDrivers)) return [];

    return supabaseDrivers.map((d: any) => ({
      driverId: d.id,
      driverName: d.name,
      orderId: '', // Would need a join or separate query for this
      // Fix: Map from snake_case to camelCase
      latitude: d.current_latitude || 0,
      longitude: d.current_longitude || 0,
      heading: 0,
      speed: 0,
      status: d.status,
      estimatedArrival: new Date().toISOString(), // Placeholder
      lastUpdated: d.updated_at || new Date().toISOString(),
      // Map vehicle info
      vehicleType: d.vehicle_type || 'Bike',
      vehicleNumber: d.vehicle_number || 'NA'
    }));
  }, [supabaseDrivers]);

  const { subscribe } = useWebSocket({
    url: skipBackendWS ? null : wsUrl,
    maxReconnectAttempts: skipBackendWS ? 0 : 5, // Disable reconnection in development
    enabled: !!employee, // Only connect if user is authenticated
    onMessage: (message) => {
      // Skip processing if in development mode
      if (skipBackendWS) return;

      console.log('Realtime update:', message);
      const { type, data } = message;

      if (type === 'analytics_update') {
        setAnalyticsData(data);
        return;
      }

      // Note: driver_locations are now handled by Supabase Realtime above
      // We keep this for backward compatibility if WS sends other data

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
}

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};
