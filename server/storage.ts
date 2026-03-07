/**
 * Storage - Supabase Cloud Only
 * 
 * Exports SupabaseStorage as the single storage backend.
 * All data lives in Supabase PostgreSQL — zero local storage.
 */

import { type InsertAuditLog, type AuditLog } from "../shared/schema";

// ======= Driver Types (moved from SQLiteStorage) =======
export interface Driver {
  id: string;
  name: string;
  phone: string;
  email?: string;
  licenseNumber: string;
  vehicleNumber: string;
  vehicleType: 'bike' | 'car' | 'truck' | 'van';
  vehicleModel?: string;
  status: 'available' | 'busy' | 'offline' | 'on_break';
  rating: number;
  totalDeliveries: number;
  totalEarnings: number;
  currentLatitude?: number;
  currentLongitude?: number;
  lastActive?: string;
  experience: number;
  specialties?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface InsertDriver {
  name: string;
  phone: string;
  email?: string;
  licenseNumber: string;
  vehicleNumber: string;
  vehicleType: 'bike' | 'car' | 'truck' | 'van';
  vehicleModel?: string;
  status?: 'available' | 'busy' | 'offline' | 'on_break';
  rating?: number;
  totalDeliveries?: number;
  totalEarnings?: number;
  currentLatitude?: number;
  currentLongitude?: number;
  lastActive?: string;
  experience?: number;
  specialties?: string[];
}

// ======= IStorage Interface =======
export interface IStorage {
  // Driver methods
  createDriver(data: InsertDriver): Promise<Driver>;
  getDriver(id: string): Promise<Driver | null>;
  listDrivers(): Promise<Driver[]>;
  updateDriver(id: string, data: Partial<InsertDriver>): Promise<Driver | null>;
  deleteDriver(id: string): Promise<boolean>;
  getDriversByStatus(status: string): Promise<Driver[]>;
  updateDriverLocation(id: string, latitude: number, longitude: number): Promise<Driver | null>;

  // Customer methods
  createCustomer(data: any): Promise<any>;
  getCustomer(id: string): Promise<any | undefined>;
  updateCustomer(id: string, data: any): Promise<any | undefined>;
  deleteCustomer(id: string): Promise<boolean>;
  getCustomers(franchiseId?: string): Promise<any[]>;

  // Product methods
  createProduct(data: any): Promise<any>;
  getProduct(id: string): Promise<any | undefined>;
  updateProduct(id: string, data: any): Promise<any | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  getProducts(): Promise<any[]>;

  // Service methods
  createService(data: any): Promise<any>;
  getService(id: string): Promise<any | undefined>;
  updateService(id: string, data: any): Promise<any | undefined>;
  deleteService(id: string): Promise<boolean>;
  getServices(franchiseId?: string): Promise<any[]>;

  // Franchise methods
  createFranchise(data: any): Promise<any>;
  listFranchises(): Promise<any[]>;
  getFranchise(id: string): Promise<any | undefined>;
  updateFranchise(id: string, data: any): Promise<any | undefined>;

  // Task methods
  createTask(data: any): Promise<any>;
  listTasks(franchiseId?: string, employeeId?: string): Promise<any[]>;
  updateTask(id: string, data: any): Promise<any | undefined>;

  // Attendance methods
  createAttendance(data: any): Promise<any>;
  listAttendance(franchiseId?: string, employeeId?: string, date?: Date): Promise<any[]>;
  updateAttendance(id: string, data: any): Promise<any>;

  // Employee methods
  getEmployee(id: string): Promise<any | undefined>;
  getEmployeeByEmail(email: string): Promise<any | undefined>;
  createEmployee(data: any): Promise<any>;
  updateEmployee(id: string, data: any): Promise<any | undefined>;
  deleteEmployee(id: string, requesterId?: string, hardDelete?: boolean): Promise<boolean>;
  listEmployees(franchiseId?: string, factoryId?: string): Promise<any[]>;

  // Order methods
  listOrders(): Promise<any[]>;
  getOrder(id: string): Promise<any | undefined>;
  createOrder(data: any): Promise<any>;
  updateOrder(id: string, data: any): Promise<any | undefined>;
  getActiveOrders(): Promise<any[]>;
  getAnalyticsSummary(): Promise<any>;
  searchGlobal(query: string): Promise<any>;

  // Transit methods
  createTransitOrder(data: any): Promise<any>;
  getNextTransitId(franchiseId?: string, type?: string): Promise<string>;
  listTransitOrders(franchiseId?: string): Promise<any[]>;
  getTransitOrdersByStatus(status: string, franchiseId?: string): Promise<any[]>;
  updateTransitStatus(id: string, status: string, notes?: string, location?: string, updatedBy?: string): Promise<any>;

  // Credit methods
  getCustomerCreditHistory(customerId: string): Promise<any[]>;
  getGlobalCreditHistory(limit?: number): Promise<any[]>;

  // Audit Log methods
  createAuditLog(data: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(params: any): Promise<{ data: AuditLog[]; count: number }>;
}

// ======= Export Supabase as the ONLY storage =======
import { SupabaseStorage } from "./SupabaseStorage";

export const storage: IStorage = new SupabaseStorage() as any;
