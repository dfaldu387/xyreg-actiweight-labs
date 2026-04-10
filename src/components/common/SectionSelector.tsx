import React, { useState, useMemo } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  TextField,
  Button,
  CircularProgress,
  ListSubheader,
  InputAdornment,
  IconButton,
  Divider,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon, Clear as ClearIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useComplianceSections } from '@/hooks/useComplianceSections';
import { complianceSectionService } from '@/services/complianceSectionService';
import { toast } from 'sonner';

interface SectionSelectorProps {
  value: string;
  onChange: (value: string, sectionId?: string) => void;
  companyId: string;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  phaseId?: string;
  compact?: boolean;
}

export function SectionSelector({
  value,
  onChange,
  companyId,
  disabled = false,
  label = 'Section',
  placeholder = 'Select or create a section',
  phaseId,
  compact = false
}: SectionSelectorProps) {
  const { sections, isLoading, createSection, deleteSection, refetch } = useComplianceSections(companyId, { phaseId });
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

  // Edit state
  const [editingSection, setEditingSection] = useState<{ id: string; name: string } | null>(null);
  const [editName, setEditName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete confirmation state
  const [deletingSection, setDeletingSection] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Resolve value: if it's a UUID (section ID) instead of a name, find the matching section name
  const resolvedValue = useMemo(() => {
    if (!value) return '';
    // If value matches a section name, use it as-is
    if (sections.find(s => s.name === value)) return value;
    // If value looks like a UUID, try to find section by ID
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
      const match = sections.find(s => s.id === value);
      if (match) return match.name;
    }
    // Sections still loading or no match — return empty to avoid MUI crash
    if (isLoading || sections.length === 0) return '';
    return value;
  }, [value, sections, isLoading]);

  // Filter sections based on search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const query = searchQuery.toLowerCase();
    return sections.filter(section =>
      section.name.toLowerCase().includes(query)
    );
  }, [sections, searchQuery]);

  // Check if the search query matches an existing section
  const exactMatch = useMemo(() => {
    return sections.find(s => s.name.toLowerCase() === searchQuery.toLowerCase().trim());
  }, [sections, searchQuery]);

  const handleCreateSection = async () => {
    const nameToCreate = newSectionName.trim() || searchQuery.trim();
    if (!nameToCreate) return;

    setIsCreating(true);
    try {
      const newSection = await createSection(nameToCreate);
      if (newSection) {
        onChange(newSection.name, newSection.id);
        setSearchQuery('');
        setNewSectionName('');
        setShowCreateInput(false);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectChange = (event: any) => {
    const selectedValue = event.target.value;
    if (selectedValue === '__create_new__') {
      setShowCreateInput(true);
      setNewSectionName(searchQuery);
    } else if (selectedValue === '') {
      onChange('', undefined);
      setSearchQuery('');
    } else {
      // Find the section to get its ID
      const selectedSection = sections.find(s => s.name === selectedValue);
      onChange(selectedValue, selectedSection?.id);
      setSearchQuery('');
    }
  };

  const handleClear = () => {
    onChange('', undefined);
    setSearchQuery('');
  };

  // Edit handlers
  const handleEditClick = (e: React.MouseEvent, section: { id: string; name: string }) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingSection(section);
    setEditName(section.name);
  };

  const handleEditSave = async () => {
    if (!editingSection || !editName.trim()) return;

    setIsUpdating(true);
    try {
      const success = await complianceSectionService.updateSection(editingSection.id, { name: editName.trim() });
      if (success) {
        // If the edited section was selected, update the value
        if (value === editingSection.name) {
          onChange(editName.trim(), editingSection.id);
        }
        refetch();
        setEditingSection(null);
        setEditName('');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditCancel = () => {
    setEditingSection(null);
    setEditName('');
  };

  // Delete handlers
  const handleDeleteClick = (e: React.MouseEvent, section: { id: string; name: string }) => {
    e.stopPropagation();
    e.preventDefault();
    setDeletingSection(section);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingSection) return;

    setIsDeleting(true);
    try {
      const success = await deleteSection(deletingSection.id);
      if (success) {
        // If the deleted section was selected, clear the value
        if (value === deletingSection.name) {
          onChange('', undefined);
        }
        setDeletingSection(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeletingSection(null);
  };

  return (
    <>
      <FormControl fullWidth disabled={disabled} sx={compact ? { '& .MuiInputLabel-root': { display: 'none' } } : undefined}>
        {!compact && <InputLabel id="section-select-label" shrink={true}>{label}</InputLabel>}
        <Select
          labelId="section-select-label"
          value={resolvedValue}
          label={compact ? undefined : label}
          onChange={handleSelectChange}
          displayEmpty
          notched={!compact}
          sx={compact ? {
            height: 32,
            fontSize: '0.75rem',
            bgcolor: 'white',
            borderRadius: '6px',
            '& .MuiSelect-select': { py: '4px', px: '8px' },
            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'hsl(214.3, 31.8%, 91.4%)' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'hsl(214.3, 31.8%, 91.4%)' },
          } : undefined}
          renderValue={(selected) => {
            if (!selected || selected === '') {
              return <span style={{ color: 'rgba(0, 0, 0, 0.6)' }}>{placeholder}</span>;
            }
            return selected;
          }}
          endAdornment={
            value && !disabled ? (
              <InputAdornment position="end" sx={{ mr: 2 }}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null
          }
          MenuProps={{
            disablePortal: false,
            PaperProps: {
              style: {
                maxHeight: 350,
                zIndex: 1400,
              },
            },
            autoFocus: false,
          }}
        >
          {/* Search Input */}
          <ListSubheader sx={{ bgcolor: 'background.paper', pt: 1 }}>
            <TextField
              size="small"
              autoFocus
              placeholder="Search sections..."
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                // Prevent dropdown from closing on keydown
                e.stopPropagation();
                if (e.key === 'Enter' && searchQuery.trim() && !exactMatch) {
                  handleCreateSection();
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 1 }}
            />
          </ListSubheader>

          {/* Loading State */}
          {isLoading && (
            <MenuItem disabled>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                <span>Loading sections...</span>
              </Box>
            </MenuItem>
          )}

          {/* Empty option */}
          <MenuItem value="">
            <em>No Section</em>
          </MenuItem>

          <Divider />

          {/* Existing Sections */}
          {filteredSections.length === 0 && !isLoading && searchQuery.trim() && (
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">
                No sections found matching "{searchQuery}"
              </Typography>
            </MenuItem>
          )}

          {filteredSections.map((section) => (
            <MenuItem
              key={section.id}
              value={section.name}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                '&:hover .section-actions': {
                  opacity: 1,
                },
              }}
            >
              <span>{section.name}</span>
              <Box
                className="section-actions"
                sx={{
                  display: 'flex',
                  gap: 0.5,
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  ml: 1
                }}
              >
                <IconButton
                  size="small"
                  onClick={(e) => handleEditClick(e, section)}
                  sx={{
                    p: 0.5,
                    '&:hover': { color: 'primary.main' }
                  }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={(e) => handleDeleteClick(e, section)}
                  sx={{
                    p: 0.5,
                    '&:hover': { color: 'error.main' }
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </MenuItem>
          ))}

          <Divider sx={{ my: 1 }} />

          {/* Create New Option */}
          <MenuItem
            value="__create_new__"
            sx={{
              color: 'primary.main',
              fontWeight: 500,
              '&:hover': {
                backgroundColor: 'primary.lighter'
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AddIcon fontSize="small" />
              {searchQuery.trim() && !exactMatch
                ? `Create "${searchQuery.trim()}"`
                : 'Create new section...'
              }
            </Box>
          </MenuItem>
        </Select>

        {/* Create Section Dialog/Inline */}
        {showCreateInput && (
          <Box sx={{ mt: 1, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: 'grey.50' }}>
            <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
              Create New Section
            </Typography>
            <TextField
              size="small"
              fullWidth
              autoFocus
              placeholder="Enter section name"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateSection();
                } else if (e.key === 'Escape') {
                  setShowCreateInput(false);
                  setNewSectionName('');
                }
              }}
              disabled={isCreating}
              sx={{ mb: 1 }}
            />
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                size="small"
                onClick={() => {
                  setShowCreateInput(false);
                  setNewSectionName('');
                }}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={handleCreateSection}
                disabled={isCreating || !newSectionName.trim()}
                startIcon={isCreating ? <CircularProgress size={14} /> : <AddIcon />}
              >
                {isCreating ? 'Creating...' : 'Create'}
              </Button>
            </Box>
          </Box>
        )}
      </FormControl>

      {/* Edit Section Dialog */}
      <Dialog open={!!editingSection} onClose={handleEditCancel} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Section</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Section Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleEditSave();
              } else if (e.key === 'Escape') {
                handleEditCancel();
              }
            }}
            disabled={isUpdating}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditCancel} disabled={isUpdating}>
            Cancel
          </Button>
          <Button
            onClick={handleEditSave}
            variant="contained"
            disabled={isUpdating || !editName.trim() || editName.trim() === editingSection?.name}
          >
            {isUpdating ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingSection} onClose={handleDeleteCancel} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Section</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the section "{deletingSection?.name}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
