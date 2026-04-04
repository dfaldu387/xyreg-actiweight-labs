import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { DocumentVersionService } from '@/services/documentVersionService';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface SaveVersionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string | null;
  template: any;
  onVersionSaved?: () => void;
}

export function SaveVersionDialog({
  open,
  onOpenChange,
  documentId,
  template,
  onVersionSaved
}: SaveVersionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasVersions, setHasVersions] = useState(false);
  const [versionAction, setVersionAction] = useState<'new' | 'update'>('new');
  const [versionName, setVersionName] = useState('');
  const [changeSummary, setChangeSummary] = useState('');
  const [existingVersions, setExistingVersions] = useState<any[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');

  useEffect(() => {
    const checkVersions = async () => {
      if (!documentId || !open) return;

      try {
        const result = await DocumentVersionService.getDocumentVersions(documentId);
        if (result.success && result.data) {
          setExistingVersions(result.data);
          setHasVersions(result.data.length > 0);
          
          // Set default version name for new version
          const nextVersionNumber = result.data.length + 1;
          setVersionName(`Version ${nextVersionNumber}`);
          
          // Set default action based on versions existence
          setVersionAction(result.data.length > 0 ? 'new' : 'new');
          
          // Select the latest version by default for update
          if (result.data.length > 0) {
            setSelectedVersionId(result.data[0].id);
          }
        }
      } catch (error) {
        console.error('Error checking versions:', error);
      }
    };

    checkVersions();
  }, [documentId, open]);

  const handleSaveVersion = async () => {
    if (!documentId) {
      toast.error('No document selected');
      return;
    }

    if (!versionName.trim()) {
      toast.error('Please enter a version name');
      return;
    }

    setIsLoading(true);
    try {
      const user = await supabase.auth.getUser();
      
      if (versionAction === 'new') {
        // Create new version
        const result = await DocumentVersionService.createVersion({
          documentId,
          versionName: versionName.trim(),
          changeSummary: changeSummary.trim() || 'Version saved',
          documentData: template,
          createdBy: user.data.user?.id
        });

        if (result.success) {
          toast.success(`${versionName} created successfully`);
          onVersionSaved?.();
          onOpenChange(false);
          
          // Reset form
          setVersionName('');
          setChangeSummary('');
        } else {
          toast.error(result.error || 'Failed to create version');
        }
      } else {
        // Update existing version
        if (!selectedVersionId) {
          toast.error('Please select a version to update');
          return;
        }

        const result = await DocumentVersionService.updateVersion(
          selectedVersionId,
          {
            version_name: versionName.trim(),
            change_summary: changeSummary.trim() || 'Version updated',
            document_data: template
          }
        );

        if (result.success) {
          toast.success(`${versionName} updated successfully`);
          onVersionSaved?.();
          onOpenChange(false);
          
          // Reset form
          setChangeSummary('');
        } else {
          toast.error(result.error || 'Failed to update version');
        }
      }
    } catch (error) {
      console.error('Error saving version:', error);
      toast.error('Failed to save version');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Save Version</DialogTitle>
          <DialogDescription>
            {hasVersions
              ? 'Save a new version or update an existing version of this document.'
              : 'Create the first version of this document.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {hasVersions && (
            <div className="space-y-3">
              <Label>Action</Label>
              <RadioGroup
                value={versionAction}
                onValueChange={(value) => {
                  setVersionAction(value as 'new' | 'update');
                  if (value === 'new') {
                    const nextVersionNumber = existingVersions.length + 1;
                    setVersionName(`Version ${nextVersionNumber}`);
                  } else if (existingVersions.length > 0) {
                    setVersionName(existingVersions[0].version_name);
                  }
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="new" id="new" />
                  <Label htmlFor="new" className="font-normal cursor-pointer">
                    Save as new version
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="update" id="update" />
                  <Label htmlFor="update" className="font-normal cursor-pointer">
                    Update existing version
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {versionAction === 'update' && existingVersions.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="select-version">Select Version to Update</Label>
              <select
                id="select-version"
                value={selectedVersionId}
                onChange={(e) => {
                  setSelectedVersionId(e.target.value);
                  const version = existingVersions.find(v => v.id === e.target.value);
                  if (version) {
                    setVersionName(version.version_name);
                  }
                }}
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
              >
                {existingVersions.map((version) => (
                  <option key={version.id} value={version.id}>
                    {version.version_name} ({new Date(version.created_at).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="version-name">Version Name</Label>
            <Input
              id="version-name"
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              placeholder="e.g., Version 1.0"
              disabled={versionAction === 'update'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="change-summary">Change Summary (Optional)</Label>
            <Textarea
              id="change-summary"
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              placeholder="Describe what changed in this version..."
              rows={3}
            />
          </div>

          {existingVersions.length > 0 && (
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
              <p className="font-medium mb-1">Existing versions: {existingVersions.length}</p>
              <p>Latest: {existingVersions[0]?.version_name}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSaveVersion} disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {versionAction === 'new' ? 'Save New Version' : 'Update Version'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
