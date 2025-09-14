import { useState, useEffect, useMemo } from 'react';
import { ordersApi, customersApi, inventoryApi } from '@/lib/data-service';
import type { Order, Customer } from '@shared/schema';
import type { InventoryItem } from '@/lib/data-service';

export interface SearchResult {
  id: string;
  type: 'order' | 'customer' | 'inventory';
  title: string;
  subtitle: string;
  url: string;
  data: Order | Customer | InventoryItem;
}

export function useGlobalSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [allData, setAllData] = useState<{
    orders: Order[];
    customers: Customer[];
    inventory: InventoryItem[];
  }>({
    orders: [],
    customers: [],
    inventory: []
  });

  // Load all data on mount
  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [orders, customers, inventory] = await Promise.all([
          ordersApi.getAll(),
          customersApi.getAll(),
          inventoryApi.getAll()
        ]);
        
        setAllData({ orders, customers, inventory });
      } catch (error) {
        console.error('Failed to load search data:', error);
      }
    };

    loadAllData();
  }, []);

  // Search function
  const search = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const results: SearchResult[] = [];

    try {
      const lowerQuery = query.toLowerCase();

      // Search orders
      allData.orders.forEach(order => {
        if (
          order.orderNumber?.toLowerCase().includes(lowerQuery) ||
          order.customerName?.toLowerCase().includes(lowerQuery) ||
          order.customerEmail?.toLowerCase().includes(lowerQuery) ||
          order.customerPhone?.toLowerCase().includes(lowerQuery) ||
          order.status?.toLowerCase().includes(lowerQuery)
        ) {
          results.push({
            id: order.id,
            type: 'order',
            title: `Order ${order.orderNumber}`,
            subtitle: `${order.customerName} - ${order.status}`,
            url: '/orders',
            data: order
          });
        }
      });

      // Search customers
      allData.customers.forEach(customer => {
        if (
          customer.name?.toLowerCase().includes(lowerQuery) ||
          customer.email?.toLowerCase().includes(lowerQuery) ||
          customer.phone?.toLowerCase().includes(lowerQuery)
        ) {
          results.push({
            id: customer.id,
            type: 'customer',
            title: customer.name,
            subtitle: `${customer.email || 'No email'} - ${customer.totalOrders} orders`,
            url: '/customers',
            data: customer
          });
        }
      });

      // Search inventory
      allData.inventory.forEach(item => {
        if (
          item.name?.toLowerCase().includes(lowerQuery) ||
          item.id?.toLowerCase().includes(lowerQuery) ||
          item.status?.toLowerCase().includes(lowerQuery)
        ) {
          results.push({
            id: item.id,
            type: 'inventory',
            title: item.name,
            subtitle: `Stock: ${item.stock} - ${item.status}`,
            url: '/inventory',
            data: item
          });
        }
      });

      // Sort results by relevance (exact matches first, then partial matches)
      results.sort((a, b) => {
        const aExact = a.title.toLowerCase().includes(lowerQuery) || a.subtitle.toLowerCase().includes(lowerQuery);
        const bExact = b.title.toLowerCase().includes(lowerQuery) || b.subtitle.toLowerCase().includes(lowerQuery);
        
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return 0;
      });

      setSearchResults(results.slice(0, 10)); // Limit to 10 results
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      search(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, allData]);

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    clearSearch,
    search
  };
}
