import { useMemo, useState } from 'react';
import type { Customer } from '../../../shared/schema';
import type { FilterType } from '@/components/customers/customer-search-filter';

export const useCustomerFilters = (customers: Customer[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<FilterType[]>(['all']);

  const filteredCustomers = useMemo(() => {
    let filtered = customers;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(query) ||
        customer.email?.toLowerCase().includes(query) ||
        customer.phone?.includes(query)
      );
    }

    // Apply category filters
    if (!activeFilters.includes('all')) {
      filtered = filtered.filter(customer => {
        const totalSpent = parseFloat(customer.totalSpent || '0');
        const totalOrders = customer.totalOrders || 0;
        const isNew = new Date(customer.createdAt || new Date()) > 
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

        return activeFilters.some(filter => {
          switch (filter) {
            case 'new':
              return isNew;
            case 'loyal':
              return totalOrders > 5;
            case 'high_value':
              return totalSpent > 10000;
            case 'has_orders':
              return totalOrders > 0;
            default:
              return true;
          }
        });
      });
    }

    return filtered;
  }, [customers, searchQuery, activeFilters]);

  const clearFilters = () => {
    setSearchQuery('');
    setActiveFilters(['all']);
  };

  const getFilterStats = () => {
    const totalCustomers = customers.length;
    const newCustomers = customers.filter(customer => {
      const isNew = new Date(customer.createdAt || new Date()) > 
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return isNew;
    }).length;
    
    const loyalCustomers = customers.filter(customer => 
      (customer.totalOrders || 0) > 5
    ).length;
    
    const highValueCustomers = customers.filter(customer => 
      parseFloat(customer.totalSpent || '0') > 10000
    ).length;
    
    const customersWithOrders = customers.filter(customer => 
      (customer.totalOrders || 0) > 0
    ).length;

    return {
      totalCustomers,
      newCustomers,
      loyalCustomers,
      highValueCustomers,
      customersWithOrders,
    };
  };

  return {
    searchQuery,
    setSearchQuery,
    activeFilters,
    setActiveFilters,
    filteredCustomers,
    clearFilters,
    getFilterStats,
  };
};
