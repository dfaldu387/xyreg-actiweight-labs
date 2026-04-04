import React from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Activity, History } from 'lucide-react';

interface DocumentStatusOption {
    value: string;
    label: string;
    description: string;
    color: string;
}

const DOCUMENT_STATUS_OPTIONS: DocumentStatusOption[] = [
    {
        value: 'Not Started',
        label: 'Not Started',
        description: 'Document not yet started',
        color: 'bg-[#9e9e9e]'
    },
    {
        value: 'in_review',
        label: 'In Review',
        description: 'Under review by assigned reviewers',
        color: 'bg-[#ff9800]'
    },
    {
        value: 'Approved',
        label: 'Approved',
        description: 'Successfully finished',
        color: 'bg-[#4caf50]'
    },
    {
        value: 'Rejected',
        label: 'Rejected',
        description: 'Requires revision',
        color: 'bg-[#f44336]'
    },
    // {
    //     value: 'N/A',
    //     label: 'N/A',
    //     description: 'Not applicable',
    //     color: 'bg-[#bdbdbd]'
    // }
];

interface DocumentStatusDropdownProps {
    value: string;
    onValueChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    showAuditLogButton?: boolean;
    onAuditLogClick?: () => void;
}

export function DocumentStatusDropdown({
    value,
    onValueChange,
    label = "Document Status",
    placeholder = "Status",
    className = "",
    disabled = false,
    showAuditLogButton = false,
    onAuditLogClick
}: DocumentStatusDropdownProps) {
    const selectedOption = DOCUMENT_STATUS_OPTIONS.find(option => option.value === value);

    return (
        <div className={`space-y-2 ${className}`}>
            <div className="flex items-center gap-2">
                <div className="flex-1">
                    <Select
                        value={value}
                        onValueChange={onValueChange}
                        disabled={disabled}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder={placeholder}>
                                {selectedOption ? (
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-3 h-3 rounded-full ${selectedOption.color}`}></div>
                                        <span>{selectedOption.label}</span>
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground">{placeholder}</span>
                                )}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {DOCUMENT_STATUS_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    <div className="flex items-center space-x-3 py-1">
                                        <div className={`w-3 h-3 rounded-full ${option.color}`}></div>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{option.label}</span>
                                            <span className="text-xs text-muted-foreground">{option.description}</span>
                                        </div>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* {showAuditLogButton && onAuditLogClick && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onAuditLogClick}
                        className="flex items-center gap-2 px-3 py-2 h-10"
                        title="View document audit log"
                    >
                        <History className="h-4 w-4" />
                        <span className="hidden sm:inline">Audit Log</span>
                    </Button>
                )} */}
            </div>
        </div>
    );
} 