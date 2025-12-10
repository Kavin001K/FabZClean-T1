/**
 * Garment Tag Generator - Vertical Layout
 * Creates compact printable tags with:
 * - Customer name
 * - Item index (1/3, 2/3, 3/3 format)
 * - Service name
 * - Notes for specific service
 * - General order notes
 * - Priority indicator for express orders
 * - No barcode (barcode only on invoice/order)
 */

import React, { useRef, useEffect } from 'react';
import JsBarcode from 'jsbarcode';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Printer, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
  storeCode = 'FZC01',
  commonNote,
  isExpressOrder = false,
  dueDate
}: GarmentTagPrintProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const previewBarcodeRef = useRef<SVGSVGElement>(null);

  // Generate barcode when dialog opens
  useEffect(() => {
    if (open && orderNumber) {
      // Add delay to ensure DOM is ready
      const timeoutId = setTimeout(() => {
        if (previewBarcodeRef.current) {
          try {
            JsBarcode(previewBarcodeRef.current, orderNumber, {
              format: "CODE128",
              width: 1.5,
              height: 30,
              displayValue: false,
              margin: 0,
              background: "#ffffff"
            });
          } catch (e) {
            console.log('Preview barcode error:', e);
          }
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [open, orderNumber]);

  // Calculate total items for global count display
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  // Flatten items into individual tags with per-service indexing
  // Each service gets its own sequence: 1/2, 2/2 for service A; 1/3, 2/3, 3/3 for service B
  const getAllTags = () => {
    const tags: {
      item: TagItem;
      globalIndex: number;
      serviceIndex: number;
      serviceTotalQty: number;
      serviceName: string;
    }[] = [];

    let globalCounter = 0;

    items.forEach((item) => {
      // For each item, generate tags with service-specific numbering
      for (let i = 0; i < item.quantity; i++) {
        globalCounter++;
        tags.push({
          item,
          globalIndex: globalCounter,
          serviceIndex: i + 1,          // 1, 2, 3... per service
          serviceTotalQty: item.quantity, // total for this service (e.g., 2 for DHOTI)
          serviceName: item.serviceName
        });
      }
    });
    return tags;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const allTags = getAllTags();
    const formattedDueDate = dueDate ? new Date(dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '';

    const tagsHtml = allTags.map(({ item, globalIndex, serviceIndex, serviceTotalQty }) => {
      return `
        <div class="tag ${isExpressOrder ? 'express' : ''}">
          ${isExpressOrder ? '<div class="priority-banner">⚡ EXPRESS</div>' : ''}
          
          <div class="tag-header">
            <span class="order-num">${orderNumber}</span>
            <div class="index-box">
              <span class="service-index">${serviceIndex}/${serviceTotalQty}</span>
              <span class="global-index">#${globalIndex}</span>
            </div>
          </div>
          
          <div class="customer-name">${customerName || 'Customer'}</div>
          
          <div class="service-name">${item.serviceName}</div>
          
          ${item.tagNote ? `<div class="service-note"><span class="note-label">Note:</span> ${item.tagNote}</div>` : ''}
          
          ${commonNote ? `<div class="order-note"><span class="note-label">Order:</span> ${commonNote}</div>` : ''}
          
          <div class="tag-footer">
            <span class="store">${storeCode}</span>
            ${formattedDueDate ? `<span class="due">Due: ${formattedDueDate}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Calculate items summary for header
    const itemsSummary = items.map(item => `${item.serviceName} x${item.quantity}`).join(', ');

    // ORDER SUMMARY HEADER TAG (printed first, with barcode)
    const headerTagHtml = `
      <div class="header-tag ${isExpressOrder ? 'express' : ''}">
        ${isExpressOrder ? '<div class="header-priority">⚡ EXPRESS ORDER - PRIORITY</div>' : ''}
        
        <div class="header-title">ORDER SUMMARY</div>
        
        <div class="barcode-container">
          <svg id="header-barcode"></svg>
        </div>
        
        <div class="header-order-num">${orderNumber}</div>
        
        <div class="header-info">
          <div class="header-row">
            <span class="label">Customer:</span>
            <span class="value">${customerName || 'N/A'}</span>
          </div>
          <div class="header-row">
            <span class="label">Total Items:</span>
            <span class="value">${totalItems} pcs</span>
          </div>
          <div class="header-row">
            <span class="label">Services:</span>
            <span class="value small">${itemsSummary}</span>
          </div>
          ${formattedDueDate ? `
          <div class="header-row ${isExpressOrder ? 'express-due' : ''}">
            <span class="label">${isExpressOrder ? '⚡ Due:' : 'Due Date:'}</span>
            <span class="value">${formattedDueDate}</span>
          </div>
          ` : ''}
          ${commonNote ? `
          <div class="header-notes">
            <span class="note-title">Special Instructions:</span>
            <span class="note-text">${commonNote}</span>
          </div>
          ` : ''}
        </div>
        
        <div class="header-footer">
          <span>${storeCode}</span>
          <span>${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tags - ${orderNumber}</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <style>
          @page {
            size: 55mm auto;
            margin: 0.5mm;
          }
          
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          
          body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            font-size: 8px;
            line-height: 1.1;
            background: white;
          }
          
          .tags-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1mm;
            padding: 0.5mm;
          }
          
          /* HEADER TAG STYLES */
          .header-tag {
            width: 52mm;
            padding: 1.5mm;
            border: 2px solid #333;
            border-radius: 3px;
            background: white;
            page-break-inside: avoid;
            margin-bottom: 0;
          }
          
          .header-tag.express {
            border-color: #f97316;
            background: linear-gradient(135deg, #fff7ed 0%, #ffffff 50%);
          }
          
          .header-priority {
            text-align: center;
            background: linear-gradient(90deg, #f97316, #ea580c);
            color: white;
            padding: 1px 4px;
            font-size: 7px;
            font-weight: 900;
            border-radius: 2px;
            margin-bottom: 1mm;
          }
          
          .header-title {
            text-align: center;
            font-size: 9px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 1mm 0;
            border-bottom: 1px solid #333;
            margin-bottom: 1mm;
          }
          
          .barcode-container {
            text-align: center;
            margin: 1mm 0;
          }
          
          .barcode-container svg {
            max-width: 100%;
            height: 12mm;
          }
          
          .header-order-num {
            text-align: center;
            font-family: 'Courier New', monospace;
            font-size: 8px;
            font-weight: bold;
            margin-bottom: 1mm;
          }
          
          .header-info {
            padding: 1mm 0;
            border-top: 1px dashed #aaa;
            border-bottom: 1px dashed #aaa;
          }
          
          .header-row {
            display: flex;
            justify-content: space-between;
            padding: 0.5mm 0;
            font-size: 7px;
          }
          
          .header-row.express-due {
            background: #fef3c7;
            padding: 0.5mm 1mm;
            border-radius: 1px;
            font-weight: bold;
          }
          
          .header-row .label {
            font-weight: 600;
            color: #6b7280;
          }
          
          .header-row .value {
            font-weight: bold;
            color: #111;
          }
          
          .header-row .value.small {
            font-size: 6px;
            max-width: 25mm;
            text-align: right;
          }
          
          .header-notes {
            margin-top: 1mm;
            padding: 1mm;
            background: #e0e7ff;
            border-radius: 2px;
          }
          
          .header-notes .note-title {
            display: block;
            font-weight: 700;
            color: #3730a3;
            font-size: 6px;
            margin-bottom: 0.5mm;
          }
          
          .header-notes .note-text {
            font-size: 7px;
            color: #1e1b4b;
          }
          
          .header-footer {
            display: flex;
            justify-content: space-between;
            margin-top: 1mm;
            padding-top: 1mm;
            border-top: 1px solid #ddd;
            font-size: 6px;
            color: #6b7280;
          }
          
          .tag {
            width: 52mm;
            min-height: 22mm;
            border: 1.5px solid #333;
            border-radius: 3px;
            padding: 1mm;
            display: flex;
            flex-direction: column;
            background: white;
            page-break-inside: avoid;
            position: relative;
            gap: 0.5mm;
          }
          
          .tag.express {
            border: 2px solid #f97316;
            background: linear-gradient(135deg, #fff7ed 0%, #ffffff 50%);
          }
          
          .priority-banner {
            position: absolute;
            top: -1px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(90deg, #f97316, #ea580c);
            color: white;
            font-size: 6px;
            font-weight: 900;
            padding: 0px 6px;
            border-radius: 0 0 4px 4px;
            letter-spacing: 0.5px;
            z-index: 10;
          }
          
          .tag-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: bold;
            font-size: 7px;
            padding: 0.5mm 0;
            border-bottom: 1px dashed #aaa;
            margin-top: ${isExpressOrder ? '2mm' : '0'};
          }
          
          .order-num {
            font-family: 'Courier New', monospace;
            font-size: 6px;
          }
          
          .index-box {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 0;
          }
          
          .service-index {
            font-size: 10px;
            font-weight: 900;
            color: #1f2937;
            background: #f3f4f6;
            padding: 0 3px;
            border-radius: 2px;
            line-height: 1;
          }
          
          .global-index {
            font-size: 6px;
            font-weight: 600;
            color: #6b7280;
            line-height: 1;
          }
          
          .customer-name {
            font-weight: 800;
            font-size: 9px;
            text-align: center;
            color: #1f2937;
            padding: 0.5mm 0;
            text-transform: uppercase;
            letter-spacing: 0.2px;
            border-bottom: 1px solid #eee;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .service-name {
            font-weight: 900;
            font-size: 12px;
            text-align: center;
            text-transform: uppercase;
            color: #111827;
            padding: 1mm 0;
            background: #f9fafb;
            border-radius: 2px;
            line-height: 1;
            margin: 0.5mm 0;
          }
          
          .service-note, .order-note {
            font-size: 7px;
            padding: 0.5mm 1.5mm;
            background: #fef3c7;
            border-radius: 2px;
            word-wrap: break-word;
            line-height: 1.1;
            margin-bottom: 0.5mm;
          }
          
          .order-note {
            background: #e0e7ff;
          }
          
          .note-label {
            font-weight: 700;
            color: #92400e;
          }
          
          .order-note .note-label {
            color: #3730a3;
          }
          
          .tag-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 6px;
            padding-top: 0.5mm;
            border-top: 1px dashed #aaa;
            margin-top: auto;
          }
          
          .store {
            font-weight: 700;
            color: #6b7280;
          }
          
          .due {
            font-weight: 700;
            color: ${isExpressOrder ? '#ea580c' : '#059669'};
          }

          @media print {
            body { 
              background: white;
              print-color-adjust: exact; 
              -webkit-print-color-adjust: exact; 
              margin: 0;
              padding: 0;
            }
            .tags-container {
              gap: 1mm;
              padding: 0;
            }
            .header-tag, .tag {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="tags-container">
          ${headerTagHtml}
          ${tagsHtml}
        </div>
        <script>
          window.onload = function() { 
            try {
              if (typeof JsBarcode !== 'undefined') {
                JsBarcode("#header-barcode", "${orderNumber}", {
                  format: "CODE128",
                  width: 1.5,
                  height: 30,
                  displayValue: false,
                  margin: 1
                });
              }
            } catch(e) { 
              console.log('Barcode generation error:', e); 
            }
            setTimeout(function() { window.print(); }, 300);
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const allTags = getAllTags();
  const formattedDueDate = dueDate ? new Date(dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Print Garment Tags
            {isExpressOrder && (
              <Badge className="bg-orange-500 text-white ml-2">
                <Zap className="h-3 w-3 mr-1" />
                EXPRESS
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {allTags.length} tags • Optimized compact layout for paper saving
          </DialogDescription>
        </DialogHeader>

        {/* Preview - Vertical Layout */}
        <div ref={printRef} className="flex flex-col items-center gap-2 p-4 bg-gray-100 rounded-lg max-h-[50vh] overflow-auto">

          {/* Order Summary Header Preview */}
          <div className={`w-[52mm] bg-white border-2 rounded p-2 text-[8px] shadow-lg flex flex-col gap-0.5 ${isExpressOrder ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-white' : 'border-gray-800'
            }`}>
            {isExpressOrder && (
              <div className="text-center bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[8px] font-bold py-0.5 rounded -mt-0.5 -mx-0.5 mb-1">
                ⚡ EXPRESS ORDER - PRIORITY
              </div>
            )}
            <div className="text-center font-bold text-[10px] border-b border-gray-800 pb-0.5">
              ORDER SUMMARY
            </div>

            {/* Barcode Container */}
            <div className="flex justify-center items-center bg-white border border-gray-200 rounded py-1 my-0.5 min-h-[35px]">
              <svg ref={previewBarcodeRef} className="max-w-full h-8"></svg>
            </div>

            <div className="text-center font-mono text-[9px] font-semibold text-gray-700 bg-gray-100 py-0.5 rounded">
              {orderNumber}
            </div>
            <div className="space-y-0.5 text-[8px] border-t border-dashed border-gray-300 pt-1 mt-0.5">
              <div className="flex justify-between">
                <span className="text-gray-500">Customer:</span>
                <span className="font-semibold text-gray-800 truncate max-w-[100px]">{customerName || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Items:</span>
                <span className="font-semibold text-gray-800">{totalItems} pcs</span>
              </div>
              {formattedDueDate && (
                <div className={`flex justify-between ${isExpressOrder ? 'bg-amber-100 px-0.5 rounded' : ''}`}>
                  <span className="text-gray-500">{isExpressOrder ? '⚡ Due:' : 'Due Date:'}</span>
                  <span className={`font-semibold ${isExpressOrder ? 'text-orange-600' : 'text-emerald-600'}`}>
                    {formattedDueDate}
                  </span>
                </div>
              )}
            </div>
            {commonNote && (
              <div className="bg-indigo-100 p-0.5 rounded mt-0.5">
                <div className="text-[6px] font-bold text-indigo-700">Special Instructions:</div>
                <div className="text-[7px] text-indigo-900 leading-tight">{commonNote}</div>
              </div>
            )}
            <div className="flex justify-between text-[6px] text-gray-400 pt-0.5 border-t border-gray-200 mt-0.5">
              <span>{storeCode}</span>
              <span>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full flex items-center gap-2 px-2">
            <div className="flex-1 border-t border-dashed border-gray-300"></div>
            <span className="text-[8px] text-gray-400 font-medium">Service Tags</span>
            <div className="flex-1 border-t border-dashed border-gray-300"></div>
          </div>

          {allTags.map(({ item, globalIndex, serviceIndex, serviceTotalQty }) => (
            <div
              key={`preview-${globalIndex}`}
              className={`w-[52mm] bg-white border-[1.5px] rounded-[3px] p-1 text-[8px] shadow-sm flex flex-col relative gap-0.5 ${isExpressOrder ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-white' : 'border-gray-700'
                }`}
              style={{ minHeight: '22mm' }}
            >
              {/* Priority Banner */}
              {isExpressOrder && (
                <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[6px] font-bold px-1.5 py-0 rounded-b-[4px] z-10">
                  ⚡ PRIORITY
                </div>
              )}

              {/* Header */}
              <div className={`flex justify-between items-center pb-0.5 border-b border-dashed border-gray-300 ${isExpressOrder ? 'mt-2' : ''}`}>
                <span className="font-mono text-[6px] text-gray-500">{orderNumber}</span>
                <div className="flex flex-col items-end gap-0">
                  <span className="font-black text-[10px] bg-gray-100 px-1 rounded leading-none">{serviceIndex}/{serviceTotalQty}</span>
                  <span className="text-[6px] text-gray-500 font-medium leading-none">#{globalIndex}</span>
                </div>
              </div>

              {/* Customer */}
              <div className="font-bold text-center text-[9px] uppercase tracking-wide border-b border-gray-200 pb-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                {customerName || 'Customer'}
              </div>

              {/* Service */}
              <div className="font-black text-center text-[12px] uppercase bg-gray-50 py-0.5 rounded leading-none my-0.5">
                {item.serviceName}
              </div>

              {/* Service Note */}
              {item.tagNote && (
                <div className="text-[7px] bg-amber-100 px-1 py-0.5 rounded mb-0.5 leading-tight">
                  <span className="font-bold text-amber-700">Note:</span> {item.tagNote}
                </div>
              )}

              {/* Order Note - Only if exists */}
              {commonNote && (
                <div className="text-[7px] bg-indigo-100 px-1 py-0.5 rounded leading-tight">
                  <span className="font-bold text-indigo-700">Order:</span> {commonNote}
                </div>
              )}

              {/* Footer */}
              <div className="flex justify-between text-[6px] pt-0.5 border-t border-dashed border-gray-300 mt-auto items-center">
                <span className="font-semibold text-gray-500">{storeCode}</span>
                {formattedDueDate && (
                  <span className={`font-bold ${isExpressOrder ? 'text-orange-600' : 'text-emerald-600'}`}>
                    Due: {formattedDueDate}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handlePrint} className={`gap-2 ${isExpressOrder ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}`}>
            <Printer className="h-4 w-4" />
            Print {allTags.length} Tags
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default GarmentTagPrint;
