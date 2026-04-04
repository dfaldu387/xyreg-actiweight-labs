import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  Alert,
  Chip
} from '@mui/material';
import { AlertTriangle } from 'lucide-react';
import { Activity, ACTIVITY_TYPES } from '@/types/activities';
import { useProductPhases } from '@/hooks/useProductPhases';
import { toast } from 'sonner';

interface EditActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (activityId: string, updates: Partial<Activity>) => void;
  activity: Activity | null;
  companyId: string;
  productId?: string | null;
}

export function EditActivityDialog({
  open,
  onOpenChange,
  onSubmit,
  activity,
  companyId,
  productId
}: EditActivityDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Get phases for the product
  const { phases } = useProductPhases(productId, companyId);

  const [formData, setFormData] = useState({
    name: '',
    type: 'other' as Activity['type'],
    start_date: '',
    end_date: '',
    status: 'planned' as Activity['status'],
    phase_id: ''
  });

  // Track original activity data for unsaved changes detection
  const [originalData, setOriginalData] = useState({
    name: '',
    type: 'other' as Activity['type'],
    start_date: '',
    end_date: '',
    status: 'planned' as Activity['status'],
    phase_id: ''
  });

  // Initialize form data when activity changes
  useEffect(() => {
    if (activity && open) {
      const activityData = {
        name: activity.name || '',
        type: activity.type || 'other' as Activity['type'],
        start_date: activity.start_date || '',
        end_date: activity.end_date || '',
        status: activity.status || 'planned' as Activity['status'],
        phase_id: activity.phase_id || ''
      };
      setFormData(activityData);
      setOriginalData(activityData);
      setError(null);
    }
  }, [activity, open]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  // Detect unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (!activity) return false;
    return (
      formData.name !== originalData.name ||
      formData.type !== originalData.type ||
      formData.start_date !== originalData.start_date ||
      formData.end_date !== originalData.end_date ||
      formData.status !== originalData.status ||
      formData.phase_id !== originalData.phase_id
    );
  }, [formData, originalData, activity]);

  // Reset form data
  const resetForm = useCallback(() => {
    const defaultData = {
      name: '',
      type: 'other' as Activity['type'],
      start_date: '',
      end_date: '',
      status: 'planned' as Activity['status'],
      phase_id: ''
    };
    setFormData(defaultData);
    setOriginalData(defaultData);
    setError(null);
    setIsSubmitting(false);
    setShowConfirmDialog(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !activity) {
      toast.error('Activity name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(activity.id, {
        name: formData.name.trim(),
        type: formData.type,
        product_id: productId || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        status: formData.status,
        phase_id: formData.phase_id || null
      });
      toast.success('Activity updated successfully');
      onOpenChange(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update activity';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseDialog = () => {
    if (hasUnsavedChanges && !showConfirmDialog) {
      setShowConfirmDialog(true);
    } else {
      onOpenChange(false);
    }
  };

  const handleConfirmClose = () => {
    setShowConfirmDialog(false);
    onOpenChange(false);
  };

  const handleCancelClose = () => {
    setShowConfirmDialog(false);
  };

  // Handle form field changes
  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle phase selection change and auto-fill dates
  const handlePhaseChange = (phaseId: string) => {
    setFormData(prev => ({ ...prev, phase_id: phaseId }));
    
    if (phaseId) {
      const selectedPhase = phases.find(phase => phase.id === phaseId);
      if (selectedPhase && selectedPhase.start_date && selectedPhase.end_date) {
        setFormData(prev => ({
          ...prev,
          phase_id: phaseId,
          start_date: selectedPhase.start_date,
          end_date: selectedPhase.end_date
        }));
      }
    }
  };

  if (!activity) return null;

  return (
    <>
      <Dialog
        open={open}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { maxHeight: '90vh' }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h6">Edit Activity</Typography>
            {hasUnsavedChanges && (
              <Chip
                icon={<AlertTriangle size={16} />}
                label="Unsaved changes"
                color="warning"
                size="small"
              />
            )}
          </Box>
        </DialogTitle>

        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Edit the activity details including name, type, dates, and status.
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {error && (
              <Alert severity="error">
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Activity Name"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              placeholder="Enter activity name"
              required
              disabled={isSubmitting}
              variant="outlined"
            />

            <FormControl fullWidth disabled={isSubmitting}>
              <InputLabel>Activity Type</InputLabel>
              <Select
                value={formData.type}
                label="Activity Type"
                onChange={(e) => handleFieldChange('type', e.target.value)}
              >
                {Object.entries(ACTIVITY_TYPES).map(([key, label]) => (
                  <MenuItem key={key} value={key}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={isSubmitting}>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={(e) => handleFieldChange('status', e.target.value)}
              >
                <MenuItem value="planned">Planned</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={isSubmitting}>
              <InputLabel>Phase</InputLabel>
              <Select
                value={formData.phase_id}
                label="Phase"
                onChange={(e) => handlePhaseChange(e.target.value)}
              >
                <MenuItem value="">
                  <em>No Phase</em>
                </MenuItem>
                {phases.map((phase) => (
                  <MenuItem key={phase.id} value={phase.id}>
                    {phase.name}
                    {(phase.start_date || phase.end_date) && (
                      <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                        ({phase.start_date ? new Date(phase.start_date).toLocaleDateString() : 'Start TBD'} - {phase.end_date ? new Date(phase.end_date).toLocaleDateString() : 'End TBD'})
                      </Typography>
                    )}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Begin Date"
              type="date"
              value={formData.start_date}
              onChange={(e) => handleFieldChange('start_date', e.target.value)}
              disabled={isSubmitting}
              InputLabelProps={{
                shrink: true,
              }}
            />

            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={formData.end_date}
              onChange={(e) => handleFieldChange('end_date', e.target.value)}
              disabled={isSubmitting}
              inputProps={{
                min: formData.start_date || undefined
              }}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={handleCloseDialog}
            disabled={isSubmitting}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.name.trim()}
            variant="contained"
            // color="secondary"
            sx={{
              backgroundColor: '#000',
              color: '#fff',
              '&:hover': {
                backgroundColor: '#000',
              }
            }}
          >
            {isSubmitting ? 'Updating...' : 'Update Activity'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmDialog}
        onClose={handleCancelClose}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">Unsaved Changes</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography>
            You have unsaved changes. Are you sure you want to discard them?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelClose} color="inherit">
            Keep Editing
          </Button>
          <Button onClick={handleConfirmClose} color="error" variant="contained">
            Discard Changes
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}