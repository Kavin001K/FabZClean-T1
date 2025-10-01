import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

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

const PDF_CONFIG = {
  margin: 20,
  headerHeight: 35,
  footerHeight: 15,
  sectionSpacing: 12,
  boxPadding: 8,
  fontSize: {
    title: 22,
    subtitle: 11,
    heading: 13,
    body: 9,
    small: 8,
    tiny: 7,
  },
};

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  customerCount: number;
  revenueGrowth?: number;
  orderGrowth?: number;
  topServices?: Array<{ name: string; revenue: number; count: number }>;
  revenueByMonth?: Array<{ month: string; revenue: number }>;
  ordersByStatus?: Record<string, number>;
  dateRange?: string;
}

// Helper function to draw a professional header
function drawHeader(pdf: jsPDF, title: string, subtitle: string) {
  const pageWidth = pdf.internal.pageSize.getWidth();

  // Header background with gradient effect (using rectangles)
  pdf.setFillColor(BRAND_COLORS.primary);
  pdf.rect(0, 0, pageWidth, PDF_CONFIG.headerHeight, 'F');

  // Subtle accent line at bottom
  pdf.setDrawColor(BRAND_COLORS.secondary);
  pdf.setLineWidth(2);
  pdf.line(0, PDF_CONFIG.headerHeight, pageWidth, PDF_CONFIG.headerHeight);

  // Company logo circle
  pdf.setFillColor(BRAND_COLORS.white);
  pdf.circle(PDF_CONFIG.margin, 17, 9, 'F');
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(BRAND_COLORS.primary);
  pdf.text('FC', PDF_CONFIG.margin - 3.5, 20);

  // Title
  pdf.setTextColor(BRAND_COLORS.white);
  pdf.setFontSize(PDF_CONFIG.fontSize.title);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, PDF_CONFIG.margin + 16, 16);

  // Subtitle
  pdf.setFontSize(PDF_CONFIG.fontSize.subtitle);
  pdf.setFont('helvetica', 'normal');
  pdf.text(subtitle, PDF_CONFIG.margin + 16, 26);

  // Date and time on right
  pdf.setFontSize(PDF_CONFIG.fontSize.small);
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  pdf.text(dateStr, pageWidth - PDF_CONFIG.margin, 20, { align: 'right' });
}

// Helper function to draw section header
function drawSectionHeader(pdf: jsPDF, title: string, yPos: number): number {
  const pageWidth = pdf.internal.pageSize.getWidth();

  // Section background
  pdf.setFillColor(BRAND_COLORS.light);
  pdf.rect(PDF_CONFIG.margin - 3, yPos - 3, pageWidth - 2 * PDF_CONFIG.margin + 6, 12, 'F');

  // Section title
  pdf.setTextColor(BRAND_COLORS.dark);
  pdf.setFontSize(PDF_CONFIG.fontSize.heading);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, PDF_CONFIG.margin, yPos + 5);

  // Accent underline
  const textWidth = pdf.getTextWidth(title);
  pdf.setDrawColor(BRAND_COLORS.primary);
  pdf.setLineWidth(1.5);
  pdf.line(PDF_CONFIG.margin, yPos + 7, PDF_CONFIG.margin + textWidth, yPos + 7);

  return yPos + 15;
}

