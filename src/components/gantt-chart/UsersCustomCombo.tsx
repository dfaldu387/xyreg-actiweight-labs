import React, { useMemo, useState, useRef, useEffect } from "react";
import { useDocumentAuthors } from "@/hooks/useDocumentAuthors";
import { Check, ChevronDown, X } from "lucide-react";

interface Option {
    id: string;
    label: string;
    type?: 'user' | 'custom' | 'pending';
}

interface Author {
    id: string;
    name: string;
}

interface UsersCustomComboProps {
    value?: string;
    options?: Option[];
    onChange?: (event: { value: string | null }) => void;
    config?: {
        placeholder?: string;
        companyId?: string | null;
        currentValues?: Author[];  // Array of {id, name} for multi-select
        onSelectMultiple?: (authors: Author[]) => void;  // Callback for multi-select
        // Legacy single-select props
        currentValue?: string | null;
        currentValueName?: string | null;
        onSelect?: (value: string, authorName: string) => void;
        onSave?: (value: string, authorName: string) => Promise<void>;
    };
}

export default function UsersCustomCombo({
    value,
    options = [],
    onChange,
    config,
}: UsersCustomComboProps) {
    const placeholder = config?.placeholder ?? "Select authors";
    const [isOpen, setIsOpen] = useState(false);
    const [selectedAuthors, setSelectedAuthors] = useState<Author[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { authors, isLoading } = useDocumentAuthors(config?.companyId || '');

    // Initialize selected authors from config
    useEffect(() => {
        if (config?.currentValues && config.currentValues.length > 0) {
            setSelectedAuthors(config.currentValues);
        } else if (config?.currentValue && config?.currentValueName) {
            // Legacy single value support
            setSelectedAuthors([{ id: config.currentValue, name: config.currentValueName }]);
        }
    }, [config?.currentValues, config?.currentValue, config?.currentValueName]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const combinedOptions = useMemo<Option[]>(() => {
        if (authors && authors.length > 0) {
            return authors.map(author => ({
                id: author.id,
                label: author.name || "Unknown Author",
                type: author.type,
            }));
        }

        if (options.length > 0) {
            return options;
        }

        return [];
    }, [authors, options]);

    const handleToggleAuthor = (authorId: string, authorName: string) => {
        const isSelected = selectedAuthors.some(a => a.id === authorId);
        let newSelection: Author[];

        if (isSelected) {
            newSelection = selectedAuthors.filter(a => a.id !== authorId);
        } else {
            newSelection = [...selectedAuthors, { id: authorId, name: authorName }];
        }

        setSelectedAuthors(newSelection);

        // Notify parent of selection change
        if (config?.onSelectMultiple) {
            config.onSelectMultiple(newSelection);
        }

        // Legacy single-select callback (use first selected)
        if (config?.onSelect && newSelection.length > 0) {
            const firstAuthor = newSelection[0];
            config.onSelect(firstAuthor.id, firstAuthor.name);
        }
    };

    const handleRemoveAuthor = (authorId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSelection = selectedAuthors.filter(a => a.id !== authorId);
        setSelectedAuthors(newSelection);

        if (config?.onSelectMultiple) {
            config.onSelectMultiple(newSelection);
        }
    };

    const isAuthorSelected = (authorId: string) => {
        return selectedAuthors.some(a => a.id === authorId);
    };

    return (
        <div className="relative flex flex-col gap-2 text-sm" ref={dropdownRef}>
            {/* Selected authors display */}
            <div
                className="border rounded px-3 py-2 min-h-[42px] cursor-pointer flex items-center justify-between gap-2 hover:border-primary/50 focus:outline-none focus:ring focus:ring-primary/50 bg-background"
                onClick={() => !isLoading && combinedOptions.length > 0 && setIsOpen(!isOpen)}
            >
                <div className="flex flex-wrap gap-1 flex-1">
                    {selectedAuthors.length === 0 ? (
                        <span className="text-muted-foreground">{placeholder}</span>
                    ) : (
                        selectedAuthors.map(author => (
                            <span
                                key={author.id}
                                className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded text-xs"
                            >
                                {author.name}
                                <X
                                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                                    onClick={(e) => handleRemoveAuthor(author.id, e)}
                                />
                            </span>
                        ))
                    )}
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Dropdown with checkboxes */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                    {combinedOptions.map((option) => (
                        <div
                            key={option.id}
                            className="flex items-center gap-2 px-3 py-2 hover:bg-muted cursor-pointer"
                            onClick={() => handleToggleAuthor(option.id, option.label)}
                        >
                            <div
                                className={`w-4 h-4 border rounded flex items-center justify-center flex-shrink-0 ${
                                    isAuthorSelected(option.id)
                                        ? 'bg-primary border-primary'
                                        : 'border-input'
                                }`}
                            >
                                {isAuthorSelected(option.id) && (
                                    <Check className="h-3 w-3 text-primary-foreground" />
                                )}
                            </div>
                            <span className="flex-1 truncate">{option.label}</span>
                        </div>
                    ))}
                    {combinedOptions.length === 0 && (
                        <div className="px-3 py-2 text-muted-foreground text-center">
                            No authors available
                        </div>
                    )}
                </div>
            )}

            {isLoading && (
                <span className="text-xs text-muted-foreground">
                    Loading authors...
                </span>
            )}
            {!isLoading && combinedOptions.length === 0 && !isOpen && (
                <span className="text-xs text-muted-foreground">
                    No authors available. Add users or stakeholders in Settings.
                </span>
            )}
        </div>
    );
}
