import { useMemo, useState } from 'react';
import type { Service } from '@shared/schema';
import type { FilterType } from '@/components/services/service-search-filter';

export const useServiceFilters = (services: Service[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<FilterType[]>(['all']);

  const filteredServices = useMemo(() => {
    let filtered = services;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(query) ||
        service.category?.toLowerCase().includes(query) ||
        service.description?.toLowerCase().includes(query)
      );
    }

    // Apply category filters
    if (!activeFilters.includes('all')) {
      filtered = filtered.filter(service => {
        const price = parseFloat(service.price);
        
        return activeFilters.some(filter => {
          switch (filter) {
            case 'active':
              return service.status === 'Active';
            case 'inactive':
              return service.status === 'Inactive';
            case 'high_price':
              return price > 500;
            case 'low_price':
              return price < 200;
            default:
              // Handle category filters
              if (filter.startsWith('category_')) {
                const categoryFilter = filter.replace('category_', '').replace('_', ' ');
                return service.category?.toLowerCase() === categoryFilter.toLowerCase();
              }
              return true;
          }
        });
      });
    }

    return filtered;
  }, [services, searchQuery, activeFilters]);

  const clearFilters = () => {
    setSearchQuery('');
    setActiveFilters(['all']);
  };

  const getFilterStats = () => {
    const totalServices = services.length;
    const activeServices = services.filter(service => service.status === 'Active').length;
    const inactiveServices = totalServices - activeServices;
    
    const highPriceServices = services.filter(service => parseFloat(service.price) > 500).length;
    const lowPriceServices = services.filter(service => parseFloat(service.price) < 200).length;
    
    const categoryStats = services.reduce((acc, service) => {
      const category = service.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalServices,
      activeServices,
      inactiveServices,
      highPriceServices,
      lowPriceServices,
      categoryStats,
    };
  };

  return {
    searchQuery,
    setSearchQuery,
    activeFilters,
    setActiveFilters,
    filteredServices,
    clearFilters,
    getFilterStats,
  };
};
