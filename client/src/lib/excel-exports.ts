// Excel export functions for all pages
import { exportToExcelAdvanced, exportSingleSheet, ExcelColumn } from './excel-export-service';
import { formatCurrency, formatDate } from './data-service';
import type { Order, Customer, Service } from '@shared/schema';
import type { InventoryItem } from './data-service';

// ==================== ORDERS EXPORT ====================
export function exportOrdersToExcel(
  orders: Order[],
  filters?: {
    status?: string[];
    paymentStatus?: string[];
    dateRange?: string;
    amountRange?: string;
  }
) {
  const columns: ExcelColumn[] = [
    { header: 'Order Number', key: 'orderNumber', width: 15, align: 'left' },
    { header: 'Customer Name', key: 'customerName', width: 20, align: 'left' },
    { header: 'Customer Email', key: 'customerEmail', width: 25, align: 'left' },
    { header: 'Customer Phone', key: 'customerPhone', width: 15, align: 'left' },
    { header: 'Service', key: 'service', width: 20, align: 'left' },
    { header: 'Status', key: 'status', width: 15, align: 'center' },
    { header: 'Payment Status', key: 'paymentStatus', width: 15, align: 'center' },
    { header: 'Total Amount', key: 'totalAmount', width: 15, format: 'currency', align: 'right' },
    { header: 'Advance Paid', key: 'advancePaid', width: 15, format: 'currency', align: 'right' },
    { header: 'Balance', key: 'balance', width: 15, format: 'currency', align: 'right' },
    { header: 'Created Date', key: 'createdAt', width: 15, format: 'date', align: 'center' },
    { header: 'Updated Date', key: 'updatedAt', width: 15, format: 'date', align: 'center' },
    { header: 'Pickup Address', key: 'pickupAddress', width: 30, align: 'left' },
    { header: 'Delivery Address', key: 'deliveryAddress', width: 30, align: 'left' },
  ];

  const exportData = orders.map(order => ({
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerEmail: order.customerEmail || '',
    customerPhone: order.customerPhone || '',
    service: order.service || '',
    status: order.status,
    paymentStatus: order.paymentStatus,
    totalAmount: parseFloat(order.totalAmount) || 0,
    advancePaid: parseFloat(order.advancePaid) || 0,
    balance: (parseFloat(order.totalAmount) || 0) - (parseFloat(order.advancePaid) || 0),
    createdAt: new Date(order.createdAt),
    updatedAt: new Date(order.updatedAt),
    pickupAddress: order.pickupAddress || '',
    deliveryAddress: order.deliveryAddress || '',
  }));

  // Calculate summary
  const totalAmount = exportData.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalAdvance = exportData.reduce((sum, order) => sum + order.advancePaid, 0);
  const totalBalance = exportData.reduce((sum, order) => sum + order.balance, 0);

  const filterInfo = filters ? [
    filters.status?.length ? `Status: ${filters.status.join(', ')}` : '',
    filters.paymentStatus?.length ? `Payment: ${filters.paymentStatus.join(', ')}` : '',
    filters.dateRange ? `Date Range: ${filters.dateRange}` : '',
    filters.amountRange ? `Amount Range: ${filters.amountRange}` : '',
  ].filter(Boolean).join(' | ') : undefined;

  exportSingleSheet(exportData, columns, 'orders', {
    sheetName: 'Orders',
    companyName: 'FabZClean',
    title: 'Orders Report',
    filterInfo,
    summary: [
      { label: 'Total Orders', value: exportData.length, format: 'number' },
      { label: 'Total Amount', value: totalAmount, format: 'currency' },
      { label: 'Total Advance Paid', value: totalAdvance, format: 'currency' },
      { label: 'Total Balance', value: totalBalance, format: 'currency' },
    ]
  });
}

