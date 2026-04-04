
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusIcon } from 'lucide-react';

export interface DocumentInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  submitText?: string;
  buttonText?: string; // For backward compatibility
  onAddDocument?: () => void; // New prop for adding documents
  onSubmit?: () => Promise<void>; // For backward compatibility
}

export function DocumentInput({
  value,
  onChange,
  placeholder = "Enter document name",
  submitText = "Add",
  buttonText, // For backward compatibility
  onAddDocument,
  onSubmit // For backward compatibility
}: DocumentInputProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Support both function signatures for backward compatibility
    if (onAddDocument) {
      onAddDocument();
    } else if (onSubmit) {
      onSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex space-x-2">
      <div className="flex-1">
        <Input 
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
      <Button type="submit" className="shrink-0">
        <PlusIcon className="h-4 w-4 mr-1" />
        {buttonText || submitText}
      </Button>
    </form>
  );
}
