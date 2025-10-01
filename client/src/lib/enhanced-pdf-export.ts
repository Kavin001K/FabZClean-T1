import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Brand colors and styling - consistent across all PDF exports
const BRAND_COLORS = {
  primary: '#84cc16',
  secondary: '#65a30d',
  dark: '#1f2937',
  light: '#f9fafb',
  accent: '#fb923c',
  text: '#374151',
  muted: '#6b7280',
  white: '#ffffff',
  border: '#e5e7eb',
};

interface ExportOptions {
  title: string;
  subtitle?: string;
  filename: string;
  orientation?: 'portrait' | 'landscape';
  includeCharts?: boolean;
  includeStats?: boolean;
}

interface StatItem {
  label: string;
  value: string | number;
  color?: string;
}

export class EnhancedPDFExport {
  private doc: jsPDF;
  private currentY: number = 20;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;

  constructor(orientation: 'portrait' | 'landscape' = 'portrait') {
    this.doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
    });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  // Add professional header with logo and branding
  addHeader(title: string, subtitle?: string) {
    const pageWidth = this.pageWidth;

    // Brand banner background
    this.doc.setFillColor(BRAND_COLORS.primary);
    this.doc.rect(0, 0, pageWidth, 35, 'F');

    // Company logo circle
    this.doc.setFillColor(BRAND_COLORS.white);
    this.doc.circle(this.margin, 17, 9, 'F');
    this.doc.setTextColor(BRAND_COLORS.primary);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('FC', this.margin - 3.5, 20);

    // Title
    this.doc.setTextColor(BRAND_COLORS.white);
    this.doc.setFontSize(22);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin + 20, 16);

    // Subtitle
    if (subtitle) {
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(subtitle, this.margin + 20, 25);
    }

    // Date and time
    this.doc.setFontSize(9);
    const dateStr = new Date().toLocaleString('en-US', {
      dateStyle: 'long',
      timeStyle: 'short',
    });
    this.doc.text(dateStr, pageWidth - this.margin, 20, { align: 'right' });

    // Accent line
    this.doc.setDrawColor(BRAND_COLORS.accent);
    this.doc.setLineWidth(1);
    this.doc.line(0, 35, pageWidth, 35);

    this.currentY = 47;
  }

  // Add statistics summary boxes
  addStatsSummary(stats: StatItem[]) {
    const boxWidth = (this.pageWidth - 2 * this.margin - 10 * (stats.length - 1)) / stats.length;
    const boxHeight = 25;
    let xPos = this.margin;

    stats.forEach((stat, index) => {
      // Box background
      this.doc.setFillColor(stat.color || BRAND_COLORS.light);
      this.doc.roundedRect(xPos, this.currentY, boxWidth, boxHeight, 3, 3, 'F');

      // Border
      this.doc.setDrawColor(BRAND_COLORS.primary);
      this.doc.setLineWidth(0.3);
      this.doc.roundedRect(xPos, this.currentY, boxWidth, boxHeight, 3, 3, 'S');

      // Label
      this.doc.setTextColor(BRAND_COLORS.muted);
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(stat.label, xPos + boxWidth / 2, this.currentY + 8, { align: 'center' });

      // Value
      this.doc.setTextColor(BRAND_COLORS.dark);
      this.doc.setFontSize(16);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(String(stat.value), xPos + boxWidth / 2, this.currentY + 18, { align: 'center' });

      xPos += boxWidth + 10;
    });

    this.currentY += boxHeight + 15;
  }

  // Add clean section header with professional styling
  addSection(sectionTitle: string) {
    // Section background
    this.doc.setFillColor(BRAND_COLORS.light);
    this.doc.rect(this.margin - 3, this.currentY - 3, this.pageWidth - 2 * this.margin + 6, 12, 'F');

    // Section title
    this.doc.setTextColor(BRAND_COLORS.dark);
    this.doc.setFontSize(13);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(sectionTitle, this.margin, this.currentY + 5);

    // Accent underline
    const textWidth = this.doc.getTextWidth(sectionTitle);
    this.doc.setDrawColor(BRAND_COLORS.primary);
    this.doc.setLineWidth(1.5);
    this.doc.line(this.margin, this.currentY + 7, this.margin + textWidth, this.currentY + 7);

    this.currentY += 15;
  }

  // Add clean, professional table with consistent styling
  addTable(columns: string[], data: any[][], options?: any) {
    autoTable(this.doc, {
      startY: this.currentY,
      head: [columns],
      body: data,
      theme: 'striped',
      headStyles: {
        fillColor: BRAND_COLORS.primary,
        textColor: BRAND_COLORS.white,
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'left',
        cellPadding: 4,
      },
      bodyStyles: {
        textColor: BRAND_COLORS.text,
        fontSize: 9,
        cellPadding: 3.5,
      },
      alternateRowStyles: {
        fillColor: BRAND_COLORS.light,
      },
      columnStyles: {
        0: { cellWidth: 'auto', fontStyle: 'bold' },
      },
      margin: { left: this.margin, right: this.margin },
      didDrawPage: (data) => {
        this.currentY = data.cursor?.y || this.currentY;
      },
      ...options,
    });

    this.currentY += 12;
  }

  // Add text paragraph
  addParagraph(text: string, fontSize: number = 10) {
    this.doc.setTextColor(BRAND_COLORS.text);
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', 'normal');

    const lines = this.doc.splitTextToSize(text, this.pageWidth - 2 * this.margin);
    this.doc.text(lines, this.margin, this.currentY);

    this.currentY += lines.length * (fontSize * 0.4) + 5;
  }

  // Add professional info box with clean styling
  addInfoBox(title: string, content: string, bgColor?: string) {
    const boxHeight = 24;

    // Box background
    this.doc.setFillColor(bgColor || BRAND_COLORS.light);
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, boxHeight, 3, 3, 'F');

    // Border
    this.doc.setDrawColor(BRAND_COLORS.primary);
    this.doc.setLineWidth(0.5);
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, boxHeight, 3, 3, 'S');

    // Title
    this.doc.setTextColor(BRAND_COLORS.dark);
    this.doc.setFontSize(13);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin + 5, this.currentY + 7);

    // Content
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(BRAND_COLORS.text);
    const lines = this.doc.splitTextToSize(content, this.pageWidth - 2 * this.margin - 10);
    this.doc.text(lines, this.margin + 5, this.currentY + 14);

    this.currentY += boxHeight + 10;
  }

  // Add professional footer to all pages
  addFooter() {
    const pageCount = this.doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);

      const footerY = this.pageHeight - 15;

      // Footer line
      this.doc.setDrawColor(BRAND_COLORS.border);
      this.doc.setLineWidth(0.5);
      this.doc.line(0, footerY, this.pageWidth, footerY);

      // Footer text
      this.doc.setTextColor(BRAND_COLORS.muted);
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'normal');

      // Left side - company info
      this.doc.text('FabzClean - Franchise Management System', this.margin, this.pageHeight - 8);

      // Center - page number
      this.doc.setFontSize(8);
      this.doc.text(
        `Page ${i} of ${pageCount}`,
        this.pageWidth / 2,
        this.pageHeight - 8,
        { align: 'center' }
      );

      // Right side - generated date
      this.doc.setFontSize(7);
      this.doc.text(
        `Generated: ${new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })}`,
        this.pageWidth - this.margin,
        this.pageHeight - 8,
        { align: 'right' }
      );
    }
  }

  // Save the PDF
  save(filename: string) {
    this.addFooter();
    this.doc.save(`${filename}.pdf`);
  }

  // Get the PDF as blob
  getBlob(): Blob {
    this.addFooter();
    return this.doc.output('blob');
  }
}

