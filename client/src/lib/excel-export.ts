import * as XLSX from 'xlsx';

interface ExportToExcelOptions {
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
}: ExportToExcelOptions) {
  const ws = XLSX.utils.json_to_sheet(data, { header });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}
