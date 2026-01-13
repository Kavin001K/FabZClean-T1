// ========================================
// BACKEND: Franchise ID System Integration
// File: server/services/id-generator.ts
// ========================================

import { storage } from '../SupabaseStorage';

/**
 * ID Generator Service
 * Handles all franchise-based ID generation
 */
export class IDGeneratorService {

    /**
     * Generate Franchise Code
     * Format: FZC[NN]
     */
    static async generateFranchiseCode(): Promise<string> {
        const { data, error } = await storage.supabase
            .rpc('generate_franchise_code');

        if (error) throw new Error(`Failed to generate franchise code: ${error.message}`);
        return data;
    }

    /**
     * Generate Employee Code
     * Format: [FRANCHISE_CODE][ROLE][NN]
     * Examples: FZC01MG01, FZC01EM01, FZC01DR01
     */
    static async generateEmployeeCode(
        franchiseId: string,
        role: string
    ): Promise<string> {
        const { data, error } = await storage.supabase
            .rpc('generate_employee_code', {
                p_franchise_id: franchiseId,
                p_role: role
            });

        if (error) throw new Error(`Failed to generate employee code: ${error.message}`);
        return data;
    }

    /**
     * Generate Order Code
     * Format: [EMPLOYEE_CODE]OR[NNNN]
     * Example: FZC01MG01OR0001
     */
    static async generateOrderCode(
        employeeId: string,
        franchiseId: string
    ): Promise<string> {
        const { data, error } = await storage.supabase
            .rpc('generate_order_code', {
                p_employee_id: employeeId,
                p_franchise_id: franchiseId
            });

        if (error) throw new Error(`Failed to generate order code: ${error.message}`);
        return data;
    }

    /**
     * Generate Customer Code
     * Format: [FRANCHISE_CODE]CU[NNNN]
     * Example: FZC01CU0001
     */
    static async generateCustomerCode(franchiseId: string): Promise<string> {
        const { data, error } = await storage.supabase
            .rpc('generate_customer_code', {
                p_franchise_id: franchiseId
            });

        if (error) throw new Error(`Failed to generate customer code: ${error.message}`);
        return data;
    }

    /**
     * Generate Service Code
     * Format: [FRANCHISE_CODE]SV[NNNN]
     * Example: FZC01SV0001
     */
    static async generateServiceCode(franchiseId: string): Promise<string> {
        const { data, error } = await storage.supabase
            .rpc('generate_service_code', {
                p_franchise_id: franchiseId
            });

        if (error) throw new Error(`Failed to generate service code: ${error.message}`);
        return data;
    }

    /**
     * Parse Order Code
     * Extracts franchise, employee, and order number from code
     */
    static parseOrderCode(orderCode: string): {
        franchiseCode: string;
        employeeCode: string;
        orderNumber: number;
    } {
        // FZC01MG01OR0001
        const franchiseCode = orderCode.substring(0, 5); // FZC01
        const employeeCode = orderCode.substring(0, 12); // FZC01MG01
        const orderNumber = parseInt(orderCode.substring(14)); // 0001

        return {
            franchiseCode,
            employeeCode,
            orderNumber
        };
    }

    /**
     * Parse Employee Code
     * Extracts franchise and role from employee code
     */
    static parseEmployeeCode(employeeCode: string): {
        franchiseCode: string;
        roleCode: string;
        employeeNumber: number;
    } {
        // FZC01MG01
        const franchiseCode = employeeCode.substring(0, 5); // FZC01
        const roleCode = employeeCode.substring(5, 7); // MG
        const employeeNumber = parseInt(employeeCode.substring(7)); // 01

        return {
            franchiseCode,
            roleCode,
            employeeNumber
        };
    }

    /**
     * Get Role Name from Code
     */
    static getRoleFromCode(roleCode: string): string {
        const roleMap: Record<string, string> = {
            'MG': 'franchise_manager',
            'EM': 'employee',
            'DR': 'driver',
            'CS': 'staff'
        };
        return roleMap[roleCode] || 'employee';
    }

    /**
     * Get Role Code from Role Name
     */
    static getRoleCode(role: string): string {
        const codeMap: Record<string, string> = {
            'franchise_manager': 'MG',
            'employee': 'EM',
            'driver': 'DR',
            'staff': 'CS'
        };
        return codeMap[role] || 'EM';
    }

    /**
     * Validate Code Format
     */
    static validateFranchiseCode(code: string): boolean {
        return /^FZC\d{2}$/.test(code);
    }

    static validateEmployeeCode(code: string): boolean {
        return /^FZC\d{2}(MG|EM|DR|CS)\d{2}$/.test(code);
    }

    static validateOrderCode(code: string): boolean {
        return /^FZC\d{2}(MG|EM|DR|CS)\d{2}OR\d{4}$/.test(code);
    }

    static validateCustomerCode(code: string): boolean {
        return /^FZC\d{2}CU\d{4}$/.test(code);
    }
}

// ========================================
// USAGE EXAMPLES
// ========================================

/*
// Create new franchise
const franchiseCode = await IDGeneratorService.generateFranchiseCode();
// Returns: "FZC03"

// Create new employee
const employeeCode = await IDGeneratorService.generateEmployeeCode(
  franchiseId,
  'franchise_manager'
);
// Returns: "FZC01MG02"

// Create new order
const orderCode = await IDGeneratorService.generateOrderCode(
  employeeId,
  franchiseId
);
// Returns: "FZC01MG01OR0015"

// Parse order code
const parsed = IDGeneratorService.parseOrderCode("FZC01MG01OR0015");
// Returns: {
//   franchiseCode: "FZC01",
//   employeeCode: "FZC01MG01",
//   orderNumber: 15
// }

// Validate codes
const isValid = IDGeneratorService.validateOrderCode("FZC01MG01OR0001");
// Returns: true
*/
