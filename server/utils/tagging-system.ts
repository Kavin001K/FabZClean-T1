import type { Order, Garment, OrderItem } from "../../shared/schema";

export interface AutoTag {
  id: string;
  name: string;
  color: string;
  category: "urgency" | "fabric" | "service" | "condition" | "price" | "special";
  rules: TagRule[];
  priority: number; // Higher priority tags override lower ones
}

export interface TagRule {
  field: string;
  operator: "equals" | "contains" | "greater_than" | "less_than" | "in_array";
  value: any;
  weight: number; // Rule strength for fuzzy matching
}

export interface TagSuggestion {
  tag: AutoTag;
  confidence: number;
  reasons: string[];
}

export class AutoTaggingSystem {
  private tags: AutoTag[] = [
    // Urgency Tags
    {
      id: "urgent",
      name: "Urgent",
      color: "#ef4444",
      category: "urgency",
      priority: 10,
      rules: [
        { field: "urgency", operator: "equals", value: "urgent", weight: 1.0 },
        { field: "specialInstructions", operator: "contains", value: "urgent", weight: 0.8 },
        { field: "specialInstructions", operator: "contains", value: "asap", weight: 0.8 },
      ]
    },
    {
      id: "same_day",
      name: "Same Day",
      color: "#f97316",
      category: "urgency",
      priority: 9,
      rules: [
        { field: "estimatedCompletion", operator: "less_than", value: 24, weight: 1.0 }, // within 24 hours
        { field: "specialInstructions", operator: "contains", value: "same day", weight: 0.9 },
      ]
    },

    // Fabric Tags
    {
      id: "delicate",
      name: "Delicate",
      color: "#8b5cf6",
      category: "fabric",
      priority: 8,
      rules: [
        { field: "fabric", operator: "in_array", value: ["silk", "cashmere", "wool", "lace"], weight: 1.0 },
        { field: "specialCare", operator: "contains", value: "delicate", weight: 0.9 },
        { field: "condition", operator: "equals", value: "damaged", weight: 0.7 },
      ]
    },
    {
      id: "luxury",
      name: "Luxury",
      color: "#facc15",
      category: "price",
      priority: 7,
      rules: [
        { field: "priceCategory", operator: "equals", value: "luxury", weight: 1.0 },
        { field: "brand", operator: "in_array", value: ["Armani", "Gucci", "Prada", "Versace"], weight: 0.9 },
        { field: "unitPrice", operator: "greater_than", value: 1000, weight: 0.8 },
      ]
    },

    // Service Tags
    {
      id: "dry_clean_only",
      name: "Dry Clean Only",
      color: "#06b6d4",
      category: "service",
      priority: 9,
      rules: [
        { field: "specialCare", operator: "contains", value: "dry clean only", weight: 1.0 },
        { field: "fabric", operator: "in_array", value: ["wool", "silk", "leather"], weight: 0.8 },
      ]
    },
    {
      id: "stain_treatment",
      name: "Stain Treatment",
      color: "#dc2626",
      category: "service",
      priority: 8,
      rules: [
        { field: "stainDetails", operator: "contains", value: "", weight: 1.0 }, // has any stain details
        { field: "specialInstructions", operator: "contains", value: "stain", weight: 0.9 },
      ]
    },

    // Condition Tags
    {
      id: "damaged",
      name: "Needs Repair",
      color: "#dc2626",
      category: "condition",
      priority: 9,
      rules: [
        { field: "condition", operator: "equals", value: "damaged", weight: 1.0 },
        { field: "damageNotes", operator: "contains", value: "", weight: 0.9 }, // has damage notes
      ]
    },

    // Weight-based Tags
    {
      id: "bulk_order",
      name: "Bulk Order",
      color: "#059669",
      category: "special",
      priority: 6,
      rules: [
        { field: "totalPieces", operator: "greater_than", value: 20, weight: 1.0 },
        { field: "totalWeight", operator: "greater_than", value: 10, weight: 0.8 }, // 10kg+
      ]
    },
    {
      id: "heavy_items",
      name: "Heavy Items",
      color: "#7c2d12",
      category: "special",
      priority: 5,
      rules: [
        { field: "weight", operator: "greater_than", value: 2, weight: 1.0 }, // per item > 2kg
        { field: "category", operator: "in_array", value: ["curtains", "comforters", "carpets"], weight: 0.9 },
      ]
    }
  ];

  /**
   * Generate automated tags for an order
   */
  public generateOrderTags(order: Order, orderItems?: OrderItem[]): TagSuggestion[] {
    const suggestions: TagSuggestion[] = [];

    for (const tag of this.tags) {
      const { confidence, reasons } = this.evaluateTagRules(tag, order, orderItems);

      if (confidence > 0.5) { // Only suggest tags with >50% confidence
        suggestions.push({
          tag,
          confidence,
          reasons
        });
      }
    }

    // Sort by confidence and priority
    return suggestions.sort((a, b) => {
      if (Math.abs(a.confidence - b.confidence) < 0.1) {
        return b.tag.priority - a.tag.priority;
      }
      return b.confidence - a.confidence;
    });
  }

