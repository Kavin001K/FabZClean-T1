// Data export utilities for CSV and PDF generation

export interface ExportData {
  [key: string]: any;
}

export function exportToCSV(data: ExportData[], filename: string) {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    // Headers
    headers.join(','),
    // Data rows
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value ? value.replace(/"/g, '""') : ''}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToPDF(data: ExportData[], filename: string, title: string) {
  // This is a simplified PDF export using browser's print functionality
  // In a real app, you'd use a library like jsPDF or Puppeteer
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('Could not open print window');
    return;
  }

  // Create HTML content for PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p class="no-print">Generated on: ${new Date().toLocaleString()}</p>
      
      <table>
        <thead>
          <tr>
            ${Object.keys(data[0] || {}).map(key => `<th>${key}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => 
            `<tr>${Object.values(row).map(value => `<td>${value}</td>`).join('')}</tr>`
          ).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <p>Total records: ${data.length}</p>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Wait for content to load, then print
  printWindow.onload = () => {
    printWindow.print();
    printWindow.close();
  };
}

export function exportOrdersToCSV(orders: any[]) {
  const exportData = orders.map(order => ({
    'Order ID': order.id,
    'Order Number': order.orderNumber,
    'Customer Name': order.customerName,
    'Customer Email': order.customerEmail || '',
    'Customer Phone': order.customerPhone || '',
    'Service': order.service || '',
    'Status': order.status,
    'Payment Status': order.paymentStatus,
    'Total Amount': order.totalAmount,
    'Created Date': new Date(order.createdAt).toLocaleDateString(),
    'Updated Date': new Date(order.updatedAt).toLocaleDateString(),
  }));

  exportToCSV(exportData, `orders-${new Date().toISOString().split('T')[0]}`);
}

export function exportCustomersToCSV(customers: any[]) {
  const exportData = customers.map(customer => ({
    'Customer ID': customer.id,
    'Name': customer.name,
    'Email': customer.email || '',
    'Phone': customer.phone || '',
    'Total Orders': customer.totalOrders,
    'Total Spent': customer.totalSpent,
    'Last Order': customer.lastOrder ? new Date(customer.lastOrder).toLocaleDateString() : 'Never',
    'Created Date': new Date(customer.createdAt).toLocaleDateString(),
  }));

  exportToCSV(exportData, `customers-${new Date().toISOString().split('T')[0]}`);
}

export function exportInventoryToCSV(inventory: any[]) {
  const exportData = inventory.map(item => ({
    'Item ID': item.id,
    'Name': item.name,
    'Stock': item.stock,
    'Status': item.status,
  }));

  exportToCSV(exportData, `inventory-${new Date().toISOString().split('T')[0]}`);
}

export function exportOrdersToPDF(orders: any[], title: string = 'Orders Report') {
  const exportData = orders.map(order => ({
    'Order ID': order.id,
    'Customer': order.customerName,
    'Service': order.service || '',
    'Status': order.status,
    'Amount': `₹${order.totalAmount}`,
    'Date': new Date(order.createdAt).toLocaleDateString(),
  }));

  exportToPDF(exportData, `orders-${new Date().toISOString().split('T')[0]}`, title);
}

export function exportCustomersToPDF(customers: any[], title: string = 'Customers Report') {
  const exportData = customers.map(customer => ({
    'Customer ID': customer.id,
    'Name': customer.name,
    'Email': customer.email || '',
    'Phone': customer.phone || '',
    'Orders': customer.totalOrders,
    'Total Spent': `₹${customer.totalSpent}`,
  }));

  exportToPDF(exportData, `customers-${new Date().toISOString().split('T')[0]}`, title);
}
