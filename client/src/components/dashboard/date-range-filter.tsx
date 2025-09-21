import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay } from 'date-fns';

export type DateRange = {
  from: Date;
  to: Date;
};

export type DateRangePreset = {
  label: string;
  value: string;
  getDateRange: () => DateRange;
};

const DATE_PRESETS: DateRangePreset[] = [
  {
    label: 'Today',
    value: 'today',
    getDateRange: () => ({
      from: startOfDay(new Date()),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: 'Yesterday',
    value: 'yesterday',
    getDateRange: () => {
      const yesterday = subDays(new Date(), 1);
      return {
        from: startOfDay(yesterday),
        to: endOfDay(yesterday),
      };
    },
  },
  {
    label: 'Last 7 days',
    value: 'last7days',
    getDateRange: () => ({
      from: startOfDay(subDays(new Date(), 6)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: 'Last 30 days',
    value: 'last30days',
    getDateRange: () => ({
      from: startOfDay(subDays(new Date(), 29)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: 'This week',
    value: 'thisWeek',
    getDateRange: () => {
      const today = new Date();
      const startOfWeek = subDays(today, today.getDay());
      return {
        from: startOfDay(startOfWeek),
        to: endOfDay(today),
      };
    },
  },
  {
    label: 'Last week',
    value: 'lastWeek',
    getDateRange: () => {
      const lastWeek = subWeeks(new Date(), 1);
      const startOfLastWeek = subDays(lastWeek, lastWeek.getDay());
      const endOfLastWeek = subDays(startOfLastWeek, -6);
      return {
        from: startOfDay(startOfLastWeek),
        to: endOfDay(endOfLastWeek),
      };
    },
  },
  {
    label: 'This month',
    value: 'thisMonth',
    getDateRange: () => {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        from: startOfDay(startOfMonth),
        to: endOfDay(today),
      };
    },
  },
  {
    label: 'Last month',
    value: 'lastMonth',
    getDateRange: () => {
      const lastMonth = subMonths(new Date(), 1);
      const startOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
      const endOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
      return {
        from: startOfDay(startOfLastMonth),
        to: endOfDay(endOfLastMonth),
      };
    },
  },
];

interface DateRangeFilterProps {
  dateRange: DateRange;
  onDateRangeChange: (dateRange: DateRange) => void;
  className?: string;
}

export default function DateRangeFilter({ 
  dateRange, 
  onDateRangeChange, 
  className 
}: DateRangeFilterProps) {
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

  const handlePresetSelect = (presetValue: string) => {
    const preset = DATE_PRESETS.find(p => p.value === presetValue);
    if (preset) {
      onDateRangeChange(preset.getDateRange());
    }
  };

  const formatDateRange = () => {
    if (!dateRange.from || !dateRange.to) {
      return 'Select date range';
    }
    
    if (dateRange.from.getTime() === dateRange.to.getTime()) {
      return format(dateRange.from, 'MMM dd, yyyy');
    }
    
    return `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd, yyyy')}`;
  };

  return (
    <div className={cn('flex flex-col sm:flex-row gap-2', className)}>
      {/* Preset Selector */}
      <Select onValueChange={handlePresetSelect}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Quick select" />
        </SelectTrigger>
        <SelectContent>
          {DATE_PRESETS.map((preset) => (
            <SelectItem key={preset.value} value={preset.value}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Custom Date Range Picker */}
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full sm:w-[300px] justify-start text-left font-normal',
              !dateRange.from && 'text-muted-foreground'
            )}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {formatDateRange()}
            <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            initialFocus
            mode="range"
            defaultMonth={dateRange.from}
            selected={dateRange}
            onSelect={(range) => {
              if (range?.from && range?.to) {
                onDateRangeChange(range);
                setIsCalendarOpen(false);
              }
            }}
            numberOfMonths={2}
            className="rounded-md border"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
