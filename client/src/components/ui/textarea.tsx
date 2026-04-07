import * as React from "react"

import { cn, capitalizeFirst, toTitleCase } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, onChange, ...props }, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const name = (props.name || '').toLowerCase();
    const id = (props.id || '').toLowerCase();
    const placeholder = (props.placeholder || '').toLowerCase();
    
    // Most textareas will be notes, but we check for address/name anyway
    const isNameOrAddress = ['name', 'address', 'street', 'city', 'location', 'company'].some(
      keyword => name.includes(keyword) || id.includes(keyword) || placeholder.includes(keyword)
    );
    
    const originalValue = e.target.value;
    const newValue = isNameOrAddress ? toTitleCase(originalValue) : capitalizeFirst(originalValue);
    
    if (originalValue !== newValue) {
      const start = e.target.selectionStart;
      e.target.value = newValue;
      if (start !== null) {
        window.requestAnimationFrame(() => {
          if (e.target) {
            e.target.setSelectionRange(start, start);
          }
        });
      }
    }
    
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      onChange={handleChange}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }

