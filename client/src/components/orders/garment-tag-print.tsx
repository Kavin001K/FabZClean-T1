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
import { Printer } from 'lucide-react';
import {
  buildThermalTagPrintHtml,
  prepareThermalTags,
  ThermalTagItem,
  ThermalTagLabel,
} from '@/lib/garment-tag-layout';

interface GarmentTagPrintProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: ThermalTagItem[];
  orderNumber: string;
  customerName?: string;
  franchiseId?: string | null;
  storeCode?: string;
  commonNote?: string;
  isExpressOrder?: boolean;
  dueDate?: string;
}

export function GarmentTagPrint({
  open,
  onOpenChange,
  items,
  orderNumber,
  customerName,
  franchiseId,
  storeCode = 'FAB',
  commonNote,
  dueDate,
}: GarmentTagPrintProps) {
  const preparedTags = useMemo(() => prepareThermalTags({
    orderNumber,
    customerName,
    franchiseId,
    storeCode,
    commonNote,
    dueDate,
    items,
  }), [orderNumber, customerName, franchiseId, storeCode, commonNote, dueDate, items]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Print Garment Tags
          </DialogTitle>
          <DialogDescription>
            {preparedTags.length} tags in continuous thermal layout
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-2 p-4 bg-neutral-900 rounded-lg max-h-[55vh] overflow-auto">
          {preparedTags.map((tag) => (
            <ThermalTagLabel key={tag.id} tag={tag} />
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
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
