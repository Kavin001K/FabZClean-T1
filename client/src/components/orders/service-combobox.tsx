import React, { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
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
import type { Service } from "@shared/schema";

interface ServiceComboboxProps {
  services: Service[];
  onSelect: (serviceId: string) => void;
  disabled?: boolean;
}

export const ServiceCombobox = React.forwardRef<HTMLButtonElement, ServiceComboboxProps>(
  ({ services, onSelect, disabled }, ref) => {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState("");

    // Group services by category
    const groupedServices = useMemo(() => {
      const groups: Record<string, Service[]> = {};
      services.forEach((service) => {
        const category = service.category || "General";
        if (!groups[category]) groups[category] = [];
        groups[category].push(service);
      });
      return groups;
    }, [services]);

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
