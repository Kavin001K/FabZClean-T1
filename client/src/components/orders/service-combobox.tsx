import React, { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Search, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Service, Order } from "@shared/schema";

interface ServiceComboboxProps {
  services: Service[];
  onSelect: (serviceId: string) => void;
  disabled?: boolean;
  /** Customer's past orders — used to rank frequently-used services */
  customerOrders?: Order[];
}

export const ServiceCombobox = React.forwardRef<HTMLButtonElement, ServiceComboboxProps>(
  ({ services, onSelect, disabled, customerOrders }, ref) => {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState("");

    /**
     * Build a frequency map:  serviceId → usage count
     * based on the customer's order history items.
     */
    const serviceFrequency = useMemo(() => {
      const freq: Record<string, number> = {};
      if (!customerOrders?.length) return freq;

      customerOrders.forEach(order => {
        const items = (order as any).items;
        if (!Array.isArray(items)) return;
        items.forEach((item: any) => {
          // Match by productId (service ID) or fuzzy-match by name
          const id = item.productId || item.serviceId;
          if (id) {
            freq[id] = (freq[id] || 0) + (item.quantity || 1);
          }
        });
      });
      return freq;
    }, [customerOrders]);

    /**
     * Separate services into "Frequently Used" (from history) and the rest grouped by category.
     */
    const { frequentServices, groupedServices } = useMemo(() => {
      const hasHistory = Object.keys(serviceFrequency).length > 0;

      // Sort all services by frequency (desc), then pick top N that exist in the catalog
      const frequentIds = Object.entries(serviceFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([id]) => id);

      const frequent = hasHistory
        ? frequentIds
            .map(id => services.find(s => s.id === id))
            .filter(Boolean) as Service[]
        : [];

      // Group remaining services by category
      const frequentIdSet = new Set(frequent.map(s => s.id));
      const groups: Record<string, Service[]> = {};
      services.forEach((service) => {
        const category = service.category || "General";
        if (!groups[category]) groups[category] = [];
        groups[category].push(service);
      });

      return { frequentServices: frequent, groupedServices: groups };
    }, [services, serviceFrequency]);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-11 text-left font-normal"
            disabled={disabled}
          >
            <div className="flex items-center truncate">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              {value
                ? services.find((service) => service.id === value)?.name
                : "Search services (e.g. Dry Clean, Wash)..."}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search services..." />
            <CommandList className="max-h-[300px]">
              <CommandEmpty>No service found.</CommandEmpty>

              {/* Frequently Used — customer history-based suggestions */}
              {frequentServices.length > 0 && (
                <CommandGroup heading="⭐ Frequently Used">
                  {frequentServices.map((service) => (
                    <CommandItem
                      key={`freq-${service.id}`}
                      value={`★ ${service.name} ${service.id}`}
                      onSelect={() => {
                        onSelect(service.id);
                        setOpen(false);
                      }}
                      className="flex items-center justify-between"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium flex items-center gap-1.5">
                          <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                          {service.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Used {serviceFrequency[service.id] || 0}× by this customer
                        </span>
                      </div>
                      <span className="text-sm font-bold text-primary">
                        ₹{parseFloat(service.price).toFixed(2)}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* All services grouped by category */}
              {Object.entries(groupedServices).map(([category, items]) => (
                <CommandGroup key={category} heading={category}>
                  {items.map((service) => (
                    <CommandItem
                      key={service.id}
                      value={service.name + " " + service.id} // Include ID for uniqueness
                      onSelect={() => {
                        onSelect(service.id);
                        setOpen(false);
                        // Don't set value here, as we want to reset the trigger for multiple additions
                      }}
                      className="flex items-center justify-between"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{service.name}</span>
                        {service.description && (
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {service.description}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-primary">
                          ₹{parseFloat(service.price).toFixed(2)}
                        </span>
                        <Check
                          className={cn(
                            "h-4 w-4",
                            value === service.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);
