import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Users, 
  ChevronDown, 
  Settings, 
  Download, 
  MessageCircle, 
  Upload, 
  CheckCircle,
  Eye,
  X
} from 'lucide-react';
import { useReviewerGroups } from '@/hooks/useReviewerGroups';
import { ReviewerGroupManagementDialog } from '@/components/review/ReviewerGroupManagementDialog';

interface ReviewerGroupSelectorMultipleProps {
  selectedGroups: string[];
  onGroupsChange: (groups: string[]) => void;
  companyId: string;
  showManageButton?: boolean;
  showPermissions?: boolean;
  disabled?: boolean;
}

export function ReviewerGroupSelectorMultiple({
  selectedGroups,
  onGroupsChange,
  companyId,
  showManageButton = true,
  showPermissions = true,
  disabled = false
}: ReviewerGroupSelectorMultipleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const { groups, isLoading } = useReviewerGroups(companyId);
  
  const selectedGroupObjects = groups.filter(g => selectedGroups.includes(g.id));

  const getGroupIcon = (type: string) => {
    switch (type) {
      case 'regulatory': return '🏛️';
      case 'external': return '🌐';
      default: return '👥';
    }
  };

  const getPermissionIcons = (permissions: any) => {
    const icons = [];
    if (permissions.canDownload) icons.push(<Download key="download" className="h-3 w-3" />);
    if (permissions.canComment) icons.push(<MessageCircle key="comment" className="h-3 w-3" />);
    if (permissions.canUpload) icons.push(<Upload key="upload" className="h-3 w-3" />);
    if (permissions.canApprove) icons.push(<CheckCircle key="approve" className="h-3 w-3" />);
    if (permissions.canViewInternal) icons.push(<Eye key="view" className="h-3 w-3" />);
    return icons;
  };

  const toggleGroup = (groupId: string) => {
    if (disabled) return;
    
    if (selectedGroups.includes(groupId)) {
      onGroupsChange(selectedGroups.filter(id => id !== groupId));
    } else {
      onGroupsChange([...selectedGroups, groupId]);
    }
  };

  const removeGroup = (groupId: string) => {
    if (disabled) return;
    onGroupsChange(selectedGroups.filter(id => id !== groupId));
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Button variant="outline" size="sm" disabled>
          <Users className="h-4 w-4 mr-2" />
          Loading groups...
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <Popover open={isOpen && !disabled} onOpenChange={disabled ? undefined : setIsOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2 justify-start"
              disabled={disabled}
            >
              <Users className="h-4 w-4" />
              <span>
                {selectedGroups.length === 0 
                  ? 'Select Review Groups' 
                  : `${selectedGroups.length} group${selectedGroups.length !== 1 ? 's' : ''} selected`}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0">
            <div className="p-3 border-b">
              <h4 className="font-medium text-sm">Select Review Groups</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Choose who should review this item
              </p>
            </div>
            
            <div className="p-2 max-h-80 overflow-y-auto">
              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => toggleGroup(group.id)}
                  disabled={disabled}
                  className={`w-full p-3 rounded-md text-left hover:bg-muted/50 transition-colors ${
                    selectedGroups.includes(group.id) ? 'bg-muted' : ''
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getGroupIcon(group.group_type)}</span>
                      <span className="font-medium text-sm">{group.name}</span>
                      {selectedGroups.includes(group.id) && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary"
                        style={{ backgroundColor: group.color + '20', color: group.color }}
                      >
                        {group.members?.length || 0} member{(group.members?.length || 0) !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                  
                  {group.description && (
                    <p className="text-xs text-muted-foreground mb-2">{group.description}</p>
                  )}
                  
                  {/* Members preview */}
                  {group.members && group.members.length > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex -space-x-1">
                        {group.members.slice(0, 3).map((member) => (
                          <Avatar key={member.id} className="h-5 w-5 border border-background">
                            <AvatarImage src={member.avatar_url} />
                            <AvatarFallback className="text-xs">
                              {member.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {group.members.length > 3 && (
                          <div className="h-5 w-5 rounded-full bg-muted border border-background flex items-center justify-center">
                            <span className="text-xs">+{group.members.length - 3}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {group.members.slice(0, 2).map(m => m.name).join(', ')}
                        {group.members.length > 2 && ` +${group.members.length - 2} more`}
                      </div>
                    </div>
                  )}

                  {/* Permissions */}
                  {showPermissions && (
                    <div className="flex items-center gap-1 mb-2">
                      {getPermissionIcons(group.permissions).map((icon, index) => (
                        <div key={index} className="p-1 bg-muted rounded text-muted-foreground">
                          {icon}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-1 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {group.group_type}
                    </Badge>
                    {group.is_default && (
                      <Badge variant="secondary" className="text-xs">
                        default
                      </Badge>
                    )}
                    {group.settings.requireAllApprovals && (
                      <Badge variant="outline" className="text-xs">
                        all approvals
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
              
              {groups.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-sm">No reviewer groups found</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => setShowManageDialog(true)}
                    disabled={disabled}
                  >
                    Create First Group
                  </Button>
                </div>
              )}
            </div>
            
            {showManageButton && groups.length > 0 && (
              <div className="p-2 border-t">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => setShowManageDialog(true)}
                  disabled={disabled}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Review Groups
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Selected groups display */}
        {selectedGroups.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedGroupObjects.map(group => (
              <Badge 
                key={group.id} 
                variant="secondary" 
                className="flex items-center gap-1"
                style={{ backgroundColor: group.color + '20', color: group.color }}
              >
                <span>{getGroupIcon(group.group_type)}</span>
                <span>{group.name}</span>
                <button
                  onClick={() => removeGroup(group.id)}
                  disabled={disabled}
                  className={`ml-1 hover:bg-black/10 rounded-full p-0.5 ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <ReviewerGroupManagementDialog
        open={showManageDialog && !disabled}
        onOpenChange={disabled ? undefined : setShowManageDialog}
        companyId={companyId}
      />
    </>
  );
}
