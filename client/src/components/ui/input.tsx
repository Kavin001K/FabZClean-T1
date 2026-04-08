import * as React from "react"

import { cn, capitalizeFirst, toTitleCase } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const nameAttr = (props.name || '').toLowerCase();
      const idAttr = (props.id || '').toLowerCase();
      
      const isLoginOrEmailField = 
        type === 'email' || 
        type === 'password' || 
        type === 'url' || 
        nameAttr.includes('email') || 
        idAttr.includes('email') ||
        nameAttr.includes('username') ||
        idAttr.includes('username');

      if (
        !isLoginOrEmailField &&
        type !== 'number' &&
        type !== 'tel' &&
        type !== 'date' &&
        type !== 'file'
      ) {
        const name = nameAttr;
        const id = idAttr;
        const placeholder = (props.placeholder || '').toLowerCase();
        
        // Exact match exclusions or keyword inclusions
        const isNameOrAddress = ['name', 'address', 'street', 'city', 'location', 'company'].some(
          keyword => name.includes(keyword) || id.includes(keyword) || placeholder.includes(keyword)
        );
        
        const originalValue = e.target.value;
        const newValue = isNameOrAddress ? toTitleCase(originalValue) : capitalizeFirst(originalValue);
        
        if (originalValue !== newValue) {
          const start = e.target.selectionStart;
          e.target.value = newValue;
          if (start !== null) {
            // Restore cursor position inside a microtask so it happens after React state potentially updates
            window.requestAnimationFrame(() => {
              if (e.target) {
                e.target.setSelectionRange(start, start);
              }
            });
          }
        }
      }
      
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-base leading-none ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-text-primary placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        onChange={handleChange}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
