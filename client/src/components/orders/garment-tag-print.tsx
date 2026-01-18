/**
 * Garment Tag Generator - Optimized for Electron & Thermal Printers
 * 
 * WYSIWYG Print System - What You See Is What You Print!
 * 
 * Tag Layout:
 * - ORDER SUMMARY: 40mm width × AUTO height (variable content)
 * - SERVICE TAGS: 40mm × 30mm (4cm × 3cm) STRICT with overflow:hidden
 * 
 * Features:
 * - Customer name with overflow protection
 * - Item index (1/5 format with global count)
 * - Service name (compressed to fit)
 * - Notes with ellipsis if too long
 * - Priority indicator for express orders
 * - Barcode on order summary only
 * 
 * Optimizations:
 * - High-DPI rendering for thermal printers
 * - Monospace font for clean output
 * - Compressed spacing to fit all content
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

    // Generate individual service tags - COMPACT 4cm x 3cm (40mm x 30mm) layout with EXPRESS watermark
    const tagsHtml = allTags.map(({ item, globalIndex }) => {
      return `
        <div class="tag ${isExpressOrder ? 'express' : ''}">
          ${isExpressOrder ? '<div class="express-watermark">EXPRESS</div>' : ''}
          <div class="tag-header">
            <span class="order-id">${orderNumber}</span>
            <span class="count-main">${globalIndex}/${totalItems}</span>
          </div>
          <div class="customer">${displayCustomer}</div>
          <div class="service">${item.serviceName.toUpperCase()}</div>
          ${item.tagNote ? `<div class="note">Note: ${item.tagNote}</div>` : ''}
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
            - Header Tag: 40mm width x AUTO height
            - Service Tags: 40mm x 30mm (4cm x 3cm) STRICT
            High DPI + Electron Compatible
          =============================================*/
          
          @page {
            size: 40mm auto;
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
            width: 40mm;
            background: #fff;
            font-family: 'Consolas', 'Courier New', monospace;
            font-size: 8pt;
            font-weight: 600;
            line-height: 1.1;
            color: #333;
          }
          
          .tags-wrapper {
            width: 40mm;
            display: flex;
            flex-direction: column;
            gap: 0;
          }
          
          /*========== HEADER TAG (Order Summary) - AUTO HEIGHT ==========*/
          .header-tag {
            width: 40mm;
            padding: 1.5mm;
            background: #fff;
            border: 0.4mm dashed #333;
            display: flex;
            flex-direction: column;
            page-break-after: always;
            page-break-inside: avoid;
          }
          
          .header-tag.express {
            border-color: #c2410c;
            border-style: solid;
            border-width: 0.5mm;
          }
          
          .express-banner {
            background: #333;
            color: #fff;
            text-align: center;
            font-size: 7pt;
            font-weight: 800;
            padding: 0.8mm 0;
            margin: -1.5mm -1.5mm 1mm -1.5mm;
          }
          
          .header-title {
            text-align: center;
            font-size: 8pt;
            font-weight: 800;
            padding-bottom: 0.5mm;
            border-bottom: 0.3mm dashed #666;
            margin-bottom: 0.5mm;
          }
          
          .barcode-container {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 0.5mm 0;
            background: #fff;
          }
          
          .barcode-container svg {
            max-width: 36mm;
            height: 6mm;
          }
          
          .order-number {
            text-align: center;
            font-size: 6pt;
            font-weight: 700;
            color: #333;
            padding: 0.3mm 0;
            border-bottom: 0.2mm dashed #999;
            margin-bottom: 0.5mm;
          }
          
          .info-grid {
            display: flex;
            flex-direction: column;
            gap: 0.3mm;
          }
          
          .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 6pt;
            padding: 0.2mm 0;
          }
          
          .info-row.highlight {
            background: #eee;
            padding: 0.3mm 0.5mm;
            margin: 0 -0.5mm;
          }
          
          .info-label {
            color: #555;
            font-weight: 600;
          }
          
          .info-value {
            font-weight: 700;
            color: #111;
            text-align: right;
          }
          
          .due-text {
            color: ${isExpressOrder ? '#c2410c' : '#059669'};
          }
          
          .header-footer {
            display: flex;
            justify-content: space-between;
            font-size: 5pt;
            color: #555;
            font-weight: 600;
            padding-top: 0.3mm;
            border-top: 0.2mm dashed #999;
            margin-top: 0.5mm;
          }
          
          /*========== SERVICE TAG (STRICT 4cm x 3cm) ==========*/
          .tag {
            width: 40mm;
            height: 30mm;
            max-height: 30mm;
            padding: 1.5mm;
            background: #fff;
            border: 0.4mm dashed #333;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            page-break-after: always;
            page-break-inside: avoid;
          }
          
          .tag.express {
            border-color: #c2410c;
            border-style: solid;
            position: relative;
          }
          
          .express-watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-25deg);
            font-size: 14pt;
            font-weight: 900;
            color: #ea580c;
            opacity: 0.12;
            letter-spacing: 2pt;
            white-space: nowrap;
            pointer-events: none;
            z-index: 0;
          }
          
          .tag-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 0.5mm;
            border-bottom: 0.2mm dashed #999;
            flex-shrink: 0;
          }
          
          .order-id {
            font-size: 6pt;
            font-weight: 700;
            color: #333;
          }
          
          .count-main {
            font-size: 9pt;
            font-weight: 900;
            color: #111;
          }
          
          .customer {
            text-align: center;
            font-size: 8pt;
            font-weight: 700;
            padding: 1mm 0 0.5mm 0;
            color: #222;
            flex-shrink: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          
          .service {
            text-align: center;
            font-size: 9pt;
            font-weight: 800;
            color: #111;
            padding: 0.5mm 0;
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            word-break: break-word;
            line-height: 1.1;
          }
          
          .note {
            text-align: center;
            font-size: 6pt;
            font-weight: 600;
            color: #333;
            padding: 0.5mm;
            border-top: 0.2mm dashed #999;
            flex-shrink: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          
          /*========== PRINT MEDIA QUERY ==========*/
          @media print {
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              width: 40mm !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            
            @page {
              size: 40mm auto !important;
              margin: 0 !important;
            }
            
            .tags-wrapper {
              gap: 0 !important;
            }
            
            .header-tag {
              page-break-after: always !important;
              page-break-inside: avoid !important;
              margin: 0 !important;
              box-shadow: none !important;
            }
            
            .tag {
              page-break-after: always !important;
              page-break-inside: avoid !important;
              margin: 0 !important;
              box-shadow: none !important;
              height: 30mm !important;
              max-height: 30mm !important;
              overflow: hidden !important;
            }
            
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
            {allTags.length} tags • Optimized for 40mm × 30mm (4×3 cm) thermal labels
          </DialogDescription>
        </DialogHeader>

        {/* Preview - Vertical Layout */}
        <div ref={printRef} className="flex flex-col items-center gap-2 p-4 bg-gray-800 rounded-lg max-h-[50vh] overflow-auto">

          {/* Order Summary Header Preview */}
          <div className={`w-[40mm] bg-white border-2 border-dashed rounded p-2 text-[8px] shadow-lg flex flex-col gap-0.5 ${isExpressOrder ? 'border-orange-500' : 'border-gray-600'
            }`}>
            {isExpressOrder && (
              <div className="text-center bg-gray-800 text-white text-[8px] font-bold py-0.5 rounded -mt-0.5 -mx-0.5 mb-1">
                ⚡ EXPRESS ORDER
              </div>
            )}
            <div className="text-center font-bold text-[10px] border-b border-dashed border-gray-600 pb-0.5">
              ORDER SUMMARY
            </div>

            {/* Barcode Container */}
            <div className="flex justify-center items-center bg-white border border-gray-200 rounded py-1 my-0.5 min-h-[35px]">
              <svg ref={previewBarcodeRef} className="max-w-full h-8"></svg>
            </div>

            <div className="text-center font-mono text-[9px] font-semibold text-gray-700 py-0.5">
              {orderNumber}
            </div>
            <div className="space-y-0.5 text-[8px] border-t border-dashed border-gray-400 pt-1 mt-0.5">
              <div className="flex justify-between">
                <span className="text-gray-500">Customer:</span>
                <span className="font-semibold text-gray-800 truncate max-w-[100px]">{customerName || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Items:</span>
                <span className="font-semibold text-gray-800">{totalItems} pcs</span>
              </div>
              {formattedDueDate && (
                <div className={`flex justify-between ${isExpressOrder ? 'bg-gray-100 px-0.5 rounded' : ''}`}>
                  <span className="text-gray-500">{isExpressOrder ? '⚡ Due:' : 'Due Date:'}</span>
                  <span className={`font-semibold ${isExpressOrder ? 'text-orange-600' : 'text-emerald-600'}`}>
                    {formattedDueDate}
                  </span>
                </div>
              )}
            </div>
            <div className="flex justify-between text-[6px] text-gray-400 pt-0.5 border-t border-dashed border-gray-400 mt-0.5">
              <span>{storeCode}</span>
              <span>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full flex items-center gap-2 px-2">
            <div className="flex-1 border-t border-dashed border-gray-500"></div>
            <span className="text-[8px] text-gray-400 font-medium">Service Tags (4×3 cm)</span>
            <div className="flex-1 border-t border-dashed border-gray-500"></div>
          </div>

          {/* Service Tags - Compact 4x3cm preview with overflow hidden */}
          {allTags.map(({ item, globalIndex }) => (
            <div
              key={`preview-${globalIndex}`}
              className={`w-[40mm] h-[30mm] bg-white border-2 border-dashed rounded p-1.5 font-mono text-[8px] shadow-sm flex flex-col overflow-hidden relative ${isExpressOrder ? 'border-orange-500' : 'border-gray-600'
                }`}
            >
              {/* EXPRESS Watermark for express orders */}
              {isExpressOrder && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                  <span className="text-orange-500 text-[14px] font-black opacity-10 rotate-[-25deg] tracking-widest">
                    EXPRESS
                  </span>
                </div>
              )}

              {/* Header Row - Order ID and Count */}
              <div className="flex justify-between items-center pb-0.5 border-b border-dashed border-gray-400 flex-shrink-0 relative z-10">
                <span className="text-[6px] text-gray-600 font-semibold truncate max-w-[60%]">{orderNumber}</span>
                <span className="text-[9px] font-black text-gray-900">{globalIndex}/{totalItems}</span>
              </div>

              {/* Customer Name */}
              <div className="text-center text-[8px] font-bold text-gray-800 uppercase tracking-wide py-1 flex-shrink-0 truncate relative z-10">
                {customerName || 'Customer'}
              </div>

              {/* Service Name */}
              <div className="text-center text-[9px] font-bold text-gray-900 uppercase flex-1 flex items-center justify-center overflow-hidden relative z-10">
                <span className="break-words line-clamp-2">{item.serviceName}</span>
              </div>

              {/* Note (if any) */}
              {item.tagNote && (
                <div className="text-[6px] text-gray-600 text-center pt-0.5 border-t border-dashed border-gray-400 flex-shrink-0 truncate relative z-10">
                  Note: {item.tagNote}
                </div>
              )}
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
