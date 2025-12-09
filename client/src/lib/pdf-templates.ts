import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Company branding colors
const COLORS = {
    primary: '#0088FE',
    secondary: '#00C49F',
    accent: '#FFBB28',
    danger: '#FF8042',
    success: '#00C49F',
    warning: '#FFBB28',
    dark: '#1a1a1a',
    light: '#f5f5f5',
    gray: '#666666',
};

// Helper function to add header
const addHeader = (doc: jsPDF, title: string, subtitle?: string) => {
    const pageWidth = doc.internal.pageSize.getWidth();

    // Add logo/company name
    doc.setFontSize(24);
    doc.setTextColor(COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text('FabZClean', 20, 20);

    // Add tagline
    doc.setFontSize(10);
    doc.setTextColor(COLORS.gray);
    doc.setFont('helvetica', 'normal');
    doc.text('Professional Laundry & Dry Cleaning Services', 20, 27);

    // Add horizontal line
    doc.setDrawColor(COLORS.primary);
    doc.setLineWidth(0.5);
    doc.line(20, 32, pageWidth - 20, 32);

    // Add report title
    doc.setFontSize(18);
    doc.setTextColor(COLORS.dark);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 20, 45);

    // Add subtitle if provided
    if (subtitle) {
        doc.setFontSize(12);
        doc.setTextColor(COLORS.gray);
        doc.setFont('helvetica', 'normal');
        doc.text(subtitle, 20, 52);
    }

    return 60; // Return Y position for content start
};