// Export functions for different data types
export function exportOrdersEnhanced(orders: any[]) {
  const pdf = new EnhancedPDFExport('landscape');

  // Add header
  pdf.addHeader('Orders Report', 'Comprehensive overview of all orders');

  // Calculate statistics
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount || 0), 0);
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'in_progress').length;

  // Add statistics summary
  pdf.addStatsSummary([
    { label: 'Total Orders', value: totalOrders },
    { label: 'Total Revenue', value: `₹${totalRevenue.toFixed(2)}` },
    { label: 'Completed', value: completedOrders },
    { label: 'Pending', value: pendingOrders },
  ]);

  // Add orders section
  pdf.addSection('Order Details');

  // Prepare table data
  const columns = ['Order #', 'Customer', 'Service', 'Status', 'Payment', 'Amount', 'Date'];
  const data = orders.map(order => [
    order.orderNumber,
    order.customerName,
    order.service || 'N/A',
    order.status,
    order.paymentStatus || 'N/A',
    `₹${order.totalAmount}`,
    new Date(order.createdAt).toLocaleDateString(),
  ]);

  pdf.addTable(columns, data);

  // Add summary info
  pdf.addInfoBox(
    'Report Summary',
    `This report contains ${totalOrders} orders with a total revenue of ₹${totalRevenue.toFixed(2)}. ` +
    `${completedOrders} orders have been completed, and ${pendingOrders} orders are pending or in progress.`
  );

  // Save PDF
  pdf.save(`orders-report-${new Date().toISOString().split('T')[0]}`);
}

