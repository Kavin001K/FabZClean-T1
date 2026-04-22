import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Printer, Package } from 'lucide-react';
import {
  buildThermalTagPrintHtml,
  prepareThermalTags,
  ThermalTagItem,
  ThermalTagLabel,
  prepareBagTags,
  buildBagTagPrintHtml,
  BagTagLabel,
} from '@/lib/garment-tag-layout';

interface GarmentTagPrintProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: ThermalTagItem[];
  orderNumber: string;
  customerName?: string;
  customerAddress?: unknown;
  franchiseId?: string | null;
  storeCode?: string;
  commonNote?: string;
  isExpressOrder?: boolean;
  billDate?: string;
  dueDate?: string;
  bagCount?: number;
  totalItems?: number;
  totalServices?: number;
}

export function GarmentTagPrint({
  open,
  onOpenChange,
  items,
  orderNumber,
  customerName,
  customerAddress,
  franchiseId,
  storeCode,
  commonNote,
  billDate,
  dueDate,
  bagCount = 1,
  totalItems,
  totalServices,
}: GarmentTagPrintProps) {
  const preparedTags = useMemo(() => prepareThermalTags({
    orderNumber,
    customerName,
    customerAddress,
    franchiseId,
    storeCode,
    commonNote,
    billDate,
    dueDate,
    items,
  }), [orderNumber, customerName, customerAddress, franchiseId, storeCode, commonNote, billDate, dueDate, items]);

  const preparedBagTags = useMemo(() => {
    const count = Math.max(1, bagCount);
    const itemCount = totalItems ?? items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const svcCount = totalServices ?? items.length;
    return prepareBagTags({
      orderNumber,
      customerName,
      franchiseId,
      storeCode,
      billDate,
      dueDate,
      totalItems: itemCount,
      totalServices: svcCount,
      bagCount: count,
    });
  }, [orderNumber, customerName, franchiseId, storeCode, billDate, dueDate, bagCount, totalItems, totalServices, items]);

  const handlePrint = () => {
    if (preparedTags.length === 0) {
      return;
    }

    const printWindow = window.open('', '_blank', 'width=480,height=900');
    if (!printWindow) {
      alert('Please allow popups to print tags.');
      return;
    }

    printWindow.document.write(buildThermalTagPrintHtml(preparedTags, `Tags - ${orderNumber}`));
    printWindow.document.close();
  };

  const handlePrintBagTags = () => {
    if (preparedBagTags.length === 0) {
      return;
    }

    const printWindow = window.open('', '_blank', 'width=480,height=900');
    if (!printWindow) {
      alert('Please allow popups to print bag tags.');
      return;
    }

    printWindow.document.write(buildBagTagPrintHtml(preparedBagTags, `Bag Tags - ${orderNumber}`));
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Print Garment Tags
          </DialogTitle>
          <DialogDescription>
            {preparedTags.length} service tags + {preparedBagTags.length} bag tag{preparedBagTags.length !== 1 ? 's' : ''} in thermal layout
          </DialogDescription>
        </DialogHeader>

        {/* Service Tags Preview */}
        <div className="flex flex-col items-center gap-2 p-4 bg-neutral-900 rounded-lg max-h-[40vh] overflow-auto">
          {preparedTags.map((tag) => (
            <ThermalTagLabel key={tag.id} tag={tag} />
          ))}
        </div>

        {/* Bag Tags Preview */}
        {preparedBagTags.length > 0 && (
          <>
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground pt-2">
              <Package className="h-4 w-4" />
              Bag Tags ({preparedBagTags.length})
            </div>
            <div className="flex flex-col items-center gap-2 p-4 bg-neutral-900 rounded-lg max-h-[25vh] overflow-auto">
              {preparedBagTags.map((tag) => (
                <BagTagLabel key={tag.id} tag={tag} />
              ))}
            </div>
          </>
        )}

        <DialogFooter className="gap-2 flex-col sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {preparedBagTags.length > 0 && (
            <Button onClick={handlePrintBagTags} variant="outline" className="gap-2">
              <Package className="h-4 w-4" />
              Print {preparedBagTags.length} Bag Tag{preparedBagTags.length !== 1 ? 's' : ''}
            </Button>
          )}
          <Button onClick={handlePrint} className="gap-2 bg-black hover:bg-neutral-800 text-white">
            <Printer className="h-4 w-4" />
            Print {preparedTags.length} Tags
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default GarmentTagPrint;
