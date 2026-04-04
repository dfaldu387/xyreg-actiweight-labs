import React, { useState, useMemo } from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import { Person, Edit, Add, PersonAdd, HourglassEmpty } from '@mui/icons-material';
import { useDocumentAuthors, AuthorOption } from '@/hooks/useDocumentAuthors';
import { AddAuthorSheet, PendingAuthorData } from './AddAuthorSheet';
import { useAuth } from '@/context/AuthContext';

interface MultiAuthorSelectorProps {
  value: string[]; // Array of author IDs
  onChange: (value: string[]) => void;
  companyId: string;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  // When true, don't create authors in DB immediately - defer until parent form saves
  deferCreation?: boolean;
  // Callback to notify parent of pending authors (only used when deferCreation is true)
  onPendingAuthorsChange?: (pendingAuthors: PendingAuthorData[]) => void;
}

export function MultiAuthorSelector({
  value,
  onChange,
  companyId,
  disabled = false,
  label = 'Authors',
  placeholder = 'Select or add authors',
  deferCreation = true,
  onPendingAuthorsChange
}: MultiAuthorSelectorProps) {
  const { authors, isLoading, refreshAuthors, getAuthorById } = useDocumentAuthors(companyId);
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [isAddAuthorSheetOpen, setIsAddAuthorSheetOpen] = useState(false);
  // Store newly added authors that haven't accepted invitation yet (for immediate creation mode)
  const [pendingInvitationAuthors, setPendingInvitationAuthors] = useState<Record<string, string>>({});
  // Store pending authors data for deferred creation mode
  const [pendingAuthorsData, setPendingAuthorsData] = useState<PendingAuthorData[]>([]);
  // Current logged-in user ID from AuthContext
  const currentUserId = user?.id || null;

  // Find the current options based on value (array of IDs)
  const currentOptions = useMemo(() => {
    if (!value || value.length === 0) return [];

    return value.map(id => {
      // First check if it's a pending author (we have data for these regardless of loading state)
      const pendingData = pendingAuthorsData.find(p => p.tempId === id);
      if (pendingData) {
        return { id, name: pendingData.fullName, type: 'pending' as const };
      }

      // Check if it's a pending invitation author (immediate creation mode)
      if (pendingInvitationAuthors[id]) {
        return { id, name: pendingInvitationAuthors[id], type: 'user' as const };
      }

      // If still loading from DB, show placeholder for non-pending items
      if (isLoading) {
        return {
          id,
          name: 'Loading...',
          type: 'user' as const,
          isLoading: true
        };
      }

      // Try to find by id in authors list (users)
      const byId = authors.find(a => a.id === id);
      if (byId) return byId;

      // Check in allAuthorsMap (includes document_authors)
      const fromMap = getAuthorById(id);
      if (fromMap) return fromMap;

      // Fallback: if not found in options, show as unknown
      return { id, name: 'Unknown Author', type: 'custom' as const };
    }).filter(Boolean);
  }, [value, authors, pendingInvitationAuthors, pendingAuthorsData, getAuthorById, isLoading]);

  const handleChange = (
    _event: React.SyntheticEvent,
    newValue: (AuthorOption | string)[]
  ) => {
    // Extract IDs from selected options
    const selectedIds = newValue.map(item => {
      if (typeof item === 'string') {
        // User typed a custom value - find or it's a new entry
        const existingAuthor = authors.find(a => a.name.toLowerCase() === item.toLowerCase());
        return existingAuthor?.id || item;
      }
      return item.id;
    }).filter(id => id !== 'new'); // Filter out the "add new" placeholder

    onChange(selectedIds);
  };

  const handleInputChange = (_event: React.SyntheticEvent, newInputValue: string) => {
    setInputValue(newInputValue);
  };

  const handleAuthorAdded = (authorId: string, authorName: string) => {
    // For immediate creation mode, store the author name for display
    if (!deferCreation) {
      setPendingInvitationAuthors(prev => ({ ...prev, [authorId]: authorName }));
      // Refresh authors list
      refreshAuthors();
    }
    // Add the new author to selection
    if (!value.includes(authorId)) {
      onChange([...value, authorId]);
    }
  };

  const handlePendingAuthorAdded = (pendingAuthor: PendingAuthorData) => {
    // Store the pending author data for later creation
    const newPendingAuthors = [...pendingAuthorsData, pendingAuthor];
    setPendingAuthorsData(newPendingAuthors);
    // Notify parent of pending authors
    if (onPendingAuthorsChange) {
      onPendingAuthorsChange(newPendingAuthors);
    }
  };

  const filterOptions = (options: AuthorOption[], state: { inputValue: string }) => {
    const filtered = options.filter(option =>
      option.name.toLowerCase().includes(state.inputValue.toLowerCase()) ||
      (option.email && option.email.toLowerCase().includes(state.inputValue.toLowerCase()))
    );
    return filtered;
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
      <Autocomplete
        multiple
        freeSolo
        value={currentOptions}
        onChange={handleChange}
        inputValue={inputValue}
        onInputChange={handleInputChange}
        options={authors}
        loading={isLoading}
        disabled={disabled}
        filterOptions={filterOptions}
        groupBy={(option) => {
          if (typeof option === 'string') return 'Other';
          if (option.type === 'pending') return 'Pending Invitations';
          if (option.type === 'custom') return 'Custom Authors';
          return 'Active Users';
        }}
        getOptionLabel={(option) => {
          if (typeof option === 'string') return option;
          return option.name;
        }}
        isOptionEqualToValue={(option, value) => {
          if (typeof option === 'string' && typeof value === 'string') return option === value;
          if (typeof option === 'string') return typeof value !== 'string' && (option === value.name || option === value.id);
          if (typeof value === 'string') return option.id === value || option.name === value;
          return option.id === value.id;
        }}
        renderGroup={(params) => (
          <Box key={params.key}>
            <Box
              sx={{
                position: 'sticky',
                top: -8,
                px: 2,
                py: 1,
                backgroundColor: 'grey.100',
                borderBottom: '1px solid',
                borderColor: 'divider',
                fontWeight: 600,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                color: params.group === 'Pending Invitations' ? 'warning.main' : params.group === 'Custom Authors' ? 'info.main' : 'text.secondary',
              }}
            >
              {params.group}
            </Box>
            {params.children}
          </Box>
        )}
        renderOption={(props, option) => {
          const { key, ...otherProps } = props;

          if (typeof option === 'string') {
            return (
              <Box component="li" key={key} {...otherProps}>
                <Typography variant="body2">{option}</Typography>
              </Box>
            );
          }

          const isPending = option.type === 'pending';
          const isCustom = option.type === 'custom';
          const isCurrentUser = option.type === 'user' && option.id === currentUserId;

          return (
            <Box
              component="li"
              key={key}
              {...otherProps}
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              {isPending ? (
                <HourglassEmpty fontSize="small" sx={{ color: 'warning.main' }} />
              ) : isCustom ? (
                <Edit fontSize="small" sx={{ color: 'info.main' }} />
              ) : (
                <Person fontSize="small" color={isCurrentUser ? 'primary' : 'action'} />
              )}
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2">{option.name}</Typography>
                {option.email && (
                  <Typography variant="caption" color="text.secondary">
                    {option.email}
                  </Typography>
                )}
                {!option.email && isCustom && (
                  <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                    No email
                  </Typography>
                )}
              </Box>
              {isCurrentUser && (
                <Chip
                  label="You"
                  size="small"
                  color="primary"
                  sx={{ fontSize: '0.65rem', height: 20, mr: 0.5 }}
                />
              )}
              {!isCurrentUser && (
              <Chip
                  label={isPending ? 'Pending' : isCustom ? 'Custom' : 'User'}
                  size="small"
                  variant="outlined"
                  color={isPending ? 'warning' : isCustom ? 'info' : 'default'}
                  sx={{ fontSize: '0.65rem', height: 20 }}
                />
              )}
            </Box>
          );
        }}
        renderTags={(tagValue, getTagProps) =>
          tagValue.map((option, index) => {
            const { key, ...tagProps } = getTagProps({ index });
            const label = typeof option === 'string' ? option : option.name;
            const optionIsLoading = typeof option !== 'string' && (option as any).isLoading;
            return (
              <Chip
                key={key}
                label={optionIsLoading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CircularProgress size={12} color="inherit" />
                    <span>Loading...</span>
                  </Box>
                ) : label}
                size="small"
                {...tagProps}
                sx={{
                  backgroundColor: optionIsLoading ? 'grey.300' : 'primary.light',
                  color: optionIsLoading ? 'text.secondary' : 'primary.contrastText',
                }}
              />
            );
          })
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder={value.length === 0 ? placeholder : ''}
            variant="outlined"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {isLoading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        sx={{ flex: 1 }}
      />

      {/* Add Author Button */}
      <Tooltip title="Add new author">
        <IconButton
          onClick={() => setIsAddAuthorSheetOpen(true)}
          disabled={disabled}
          sx={{
            mt: 1,
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
            '&:disabled': {
              bgcolor: 'action.disabledBackground',
            }
          }}
        >
          <PersonAdd />
        </IconButton>
      </Tooltip>

      {/* Add Author Sheet */}
      <AddAuthorSheet
        open={isAddAuthorSheetOpen}
        onOpenChange={setIsAddAuthorSheetOpen}
        companyId={companyId}
        onAuthorAdded={handleAuthorAdded}
        deferCreation={deferCreation}
        onPendingAuthorAdded={handlePendingAuthorAdded}
      />
    </Box>
  );
}
