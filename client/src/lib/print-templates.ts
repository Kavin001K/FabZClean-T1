// Professional print templates for all pages

interface PrintConfig {
  title: string;
  subtitle?: string;
  data: any[];
  columns?: string[];
  stats?: { label: string; value: string | number }[];
  footer?: string;
}

const BRAND_COLORS = {
  primary: '#84cc16',
  secondary: '#65a30d',
  dark: '#1f2937',
  light: '#f3f4f6',
  accent: '#fb923c',
};

const generatePrintStyles = () => `
  <style>
    @media print {
      @page {
        size: A4;
        margin: 20mm;
      }

      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 11pt;
        line-height: 1.6;
        color: #374151;
      }

      .print-container {
        max-width: 100%;
      }

      .print-header {
        border-bottom: 4px solid ${BRAND_COLORS.primary};
        padding-bottom: 20px;
        margin-bottom: 30px;
      }

      .brand-logo {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 10px;
      }

      .logo-circle {
        width: 50px;
        height: 50px;
        background: ${BRAND_COLORS.primary};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 24px;
        font-weight: bold;
      }

      .company-name {
        font-size: 28px;
        font-weight: 800;
        color: ${BRAND_COLORS.dark};
      }

      .report-title {
        font-size: 24px;
        font-weight: 700;
        color: ${BRAND_COLORS.dark};
        margin: 15px 0 5px 0;
      }

      .report-subtitle {
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 10px;
      }

      .report-meta {
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        color: #6b7280;
        margin-top: 10px;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 15px;
        margin: 25px 0;
        page-break-inside: avoid;
      }

      .stat-card {
        border: 1px solid ${BRAND_COLORS.light};
        border-left: 4px solid ${BRAND_COLORS.primary};
        padding: 15px;
        background: #fafafa;
        border-radius: 6px;
      }

      .stat-label {
        font-size: 10px;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 5px;
      }

      .stat-value {
        font-size: 24px;
        font-weight: 700;
        color: ${BRAND_COLORS.dark};
      }

      .section-title {
        font-size: 16px;
        font-weight: 700;
        color: ${BRAND_COLORS.dark};
        margin: 25px 0 15px 0;
        padding-bottom: 8px;
        border-bottom: 2px solid ${BRAND_COLORS.primary};
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin: 15px 0;
        page-break-inside: auto;
      }

      thead {
        background: ${BRAND_COLORS.primary};
        color: white;
      }

      thead tr {
        page-break-inside: avoid;
        page-break-after: avoid;
      }

      th {
        padding: 12px 10px;
        text-align: left;
        font-weight: 600;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      tbody tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }

      tbody tr:nth-child(even) {
        background: ${BRAND_COLORS.light};
      }

      td {
        padding: 10px;
        border-bottom: 1px solid #e5e7eb;
        font-size: 10pt;
      }

      .badge {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 9px;
        font-weight: 600;
        text-transform: uppercase;
      }

      .badge-success {
        background: #dcfce7;
        color: #166534;
      }

      .badge-warning {
        background: #fef3c7;
        color: #92400e;
      }

      .badge-danger {
        background: #fee2e2;
        color: #991b1b;
      }

      .badge-info {
        background: #dbeafe;
        color: #1e40af;
      }

      .print-footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 2px solid ${BRAND_COLORS.light};
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 10px;
        color: #6b7280;
      }

      .no-print {
        display: none !important;
      }

      /* Prevent awkward page breaks */
      h1, h2, h3, h4, h5, h6 {
        page-break-after: avoid;
      }

      .stat-card, .badge {
        page-break-inside: avoid;
      }
    }

    @media screen {
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        padding: 40px;
        background: #f9fafb;
      }

      .print-container {
        max-width: 1200px;
        margin: 0 auto;
        background: white;
        padding: 40px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        border-radius: 8px;
      }

      .print-actions {
        position: fixed;
        top: 20px;
        right: 20px;
        display: flex;
        gap: 10px;
        z-index: 1000;
      }

      .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-primary {
        background: ${BRAND_COLORS.primary};
        color: white;
      }

      .btn-primary:hover {
        background: ${BRAND_COLORS.secondary};
      }

      .btn-secondary {
        background: white;
        color: ${BRAND_COLORS.dark};
        border: 1px solid #d1d5db;
      }

      .btn-secondary:hover {
        background: ${BRAND_COLORS.light};
      }
    }
  </style>
`;

