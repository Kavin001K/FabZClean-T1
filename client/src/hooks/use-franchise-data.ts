/**
 * ============================================================================
 * FRANCHISE DATA HOOK (SINGLE SOURCE OF TRUTH)
 * ============================================================================
 * 
 * This hook implements the "Single Source of Truth" pattern.
 * It pre-fetches critical data (Orders, Inventory, Customers) in the background
 * to ensure immediate availability when navigating between pages.
 * 
 * It also handles cross-page cache invalidation to keep the ecosystem in sync.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { customersApi, servicesApi, ordersApi } from "@/lib/data-service";

export function useFranchiseData() {
    const queryClient = useQueryClient();

    // 1. Pre-fetch critical data in parallel
    // using useQuery with a long staleTime to prevent redundant refetches
    // unless explicitly invalidated.

    const { data: services } = useQuery({
        queryKey: ['services'],
        queryFn: () => servicesApi.getAll(),
        staleTime: 10 * 60 * 1000, // 10 minutes
    });

    const { data: customers } = useQuery({
        queryKey: ['customers'],
        queryFn: () => customersApi.getAll(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const { data: inventory } = useQuery({
        queryKey: ['inventory'],
        queryFn: async () => {
            const res = await fetch('/api/inventory');
            if (!res.ok) throw new Error('Failed to fetch inventory');
            return res.json();
        },
        staleTime: 5 * 60 * 1000,
    });

    // 2. Intelligent Cache Invalidation Listeners
    // We can listen to specific mutation events globally if needed,
    // or provide utility functions here.

    // This hook effectively keeps the "cache warm" for these keys.

    return {
        services,
        customers,
        inventory,

        // Helper to invalidate ecosystem when an order is created
        invalidateEcosystem: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] }); // Creating order reduces stock
            queryClient.invalidateQueries({ queryKey: ['customers'] }); // Customer might have new lastVisited date
            queryClient.invalidateQueries({ queryKey: ['dashboard'] }); // Metrics change
        }
    };
}
