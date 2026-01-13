import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  printDriver, 
  BarcodePrintData, 
  LabelPrintData, 
  InvoicePrintData,
  PrintTemplate 
} from '@/lib/print-driver';

export interface UsePrintOptions {
  onSuccess?: (type: string, data: any) => void;
  onError?: (error: Error) => void;
}

export function usePrint(options: UsePrintOptions = {}) {
  const [isPrinting, setIsPrinting] = useState(false);
  const { toast } = useToast();

  const printBarcode = useCallback(async (
    data: BarcodePrintData, 
    templateId: string = 'barcode-label'
  ) => {
    try {
      setIsPrinting(true);
      await printDriver.printBarcode(data, templateId);
      
      toast({
        title: "Print Successful",
        description: "Barcode has been sent to printer",
      });
      
      options.onSuccess?.('barcode', data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      toast({
        title: "Print Failed",
        description: `Failed to print barcode: ${errorMessage}`,
        variant: "destructive"
      });
      
      options.onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsPrinting(false);
    }
  }, [toast, options]);

  const printLabel = useCallback(async (
    data: LabelPrintData, 
    templateId: string = 'shipping-label'
  ) => {
    try {
      setIsPrinting(true);
      await printDriver.printLabel(data, templateId);
      
      toast({
        title: "Print Successful",
        description: "Label has been sent to printer",
      });
      
      options.onSuccess?.('label', data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      toast({
        title: "Print Failed",
        description: `Failed to print label: ${errorMessage}`,
        variant: "destructive"
      });
      
      options.onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsPrinting(false);
    }
  }, [toast, options]);

  const printInvoice = useCallback(async (
    data: InvoicePrintData, 
    templateId: string = 'invoice'
  ) => {
    try {
      setIsPrinting(true);
      await printDriver.printInvoice(data, templateId);
      
      toast({
        title: "Print Successful",
        description: "Invoice has been sent to printer",
      });
      
      options.onSuccess?.('invoice', data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      toast({
        title: "Print Failed",
        description: `Failed to print invoice: ${errorMessage}`,
        variant: "destructive"
      });
      
      options.onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsPrinting(false);
    }
  }, [toast, options]);

  const printReceipt = useCallback(async (
    data: InvoicePrintData, 
    templateId: string = 'receipt'
  ) => {
    try {
      setIsPrinting(true);
      await printDriver.printReceipt(data, templateId);
      
      toast({
        title: "Print Successful",
        description: "Receipt has been sent to printer",
      });
      
      options.onSuccess?.('receipt', data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      toast({
        title: "Print Failed",
        description: `Failed to print receipt: ${errorMessage}`,
        variant: "destructive"
      });
      
      options.onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsPrinting(false);
    }
  }, [toast, options]);

  const printFromElement = useCallback(async (
    element: HTMLElement, 
    filename: string = 'document.pdf'
  ) => {
    try {
      setIsPrinting(true);
      await printDriver.printFromElement(element, filename);
      
      toast({
        title: "Print Successful",
        description: "Document has been sent to printer",
      });
      
      options.onSuccess?.('element', { element, filename });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      toast({
        title: "Print Failed",
        description: `Failed to print document: ${errorMessage}`,
        variant: "destructive"
      });
      
      options.onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsPrinting(false);
    }
  }, [toast, options]);

  const getTemplates = useCallback(() => {
    return printDriver.getTemplates();
  }, []);

  const getTemplate = useCallback((id: string) => {
    return printDriver.getTemplate(id);
  }, []);

  return {
    isPrinting,
    printBarcode,
    printLabel,
    printInvoice,
    printReceipt,
    printFromElement,
    getTemplates,
    getTemplate
  };
}

// Convenience hook for barcode printing
export function useBarcodePrint(options: UsePrintOptions = {}) {
  const { printBarcode, isPrinting } = usePrint(options);

  const printOrderBarcode = useCallback(async (
    orderId: string,
    orderData: any = {},
    templateId: string = 'barcode-label'
  ) => {
    const barcodeData: BarcodePrintData = {
      code: `ORDER-${orderId}`,
      type: 'qr',
      entityType: 'order',
      entityId: orderId,
      entityData: orderData,
      imageData: '', // Will be generated by the service
      imagePath: undefined
    };

    await printBarcode(barcodeData, templateId);
  }, [printBarcode]);

  const printShipmentBarcode = useCallback(async (
    shipmentId: string,
    shipmentData: any = {},
    templateId: string = 'barcode-label'
  ) => {
    const barcodeData: BarcodePrintData = {
      code: `SHIPMENT-${shipmentId}`,
      type: 'qr',
      entityType: 'shipment',
      entityId: shipmentId,
      entityData: shipmentData,
      imageData: '', // Will be generated by the service
      imagePath: undefined
    };

    await printBarcode(barcodeData, templateId);
  }, [printBarcode]);

  const printProductBarcode = useCallback(async (
    productId: string,
    productData: any = {},
    templateId: string = 'barcode-label'
  ) => {
    const barcodeData: BarcodePrintData = {
      code: `PRODUCT-${productId}`,
      type: 'ean13',
      entityType: 'product',
      entityId: productId,
      entityData: productData,
      imageData: '', // Will be generated by the service
      imagePath: undefined
    };

    await printBarcode(barcodeData, templateId);
  }, [printBarcode]);

  return {
    isPrinting,
    printOrderBarcode,
    printShipmentBarcode,
    printProductBarcode,
    printBarcode
  };
}

// Convenience hook for label printing
export function useLabelPrint(options: UsePrintOptions = {}) {
  const { printLabel, isPrinting } = usePrint(options);

  const printShippingLabel = useCallback(async (
    shipmentData: any,
    templateId: string = 'shipping-label'
  ) => {
    const labelData: LabelPrintData = {
      title: 'Shipping Label',
      subtitle: `Shipment #${shipmentData.shipmentNumber}`,
      details: [
        { label: 'Carrier', value: shipmentData.carrier },
        { label: 'Tracking', value: shipmentData.trackingNumber },
        { label: 'Status', value: shipmentData.status },
        { label: 'Orders', value: shipmentData.orderIds?.length || 0 }
      ],
      footer: 'Handle with care'
    };

    await printLabel(labelData, templateId);
  }, [printLabel]);

  const printInventoryLabel = useCallback(async (
    productData: any,
    templateId: string = 'shipping-label'
  ) => {
    const labelData: LabelPrintData = {
      title: 'Inventory Label',
      subtitle: productData.name,
      details: [
        { label: 'SKU', value: productData.sku },
        { label: 'Category', value: productData.category },
        { label: 'Stock', value: productData.stockQuantity },
        { label: 'Price', value: `$${productData.price}` }
      ],
      footer: 'Store in dry place'
    };

    await printLabel(labelData, templateId);
  }, [printLabel]);

  return {
    isPrinting,
    printShippingLabel,
    printInventoryLabel,
    printLabel
  };
}
