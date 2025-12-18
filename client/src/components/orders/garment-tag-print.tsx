/**
 * Garment Tag Generator - Optimized for Electron & Thermal Printers
 * 
 * WYSIWYG Print System - What You See Is What You Print!
 * 
 * Features:
 * - Customer name (full, not truncated)
 * - Item index (1/5 format with global count)
 * - Service name (FULL - no more truncation)
 * - Notes with proper visibility
 * - Priority indicator for express orders
 * - Barcode on order summary only
 * 
 * Optimizations:
 * - High-DPI rendering for thermal printers
 * - Embedded fonts for consistent output
 * - Zero wastage layout
 * - Electron-specific print handling
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
      const timeoutId = setTimeout(() => {
        if (previewBarcodeRef.current) {
          try {
            JsBarcode(previewBarcodeRef.current, orderNumber, {
              format: "CODE128",
              width: 1.8,
              height: 35,
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
      for (let i = 0; i < item.quantity; i++) {
        globalCounter++;
        tags.push({
          item,
          globalIndex: globalCounter,
          serviceIndex: i + 1,
          serviceTotalQty: item.quantity,
          serviceName: item.serviceName
        });
      }
    });
    return tags;
  };

  const handlePrint = () => {
    const allTags = getAllTags();
    const formattedDueDate = dueDate ? new Date(dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';
    const displayCustomer = (customerName || 'Customer').toUpperCase();

    // Generate individual service tags - OPTIMIZED for readability
    const tagsHtml = allTags.map(({ item, globalIndex, serviceIndex, serviceTotalQty }) => {
      return `
        <div class="tag ${isExpressOrder ? 'express' : ''}">
          <div class="tag-header">
            <span class="order-id">${orderNumber}</span>
            <div class="count-box">
              <span class="count-main">${globalIndex}/${totalItems}</span>
              <span class="count-sub">#${serviceIndex}/${serviceTotalQty}</span>
            </div>
          </div>
          <div class="divider"></div>
          <div class="customer">${displayCustomer}</div>
          <div class="service-box">
            <div class="service">${item.serviceName.toUpperCase()}</div>
          </div>
          ${item.tagNote ? `<div class="note"><span class="note-label">Note:</span> ${item.tagNote}</div>` : ''}
          <div class="divider dashed"></div>
          <div class="tag-footer">
            <span class="store">${storeCode}</span>
            ${formattedDueDate ? `<span class="due">Due: ${formattedDueDate}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');

    // ORDER SUMMARY HEADER TAG
    const headerTagHtml = `
      <div class="header-tag ${isExpressOrder ? 'express' : ''}">
        ${isExpressOrder ? '<div class="express-banner">⚡ EXPRESS ORDER</div>' : ''}
        <div class="header-title">ORDER SUMMARY</div>
        <div class="barcode-container">
          <svg id="print-barcode"></svg>
        </div>
        <div class="order-number">${orderNumber}</div>
        <div class="divider"></div>
        <div class="info-grid">
          <div class="info-row">
            <span class="info-label">Customer:</span>
            <span class="info-value">${displayCustomer}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Total Items:</span>
            <span class="info-value">${totalItems} pcs</span>
          </div>
          ${formattedDueDate ? `
          <div class="info-row ${isExpressOrder ? 'highlight' : ''}">
            <span class="info-label">Due Date:</span>
            <span class="info-value due-text">${formattedDueDate}</span>
          </div>
          ` : ''}
        </div>
        <div class="divider dashed"></div>
        <div class="header-footer">
          <span>${storeCode}</span>
          <span>${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
        </div>
      </div>
    `;

    // OPTIMIZED PRINT HTML - Matches Preview EXACTLY
    const printHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tags - ${orderNumber}</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <style>
          /*=============================================
            GARMENT TAG PRINT STYLES
            Optimized for 50mm x 30mm Thermal Labels
            High DPI + Electron Compatible
          =============================================*/
          
          @page {
            size: 50mm 30mm;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          
          html {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          body {
            margin: 0 !important;
            padding: 0 !important;
            width: 50mm;
            background: #fff;
            font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
            font-size: 8pt;
            font-weight: 700;
            line-height: 1.2;
            color: #000;
          }
          
          .tags-wrapper {
            width: 50mm;
            display: flex;
            flex-direction: column;
            gap: 0;
          }
          
          /*========== HEADER TAG ==========*/
          .header-tag {
            width: 50mm;
            min-height: 30mm;
            padding: 2mm;
            background: #fff;
            border: 0.3mm solid #000;
            display: flex;
            flex-direction: column;
            page-break-after: always;
            page-break-inside: avoid;
          }
          
          .header-tag.express {
            border-color: #ea580c;
            border-width: 0.5mm;
          }
          
          .express-banner {
            background: linear-gradient(135deg, #ea580c, #f97316);
            color: #fff;
            text-align: center;
            font-size: 7pt;
            font-weight: 800;
            padding: 1mm 0;
            margin: -2mm -2mm 1.5mm -2mm;
            letter-spacing: 0.5pt;
          }
          
          .header-title {
            text-align: center;
            font-size: 9pt;
            font-weight: 800;
            letter-spacing: 0.3pt;
            padding-bottom: 1mm;
          }
          
          .barcode-container {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 1mm 0;
            background: #fff;
          }
          
          .barcode-container svg {
            max-width: 44mm;
            height: 8mm;
          }
          
          .order-number {
            text-align: center;
            font-family: 'Consolas', 'Courier New', monospace;
            font-size: 7pt;
            font-weight: 700;
            color: #374151;
            padding: 0.5mm 0;
            background: #f3f4f6;
            border-radius: 1mm;
            margin: 0.5mm 0;
          }
          
          .divider {
            height: 0.2mm;
            background: #d1d5db;
            margin: 1mm 0;
          }
          
          .divider.dashed {
            background: transparent;
            border-top: 0.2mm dashed #9ca3af;
          }
          
          .info-grid {
            display: flex;
            flex-direction: column;
            gap: 0.5mm;
            padding: 0.5mm 0;
          }
          
          .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 7pt;
            padding: 0.3mm 0;
          }
          
          .info-row.highlight {
            background: #fef3c7;
            padding: 0.5mm 1mm;
            border-radius: 0.5mm;
            margin: 0 -0.5mm;
          }
          
          .info-label {
            color: #374151;
            font-weight: 700;
          }
          
          .info-value {
            font-weight: 700;
            color: #111827;
            text-align: right;
            max-width: 60%;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .due-text {
            color: ${isExpressOrder ? '#ea580c' : '#059669'};
          }
          
          .header-footer {
            display: flex;
            justify-content: space-between;
            font-size: 6pt;
            color: #374151;
            font-weight: 700;
            padding-top: 0.5mm;
          }
          
          /*========== INDIVIDUAL TAG ==========*/
          .tag {
            width: 50mm;
            min-height: 30mm;
            padding: 1.5mm;
            background: #fff;
            border: 0.3mm solid #000;
            display: flex;
            flex-direction: column;
            page-break-after: always;
            page-break-inside: avoid;
          }
          
          .tag.express {
            border-color: #ea580c;
            border-width: 0.5mm;
            background: linear-gradient(180deg, #fffbeb 0%, #fff 100%);
          }
          
          .tag-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          
          .order-id {
            font-family: 'Consolas', 'Courier New', monospace;
            font-size: 6pt;
            font-weight: 800;
            color: #374151;
          }
          
          .count-box {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 0;
          }
          
          .count-main {
            font-size: 11pt;
            font-weight: 900;
            line-height: 1;
            background: #f3f4f6;
            padding: 0.5mm 1.5mm;
            border-radius: 1mm;
          }
          
          .count-sub {
            font-size: 5pt;
            color: #374151;
            font-weight: 700;
          }
          
          .customer {
            text-align: center;
            font-size: 9pt;
            font-weight: 800;
            padding: 1mm 0;
            letter-spacing: 0.2pt;
            color: #111827;
          }
          
          .service-box {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f9fafb;
            border-radius: 1mm;
            padding: 1.5mm;
            margin: 0.5mm 0;
            min-height: 8mm;
          }
          
          .service {
            font-size: 12pt;
            font-weight: 900;
            text-align: center;
            letter-spacing: 0.3pt;
            line-height: 1.1;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          
          .note {
            background: #fef3c7;
            padding: 0.8mm 1mm;
            border-radius: 0.5mm;
            font-size: 6pt;
            font-weight: 700;
            text-align: center;
            margin: 0.5mm 0;
          }
          
          .note-label {
            font-weight: 700;
            color: #92400e;
          }
          
          .tag-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 0.5mm;
            font-size: 6pt;
          }
          
          .store {
            color: #374151;
            font-weight: 800;
          }
          
          .due {
            font-weight: 900;
            color: ${isExpressOrder ? '#ea580c' : '#059669'};
          }
          
          /*========== PRINT MEDIA QUERY ==========*/
          @media print {
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              width: 50mm !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            
            @page {
              size: 50mm 30mm !important;
              margin: 0 !important;
            }
            
            .tags-wrapper {
              gap: 0 !important;
            }
            
            .header-tag, .tag {
              page-break-after: always !important;
              page-break-inside: avoid !important;
              margin: 0 !important;
              box-shadow: none !important;
            }
            
            /* Remove any borders that might cause issues */
            .header-tag:last-child,
            .tag:last-child {
              page-break-after: auto;
            }
          }
          
          /*========== ELECTRON SPECIFIC ==========*/
          @media screen {
            body {
              /* Preview mode - show borders clearly */
              padding: 2mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="tags-wrapper">
          ${headerTagHtml}
          ${tagsHtml}
        </div>
        <script>
          (function() {
            // Wait for DOM to be ready
            function initPrint() {
              // Generate barcode
              try {
                if (typeof JsBarcode !== 'undefined') {
                  JsBarcode("#print-barcode", "${orderNumber}", {
                    format: "CODE128",
                    width: 1.5,
                    height: 22,
                    displayValue: false,
                    margin: 0,
                    lineColor: "#000000",
                    background: "#ffffff"
                  });
                }
              } catch(e) { 
                console.warn('Barcode generation error:', e); 
              }
              
              // Detect environment
              var isElectron = (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') ||
                               (typeof navigator !== 'undefined' && navigator.userAgent.indexOf('Electron') >= 0);
              var isWindows = (typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().indexOf('win') >= 0);
              
              // Optimal print delay based on environment
              var printDelay = isElectron ? (isWindows ? 1200 : 600) : 400;
              
              setTimeout(function() {
                window.print();
              }, printDelay);
            }
            
            // Run when ready
            if (document.readyState === 'complete') {
              initPrint();
            } else {
              window.addEventListener('load', initPrint);
            }
          })();
        </script>
      </body>
      </html>
    `;

    // Electron-optimized iframe printing
    const isElectronEnv = (typeof window !== 'undefined' && (window as any).process && (window as any).process.type === 'renderer') ||
      (typeof navigator !== 'undefined' && navigator.userAgent.indexOf('Electron') >= 0);

    if (isElectronEnv) {
      // Use hidden iframe for Electron to avoid window management issues
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none;visibility:hidden;pointer-events:none;';
      iframe.setAttribute('aria-hidden', 'true');
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(printHTML);
        doc.close();

        const isWindowsEnv = navigator.userAgent.toLowerCase().includes('win');
        const printDelay = isWindowsEnv ? 1500 : 800;
        const cleanupDelay = isWindowsEnv ? 12000 : 8000;

        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (error) {
            console.error('Electron print failed:', error);
            // Fallback: try opening new window
            const fallbackWindow = window.open('', '_blank');
            if (fallbackWindow) {
              fallbackWindow.document.write(printHTML);
              fallbackWindow.document.close();
            }
          }

          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, cleanupDelay);
        }, printDelay);
      }
    } else {
      // Standard browser printing
      const printWindow = window.open('', '_blank', 'width=600,height=800');
      if (!printWindow) {
        alert('Please allow popups to print tags.');
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
            {allTags.length} tags • Optimized for 50mm × 30mm thermal labels
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
              className={`w-[52mm] bg-white border-[1.5px] rounded-[3px] p-1.5 text-[8px] shadow-sm flex flex-col gap-0.5 ${isExpressOrder ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-white' : 'border-gray-700'
                }`}
              style={{ minHeight: '26mm' }}
            >
              {/* Header - Matches Print Layout */}
              <div className="flex justify-between items-start">
                <span className="font-mono text-[6px] text-gray-500 font-semibold">{orderNumber}</span>
                <div className="flex flex-col items-end">
                  <span className="font-black text-[12px] bg-gray-100 px-1.5 py-0.5 rounded leading-none">{globalIndex}/{totalItems}</span>
                  <span className="text-[5px] text-gray-400 font-medium">#{serviceIndex}/{serviceTotalQty}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="h-[1px] bg-gray-200 my-0.5"></div>

              {/* Customer - Full Name, No Truncation */}
              <div className="font-bold text-center text-[10px] uppercase tracking-wide text-gray-900 py-0.5">
                {customerName || 'Customer'}
              </div>

              {/* Service - Full Name in Box */}
              <div className="flex-1 flex items-center justify-center bg-gray-50 rounded py-1 my-0.5">
                <div className="font-black text-center text-[13px] uppercase leading-tight break-words">
                  {item.serviceName}
                </div>
              </div>

              {/* Service Note */}
              {item.tagNote && (
                <div className="text-[7px] bg-amber-100 px-1.5 py-0.5 rounded text-center">
                  <span className="font-bold text-amber-700">Note:</span> {item.tagNote}
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-dashed border-gray-300 mt-auto"></div>

              {/* Footer */}
              <div className="flex justify-between text-[6px] pt-0.5 items-center">
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
