import { Router } from "express";
import { db as storage } from "../db";
import { jwtRequired } from "../middleware/auth";
import { AuthService } from "../auth-service";
import { extractListData } from "../utils/list-result";

const router = Router();
router.use(jwtRequired);

const IST_TIME_ZONE = "Asia/Kolkata";

function toNumber(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function getIstDayBounds(now: Date = new Date()): { start: Date; end: Date } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const datePart = formatter.format(now);
  const start = new Date(`${datePart}T00:00:00+05:30`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function resolveStoreScope(req: any): string | undefined {
  const employee = req.employee;
  if (!employee || employee.role === "admin") return undefined;
  return employee.storeId || employee.franchiseId;
}

function matchesStoreScope(order: any, storeScope?: string): boolean {
  if (!storeScope) return true;
  const expected = String(storeScope).toLowerCase();
  return (
    String(order.storeCode || "").toLowerCase() === expected ||
    String(order.storeId || "").toLowerCase() === expected
  );
}

function getOrdersInRange(orders: any[], fromIso?: string, toIso?: string): any[] {
  if (!fromIso && !toIso) return orders;
  const from = fromIso ? new Date(fromIso) : null;
  const to = toIso ? new Date(toIso) : null;

  return orders.filter((order) => {
    if (!order.createdAt) return false;
    const d = new Date(order.createdAt);
    if (Number.isNaN(d.getTime())) return false;
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  });
}

function parseOrderItems(items: unknown): any[] {
  return Array.isArray(items) ? items : [];
}

function formatIstDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function startOfIstDay(date: Date): Date {
  return new Date(`${formatIstDateKey(date)}T00:00:00+05:30`);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function resolveReportRange(req: any): { start: Date; endExclusive: Date; previousStart: Date; previousEndExclusive: Date; days: number } {
  const requestedDays = Math.max(1, Math.min(365, Number(req.query.days || 30)));

  if (req.query.from || req.query.to) {
    const end = req.query.to ? startOfIstDay(new Date(String(req.query.to))) : startOfIstDay(new Date());
    const start = req.query.from ? startOfIstDay(new Date(String(req.query.from))) : addDays(end, -(requestedDays - 1));
    const days = Math.max(1, Math.ceil((startOfIstDay(addDays(end, 1)).getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
    return {
      start,
      endExclusive: addDays(end, 1),
      previousStart: addDays(start, -days),
      previousEndExclusive: start,
      days,
    };
  }

  const today = startOfIstDay(new Date());
  const start = addDays(today, -(requestedDays - 1));
  const endExclusive = addDays(today, 1);
  return {
    start,
    endExclusive,
    previousStart: addDays(start, -requestedDays),
    previousEndExclusive: start,
    days: requestedDays,
  };
}

function isDateInRange(value: unknown, start: Date, endExclusive: Date): boolean {
  if (!value) return false;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return false;
  return date >= start && date < endExclusive;
}

function normalizeStoreCode(value: unknown): string {
  return String(value || "UNASSIGNED").trim().toUpperCase() || "UNASSIGNED";
}

function isOrderActive(order: any): boolean {
  return String(order?.status || "").toLowerCase() !== "cancelled";
}

function isOrderComplete(order: any): boolean {
  const status = String(order?.status || "").toLowerCase();
  return status === "completed" || status === "delivered";
}

function getStoreName(code: string): string {
  switch (code) {
    case "POL":
      return "Pollachi";
    case "KIN":
      return "Kinathukadavu";
    case "MCET":
      return "MCET";
    case "UDM":
      return "Udumalpet";
    default:
      return code;
  }
}

async function listAllCustomers(): Promise<any[]> {
  const pageSize = 1000;
  let offset = 0;
  let totalCount = Number.POSITIVE_INFINITY;
  const all: any[] = [];

  while (offset < totalCount) {
    const response = await (storage as any).listCustomers(undefined, {
      limit: pageSize,
      offset,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    const rows = Array.isArray(response?.data)
      ? response.data
      : extractListData(response);
    totalCount = Number(response?.totalCount ?? all.length + rows.length);
    all.push(...rows);
    if (rows.length < pageSize) break;
    offset += pageSize;
  }

  return all;
}

async function listExpenses(): Promise<any[]> {
  const supabase = (storage as any)?.supabase;
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("mapp_expense_entries")
    .select("id, amount, category, note, incurred_at, store_code, created_by")
    .order("incurred_at", { ascending: false });

  if (error) {
    console.warn("Expense report query failed:", error.message);
    return [];
  }

  return Array.isArray(data) ? data : [];
}

function buildSignals(params: {
  franchiseRows: any[];
  topServices: any[];
  topCustomers: any[];
  summary: any;
  pnl: any;
}): any[] {
  const { franchiseRows, topServices, topCustomers, summary, pnl } = params;
  const leadStore = franchiseRows[0];
  const leadService = topServices[0];
  const leadCustomer = topCustomers[0];
  const signals: any[] = [];

  if (leadStore) {
    signals.push({
      id: "store-focus",
      severity: leadStore.revenueShare >= 70 ? "high" : leadStore.revenueShare >= 45 ? "medium" : "low",
      title: `${leadStore.storeName} is carrying ${leadStore.revenueShare.toFixed(0)}% of revenue`,
      summary: `${leadStore.totalOrders} orders and ₹${Math.round(leadStore.totalRevenue).toLocaleString("en-IN")} booked in the selected window.`,
      action: leadStore.revenueShare >= 70 ? "Reduce concentration risk by pushing repeat business into the smaller stores." : "Healthy lead store momentum with room to balance volume.",
    });
  }

  if (summary.pendingOrders > 0) {
    signals.push({
      id: "backlog",
      severity: summary.pendingOrders >= Math.max(10, summary.totalOrders * 0.25) ? "high" : "medium",
      title: `${summary.pendingOrders} active orders still need closure`,
      summary: `${summary.completedOrders} completed vs ${summary.pendingOrders} in pending or processing states.`,
      action: "Use updates and print queues first on older pending orders to protect delivery time.",
    });
  }

  if (pnl.totalExpenses > 0) {
    signals.push({
      id: "profitability",
      severity: pnl.profitMargin < 20 ? "high" : pnl.profitMargin < 35 ? "medium" : "low",
      title: `Profit margin is ${pnl.profitMargin.toFixed(1)}%`,
      summary: `Net profit is ₹${Math.round(pnl.netProfit).toLocaleString("en-IN")} after ₹${Math.round(pnl.totalExpenses).toLocaleString("en-IN")} in expenses.`,
      action: pnl.profitMargin < 20 ? "Review low-yield services and non-productive spending immediately." : "Margin is workable; protect it by tracking expenses by store and category.",
    });
  }

  if (leadService) {
    signals.push({
      id: "service-mix",
      severity: "low",
      title: `${leadService.name} is the main revenue driver`,
      summary: `${leadService.itemCount} pieces from ${leadService.customersCount} customers generated ₹${Math.round(leadService.revenue).toLocaleString("en-IN")}.`,
      action: "Promote adjacent upsells around this service to lift average ticket without changing the workflow.",
    });
  }

  if (leadCustomer) {
    signals.push({
      id: "customer-value",
      severity: leadCustomer.creditBalance > 0 ? "medium" : "low",
      title: `${leadCustomer.customerName} is the top-value customer`,
      summary: `${leadCustomer.orders} orders, ₹${Math.round(leadCustomer.revenue).toLocaleString("en-IN")} revenue, credit due ₹${Math.round(leadCustomer.creditBalance).toLocaleString("en-IN")}.`,
      action: leadCustomer.creditBalance > 0 ? "Follow up on dues while protecting this account with proactive service." : "This is a high-value repeat customer worth retaining carefully.",
    });
  }

  return signals.slice(0, 4);
}

async function buildReportOverview(req: any) {
  const storeScope = resolveStoreScope(req);
  const range = resolveReportRange(req);

  const rawOrders = (await storage.listOrders()) as any[];
  const scopedOrdersAll = rawOrders.filter((order: any) => matchesStoreScope(order, storeScope) && isOrderActive(order));
  const rangedOrders = scopedOrdersAll.filter((order: any) => isDateInRange(order.createdAt, range.start, range.endExclusive));
  const previousOrders = scopedOrdersAll.filter((order: any) => isDateInRange(order.createdAt, range.previousStart, range.previousEndExclusive));

  const allCustomers = await listAllCustomers();
  const scopedCustomerKeys = new Set(
    scopedOrdersAll.flatMap((order: any) => [
      String(order.customerId || ""),
      String(order.customerPhone || ""),
      String(order.secondaryPhone || ""),
      String(order.customerName || ""),
    ].filter(Boolean))
  );
  const scopedCustomers = !storeScope
    ? allCustomers
    : allCustomers.filter((customer: any) =>
        scopedCustomerKeys.has(String(customer.id || "")) ||
        scopedCustomerKeys.has(String(customer.phone || "")) ||
        scopedCustomerKeys.has(String(customer.secondaryPhone || "")) ||
        scopedCustomerKeys.has(String(customer.name || ""))
      );

  const allEmployees = (await storage.listEmployees()) as any[];
  const scopedEmployees = allEmployees.filter((employee: any) => {
    if (!storeScope) return true;
    return normalizeStoreCode(employee.storeId || employee.franchiseId) === normalizeStoreCode(storeScope);
  });

  let catalogStores: any[] = [];
  try {
    catalogStores = await (storage as any).listStores?.({ isActive: true }) || [];
  } catch {
    catalogStores = [];
  }
  const scopedCatalogStores = catalogStores.filter((store: any) => {
    if (!storeScope) return true;
    return normalizeStoreCode(store.code || store.id) === normalizeStoreCode(storeScope);
  });

  const allExpenses = await listExpenses();
  const scopedExpenses = allExpenses.filter((expense: any) => {
    if (!isDateInRange(expense.incurred_at, range.start, range.endExclusive)) return false;
    if (!storeScope) return true;
    return normalizeStoreCode(expense.store_code) === normalizeStoreCode(storeScope);
  });

  const franchiseMap = new Map<string, any>();
  for (const store of scopedCatalogStores) {
    const code = normalizeStoreCode(store.code || store.id);
    franchiseMap.set(code, {
      franchiseCode: code,
      franchiseName: store.name || code,
      storeName: store.name || getStoreName(code),
      totalRevenue: 0,
      totalOrders: 0,
      totalCustomers: 0,
      totalEmployees: 0,
      avgOrderValue: 0,
      completedOrders: 0,
      pendingOrders: 0,
      creditOutstanding: 0,
      topService: "Unassigned",
      lastOrderAt: null,
      _customers: new Set<string>(),
      _services: new Map<string, number>(),
    });
  }
  for (const order of rangedOrders) {
    const code = normalizeStoreCode(order.storeCode || order.storeId);
    const row = franchiseMap.get(code) || {
      franchiseCode: code,
      franchiseName: code,
      storeName: getStoreName(code),
      totalRevenue: 0,
      totalOrders: 0,
      totalCustomers: 0,
      totalEmployees: 0,
      avgOrderValue: 0,
      completedOrders: 0,
      pendingOrders: 0,
      creditOutstanding: 0,
      topService: "Unassigned",
      lastOrderAt: null,
      _customers: new Set<string>(),
      _services: new Map<string, number>(),
    };

    row.totalRevenue += toNumber(order.totalAmount);
    row.totalOrders += 1;
    row.completedOrders += isOrderComplete(order) ? 1 : 0;
    row.pendingOrders += isOrderComplete(order) ? 0 : 1;
    row.lastOrderAt = !row.lastOrderAt || new Date(order.createdAt) > new Date(row.lastOrderAt) ? order.createdAt : row.lastOrderAt;
    row._customers.add(String(order.customerId || order.customerPhone || order.customerName || order.id));

    for (const item of parseOrderItems(order.items)) {
      const serviceName = normalizeServiceName(item);
      row._services.set(serviceName, (row._services.get(serviceName) || 0) + itemRevenue(item));
    }

    franchiseMap.set(code, row);
  }

  const employeeCountByStore = new Map<string, number>();
  for (const employee of scopedEmployees) {
    const code = normalizeStoreCode(employee.storeId || employee.franchiseId);
    employeeCountByStore.set(code, (employeeCountByStore.get(code) || 0) + 1);
  }

  const customerById = new Map(scopedCustomers.map((customer: any) => [String(customer.id || ""), customer]));
  const customerByPhone = new Map(scopedCustomers.map((customer: any) => [String(customer.phone || ""), customer]));

  const franchiseRows = Array.from(franchiseMap.values()).map((row: any) => {
    row.totalCustomers = row._customers.size;
    row.totalEmployees = employeeCountByStore.get(row.franchiseCode) || 0;
    row.avgOrderValue = row.totalOrders > 0 ? row.totalRevenue / row.totalOrders : 0;
    row.topService = Array.from(row._services.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "Unassigned";
    row.creditOutstanding = rangedOrders
      .filter((order: any) => normalizeStoreCode(order.storeCode || order.storeId) === row.franchiseCode)
      .reduce((sum: number, order: any) => {
        const customer = customerById.get(String(order.customerId || "")) || customerByPhone.get(String(order.customerPhone || ""));
        return sum + Math.max(0, toNumber(customer?.creditBalance ?? customer?.credit_balance));
      }, 0);
    delete row._customers;
    delete row._services;
    return row;
  }).sort((a, b) => b.totalRevenue - a.totalRevenue);

  const totalRevenue = rangedOrders.reduce((sum: number, order: any) => sum + toNumber(order.totalAmount), 0);
  const totalOrdersCount = rangedOrders.length;
  for (const row of franchiseRows) {
    row.revenueShare = totalRevenue > 0 ? (row.totalRevenue / totalRevenue) * 100 : 0;
    row.orderShare = totalOrdersCount > 0 ? (row.totalOrders / totalOrdersCount) * 100 : 0;
  }

  const dailyMap = new Map<string, any>();
  for (let cursor = new Date(range.start); cursor < range.endExclusive; cursor = addDays(cursor, 1)) {
    const key = formatIstDateKey(cursor);
    dailyMap.set(key, {
      date: key,
      totalRevenue: 0,
      totalOrders: 0,
      completedOrders: 0,
      averageOrderValue: 0,
    });
  }
  for (const order of rangedOrders) {
    const key = formatIstDateKey(new Date(order.createdAt));
    const row = dailyMap.get(key);
    if (!row) continue;
    row.totalRevenue += toNumber(order.totalAmount);
    row.totalOrders += 1;
    row.completedOrders += isOrderComplete(order) ? 1 : 0;
  }
  const dailySummary = Array.from(dailyMap.values()).map((row: any) => ({
    ...row,
    averageOrderValue: row.totalOrders > 0 ? row.totalRevenue / row.totalOrders : 0,
  }));

  const serviceMap = new Map<string, any>();
  for (const order of rangedOrders) {
    const customerKey = String(order.customerId || order.customerPhone || order.customerName || order.id);
    const storeCode = normalizeStoreCode(order.storeCode || order.storeId);
    for (const item of parseOrderItems(order.items)) {
      const name = normalizeServiceName(item);
      const entry = serviceMap.get(name) || {
        name,
        orderCount: 0,
        itemCount: 0,
        revenue: 0,
        customersCount: 0,
        avgTicket: 0,
        topStore: storeCode,
        _customers: new Set<string>(),
        _stores: new Map<string, number>(),
      };
      entry.orderCount += 1;
      entry.itemCount += Math.max(1, toNumber(item.quantity));
      entry.revenue += itemRevenue(item);
      entry._customers.add(customerKey);
      entry._stores.set(storeCode, (entry._stores.get(storeCode) || 0) + itemRevenue(item));
      serviceMap.set(name, entry);
    }
  }
  const topServices = Array.from(serviceMap.values()).map((entry: any) => {
    entry.customersCount = entry._customers.size;
    entry.avgTicket = entry.orderCount > 0 ? entry.revenue / entry.orderCount : 0;
    entry.topStore = Array.from(entry._stores.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "UNASSIGNED";
    delete entry._customers;
    delete entry._stores;
    return entry;
  }).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  const customerMap = new Map<string, any>();
  for (const order of rangedOrders) {
    const customerKey = String(order.customerId || order.customerPhone || order.customerName || order.id);
    const existingCustomer = customerById.get(String(order.customerId || "")) || customerByPhone.get(String(order.customerPhone || ""));
    const entry = customerMap.get(customerKey) || {
      customerKey,
      customerId: order.customerId || existingCustomer?.id || null,
      customerName: String(order.customerName || existingCustomer?.name || "Unknown Customer"),
      phone: String(order.customerPhone || existingCustomer?.phone || ""),
      orders: 0,
      revenue: 0,
      avgOrderValue: 0,
      creditBalance: Math.max(0, toNumber(existingCustomer?.creditBalance ?? existingCustomer?.credit_balance)),
      walletBalance: toNumber(existingCustomer?.walletBalanceCache ?? existingCustomer?.wallet_balance_cache),
      lastOrderAt: order.createdAt,
      _services: new Map<string, number>(),
    };
    entry.orders += 1;
    entry.revenue += toNumber(order.totalAmount);
    entry.lastOrderAt = !entry.lastOrderAt || new Date(order.createdAt) > new Date(entry.lastOrderAt) ? order.createdAt : entry.lastOrderAt;
    for (const item of parseOrderItems(order.items)) {
      const name = normalizeServiceName(item);
      entry._services.set(name, (entry._services.get(name) || 0) + itemRevenue(item));
    }
    customerMap.set(customerKey, entry);
  }
  const topCustomers = Array.from(customerMap.values()).map((entry: any) => {
    entry.avgOrderValue = entry.orders > 0 ? entry.revenue / entry.orders : 0;
    entry.topServices = Array.from(entry._services.entries() as Iterable<[string, number]>)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);
    delete entry._services;
    return entry;
  }).sort((a, b) => b.revenue - a.revenue).slice(0, 12);

  const employeePerformance = scopedEmployees.map((employee: any) => {
    const employeeKey = String(employee.employeeId || employee.id || "");
    const employeeOrders = rangedOrders.filter((order: any) =>
      String(order.employeeId || "") === employeeKey ||
      String(order.createdBy || "") === employeeKey ||
      String(order.assignedTo || "") === employeeKey
    );
    const revenueGenerated = employeeOrders.reduce((sum: number, order: any) => sum + toNumber(order.totalAmount), 0);
    return {
      employeeId: employee.id,
      employeeCode: employee.employeeId || employee.id,
      name: `${employee.firstName || ""} ${employee.lastName || ""}`.trim() || employee.name || employee.email || "Unknown",
      role: employee.role,
      storeCode: normalizeStoreCode(employee.storeId || employee.franchiseId),
      totalOrders: employeeOrders.length,
      revenueGenerated,
      completionRate: employeeOrders.length > 0 ? (employeeOrders.filter(isOrderComplete).length / employeeOrders.length) * 100 : 0,
      avgOrderValue: employeeOrders.length > 0 ? revenueGenerated / employeeOrders.length : 0,
    };
  }).sort((a, b) => b.revenueGenerated - a.revenueGenerated);

  const expenseByCategory = scopedExpenses.reduce((acc: Record<string, number>, expense: any) => {
    const key = String(expense.category || "other");
    acc[key] = (acc[key] || 0) + toNumber(expense.amount);
    return acc;
  }, {});
  const totalExpenses = scopedExpenses.reduce((sum: number, expense: any) => sum + toNumber(expense.amount), 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const previousRevenue = previousOrders.reduce((sum: number, order: any) => sum + toNumber(order.totalAmount), 0);
  const previousOrderCount = previousOrders.length;
  const currentCustomersCount = new Set(rangedOrders.map((order: any) => String(order.customerId || order.customerPhone || order.customerName || order.id))).size;
  const previousCustomersCount = new Set(previousOrders.map((order: any) => String(order.customerId || order.customerPhone || order.customerName || order.id))).size;

  const summary = {
    totalRevenue,
    totalOrders: rangedOrders.length,
    totalCustomers: currentCustomersCount,
    totalEmployees: scopedEmployees.length,
    averageOrderValue: rangedOrders.length > 0 ? totalRevenue / rangedOrders.length : 0,
    completedOrders: rangedOrders.filter(isOrderComplete).length,
    pendingOrders: rangedOrders.filter((order: any) => !isOrderComplete(order)).length,
    creditOutstanding: scopedCustomers.reduce((sum: number, customer: any) => sum + Math.max(0, toNumber(customer.creditBalance ?? customer.credit_balance)), 0),
    walletBalance: scopedCustomers.reduce((sum: number, customer: any) => sum + Math.max(0, toNumber(customer.walletBalanceCache ?? customer.wallet_balance_cache)), 0),
    revenueDelta: previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : totalRevenue > 0 ? 100 : 0,
    ordersDelta: previousOrderCount > 0 ? ((rangedOrders.length - previousOrderCount) / previousOrderCount) * 100 : rangedOrders.length > 0 ? 100 : 0,
    customersDelta: previousCustomersCount > 0 ? ((currentCustomersCount - previousCustomersCount) / previousCustomersCount) * 100 : currentCustomersCount > 0 ? 100 : 0,
    completionRate: rangedOrders.length > 0 ? (rangedOrders.filter(isOrderComplete).length / rangedOrders.length) * 100 : 0,
  };

  const pnl = {
    revenue: totalRevenue,
    totalExpenses,
    netProfit,
    profitMargin,
    totalOrders: rangedOrders.length,
    expenseByCategory,
    expenses: scopedExpenses.slice(0, 20),
  };

  const serviceMix = franchiseRows.map((row: any) => ({
    name: row.franchiseCode,
    label: row.storeName,
    value: row.totalOrders,
    revenue: row.totalRevenue,
    share: row.orderShare,
  }));

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      startDate: formatIstDateKey(range.start),
      endDate: formatIstDateKey(addDays(range.endExclusive, -1)),
      days: range.days,
      scopedStore: storeScope ? normalizeStoreCode(storeScope) : null,
    },
    summary,
    insights: buildSignals({ franchiseRows, topServices, topCustomers, summary, pnl }),
    franchisePerformance: franchiseRows,
    employeePerformance,
    dailySummary,
    topServices,
    topCustomers,
    pnl,
    serviceMix,
  };
}

function normalizeServiceName(item: any): string {
  return String(item?.serviceName || item?.customName || item?.name || "Unknown Service").trim() || "Unknown Service";
}

function itemRevenue(item: any): number {
  const subtotal = toNumber(item?.subtotal);
  if (subtotal > 0) return subtotal;
  const price = toNumber(item?.price);
  const qty = Math.max(1, toNumber(item?.quantity));
  return price * qty;
}

async function logReport(req: any, reportName: string, details: Record<string, unknown>) {
  if (!req.employee) return;
  await AuthService.logAction(
    req.employee.employeeId,
    req.employee.username,
    "generate_report",
    "report",
    reportName,
    { ...details, generatedAt: new Date().toISOString() },
    req.ip || req.connection?.remoteAddress,
    req.get("user-agent")
  );
}

router.get("/overview", async (req, res) => {
  try {
    const data = await buildReportOverview(req);
    await logReport(req, "reports_overview", { days: data.meta.days, scope: data.meta.scopedStore || "all" });
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Reports overview error:", error);
    res.status(500).json({ success: false, message: "Failed to generate reports overview", error: error.message });
  }
});

router.get("/details/customer/:customerKey", async (req, res) => {
  try {
    const storeScope = resolveStoreScope(req);
    const key = decodeURIComponent(String(req.params.customerKey || ""));
    const orders = ((await storage.listOrders()) as any[])
      .filter(isOrderActive)
      .filter((order: any) => matchesStoreScope(order, storeScope))
      .filter((order: any) =>
        String(order.customerId || "") === key ||
        String(order.customerPhone || "") === key ||
        String(order.customerName || "") === key
      )
      .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    if (orders.length === 0) {
      res.status(404).json({ success: false, message: "Customer detail not found" });
      return;
    }

    const customerId = String(orders[0].customerId || key);
    const customer = customerId && customerId !== key ? await storage.getCustomer(customerId) : null;
    const services = new Map<string, number>();
    const stores = new Map<string, number>();

    for (const order of orders) {
      stores.set(normalizeStoreCode(order.storeCode || order.storeId), (stores.get(normalizeStoreCode(order.storeCode || order.storeId)) || 0) + toNumber(order.totalAmount));
      for (const item of parseOrderItems(order.items)) {
        const name = normalizeServiceName(item);
        services.set(name, (services.get(name) || 0) + itemRevenue(item));
      }
    }

    res.json({
      success: true,
      data: {
        customer: {
          id: customer?.id || orders[0].customerId || null,
          customerKey: key,
          name: customer?.name || orders[0].customerName || "Unknown Customer",
          phone: customer?.phone || orders[0].customerPhone || "",
          email: customer?.email || orders[0].customerEmail || "",
          creditBalance: Math.max(0, toNumber((customer as any)?.creditBalance ?? (customer as any)?.credit_balance)),
          walletBalance: toNumber((customer as any)?.walletBalanceCache ?? (customer as any)?.wallet_balance_cache),
          totalOrders: orders.length,
          totalRevenue: orders.reduce((sum: number, order: any) => sum + toNumber(order.totalAmount), 0),
          lastOrderAt: orders[0]?.createdAt || null,
        },
        topServices: Array.from(services.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, revenue]) => ({ name, revenue })),
        stores: Array.from(stores.entries()).sort((a, b) => b[1] - a[1]).map(([code, revenue]) => ({ code, name: getStoreName(code), revenue })),
        recentOrders: orders.slice(0, 12).map((order: any) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          totalAmount: toNumber(order.totalAmount),
          createdAt: order.createdAt,
          items: parseOrderItems(order.items).length,
          storeCode: normalizeStoreCode(order.storeCode || order.storeId),
        })),
      },
    });
  } catch (error: any) {
    console.error("Customer report detail error:", error);
    res.status(500).json({ success: false, message: "Failed to load customer detail", error: error.message });
  }
});

router.get("/details/service", async (req, res) => {
  try {
    const storeScope = resolveStoreScope(req);
    const requestedName = String(req.query.name || "").trim().toLowerCase();
    if (!requestedName) {
      res.status(400).json({ success: false, message: "Service name is required" });
      return;
    }

    const orders = ((await storage.listOrders()) as any[])
      .filter(isOrderActive)
      .filter((order: any) => matchesStoreScope(order, storeScope));

    const matchingOrders: any[] = [];
    const customerMap = new Map<string, any>();
    const storeMap = new Map<string, number>();
    let revenue = 0;
    let pieces = 0;

    for (const order of orders) {
      const matchingItems = parseOrderItems(order.items).filter((item: any) => normalizeServiceName(item).toLowerCase() === requestedName);
      if (matchingItems.length === 0) continue;

      matchingOrders.push(order);
      const customerKey = String(order.customerId || order.customerPhone || order.customerName || order.id);
      const customerEntry = customerMap.get(customerKey) || {
        customerKey,
        customerName: order.customerName || "Unknown Customer",
        phone: order.customerPhone || "",
        orders: 0,
        revenue: 0,
      };

      for (const item of matchingItems) {
        const itemRev = itemRevenue(item);
        revenue += itemRev;
        pieces += Math.max(1, toNumber(item.quantity));
        customerEntry.orders += 1;
        customerEntry.revenue += itemRev;
        const storeCode = normalizeStoreCode(order.storeCode || order.storeId);
        storeMap.set(storeCode, (storeMap.get(storeCode) || 0) + itemRev);
      }

      customerMap.set(customerKey, customerEntry);
    }

    res.json({
      success: true,
      data: {
        service: {
          name: String(req.query.name),
          revenue,
          pieces,
          orderCount: matchingOrders.length,
          customerCount: customerMap.size,
          averageOrderValue: matchingOrders.length > 0 ? revenue / matchingOrders.length : 0,
        },
        topCustomers: Array.from(customerMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 12),
        stores: Array.from(storeMap.entries()).sort((a, b) => b[1] - a[1]).map(([code, revenue]) => ({ code, name: getStoreName(code), revenue })),
        recentOrders: matchingOrders.slice(0, 12).map((order: any) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          status: order.status,
          totalAmount: toNumber(order.totalAmount),
          createdAt: order.createdAt,
          storeCode: normalizeStoreCode(order.storeCode || order.storeId),
        })),
      },
    });
  } catch (error: any) {
    console.error("Service report detail error:", error);
    res.status(500).json({ success: false, message: "Failed to load service detail", error: error.message });
  }
});

router.get("/details/franchise/:franchiseCode", async (req, res) => {
  try {
    const franchiseCode = normalizeStoreCode(req.params.franchiseCode);
    const orders = ((await storage.listOrders()) as any[])
      .filter(isOrderActive)
      .filter((order: any) => normalizeStoreCode(order.storeCode || order.storeId) === franchiseCode)
      .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    const employees = ((await storage.listEmployees()) as any[])
      .filter((employee: any) => normalizeStoreCode(employee.storeId || employee.franchiseId) === franchiseCode);

    const customerMap = new Map<string, any>();
    const serviceMap = new Map<string, number>();
    const statusMap = new Map<string, number>();

    for (const order of orders) {
      const customerKey = String(order.customerId || order.customerPhone || order.customerName || order.id);
      const customerEntry = customerMap.get(customerKey) || {
        customerKey,
        customerId: order.customerId || null,
        customerName: order.customerName || "Unknown Customer",
        phone: order.customerPhone || "",
        orders: 0,
        revenue: 0,
      };
      customerEntry.orders += 1;
      customerEntry.revenue += toNumber(order.totalAmount);
      customerMap.set(customerKey, customerEntry);
      statusMap.set(String(order.status || "unknown"), (statusMap.get(String(order.status || "unknown")) || 0) + 1);

      for (const item of parseOrderItems(order.items)) {
        const name = normalizeServiceName(item);
        serviceMap.set(name, (serviceMap.get(name) || 0) + itemRevenue(item));
      }
    }

    res.json({
      success: true,
      data: {
        franchise: {
          code: franchiseCode,
          name: getStoreName(franchiseCode),
          totalOrders: orders.length,
          totalRevenue: orders.reduce((sum: number, order: any) => sum + toNumber(order.totalAmount), 0),
          activeEmployees: employees.length,
          averageOrderValue: orders.length > 0 ? orders.reduce((sum: number, order: any) => sum + toNumber(order.totalAmount), 0) / orders.length : 0,
        },
        statusBreakdown: Array.from(statusMap.entries()).map(([status, count]) => ({ status, count })),
        topServices: Array.from(serviceMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, revenue]) => ({ name, revenue })),
        topCustomers: Array.from(customerMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10),
        employees: employees.slice(0, 12).map((employee: any) => ({
          id: employee.id,
          employeeId: employee.employeeId || employee.id,
          name: `${employee.firstName || ""} ${employee.lastName || ""}`.trim() || employee.name || employee.email || "Unknown",
          role: employee.role,
        })),
        recentOrders: orders.slice(0, 12).map((order: any) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          status: order.status,
          totalAmount: toNumber(order.totalAmount),
          createdAt: order.createdAt,
        })),
      },
    });
  } catch (error: any) {
    console.error("Franchise report detail error:", error);
    res.status(500).json({ success: false, message: "Failed to load franchise detail", error: error.message });
  }
});

