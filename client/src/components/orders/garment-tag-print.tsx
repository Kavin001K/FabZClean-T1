/**
 * Garment Tag Generator
 * Creates compact printable tags with:
 * - Order number
 * - Service name
 * - Tag note
 * - Barcode
 * - Store identification
 * - 1cm gap between tags for easy cutting
 */

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Printer, Download } from 'lucide-react';
import JsBarcode from 'jsbarcode';

interface TagItem {
  orderNumber: string;
  serviceName: string;
  tagNote?: string;
  quantity: number;
  customerName?: string;
  storeCode?: string;
  dueDate?: string;
}

interface GarmentTagPrintProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: TagItem[];
  orderNumber: string;
  customerName?: string;
  storeCode?: string;
}

export function GarmentTagPrint({
  open,
  onOpenChange,
  items,
  orderNumber,
  customerName,
  storeCode = 'FZC01',
  commonNote
}: GarmentTagPrintProps & { commonNote?: string }) {
  const printRef = useRef<HTMLDivElement>(null);

  // Flatten items into individual tags with persistent global index
  const getAllTags = () => {
    const tags: { item: TagItem; globalIndex: number; subIndex: number }[] = [];
    let globalCounter = 0;
    items.forEach((item) => {
      for (let i = 0; i < item.quantity; i++) {
        globalCounter++;
        tags.push({
          item,
          globalIndex: globalCounter,
          subIndex: i + 1
        });
      }
    });
    return tags;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const allTags = getAllTags();
    const barcodes: { [key: string]: string } = {};

    // Generate barcodes
    allTags.forEach((tag) => {
      const canvas = document.createElement('canvas');
      try {
        // Unique Barcode: OrderNumber + I + ItemIndex (Global)
        // Example: POL2025120948773I1
        const rawCode = `${orderNumber}I${tag.globalIndex}`;
        const code = rawCode.replace(/[^A-Z0-9]/gi, '').toUpperCase();

        JsBarcode(canvas, code, {
          format: 'CODE128',
          width: 1, // Compact width
          height: 35,
          displayValue: true,
          fontSize: 9,
          margin: 0,
          textMargin: 2
        });
        barcodes[`${tag.globalIndex}`] = canvas.toDataURL();
      } catch (e) {
        console.error('Barcode generation error:', e);
      }
    });

    const tagsHtml = allTags.map(({ item, globalIndex, subIndex }) => {
      const barcodeImg = barcodes[`${globalIndex}`] || '';

      return `
        <div class="tag">
          <div class="tag-header">
             <span class="order-num">${orderNumber}</span>
             <span class="item-index font-bold">#${globalIndex}</span>
          </div>
          
          <div class="content-wrapper">
              <div class="service-name">${item.serviceName}</div>
              ${item.tagNote ? `<div class="tag-note">Note: ${item.tagNote}</div>` : ''}
              ${commonNote ? `<div class="common-note">Order: ${commonNote}</div>` : ''}
          </div>

          <div class="barcode">
            <img src="${barcodeImg}" alt="barcode" />
          </div>

          <div class="tag-footer">
            <span class="customer">${customerName || 'Customer'}</span>
            <span class="qty">${subIndex}/${item.quantity}</span>
          </div>
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Garment Tags - ${orderNumber}</title>
        <style>
          @page {
            size: A4;
            margin: 10mm;
          }
          
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            font-size: 10px;
            line-height: applied;
          }
          
          .tags-container {
            display: flex;
            flex-wrap: wrap;
            gap: 10mm;
            justify-content: flex-start;
          }
          
          .tag {
            width: 50mm;
            min-height: 40mm;
            border: 2px solid #000;
            border-radius: 4px;
            padding: 2mm;
            display: flex;
            flex-direction: column;
            background: white;
            page-break-inside: avoid;
            position: relative;
          }
          
          .tag-header {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            font-size: 8px;
            padding-bottom: 1mm;
            border-bottom: 1px solid #000;
            margin-bottom: 1mm;
          }
          
          .service-name {
            font-weight: 800;
            font-size: 13px;
            text-align: center;
            margin: 2mm 0 1mm 0;
            text-transform: uppercase;
            line-height: 1.1;
          }
          
          .tag-note {
            font-size: 9px;
            font-weight: bold;
            text-align: center;
            margin: 1mm 0;
            padding: 1px;
            background: #eee;
          }

          .common-note {
             font-size: 8px;
             text-align: center;
             font-style: italic;
             margin-top: 1mm;
             color: #444;
          }
          
          .barcode {
            text-align: center;
            margin-top: auto;
            margin-bottom: 1mm;
            overflow: hidden;
          }
          
          .barcode img {
            max-width: 100%;
            height: 30px;
          }
          
          .tag-footer {
            display: flex;
            justify-content: space-between;
            font-size: 8px;
            font-weight: bold;
            padding-top: 1mm;
            border-top: 1px solid #000;
          }
          .content-wrapper {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }

          @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="tags-container">
          ${tagsHtml}
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const allTags = getAllTags();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Print Garment Tags
          </DialogTitle>
          <DialogDescription>
            {allTags.length} Unique tags with Barcodes & Notes
          </DialogDescription>
        </DialogHeader>

        {/* Preview */}
        <div ref={printRef} className="grid grid-cols-3 sm:grid-cols-4 gap-4 p-4 bg-gray-100 rounded-lg">
          {allTags.map(({ item, globalIndex, subIndex }) => (
            <div
              key={`preview-${globalIndex}`}
              className="bg-white border-2 border-gray-800 rounded p-2 text-xs shadow-sm flex flex-col relative aspect-[5/4]"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-1 mb-1 border-b border-gray-200">
                <span className="font-mono text-[9px] font-bold">{orderNumber}</span>
                <span className="font-bold text-[10px]">#{globalIndex}</span>
              </div>

              {/* Content */}
              <div className="flex-grow flex flex-col justify-center items-center gap-1">
                <div className="font-black text-center text-sm uppercase leading-tight">
                  {item.serviceName}
                </div>

                {item.tagNote && (
                  <div className="text-[10px] font-semibold text-center bg-gray-100 px-1 rounded w-full">
                    Note: {item.tagNote}
                  </div>
                )}
                {commonNote && (
                  <div className="text-[9px] text-gray-500 text-center italic w-full truncate">
                    Order: {commonNote}
                  </div>
                )}
              </div>

              {/* Barcode Simulation */}
              <div className="text-center mt-auto pt-1">
                <div className="bg-black h-6 w-3/4 mx-auto mb-0.5 opacity-80"></div>
                <div className="text-[7px] font-mono tracking-tighter">
                  {`${orderNumber}I${globalIndex}`.replace(/[^A-Z0-9]/gi, '').toUpperCase()}
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between text-[8px] font-bold pt-1 border-t border-gray-200 mt-1">
                <span className="truncate max-w-[70%]">{customerName || 'Cust'}</span>
                <span>{subIndex}/{item.quantity}</span>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handlePrint} className="gap-2 bg-green-600 hover:bg-green-700">
            <Printer className="h-4 w-4" />
            Print {allTags.length} Tags
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default GarmentTagPrint;
