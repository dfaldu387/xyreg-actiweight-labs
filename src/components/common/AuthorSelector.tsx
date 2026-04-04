import React, { useState, useMemo } from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  Chip,
  CircularProgress
} from '@mui/material';
import { Person, Edit, Add } from '@mui/icons-material';
import { useDocumentAuthors, AuthorOption } from '@/hooks/useDocumentAuthors';

interface AuthorSelectorProps {
  value: string;
  onChange: (value: string) => void;
  companyId: string;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
}

export function AuthorSelector({
  value,
  onChange,
  companyId,
  disabled = false,
  label = 'Author',
  placeholder = 'Select or type author name'
}: AuthorSelectorProps) {
  const { authors, isLoading, createCustomAuthor } = useDocumentAuthors(companyId);
  const [inputValue, setInputValue] = useState('');

  // Find the current option based on value (should be ID)
  const currentOption = useMemo(() => {
    if (!value) return null;
    // First try to find by id (primary lookup since we store ID)
    const byId = authors.find(a => a.id === value);
    if (byId) return byId;
    // Fallback: try to find by name (for backwards compatibility)
    const byName = authors.find(a => a.name === value);
    if (byName) return byName;
    // Fallback: try to find by email (for backwards compatibility)
    const byEmail = authors.find(a => a.email === value);
    if (byEmail) return byEmail;
    // If not found in options, it's a custom typed value - show as is
    return { id: 'custom', name: value, type: 'custom' as const };
  }, [value, authors]);

  const handleChange = async (
    _event: React.SyntheticEvent,
    newValue: AuthorOption | string | null
  ) => {
    if (newValue === null) {
      onChange('');
      return;
    }

    if (typeof newValue === 'string') {
      // User typed a custom value and pressed enter
      // Create custom author and get the ID
      const newAuthorId = await createCustomAuthor(newValue);
      onChange(newAuthorId || newValue);
    } else {
      // User selected an existing option - store the ID
      onChange(newValue.id);
    }
  };

  const handleInputChange = (_event: React.SyntheticEvent, newInputValue: string) => {
    setInputValue(newInputValue);
  };

  const handleBlur = async () => {
    // If user typed something but didn't select, use the input value
    if (inputValue && inputValue !== currentOption?.name) {
      // Check if it matches an existing author
      const existingAuthor = authors.find(a => a.name.toLowerCase() === inputValue.toLowerCase());
      if (existingAuthor) {
        onChange(existingAuthor.id);
      } else {
        // Create custom author and get the ID
        const newAuthorId = await createCustomAuthor(inputValue);
        onChange(newAuthorId || inputValue);
      }
    }
  };

  const filterOptions = (options: AuthorOption[], state: { inputValue: string }) => {
    const filtered = options.filter(option =>
      option.name.toLowerCase().includes(state.inputValue.toLowerCase()) ||
      (option.email && option.email.toLowerCase().includes(state.inputValue.toLowerCase()))
    );

    // Add "Add new" option if input doesn't match any existing option
    const inputLower = state.inputValue.toLowerCase().trim();
    if (inputLower && !options.some(o => o.name.toLowerCase() === inputLower)) {
      filtered.push({
        id: 'new',
        name: state.inputValue,
        type: 'custom' as const
      });
    }

    return filtered;
  };

  return (
    <Autocomplete
      freeSolo
      value={currentOption}
      onChange={handleChange}
      inputValue={inputValue || (currentOption?.name || '')}
      onInputChange={handleInputChange}
      {...{ onBlur: handleBlur } as any}
      options={authors}
      loading={isLoading}
      disabled={disabled}
      filterOptions={filterOptions}
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
      renderOption={(props, option) => {
        const { key, ...otherProps } = props;
        
        // Handle string options (shouldn't happen but TypeScript requires it)
        if (typeof option === 'string') {
          return (
            <Box component="li" key={key} {...otherProps}>
              <Typography variant="body2">{option}</Typography>
            </Box>
          );
        }
        
        // Check if this is the "Add new" option
        if (option.id === 'new') {
          return (
            <Box
              component="li"
              key={key}
              {...otherProps}
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <Add fontSize="small" color="primary" />
              <Typography variant="body2" color="primary">
                Add "{option.name}"
              </Typography>
            </Box>
          );
        }

        return (
          <Box
            component="li"
            key={key}
            {...otherProps}
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            {option.type === 'user' ? (
              <Person fontSize="small" color="action" />
            ) : (
              <Edit fontSize="small" color="action" />
            )}
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2">{option.name}</Typography>
              {option.email && (
                <Typography variant="caption" color="text.secondary">
                  {option.email}
                </Typography>
              )}
            </Box>
            <Chip
              label={option.type === 'user' ? 'User' : 'Custom'}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.65rem', height: 20 }}
            />
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
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
    />
  );
}
