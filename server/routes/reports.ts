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
  const status = String(order?.status || "").toLowerCase();
  return status !== "cancelled" && status !== "refunded" && status !== "deleted";
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
      summary: `${leadStore.totalOrders} orders and Rs. ${Math.round(leadStore.totalRevenue).toLocaleString("en-IN")} booked in the selected window.`,
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
      summary: `Net profit is Rs. ${Math.round(pnl.netProfit).toLocaleString("en-IN")} after Rs. ${Math.round(pnl.totalExpenses).toLocaleString("en-IN")} in expenses.`,
      action: pnl.profitMargin < 20 ? "Review low-yield services and non-productive spending immediately." : "Margin is workable; protect it by tracking expenses by store and category.",
    });
  }

  if (leadService) {
    signals.push({
      id: "service-mix",
      severity: "low",
      title: `${leadService.name} is the main revenue driver`,
      summary: `${leadService.itemCount} pieces from ${leadService.customersCount} customers generated Rs. ${Math.round(leadService.revenue).toLocaleString("en-IN")}.`,
      action: "Promote adjacent upsells around this service to lift average ticket without changing the workflow.",
    });
  }

  if (leadCustomer) {
    signals.push({
      id: "customer-value",
      severity: leadCustomer.creditBalance > 0 ? "medium" : "low",
      title: `${leadCustomer.customerName} is the top-value customer`,
      summary: `${leadCustomer.orders} orders, Rs. ${Math.round(leadCustomer.revenue).toLocaleString("en-IN")} revenue, credit due Rs. ${Math.round(leadCustomer.creditBalance).toLocaleString("en-IN")}.`,
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

// Ask AI Reports Assistant endpoint
router.post(["/ask-ai", "/ask-ace"], async (req, res) => {
  try {
    const { question, history } = req.body || {};

    if (!question || typeof question !== "string" || question.trim().length === 0) {
      res.status(400).json({ success: false, message: "question is required" });
      return;
    }

    const q = question.trim();
    const qLower = q.toLowerCase();

    // 1. Fetch data for entity resolution & general overview context
    const allCustomers = await listAllCustomers();
    const allEmployees = (await storage.listEmployees()) as any[];
    const rawOrders = (await storage.listOrders()) as any[];

    // Entity lookup matching logic (Multiple Matches Support!)
    let matchedCustomers: any[] = [];
    let matchedEmployees: any[] = [];
    let matchedOrders: any[] = [];
    let matchedStores: any[] = [];
    let matchedStoreOrders: any[] = []; // Fix ReferenceError

    const STOP_WORDS = new Set([
      'all', 'with', 'name', 'their', 'list', 'show', 'find', 'get', 'who', 'which', 
      'what', 'how', 'where', 'why', 'the', 'for', 'and', 'this', 'that', 'them', 
      'they', 'here', 'info', 'details', 'detail', 'profile', 'profiles', 'customer', 
      'customers', 'store', 'stores', 'employee', 'employees', 'order', 'orders', 
      'about', 'some', 'from', 'have', 'has', 'had', 'been', 'were', 'was', 'are', 'is'
    ]);

    // Find all customers whose names contain any word in the query or vice-versa
    const sortedCustomers = [...allCustomers].sort((a, b) => (b.name || '').length - (a.name || '').length);
    for (const c of sortedCustomers) {
      if (!c.name) continue;
      const cNameLower = c.name.toLowerCase();
      if (qLower.includes(cNameLower) || cNameLower.includes(qLower)) {
        matchedCustomers.push(c);
      } else {
        const queryWords = qLower.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
        const nameWords = cNameLower.split(/\s+/);
        const wordMatch = queryWords.some(qw => nameWords.some(nw => nw.startsWith(qw) || nw.includes(qw)));
        if (wordMatch) {
          matchedCustomers.push(c);
        }
      }
    }
    
    // Fallback: match by phone number
    if (matchedCustomers.length === 0) {
      for (const c of allCustomers) {
        if (!c.phone) continue;
        if (qLower.includes(c.phone)) {
          matchedCustomers.push(c);
        }
      }
    }

    // Find all matching stores
    let catalogStores: any[] = [];
    try {
      catalogStores = await (storage as any).listStores?.({ isActive: true }) || [];
    } catch {
      catalogStores = [];
    }
    for (const s of catalogStores) {
      const sName = String(s.name || '').toLowerCase();
      const sCode = String(s.code || s.id || '').toLowerCase();
      if (qLower.includes(sName) || qLower.includes(sCode)) {
        matchedStores.push(s);
      }
    }
    
    const storeCodes = ["POL", "KIN", "MCET", "UDM"];
    for (const code of storeCodes) {
      const name = getStoreName(code).toLowerCase();
      if (qLower.includes(code.toLowerCase()) || qLower.includes(name)) {
        if (!matchedStores.some(s => String(s.code || s.id).toUpperCase() === code)) {
          matchedStores.push({ code, name: getStoreName(code) });
        }
      }
    }

    if (matchedStores.length > 0) {
      matchedStores.forEach(s => {
        const code = String(s.code || s.id).toUpperCase();
        const sOrders = rawOrders.filter((o: any) => String(o.storeCode || o.storeId || '').toUpperCase() === code);
        matchedStoreOrders.push(...sOrders);
      });
    }

    // Find all matching employees
    for (const emp of allEmployees) {
      const firstName = String(emp.firstName || '').toLowerCase();
      const lastName = String(emp.lastName || '').toLowerCase();
      const fullName = `${firstName} ${lastName}`.trim();
      const empCode = String(emp.employeeId || emp.id || '').toLowerCase();
      
      if (
        (fullName.length > 2 && qLower.includes(fullName)) ||
        (firstName.length > 2 && qLower.includes(firstName)) ||
        qLower.includes(empCode)
      ) {
        matchedEmployees.push(emp);
      }
    }

    // Find all matching orders
    // Support matching by full order code (e.g. FZC01MG01OR0001), or by last 4 digits (e.g. 0001)
    const ordMatch = qLower.match(/\b(ord-\d+|\d{4,})\b/i);
    const fourDigitMatch = qLower.match(/\b\d{4}\b/);
    
    if (ordMatch || fourDigitMatch) {
      const matchTerm = ordMatch ? ordMatch[0] : fourDigitMatch![0];
      const matches = rawOrders.filter((o: any) => {
        const oNum = String(o.orderNumber || o.order_number || o.id || '').toLowerCase();
        return oNum.includes(matchTerm) || oNum.endsWith(matchTerm);
      });
      if (matches.length > 0) {
        matchedOrders.push(...matches.slice(0, 5));
      }
    } else {
      for (const o of rawOrders) {
        const orderNum = String(o.orderNumber || o.order_number || '').toLowerCase();
        if (orderNum && qLower.includes(orderNum)) {
          matchedOrders.push(o);
          break;
        }
      }
    }

    // If no entities matched the current query, carry over resolved entities from the previous user queries in history
    if (matchedCustomers.length === 0 && matchedStores.length === 0 && matchedEmployees.length === 0 && matchedOrders.length === 0) {
      if (Array.isArray(history) && history.length > 0) {
        const lastUserMsg = [...history].reverse().find((msg: any) => msg.sender === 'user' && typeof msg.text === 'string' && msg.text.trim().length > 0);
        if (lastUserMsg) {
          const prevQLower = lastUserMsg.text.toLowerCase();
          
          // Match customers:
          for (const c of sortedCustomers) {
            if (!c.name) continue;
            const cNameLower = c.name.toLowerCase();
            if (prevQLower.includes(cNameLower) || cNameLower.includes(prevQLower)) {
              matchedCustomers.push(c);
            } else {
              const queryWords = prevQLower.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
              const nameWords = cNameLower.split(/\s+/);
              const wordMatch = queryWords.some(qw => nameWords.some(nw => nw.startsWith(qw) || nw.includes(qw)));
              if (wordMatch) {
                matchedCustomers.push(c);
              }
            }
          }
          
          // Match stores:
          for (const s of catalogStores) {
            const sName = String(s.name || '').toLowerCase();
            const sCode = String(s.code || s.id || '').toLowerCase();
            if (prevQLower.includes(sName) || prevQLower.includes(sCode)) {
              matchedStores.push(s);
            }
          }
          for (const code of storeCodes) {
            const name = getStoreName(code).toLowerCase();
            if (prevQLower.includes(code.toLowerCase()) || prevQLower.includes(name)) {
              if (!matchedStores.some(s => String(s.code || s.id).toUpperCase() === code)) {
                matchedStores.push({ code, name: getStoreName(code) });
              }
            }
          }
          
          // Match employees:
          for (const emp of allEmployees) {
            const firstName = String(emp.firstName || '').toLowerCase();
            const lastName = String(emp.lastName || '').toLowerCase();
            const fullName = `${firstName} ${lastName}`.trim();
            const empCode = String(emp.employeeId || emp.id || '').toLowerCase();
            if (
              (fullName.length > 2 && prevQLower.includes(fullName)) ||
              (firstName.length > 2 && prevQLower.includes(firstName)) ||
              prevQLower.includes(empCode)
            ) {
              matchedEmployees.push(emp);
            }
          }
          
          // Match orders:
          const prevOrdMatch = prevQLower.match(/\b(ord-\d+|\d{4,})\b/i);
          const prevFourDigitMatch = prevQLower.match(/\b\d{4}\b/);
          if (prevOrdMatch || prevFourDigitMatch) {
            const prevMatchTerm = prevOrdMatch ? prevOrdMatch[0] : prevFourDigitMatch![0];
            const prevMatches = rawOrders.filter((o: any) => {
              const oNum = String(o.orderNumber || o.order_number || o.id || '').toLowerCase();
              return oNum.includes(prevMatchTerm) || oNum.endsWith(prevMatchTerm);
            });
            if (prevMatches.length > 0) {
              matchedOrders.push(...prevMatches.slice(0, 5));
            }
          }
        }
      }
    }

    // INTENT-BASED DYNAMIC FILTERING
    // 1. Dues/Credit intent
    const isCreditIntent = qLower.includes("owe") || qLower.includes("credit") || qLower.includes("due") || qLower.includes("outstanding") || qLower.includes("debt");
    let customersWithDues: any[] = [];
    if (isCreditIntent) {
      customersWithDues = allCustomers
        .filter(c => (Number(c.creditBalance || c.credit_balance) || 0) > 0)
        .sort((a, b) => (Number(b.creditBalance || b.credit_balance) || 0) - (Number(a.creditBalance || a.credit_balance) || 0));
    }

    // 2. Status intent
    const isPendingIntent = qLower.includes("pending");
    const isProcessingIntent = qLower.includes("processing") || qLower.includes("in progress") || qLower.includes("work");
    const isCompletedIntent = qLower.includes("completed") || qLower.includes("delivered") || qLower.includes("done");
    
    let filteredOrdersByStatus: any[] = [];
    let statusLabel = "";
    if (isPendingIntent) {
      filteredOrdersByStatus = rawOrders.filter(o => o.status === 'pending');
      statusLabel = "pending";
    } else if (isProcessingIntent) {
      filteredOrdersByStatus = rawOrders.filter(o => ['processing', 'assigned', 'ready_for_pickup', 'ready_for_transit', 'in_progress'].includes(o.status));
      statusLabel = "processing";
    } else if (isCompletedIntent) {
      filteredOrdersByStatus = rawOrders.filter(o => ['completed', 'delivered'].includes(o.status));
      statusLabel = "completed";
    }

    // 3. Timeframe intent
    const isTimeframeIntent = qLower.includes("last") || qLower.includes("recent") || qLower.includes("today") || qLower.includes("days");
    let filteredOrdersByTime: any[] = [];
    if (isTimeframeIntent) {
      const now = new Date();
      let limitDate = new Date();
      if (qLower.includes("today")) {
        limitDate.setDate(now.getDate() - 1);
      } else if (qLower.includes("7 days") || qLower.includes("week")) {
        limitDate.setDate(now.getDate() - 7);
      } else {
        limitDate.setDate(now.getDate() - 30);
      }
      filteredOrdersByTime = rawOrders.filter(o => o.createdAt && new Date(o.createdAt) >= limitDate);
    }

    // Format matched entity details to provide context
    const entityContext: any = {
      matchedCustomersCount: matchedCustomers.length,
      matchedCustomers: matchedCustomers.slice(0, 15).map(c => {
        const cOrders = rawOrders.filter(o => 
          String(o.customerId || '') === String(c.id || '') ||
          String(o.customerPhone || '') === String(c.phone || '')
        );
        const spent = cOrders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
        return {
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          creditBalance: c.creditBalance || c.credit_balance || 0,
          walletBalance: c.walletBalanceCache || c.wallet_balance_cache || 0,
          totalOrders: cOrders.length,
          totalSpent: spent
        };
      }),
      matchedCustomerOrdersCount: rawOrders.filter(o => matchedCustomers.some(c => 
        String(o.customerId || '') === String(c.id || '') ||
        String(o.customerPhone || '') === String(c.phone || '')
      )).length,
      matchedCustomerOrders: rawOrders
        .filter(o => matchedCustomers.some(c => 
          String(o.customerId || '') === String(c.id || '') ||
          String(o.customerPhone || '') === String(c.phone || '')
        ))
        .slice(0, 10)
        .map(o => ({
          orderNumber: o.orderNumber || o.order_number,
          customerName: o.customerName,
          totalAmount: o.totalAmount,
          status: o.status,
          createdAt: o.createdAt,
          items: parseOrderItems(o.items).slice(0, 5).map(item => `${item.quantity}x ${item.serviceName}`)
        })),
      matchedStores: matchedStores.map(s => {
        const sCode = String(s.code || s.id).toUpperCase();
        const sOrders = rawOrders.filter(o => String(o.storeCode || o.storeId || '').toUpperCase() === sCode);
        const activeOrders = sOrders.filter(o => o.status !== 'cancelled');
        const rev = activeOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
        return {
          name: s.name,
          code: sCode,
          totalOrders: sOrders.length,
          totalRevenue: rev,
          pendingOrders: activeOrders.filter(o => !isOrderComplete(o)).length,
          completedOrders: activeOrders.filter(isOrderComplete).length
        };
      }),
      matchedStoreOrdersCount: matchedStoreOrders.length,
      matchedStoreOrders: matchedStoreOrders
        .slice(0, 10)
        .map(o => ({
          orderNumber: o.orderNumber || o.order_number,
          customerName: o.customerName,
          totalAmount: o.totalAmount,
          status: o.status,
          createdAt: o.createdAt,
          items: parseOrderItems(o.items).slice(0, 5).map(item => `${item.quantity}x ${item.serviceName}`)
        })),
      matchedEmployees: matchedEmployees.map(emp => {
        const empId = String(emp.id || emp.employeeId || '');
        const empOrders = rawOrders.filter(o => String(o.employeeId || o.createdBy || o.assignedTo || '') === empId);
        const activeOrders = empOrders.filter(o => o.status !== 'cancelled');
        const rev = activeOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
        return {
          name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.name,
          role: emp.role,
          storeId: emp.storeId || emp.franchiseId,
          ordersHandled: empOrders.length,
          revenueTouched: rev,
          completionRate: empOrders.length > 0 
            ? (empOrders.filter(isOrderComplete).length / empOrders.length) * 100 
            : 0
        };
      }),
      matchedEmployeeOrdersCount: rawOrders.filter(o => matchedEmployees.some(emp => 
        String(o.employeeId || o.createdBy || o.assignedTo || '') === String(emp.id || emp.employeeId || '')
      )).length,
      matchedEmployeeOrders: rawOrders
        .filter(o => matchedEmployees.some(emp => 
          String(o.employeeId || o.createdBy || o.assignedTo || '') === String(emp.id || emp.employeeId || '')
        ))
        .slice(0, 10)
        .map(o => ({
          orderNumber: o.orderNumber || o.order_number,
          customerName: o.customerName,
          totalAmount: o.totalAmount,
          status: o.status,
          createdAt: o.createdAt,
          items: parseOrderItems(o.items).slice(0, 5).map(item => `${item.quantity}x ${item.serviceName}`)
        })),
      matchedOrders: matchedOrders.map(o => ({
        orderNumber: o.orderNumber || o.order_number,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        status: o.status,
        paymentStatus: o.paymentStatus || 'pending',
        totalAmount: o.totalAmount,
        createdAt: o.createdAt,
        pickupDate: o.pickupDate || o.dueDate,
        deliveredAt: o.deliveredAt,
        storeCode: o.storeCode,
        specialInstructions: o.specialInstructions || '',
        items: parseOrderItems(o.items).map(item => `${item.quantity}x ${item.serviceName} (₹${item.price})`)
      })),
      isCreditQuery: isCreditIntent,
      customersWithDuesCount: customersWithDues.length,
      customersWithDues: customersWithDues.slice(0, 10).map(c => ({
        name: c.name,
        phone: c.phone,
        creditBalance: c.creditBalance || c.credit_balance || 0
      })),
      isStatusQuery: filteredOrdersByStatus.length > 0,
      statusLabel,
      filteredOrdersByStatusCount: filteredOrdersByStatus.length,
      filteredOrdersByStatus: filteredOrdersByStatus.slice(0, 10).map(o => ({
        orderNumber: o.orderNumber || o.order_number,
        customerName: o.customerName,
        totalAmount: o.totalAmount,
        createdAt: o.createdAt,
        storeCode: o.storeCode
      })),
      isTimeframeQuery: filteredOrdersByTime.length > 0,
      filteredOrdersByTimeCount: filteredOrdersByTime.length,
      filteredOrdersByTime: filteredOrdersByTime.slice(0, 10).map(o => ({
        orderNumber: o.orderNumber || o.order_number,
        customerName: o.customerName,
        totalAmount: o.totalAmount,
        status: o.status,
        createdAt: o.createdAt
      }))
    };

    // Build the general reports overview over the last 365 days of operations
    const contextReq = {
      ...req,
      query: { days: "365" }
    };
    const reportData = await buildReportOverview(contextReq);

    // Format a concise JSON context for the prompt
    const dbSummary = {
      meta: {
        startDate: reportData.meta.startDate,
        endDate: reportData.meta.endDate,
        days: reportData.meta.days,
        scopedStore: reportData.meta.scopedStore
      },
      summary: {
        totalRevenue: reportData.summary.totalRevenue,
        totalOrders: reportData.summary.totalOrders,
        totalCustomers: reportData.summary.totalCustomers,
        totalEmployees: reportData.summary.totalEmployees,
        averageOrderValue: reportData.summary.averageOrderValue,
        completedOrders: reportData.summary.completedOrders,
        pendingOrders: reportData.summary.pendingOrders,
        creditOutstanding: reportData.summary.creditOutstanding,
        walletBalance: reportData.summary.walletBalance,
        completionRate: reportData.summary.completionRate
      },
      pnl: {
        revenue: reportData.pnl.revenue,
        totalExpenses: reportData.pnl.totalExpenses,
        netProfit: reportData.pnl.netProfit,
        profitMargin: reportData.pnl.profitMargin,
        expenseByCategory: reportData.pnl.expenseByCategory
      },
      franchisePerformance: reportData.franchisePerformance.map(f => ({
        storeName: f.storeName,
        franchiseCode: f.franchiseCode,
        totalRevenue: f.totalRevenue,
        totalOrders: f.totalOrders,
        avgOrderValue: f.avgOrderValue,
        pendingOrders: f.pendingOrders,
        creditOutstanding: f.creditOutstanding,
        topService: f.topService
      })),
      topServices: reportData.topServices.map(s => ({
        name: s.name,
        orderCount: s.orderCount,
        itemCount: s.itemCount,
        revenue: s.revenue,
        avgTicket: s.avgTicket,
        topStore: s.topStore
      })),
      topCustomers: reportData.topCustomers.map(c => ({
        customerName: c.customerName,
        orders: c.orders,
        revenue: c.revenue,
        creditBalance: c.creditBalance,
        topServices: c.topServices
      }))
    };

    // Calculate Monthly Comparison Context (Real-time analytics for the AI)
    const now = new Date();
    const { start: startOfToday } = getIstDayBounds(now);
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const last30DaysStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const lastMonthSameDay = new Date(now);
    lastMonthSameDay.setMonth(now.getMonth() - 1);
    if (lastMonthSameDay.getDate() !== now.getDate()) {
      lastMonthSameDay.setDate(0); // Last day of previous month
    }
    const lmsdStart = new Date(lastMonthSameDay.getFullYear(), lastMonthSameDay.getMonth(), lastMonthSameDay.getDate(), 0, 0, 0);
    const lmsdEnd = new Date(lastMonthSameDay.getFullYear(), lastMonthSameDay.getMonth(), lastMonthSameDay.getDate(), 23, 59, 59, 999);

    const activeOrders = rawOrders.filter((o: any) => o.status !== 'cancelled' && o.status !== 'refunded' && o.status !== 'deleted');
    
    const todayOrders = activeOrders.filter((o: any) => o.createdAt && new Date(o.createdAt) >= startOfToday);
    const todayRevenue = todayOrders.reduce((sum: number, o: any) => sum + toNumber(o.totalAmount), 0);
    
    const thisMonthOrders = activeOrders.filter((o: any) => o.createdAt && new Date(o.createdAt) >= startOfThisMonth);
    const thisMonthRevenue = thisMonthOrders.reduce((sum: number, o: any) => sum + toNumber(o.totalAmount), 0);
    
    const lmsdOrders = activeOrders.filter((o: any) => {
      const d = new Date(o.createdAt);
      return d >= lmsdStart && d <= lmsdEnd;
    });
    const lmsdRevenue = lmsdOrders.reduce((sum: number, o: any) => sum + toNumber(o.totalAmount), 0);
    
    const last30DaysOrders = activeOrders.filter((o: any) => o.createdAt && new Date(o.createdAt) >= last30DaysStart);
    const last30DaysRevenue = last30DaysOrders.reduce((sum: number, o: any) => sum + toNumber(o.totalAmount), 0);
    
    const newCustomersThisMonth = allCustomers.filter((c: any) => 
      c.createdAt && new Date(c.createdAt) >= startOfThisMonth
    ).length;
    const newCustomersLast30Days = allCustomers.filter((c: any) => 
      c.createdAt && new Date(c.createdAt) >= last30DaysStart
    ).length;
    const newCustomersToday = allCustomers.filter((c: any) => 
      c.createdAt && new Date(c.createdAt) >= startOfToday
    ).length;

    const getGrowth = (current: number, previous: number) => {
      if (previous > 0) return ((current - previous) / previous) * 100;
      return current > 0 ? 100 : 0;
    };

    const monthlyComparisons = {
      today: {
        revenue: todayRevenue,
        orders: todayOrders.length,
        newCustomers: newCustomersToday
      },
      lastMonthSameDay: {
        revenue: lmsdRevenue,
        orders: lmsdOrders.length,
        growthPercentage: parseFloat(getGrowth(todayRevenue, lmsdRevenue).toFixed(1)),
        growthDifference: todayRevenue - lmsdRevenue
      },
      thisMonth: {
        revenue: thisMonthRevenue,
        orders: thisMonthOrders.length,
        newCustomers: newCustomersThisMonth
      },
      last30Days: {
        revenue: last30DaysRevenue,
        orders: last30DaysOrders.length,
        newCustomers: newCustomersLast30Days
      }
    };

    let historyText = "";
    if (Array.isArray(history) && history.length > 0) {
      const actualHistory = history.filter((msg: any) => {
        if (!msg || typeof msg.text !== 'string') return false;
        if (msg.text.includes("Ask AI Reports Assistant") || msg.text.includes("Ask Ace Reports Assistant")) return false;
        return true;
      });

      if (actualHistory.length > 0) {
        historyText = actualHistory
          .slice(-8)
          .map((msg: any) => {
            const role = msg.sender === 'user' ? 'User' : 'Ace';
            return `${role}: ${msg.text}`;
          })
          .join('\n\n');
      }
    }

    let answer = "";
    
    // Check if Gemini is configured
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (geminiApiKey) {
      try {
        const prompt = `You are Ace, a professional, expert AI business intelligence analyst and customer support assistant for FabZClean dry cleaning and laundry franchise operations.
Use the live database summary metrics, real-time monthly growth comparisons, specific matched entity context, and conversation history below to answer the user's question.

Provide a rich, well-formatted, professional answer in markdown. You may use bullet points, bold text, and small markdown tables if appropriate to make the data easy to read.
Do not use top-level headers (# or ##). Start from ### if you need headers. Keep your answer highly accurate, clear, and focused on the data.

[Conversation History]
${historyText || "No previous messages in this session."}

[Live Database Summary (Last 365 Days)]
${JSON.stringify(dbSummary, null, 2)}

[Real-time Monthly Growth & Comparisons]
${JSON.stringify(monthlyComparisons, null, 2)}

[Matched Specific Entity Context (If customer/store/employee/order details matched from the query)]
${JSON.stringify(entityContext, null, 2)}

[User's Current Question]
${q}

Answer (as Ace):`;

        const llmResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(geminiApiKey)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.3 },
            }),
          }
        );

        if (llmResponse.ok) {
          const raw = await llmResponse.text();
          const envelope = JSON.parse(raw);
          const aiText = envelope?.candidates?.[0]?.content?.parts?.map((part: any) => part?.text || '').join('') || '';
          if (aiText) {
            answer = aiText.trim();
          }
        } else {
          const rawErr = await llmResponse.text();
          console.warn("Gemini call failed in Reports Q&A:", rawErr);
        }
      } catch (geminiError: any) {
        console.warn("Gemini Reports Q&A error, falling back to heuristics:", geminiError.message || geminiError);
      }
    }

    // Heuristic Fallback Engine
    if (!answer) {
      if (entityContext.matchedCustomersCount > 0) {
        const custList = entityContext.matchedCustomers
          .map((c: any) => `- **${c.name}** (Phone: ${c.phone || 'N/A'}, Credit: ₹${c.creditBalance}, Spent: ₹${Math.round(c.totalSpent).toLocaleString("en-IN")}, Orders: ${c.totalOrders})`)
          .join('\n');
        answer = `### 👤 Matched Customers (${entityContext.matchedCustomersCount})
I found the following customer profiles in the database matching your search:

${custList}

*Click on any customer in the Customers tab to view full details.*`;
      }
      else if (entityContext.isCreditQuery && entityContext.customersWithDuesCount > 0) {
        const dueList = entityContext.customersWithDues
          .map((c: any) => `- **${c.name}** (Phone: ${c.phone || 'N/A'}) owes **₹${Math.round(c.creditBalance).toLocaleString("en-IN")}**`)
          .join('\n');
        answer = `### 👥 Outstanding Customer Credits
There are **${entityContext.customersWithDuesCount}** customers with outstanding credit dues. Here are the top entries:

${dueList}

Total outstanding credit across the business is **₹${Math.round(dbSummary.summary.creditOutstanding).toLocaleString("en-IN")}**.`;
      }
      else if (entityContext.isStatusQuery && entityContext.filteredOrdersByStatusCount > 0) {
        const ordList = entityContext.filteredOrdersByStatus
          .map((o: any) => `- **${o.orderNumber}** for ${o.customerName} - ₹${o.totalAmount} (${o.storeCode}) - ${new Date(o.createdAt).toLocaleDateString('en-IN')}`)
          .join('\n');
        answer = `### 📦 Filtered Orders (${entityContext.statusLabel.toUpperCase()} - ${entityContext.filteredOrdersByStatusCount} total)
Here are the most recent orders with status **${entityContext.statusLabel}**:

${ordList}`;
      }
      else if (entityContext.matchedOrders.length > 0) {
        const ordersList = entityContext.matchedOrders.map((details: any) => {
          const dateStr = new Date(details.createdAt).toLocaleDateString('en-IN');
          const dueStr = details.pickupDate ? new Date(details.pickupDate).toLocaleDateString('en-IN') : 'N/A';
          const delivStr = details.deliveredAt ? new Date(details.deliveredAt).toLocaleDateString('en-IN') : null;
          
          return `### 📦 Order Details: ${details.orderNumber}
- **Customer**: ${details.customerName} (${details.customerPhone || 'No Phone'})
- **Store Location**: ${details.storeCode || 'N/A'}
- **Status**: **${details.status.toUpperCase()}**
- **Payment Status**: **${details.paymentStatus.toUpperCase()}**
- **Order Date**: ${dateStr}
- **Expected Due Date**: ${dueStr}
${delivStr ? `- **Delivered On**: ${delivStr}\n` : ''}- **Total Amount**: ₹${details.totalAmount}
- **Items**: ${details.items.join(', ') || 'None'}
${details.specialInstructions ? `- **Special Instructions**: ${details.specialInstructions}\n` : ''}`;
        }).join('\n\n---\n\n');
        
        answer = ordersList;
      }
      else if (entityContext.matchedStores.length > 0) {
        const storeList = entityContext.matchedStores
          .map((s: any) => `- **${s.name} (${s.code})**: ₹${Math.round(s.totalRevenue).toLocaleString("en-IN")} sales, ${s.totalOrders} orders, ${s.pendingOrders} pending backlog.`)
          .join('\n');
        answer = `### 🏪 Matched Store Analytics
I found stats for the following store(s) matching your query:

${storeList}`;
      }
      else if (entityContext.matchedEmployees.length > 0) {
        const empList = entityContext.matchedEmployees
          .map((e: any) => `- **${e.name}** (${e.role.replace(/_/g, ' ')}): Handled ${e.ordersHandled} orders, touched ₹${Math.round(e.revenueTouched).toLocaleString("en-IN")} revenue.`)
          .join('\n');
        answer = `### 👥 Matched Employee Output
I found the following staff profiles matching your query:

${empList}`;
      }
      else if (qLower.includes("revenue") || qLower.includes("sales") || qLower.includes("earn")) {
        const storeBreakdown = dbSummary.franchisePerformance
          .map(f => `- **${f.storeName}**: ₹${Math.round(f.totalRevenue).toLocaleString("en-IN")} (${f.totalOrders} orders)`)
          .join("\n");
        answer = `### 📊 Revenue Summary
Total revenue for the past year is **₹${Math.round(dbSummary.summary.totalRevenue).toLocaleString("en-IN")}** across **${dbSummary.summary.totalOrders}** orders, with an average ticket value of **₹${Math.round(dbSummary.summary.averageOrderValue)}**.

**Store Revenue Breakdown:**
${storeBreakdown}

*Note: Answers are calculated from live database entries.*`;
      } 
      else if (qLower.includes("profit") || qLower.includes("pnl") || qLower.includes("margin") || qLower.includes("expense")) {
        const expenseBreakdown = Object.entries(dbSummary.pnl.expenseByCategory)
          .map(([cat, amount]) => `- **${cat.replace(/_/g, ' ')}**: ₹${Math.round(amount).toLocaleString("en-IN")}`)
          .join("\n");
        answer = `### 💸 Profit & Loss (P&L) Overview
Here is the financial summary for the business over the past 365 days:
- **Total Revenue**: ₹${Math.round(dbSummary.pnl.revenue).toLocaleString("en-IN")}
- **Total Expenses**: ₹${Math.round(dbSummary.pnl.totalExpenses).toLocaleString("en-IN")}
- **Net Profit**: **₹${Math.round(dbSummary.pnl.netProfit).toLocaleString("en-IN")}**
- **Net Profit Margin**: **${dbSummary.pnl.profitMargin.toFixed(1)}%**

**Expense Breakdown:**
${expenseBreakdown || "No expenses recorded."}`;
      } 
      else if (qLower.includes("service") || qLower.includes("sell") || qLower.includes("popular")) {
        const servicesBreakdown = dbSummary.topServices.slice(0, 5)
          .map(s => `- **${s.name}**: ${s.orderCount} orders (${s.itemCount} items) generating ₹${Math.round(s.revenue).toLocaleString("en-IN")}`)
          .join("\n");
        answer = `### 🧺 Top Services Performance
The highest performing services based on orders and revenue are:

${servicesBreakdown}

The leading service overall is **${dbSummary.topServices[0]?.name || "N/A"}**.`;
      } 
      else if (qLower.includes("customer") || qLower.includes("credit") || qLower.includes("due")) {
        const customerList = dbSummary.topCustomers.slice(0, 5)
          .map(c => `- **${c.customerName}**: ${c.orders} orders, ₹${Math.round(c.revenue).toLocaleString("en-IN")} revenue (outstanding credit: ₹${Math.round(c.creditBalance)})`)
          .join("\n");
        answer = `### 👥 Customer Insights
- **Active Customers**: ${dbSummary.summary.totalCustomers}
- **Total Outstanding Credit**: **₹${Math.round(dbSummary.summary.creditOutstanding).toLocaleString("en-IN")}**
- **Wallet Balance Held**: ₹${Math.round(dbSummary.summary.walletBalance).toLocaleString("en-IN")}

**Top Customers by Value:**
${customerList}`;
      } 
      else if (qLower.includes("store") || qLower.includes("franchise") || qLower.includes("location")) {
        const storeList = dbSummary.franchisePerformance
          .map(f => `- **${f.storeName} (${f.franchiseCode})**: ₹${Math.round(f.totalRevenue).toLocaleString("en-IN")} revenue, ${f.totalOrders} orders, ₹${Math.round(f.creditOutstanding)} credit outstanding. Top Service: ${f.topService}`)
          .join("\n");
        answer = `### 🏪 Store & Franchise Performance
Performance summary for all configured locations:

${storeList}`;
      } 
      else {
        answer = `### 🤖 Ace Assistant Overview
I can answer detailed business intelligence and support queries about your dry cleaning franchise using live database statistics. E.g., try asking about:
- **Revenue & Sales**: "What is our store revenue breakdown?"
- **Finance & P&L**: "What are our total expenses and profit margins?"
- **Services**: "What is our best-selling service?"
- **Customers**: "Who are our top customers and how much credit is outstanding?"
- **Order Status**: "What is the status of order 0015?" (use any order number or last 4 digits)

**Quick Summary of Live Metrics (Last 365 Days):**
- **Total Revenue**: ₹${Math.round(dbSummary.summary.totalRevenue).toLocaleString("en-IN")}
- **Total Orders**: ${dbSummary.summary.totalOrders} (AOV: ₹${Math.round(dbSummary.summary.averageOrderValue)})
- **Completed Orders**: ${dbSummary.summary.completedOrders} (Completion Rate: ${dbSummary.summary.completionRate.toFixed(1)}%)
- **Pending backlogs**: ${dbSummary.summary.pendingOrders} active orders.`;
      }
    }

    await logReport(req, "reports_ask_ace", { question: q });
    res.json({ success: true, answer });

  } catch (error: any) {
    console.error("Reports Ask Ace error:", error);
    res.status(500).json({ success: false, message: "Failed to query Ask Ace", error: error.message });
  }
});

export default router;