  /**
   * Generate automated tags for a garment
   */
  public generateGarmentTags(garment: Garment): TagSuggestion[] {
    const suggestions: TagSuggestion[] = [];

    for (const tag of this.tags) {
      const { confidence, reasons } = this.evaluateTagRules(tag, garment);

      if (confidence > 0.5) {
        suggestions.push({
          tag,
          confidence,
          reasons
        });
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Evaluate tag rules against an object
   */
  private evaluateTagRules(tag: AutoTag, obj: any, relatedObjects?: any[]): { confidence: number; reasons: string[] } {
    let totalWeight = 0;
    let matchedWeight = 0;
    const reasons: string[] = [];

    for (const rule of tag.rules) {
      totalWeight += rule.weight;

      const fieldValue = this.getFieldValue(obj, rule.field, relatedObjects);
      const matches = this.evaluateRule(rule, fieldValue);

      if (matches) {
        matchedWeight += rule.weight;
        reasons.push(`${rule.field} ${rule.operator} ${rule.value}`);
      }
    }

    const confidence = totalWeight > 0 ? matchedWeight / totalWeight : 0;
    return { confidence, reasons };
  }

  /**
   * Get field value, handling nested objects and arrays
   */
  private getFieldValue(obj: any, field: string, relatedObjects?: any[]): any {
    // Handle special cases for related objects
    if (relatedObjects && field.includes('.')) {
      const [objType, fieldName] = field.split('.');
      // Implementation would depend on your specific object structure
    }

    // Handle dot notation for nested fields
    if (field.includes('.')) {
      return field.split('.').reduce((current, key) => current?.[key], obj);
    }

    return obj?.[field];
  }

  /**
   * Evaluate a single rule
   */
  private evaluateRule(rule: TagRule, value: any): boolean {
    if (value === undefined || value === null) {
      return false;
    }

    switch (rule.operator) {
      case "equals":
        return value === rule.value;

      case "contains":
        if (typeof value === 'string') {
          return value.toLowerCase().includes(String(rule.value).toLowerCase());
        }
        if (Array.isArray(value)) {
          return value.includes(rule.value);
        }
        return false;

      case "greater_than":
        return Number(value) > Number(rule.value);

      case "less_than":
        return Number(value) < Number(rule.value);

      case "in_array":
        if (!Array.isArray(rule.value)) {
          return false;
        }
        return rule.value.includes(value);

      default:
        return false;
    }
  }

  /**
   * Add a custom tag rule
   */
  public addCustomTag(tag: AutoTag): void {
    this.tags.push(tag);
    this.tags.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get smart pricing suggestions based on tags
   */
  public getPricingSuggestions(tags: TagSuggestion[], basePrice: number): {
    adjustedPrice: number;
    adjustments: Array<{ reason: string; multiplier: number; }>;
  } {
    let multiplier = 1.0;
    const adjustments: Array<{ reason: string; multiplier: number; }> = [];

    for (const { tag, confidence } of tags) {
      let tagMultiplier = 1.0;

      switch (tag.id) {
        case "urgent":
          tagMultiplier = 1.5;
          break;
        case "same_day":
          tagMultiplier = 1.3;
          break;
        case "luxury":
          tagMultiplier = 1.2;
          break;
        case "delicate":
          tagMultiplier = 1.15;
          break;
        case "damaged":
          tagMultiplier = 1.25;
          break;
        case "stain_treatment":
          tagMultiplier = 1.1;
          break;
        case "bulk_order":
          tagMultiplier = 0.9; // discount for bulk
          break;
      }

      if (tagMultiplier !== 1.0) {
        const effectiveMultiplier = 1 + ((tagMultiplier - 1) * confidence);
        multiplier *= effectiveMultiplier;
        adjustments.push({
          reason: tag.name,
          multiplier: effectiveMultiplier
        });
      }
    }

    return {
      adjustedPrice: Math.round(basePrice * multiplier * 100) / 100,
      adjustments
    };
  }

  /**
   * Get estimated completion time based on tags
   */
  public getEstimatedCompletion(tags: TagSuggestion[], baseHours: number = 24): {
    estimatedHours: number;
    factors: string[];
  } {
    let hours = baseHours;
    const factors: string[] = [];

    for (const { tag, confidence } of tags) {
      switch (tag.id) {
        case "urgent":
          hours = Math.min(hours, 4);
          factors.push("Urgent priority - expedited processing");
          break;
        case "same_day":
          hours = Math.min(hours, 8);
          factors.push("Same day service requested");
          break;
        case "delicate":
          hours *= 1.5;
          factors.push("Delicate items require extra care");
          break;
        case "damaged":
          hours *= 2;
          factors.push("Repair work needed");
          break;
        case "stain_treatment":
          hours *= 1.3;
          factors.push("Stain treatment required");
          break;
        case "bulk_order":
          hours *= 1.2;
          factors.push("Large order volume");
          break;
      }
    }

    return {
      estimatedHours: Math.round(hours),
      factors
    };
  }
}

// Export singleton instance
export const autoTaggingSystem = new AutoTaggingSystem();