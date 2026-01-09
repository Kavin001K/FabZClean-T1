import { useState, useEffect } from 'react';
import { Search, Calculator, Calendar, CreditCard, Settings, User, ShoppingCart, Package, Users, ShoppingBag, Truck, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGlobalSearch, SearchResult } from '@/hooks/use-global-search';
import { useLocation } from 'wouter';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const { searchQuery, setSearchQuery, searchResults, isSearching, clearSearch } = useGlobalSearch();
  const [, setLocation] = useLocation();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setIsOpen((open) => !open);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelect = (result: SearchResult) => {
    setIsOpen(false);
    clearSearch();
    setLocation(result.url);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingBag className="mr-2 h-4 w-4" />;
      case 'customer': return <Users className="mr-2 h-4 w-4" />;
      case 'product': return <Package className="mr-2 h-4 w-4" />;
      case 'service': return <Settings className="mr-2 h-4 w-4" />;
      default: return <Search className="mr-2 h-4 w-4" />;
    }
  };

  const groupedResults = searchResults.reduce((acc, result) => {
    const type = result.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start rounded-[0.5rem] bg-background text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-64 lg:w-80 xl:w-96 hover:bg-accent/50 transition-colors"
        onClick={() => setIsOpen(true)}
      >
        <Search className="mr-2 h-4 w-4 opacity-50" />
        <span className="inline-flex">Search orders, customers...</span>
        <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="overflow-hidden p-0 shadow-2xl max-w-2xl">
          <Command shouldFilter={false} className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
            <CommandInput
              placeholder="Type to search..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty className="py-6 text-center text-sm">
                {isSearching ? (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="text-muted-foreground">Searching...</p>
                  </div>
                ) : (
                  "No results found."
                )}
              </CommandEmpty>

              {!isSearching && (
                <>
                  {Object.entries(groupedResults).map(([type, results]) => (
                    <CommandGroup key={type} heading={type.charAt(0).toUpperCase() + type.slice(1) + 's'}>
                      {results.map((result) => (
                        <CommandItem
                          key={result.id}
                          value={result.id} // value is used for key, but not filtering since shouldFilter=false
                          onSelect={() => handleSelect(result)}
                          className="cursor-pointer"
                        >
                          {getIcon(result.type)}
                          <div className="flex flex-col flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{result.title}</span>
                              <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal capitalize">
                                {result.type}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground truncate">{result.subtitle} • {result.description}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))}

                  <CommandSeparator />

                  {!searchQuery && (
                    <CommandGroup heading="Quick Links">
                      <CommandItem onSelect={() => { setLocation('/orders/new'); setIsOpen(false); }}>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        <span>New Order</span>
                        <CommandShortcut>⌘N</CommandShortcut>
                      </CommandItem>
                      <CommandItem onSelect={() => { setLocation('/customers'); setIsOpen(false); }}>
                        <Users className="mr-2 h-4 w-4" />
                        <span>Customers</span>
                      </CommandItem>
                      <CommandItem onSelect={() => { setLocation('/inventory'); setIsOpen(false); }}>
                        <Package className="mr-2 h-4 w-4" />
                        <span>Inventory</span>
                      </CommandItem>
                      <CommandItem onSelect={() => { setLocation('/services'); setIsOpen(false); }}>
                        <FileText className="mr-2 h-4 w-4" />
                        <span>Services Catalog</span>
                      </CommandItem>
                    </CommandGroup>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
