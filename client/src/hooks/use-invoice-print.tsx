import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { convertOrderToInvoiceData, InvoicePrintData } from '@/lib/print-driver';
import { printDriver } from '@/lib/print-driver';
import type { Order } from '@shared/schema';

export interface UseInvoicePrintOptions {
  onSuccess?: (data: InvoicePrintData) => void;
  onError?: (error: Error) => void;
  enableGST?: boolean; // Whether to include GST on invoices
}

export function useInvoicePrint(options: UseInvoicePrintOptions = {}) {
  const { toast } = useToast();
  const { enableGST = false } = options;

  const printInvoice = useCallback(async (
    order: Order,
    templateId: string = 'invoice',
    gstEnabled?: boolean // Allow per-call override
  ) => {
    try {
      // Use per-call GST setting if provided, otherwise use hook option
      const useGST = gstEnabled !== undefined ? gstEnabled : enableGST;

      // Convert order data to invoice format with GST settings
      const invoiceData = convertOrderToInvoiceData(order, useGST);

      // Print the invoice
      await printDriver.printInvoice(invoiceData, templateId);

      const invoiceType = useGST ? 'GST Invoice' : 'Invoice';
      toast({
        title: `${invoiceType} Printed Successfully`,
        description: `${invoiceType} ${invoiceData.invoiceNumber} has been generated and sent to printer`,
      });

      options.onSuccess?.(invoiceData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      toast({
        title: "Invoice Print Failed",
        description: `Failed to print invoice: ${errorMessage}`,
        variant: "destructive"
      });

      options.onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [toast, options, enableGST]);

  const previewInvoice = useCallback(async (
    order: Order,
    templateId: string = 'invoice',
    gstEnabled?: boolean
  ): Promise<InvoicePrintData> => {
    try {
      // Use per-call GST setting if provided, otherwise use hook option
      const useGST = gstEnabled !== undefined ? gstEnabled : enableGST;

      // Convert order data to invoice format
      const invoiceData = convertOrderToInvoiceData(order, useGST);

      // Generate PDF for preview (without auto-print)
      const template = printDriver.getTemplate(templateId);
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      // This would typically generate a PDF for preview
      // For now, we'll return the data structure
      return invoiceData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      toast({
        title: "Invoice Preview Failed",
        description: `Failed to generate invoice preview: ${errorMessage}`,
        variant: "destructive"
      });

      throw error instanceof Error ? error : new Error(errorMessage);
    }
  }, [toast, enableGST]);

  const getAvailableTemplates = useCallback(() => {
    return printDriver.getTemplates().filter(template =>
      template.category === 'invoice'
    );
  }, []);

  return {
    printInvoice,
    previewInvoice,
    getAvailableTemplates,
    convertOrderToInvoiceData
  };
}