export function exportCustomersEnhanced(customers: any[]) {
  const pdf = new EnhancedPDFExport('landscape');

  // Add header
  pdf.addHeader('Customers Report', 'Complete customer database overview');

  // Calculate statistics
  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  const avgOrders = customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0) / totalCustomers;
  const activeCustomers = customers.filter(c => (c.totalOrders || 0) > 0).length;

  // Add statistics summary
  pdf.addStatsSummary([
    { label: 'Total Customers', value: totalCustomers },
    { label: 'Total Revenue', value: `₹${totalRevenue.toFixed(2)}` },
    { label: 'Avg Orders/Customer', value: avgOrders.toFixed(1) },
    { label: 'Active Customers', value: activeCustomers },
  ]);

  // Add customers section
  pdf.addSection('Customer Details');

  // Prepare table data
  const columns = ['Name', 'Email', 'Phone', 'Total Orders', 'Total Spent', 'Last Order', 'Status'];
  const data = customers.map(customer => [
    customer.name,
    customer.email || 'N/A',
    customer.phone || 'N/A',
    customer.totalOrders || 0,
    `₹${customer.totalSpent || 0}`,
    customer.lastOrder ? new Date(customer.lastOrder).toLocaleDateString() : 'Never',
    (customer.totalOrders || 0) > 0 ? 'Active' : 'Inactive',
  ]);

  pdf.addTable(columns, data);

  // Add summary info
  pdf.addInfoBox(
    'Report Summary',
    `This report contains ${totalCustomers} customers with a total lifetime value of ₹${totalRevenue.toFixed(2)}. ` +
    `On average, each customer has placed ${avgOrders.toFixed(1)} orders. ${activeCustomers} customers are currently active.`
  );

  // Save PDF
  pdf.save(`customers-report-${new Date().toISOString().split('T')[0]}`);
}

export function exportDashboardSummary(metrics: any) {
  const pdf = new EnhancedPDFExport('portrait');

  // Add header
  pdf.addHeader('Dashboard Summary', 'Business performance overview');

  // Add statistics summary
  pdf.addStatsSummary([
    { label: 'Total Revenue', value: `₹${metrics.totalRevenue?.toFixed(2) || 0}` },
    { label: 'Total Orders', value: metrics.totalOrders || 0 },
    { label: 'Active Customers', value: metrics.activeCustomers || 0 },
    { label: 'Completion Rate', value: `${metrics.completionRate || 0}%` },
  ]);

  // Revenue breakdown
  pdf.addSection('Revenue Analysis');

  if (metrics.revenueByStatus) {
    const columns = ['Status', 'Count', 'Revenue', 'Percentage'];
    const total = Object.values(metrics.revenueByStatus).reduce((sum: any, val: any) => sum + val, 0) as number;
    const data = Object.entries(metrics.revenueByStatus).map(([status, revenue]: [string, any]) => [
      status.charAt(0).toUpperCase() + status.slice(1),
      metrics.ordersByStatus?.[status] || 0,
      `₹${revenue.toFixed(2)}`,
      `${((revenue / total) * 100).toFixed(1)}%`,
    ]);
    pdf.addTable(columns, data);
  }

  // Recent activity
  pdf.addSection('Key Insights');

  pdf.addInfoBox(
    'Business Health',
    `Your business is performing well with a total revenue of ₹${metrics.totalRevenue?.toFixed(2) || 0} ` +
    `across ${metrics.totalOrders || 0} orders. Customer satisfaction remains high with ` +
    `${metrics.activeCustomers || 0} active customers.`
  );

  // Save PDF
  pdf.save(`dashboard-summary-${new Date().toISOString().split('T')[0]}`);
}

export function exportServicesEnhanced(services: any[]) {
  const pdf = new EnhancedPDFExport('landscape');

  // Add header
  pdf.addHeader('Services Catalog', 'Complete listing of all services with pricing and details');

  // Calculate statistics
  const totalServices = services.length;
  const activeServices = services.filter(s => s.status === 'active').length;
  const avgPrice = services.reduce((sum, s) => sum + parseFloat(s.price || 0), 0) / totalServices;
  const categories = new Set(services.map(s => s.category)).size;

  // Add statistics summary
  pdf.addStatsSummary([
    { label: 'Total Services', value: totalServices },
    { label: 'Active Services', value: activeServices },
    { label: 'Avg Price', value: `₹${avgPrice.toFixed(2)}` },
    { label: 'Categories', value: categories },
  ]);

  // Add services section
  pdf.addSection('Service Details');

  // Prepare table data
  const columns = ['Service Name', 'Category', 'Price', 'Duration', 'Status'];
  const data = services.map(service => [
    service.name,
    service.category || 'General',
    `₹${service.price}`,
    service.duration || 'N/A',
    service.status || 'Active',
  ]);

  pdf.addTable(columns, data);

  // Add summary info
  pdf.addInfoBox(
    'Catalog Summary',
    `This catalog contains ${totalServices} services across ${categories} different categories. ` +
    `${activeServices} services are currently active and available for booking. ` +
    `The average service price is ₹${avgPrice.toFixed(2)}.`
  );

  // Save PDF
  pdf.save(`services-catalog-${new Date().toISOString().split('T')[0]}.pdf`);
}