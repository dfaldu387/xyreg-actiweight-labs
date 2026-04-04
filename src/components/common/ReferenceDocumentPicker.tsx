import React, { useState, useMemo, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Chip,
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  InputAdornment,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { Search, Upload, X, Loader2 } from 'lucide-react';
import { useReferenceDocuments } from '@/hooks/useReferenceDocuments';
import type { ReferenceDocument } from '@/services/referenceDocumentService';

interface ReferenceDocumentPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  selectedIds: string[];
  onConfirm: (ids: string[]) => void;
}

export function ReferenceDocumentPicker({
  open,
  onOpenChange,
  companyId,
  selectedIds,
  onConfirm,
}: ReferenceDocumentPickerProps) {
  const { documents, isLoading, upload, isUploading } = useReferenceDocuments(companyId);
  const [localSelected, setLocalSelected] = useState<string[]>(selectedIds);
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload dialog state
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingTags, setPendingTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Reset local state when dialog opens
  React.useEffect(() => {
    if (open) {
      setLocalSelected(selectedIds);
      setSearch('');
    }
  }, [open, selectedIds]);

  const filtered = useMemo(() => {
    if (!search.trim()) return documents;
    const q = search.toLowerCase();
    return documents.filter(
      (d) =>
        d.file_name.toLowerCase().includes(q) ||
        d.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [documents, search]);

  const toggle = (id: string) => {
    setLocalSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    onConfirm(localSelected);
    onOpenChange(false);
  };

  // When user selects files, show upload dialog
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setPendingFiles(Array.from(files));
    setPendingTags([]);
    setTagInput('');
    setShowUploadDialog(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !pendingTags.includes(tag)) {
      setPendingTags((prev) => [...prev, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setPendingTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const cancelUpload = () => {
    setShowUploadDialog(false);
    setPendingFiles([]);
    setPendingTags([]);
    setTagInput('');
  };

  const handleUpload = () => {
    if (pendingFiles.length === 0) return;
    upload(
      { files: pendingFiles, tags: pendingTags },
      {
        onSuccess: (results) => {
          // Auto-select newly uploaded docs
          setLocalSelected((prev) => [...prev, ...results.map((r) => r.id)]);
          setShowUploadDialog(false);
          setPendingFiles([]);
          setPendingTags([]);
          setTagInput('');
        },
      }
    );
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={() => onOpenChange(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { maxHeight: '70vh' } }}
        sx={{ zIndex: 1500 }}
      >
        <DialogTitle>Select Reference Documents</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, mt: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name or tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={16} />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              startIcon={<Upload size={16} />}
              sx={{ whiteSpace: 'nowrap', minWidth: 'auto', px: 2 }}
            >
              Add Doc
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              onChange={handleFileSelect}
            />
          </Box>

          {isLoading ? (
            <Typography variant="body2" color="text.secondary">
              Loading...
            </Typography>
          ) : filtered.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="body2" color="text.secondary">
                No reference documents found.
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Upload files using the button above.
              </Typography>
            </Box>
          ) : (
            <List dense sx={{ maxHeight: '45vh', overflow: 'auto' }}>
              {filtered.map((doc) => (
                <ListItem key={doc.id} disablePadding>
                  <ListItemButton onClick={() => toggle(doc.id)} dense>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Checkbox
                        {...{ edge: "start" } as any}
                        checked={localSelected.includes(doc.id)}
                        tabIndex={-1}
                        disableRipple
                        size="small"
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={doc.file_name}
                      secondary={
                        doc.tags && doc.tags.length > 0 ? (
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                            {doc.tags.map((tag) => (
                              <Chip key={tag} label={tag} size="small" variant="outlined" />
                            ))}
                          </Box>
                        ) : null
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}

          {localSelected.length > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {localSelected.length} document(s) selected
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onOpenChange(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirm} variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Reference Documents Dialog */}
      <Dialog
        open={showUploadDialog}
        onClose={cancelUpload}
        maxWidth="sm"
        fullWidth
        sx={{ zIndex: 1600 }}
      >
        <DialogTitle>Upload Reference Documents</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {/* Selected files */}
            <Box>
              <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>
                {pendingFiles.length} file(s) selected
              </Typography>
              <Box sx={{ maxHeight: 192, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {pendingFiles.map((f, i) => (
                  <Box
                    key={i}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      bgcolor: 'action.hover',
                      borderRadius: 1,
                      px: 1.5,
                      py: 0.75,
                    }}
                  >
                    <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                      {f.name}
                    </Typography>
                    <IconButton size="small" onClick={() => removePendingFile(i)}>
                      <X size={14} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Tags */}
            <Box>
              <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>
                Tags (optional)
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="e.g. clinical trial A"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                />
                <Button variant="outlined" size="small" onClick={addTag} sx={{ minWidth: 'auto' }}>
                  Add
                </Button>
              </Box>
              {pendingTags.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                  {pendingTags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      variant="outlined"
                      onDelete={() => removeTag(tag)}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelUpload} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={pendingFiles.length === 0 || isUploading}
            startIcon={isUploading ? <CircularProgress size={16} /> : undefined}
          >
            {isUploading ? 'Uploading...' : `Upload ${pendingFiles.length} file(s)`}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
