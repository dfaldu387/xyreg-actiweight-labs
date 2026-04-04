import React, { useState, useRef, useEffect } from 'react';
import { cn } from "@/lib/utils";

interface AutocompleteFreeInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

// Custom input that browsers cannot recognize for autocomplete
export const AutocompleteFreeInput = React.forwardRef<HTMLDivElement, AutocompleteFreeInputProps>(
  ({ id, value, onChange, placeholder, required, className, onKeyDown }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (contentRef.current && contentRef.current.textContent !== value) {
        contentRef.current.textContent = value;
      }
    }, [value]);

    const handleInput = () => {
      if (contentRef.current) {
        onChange(contentRef.current.textContent || '');
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (onKeyDown) {
        onKeyDown(e);
      }
    };

    return (
      <div className="relative">
        {/* Honeypot fields to confuse autocomplete */}
        <input
          type="text"
          style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0 }}
          tabIndex={-1}
          autoComplete="off"
        />
        <input
          type="email" 
          style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0 }}
          tabIndex={-1}
          autoComplete="off"
        />
        
        <div
          ref={ref}
          id={id}
          contentEditable
          role="textbox"
          aria-label={placeholder}
          aria-required={required}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground",
            isFocused && "ring-2 ring-ring ring-offset-2",
            className
          )}
          data-placeholder={placeholder}
          onInput={handleInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          suppressContentEditableWarning
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          data-form-type="other"
          data-lpignore="true"
          data-1p-ignore
          data-bwignore
        />
      </div>
    );
  }
);

AutocompleteFreeInput.displayName = "AutocompleteFreeInput";