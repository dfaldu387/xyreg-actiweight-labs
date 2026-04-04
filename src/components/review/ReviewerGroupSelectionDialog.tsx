import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, CheckCircle, X } from 'lucide-react';
import { useReviewerGroups } from '@/hooks/useReviewerGroups';
import type { ReviewRecordType } from '@/types/review';
import { ReviewerGroup } from '@/types/reviewerGroups';

interface ReviewerGroupSelectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    recordType: ReviewRecordType;
    recordId: string;
    recordName?: string;
    companyId: string;
    onGroupsSelected: (selectedGroups: string[]) => void;
    setReviwer: (prev: any[]) => void;
    fetchReviewerGroups: () => void;
}

export function ReviewerGroupSelectionDialog({
    open,
    onOpenChange,
    recordType,
    recordId,
    recordName,
    companyId,
    onGroupsSelected,
    setReviwer,
    fetchReviewerGroups
}: ReviewerGroupSelectionDialogProps) {
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const { groups, isLoading } = useReviewerGroups(companyId);

    const getRecordTypeLabel = () => {
        switch (recordType) {
            case 'document':
                return 'Document';
            case 'gap_analysis_item':
                return 'Gap Analysis Item';
            case 'audit':
                return 'Audit';
            default:
                return 'Record';
        }
    };

    const getGroupIcon = (type: string) => {
        switch (type) {
            case 'regulatory': return '🏛️';
            case 'external': return '🌐';
            default: return '👥';
        }
    };

    const toggleGroup = (group: ReviewerGroup) => {
        if (selectedGroups.includes(group.id)) {
            console.log("group", group)
            setSelectedGroups(selectedGroups.filter(id => id !== group.id));
        } else {
            setSelectedGroups([...selectedGroups, group.id]);
        }
    };

    const handleContinue = () => {
        if (selectedGroups.length > 0) {
            onGroupsSelected(selectedGroups);
            onOpenChange(false);
            setSelectedGroups([]);
            // console.log("selectedGroups", selectedGroups)
        }
    };

    const handleClose = () => {
        onOpenChange(false);
        setSelectedGroups([]);
    };

    if (isLoading) {
        return (
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Select Reviewer Groups</DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">Loading reviewer groups...</p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Select Reviewer Groups
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        Choose who should review this {getRecordTypeLabel().toLowerCase()}: {recordName || recordId}
                    </p>
                </DialogHeader>

                <div className="space-y-4">
                    {groups.length === 0 ? (
                        <div className="text-center py-8">
                            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                            <h3 className="text-lg font-medium mb-2">No reviewer groups available</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                You need to create reviewer groups before you can start a review workflow.
                            </p>
                            <Button variant="outline" onClick={handleClose}>
                                Close
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Available Groups</span>
                                {selectedGroups.length > 0 && (
                                    <Badge variant="secondary">
                                        {selectedGroups.length} selected
                                    </Badge>
                                )}
                            </div>

                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {groups.map((group: any) => {
                                    const isSelected = selectedGroups.includes(group.id);
                                    return (
                                        <button
                                            key={group.id}
                                            onClick={() => toggleGroup(group)}
                                            className={`w-full p-4 rounded-lg border text-left hover:bg-muted/50 transition-colors ${isSelected
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border hover:border-primary/50'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{getGroupIcon(group.group_type)}</span>
                                                    <div>
                                                        <div className="font-medium text-sm">{group.name}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {group.group_type} • {group.members?.length || 0} members
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {isSelected && (
                                                        <CheckCircle className="h-5 w-5 text-primary" />
                                                    )}
                                                </div>
                                            </div>

                                            {group.description && (
                                                <p className="text-xs text-muted-foreground mb-2">
                                                    {group.description}
                                                </p>
                                            )}

                                            {/* Members preview */}
                                            {group.members && group.members.length > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <div className="flex -space-x-2">
                                                        {group.members.slice(0, 3).map((member, index) => (
                                                            <div
                                                                key={member.id}
                                                                className="w-6 h-6 bg-muted rounded-full border-2 border-background flex items-center justify-center text-xs font-medium"
                                                                title={member.name}
                                                            >
                                                                {member.name.charAt(0).toUpperCase()}
                                                            </div>
                                                        ))}
                                                        {group.members.length > 3 && (
                                                            <div className="w-6 h-6 bg-muted rounded-full border-2 border-background flex items-center justify-center text-xs font-medium">
                                                                +{group.members.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleContinue}
                        disabled={selectedGroups.length === 0}
                    >
                        Continue with {selectedGroups.length} group{selectedGroups.length !== 1 ? 's' : ''}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
