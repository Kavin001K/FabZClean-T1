/**
 * ============================================================================
 * SERVICE CATALOG GRID
 * ============================================================================
 * 
 * Grid-based service selector for POS system.
 * Features:
 * - Category filtering tabs
 * - Search functionality
 * - Visual service cards with icons
 * - Quick add on click
 * - Price display
 * 
 * @version 1.0.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Shirt,
    Wind,
    Sparkles,
    Package,
    Home,
    Layers,
    Grid3X3,
    List,
    Star,
    Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Service } from '@shared/schema';

// ============ TYPES ============

interface ServiceCatalogProps {
    services: Service[];
    isLoading: boolean;
    onAddService: (service: Service) => void;
    recentlyUsed?: string[]; // Service IDs
    customerFavorites?: string[]; // Service IDs based on customer history
}

// ============ SERVICE ICONS ============

const SERVICE_ICONS: Record<string, React.ComponentType<any>> = {
    'wash': Shirt,
    'dry': Wind,
    'iron': Sparkles,
    'fold': Package,
    'curtain': Home,
    'blanket': Layers,
    'default': Shirt,
};

function getServiceIcon(serviceName: string): React.ComponentType<any> {
    const lowerName = serviceName.toLowerCase();
    for (const [key, icon] of Object.entries(SERVICE_ICONS)) {
        if (lowerName.includes(key)) return icon;
    }
    return SERVICE_ICONS.default;
}

// ============ CATEGORY COLORS ============

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    'Wash & Fold': { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/30' },
    'Dry Cleaning': { bg: 'bg-purple-500/10', text: 'text-purple-600', border: 'border-purple-500/30' },
    'Premium': { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/30' },
    'Home Textiles': { bg: 'bg-green-500/10', text: 'text-green-600', border: 'border-green-500/30' },
    'Express': { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/30' },
    'Alterations': { bg: 'bg-pink-500/10', text: 'text-pink-600', border: 'border-pink-500/30' },
    'default': { bg: 'bg-slate-500/10', text: 'text-slate-600', border: 'border-slate-500/30' },
};

function getCategoryColor(category: string) {
    return CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
}

// ============ COMPONENT ============

export function ServiceCatalog({
    services,
    isLoading,
    onAddService,
    recentlyUsed = [],
    customerFavorites = [],
}: ServiceCatalogProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('All');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Extract unique categories
    const categories = useMemo(() => {
        const cats = new Set<string>();
        cats.add('All');

        // Add "Favorites" if customer has favorites
        if (customerFavorites.length > 0) {
            cats.add('⭐ Favorites');
        }

        // Add "Recent" if there are recently used
        if (recentlyUsed.length > 0) {
            cats.add('🕐 Recent');
        }

        services.forEach(s => {
            if (s.category) cats.add(s.category);
        });

        return Array.from(cats);
    }, [services, customerFavorites, recentlyUsed]);

    // Filter services
    const filteredServices = useMemo(() => {
        let result = [...services];

        // Filter by search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(s =>
                s.name.toLowerCase().includes(query) ||
                s.description?.toLowerCase().includes(query) ||
                s.category?.toLowerCase().includes(query)
            );
        }

        // Filter by category
        if (activeCategory === '⭐ Favorites') {
            result = result.filter(s => customerFavorites.includes(s.id));
        } else if (activeCategory === '🕐 Recent') {
            result = result.filter(s => recentlyUsed.includes(s.id));
            // Sort by recency
            result.sort((a, b) => recentlyUsed.indexOf(a.id) - recentlyUsed.indexOf(b.id));
        } else if (activeCategory !== 'All') {
            result = result.filter(s => s.category === activeCategory);
        }

        return result;
    }, [services, searchQuery, activeCategory, customerFavorites, recentlyUsed]);

    // Render loading skeleton
    if (isLoading) {
        return (
            <div className="p-4 space-y-4">
                <div className="h-10 bg-muted rounded-lg animate-pulse" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[...Array(9)].map((_, i) => (
                        <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Search Bar */}
            <div className="p-4 border-b">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search services... (type to filter)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4"
                    />
                </div>
            </div>

            {/* Category Tabs */}
            <div className="px-4 py-2 border-b overflow-x-auto">
                <div className="flex gap-2">
                    {categories.map((category) => {
                        const isActive = activeCategory === category;
                        const color = getCategoryColor(category);

                        return (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                                    isActive
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted hover:bg-muted/80 text-muted-foreground"
                                )}
                            >
                                {category}
                                {category === 'All' && (
                                    <span className="ml-1 opacity-60">({services.length})</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* View Toggle */}
            <div className="px-4 py-2 flex items-center justify-between border-b">
                <span className="text-xs text-muted-foreground">
                    {filteredServices.length} services
                </span>
                <div className="flex gap-1">
                    <Button
                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setViewMode('grid')}
                    >
                        <Grid3X3 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setViewMode('list')}
                    >
                        <List className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {/* Services Grid/List */}
            <ScrollArea className="flex-1 p-4">
                {filteredServices.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No services found</p>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="text-primary text-sm mt-2 underline"
                            >
                                Clear search
                            </button>
                        )}
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                        <AnimatePresence mode="popLayout">
                            {filteredServices.map((service) => (
                                <ServiceCard
                                    key={service.id}
                                    service={service}
                                    onAdd={() => onAddService(service)}
                                    isFavorite={customerFavorites.includes(service.id)}
                                    isRecent={recentlyUsed.includes(service.id)}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <AnimatePresence mode="popLayout">
                            {filteredServices.map((service) => (
                                <ServiceListItem
                                    key={service.id}
                                    service={service}
                                    onAdd={() => onAddService(service)}
                                    isFavorite={customerFavorites.includes(service.id)}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}

// ============ SERVICE CARD ============

interface ServiceCardProps {
    service: Service;
    onAdd: () => void;
    isFavorite?: boolean;
    isRecent?: boolean;
}

function ServiceCard({ service, onAdd, isFavorite, isRecent }: ServiceCardProps) {
    const Icon = getServiceIcon(service.name);
    const color = getCategoryColor(service.category || 'default');
    const price = parseFloat(service.price || '0');

    return (
        <motion.button
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAdd}
            className={cn(
                "relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all",
                "hover:shadow-md hover:border-primary/50",
                color.bg,
                color.border
            )}
        >
            {/* Favorite/Recent Indicator */}
            {(isFavorite || isRecent) && (
                <div className="absolute top-2 right-2">
                    {isFavorite ? (
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    ) : (
                        <Zap className="h-3.5 w-3.5 text-blue-500" />
                    )}
                </div>
            )}

            {/* Icon */}
            <div className={cn("p-2.5 rounded-lg mb-2", color.bg)}>
                <Icon className={cn("h-5 w-5", color.text)} />
            </div>

            {/* Name */}
            <span className="text-sm font-semibold text-center line-clamp-2">
                {service.name}
            </span>

            {/* Price */}
            <span className="text-lg font-bold text-primary mt-1">
                ₹{price.toFixed(0)}
            </span>

            {/* Category Badge */}
            {service.category && (
                <Badge variant="secondary" className="mt-2 text-[10px] px-2 py-0.5">
                    {service.category}
                </Badge>
            )}
        </motion.button>
    );
}

// ============ SERVICE LIST ITEM ============

function ServiceListItem({ service, onAdd, isFavorite }: ServiceCardProps) {
    const Icon = getServiceIcon(service.name);
    const color = getCategoryColor(service.category || 'default');
    const price = parseFloat(service.price || '0');

    return (
        <motion.button
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            onClick={onAdd}
            className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg border transition-all",
                "hover:shadow-sm hover:border-primary/50",
                color.bg,
                color.border
            )}
        >
            {/* Icon */}
            <div className={cn("p-2 rounded-lg shrink-0", color.bg)}>
                <Icon className={cn("h-4 w-4", color.text)} />
            </div>

            {/* Info */}
            <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{service.name}</span>
                    {isFavorite && <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />}
                </div>
                {service.description && (
                    <p className="text-xs text-muted-foreground truncate">{service.description}</p>
                )}
            </div>

            {/* Category */}
            {service.category && (
                <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {service.category}
                </Badge>
            )}

            {/* Price */}
            <span className="text-lg font-bold text-primary shrink-0">
                ₹{price.toFixed(0)}
            </span>
        </motion.button>
    );
}

export default ServiceCatalog;
