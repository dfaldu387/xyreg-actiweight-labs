import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';
import { toast } from 'sonner';

interface ProductModelCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string) => Promise<void>;
}

export function ProductModelCreateDialog({ open, onOpenChange, onCreate }: ProductModelCreateDialogProps) {
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setName('');
      setIsSaving(false);
    }
  }, [open]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setIsSaving(false);
    };
  }, []);

  const handleCreate = async () => {
    if (isSaving) return; // Prevent multiple submissions
    
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Model name is required');
      return;
    }
    
    setIsSaving(true);
    try {
      // Use setTimeout to ensure the UI updates before the async operation
      await new Promise(resolve => setTimeout(resolve, 0));
      await onCreate(trimmed);
      toast.success('Product model created');
      onOpenChange(false);
    } catch (e) {
      console.error('Error creating product model:', e);
      toast.error('Failed to create model');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (isSaving) return; // Prevent canceling while saving
    setName('');
    onOpenChange(false);
  };

  const handleClose = (event: {}, reason: string) => {
    if (reason === 'backdropClick' && isSaving) {
      return; // Prevent closing while saving
    }
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={isSaving}
      PaperProps={{
        sx: {
          borderRadius: 2,
          backgroundColor: 'hsl(var(--card))',
          color: 'hsl(var(--card-foreground))',
          border: '1px solid hsl(var(--border))',
        }
      }}
    >
      <DialogTitle
        sx={{
          color: 'hsl(var(--foreground))',
          fontWeight: 600,
          fontSize: '1.25rem',
          pb: 1
        }}
      >
        Create New Product Model
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        <Typography
          variant="body2"
          sx={{
            color: 'hsl(var(--muted-foreground))',
            mb: 3,
            lineHeight: 1.5
          }}
        >
          Enter a model/reference name. It will be set on the current product and available for reuse.
        </Typography>

        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="Model Name"
            placeholder="e.g., RIC"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isSaving && name.trim()) {
                handleCreate();
              }
            }}
            variant="outlined"
            required
            disabled={isSaving}
            autoFocus
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                '& fieldset': {
                  borderColor: 'hsl(var(--border))',
                },
                '&:hover fieldset': {
                  borderColor: 'hsl(var(--ring))',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'hsl(var(--primary))',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'hsl(var(--foreground))',
                '&.Mui-focused': {
                  color: 'hsl(var(--primary))',
                },
              },
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0, gap: 1 }}>
        <Button
          variant="outlined"
          onClick={handleCancel}
          disabled={isSaving}
          sx={{
            color: 'hsl(var(--foreground))',
            borderColor: 'hsl(var(--border))',
            '&:hover': {
              borderColor: 'hsl(var(--ring))',
              backgroundColor: 'hsl(var(--accent))',
            },
            '&:disabled': {
              color: 'hsl(var(--muted-foreground))',
              borderColor: 'hsl(var(--border))',
            }
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          disabled={isSaving || !name.trim()}
          variant="contained"
          sx={{
            backgroundColor: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
            '&:hover': {
              backgroundColor: 'hsl(var(--primary))',
              opacity: 0.9,
            },
            '&:disabled': {
              backgroundColor: 'hsl(var(--muted))',
              color: 'hsl(var(--muted-foreground))',
            }
          }}
        >
          {isSaving ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} sx={{ color: 'inherit' }} />
              Creating...
            </Box>
          ) : (
            'Create'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}