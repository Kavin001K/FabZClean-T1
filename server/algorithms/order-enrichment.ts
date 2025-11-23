/**
 * Order Enrichment Algorithms
 * Processes order data combined with external API data to enhance responses
 */

export interface OrderEnrichmentData {
  order: any;
  externalData?: any;
}

export interface OrderPriorityFactors {
  urgencyScore: number;
  customerTier: string;
  orderValue: number;
  orderAge: number;
  paymentStatus: string;
  customerLifetimeValue?: number;
}

/**
 * Calculate order priority based on multiple factors
 * Combines internal and external data to determine priority level
 */
export function calculateOrderPriority(data: OrderEnrichmentData): string {
  const { order, externalData } = data;

  // Extract priority factors
  const factors: OrderPriorityFactors = {
    urgencyScore: externalData?.urgencyLevel || 0,
    customerTier: externalData?.customerTier || 'standard',
    orderValue: parseFloat(order.totalAmount || '0'),
    orderAge: Date.now() - new Date(order.createdAt).getTime(),
    paymentStatus: order.paymentStatus || 'pending',
    customerLifetimeValue: externalData?.customerLifetimeValue,
  };

  // Convert order age to hours
  const hoursSinceCreation = factors.orderAge / (1000 * 60 * 60);
  factors.orderAge = hoursSinceCreation;

  // Calculate priority score
  let priorityScore = 0;

  // Urgency score from external API (high weight)
  priorityScore += factors.urgencyScore * 10;

  // Customer tier (premium customers get priority boost)
  if (factors.customerTier === 'premium') {
    priorityScore += 20;
  } else if (factors.customerTier === 'regular') {
    priorityScore += 10;
  }

  // High-value orders get priority boost
  if (factors.orderValue > 10000) {
    priorityScore += 15;
  } else if (factors.orderValue > 5000) {
    priorityScore += 10;
  }

  // Older orders get priority boost
  if (factors.orderAge > 48) {
    priorityScore += 20;
  } else if (factors.orderAge > 24) {
    priorityScore += 10;
  }

  // Paid orders get slightly lower priority than unpaid
  if (factors.paymentStatus === 'paid') {
    priorityScore -= 5;
  }

  // Customer lifetime value bonus
  if (factors.customerLifetimeValue && factors.customerLifetimeValue > 100000) {
    priorityScore += 15;
  }

  // Determine final priority
  let priority: string;

  if (priorityScore >= 50) {
    priority = 'high';
  } else if (priorityScore >= 30) {
    priority = 'medium';
  } else if (priorityScore >= 15) {
    priority = 'normal';
  } else {
    priority = 'low';
  }

  return priority;
}

/**
 * Enrich order with external data and algorithm processing
 */
export function enrichOrderWithAlgorithms(
  order: any,
  externalData?: any
): any {
  const priority = calculateOrderPriority({ order, externalData });

  // Calculate urgency based on order age and status
  const orderAge = Date.now() - new Date(order.createdAt).getTime();
  const hoursSinceCreation = orderAge / (1000 * 60 * 60);
  
  let urgency = 'normal';
  if (hoursSinceCreation > 72) {
    urgency = 'critical';
  } else if (hoursSinceCreation > 48) {
    urgency = 'high';
  } else if (hoursSinceCreation > 24) {
    urgency = 'medium';
  }

  // Enhanced order object with algorithm outputs
  return {
    ...order,
    priority,
    urgency,
    externalData: externalData || null,
    enrichedAt: new Date().toISOString(),
    algorithmMetadata: {
      calculatedAt: new Date().toISOString(),
      enrichmentVersion: '1.0',
      priorityLevel: priority,
      urgencyLevel: urgency,
    },
  };
}

/**
 * Batch enrich multiple orders
 */
export function enrichOrdersWithAlgorithms(
  orders: any[],
  externalDataMap: Map<string, any> = new Map()
): any[] {
  return orders.map((order) => {
    const externalData = externalDataMap.get(order.id) || undefined;
    return enrichOrderWithAlgorithms(order, externalData);
  });
}

/**
 * Calculate order score for sorting and filtering
 */
export function calculateOrderScore(order: any, externalData?: any): number {
  const priority = calculateOrderPriority({ order, externalData });
  const priorityScores: Record<string, number> = {
    critical: 100,
    high: 75,
    medium: 50,
    normal: 25,
    low: 0,
  };

  return priorityScores[priority] || 0;
}