// ==================== CUSTOMERS EXPORT ====================
export function exportCustomersToExcel(customers: Customer[], filters?: { segment?: string; search?: string }) {
  const columns: ExcelColumn[] = [
    { header: 'Customer ID', key: 'id', width: 15, align: 'left' },
    { header: 'Name', key: 'name', width: 25, align: 'left' },
    { header: 'Email', key: 'email', width: 30, align: 'left' },
    { header: 'Phone', key: 'phone', width: 15, align: 'left' },
    { header: 'Total Orders', key: 'totalOrders', width: 12, format: 'number', align: 'right' },
    { header: 'Total Spent', key: 'totalSpent', width: 15, format: 'currency', align: 'right' },
    { header: 'Average Order Value', key: 'avgOrderValue', width: 18, format: 'currency', align: 'right' },
    { header: 'Last Order Date', key: 'lastOrder', width: 15, format: 'date', align: 'center' },
    { header: 'Customer Since', key: 'createdAt', width: 15, format: 'date', align: 'center' },
    { header: 'Status', key: 'status', width: 12, align: 'center' },
  ];

  const exportData = customers.map(customer => ({
    id: customer.id,
    name: customer.name,
    email: customer.email || '',
    phone: customer.phone || '',
    totalOrders: customer.totalOrders || 0,
    totalSpent: parseFloat(customer.totalSpent || '0'),
    avgOrderValue: customer.totalOrders > 0
      ? parseFloat(customer.totalSpent || '0') / customer.totalOrders
      : 0,
    lastOrder: customer.lastOrder ? new Date(customer.lastOrder) : null,
    createdAt: new Date(customer.createdAt),
    status: customer.totalOrders > 0 ? 'Active' : 'Inactive',
  }));

  const totalCustomers = exportData.length;
  const totalRevenue = exportData.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgRevenue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
  const activeCustomers = exportData.filter(c => c.status === 'Active').length;

  const filterInfo = filters ? [
    filters.segment && filters.segment !== 'all' ? `Segment: ${filters.segment}` : '',
    filters.search ? `Search: ${filters.search}` : '',
  ].filter(Boolean).join(' | ') : undefined;

  exportSingleSheet(exportData, columns, 'customers', {
    sheetName: 'Customers',
    companyName: 'FabZClean',
    title: 'Customer Database',
    filterInfo,
    summary: [
      { label: 'Total Customers', value: totalCustomers, format: 'number' },
      { label: 'Active Customers', value: activeCustomers, format: 'number' },
      { label: 'Total Revenue', value: totalRevenue, format: 'currency' },
      { label: 'Average Revenue per Customer', value: avgRevenue, format: 'currency' },
    ]
  });
}

// ==================== SERVICES EXPORT ====================
export function exportServicesToExcel(services: Service[], filters?: { category?: string; status?: string }) {
  const columns: ExcelColumn[] = [
    { header: 'Service ID', key: 'id', width: 15, align: 'left' },
    { header: 'Service Name', key: 'name', width: 30, align: 'left' },
    { header: 'Description', key: 'description', width: 40, align: 'left' },
    { header: 'Category', key: 'category', width: 20, align: 'left' },
    { header: 'Base Price', key: 'basePrice', width: 15, format: 'currency', align: 'right' },
    { header: 'Service Duration', key: 'duration', width: 15, align: 'center' },
    { header: 'Status', key: 'status', width: 12, align: 'center' },
    { header: 'Popularity', key: 'popularity', width: 12, format: 'number', align: 'right' },
    { header: 'Created Date', key: 'createdAt', width: 15, format: 'date', align: 'center' },
  ];

  const exportData = services.map(service => ({
    id: service.id,
    name: service.name,
    description: service.description || '',
    category: service.category || '',
    basePrice: parseFloat(service.basePrice) || 0,
    duration: service.duration || '',
    status: service.status || 'active',
    popularity: service.popularity || 0,
    createdAt: new Date(service.createdAt),
  }));

  const totalServices = exportData.length;
  const activeServices = exportData.filter(s => s.status === 'active').length;
  const avgPrice = totalServices > 0
    ? exportData.reduce((sum, s) => sum + s.basePrice, 0) / totalServices
    : 0;

  const filterInfo = filters ? [
    filters.category && filters.category !== 'all' ? `Category: ${filters.category}` : '',
    filters.status && filters.status !== 'all' ? `Status: ${filters.status}` : '',
  ].filter(Boolean).join(' | ') : undefined;

  exportSingleSheet(exportData, columns, 'services', {
    sheetName: 'Services',
    companyName: 'FabZClean',
    title: 'Service Catalog',
    filterInfo,
    summary: [
      { label: 'Total Services', value: totalServices, format: 'number' },
      { label: 'Active Services', value: activeServices, format: 'number' },
      { label: 'Average Price', value: avgPrice, format: 'currency' },
    ]
  });
}

