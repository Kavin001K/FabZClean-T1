// Comprehensive Excel Export Service using xlsx library
import * as XLSX from 'xlsx';
import { formatCurrency, formatDate } from './data-service';

// Types
export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
  format?: 'text' | 'number' | 'currency' | 'date' | 'percentage';
  align?: 'left' | 'center' | 'right';
}

export interface ExcelSheet {
  name: string;
  data: any[];
  columns: ExcelColumn[];
  summary?: { label: string; value: any; format?: string }[];
}

export interface ExcelExportOptions {
  filename: string;
  sheets: ExcelSheet[];
  companyName?: string;
  title?: string;
  filterInfo?: string;
}

// Color definitions
const COLORS = {
  headerBg: 'FF1E40AF', // Blue
  headerText: 'FFFFFFFF', // White
  summaryBg: 'FFF3F4F6', // Gray
  summaryLabel: 'FF374151', // Dark Gray
};

// Utility Functions
function formatCellValue(value: any, format?: string): any {
  if (value === null || value === undefined) return '';

  switch (format) {
    case 'currency':
      return typeof value === 'number' ? value : parseFloat(value) || 0;
    case 'date':
      if (value instanceof Date) return value;
      return new Date(value);
    case 'percentage':
      return typeof value === 'number' ? value / 100 : parseFloat(value) / 100 || 0;
    case 'number':
      return typeof value === 'number' ? value : parseFloat(value) || 0;
    default:
      return value;
  }
}

function createStyledCell(value: any, style?: any): any {
  return {
    v: value,
    t: typeof value === 'number' ? 'n' : 's',
    s: style
  };
}

function getColumnWidth(column: ExcelColumn, data: any[]): number {
  if (column.width) return column.width;

  const headerLength = column.header.length;
  const maxDataLength = Math.max(
    ...data.map(row => {
      const val = row[column.key];
      return val ? String(val).length : 0;
    })
  );

  return Math.min(Math.max(headerLength, maxDataLength) + 2, 50);
}

function setCellFormat(ws: XLSX.WorkSheet, cellRef: string, format: string) {
  if (!ws[cellRef]) return;

  switch (format) {
    case 'currency':
      ws[cellRef].z = '₹#,##0.00';
      break;
    case 'date':
      ws[cellRef].z = 'dd/mm/yyyy';
      break;
    case 'percentage':
      ws[cellRef].z = '0.00%';
      break;
    case 'number':
      ws[cellRef].z = '#,##0';
      break;
  }
}

// Main Export Function
export function exportToExcelAdvanced(options: ExcelExportOptions): void {
  const wb = XLSX.utils.book_new();

  options.sheets.forEach(sheet => {
    // Prepare data
    const wsData: any[][] = [];

    // Add company name if provided
    if (options.companyName) {
      wsData.push([options.companyName]);
      wsData.push([]);
    }

    // Add title if provided
    if (options.title) {
      wsData.push([options.title]);
      wsData.push([]);
    }

    // Add filter info if provided
    if (options.filterInfo) {
      wsData.push(['Filters Applied:', options.filterInfo]);
      wsData.push([]);
    }

    // Add headers
    const headers = sheet.columns.map(col => col.header);
    wsData.push(headers);

    // Add data rows
    sheet.data.forEach(row => {
      const rowData = sheet.columns.map(col => {
        const value = row[col.key];
        return formatCellValue(value, col.format);
      });
      wsData.push(rowData);
    });

    // Add summary if provided
    if (sheet.summary && sheet.summary.length > 0) {
      wsData.push([]);
      wsData.push(['Summary']);
      sheet.summary.forEach(item => {
        wsData.push([item.label, formatCellValue(item.value, item.format)]);
      });
    }

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Calculate header row index
    let headerRowIndex = 0;
    if (options.companyName) headerRowIndex += 2;
    if (options.title) headerRowIndex += 2;
    if (options.filterInfo) headerRowIndex += 2;

    // Apply header styling
    headers.forEach((header, colIndex) => {
      const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c: colIndex });
      if (!ws[cellRef]) return;

      ws[cellRef].s = {
        font: { bold: true, color: { rgb: COLORS.headerText } },
        fill: { fgColor: { rgb: COLORS.headerBg } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } },
        }
      };
    });

    // Apply data formatting
    sheet.data.forEach((row, rowIndex) => {
      sheet.columns.forEach((col, colIndex) => {
        const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex + rowIndex + 1, c: colIndex });
        if (col.format) {
          setCellFormat(ws, cellRef, col.format);
        }

        // Apply alignment
        if (ws[cellRef] && col.align) {
          ws[cellRef].s = {
            ...ws[cellRef].s,
            alignment: { horizontal: col.align }
          };
        }
      });
    });

    // Set column widths
    ws['!cols'] = sheet.columns.map(col => ({
      wch: getColumnWidth(col, sheet.data)
    }));

    // Add auto-filter to header row
    const dataRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    ws['!autofilter'] = {
      ref: XLSX.utils.encode_range({
        s: { r: headerRowIndex, c: 0 },
        e: { r: headerRowIndex, c: headers.length - 1 }
      })
    };

    // Freeze header row
    ws['!freeze'] = { xSplit: 0, ySplit: headerRowIndex + 1 };

    // Add sheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  });

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${options.filename}_${timestamp}.xlsx`;

  // Write file
  XLSX.writeFile(wb, filename);
}

// Simplified single-sheet export
export function exportSingleSheet(
  data: any[],
  columns: ExcelColumn[],
  filename: string,
  options?: {
    sheetName?: string;
    companyName?: string;
    title?: string;
    filterInfo?: string;
    summary?: { label: string; value: any; format?: string }[];
  }
): void {
  exportToExcelAdvanced({
    filename,
    sheets: [{
      name: options?.sheetName || 'Sheet1',
      data,
      columns,
      summary: options?.summary
    }],
    companyName: options?.companyName,
    title: options?.title,
    filterInfo: options?.filterInfo
  });
}

// Helper function to create columns from object keys
export function createColumnsFromData(
  sampleData: any,
  columnConfig?: Partial<Record<string, Partial<ExcelColumn>>>
): ExcelColumn[] {
  return Object.keys(sampleData).map(key => ({
    header: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
    key,
    width: 15,
    format: 'text',
    align: 'left',
    ...columnConfig?.[key]
  }));
}

// Simple export function for basic Excel exports
// This is a drop-in replacement for the basic exportToExcel function
export interface SimpleExportOptions {
  data: any[];
  fileName: string;
  sheetName?: string;
  header?: string[];
}

export function exportToExcel({
  data,
  fileName,
  sheetName = 'Sheet1',
  header,
}: SimpleExportOptions) {
  const ws = XLSX.utils.json_to_sheet(data, { header });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}
