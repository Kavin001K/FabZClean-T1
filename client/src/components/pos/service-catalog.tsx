import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Tag, Clock, Zap, Star, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Service } from '@shared/schema';

interface ServiceCatalogProps {
    services: Service[];
    isLoading: boolean;
    onAddService: (service: Service) => void;
    recentlyUsed?: string[];
    customerFavorites?: string[];
}

export function ServiceCatalog({
    services,
    isLoading,
    onAddService,
    recentlyUsed = [],
    customerFavorites = [],
}: ServiceCatalogProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'recent'>('all');

    // Extract categories
    const categories = useMemo(() => {
        const cats = new Set(services.map(s => s.category).filter(Boolean));
        return ['All', ...Array.from(cats).sort()];
    }, [services]);

    // Filter services
    const filteredServices = useMemo(() => {
        let result = services;

        // 1. Text Search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(s =>
                s.name.toLowerCase().includes(query) ||
                s.category?.toLowerCase().includes(query)
            );
        }

        // 2. Category Filter
        if (selectedCategory !== 'All') {
            result = result.filter(s => s.category === selectedCategory);
        }

        // 3. Quick Filters (Favorites/Recent)
        if (activeFilter === 'favorites') {
            result = result.filter(s => customerFavorites.includes(s.id));
        } else if (activeFilter === 'recent') {
            result = result.filter(s => recentlyUsed.includes(s.id));
        }

        return result;
    }, [services, searchQuery, selectedCategory, activeFilter, recentlyUsed, customerFavorites]);

    const handleQuickAdd = (service: Service) => {
        // Trigger small haptic or sound if possible
        onAddService(service);
    };

    if (isLoading) {
        return (
            <div className="flex-1 p-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(12)].map((_, i) => (
                    <div key={i} className="h-32 rounded-xl bg-muted/20 animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-950/50 backdrop-blur-sm">
            {/* Search & Filter Bar */}
            <div className="p-4 space-y-4 border-b border-white/5 bg-slate-900/50">
                <div className="flex gap-2">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Search services..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-slate-950/50 border-white/10 focus-visible:ring-primary/50 h-10 rounded-full"
                        />
                    </div>

                    <div className="flex gap-1 bg-slate-950/50 p-1 rounded-full border border-white/10">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveFilter('all')}
                            className={cn("rounded-full h-8 px-3 text-xs", activeFilter === 'all' && "bg-slate-800 text-white")}
                        >
                            <Filter className="h-3 w-3 mr-1" /> All
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveFilter('favorites')}
                            className={cn("rounded-full h-8 px-3 text-xs", activeFilter === 'favorites' && "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20")}
                        >
                            <Star className="h-3 w-3 mr-1" /> Favs
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveFilter('recent')}
                            className={cn("rounded-full h-8 px-3 text-xs", activeFilter === 'recent' && "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20")}
                        >
                            <Clock className="h-3 w-3 mr-1" /> Recent
                        </Button>
                    </div>
                </div>

                {/* Categories */}
                <ScrollArea className="w-full whitespace-nowrap pb-2">
                    <div className="flex gap-2">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-sm font-medium transition-all border",
                                    selectedCategory === cat
                                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25"
                                        : "bg-slate-900/50 text-slate-400 border-white/10 hover:border-primary/50 hover:text-slate-200"
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <ScrollBar orientation="horizontal" className="invisible" />
                </ScrollArea>
            </div>

            {/* Service Grid */}
            <ScrollArea className="flex-1 p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 pb-20">
                    <AnimatePresence mode='popLayout'>
                        {filteredServices.map((service) => (
                            <motion.button
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.15 }}
                                key={service.id}
                                onClick={() => handleQuickAdd(service)}
                                className="group relative flex flex-col justify-between h-32 p-4 rounded-xl border border-white/5 bg-gradient-to-br from-slate-900 to-slate-900/50 hover:from-slate-800 hover:to-slate-900 hover:border-primary/50 text-left transition-all shadow-sm hover:shadow-md hover:shadow-primary/5 active:scale-95 overflow-hidden"
                            >
                                {/* Background Accent */}
                                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div>
                                    <h3 className="font-semibold text-slate-200 line-clamp-2 leading-tight group-hover:text-white transition-colors">
                                        {service.name}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1 font-medium">{service.category}</p>
                                </div>

                                <div className="flex items-end justify-between mt-auto">
                                    <div className="flex items-center gap-1.5 bg-slate-950/50 px-2 py-1 rounded-md border border-white/5">
                                        <span className="text-xs text-slate-400">₹</span>
                                        <span className="font-bold text-lg text-primary">{parseFloat(service.price).toFixed(0)}</span>
                                    </div>

                                    <div className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 opacity-50 group-hover:opacity-100 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                        <Plus className="h-4 w-4" />
                                    </div>
                                </div>

                                {/* Quick Indicators */}
                                <div className="absolute top-2 right-2 flex flex-col gap-1">
                                    {customerFavorites.includes(service.id) && (
                                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                    )}
                                    {recentlyUsed.includes(service.id) && (
                                        <Clock className="h-3 w-3 text-blue-500" />
                                    )}
                                </div>
                            </motion.button>
                        ))}
                    </AnimatePresence>

                    {filteredServices.length === 0 && (
                        <div className="col-span-full h-40 flex flex-col items-center justify-center text-slate-500">
                            <Search className="h-8 w-8 mb-2 opacity-50" />
                            <p>No services found matching your filters.</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}

function Plus(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    );
}