// ==================== INVENTORY EXPORT ====================
export function exportInventoryToExcel(inventory: InventoryItem[], filters?: { status?: string; category?: string }) {
  const columns: ExcelColumn[] = [
    { header: 'SKU', key: 'sku', width: 15, align: 'left' },
    { header: 'Item Name', key: 'name', width: 30, align: 'left' },
    { header: 'Category', key: 'category', width: 20, align: 'left' },
    { header: 'Current Stock', key: 'stock', width: 15, format: 'number', align: 'right' },
    { header: 'Reorder Level', key: 'reorderLevel', width: 15, format: 'number', align: 'right' },
    { header: 'Unit Price', key: 'price', width: 15, format: 'currency', align: 'right' },
    { header: 'Stock Value', key: 'stockValue', width: 18, format: 'currency', align: 'right' },
    { header: 'Status', key: 'status', width: 15, align: 'center' },
    { header: 'Supplier', key: 'supplier', width: 25, align: 'left' },
  ];

  const exportData = inventory.map(item => ({
    sku: item.sku || item.id,
    name: item.name,
    category: item.category || '',
    stock: item.stock,
    reorderLevel: item.reorderLevel || 0,
    price: item.price || 0,
    stockValue: item.stock * (item.price || 0),
    status: item.status,
    supplier: item.supplier || '',
  }));

  const totalItems = exportData.length;
  const totalStockValue = exportData.reduce((sum, item) => sum + item.stockValue, 0);
  const lowStockItems = exportData.filter(item => item.status === 'Low Stock').length;
  const outOfStockItems = exportData.filter(item => item.status === 'Out of Stock').length;

  const filterInfo = filters ? [
    filters.status && filters.status !== 'all' ? `Status: ${filters.status}` : '',
    filters.category && filters.category !== 'all' ? `Category: ${filters.category}` : '',
  ].filter(Boolean).join(' | ') : undefined;

  exportSingleSheet(exportData, columns, 'inventory', {
    sheetName: 'Inventory',
    companyName: 'FabZClean',
    title: 'Inventory Report',
    filterInfo,
    summary: [
      { label: 'Total Items', value: totalItems, format: 'number' },
      { label: 'Total Stock Value', value: totalStockValue, format: 'currency' },
      { label: 'Low Stock Items', value: lowStockItems, format: 'number' },
      { label: 'Out of Stock Items', value: outOfStockItems, format: 'number' },
    ]
  });
}

// ==================== ACCOUNTING EXPORTS ====================

// Chart of Accounts
export function exportChartOfAccountsToExcel(accounts: any[]) {
  const columns: ExcelColumn[] = [
    { header: 'Account Code', key: 'code', width: 15, align: 'left' },
    { header: 'Account Name', key: 'name', width: 30, align: 'left' },
    { header: 'Account Type', key: 'type', width: 20, align: 'left' },
    { header: 'Category', key: 'category', width: 20, align: 'left' },
    { header: 'Current Balance', key: 'balance', width: 18, format: 'currency', align: 'right' },
    { header: 'Status', key: 'status', width: 12, align: 'center' },
    { header: 'Description', key: 'description', width: 40, align: 'left' },
  ];

  exportSingleSheet(accounts, columns, 'chart-of-accounts', {
    sheetName: 'Chart of Accounts',
    companyName: 'FabZClean',
    title: 'Chart of Accounts',
    summary: [
      { label: 'Total Accounts', value: accounts.length, format: 'number' },
    ]
  });
}

