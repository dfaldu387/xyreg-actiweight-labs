
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Download, 
  MessageCircle, 
  Upload, 
  CheckCircle,
  Eye
} from 'lucide-react';
import { ReviewerGroup, ReviewerGroupPermissions, getPermissionLabel } from '@/types/reviewerGroups';

interface ReviewGroupPermissionsProps {
  group: ReviewerGroup;
  onPermissionChange: (permissions: ReviewerGroupPermissions) => void;
  readonly?: boolean;
}

export function ReviewGroupPermissions({ 
  group, 
  onPermissionChange, 
  readonly = false 
}: ReviewGroupPermissionsProps) {
  
  const handlePermissionToggle = (permission: keyof ReviewerGroupPermissions) => {
    if (readonly) return;
    
    const newPermissions = {
      ...group.permissions,
      [permission]: !group.permissions[permission]
    };
    onPermissionChange(newPermissions);
  };

  const permissionItems = [
    {
      key: 'canDownload' as const,
      icon: <Download className="h-4 w-4" />,
      label: 'Download files',
      description: 'Allow members to download document files'
    },
    {
      key: 'canComment' as const,
      icon: <MessageCircle className="h-4 w-4" />,
      label: 'Add comments',
      description: 'Allow members to add comments and feedback'
    },
    {
      key: 'canUpload' as const,
      icon: <Upload className="h-4 w-4" />,
      label: 'Upload files',
      description: 'Allow members to upload new versions or attachments'
    },
    {
      key: 'canApprove' as const,
      icon: <CheckCircle className="h-4 w-4" />,
      label: 'Approve/Reject',
      description: 'Allow members to approve or reject documents'
    },
    {
      key: 'canViewInternal' as const,
      icon: <Eye className="h-4 w-4" />,
      label: 'View internal comments',
      description: 'Allow members to see internal team comments'
    }
  ];

  return (
    <div className="space-y-4">
      <h4 className="font-medium">Permissions</h4>
      <div className="space-y-4">
        {permissionItems.map((item) => (
          <div key={item.key} className="flex items-start space-x-3">
            <div className="flex items-center space-x-2 flex-1">
              <div className="text-muted-foreground">
                {item.icon}
              </div>
              <div className="flex-1">
                <Label 
                  htmlFor={`permission-${item.key}`}
                  className="text-sm font-medium"
                >
                  {item.label}
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {item.description}
                </p>
              </div>
            </div>
            <Switch
              id={`permission-${item.key}`}
              checked={group.permissions[item.key]}
              onCheckedChange={() => handlePermissionToggle(item.key)}
              disabled={readonly}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