// Helper function to draw metric box
function drawMetricBox(
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  value: string,
  growth?: number,
  color?: string
) {
  const boxColor = color || BRAND_COLORS.primary;

  // Light background
  pdf.setFillColor(BRAND_COLORS.light);
  pdf.roundedRect(x, y, width, height, 3, 3, 'F');

  // Colored left border
  pdf.setFillColor(boxColor);
  pdf.rect(x, y + 3, 3, height - 6, 'F');

  // Border
  pdf.setDrawColor(BRAND_COLORS.border);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(x, y, width, height, 3, 3, 'S');

  // Label
  pdf.setTextColor(BRAND_COLORS.muted);
  pdf.setFontSize(PDF_CONFIG.fontSize.small);
  pdf.setFont('helvetica', 'normal');
  pdf.text(label, x + width / 2, y + 8, { align: 'center' });

  // Value
  pdf.setTextColor(BRAND_COLORS.dark);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(value, x + width / 2, y + 20, { align: 'center' });

  // Growth indicator
  if (growth !== undefined) {
    const growthColor = growth >= 0 ? '#10b981' : '#ef4444';
    const growthSymbol = growth >= 0 ? '▲' : '▼';
    pdf.setTextColor(growthColor);
    pdf.setFontSize(PDF_CONFIG.fontSize.small);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${growthSymbol} ${Math.abs(growth).toFixed(1)}%`, x + width / 2, y + height - 5, {
      align: 'center',
    });
  }
}

// Helper function to draw footer
function drawFooter(pdf: jsPDF, pageNum: number, totalPages: number) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const footerY = pageHeight - PDF_CONFIG.footerHeight;

  // Footer line
  pdf.setDrawColor(BRAND_COLORS.border);
  pdf.setLineWidth(0.5);
  pdf.line(0, footerY, pageWidth, footerY);

  pdf.setTextColor(BRAND_COLORS.muted);
  pdf.setFontSize(PDF_CONFIG.fontSize.tiny);
  pdf.setFont('helvetica', 'normal');

  // Left: Company name
  pdf.text('FabzClean - Franchise Management System', PDF_CONFIG.margin, footerY + 8);

  // Center: Page number
  pdf.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, footerY + 8, { align: 'center' });

  // Right: Generated date
  pdf.text(
    `Generated: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
    pageWidth - PDF_CONFIG.margin,
    footerY + 8,
    { align: 'right' }
  );
}

