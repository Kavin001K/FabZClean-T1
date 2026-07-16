type OrderPrioritySource = {
  orderType?: unknown;
  order_type?: unknown;
  priority?: unknown;
  isExpressOrder?: unknown;
  is_express_order?: unknown;
};

export type OrderPriorityKind = "instant" | "express" | "priority" | "standard";

export type OrderPriorityInfo = {
  kind: OrderPriorityKind;
  isPriority: boolean;
  isInstant: boolean;
  isExpress: boolean;
  label: string;
  shortLabel: string;
  badgeClassName: string;
  rowClassName: string;
};

const normalize = (value: unknown) => String(value ?? "").trim().toLowerCase();

export const getOrderPriorityInfo = (order?: OrderPrioritySource | null): OrderPriorityInfo => {
  const orderType = normalize(order?.orderType ?? order?.order_type);
  const priority = normalize(order?.priority);
  const isExpressFlag = Boolean(order?.isExpressOrder || order?.is_express_order);

  const isInstant = orderType === "instant" || priority === "urgent";
  const isExpress = orderType === "express" || isExpressFlag;
  const isPriority = isInstant || isExpress || priority === "high";

  if (isInstant) {
    return {
      kind: "instant",
      isPriority: true,
      isInstant: true,
      isExpress: false,
      label: "Instant Priority Order",
      shortLabel: "INSTANT",
      badgeClassName: "bg-red-500 text-white border-red-400",
      rowClassName: "border-red-400/70 bg-red-500/10",
    };
  }

  if (isExpress) {
    return {
      kind: "express",
      isPriority: true,
      isInstant: false,
      isExpress: true,
      label: "Express Priority Order",
      shortLabel: "EXPRESS",
      badgeClassName: "bg-orange-500 text-white border-orange-400",
      rowClassName: "border-orange-400/70 bg-orange-500/10",
    };
  }

  if (isPriority) {
    return {
      kind: "priority",
      isPriority: true,
      isInstant: false,
      isExpress: false,
      label: "Priority Order",
      shortLabel: "PRIORITY",
      badgeClassName: "bg-amber-500 text-white border-amber-400",
      rowClassName: "border-amber-400/70 bg-amber-500/10",
    };
  }

  return {
    kind: "standard",
    isPriority: false,
    isInstant: false,
    isExpress: false,
    label: "Normal",
    shortLabel: "NORMAL",
    badgeClassName: "bg-blue-100 text-blue-800 border-blue-200",
    rowClassName: "",
  };
};

export const getOrderPriorityLabel = (order?: OrderPrioritySource | null) =>
  getOrderPriorityInfo(order).label;
