import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: { finalY: number };
}

type OverviewReport = {
  meta: {
    generatedAt: string;
    startDate: string;
    endDate: string;
    days: number;
    scopedStore: string | null;
  };
  summary: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalEmployees: number;
    averageOrderValue: number;
    completedOrders: number;
    pendingOrders: number;
    creditOutstanding: number;
    walletBalance: number;
    revenueDelta: number;
    ordersDelta: number;
    customersDelta: number;
    completionRate: number;
  };
  insights: Array<{
    id: string;
    severity: string;
    title: string;
    summary: string;
    action: string;
  }>;
  franchisePerformance: Array<any>;
  employeePerformance: Array<any>;
  dailySummary: Array<any>;
  topServices: Array<any>;
  topCustomers: Array<any>;
  pnl: {
    revenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    expenseByCategory: Record<string, number>;
    expenses: Array<any>;
  };
};

const BRAND = {
  name: 'Fab Clean',
  subline: 'Operational Reporting Suite',
  primary: [18, 28, 49] as [number, number, number],
  secondary: [79, 140, 255] as [number, number, number],
  accent: [194, 212, 78] as [number, number, number],
  slate: [89, 100, 121] as [number, number, number],
  muted: [226, 232, 240] as [number, number, number],
  paper: [248, 250, 252] as [number, number, number],
};

const formatCurrency = (amount: number) => {
  const value = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
  return `Rs. ${value}`;
};

const formatNumber = (value: number) => new Intl.NumberFormat('en-IN').format(Number(value || 0));

