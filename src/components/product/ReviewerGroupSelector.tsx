
import React, { useState } from 'react';
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
  Plus, 
  Settings, 
  Download, 
  MessageCircle, 
  Upload, 
  CheckCircle,
  Eye
} from 'lucide-react';
import { ReviewerGroup } from '@/services/reviewerGroupService';
import { getGroupIcon } from '@/types/reviewerGroups';

interface ReviewerGroupSelectorProps {
  selectedGroupId?: string;
  onGroupSelect: (groupId: string) => void;
  availableGroups?: ReviewerGroup[];
  showManageButton?: boolean;
  showPermissions?: boolean;
  onManageGroups?: () => void;
}

export function ReviewerGroupSelector({
  selectedGroupId,
  onGroupSelect,
  availableGroups = [],
  showManageButton = true,
  showPermissions = true,
  onManageGroups
}: ReviewerGroupSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedGroup = availableGroups.find(g => g.id === selectedGroupId);

  const getPermissionIcons = (permissions: any) => {
    const icons = [];
    if (permissions.canDownload) icons.push(<Download key="download" className="h-3 w-3" />);
    if (permissions.canComment) icons.push(<MessageCircle key="comment" className="h-3 w-3" />);
    if (permissions.canUpload) icons.push(<Upload key="upload" className="h-3 w-3" />);
    if (permissions.canApprove) icons.push(<CheckCircle key="approve" className="h-3 w-3" />);
    if (permissions.canViewInternal) icons.push(<Eye key="view" className="h-3 w-3" />);
    return icons;
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            {selectedGroup ? (
              <div className="flex items-center gap-2">
                <span>{getGroupIcon(selectedGroup.type)}</span>
                <span>{selectedGroup.name}</span>
                {selectedGroup.members.length > 0 && (
                  <div className="flex -space-x-1">
                    {selectedGroup.members.slice(0, 2).map((member) => (
                      <Avatar key={member.id} className="h-4 w-4 border border-background">
                        <AvatarImage src={member.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {selectedGroup.members.length > 2 && (
                      <div className="h-4 w-4 rounded-full bg-muted border border-background flex items-center justify-center">
                        <span className="text-xs">+{selectedGroup.members.length - 2}</span>
                      </div>
                    )}
                  </div>
                )}
                <Badge 
                  variant="secondary" 
                  style={{ backgroundColor: selectedGroup.color + '20', color: selectedGroup.color }}
                >
                  {selectedGroup.members.length}
                </Badge>
              </div>
            ) : (
              <span>Select Review Group</span>
            )}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0">
          <div className="p-3 border-b">
            <h4 className="font-medium text-sm">Select Review Group</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Choose who should review this document
            </p>
          </div>
          
          <div className="p-2 max-h-80 overflow-y-auto">
            {availableGroups.map((group) => (
              <button
                key={group.id}
                onClick={() => {
                  onGroupSelect(group.id);
                  setIsOpen(false);
                }}
                className={`w-full p-3 rounded-md text-left hover:bg-muted/50 transition-colors ${
                  selectedGroupId === group.id ? 'bg-muted' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getGroupIcon(group.type)}</span>
                    <span className="font-medium text-sm">{group.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary"
                      style={{ backgroundColor: group.color + '20', color: group.color }}
                    >
                      {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>
                
                {group.description && (
                  <p className="text-xs text-muted-foreground mb-2">{group.description}</p>
                )}
                
                {/* Members preview */}
                {group.members.length > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex -space-x-1">
                      {group.members.slice(0, 3).map((member) => (
                        <Avatar key={member.id} className="h-5 w-5 border border-background">
                          <AvatarImage src={member.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
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
                    {group.type}
                  </Badge>
                  {group.isDefault && (
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
          </div>
          
          {showManageButton && (
            <div className="p-2 border-t">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start"
                onClick={onManageGroups}
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage Review Groups
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
