/**
 * React Hook for Print Service
 * Provides easy access to all print functions with loading states and error handling
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import PrintService from '@/lib/print-service';

export interface UsePrintServiceOptions {
  onSuccess?: (type: string, data?: any) => void;
  onError?: (error: Error, type: string) => void;
  autoToast?: boolean; // Show toast notifications (default: true)
}

export function usePrintService(options: UsePrintServiceOptions = {}) {
  const { autoToast = true, onSuccess, onError } = options;
  const [isPrinting, setIsPrinting] = useState(false);
  const { toast } = useToast();

  const handlePrint = useCallback(
    async (
      printFn: () => Promise<void> | void,
      type: string,
      successMessage?: string,
      data?: any
    ) => {
      try {
        setIsPrinting(true);

        await printFn();

        if (autoToast) {
          toast({
            title: 'Print Successful',
            description: successMessage || `${type} has been sent to printer`,
          });
        }

        onSuccess?.(type, data);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        if (autoToast) {
          toast({
            title: 'Print Failed',
            description: `Failed to print ${type}: ${errorMessage}`,
            variant: 'destructive',
          });
        }

        onError?.(error instanceof Error ? error : new Error(errorMessage), type);
      } finally {
        setIsPrinting(false);
      }
    },
    [toast, autoToast, onSuccess, onError]
  );

  // ============================================================================
  // ORDER PRINTING
  // ============================================================================

  const printOrderInvoice = useCallback(
    async (order: any) => {
      await handlePrint(
        () => PrintService.printOrderInvoice(order),
        'Order Invoice',
        `Invoice for order ${order.orderNumber || order.id} is ready to print`,
        order
      );
    },
    [handlePrint]
  );

  const printOrderReceipt = useCallback(
    async (order: any) => {
      await handlePrint(
        () => PrintService.printOrderReceipt(order),
        'Order Receipt',
        `Receipt for order ${order.orderNumber || order.id} is ready to print`,
        order
      );
    },
    [handlePrint]
  );

  const printOrderList = useCallback(
    async (orders: any[]) => {
      await handlePrint(
        () => PrintService.printOrderList(orders),
        'Orders Report',
        `Orders report with ${orders.length} orders is ready to print`,
        orders
      );
    },
    [handlePrint]
  );

  const printOrderDetails = useCallback(
    async (order: any) => {
      await handlePrint(
        () => PrintService.printOrderDetails(order),
        'Order Details',
        `Details for order ${order.orderNumber || order.id} is ready to print`,
        order
      );
    },
    [handlePrint]
  );

  // ============================================================================
  // CUSTOMER PRINTING
  // ============================================================================

  const printCustomerList = useCallback(
    async (customers: any[]) => {
      await handlePrint(
        () => PrintService.printCustomerList(customers),
        'Customer List',
        `Customer list with ${customers.length} customers is ready to print`,
        customers
      );
    },
    [handlePrint]
  );

  const printCustomerDetails = useCallback(
    async (customer: any) => {
      await handlePrint(
        () => PrintService.printCustomerDetails(customer),
        'Customer Details',
        `Details for customer ${customer.name} is ready to print`,
        customer
      );
    },
    [handlePrint]
  );

  // ============================================================================
  // SERVICE PRINTING
  // ============================================================================

  const printServiceCatalog = useCallback(
    async (services: any[]) => {
      await handlePrint(
        () => PrintService.printServiceCatalog(services),
        'Service Catalog',
        `Service catalog with ${services.length} services is ready to print`,
        services
      );
    },
    [handlePrint]
  );

  const printServicePerformance = useCallback(
    async (services: any[]) => {
      await handlePrint(
        () => PrintService.printServicePerformance(services),
        'Service Performance Report',
        'Service performance report is ready to print',
        services
      );
    },
    [handlePrint]
  );

  // ============================================================================
  // INVENTORY PRINTING
  // ============================================================================

  const printInventoryReport = useCallback(
    async (inventory: any[]) => {
      await handlePrint(
        () => PrintService.printInventoryReport(inventory),
        'Inventory Report',
        `Inventory report with ${inventory.length} items is ready to print`,
        inventory
      );
    },
    [handlePrint]
  );

  const printStockMovement = useCallback(
    async (movements: any[]) => {
      await handlePrint(
        () => PrintService.printStockMovement(movements),
        'Stock Movement Report',
        `Stock movement report with ${movements.length} transactions is ready to print`,
        movements
      );
    },
    [handlePrint]
  );

  // ============================================================================
  // ACCOUNTING & FINANCIAL PRINTING
  // ============================================================================

  const printFinancialStatement = useCallback(
    async (data: any) => {
      await handlePrint(
        () => PrintService.printFinancialStatement(data),
        'Financial Statement',
        'Financial statement is ready to print',
        data
      );
    },
    [handlePrint]
  );

  const printProfitLossStatement = useCallback(
    async (data: any) => {
      await handlePrint(
        () => PrintService.printProfitLossStatement(data),
        'P&L Statement',
        'Profit & Loss statement is ready to print',
        data
      );
    },
    [handlePrint]
  );

  const printBalanceSheet = useCallback(
    async (data: any) => {
      await handlePrint(
        () => PrintService.printBalanceSheet(data),
        'Balance Sheet',
        'Balance sheet is ready to print',
        data
      );
    },
    [handlePrint]
  );

  // ============================================================================
  // ANALYTICS & DASHBOARD PRINTING
  // ============================================================================

  const printDashboardSummary = useCallback(
    async (metrics: any) => {
      await handlePrint(
        () => PrintService.printDashboardSummary(metrics),
        'Dashboard Summary',
        'Dashboard summary is ready to print',
        metrics
      );
    },
    [handlePrint]
  );

  // ============================================================================
  // LOGISTICS PRINTING
  // ============================================================================

  const printShipmentManifest = useCallback(
    async (shipments: any[]) => {
      await handlePrint(
        () => PrintService.printShipmentManifest(shipments),
        'Shipment Manifest',
        `Shipment manifest with ${shipments.length} shipments is ready to print`,
        shipments
      );
    },
    [handlePrint]
  );

  const printDeliveryRoute = useCallback(
    async (route: any) => {
      await handlePrint(
        () => PrintService.printDeliveryRoute(route),
        'Delivery Route',
        'Delivery route plan is ready to print',
        route
      );
    },
    [handlePrint]
  );

  return {
    isPrinting,

    // Orders
    printOrderInvoice,
    printOrderReceipt,
    printOrderList,
    printOrderDetails,

    // Customers
    printCustomerList,
    printCustomerDetails,

    // Services
    printServiceCatalog,
    printServicePerformance,

    // Inventory
    printInventoryReport,
    printStockMovement,

    // Accounting
    printFinancialStatement,
    printProfitLossStatement,
    printBalanceSheet,

    // Analytics
    printDashboardSummary,

    // Logistics
    printShipmentManifest,
    printDeliveryRoute,

    // Settings
    getPrintSettings: PrintService.getPrintSettings,
    savePrintSettings: PrintService.savePrintSettings,
    getCompanyInfo: PrintService.getCompanyInfo,
    saveCompanyInfo: PrintService.saveCompanyInfo,
  };
}

export default usePrintService;
