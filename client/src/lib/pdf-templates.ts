import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

// Define types for jsPDF with autoTable
interface jsPDFWithAutoTable extends jsPDF {
    lastAutoTable: { finalY: number };
}

const COMPANY_INFO = {
    name: "FabZClean Services",
    address: "Premium Laundry & Dry Cleaning",
    website: "www.fabzclean.com",
    contact: "support@fabzclean.com"
};

const THEME_COLORS = {
    primary: [41, 128, 185], // #2980b9
    secondary: [52, 73, 94], // #34495e
    accent: [231, 76, 60],   // #e74c3c
    header: [236, 240, 241]  // #ecf0f1
};

/**
 * Base Helper to setup PDF Header/Footer
 */
const setupPdfDocument = (title: string, orientation: 'p' | 'l' = 'p'): jsPDFWithAutoTable => {
    const doc = new jsPDF(orientation, 'mm', 'a4') as jsPDFWithAutoTable;

    // Header
    doc.setFillColor(THEME_COLORS.primary[0], THEME_COLORS.primary[1], THEME_COLORS.primary[2]);
    doc.rect(0, 0, doc.internal.pageSize.width, 20, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(COMPANY_INFO.name, 14, 13);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const dateStr = format(new Date(), 'PPP p');
    doc.text(`Generated: ${dateStr}`, doc.internal.pageSize.width - 14, 13, { align: 'right' });

    // Title Section
    doc.setTextColor(THEME_COLORS.secondary[0], THEME_COLORS.secondary[1], THEME_COLORS.secondary[2]);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, 35);
    doc.setLineWidth(0.5);
    doc.setDrawColor(THEME_COLORS.primary[0], THEME_COLORS.primary[1], THEME_COLORS.primary[2]);
    doc.line(14, 38, doc.internal.pageSize.width - 14, 38);

    return doc;
};

/**
 * Add Footer with Page Numbers
 */
const addFooter = (doc: jsPDFWithAutoTable) => {
    const pageCount = doc.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(150);

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(
            `Page ${i} of ${pageCount} - ${COMPANY_INFO.website} - Confidential`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
        );
    }
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
};

// ==========================================
// REPORT GENERATORS
// ==========================================

export const generateFranchisePerformanceReport = (data: any[]) => {
    const doc = setupPdfDocument('Franchise Performance Report', 'l'); // Landscape for more columns

    const tableData = data.map(item => [
        item.franchise_code,
        item.franchise_name,
        item.total_orders?.toLocaleString() || '0',
        formatCurrency(item.total_revenue || 0),
        item.total_customers?.toLocaleString() || '0',
        item.total_employees?.toString() || '0',
        formatCurrency(item.avg_order_value || 0),
        `${item.performance_score || '-'} / 100` // Assuming you add scoring later
    ]);

    autoTable(doc, {
        startY: 45,
        head: [['Code', 'Franchise Name', 'Orders', 'Revenue', 'Customers', 'Staff', 'Avg Order', 'Score']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
            3: { halign: 'right' }, // Revenue
            6: { halign: 'right' }, // Avg Order
        }
    });

    // Summary Section
    const totalRevenue = data.reduce((acc, curr) => acc + (curr.total_revenue || 0), 0);
    const totalOrders = data.reduce((acc, curr) => acc + (curr.total_orders || 0), 0);

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setTextColor(THEME_COLORS.secondary[0], THEME_COLORS.secondary[1], THEME_COLORS.secondary[2]);
    doc.text(`Total System Revenue: ${formatCurrency(totalRevenue)}`, 14, finalY);
    doc.text(`Total System Orders: ${totalOrders.toLocaleString()}`, 14, finalY + 6);

    addFooter(doc);
    doc.save(`Franchise_Performance_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const generateEmployeeDirectoryReport = (data: any[]) => {
    const doc = setupPdfDocument('Employee Performance Directory');

    const tableData = data.map(item => [
        item.employee_code,
        item.employee_name,
        item.role?.replace('_', ' ').toUpperCase(),
        item.franchise_code,
        formatCurrency(item.revenue_generated || 0),
        item.orders_processed || '0'
    ]);

    autoTable(doc, {
        startY: 45,
        head: [['ID', 'Name', 'Role', 'Franchise', 'Revenue Gen.', 'Orders']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [52, 73, 94] },
    });

    addFooter(doc);
    doc.save(`Employee_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const generateDailySummaryReport = (data: any[]) => {
    const doc = setupPdfDocument('Daily Operational Summary');

    const tableData = data.map(item => [
        format(new Date(item.date), 'dd MMM yyyy'),
        item.franchise_code || 'All',
        item.total_orders,
        formatCurrency(item.total_revenue),
        item.active_drivers || '-',
        item.completed_deliveries || '-'
    ]);

    autoTable(doc, {
        startY: 45,
        head: [['Date', 'Franchise', 'Orders', 'Revenue', 'Active Drivers', 'Deliveries']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [46, 204, 113] }, // Green header
    });

    addFooter(doc);
    doc.save(`Daily_Summary_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const generateMonthlyReport = (
    franchiseData: any[],
    employeeData: any[],
    dailyData: any[]
) => {
    const doc = setupPdfDocument('Comprehensive Monthly Business Report');

    let currentY = 45;

    // 1. Executive Summary
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Executive Summary', 14, currentY);
    currentY += 10;

    const totalRev = franchiseData.reduce((acc, curr) => acc + (curr.total_revenue || 0), 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text([
        `Total Revenue Generated: ${formatCurrency(totalRev)}`,
        `Active Franchises: ${franchiseData.length}`,
        `Total Staff: ${employeeData.length}`
    ], 14, currentY);

    currentY += 20;

    // 2. Franchise Table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Top Performing Franchises', 14, currentY);
    currentY += 5;

    autoTable(doc, {
        startY: currentY,
        head: [['Franchise', 'Revenue', 'Orders']],
        body: franchiseData.slice(0, 5).map(f => [
            f.franchise_name,
            formatCurrency(f.total_revenue),
            f.total_orders
        ]),
        theme: 'plain',
        tableWidth: 'wrap'
    });

    currentY = doc.lastAutoTable.finalY + 20;

    // 3. Daily Trends (Last 7 Days)
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('3. Last 7 Days Trend', 14, currentY);
    currentY += 5;

    const recentDays = dailyData.slice(0, 7);
    autoTable(doc, {
        startY: currentY,
        head: [['Date', 'Daily Revenue', 'Daily Orders']],
        body: recentDays.map(d => [
            format(new Date(d.date), 'dd MMM'),
            formatCurrency(d.total_revenue),
            d.total_orders
        ]),
    });

    addFooter(doc);
    doc.save(`Monthly_Report_FULL_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};