export async function exportAnalyticsDashboard(data: AnalyticsData) {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let currentY = PDF_CONFIG.headerHeight + PDF_CONFIG.sectionSpacing;

  // ============= HEADER =============
  drawHeader(
    pdf,
    'Analytics Dashboard Report',
    data.dateRange || 'Comprehensive Business Performance Analysis'
  );

  // ============= KEY METRICS SUMMARY =============
  currentY = drawSectionHeader(pdf, 'Key Performance Metrics', currentY);

  const metrics = [
    {
      label: 'Total Revenue',
      value: `₹${data.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
      growth: data.revenueGrowth,
      color: BRAND_COLORS.primary,
    },
    {
      label: 'Total Orders',
      value: data.totalOrders.toLocaleString(),
      growth: data.orderGrowth,
      color: BRAND_COLORS.accent,
    },
    {
      label: 'Avg Order Value',
      value: `₹${data.avgOrderValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
      color: '#3b82f6',
    },
    {
      label: 'Active Customers',
      value: data.customerCount.toLocaleString(),
      color: '#10b981',
    },
  ];

  const boxWidth = (pageWidth - 2 * PDF_CONFIG.margin - 30) / 4;
  const boxHeight = 28;
  let xPos = PDF_CONFIG.margin;

  metrics.forEach((metric) => {
    drawMetricBox(
      pdf,
      xPos,
      currentY,
      boxWidth,
      boxHeight,
      metric.label,
      metric.value,
      metric.growth,
      metric.color
    );
    xPos += boxWidth + 10;
  });

  currentY += boxHeight + PDF_CONFIG.sectionSpacing;

  // ============= SECTION: TOP SERVICES =============
  if (data.topServices && data.topServices.length > 0) {
    currentY = drawSectionHeader(pdf, 'Top Performing Services', currentY);

    const serviceColumns = ['Service Name', 'Total Orders', 'Revenue', '% of Total'];
    const safeTopServices = data.topServices || [];
    const totalServiceRevenue = safeTopServices.reduce((sum, s) => sum + (s?.revenue || 0), 0);
    const serviceData = safeTopServices.slice(0, 5).map((service) => [
      service?.name || 'Unknown',
      (service?.count || 0).toString(),
      `₹${(service?.revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
      totalServiceRevenue > 0 ? `${(((service?.revenue || 0) / totalServiceRevenue) * 100).toFixed(1)}%` : '0%',
    ]);

    autoTable(pdf, {
      startY: currentY,
      head: [serviceColumns],
      body: serviceData,
      theme: 'striped',
      headStyles: {
        fillColor: BRAND_COLORS.primary,
        textColor: BRAND_COLORS.white,
        fontSize: PDF_CONFIG.fontSize.body,
        fontStyle: 'bold',
        halign: 'left',
        cellPadding: 4,
      },
      bodyStyles: {
        textColor: BRAND_COLORS.text,
        fontSize: PDF_CONFIG.fontSize.body,
        cellPadding: 3.5,
      },
      alternateRowStyles: {
        fillColor: BRAND_COLORS.light,
      },
      columnStyles: {
        0: { cellWidth: 80, fontStyle: 'bold' },
        1: { halign: 'center', cellWidth: 30 },
        2: { halign: 'right', cellWidth: 40 },
        3: { halign: 'center', cellWidth: 30 },
      },
      margin: { left: PDF_CONFIG.margin, right: PDF_CONFIG.margin },
    });

    currentY = (pdf as any).lastAutoTable.finalY + PDF_CONFIG.sectionSpacing;
  }

  // ============= SECTION: REVENUE TREND =============
  if (data.revenueByMonth && data.revenueByMonth.length > 0) {
    currentY = drawSectionHeader(pdf, 'Revenue Trend', currentY);

    const trendColumns = ['Period', 'Revenue', 'Growth'];
    const safeRevenueByMonth = data.revenueByMonth || [];
    const trendData = safeRevenueByMonth.map((item, index) => {
      let growth = 'N/A';
      if (index > 0 && safeRevenueByMonth[index - 1]) {
        const prevRevenue = safeRevenueByMonth[index - 1]?.revenue || 1;
        const currentRevenue = item?.revenue || 0;
        const growthPercent = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;
        const symbol = growthPercent >= 0 ? '↑' : '↓';
        growth = `${symbol} ${Math.abs(growthPercent).toFixed(1)}%`;
      }
      return [
        item?.month || 'N/A',
        `₹${(item?.revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
        growth,
      ];
    });

    autoTable(pdf, {
      startY: currentY,
      head: [trendColumns],
      body: trendData,
      theme: 'striped',
      headStyles: {
        fillColor: BRAND_COLORS.accent,
        textColor: BRAND_COLORS.white,
        fontSize: PDF_CONFIG.fontSize.body,
        fontStyle: 'bold',
        halign: 'left',
        cellPadding: 4,
      },
      bodyStyles: {
        textColor: BRAND_COLORS.text,
        fontSize: PDF_CONFIG.fontSize.body,
        cellPadding: 3.5,
      },
      alternateRowStyles: {
        fillColor: BRAND_COLORS.light,
      },
      columnStyles: {
        0: { cellWidth: 60, fontStyle: 'bold' },
        1: { halign: 'right', cellWidth: 50 },
        2: { halign: 'center', cellWidth: 35 },
      },
      margin: { left: PDF_CONFIG.margin, right: PDF_CONFIG.margin },
    });

    currentY = (pdf as any).lastAutoTable.finalY + PDF_CONFIG.sectionSpacing;
  }

  // ============= SECTION: ORDER STATUS BREAKDOWN =============
  if (data.ordersByStatus) {
    // Check if we need a new page
    if (currentY > pageHeight - 80) {
      pdf.addPage();
      currentY = PDF_CONFIG.margin;
    }

    currentY = drawSectionHeader(pdf, 'Orders by Status', currentY);

    const statusColumns = ['Status', 'Count', 'Percentage'];
    const safeOrdersByStatus = data.ordersByStatus || {};
    const totalOrdersCount = Object.values(safeOrdersByStatus).reduce((sum, val) => sum + (val || 0), 0);
    const statusData = Object.entries(safeOrdersByStatus).map(([status, count]) => [
      (status || 'Unknown').charAt(0).toUpperCase() + (status || 'Unknown').slice(1).replace('_', ' '),
      (count || 0).toString(),
      totalOrdersCount > 0 ? `${(((count || 0) / totalOrdersCount) * 100).toFixed(1)}%` : '0%',
    ]);

    autoTable(pdf, {
      startY: currentY,
      head: [statusColumns],
      body: statusData,
      theme: 'striped',
      headStyles: {
        fillColor: '#3b82f6',
        textColor: BRAND_COLORS.white,
        fontSize: PDF_CONFIG.fontSize.body,
        fontStyle: 'bold',
        halign: 'left',
        cellPadding: 4,
      },
      bodyStyles: {
        textColor: BRAND_COLORS.text,
        fontSize: PDF_CONFIG.fontSize.body,
        cellPadding: 3.5,
      },
      alternateRowStyles: {
        fillColor: BRAND_COLORS.light,
      },
      columnStyles: {
        0: { cellWidth: 80, fontStyle: 'bold' },
        1: { halign: 'center', cellWidth: 35 },
        2: { halign: 'center', cellWidth: 35 },
      },
      margin: { left: PDF_CONFIG.margin, right: PDF_CONFIG.margin },
    });

    currentY = (pdf as any).lastAutoTable.finalY + PDF_CONFIG.sectionSpacing;
  }

  // ============= INFO BOX =============
  const infoBoxHeight = 24;
  if (currentY + infoBoxHeight > pageHeight - 30) {
    pdf.addPage();
    currentY = PDF_CONFIG.margin;
  }

  pdf.setFillColor(BRAND_COLORS.light);
  pdf.roundedRect(PDF_CONFIG.margin, currentY, pageWidth - 2 * PDF_CONFIG.margin, infoBoxHeight, 3, 3, 'F');

  pdf.setDrawColor(BRAND_COLORS.primary);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(PDF_CONFIG.margin, currentY, pageWidth - 2 * PDF_CONFIG.margin, infoBoxHeight, 3, 3, 'S');

  pdf.setTextColor(BRAND_COLORS.dark);
  pdf.setFontSize(PDF_CONFIG.fontSize.heading);
  pdf.setFont('helvetica', 'bold');
  pdf.text('📊 Report Summary', PDF_CONFIG.margin + 5, currentY + 7);

  pdf.setFontSize(PDF_CONFIG.fontSize.body);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(BRAND_COLORS.text);
  const summaryText = `This comprehensive analytics report shows strong business performance with ₹${data.totalRevenue.toLocaleString('en-IN')} in total revenue across ${data.totalOrders} orders. The average order value stands at ₹${data.avgOrderValue.toFixed(2)}, serving ${data.customerCount} active customers.`;
  const summaryLines = pdf.splitTextToSize(summaryText, pageWidth - 2 * PDF_CONFIG.margin - 10);
  pdf.text(summaryLines, PDF_CONFIG.margin + 5, currentY + 14);

  // ============= FOOTER =============
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    drawFooter(pdf, i, pageCount);
  }

  // Save PDF
  pdf.save(`analytics-report-${new Date().toISOString().split('T')[0]}.pdf`);
}

// Enhanced version with chart capture
export async function exportAnalyticsDashboardWithCharts(
  data: AnalyticsData,
  chartElementIds?: string[]
) {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let currentY = 20;

  // ============= HEADER (same as above) =============
  pdf.setFillColor(BRAND_COLORS.primary);
  pdf.rect(0, 0, pageWidth, 40, 'F');

  pdf.setFillColor(255, 255, 255);
  pdf.circle(margin, 18, 10, 'F');
  pdf.setTextColor(BRAND_COLORS.primary);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('FC', margin - 4, 21);

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Analytics Dashboard Report', margin + 18, 18);

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  const subtitle = data.dateRange || 'Comprehensive Business Performance Analysis with Visualizations';
  pdf.text(subtitle, margin + 18, 27);

  pdf.setFontSize(10);
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  pdf.text(dateStr, pageWidth - margin, 18, { align: 'right' });

  pdf.setDrawColor(BRAND_COLORS.accent);
  pdf.setLineWidth(1);
  pdf.line(0, 40, pageWidth, 40);

  currentY = 52;

  // Add metrics summary (same as above)
  const metrics = [
    {
      label: 'Total Revenue',
      value: `₹${data.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
      growth: data.revenueGrowth,
      color: BRAND_COLORS.primary,
    },
    {
      label: 'Total Orders',
      value: data.totalOrders.toLocaleString(),
      growth: data.orderGrowth,
      color: BRAND_COLORS.accent,
    },
    {
      label: 'Avg Order Value',
      value: `₹${data.avgOrderValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
      color: '#3b82f6',
    },
    {
      label: 'Active Customers',
      value: data.customerCount.toLocaleString(),
      color: '#10b981',
    },
  ];

  const boxWidth = (pageWidth - 2 * margin - 30) / 4;
  const boxHeight = 32;
  let xPos = margin;

  metrics.forEach((metric) => {
    // Box background (removed setGlobalAlpha as it's not supported in jsPDF)
    pdf.setFillColor(metric.color);
    pdf.roundedRect(xPos, currentY, boxWidth, boxHeight, 4, 4, 'F');

    pdf.setDrawColor(metric.color);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(xPos, currentY, boxWidth, boxHeight, 4, 4, 'S');

    pdf.setTextColor(BRAND_COLORS.muted);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(metric.label, xPos + boxWidth / 2, currentY + 10, { align: 'center' });

    pdf.setTextColor(BRAND_COLORS.dark);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(metric.value, xPos + boxWidth / 2, currentY + 22, { align: 'center' });

    if (metric.growth !== undefined) {
      const growthColor = metric.growth >= 0 ? '#10b981' : '#ef4444';
      const growthSymbol = metric.growth >= 0 ? '↑' : '↓';
      pdf.setTextColor(growthColor);
      pdf.setFontSize(8);
      pdf.text(`${growthSymbol} ${Math.abs(metric.growth).toFixed(1)}%`, xPos + boxWidth / 2, currentY + 28, {
        align: 'center',
      });
    }

    xPos += boxWidth + 10;
  });

  currentY += boxHeight + 20;

  // ============= CAPTURE AND ADD CHARTS =============
  if (chartElementIds && chartElementIds.length > 0) {
    for (const elementId of chartElementIds) {
      const element = document.getElementById(elementId);
      if (element) {
        try {
          // Check if we need a new page
          if (currentY > pageHeight - 100) {
            pdf.addPage();
            currentY = 20;
          }

          // Section header for chart
          pdf.setFillColor(BRAND_COLORS.light);
          pdf.rect(margin - 5, currentY - 5, pageWidth - 2 * margin + 10, 14, 'F');

          pdf.setTextColor(BRAND_COLORS.dark);
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          const chartTitle = element.getAttribute('data-chart-title') || 'Chart';
          pdf.text(chartTitle, margin, currentY + 5);

          pdf.setDrawColor(BRAND_COLORS.primary);
          pdf.setLineWidth(1);
          pdf.line(margin, currentY + 7, margin + 40, currentY + 7);

          currentY += 18;

          // Capture chart as image
          const canvas = await html2canvas(element, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false,
          });

          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pageWidth - 2 * margin;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          // Add image to PDF
          pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, Math.min(imgHeight, 90));
          currentY += Math.min(imgHeight, 90) + 15;
        } catch (error) {
          console.error(`Failed to capture chart ${elementId}:`, error);
        }
      }
    }
  }

  // Add footer
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);

    pdf.setDrawColor(BRAND_COLORS.primary);
    pdf.setLineWidth(0.8);
    pdf.line(0, pageHeight - 15, pageWidth, pageHeight - 15);

    pdf.setTextColor(BRAND_COLORS.muted);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');

    pdf.text('FabzClean - Franchise Management System', margin, pageHeight - 8);
    pdf.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin, pageHeight - 8, {
      align: 'right',
    });
  }

  // Save PDF
  pdf.save(`analytics-report-with-charts-${new Date().toISOString().split('T')[0]}.pdf`);
}
