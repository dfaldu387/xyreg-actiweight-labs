
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button,
  TextField,
  FormControl,
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  Alert,
  Avatar,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  InputAdornment
} from '@mui/material';
import { Search, X, Users, Plus } from "lucide-react";
import { ReviewerGroupService, ReviewerGroup } from "@/services/reviewerGroupService";
import { ProductSpecificDocumentService } from "@/services/productSpecificDocumentService";
import { TemplateInstanceDocumentService } from "@/services/templateInstanceDocumentService";
import { toast } from "sonner";
import { ReviewerNotificationService } from "@/services/reviewerNotificationService";
import { useAuth } from "@/context/AuthContext";


interface AssignReviewersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: any;
  companyId: string;
  onDocumentUpdated: (document: any) => void;
  documentType: 'product-specific' | 'template-instance';
  productId: string;
  handleRefreshData: () => void;
}

export function AssignReviewersDialog({
  open,
  onOpenChange,
  document,
  companyId,
  onDocumentUpdated,
  documentType,
  productId,
  handleRefreshData
}: AssignReviewersDialogProps) {
  const [selectedGroups, setSelectedGroups] = useState<ReviewerGroup[]>([]);
  const [availableGroups, setAvailableGroups] = useState<ReviewerGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customGroupName, setCustomGroupName] = useState("");
  const { user } = useAuth();
  const reviewerGroupService = new ReviewerGroupService();

  // Create appropriate service based on document type
  const documentService = documentType === 'product-specific'
    ? new ProductSpecificDocumentService(productId, companyId)
    : new TemplateInstanceDocumentService(productId, companyId);

  // Load available reviewer groups and current document groups when dialog opens
  useEffect(() => {
    if (open) {
      loadReviewerGroups();
    }
  }, [open, companyId]);

  const loadReviewerGroups = async () => {
    setIsLoading(true);
    try {
      // Load available company reviewer groups
      const available = await reviewerGroupService.getCompanyGroups(companyId);
      setAvailableGroups(available);

      // Load current document reviewer groups (if any)
      // For now, we'll start with empty selection - you may need to implement
      // getting current document groups based on your document structure
      setSelectedGroups([]);
    } catch (error) {
      console.error('Error loading reviewer groups:', error);
      toast.error('Failed to load reviewer groups');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleGroup = (group: ReviewerGroup) => {
    setSelectedGroups(prev => {
      const isSelected = prev.some(g => g.id === group.id);
      if (isSelected) {
        return prev.filter(g => g.id !== group.id);
      } else {
        return [...prev, group];
      }
    });
  };

  const addCustomGroup = () => {
    if (!customGroupName.trim()) return;

    // Create a new group with a unique ID
    const newGroup: Partial<ReviewerGroup> = {
      id: `custom-${Date.now()}`,
      name: customGroupName,
      company_id: companyId,
      group_type: 'external',
      description: 'Custom reviewer group',
      permissions: {
        canDownload: true,
        canComment: true,
        canUpload: false,
        canApprove: false,
        canViewInternal: false
      },
      settings: {
        requireAllApprovals: false,
        allowSelfAssignment: true,
        enableNotifications: true,
        defaultDeadlineDays: 7
      }
    };

    setSelectedGroups(prev => [...prev, newGroup as ReviewerGroup]);
    setCustomGroupName("");
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      if (selectedGroups.length === 0) {
        toast.error("Please select at least one reviewer group");
        return;
      }

      console.log(`Updating reviewer groups for ${documentType} document:`, document.id, selectedGroups);

      // Update reviewer groups using the appropriate service
      const success = await documentService.updateReviewers(document.id, selectedGroups, user);

      if (success) {
        // Update the document object and notify parent
        const updatedDocument = {
          ...document,
          reviewer_groups: selectedGroups,
          reviewer_group_ids: selectedGroups.map(g => g.id),
          updated_at: new Date().toISOString()
        };

        onDocumentUpdated(updatedDocument);
        onOpenChange(false);
        handleRefreshData();

        // Notify all selected groups
        const notificationService = new ReviewerNotificationService();
        for (const group of selectedGroups) {
          await notificationService.notifyGroupMembersUpdate(group.id, group.name, companyId, 'added', document.name);
        }
      }
    } catch (error) {
      console.error("Error assigning reviewer group:", error);
      toast.error("Failed to assign reviewer group");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter groups based on search term
  const filteredGroups = availableGroups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    group.group_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { maxHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Typography variant="h6">
          Assign Reviewer Groups - {documentType === 'template-instance' ? 'Template Instance' : 'Product Document'}
        </Typography>
      </DialogTitle>

      <DialogContent>
        {isLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <CircularProgress size={24} sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Loading reviewer groups...
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 2 }}>
            <Alert
              severity="info"
              sx={{
                backgroundColor: documentType === 'product-specific' ? 'purple.50' : 'blue.50',
                borderColor: documentType === 'product-specific' ? 'purple.200' : 'blue.200',
                color: documentType === 'product-specific' ? 'purple.800' : 'blue.800',
                '& .MuiAlert-icon': {
                  color: documentType === 'product-specific' ? 'purple.600' : 'blue.600'
                }
              }}
            >
              <Typography variant="body2">
                Assigning reviewer groups to {documentType === 'product-specific'
                  ? 'product-specific document'
                  : 'template-based instance'}: {document.name}
              </Typography>
            </Alert>

            {/* Search bar */}
            <TextField
              fullWidth
              placeholder="Search reviewer groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />

            {/* Selected groups */}
            {selectedGroups.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                {selectedGroups.map((group) => (
                  <Chip
                    key={group.id}
                    label={group.name}
                    onDelete={() => setSelectedGroups(prev => prev.filter(g => g.id !== group.id))}
                    color="primary"
                    variant="filled"
                    icon={<Users />}
                    sx={{ backgroundColor: group.color || '#3b82f6' }}
                  />
                ))}
              </Box>
            )}

            {/* Available groups list */}
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {filteredGroups.length > 0 ? (
                <List>
                  {filteredGroups.map((group) => {
                    const isSelected = selectedGroups.some(g => g.id === group.id);
                    return (
                      <ListItem
                        key={group.id}
                        disablePadding
                        sx={{
                          backgroundColor: isSelected ? 'action.selected' : 'transparent',
                          '&:hover': {
                            backgroundColor: 'action.hover'
                          }
                        }}
                      >
                        <ListItemButton onClick={() => toggleGroup(group)}>
                          <ListItemAvatar>
                            <Avatar sx={{ backgroundColor: group.color || '#3b82f6' }}>
                              <Users />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={group.name}
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {group.group_type} • {group.members?.length || 0} members
                                </Typography>
                                {group.description && (
                                  <Typography variant="body2" color="text.secondary">
                                    {group.description}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                          <Checkbox
                            checked={isSelected}
                            onChange={() => toggleGroup(group)}
                          />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No reviewer groups found
                  </Typography>
                  {searchTerm && (
                    <Typography variant="body2" color="text.secondary">
                      Try a different search term
                    </Typography>
                  )}
                </Box>
              )}
            </Box>

            {/* Add custom group */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                placeholder="Add custom group by name..."
                value={customGroupName}
                onChange={(e) => setCustomGroupName(e.target.value)}
                variant="outlined"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addCustomGroup();
                  }
                }}
              />
              <Button
                variant="outlined"
                onClick={addCustomGroup}
                disabled={!customGroupName.trim()}
                startIcon={<Plus />}
              >
                Add
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          onClick={() => onOpenChange(false)}
          color="inherit"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || isLoading}
          variant="contained"
          sx={{
            backgroundColor: '#000',
            color: '#fff',
            '&:hover': {
              backgroundColor: '#000',
            }
          }}
        >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
