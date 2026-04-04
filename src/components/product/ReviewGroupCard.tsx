
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MoreHorizontal, 
  Settings, 
  Trash2, 
  Users,
  Download, 
  MessageCircle, 
  Upload, 
  CheckCircle,
  Eye
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ReviewerGroup, getGroupIcon } from '@/types/reviewerGroups';

interface ReviewGroupCardProps {
  group: ReviewerGroup;
  onSelect: () => void;
  onUpdate: (group: ReviewerGroup) => void;
  onDelete: (groupId: string) => void;
  showPermissions?: boolean;
}

export function ReviewGroupCard({ 
  group, 
  onSelect, 
  onUpdate, 
  onDelete, 
  showPermissions = true 
}: ReviewGroupCardProps) {
  
  const getPermissionIcons = () => {
    const icons = [];
    if (group.permissions.canDownload) icons.push(<Download key="download" className="h-3 w-3" />);
    if (group.permissions.canComment) icons.push(<MessageCircle key="comment" className="h-3 w-3" />);
    if (group.permissions.canUpload) icons.push(<Upload key="upload" className="h-3 w-3" />);
    if (group.permissions.canApprove) icons.push(<CheckCircle key="approve" className="h-3 w-3" />);
    if (group.permissions.canViewInternal) icons.push(<Eye key="view" className="h-3 w-3" />);
    return icons;
  };

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getGroupIcon(group.type)}</span>
            <div>
              <h4 className="font-medium text-sm">{group.name}</h4>
              <Badge 
                variant="secondary" 
                className="text-xs"
                style={{ 
                  backgroundColor: group.color + '20', 
                  color: group.color 
                }}
              >
                {group.type}
              </Badge>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelect(); }}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              {!group.isDefault && (
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); onDelete(group.id); }}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Description */}
        {group.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {group.description}
          </p>
        )}

        {/* Members */}
        <div className="flex items-center gap-2">
          <Users className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {group.members.length} member{group.members.length !== 1 ? 's' : ''}
          </span>
          {group.members.length > 0 && (
            <div className="flex -space-x-1 ml-2">
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
          )}
        </div>

        {/* Permissions */}
        {showPermissions && (
          <div className="flex items-center gap-1 flex-wrap">
            {getPermissionIcons().map((icon, index) => (
              <div key={index} className="p-1 bg-muted rounded text-muted-foreground">
                {icon}
              </div>
            ))}
          </div>
        )}

        {/* Settings Preview */}
        <div className="flex gap-1 text-xs">
          {group.settings.requireAllApprovals && (
            <Badge variant="outline" className="text-xs">All approvals</Badge>
          )}
          {group.settings.defaultDeadlineDays && (
            <Badge variant="outline" className="text-xs">
              {group.settings.defaultDeadlineDays}d deadline
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