// Journal Entries
export function exportJournalEntriesToExcel(entries: any[]) {
  const columns: ExcelColumn[] = [
    { header: 'Entry Number', key: 'entryNumber', width: 15, align: 'left' },
    { header: 'Date', key: 'date', width: 15, format: 'date', align: 'center' },
    { header: 'Account', key: 'account', width: 30, align: 'left' },
    { header: 'Description', key: 'description', width: 40, align: 'left' },
    { header: 'Debit', key: 'debit', width: 15, format: 'currency', align: 'right' },
    { header: 'Credit', key: 'credit', width: 15, format: 'currency', align: 'right' },
    { header: 'Reference', key: 'reference', width: 20, align: 'left' },
  ];

  const totalDebit = entries.reduce((sum, e) => sum + (e.debit || 0), 0);
  const totalCredit = entries.reduce((sum, e) => sum + (e.credit || 0), 0);

  exportSingleSheet(entries, columns, 'journal-entries', {
    sheetName: 'Journal Entries',
    companyName: 'FabZClean',
    title: 'Journal Entries',
    summary: [
      { label: 'Total Entries', value: entries.length, format: 'number' },
      { label: 'Total Debit', value: totalDebit, format: 'currency' },
      { label: 'Total Credit', value: totalCredit, format: 'currency' },
      { label: 'Balance', value: totalDebit - totalCredit, format: 'currency' },
    ]
  });
}

// Trial Balance
export function exportTrialBalanceToExcel(balances: any[]) {
  const columns: ExcelColumn[] = [
    { header: 'Account Code', key: 'code', width: 15, align: 'left' },
    { header: 'Account Name', key: 'name', width: 35, align: 'left' },
    { header: 'Debit', key: 'debit', width: 18, format: 'currency', align: 'right' },
    { header: 'Credit', key: 'credit', width: 18, format: 'currency', align: 'right' },
  ];

  const totalDebit = balances.reduce((sum, b) => sum + (b.debit || 0), 0);
  const totalCredit = balances.reduce((sum, b) => sum + (b.credit || 0), 0);

  exportSingleSheet(balances, columns, 'trial-balance', {
    sheetName: 'Trial Balance',
    companyName: 'FabZClean',
    title: 'Trial Balance',
    summary: [
      { label: 'Total Debit', value: totalDebit, format: 'currency' },
      { label: 'Total Credit', value: totalCredit, format: 'currency' },
      { label: 'Difference', value: Math.abs(totalDebit - totalCredit), format: 'currency' },
    ]
  });
}

// Income Statement
export function exportIncomeStatementToExcel(statement: any) {
  const { revenue = [], expenses = [], totals = {} } = statement;

  const sheets = [
    {
      name: 'Income Statement',
      columns: [
        { header: 'Account', key: 'account', width: 35, align: 'left' as const },
        { header: 'Amount', key: 'amount', width: 18, format: 'currency' as const, align: 'right' as const },
      ],
      data: [
        ...revenue.map((r: any) => ({ account: r.account, amount: r.amount })),
        { account: 'Total Revenue', amount: totals.revenue || 0 },
        { account: '', amount: '' },
        ...expenses.map((e: any) => ({ account: e.account, amount: e.amount })),
        { account: 'Total Expenses', amount: totals.expenses || 0 },
        { account: '', amount: '' },
        { account: 'Net Income', amount: totals.netIncome || 0 },
      ],
      summary: [
        { label: 'Total Revenue', value: totals.revenue || 0, format: 'currency' },
        { label: 'Total Expenses', value: totals.expenses || 0, format: 'currency' },
        { label: 'Net Income', value: totals.netIncome || 0, format: 'currency' },
      ]
    }
  ];

  exportToExcelAdvanced({
    filename: 'income-statement',
    sheets,
    companyName: 'FabZClean',
    title: 'Income Statement'
  });
}

