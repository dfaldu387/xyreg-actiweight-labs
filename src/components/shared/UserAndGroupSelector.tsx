import React, { useState, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { useReviewerGroups } from '@/hooks/useReviewerGroups';
import { useDocumentAuthors } from '@/hooks/useDocumentAuthors';

interface UserAndGroupSelectorProps {
  companyId: string;
  label: string;
  icon: React.ReactNode;
  selectedGroupIds: string[];
  onGroupIdsChange: (ids: string[]) => void;
  selectedUserIds: string[];
  onUserIdsChange: (ids: string[]) => void;
  disabledGroupIds?: string[];
  disabledUserIds?: string[];
  defaultExpanded?: boolean;
  groupLabel?: string;
  disabledLabel?: string;
  accentColor?: 'blue' | 'green';
}

export function UserAndGroupSelector({
  companyId,
  label,
  icon,
  selectedGroupIds,
  onGroupIdsChange,
  selectedUserIds,
  onUserIdsChange,
  disabledGroupIds = [],
  disabledUserIds = [],
  defaultExpanded = false,
  groupLabel,
  disabledLabel = 'Already reviewed',
  accentColor = 'blue',
}: UserAndGroupSelectorProps) {
  const { reviewerGroups } = useReviewerGroups(companyId);
  const { authors } = useDocumentAuthors(companyId);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const getGroupMemberIds = (groupId: string): string[] => {
    const group = reviewerGroups.find(g => g.id === groupId);
    if (!group?.members) return [];
    return group.members
      .filter((m: any) => m.is_active !== false)
      .map((m: any) => m.user_id);
  };

  const handleGroupToggle = (groupId: string, checked: boolean) => {
    const memberIds = getGroupMemberIds(groupId);
    if (checked) {
      onGroupIdsChange([...selectedGroupIds, groupId]);
      // Exclude disabled (already reviewed) users when selecting a group
      const eligibleMemberIds = memberIds.filter(uid => !disabledUserIds.includes(uid));
      const newUserIds = new Set([...selectedUserIds, ...eligibleMemberIds]);
      onUserIdsChange(Array.from(newUserIds));
    } else {
      onGroupIdsChange(selectedGroupIds.filter(id => id !== groupId));
      const otherGroupMemberIds = new Set<string>();
      selectedGroupIds
        .filter(id => id !== groupId)
        .forEach(id => getGroupMemberIds(id).forEach(uid => otherGroupMemberIds.add(uid)));
      const toRemove = memberIds.filter(uid => !otherGroupMemberIds.has(uid));
      onUserIdsChange(selectedUserIds.filter(id => !toRemove.includes(id)));
    }
  };

  const handleUserToggle = (userId: string, checked: boolean) => {
    if (checked) {
      onUserIdsChange([...selectedUserIds, userId]);
    } else {
      onUserIdsChange(selectedUserIds.filter(id => id !== userId));
      // Auto-uncheck any group that this user belongs to (since not all members are selected anymore)
      const groupsToRemove = selectedGroupIds.filter(gid => {
        const members = getGroupMemberIds(gid);
        return members.includes(userId);
      });
      if (groupsToRemove.length > 0) {
        onGroupIdsChange(selectedGroupIds.filter(id => !groupsToRemove.includes(id)));
      }
    }
  };

  const userGroupMap = useMemo(() => {
    const map = new Map<string, string[]>();
    reviewerGroups.forEach(group => {
      (group.members || []).forEach((m: any) => {
        if (m.is_active !== false) {
          const existing = map.get(m.user_id) || [];
          existing.push(group.name);
          map.set(m.user_id, existing);
        }
      });
    });
    return map;
  }, [reviewerGroups]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return authors;
    const q = searchQuery.toLowerCase().trim();
    return authors.filter(a => a.name.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q));
  }, [authors, searchQuery]);

  const selectedUserSet = new Set(selectedUserIds);
  const selectedGroupSet = new Set(selectedGroupIds);
  const totalSelected = selectedUserIds.length;
  const totalAvailable = authors.length;

  return (
    <div>
      {/* Collapsed: label + badge */}
      <div
        className="flex items-center justify-between cursor-pointer py-1.5 px-2 rounded-md border hover:bg-muted/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Label className="flex items-center gap-1 cursor-pointer mb-0">
          {icon}
          {label}
        </Label>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`text-xs ${totalSelected > 0 ? 'border-green-300 bg-green-50 text-green-700' : 'border-gray-300 bg-gray-50 text-gray-500'}`}
          >
            {totalSelected}/{totalAvailable}
          </Badge>
          {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Expanded: group toggles + user list */}
      {isExpanded && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          {/* Group toggles */}
          {reviewerGroups.length > 0 && (
            <div className="space-y-1 border rounded-md p-2">
              <span className="text-xs text-muted-foreground">{groupLabel || `Select ${label.toLowerCase().replace(/s$/, '')} group`}</span>
              {reviewerGroups.map(group => {
                const activeMembers = (group.members || []).filter((m: any) => m.is_active !== false);
                const memberCount = activeMembers.length;
                const eligibleMembers = activeMembers.filter((m: any) => !disabledUserIds.includes(m.user_id));
                const allEligibleSelected = eligibleMembers.length > 0
                  ? eligibleMembers.every((m: any) => selectedUserSet.has(m.user_id))
                  : memberCount === 0 ? false : true;
                const isChecked = selectedGroupSet.has(group.id) && allEligibleSelected;
                const isGroupDisabled = disabledGroupIds.includes(group.id);
                return (
                  <label key={group.id} className={`flex items-center gap-2 py-1 px-1 rounded ${isGroupDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-muted/50 cursor-pointer'}`}>
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(checked) => handleGroupToggle(group.id, !!checked)}
                      disabled={isGroupDisabled}
                    />
                    <span className={`text-sm ${memberCount > 0 ? 'font-medium' : 'text-muted-foreground'}`}>{group.name}</span>
                    <span className="text-xs text-muted-foreground">({memberCount})</span>
                    {isGroupDisabled && <span className="text-xs text-green-600 ml-1">{disabledLabel}</span>}
                  </label>
                );
              })}
            </div>
          )}

          {/* Search + user list */}
          <div className={`space-y-1 min-w-0 ${reviewerGroups.length === 0 ? 'col-span-2' : ''}`}>
            <span className="text-xs text-muted-foreground">Individual users</span>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 text-sm pl-8"
              />
            </div>
            <div className="max-h-[160px] overflow-y-auto border rounded-md p-1.5 space-y-0.5">
              {filteredUsers.map(user => {
                const isChecked = selectedUserSet.has(user.id);
                const isDisabled = disabledUserIds.includes(user.id);
                const groups = userGroupMap.get(user.id);
                return (
                  <label
                    key={user.id}
                    className={`flex items-center gap-2 py-1 px-1 rounded text-sm ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-muted/50 cursor-pointer'}`}
                  >
                    <Checkbox
                      checked={isChecked}
                      disabled={isDisabled}
                      onCheckedChange={(checked) => handleUserToggle(user.id, !!checked)}
                    />
                    <span className="truncate">{user.name}</span>
                    {isDisabled && <span className="text-xs text-green-600 ml-1">{disabledLabel}</span>}
                    {groups && groups.length > 0 && (
                      <Badge variant="outline" className="text-[10px] ml-auto shrink-0">
                        {groups[0]}{groups.length > 1 ? ` +${groups.length - 1}` : ''}
                      </Badge>
                    )}
                  </label>
                );
              })}
              {filteredUsers.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">No users found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