export function generatePrintHTML(config: PrintConfig): string {
  const {
    title,
    subtitle,
    data,
    columns,
    stats,
    footer = 'This report is confidential and intended for internal use only.',
  } = config;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - FabzClean</title>
      ${generatePrintStyles()}
    </head>
    <body>
      <div class="print-actions no-print">
        <button class="btn btn-primary" onclick="window.print()">🖨️ Print</button>
        <button class="btn btn-secondary" onclick="window.close()">✕ Close</button>
      </div>

      <div class="print-container">
        <!-- Header -->
        <div class="print-header">
          <div class="brand-logo">
            <div class="logo-circle">FC</div>
            <div class="company-name">FabzClean</div>
          </div>
          <h1 class="report-title">${title}</h1>
          ${subtitle ? `<p class="report-subtitle">${subtitle}</p>` : ''}
          <div class="report-meta">
            <span>Generated on ${dateStr} at ${timeStr}</span>
            <span>Total Records: ${data.length}</span>
          </div>
        </div>
  `;

  // Add statistics if provided
  if (stats && stats.length > 0) {
    html += `
        <!-- Statistics -->
        <div class="stats-grid">
    `;
    for (const stat of stats) {
      html += `
          <div class="stat-card">
            <div class="stat-label">${stat.label}</div>
            <div class="stat-value">${stat.value}</div>
          </div>
      `;
    }
    html += `
        </div>
    `;
  }

  // Add data section
  if (data.length > 0) {
    html += `
        <!-- Data Table -->
        <h2 class="section-title">Detailed Information</h2>
        <table>
          <thead>
            <tr>
    `;

    // Generate headers
    const headers = columns || Object.keys(data[0]);
    for (const header of headers) {
      html += `<th>${header}</th>`;
    }

    html += `
            </tr>
          </thead>
          <tbody>
    `;

    // Generate rows
    for (const row of data) {
      html += '<tr>';
      for (const header of headers) {
        const value = row[header] ?? '';
        html += `<td>${value}</td>`;
      }
      html += '</tr>';
    }

    html += `
          </tbody>
        </table>
    `;
  }

  // Footer
  html += `
        <!-- Footer -->
        <div class="print-footer">
          <div>${footer}</div>
          <div>Page 1 of 1</div>
        </div>
      </div>

      <script>
        // Auto-print on load (optional)
        // window.onload = () => window.print();
      </script>
    </body>
    </html>
  `;

  return html;
}

import { isElectron, isWindows } from "./utils";

export function printDocument(config: PrintConfig) {
  const html = generatePrintHTML(config);

  if (isElectron()) {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      iframe.contentWindow?.focus();

      // Windows needs slightly longer delays for print dialog
      const printDelay = isWindows() ? 800 : 500;
      const cleanupDelay = isWindows() ? 8000 : 5000;

      setTimeout(() => {
        try {
          iframe.contentWindow?.print();
        } catch (e) {
          console.error('Print failed:', e);
        }
        // Cleanup - wait longer on Windows for print dialog
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
      alert('Please allow popups to print this document.');
      return;
    }

    printWindow.document.write(html);
    printWindow.document.close();
  }
}

// Specific print functions for different data types
export function printOrders(orders: any[]) {
  const formattedData = orders.map(order => ({
    'Order #': order.orderNumber,
    'Customer': order.customerName,
    'Service': order.service || 'N/A',
    'Status': order.status,
    'Payment': order.paymentStatus || 'N/A',
    'Amount': `₹${order.totalAmount}`,
    'Date': new Date(order.createdAt).toLocaleDateString(),
  }));

  const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0);
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'in_progress').length;

  printDocument({
    title: 'Orders Report',
    subtitle: 'Complete listing of all orders with current status',
    data: formattedData,
    stats: [
      { label: 'Total Orders', value: orders.length },
      { label: 'Total Revenue', value: `₹${totalRevenue.toFixed(2)}` },
      { label: 'Completed', value: completedOrders },
      { label: 'Pending', value: pendingOrders },
    ],
  });
}

export function printCustomers(customers: any[]) {
  const formattedData = customers.map(customer => ({
    'Name': customer.name,
    'Email': customer.email || 'N/A',
    'Phone': customer.phone || 'N/A',
    'Orders': customer.totalOrders || 0,
    'Total Spent': `₹${customer.totalSpent || 0}`,
    'Last Order': customer.lastOrder ? new Date(customer.lastOrder).toLocaleDateString() : 'Never',
  }));

  const totalRevenue = customers.reduce((sum, c) => sum + parseFloat(c.totalSpent || 0), 0);
  const activeCustomers = customers.filter(c => (c.totalOrders || 0) > 0).length;
  const avgOrders = customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0) / customers.length;

  printDocument({
    title: 'Customers Report',
    subtitle: 'Customer database with lifetime value and activity',
    data: formattedData,
    stats: [
      { label: 'Total Customers', value: customers.length },
      { label: 'Total Revenue', value: `₹${totalRevenue.toFixed(2)}` },
      { label: 'Active Customers', value: activeCustomers },
      { label: 'Avg Orders', value: avgOrders.toFixed(1) },
    ],
  });
}

export function printServices(services: any[]) {
  const formattedData = services.map(service => ({
    'Service Name': service.name,
    'Category': service.category || 'General',
    'Price': `₹${service.price}`,
    'Duration': service.duration || 'N/A',
    'Status': service.status || 'Active',
  }));

  const avgPrice = services.reduce((sum, s) => sum + parseFloat(s.price || 0), 0) / services.length;
  const activeServices = services.filter(s => s.status === 'active').length;
  const categories = new Set(services.map(s => s.category)).size;

  printDocument({
    title: 'Services Catalog',
    subtitle: 'Complete list of available services with pricing',
    data: formattedData,
    stats: [
      { label: 'Total Services', value: services.length },
      { label: 'Active Services', value: activeServices },
      { label: 'Avg Price', value: `₹${avgPrice.toFixed(2)}` },
      { label: 'Categories', value: categories },
    ],
  });
}

export function printDashboardSummary(metrics: any) {
  const data = [
    { 'Metric': 'Total Revenue', 'Value': `₹${metrics.totalRevenue?.toFixed(2) || 0}` },
    { 'Metric': 'Total Orders', 'Value': metrics.totalOrders || 0 },
    { 'Metric': 'Active Customers', 'Value': metrics.activeCustomers || 0 },
    { 'Metric': 'Completion Rate', 'Value': `${metrics.completionRate || 0}%` },
    { 'Metric': 'Average Order Value', 'Value': `₹${metrics.averageOrderValue?.toFixed(2) || 0}` },
  ];

  printDocument({
    title: 'Dashboard Summary',
    subtitle: 'Business performance overview and key metrics',
    data,
    stats: [
      { label: 'Total Revenue', value: `₹${metrics.totalRevenue?.toFixed(2) || 0}` },
      { label: 'Total Orders', value: metrics.totalOrders || 0 },
      { label: 'Active Customers', value: metrics.activeCustomers || 0 },
      { label: 'Completion Rate', value: `${metrics.completionRate || 0}%` },
    ],
  });
}

export function generateTagHTML(order: any, items: any[]): string {
  // 1. Flatten items into individual tags
  interface TagItem {
    name: string;
    index: number;
    total: number;
  }
  const allTags: TagItem[] = [];
  items.forEach((item: any) => {
    const qty = parseInt(String(item.quantity || 1));
    const itemName = item.productName || item.serviceName || item.name || 'Garment';
    for (let i = 1; i <= qty; i++) {
      allTags.push({ name: itemName, index: i, total: qty });
    }
  });

  // 2. Generate compact tags for 40mm x 40mm labels
  let contentHtml = '';
  allTags.forEach((tag) => {
    const shortName = tag.name.length > 10 ? tag.name.substring(0, 9) + '.' : tag.name;
    contentHtml += `
      <div class="tag">
        <div class="brand">FabZClean</div>
        <div class="customer">${(order.customerName || 'Guest').substring(0, 12).toUpperCase()}</div>
        <div class="item">${shortName}</div>
        <div class="counter">${tag.index}/${tag.total}</div>
        <div class="notes">${(order.specialInstructions || order.notes || '-').substring(0, 20)}</div>
        <div class="footer">#${order.orderNumber}</div>
      </div>
    `;
  });

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <title>Tags #${order.orderNumber}</title>
      <style>
        /* TSC BARCODE PRINTER - 40mm x 40mm LABELS */
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
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        @media print {
          html, body { 
            margin: 0 !important;
            padding: 0 !important;
            width: 40mm !important;
            height: auto !important;
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
          
          .tag {
            page-break-after: always;
            margin: 0 !important;
          }
        }

        .tags-container {
          display: flex;
          flex-direction: column;
          width: 40mm;
          gap: 0;
          padding: 0;
          margin: 0;
        }

        .tag {
          width: 40mm;
          height: 40mm;
          padding: 1mm;
          border: 1px solid #000;
          text-align: center;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: white;
          page-break-after: always;
        }

        .brand { 
          font-size: 9px; 
          font-weight: 900; 
          text-transform: uppercase;
          letter-spacing: 0.3px;
          border-bottom: 0.5px solid #000;
          padding-bottom: 0.5mm;
        }
        
        .customer { 
          font-size: 7px; 
          font-weight: bold;
          padding: 0.5mm 0;
        }
        
        .item {
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          background: #f3f4f6;
          padding: 1mm;
        }

        .counter {
          font-size: 14px;
          font-weight: 900;
          padding: 1mm 0;
        }

        .notes {
          font-size: 6px;
          color: #666;
          border-top: 0.5px dotted #999;
          padding-top: 0.5mm;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .footer { 
          font-size: 6px; 
          font-family: 'Courier New', monospace; 
          font-weight: bold;
          border-top: 0.5px solid #ddd;
          padding-top: 0.5mm;
        }
      </style>
    </head>
    <body>
      <div class="tags-container">
        ${contentHtml}
      </div>
    </body>
  </html>
`;
}

/**
 * Print tags using an iframe - optimized for Electron/Desktop environment
 * Supports Windows, Mac, and Linux with OS-specific optimizations
 * @param order - The order object containing customer info and order number
 * @param items - Array of items to print tags for
 */
export function printTags(order: any, items: any[]): void {
  const htmlContent = generateTagHTML(order, items);

  // Create a hidden iframe for printing
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(htmlContent);
    doc.close();

    // OS-specific delays for optimal printing
    // Windows needs longer delays for print spooler
    const isDesktop = isElectron();
    const isWin = isWindows();

    const printDelay = isDesktop
      ? (isWin ? 1000 : 800)  // Windows: 1s, Mac: 800ms
      : 500;                  // Browser: 500ms

    const cleanupDelay = isDesktop
      ? (isWin ? 8000 : 5000) // Windows: 8s, Mac: 5s
      : 2000;                 // Browser: 2s

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (error) {
        console.error('Print failed:', error);
      } finally {
        // Cleanup with OS-specific delay
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, cleanupDelay);
      }
    }, printDelay);
  } else {
    console.error('Failed to create print iframe');
    document.body.removeChild(iframe);
  }
}