// Balance Sheet
export function exportBalanceSheetToExcel(balanceSheet: any) {
  const { assets = [], liabilities = [], equity = [], totals = {} } = balanceSheet;

  const sheets = [
    {
      name: 'Balance Sheet',
      columns: [
        { header: 'Account', key: 'account', width: 35, align: 'left' as const },
        { header: 'Amount', key: 'amount', width: 18, format: 'currency' as const, align: 'right' as const },
      ],
      data: [
        { account: 'ASSETS', amount: '' },
        ...assets.map((a: any) => ({ account: a.account, amount: a.amount })),
        { account: 'Total Assets', amount: totals.assets || 0 },
        { account: '', amount: '' },
        { account: 'LIABILITIES', amount: '' },
        ...liabilities.map((l: any) => ({ account: l.account, amount: l.amount })),
        { account: 'Total Liabilities', amount: totals.liabilities || 0 },
        { account: '', amount: '' },
        { account: 'EQUITY', amount: '' },
        ...equity.map((e: any) => ({ account: e.account, amount: e.amount })),
        { account: 'Total Equity', amount: totals.equity || 0 },
      ],
      summary: [
        { label: 'Total Assets', value: totals.assets || 0, format: 'currency' },
        { label: 'Total Liabilities', value: totals.liabilities || 0, format: 'currency' },
        { label: 'Total Equity', value: totals.equity || 0, format: 'currency' },
      ]
    }
  ];

  exportToExcelAdvanced({
    filename: 'balance-sheet',
    sheets,
    companyName: 'FabZClean',
    title: 'Balance Sheet'
  });
}

// ==================== DASHBOARD EXPORT ====================
export function exportDashboardToExcel(dashboardData: any) {
  const {
    metrics = {},
    recentOrders = [],
    topCustomers = [],
    salesData = [],
    servicePopularity = []
  } = dashboardData;

  const sheets = [
    // Metrics Summary
    {
      name: 'Metrics',
      columns: [
        { header: 'Metric', key: 'metric', width: 30, align: 'left' as const },
        { header: 'Value', key: 'value', width: 20, align: 'right' as const },
      ],
      data: [
        { metric: 'Total Revenue', value: formatCurrency(metrics.totalRevenue || 0) },
        { metric: 'Total Orders', value: metrics.totalOrders || 0 },
        { metric: 'Active Customers', value: metrics.activeCustomers || 0 },
        { metric: 'Pending Orders', value: metrics.pendingOrders || 0 },
        { metric: 'Completed Orders', value: metrics.completedOrders || 0 },
        { metric: 'Average Order Value', value: formatCurrency(metrics.avgOrderValue || 0) },
      ],
    },
    // Recent Orders
    {
      name: 'Recent Orders',
      columns: [
        { header: 'Order Number', key: 'orderNumber', width: 15, align: 'left' as const },
        { header: 'Customer', key: 'customerName', width: 25, align: 'left' as const },
        { header: 'Service', key: 'service', width: 20, align: 'left' as const },
        { header: 'Amount', key: 'totalAmount', width: 15, format: 'currency' as const, align: 'right' as const },
        { header: 'Status', key: 'status', width: 15, align: 'center' as const },
      ],
      data: recentOrders.map((order: any) => ({
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        service: order.service || '',
        totalAmount: parseFloat(order.totalAmount) || 0,
        status: order.status,
      })),
    },
    // Top Customers
    {
      name: 'Top Customers',
      columns: [
        { header: 'Customer Name', key: 'name', width: 30, align: 'left' as const },
        { header: 'Total Orders', key: 'totalOrders', width: 15, format: 'number' as const, align: 'right' as const },
        { header: 'Total Spent', key: 'totalSpent', width: 18, format: 'currency' as const, align: 'right' as const },
      ],
      data: topCustomers.map((customer: any) => ({
        name: customer.name,
        totalOrders: customer.totalOrders || 0,
        totalSpent: parseFloat(customer.totalSpent || '0'),
      })),
    },
  ];

  exportToExcelAdvanced({
    filename: 'dashboard-report',
    sheets,
    companyName: 'FabZClean',
    title: 'Dashboard Report'
  });
}