router.get("/franchise-performance", async (req, res) => {
  try {
    const storeScope = resolveStoreScope(req);
    const allOrders = (await storage.listOrders()) as any[];
    const employees = await storage.listEmployees();

    const scopedOrders = allOrders.filter((o: any) => matchesStoreScope(o, storeScope));

    const map = new Map<string, any>();
    for (const order of scopedOrders) {
      const key = String(order.storeCode || order.storeId || "UNASSIGNED");
      if (!map.has(key)) {
        map.set(key, {
          franchise_id: key,
          franchise_name: key,
          franchise_code: key,
          total_revenue: 0,
          total_orders: 0,
          total_customers: 0,
          total_employees: 0,
          average_order_value: 0,
          _customerSet: new Set<string>(),
        });
      }
      const row = map.get(key);
      row.total_revenue += toNumber(order.totalAmount);
      row.total_orders += 1;
      const customerKey = String(order.customerId || order.customerPhone || order.customerName || "");
      if (customerKey) row._customerSet.add(customerKey);
    }

    // employee count by store scope key
    const employeeCountByStore = new Map<string, number>();
    for (const e of employees as any[]) {
      const key = String(e.storeId || e.franchiseId || "UNASSIGNED");
      employeeCountByStore.set(key, (employeeCountByStore.get(key) || 0) + 1);
    }

    const data = Array.from(map.values()).map((row: any) => {
      row.total_customers = row._customerSet.size;
      delete row._customerSet;
      row.total_employees = employeeCountByStore.get(row.franchise_code) || 0;
      row.average_order_value = row.total_orders > 0 ? row.total_revenue / row.total_orders : 0;
      row.revenue_last_30_days = scopedOrders
        .filter((o: any) => String(o.storeCode || o.storeId || "UNASSIGNED") === row.franchise_code)
        .filter((o: any) => o.createdAt && new Date(o.createdAt) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        .reduce((sum: number, o: any) => sum + toNumber(o.totalAmount), 0);
      return row;
    }).sort((a, b) => b.total_revenue - a.total_revenue);

    await logReport(req, "franchise_performance", { rows: data.length });
    res.json({ success: true, data, timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error("Franchise performance report error:", error);
    res.status(500).json({ success: false, message: "Failed to generate franchise performance report", error: error.message });
  }
});

router.get("/employee-performance", async (req, res) => {
  try {
    const storeScope = resolveStoreScope(req);
    const allEmployees = await storage.listEmployees();
    const allOrders = await storage.listOrders();

    const scopedEmployees = (allEmployees as any[]).filter((e: any) => {
      if (!storeScope) return true;
      return String(e.storeId || e.franchiseId || "").toLowerCase() === String(storeScope).toLowerCase();
    });

    const scopedOrders = allOrders.filter((o: any) => matchesStoreScope(o, storeScope));

    const data = scopedEmployees.map((emp: any) => {
      const empKey = String(emp.employeeId || emp.id || "");
      const empOrders = scopedOrders.filter((o: any) =>
        String(o.employeeId || "") === empKey ||
        String(o.createdBy || "") === empKey ||
        String(o.assignedTo || "") === empKey
      );
      const revenue = empOrders.reduce((sum: number, o: any) => sum + toNumber(o.totalAmount), 0);
      const targetRevenue = 10000;

      return {
        employee_id: emp.id,
        employee_code: emp.employeeId || emp.id,
        name: `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || emp.name || emp.email || "Unknown",
        role: emp.role,
        franchise_id: emp.storeId || emp.franchiseId || null,
        total_orders: empOrders.length,
        revenue_generated: revenue,
        target_revenue: targetRevenue,
        achievement_rate: targetRevenue > 0 ? (revenue / targetRevenue) * 100 : 0,
      };
    }).sort((a, b) => b.revenue_generated - a.revenue_generated);

    await logReport(req, "employee_performance", { rows: data.length });
    res.json({ success: true, data, timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error("Employee performance report error:", error);
    res.status(500).json({ success: false, message: "Failed to generate employee performance report", error: error.message });
  }
});

router.get("/daily-summary", async (req, res) => {
  try {
    const numDays = Math.max(1, Number(req.query.days || 30));
    const storeScope = resolveStoreScope(req);
    const from = new Date(Date.now() - numDays * 24 * 60 * 60 * 1000);

    const orders = (await storage.listOrders())
      .filter((o: any) => matchesStoreScope(o, storeScope))
      .filter((o: any) => o.createdAt && new Date(o.createdAt) >= from);

    const dailyMap = new Map<string, { date: string; total_revenue: number; total_orders: number; completed_orders: number }>();

    for (const order of orders) {
      const dateStr = new Date(order.createdAt).toISOString().split("T")[0];
      if (!dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, { date: dateStr, total_revenue: 0, total_orders: 0, completed_orders: 0 });
      }
      const row = dailyMap.get(dateStr)!;
      row.total_revenue += toNumber(order.totalAmount);
      row.total_orders += 1;
      if (["completed", "delivered"].includes(String(order.status))) {
        row.completed_orders += 1;
      }
    }

    const data = Array.from(dailyMap.values()).sort((a, b) => b.date.localeCompare(a.date));
    await logReport(req, "daily_summary", { rows: data.length, days: numDays });
    res.json({ success: true, data, timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error("Daily summary report error:", error);
    res.status(500).json({ success: false, message: "Failed to generate daily summary report", error: error.message });
  }
});

router.get("/top-services", async (req, res) => {
  try {
    const limit = Math.max(1, Number(req.query.limit || 5));
    const from = req.query.from ? String(req.query.from) : undefined;
    const to = req.query.to ? String(req.query.to) : undefined;
    const storeScope = resolveStoreScope(req);

    const orders = getOrdersInRange(
      (await storage.listOrders())
        .filter((o: any) => matchesStoreScope(o, storeScope))
        .filter((o: any) => String(o.status) !== "cancelled"),
      from,
      to
    );

    const map = new Map<string, { name: string; orderCount: number; itemCount: number; revenue: number }>();

    for (const order of orders) {
      for (const item of parseOrderItems(order.items)) {
        const name = normalizeServiceName(item);
        const entry = map.get(name) || { name, orderCount: 0, itemCount: 0, revenue: 0 };
        entry.orderCount += 1;
        entry.itemCount += Math.max(1, toNumber(item?.quantity));
        entry.revenue += itemRevenue(item);
        map.set(name, entry);
      }
    }

    const data = Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);

    await logReport(req, "top_services", { rows: data.length, limit });
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Top services report error:", error);
    res.status(500).json({ success: false, message: "Failed to generate top services report", error: error.message });
  }
});

router.get("/top-products", async (req, res) => {
  try {
    const limit = Math.max(1, Number(req.query.limit || 10));
    const from = req.query.from ? String(req.query.from) : undefined;
    const to = req.query.to ? String(req.query.to) : undefined;
    const storeScope = resolveStoreScope(req);

    const orders = getOrdersInRange(
      (await storage.listOrders())
        .filter((o: any) => matchesStoreScope(o, storeScope))
        .filter((o: any) => String(o.status) !== "cancelled"),
      from,
      to
    );

    const map = new Map<string, { name: string; quantity: number; revenue: number }>();

    for (const order of orders) {
      for (const item of parseOrderItems(order.items)) {
        const name = normalizeServiceName(item);
        const entry = map.get(name) || { name, quantity: 0, revenue: 0 };
        entry.quantity += Math.max(1, toNumber(item?.quantity));
        entry.revenue += itemRevenue(item);
        map.set(name, entry);
      }
    }

    const data = Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);

    await logReport(req, "top_products", { rows: data.length, limit });
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Top products report error:", error);
    res.status(500).json({ success: false, message: "Failed to generate top products report", error: error.message });
  }
});

router.get("/top-customers", async (req, res) => {
  try {
    const limit = Math.max(1, Number(req.query.limit || 10));
    const from = req.query.from ? String(req.query.from) : undefined;
    const to = req.query.to ? String(req.query.to) : undefined;
    const storeScope = resolveStoreScope(req);

    const orders = getOrdersInRange(
      (await storage.listOrders())
        .filter((o: any) => matchesStoreScope(o, storeScope))
        .filter((o: any) => String(o.status) !== "cancelled"),
      from,
      to
    );

    const map = new Map<string, { customerKey: string; customerName: string; phone: string; orders: number; revenue: number }>();

    for (const order of orders) {
      const customerKey = String(order.customerId || order.customerPhone || order.customerName || order.id);
      const entry = map.get(customerKey) || {
        customerKey,
        customerName: String(order.customerName || "Unknown Customer"),
        phone: String(order.customerPhone || ""),
        orders: 0,
        revenue: 0,
      };
      entry.orders += 1;
      entry.revenue += toNumber(order.totalAmount);
      map.set(customerKey, entry);
    }

    const data = Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);

    await logReport(req, "top_customers", { rows: data.length, limit });
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Top customers report error:", error);
    res.status(500).json({ success: false, message: "Failed to generate top customers report", error: error.message });
  }
});

router.get("/pnl", async (req, res) => {
  try {
    const from = req.query.from ? String(req.query.from) : undefined;
    const to = req.query.to ? String(req.query.to) : undefined;
    const storeScope = resolveStoreScope(req);

    const orders = getOrdersInRange(
      (await storage.listOrders())
        .filter((o: any) => matchesStoreScope(o, storeScope))
        .filter((o: any) => String(o.status) !== "cancelled"),
      from,
      to
    );

    const revenue = orders.reduce((sum: number, o: any) => sum + toNumber(o.totalAmount), 0);

    const supabase = (storage as any).supabase;
    const expenseQuery = supabase
      .from("mapp_expense_entries")
      .select("amount, incurred_at, category, store_code")
      .order("incurred_at", { ascending: false });

    const { data: expensesRaw, error } = await expenseQuery;
    if (error) {
      throw error;
    }

    const scopedExpenses = (expensesRaw || []).filter((e: any) => {
      const date = e?.incurred_at ? new Date(e.incurred_at) : null;
      if (!date || Number.isNaN(date.getTime())) return false;
      if (from && date < new Date(from)) return false;
      if (to && date > new Date(to)) return false;
      if (!storeScope) return true;
      return String(e.store_code || "").toLowerCase() === String(storeScope).toLowerCase();
    });

    const totalExpenses = scopedExpenses.reduce((sum: number, e: any) => sum + toNumber(e.amount), 0);
    const netProfit = revenue - totalExpenses;
    const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    const expenseByCategory = scopedExpenses.reduce((acc: Record<string, number>, e: any) => {
      const key = String(e.category || "other");
      acc[key] = (acc[key] || 0) + toNumber(e.amount);
      return acc;
    }, {});

    await logReport(req, "pnl", { expenseRows: scopedExpenses.length });
    res.json({
      success: true,
      data: {
        revenue,
        totalExpenses,
        netProfit,
        profitMargin,
        totalOrders: orders.length,
        expenseByCategory,
      },
    });
  } catch (error: any) {
    console.error("P&L report error:", error);
    res.status(500).json({ success: false, message: "Failed to generate P&L report", error: error.message });
  }
});

router.post("/expenses", async (req, res) => {
  try {
    const { amount, category, note, incurredAt, storeCode } = req.body || {};
    const numericAmount = toNumber(amount);

    if (numericAmount <= 0) {
      res.status(400).json({ success: false, message: "amount must be greater than 0" });
      return;
    }

    const supabase = (storage as any).supabase;
    const payload = {
      amount: numericAmount,
      category: String(category || "other"),
      note: note ? String(note) : null,
      incurred_at: incurredAt ? new Date(incurredAt).toISOString() : new Date().toISOString(),
      store_code: storeCode ? String(storeCode) : null,
      created_by: req.employee?.employeeId || null,
    };

    const { data, error } = await supabase
      .from("mapp_expense_entries")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    await logReport(req, "expense_create", { amount: numericAmount, category: payload.category });
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    console.error("Expense creation error:", error);
    res.status(500).json({ success: false, message: "Failed to create expense", error: error.message });
  }
});

// lightweight operational metrics endpoint to keep ERP + website consistent on canonical stats
router.get("/kpi-snapshot", async (req, res) => {
  try {
    const storeScope = resolveStoreScope(req);
    const orders = (await storage.listOrders())
      .filter((o: any) => matchesStoreScope(o, storeScope))
      .filter((o: any) => String(o.status) !== "cancelled");

    const { start: todayStart, end: todayEnd } = getIstDayBounds();
    const last2DaysStart = new Date(todayStart);
    last2DaysStart.setDate(last2DaysStart.getDate() - 2);

    const revenueAll = orders.reduce((sum: number, o: any) => sum + toNumber(o.totalAmount), 0);
    const ordersToday = orders.filter((o: any) => o.createdAt && new Date(o.createdAt) >= todayStart && new Date(o.createdAt) < todayEnd).length;
    const ordersLast2Days = orders.filter((o: any) => o.createdAt && new Date(o.createdAt) >= last2DaysStart).length;

    res.json({
      success: true,
      data: {
        totalOrders: orders.length,
        totalRevenue: revenueAll,
        ordersToday,
        ordersLast2Days,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("KPI snapshot error:", error);
    res.status(500).json({ success: false, message: "Failed to load KPI snapshot", error: error.message });
  }
});

export default router;