// Helper function to add footer
const addFooter = (doc: jsPDF, pageNumber: number, totalPages: number) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Add horizontal line
    doc.setDrawColor(COLORS.gray);
    doc.setLineWidth(0.3);
    doc.line(20, pageHeight - 25, pageWidth - 20, pageHeight - 25);

    // Add page number
    doc.setFontSize(9);
    doc.setTextColor(COLORS.gray);
    doc.setFont('helvetica', 'normal');
    doc.text(
        `Page ${pageNumber} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 15,
        { align: 'center' }
    );

    // Add generation date
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    doc.text(`Generated on ${dateStr}`, 20, pageHeight - 15);

    // Add company info
    doc.text('www.fabzclean.com', pageWidth - 20, pageHeight - 15, { align: 'right' });
};

// Helper function to add summary box
const addSummaryBox = (
    doc: jsPDF,
    y: number,
    items: Array<{ label: string; value: string; color?: string }>
) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const boxWidth = (pageWidth - 60) / items.length;

    items.forEach((item, index) => {
        const x = 20 + (index * boxWidth) + (index * 10);

        // Draw box
        doc.setFillColor(item.color || COLORS.light);
        doc.roundedRect(x, y, boxWidth, 30, 3, 3, 'F');

        // Add label
        doc.setFontSize(9);
        doc.setTextColor(COLORS.gray);
        doc.setFont('helvetica', 'normal');
        doc.text(item.label, x + 5, y + 10);

        // Add value
        doc.setFontSize(16);
        doc.setTextColor(COLORS.dark);
        doc.setFont('helvetica', 'bold');
        doc.text(item.value, x + 5, y + 23);
    });

    return y + 40;
};

// ============================================
// FRANCHISE PERFORMANCE REPORT
// ============================================
export const generateFranchisePerformanceReport = (data: any[]) => {
    const doc = new jsPDF();

    // Add header
    let yPos = addHeader(
        doc,
        'Franchise Performance Report',
        `Comprehensive analysis of all franchise operations`
    );

    // Calculate totals
    const totals = data.reduce((acc, f) => ({
        orders: acc.orders + (f.total_orders || 0),
        revenue: acc.revenue + (f.total_revenue || 0),
        customers: acc.customers + (f.total_customers || 0),
        employees: acc.employees + (f.total_employees || 0),
    }), { orders: 0, revenue: 0, customers: 0, employees: 0 });

    // Add summary boxes
    yPos = addSummaryBox(doc, yPos, [
        {
            label: 'Total Franchises',
            value: data.length.toString(),
            color: '#E3F2FD'
        },
        {
            label: 'Total Revenue',
            value: `₹${(totals.revenue / 1000).toFixed(0)}K`,
            color: '#E8F5E9'
        },
        {
            label: 'Total Orders',
            value: totals.orders.toLocaleString(),
            color: '#FFF3E0'
        },
        {
            label: 'Total Customers',
            value: totals.customers.toLocaleString(),
            color: '#FCE4EC'
        }
    ]);

    yPos += 10;

    // Add table
    autoTable(doc, {
        startY: yPos,
        head: [[
            'Code',
            'Franchise Name',
            'Orders',
            'Revenue',
            'Customers',
            'Employees',
            'Avg Order'
        ]],
        body: data.map(f => [
            f.franchise_code,
            f.franchise_name,
            f.total_orders?.toLocaleString() || '0',
            `₹${(f.total_revenue || 0).toLocaleString()}`,
            f.total_customers?.toLocaleString() || '0',
            f.total_employees || '0',
            `₹${(f.avg_order_value || 0).toLocaleString()}`
        ]),
        headStyles: {
            fillColor: COLORS.primary,
            textColor: '#ffffff',
            fontStyle: 'bold',
            fontSize: 10
        },
        bodyStyles: {
            fontSize: 9
        },
        alternateRowStyles: {
            fillColor: COLORS.light
        },
        margin: { left: 20, right: 20 }
    });

    // Add footer
    addFooter(doc, 1, 1);

    // Save
    doc.save(`franchise-performance-${new Date().toISOString().split('T')[0]}.pdf`);
};

// ============================================
// EMPLOYEE DIRECTORY REPORT
// ============================================
export const generateEmployeeDirectoryReport = (data: any[], franchiseCode?: string) => {
    const doc = new jsPDF();

    const title = franchiseCode
        ? `Employee Directory - ${franchiseCode}`
        : 'Complete Employee Directory';

    let yPos = addHeader(doc, title, `Total Employees: ${data.length}`);

    // Group by franchise
    const grouped = data.reduce((acc: any, emp) => {
        const code = emp.franchise_code || 'Unassigned';
        if (!acc[code]) acc[code] = [];
        acc[code].push(emp);
        return acc;
    }, {});

    // Add each franchise section
    Object.keys(grouped).sort().forEach((code, index) => {
        const employees = grouped[code];

        if (index > 0) yPos += 15;

        // Franchise header
        doc.setFontSize(14);
        doc.setTextColor(COLORS.primary);
        doc.setFont('helvetica', 'bold');
        doc.text(`${code} - ${employees.length} Employees`, 20, yPos);

        yPos += 10;

        // Employee table
        autoTable(doc, {
            startY: yPos,
            head: [['Code', 'Name', 'Role', 'Position']],
            body: employees.map((emp: any) => [
                emp.employee_code,
                emp.employee_name,
                emp.role?.replace('_', ' ').toUpperCase(),
                emp.position
            ]),
            headStyles: {
                fillColor: COLORS.secondary,
                textColor: '#ffffff',
                fontStyle: 'bold',
                fontSize: 9
            },
            bodyStyles: {
                fontSize: 8
            },
            alternateRowStyles: {
                fillColor: COLORS.light
            },
            margin: { left: 20, right: 20 }
        });

        yPos = (doc as any).lastAutoTable.finalY + 5;
    });

    addFooter(doc, 1, 1);
    doc.save(`employee-directory-${new Date().toISOString().split('T')[0]}.pdf`);
};

// ============================================
// DAILY SUMMARY REPORT
// ============================================
export const generateDailySummaryReport = (data: any[], franchiseCode?: string) => {
    const doc = new jsPDF();

    const title = franchiseCode
        ? `Daily Summary - ${franchiseCode}`
        : 'Daily Summary - All Franchises';

    let yPos = addHeader(doc, title, `Last ${data.length} days`);

    // Calculate totals
    const totals = data.reduce((acc, day) => ({
        orders: acc.orders + (day.total_orders || 0),
        revenue: acc.revenue + (day.total_revenue || 0),
        customers: acc.customers + (day.unique_customers || 0),
    }), { orders: 0, revenue: 0, customers: 0 });

    // Add summary
    yPos = addSummaryBox(doc, yPos, [
        {
            label: 'Total Orders',
            value: totals.orders.toLocaleString(),
            color: '#E3F2FD'
        },
        {
            label: 'Total Revenue',
            value: `₹${(totals.revenue / 1000).toFixed(0)}K`,
            color: '#E8F5E9'
        },
        {
            label: 'Avg Daily Orders',
            value: Math.round(totals.orders / data.length).toString(),
            color: '#FFF3E0'
        }
    ]);

    yPos += 10;

    // Add table
    autoTable(doc, {
        startY: yPos,
        head: [['Date', 'Franchise', 'Orders', 'Revenue', 'Avg Order', 'Customers']],
        body: data.slice(0, 30).map(day => [
            new Date(day.date).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            }),
            day.franchise_code,
            day.total_orders?.toLocaleString() || '0',
            `₹${(day.total_revenue || 0).toLocaleString()}`,
            `₹${(day.avg_order_value || 0).toLocaleString()}`,
            day.unique_customers?.toLocaleString() || '0'
        ]),
        headStyles: {
            fillColor: COLORS.accent,
            textColor: '#000000',
            fontStyle: 'bold',
            fontSize: 9
        },
        bodyStyles: {
            fontSize: 8
        },
        alternateRowStyles: {
            fillColor: COLORS.light
        },
        margin: { left: 20, right: 20 }
    });

    addFooter(doc, 1, 1);
    doc.save(`daily-summary-${new Date().toISOString().split('T')[0]}.pdf`);
};

// ============================================
// MONTHLY PERFORMANCE REPORT
// ============================================
export const generateMonthlyReport = (
    franchiseData: any[],
    employeeData: any[],
    dailyData: any[]
) => {
    const doc = new jsPDF();

    const currentMonth = new Date().toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric'
    });

    let yPos = addHeader(
        doc,
        'Monthly Performance Report',
        currentMonth
    );

    // Executive Summary
    const totals = franchiseData.reduce((acc, f) => ({
        orders: acc.orders + (f.orders_last_30_days || 0),
        revenue: acc.revenue + (f.revenue_last_30_days || 0),
    }), { orders: 0, revenue: 0 });

    yPos = addSummaryBox(doc, yPos, [
        {
            label: 'Monthly Revenue',
            value: `₹${(totals.revenue / 1000).toFixed(0)}K`,
            color: '#E8F5E9'
        },
        {
            label: 'Monthly Orders',
            value: totals.orders.toLocaleString(),
            color: '#E3F2FD'
        },
        {
            label: 'Active Franchises',
            value: franchiseData.length.toString(),
            color: '#FFF3E0'
        },
        {
            label: 'Total Employees',
            value: employeeData.length.toString(),
            color: '#FCE4EC'
        }
    ]);

    yPos += 15;

    // Franchise Performance Section
    doc.setFontSize(14);
    doc.setTextColor(COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text('Franchise Performance', 20, yPos);

    yPos += 5;

    autoTable(doc, {
        startY: yPos,
        head: [['Franchise', 'Orders (30d)', 'Revenue (30d)', 'Growth']],
        body: franchiseData.map(f => [
            `${f.franchise_code} - ${f.franchise_name}`,
            f.orders_last_30_days?.toLocaleString() || '0',
            `₹${(f.revenue_last_30_days || 0).toLocaleString()}`,
            `${((f.orders_last_30_days / (f.total_orders || 1)) * 100).toFixed(1)}%`
        ]),
        headStyles: {
            fillColor: COLORS.primary,
            textColor: '#ffffff',
            fontStyle: 'bold'
        },
        alternateRowStyles: {
            fillColor: COLORS.light
        },
        margin: { left: 20, right: 20 }
    });

    // Add new page for trends
    doc.addPage();
    yPos = addHeader(doc, 'Daily Trends', 'Last 30 Days');

    autoTable(doc, {
        startY: yPos,
        head: [['Date', 'Orders', 'Revenue', 'Avg Order']],
        body: dailyData.slice(0, 30).map(day => [
            new Date(day.date).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short'
            }),
            day.total_orders?.toLocaleString() || '0',
            `₹${(day.total_revenue || 0).toLocaleString()}`,
            `₹${(day.avg_order_value || 0).toLocaleString()}`
        ]),
        headStyles: {
            fillColor: COLORS.secondary,
            textColor: '#ffffff',
            fontStyle: 'bold'
        },
        alternateRowStyles: {
            fillColor: COLORS.light
        },
        margin: { left: 20, right: 20 }
    });

    addFooter(doc, 2, 2);
    doc.save(`monthly-report-${new Date().toISOString().split('T')[0]}.pdf`);
};

// ============================================
// ATTENDANCE REPORT
// ============================================
export const generateAttendanceReport = (
    data: any[],
    startDate: string,
    endDate: string,
    franchiseCode?: string
) => {
    const doc = new jsPDF();

    const title = franchiseCode
        ? `Attendance Report - ${franchiseCode}`
        : 'Attendance Report - All Franchises';

    let yPos = addHeader(
        doc,
        title,
        `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`
    );

    // Calculate statistics
    const stats = data.reduce((acc, record) => {
        acc.total++;
        if (record.status === 'present') acc.present++;
        if (record.status === 'late') acc.late++;
        if (record.status === 'absent') acc.absent++;
        return acc;
    }, { total: 0, present: 0, late: 0, absent: 0 });

    const attendanceRate = stats.total > 0
        ? ((stats.present + stats.late) / stats.total * 100).toFixed(1)
        : '0';

    // Add summary
    yPos = addSummaryBox(doc, yPos, [
        {
            label: 'Total Records',
            value: stats.total.toString(),
            color: '#E3F2FD'
        },
        {
            label: 'Present',
            value: stats.present.toString(),
            color: '#E8F5E9'
        },
        {
            label: 'Late',
            value: stats.late.toString(),
            color: '#FFF3E0'
        },
        {
            label: 'Attendance Rate',
            value: `${attendanceRate}%`,
            color: '#FCE4EC'
        }
    ]);

    yPos += 10;

    // Add table
    autoTable(doc, {
        startY: yPos,
        head: [['Date', 'Employee', 'Code', 'Status', 'Clock In', 'Clock Out', 'Hours']],
        body: data.map(record => [
            new Date(record.date).toLocaleDateString('en-IN'),
            record.employee_name,
            record.employee_code,
            record.status.toUpperCase(),
            record.clock_in ? new Date(record.clock_in).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit'
            }) : '-',
            record.clock_out ? new Date(record.clock_out).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit'
            }) : '-',
            record.total_hours ? `${record.total_hours.toFixed(1)}h` : '-'
        ]),
        headStyles: {
            fillColor: COLORS.primary,
            textColor: '#ffffff',
            fontStyle: 'bold',
            fontSize: 9
        },
        bodyStyles: {
            fontSize: 8
        },
        alternateRowStyles: {
            fillColor: COLORS.light
        },
        columnStyles: {
            3: {
                cellWidth: 20,
                fontStyle: 'bold'
            }
        },
        didParseCell: (data) => {
            if (data.column.index === 3 && data.section === 'body') {
                const status = data.cell.raw as string;
                if (status === 'PRESENT') {
                    data.cell.styles.textColor = COLORS.success;
                } else if (status === 'LATE') {
                    data.cell.styles.textColor = COLORS.warning;
                } else if (status === 'ABSENT') {
                    data.cell.styles.textColor = COLORS.danger;
                }
            }
        },
        margin: { left: 20, right: 20 }
    });

    addFooter(doc, 1, 1);
    doc.save(`attendance-report-${new Date().toISOString().split('T')[0]}.pdf`);
};

export default {
    generateFranchisePerformanceReport,
    generateEmployeeDirectoryReport,
    generateDailySummaryReport,
    generateMonthlyReport,
    generateAttendanceReport
};
