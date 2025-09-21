import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { convertOrderToInvoiceData, InvoicePrintData } from '@/lib/print-driver';
import { printDriver } from '@/lib/print-driver';
import type { Order } from '../../shared/schema';

export interface UseInvoicePrintOptions {
  onSuccess?: (data: InvoicePrintData) => void;
  onError?: (error: Error) => void;
}

export function useInvoicePrint(options: UseInvoicePrintOptions = {}) {
  const { toast } = useToast();

  const printInvoice = useCallback(async (
    order: Order,
    templateId: string = 'invoice'
  ) => {
    try {
      // Convert order data to invoice format
      const invoiceData = convertOrderToInvoiceData(order);
      
      // Print the invoice
      await printDriver.printInvoice(invoiceData, templateId);
      
      toast({
        title: "Invoice Printed Successfully",
        description: `Invoice ${invoiceData.invoiceNumber} has been generated and sent to printer`,
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
  }, [toast, options]);

  const previewInvoice = useCallback(async (
    order: Order,
    templateId: string = 'invoice'
  ): Promise<InvoicePrintData> => {
    try {
      // Convert order data to invoice format
      const invoiceData = convertOrderToInvoiceData(order);
      
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
  }, [toast]);

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
