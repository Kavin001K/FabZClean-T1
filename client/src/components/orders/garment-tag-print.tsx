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
    const allTags = getAllTags();
    const formattedDueDate = dueDate ? new Date(dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';

    // Generate individual service tags - ULTRA COMPACT for 40mm x 40mm labels
    const tagsHtml = allTags.map(({ item, globalIndex, serviceIndex, serviceTotalQty }) => {
      // Truncate customer name to fit
      const shortCustomer = (customerName || 'Customer').substring(0, 12).toUpperCase();
      // Truncate service name if too long
      const shortService = item.serviceName.length > 12 ? item.serviceName.substring(0, 11) + '.' : item.serviceName;

      return `
        <div class="tag ${isExpressOrder ? 'express' : ''}">
          <div class="tag-row-1">
            <span class="order-id">${orderNumber}</span>
            <span class="count-badge">${serviceIndex}/${serviceTotalQty}</span>
          </div>
          <div class="customer">${shortCustomer}</div>
          <div class="service">${shortService}</div>
          ${item.tagNote ? `<div class="note">${item.tagNote.substring(0, 25)}</div>` : ''}
          <div class="tag-bottom">
            <span class="store">${storeCode}</span>
            ${formattedDueDate ? `<span class="due">${formattedDueDate}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');

    // ORDER SUMMARY HEADER TAG - Also fits 40mm x 40mm
    const itemsSummary = items.map(item => `${item.serviceName.substring(0, 6)} x${item.quantity}`).join(', ');
    const shortCustomerHeader = (customerName || 'N/A').substring(0, 14);

    const headerTagHtml = `
      <div class="header-tag ${isExpressOrder ? 'express' : ''}">
        ${isExpressOrder ? '<div class="express-bar">⚡EXPRESS</div>' : ''}
        <div class="h-title">ORDER</div>
        <div class="barcode-wrap"><svg id="header-barcode"></svg></div>
        <div class="h-order">${orderNumber}</div>
        <div class="h-info">
          <div class="h-row"><span>Cust:</span><span>${shortCustomerHeader}</span></div>
          <div class="h-row"><span>Items:</span><span>${totalItems} pcs</span></div>
          ${formattedDueDate ? `<div class="h-row ${isExpressOrder ? 'due-exp' : ''}"><span>Due:</span><span>${formattedDueDate}</span></div>` : ''}
        </div>
        <div class="h-foot"><span>${storeCode}</span><span>${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span></div>
      </div>
    `;

    const printHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tags - ${orderNumber}</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <style>
          /* ============================================
             TSC BARCODE PRINTER - 40mm x 40mm LABELS
             Zero Wastage Print Settings
             ============================================ */
          
          @page {
            size: 40mm 40mm;
            margin: 0 !important;
          }
          
          * { box-sizing: border-box; margin: 0; padding: 0; }
          
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 40mm;
            background: white;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 7px;
            line-height: 1.1;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .tags-container {
            display: flex;
            flex-direction: column;
            width: 40mm;
            gap: 0;
            padding: 0;
            margin: 0;
          }
          
          /* ========== HEADER TAG (40mm x 40mm) ========== */
          .header-tag {
            width: 40mm;
            height: 40mm;
            padding: 1mm;
            border: 1px solid #000;
            background: white;
            display: flex;
            flex-direction: column;
            page-break-after: always;
          }
          
          .header-tag.express { border: 1.5px solid #f97316; }
          
          .express-bar {
            background: #f97316;
            color: white;
            text-align: center;
            font-size: 6px;
            font-weight: 900;
            padding: 0.5mm;
            margin: -1mm -1mm 0.5mm -1mm;
          }
          
          .h-title {
            text-align: center;
            font-size: 8px;
            font-weight: 900;
            border-bottom: 0.5px solid #333;
            padding-bottom: 0.5mm;
            margin-bottom: 0.5mm;
          }
          
          .barcode-wrap {
            text-align: center;
            height: 8mm;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .barcode-wrap svg {
            max-width: 36mm;
            height: 7mm;
          }
          
          .h-order {
            text-align: center;
            font-family: 'Courier New', monospace;
            font-size: 7px;
            font-weight: bold;
            margin-bottom: 0.5mm;
          }
          
          .h-info {
            flex: 1;
            border-top: 0.5px dashed #888;
            border-bottom: 0.5px dashed #888;
            padding: 0.5mm 0;
          }
          
          .h-row {
            display: flex;
            justify-content: space-between;
            font-size: 6px;
            padding: 0.3mm 0;
          }
          
          .h-row span:first-child { color: #666; }
          .h-row span:last-child { font-weight: bold; }
          
          .due-exp { background: #fef3c7; padding: 0.3mm 0.5mm; }
          
          .h-foot {
            display: flex;
            justify-content: space-between;
            font-size: 5px;
            color: #666;
            padding-top: 0.5mm;
          }
          
          /* ========== INDIVIDUAL TAG (40mm x 40mm) ========== */
          .tag {
            width: 40mm;
            height: 40mm;
            padding: 1mm;
            border: 1px solid #000;
            background: white;
            display: flex;
            flex-direction: column;
            page-break-after: always;
          }
          
          .tag.express { border: 1.5px solid #f97316; background: #fffbeb; }
          
          .tag-row-1 {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 0.5px dashed #aaa;
            padding-bottom: 0.5mm;
            margin-bottom: 0.5mm;
          }
          
          .order-id {
            font-family: 'Courier New', monospace;
            font-size: 6px;
            font-weight: bold;
          }
          
          .count-badge {
            font-size: 10px;
            font-weight: 900;
            background: #f3f4f6;
            padding: 0 2px;
            border-radius: 1px;
          }
          
          .customer {
            text-align: center;
            font-size: 8px;
            font-weight: 800;
            padding: 1mm 0;
            border-bottom: 0.5px solid #eee;
            letter-spacing: 0.2px;
          }
          
          .service {
            text-align: center;
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            padding: 2mm 0;
            background: #f9fafb;
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .note {
            font-size: 5px;
            background: #fef3c7;
            padding: 0.5mm;
            text-align: center;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
          }
          
          .tag-bottom {
            display: flex;
            justify-content: space-between;
            font-size: 5px;
            padding-top: 0.5mm;
            border-top: 0.5px dashed #aaa;
            margin-top: auto;
          }
          
          .store { color: #666; font-weight: 600; }
          .due { font-weight: 700; color: ${isExpressOrder ? '#ea580c' : '#059669'}; }

          /* ========== PRINT OVERRIDE ========== */
          @media print {
            html, body { 
              margin: 0 !important;
              padding: 0 !important;
              width: 40mm !important;
              background: white !important;
              print-color-adjust: exact !important;
              -webkit-print-color-adjust: exact !important;
            }
            
            @page {
              size: 40mm 40mm !important;
              margin: 0 !important;
            }
            
            .tags-container {
              gap: 0 !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            
            .header-tag, .tag {
              page-break-after: always;
              margin: 0 !important;
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
                  width: 1.2,
                  height: 18,
                  displayValue: false,
                  margin: 0
                });
              }
            } catch(e) { 
              console.log('Barcode error:', e); 
            }
            
            // Electron/Windows detection for optimized printing
            const isElectron = (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') ||
                               (typeof navigator !== 'undefined' && navigator.userAgent.indexOf('Electron') >= 0);
            const isWindows = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('win');
            
            setTimeout(function() { 
              window.print(); 
            }, isElectron ? (isWindows ? 800 : 400) : 300);
          }
        </script>
      </body>
      </html>
    `;

    // Electron-optimized iframe printing for Windows
    const isElectronEnv = (typeof window !== 'undefined' && (window as any).process && (window as any).process.type === 'renderer') ||
      (typeof navigator !== 'undefined' && navigator.userAgent.indexOf('Electron') >= 0);

    if (isElectronEnv) {
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none;visibility:hidden;';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(printHTML);
        doc.close();

        const isWindowsEnv = navigator.userAgent.toLowerCase().includes('win');
        const printDelay = isWindowsEnv ? 1000 : 600;
        const cleanupDelay = isWindowsEnv ? 10000 : 6000;

        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (error) {
            console.error('Print failed:', error);
          }

          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, cleanupDelay);
        }, printDelay);
      }
    } else {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to print.');
        return;
      }
      printWindow.document.write(printHTML);
      printWindow.document.close();
    }
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