function createDocument(title: string, subtitle: string, orientation: 'p' | 'l' = 'p') {
  const doc = new jsPDF(orientation, 'mm', 'a4') as jsPDFWithAutoTable;
  const width = doc.internal.pageSize.width;

  doc.setFillColor(...BRAND.primary);
  doc.rect(0, 0, width, 26, 'F');
  doc.setFillColor(...BRAND.secondary);
  doc.rect(0, 26, width, 6, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(21);
  doc.text(BRAND.name, 16, 16);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(BRAND.subline, 16, 22);

  doc.setFontSize(10);
  doc.text(`Generated ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, width - 16, 16, { align: 'right' });

  doc.setTextColor(...BRAND.primary);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(title, 16, 45);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...BRAND.slate);
  doc.text(subtitle, 16, 52);

  return doc;
}

function addMetricStrip(doc: jsPDFWithAutoTable, metrics: Array<{ label: string; value: string }>, startY: number) {
  const pageWidth = doc.internal.pageSize.width;
  const gutter = 6;
  const usableWidth = pageWidth - 32;
  const cardWidth = (usableWidth - gutter * (metrics.length - 1)) / metrics.length;

  metrics.forEach((metric, index) => {
    const x = 16 + index * (cardWidth + gutter);
    doc.setFillColor(...BRAND.paper);
    doc.roundedRect(x, startY, cardWidth, 22, 4, 4, 'F');
    doc.setDrawColor(...BRAND.muted);
    doc.roundedRect(x, startY, cardWidth, 22, 4, 4);
    doc.setTextColor(...BRAND.slate);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(metric.label.toUpperCase(), x + 4, startY + 7);
    doc.setTextColor(...BRAND.primary);
    doc.setFontSize(14);
    doc.text(metric.value, x + 4, startY + 16);
  });
}

function addSectionTitle(doc: jsPDFWithAutoTable, title: string, startY: number) {
  doc.setDrawColor(...BRAND.secondary);
  doc.setLineWidth(0.8);
  doc.line(16, startY, 42, startY);
  doc.setTextColor(...BRAND.primary);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(title, 16, startY + 7);
  return startY + 12;
}

function ensurePage(doc: jsPDFWithAutoTable, currentY: number, minRemaining = 40) {
  const pageHeight = doc.internal.pageSize.height;
  if (currentY < pageHeight - minRemaining) return currentY;
  doc.addPage();
  return 20;
}

function addFooter(doc: jsPDFWithAutoTable) {
  const pageCount = doc.getNumberOfPages();
  for (let index = 1; index <= pageCount; index += 1) {
    doc.setPage(index);
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    doc.setDrawColor(...BRAND.muted);
    doc.line(16, pageHeight - 14, pageWidth - 16, pageHeight - 14);
    doc.setFontSize(8);
    doc.setTextColor(...BRAND.slate);
    doc.text(`Fab Clean Internal Report • Page ${index} of ${pageCount}`, 16, pageHeight - 8);
    doc.text('Confidential operational use only', pageWidth - 16, pageHeight - 8, { align: 'right' });
  }
}

function addInsightList(doc: jsPDFWithAutoTable, insights: OverviewReport['insights'], startY: number) {
  let y = startY;
  insights.forEach((signal, index) => {
    y = ensurePage(doc, y, 28);
    doc.setFillColor(...BRAND.paper);
    doc.roundedRect(16, y, doc.internal.pageSize.width - 32, 18, 4, 4, 'F');
    doc.setDrawColor(...BRAND.muted);
    doc.roundedRect(16, y, doc.internal.pageSize.width - 32, 18, 4, 4);
    doc.setTextColor(...BRAND.primary);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`${index + 1}. ${signal.title}`, 20, y + 7);
    doc.setTextColor(...BRAND.slate);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(signal.summary.replace(/Rs. /g, 'Rs. '), 20, y + 12, { maxWidth: doc.internal.pageSize.width - 44 });
    y += 22;
  });
  return y;
}

function savePdf(doc: jsPDFWithAutoTable, filename: string) {
  addFooter(doc);
  doc.save(filename);
}

export function generateExecutiveOverviewReport(overview: OverviewReport) {
  const doc = createDocument(
    'Executive Overview',
    `${overview.meta.startDate} to ${overview.meta.endDate}${overview.meta.scopedStore ? ` • ${overview.meta.scopedStore}` : ''}`
  );

  addMetricStrip(doc, [
    { label: 'Revenue', value: formatCurrency(overview.summary.totalRevenue) },
    { label: 'Orders', value: formatNumber(overview.summary.totalOrders) },
    { label: 'Customers', value: formatNumber(overview.summary.totalCustomers) },
    { label: 'Avg Ticket', value: formatCurrency(overview.summary.averageOrderValue) },
  ], 62);

  let y = addSectionTitle(doc, 'AI Signals', 94);
  y = addInsightList(doc, overview.insights, y);

  y = ensurePage(doc, y + 4, 80);
  y = addSectionTitle(doc, 'Store Leaders', y + 4);
  autoTable(doc, {
    startY: y,
    head: [['Store', 'Orders', 'Revenue', 'Avg Ticket', 'Pending', 'Top Service']],
    body: overview.franchisePerformance.slice(0, 8).map((row) => [
      row.storeName,
      formatNumber(row.totalOrders),
      formatCurrency(row.totalRevenue),
      formatCurrency(row.avgOrderValue),
      formatNumber(row.pendingOrders),
      row.topService,
    ]),
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: BRAND.primary, textColor: 255 },
    alternateRowStyles: { fillColor: BRAND.paper },
    margin: { left: 16, right: 16 },
  });

  y = doc.lastAutoTable.finalY + 10;
  y = ensurePage(doc, y, 80);
  y = addSectionTitle(doc, 'Customer Value Leaders', y);
  autoTable(doc, {
    startY: y,
    head: [['Customer', 'Orders', 'Revenue', 'Credit', 'Top Services']],
    body: overview.topCustomers.slice(0, 8).map((row) => [
      row.customerName,
      formatNumber(row.orders),
      formatCurrency(row.revenue),
      formatCurrency(row.creditBalance),
      row.topServices.join(', '),
    ]),
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: BRAND.secondary, textColor: 255 },
    alternateRowStyles: { fillColor: BRAND.paper },
    margin: { left: 16, right: 16 },
  });

  savePdf(doc, `FabClean_Executive_Overview_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

export function generateOperationsReport(overview: OverviewReport) {
  const doc = createDocument('Operations Report', `Operational throughput for ${overview.meta.days} days`, 'l');

  addMetricStrip(doc, [
    { label: 'Orders', value: formatNumber(overview.summary.totalOrders) },
    { label: 'Completed', value: formatNumber(overview.summary.completedOrders) },
    { label: 'Pending', value: formatNumber(overview.summary.pendingOrders) },
    { label: 'Completion Rate', value: `${overview.summary.completionRate.toFixed(1)}%` },
  ], 62);

  let y = addSectionTitle(doc, 'Daily Throughput', 94);
  autoTable(doc, {
    startY: y,
    head: [['Date', 'Orders', 'Completed', 'Revenue', 'Avg Ticket']],
    body: overview.dailySummary.slice(-20).map((row) => [
      row.date,
      formatNumber(row.totalOrders),
      formatNumber(row.completedOrders),
      formatCurrency(row.totalRevenue),
      formatCurrency(row.averageOrderValue),
    ]),
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2.8 },
    headStyles: { fillColor: BRAND.primary, textColor: 255 },
    alternateRowStyles: { fillColor: BRAND.paper },
    margin: { left: 16, right: 16 },
  });

  y = doc.lastAutoTable.finalY + 10;
  y = ensurePage(doc, y, 90);
  y = addSectionTitle(doc, 'Service Mix', y);
  autoTable(doc, {
    startY: y,
    head: [['Service', 'Pieces', 'Orders', 'Customers', 'Revenue', 'Avg Ticket', 'Lead Store']],
    body: overview.topServices.slice(0, 12).map((row) => [
      row.name,
      formatNumber(row.itemCount),
      formatNumber(row.orderCount),
      formatNumber(row.customersCount),
      formatCurrency(row.revenue),
      formatCurrency(row.avgTicket),
      row.topStore,
    ]),
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2.8 },
    headStyles: { fillColor: BRAND.secondary, textColor: 255 },
    alternateRowStyles: { fillColor: BRAND.paper },
    margin: { left: 16, right: 16 },
  });

  savePdf(doc, `FabClean_Operations_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

export function generateStorePerformanceReport(overview: OverviewReport) {
  const doc = createDocument('Store Performance Report', 'Store comparison by revenue, customers, backlog, and credit');

  addMetricStrip(doc, [
    { label: 'Stores', value: formatNumber(overview.franchisePerformance.length) },
    { label: 'Revenue', value: formatCurrency(overview.summary.totalRevenue) },
    { label: 'Customers', value: formatNumber(overview.summary.totalCustomers) },
    { label: 'Credit Due', value: formatCurrency(overview.summary.creditOutstanding) },
  ], 62);

  const y = addSectionTitle(doc, 'Store Table', 94);
  autoTable(doc, {
    startY: y,
    head: [['Code', 'Store', 'Orders', 'Revenue', 'Customers', 'Pending', 'Credit', 'Top Service']],
    body: overview.franchisePerformance.map((row) => [
      row.franchiseCode,
      row.storeName,
      formatNumber(row.totalOrders),
      formatCurrency(row.totalRevenue),
      formatNumber(row.totalCustomers),
      formatNumber(row.pendingOrders),
      formatCurrency(row.creditOutstanding),
      row.topService,
    ]),
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: BRAND.primary, textColor: 255 },
    alternateRowStyles: { fillColor: BRAND.paper },
    margin: { left: 16, right: 16 },
  });

  savePdf(doc, `FabClean_Store_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

export function generateFinanceReport(overview: OverviewReport) {
  const doc = createDocument('Finance Report', 'Revenue, expenses, credit, and margin review');

  addMetricStrip(doc, [
    { label: 'Revenue', value: formatCurrency(overview.pnl.revenue) },
    { label: 'Expenses', value: formatCurrency(overview.pnl.totalExpenses) },
    { label: 'Net Profit', value: formatCurrency(overview.pnl.netProfit) },
    { label: 'Margin', value: `${overview.pnl.profitMargin.toFixed(1)}%` },
  ], 62);

  let y = addSectionTitle(doc, 'Expense Categories', 94);
  autoTable(doc, {
    startY: y,
    head: [['Category', 'Amount']],
    body: Object.entries(overview.pnl.expenseByCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => [category.replace(/_/g, ' '), formatCurrency(amount)]),
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: BRAND.secondary, textColor: 255 },
    alternateRowStyles: { fillColor: BRAND.paper },
    margin: { left: 16, right: 16 },
  });

  y = doc.lastAutoTable.finalY + 10;
  y = ensurePage(doc, y, 80);
  y = addSectionTitle(doc, 'Recent Expense Entries', y);
  autoTable(doc, {
    startY: y,
    head: [['Date', 'Category', 'Store', 'Amount', 'Note']],
    body: overview.pnl.expenses.slice(0, 14).map((row) => [
      row.incurred_at ? format(new Date(row.incurred_at), 'dd MMM yyyy') : '-',
      row.category,
      row.store_code || '-',
      formatCurrency(row.amount),
      row.note || '-',
    ]),
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 3 },
    headStyles: { fillColor: BRAND.primary, textColor: 255 },
    alternateRowStyles: { fillColor: BRAND.paper },
    margin: { left: 16, right: 16 },
  });

  savePdf(doc, `FabClean_Finance_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
