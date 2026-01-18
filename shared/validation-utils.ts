/**
 * Data Validation and Integrity Check Utilities
 *
 * This module provides comprehensive validation functions for ensuring data integrity
 * throughout the application. It includes validation for business entities, inputs,
 * and data consistency checks.
 */

import { validateGSTIN } from './gst-utils';

// ============================================================================
// Type Definitions
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidationRule<T> {
  field: keyof T;
  validator: (value: any, data?: T) => ValidationResult;
  required?: boolean;
}

// ============================================================================
// Basic Validators
// ============================================================================

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
    return { isValid: false, errors, warnings };
  }

  const trimmedEmail = email.trim();

  if (trimmedEmail.length === 0) {
    errors.push('Email cannot be empty');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    errors.push('Invalid email format');
  }

  // Check for common typos
  const commonTypos = ['gmial.com', 'gmai.com', 'yahooo.com', 'hotmial.com'];
  const domain = trimmedEmail.split('@')[1];
  if (domain && commonTypos.some(typo => domain.includes(typo))) {
    warnings.push('Possible typo in email domain');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate Indian mobile number
 */
export function validateIndianMobile(mobile: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!mobile || typeof mobile !== 'string') {
    errors.push('Mobile number is required');
    return { isValid: false, errors, warnings };
  }

  // Remove spaces, hyphens, and plus signs
  const cleanedMobile = mobile.replace(/[\s\-+]/g, '');

  // Check if it's a valid Indian mobile number
  const indianMobileRegex = /^(?:(?:\+|0{0,2})91)?[6-9]\d{9}$/;

  if (!indianMobileRegex.test(cleanedMobile)) {
    errors.push('Invalid Indian mobile number. Must be 10 digits starting with 6-9');
  }

  // Check length
  const digitsOnly = cleanedMobile.replace(/\D/g, '');
  if (digitsOnly.length < 10) {
    errors.push('Mobile number must be at least 10 digits');
  } else if (digitsOnly.length > 13) {
    errors.push('Mobile number is too long');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate non-empty string
 */
export function validateRequiredString(value: string, fieldName: string, minLength: number = 1, maxLength: number = 1000): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!value || typeof value !== 'string') {
    errors.push(`${fieldName} is required`);
    return { isValid: false, errors, warnings };
  }

  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    errors.push(`${fieldName} cannot be empty`);
  }

  if (trimmedValue.length < minLength) {
    errors.push(`${fieldName} must be at least ${minLength} characters`);
  }

  if (trimmedValue.length > maxLength) {
    errors.push(`${fieldName} cannot exceed ${maxLength} characters`);
  }

  // Check for suspicious patterns
  if (trimmedValue.match(/[<>\"']/)) {
    warnings.push(`${fieldName} contains special characters that might cause issues`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate positive number
 */
export function validatePositiveNumber(value: number, fieldName: string, min: number = 0, max: number = Number.MAX_SAFE_INTEGER): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (typeof value !== 'number' || isNaN(value)) {
    errors.push(`${fieldName} must be a valid number`);
    return { isValid: false, errors, warnings };
  }

  if (value < min) {
    errors.push(`${fieldName} must be at least ${min}`);
  }

  if (value > max) {
    errors.push(`${fieldName} cannot exceed ${max}`);
  }

  if (!Number.isFinite(value)) {
    errors.push(`${fieldName} must be a finite number`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate date
 */
export function validateDate(dateString: string, fieldName: string, minDate?: Date, maxDate?: Date): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!dateString || typeof dateString !== 'string') {
    errors.push(`${fieldName} is required`);
    return { isValid: false, errors, warnings };
  }

  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    errors.push(`${fieldName} is not a valid date`);
    return { isValid: false, errors, warnings };
  }

  if (minDate && date < minDate) {
    errors.push(`${fieldName} cannot be before ${minDate.toLocaleDateString('en-IN')}`);
  }

  if (maxDate && date > maxDate) {
    errors.push(`${fieldName} cannot be after ${maxDate.toLocaleDateString('en-IN')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// Business Entity Validators
// ============================================================================

/**
 * Validate customer data
 */
export function validateCustomer(customer: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate name
  const nameValidation = validateRequiredString(customer.name, 'Customer name', 2, 100);
  errors.push(...nameValidation.errors);
  warnings.push(...nameValidation.warnings);

  // Validate phone
  const phoneValidation = validateIndianMobile(customer.phone);
  errors.push(...phoneValidation.errors);
  warnings.push(...phoneValidation.warnings);

  // Validate email (optional but should be valid if provided)
  if (customer.email) {
    const emailValidation = validateEmail(customer.email);
    errors.push(...emailValidation.errors);
    warnings.push(...emailValidation.warnings);
  }

  // Validate address (optional)
  if (customer.address) {
    const addressValidation = validateRequiredString(customer.address, 'Address', 5, 500);
    errors.push(...addressValidation.errors);
    warnings.push(...addressValidation.warnings);
  }

  // Validate GSTIN if provided
  if (customer.gstin) {
    if (!validateGSTIN(customer.gstin)) {
      errors.push('Invalid GSTIN format');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate order data
 */
export function validateOrder(order: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate customer ID
  if (!order.customerId) {
    errors.push('Customer ID is required');
  }

  // Validate service
  if (!order.service || !order.service.id) {
    errors.push('Service is required');
  }

  // Validate items
  if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
    errors.push('Order must have at least one item');
  } else {
    order.items.forEach((item: any, index: number) => {
      const itemValidation = validateOrderItem(item);
      itemValidation.errors.forEach(err => errors.push(`Item ${index + 1}: ${err}`));
      itemValidation.warnings.forEach(warn => warnings.push(`Item ${index + 1}: ${warn}`));
    });
  }

  // Validate pickup date
  if (order.pickupDate) {
    const pickupValidation = validateDate(order.pickupDate, 'Pickup date');
    errors.push(...pickupValidation.errors);
    warnings.push(...pickupValidation.warnings);
  }

  // Validate delivery date
  if (order.deliveryDate && order.pickupDate) {
    const deliveryDate = new Date(order.deliveryDate);
    const pickupDate = new Date(order.pickupDate);

    if (deliveryDate < pickupDate) {
      errors.push('Delivery date cannot be before pickup date');
    }
  }

  // Validate total amount
  const amountValidation = validatePositiveNumber(order.totalAmount || 0, 'Total amount', 0);
  errors.push(...amountValidation.errors);

  // Check if calculated total matches provided total
  if (order.items && order.items.length > 0) {
    const calculatedTotal = order.items.reduce((sum: number, item: any) => {
      return sum + (item.quantity * item.price);
    }, 0);

    if (Math.abs(calculatedTotal - (order.totalAmount || 0)) > 0.01) {
      warnings.push('Order total does not match sum of item prices');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate order item
 */
export function validateOrderItem(item: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate name/description
  if (!item.name && !item.description) {
    errors.push('Item name or description is required');
  }

  // Validate quantity
  const quantityValidation = validatePositiveNumber(item.quantity || 0, 'Quantity', 1, 1000);
  errors.push(...quantityValidation.errors);

  // Validate price
  const priceValidation = validatePositiveNumber(item.price || 0, 'Price', 0);
  errors.push(...priceValidation.errors);

  // Validate total
  if (item.quantity && item.price) {
    const expectedTotal = item.quantity * item.price;
    if (item.total && Math.abs(item.total - expectedTotal) > 0.01) {
      warnings.push('Item total does not match quantity × price');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate service data
 */
export function validateService(service: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate name
  const nameValidation = validateRequiredString(service.name, 'Service name', 2, 100);
  errors.push(...nameValidation.errors);
  warnings.push(...nameValidation.warnings);

  // Validate price
  const priceValidation = validatePositiveNumber(service.price || 0, 'Service price', 0);
  errors.push(...priceValidation.errors);

  // Validate duration
  if (service.duration !== undefined) {
    const durationValidation = validatePositiveNumber(service.duration, 'Service duration', 0, 30);
    errors.push(...durationValidation.errors);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// Data Integrity Checks
// ============================================================================

/**
 * Check data consistency between related entities
 */
export function checkDataConsistency(data: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for duplicate IDs
  if (data.customers && Array.isArray(data.customers)) {
    const customerIds = data.customers.map((c: any) => c.id);
    const duplicateIds = customerIds.filter((id: string, index: number) => customerIds.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      errors.push(`Duplicate customer IDs found: ${duplicateIds.join(', ')}`);
    }
  }

  // Check for orphaned orders
  if (data.orders && Array.isArray(data.orders) && data.customers && Array.isArray(data.customers)) {
    const customerIds = new Set(data.customers.map((c: any) => c.id));
    const orphanedOrders = data.orders.filter((o: any) => !customerIds.has(o.customerId));
    if (orphanedOrders.length > 0) {
      errors.push(`${orphanedOrders.length} orders have invalid customer references`);
    }
  }

  // Check for invalid references in orders
  if (data.orders && Array.isArray(data.orders) && data.services && Array.isArray(data.services)) {
    const serviceIds = new Set(data.services.map((s: any) => s.id));
    const ordersWithInvalidService = data.orders.filter((o: any) => o.serviceId && !serviceIds.has(o.serviceId));
    if (ordersWithInvalidService.length > 0) {
      errors.push(`${ordersWithInvalidService.length} orders have invalid service references`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Sanitize input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');

  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Escape special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  return sanitized.trim();
}

/**
 * Validate and sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'object' ? sanitizeObject(item) :
        typeof item === 'string' ? sanitizeInput(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

// ============================================================================
// Export helper function
// ============================================================================

/**
 * Combine multiple validation results
 */
export function combineValidationResults(...results: ValidationResult[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  results.forEach(result => {
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
