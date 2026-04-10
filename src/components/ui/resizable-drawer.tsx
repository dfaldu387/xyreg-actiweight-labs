import React, { useState, useRef, useCallback } from 'react';
import { Drawer, Box } from '@mui/material';
import type { DrawerProps } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

interface ResizableDrawerProps {
  open: boolean;
  onClose: () => void;
  anchor?: 'right' | 'left';
  defaultWidthPercent?: number;
  minWidth?: number;
  maxWidthPercent?: number;
  children: React.ReactNode;
}

export function ResizableDrawer({
  open,
  onClose,
  anchor = 'right',
  defaultWidthPercent = 40,
  minWidth = 400,
  maxWidthPercent = 98,
  children,
}: ResizableDrawerProps) {
  const [drawerWidth, setDrawerWidth] = useState(() => window.innerWidth * (defaultWidthPercent / 100));

  // Reset width to default every time drawer opens
  React.useEffect(() => {
    if (open) {
      setDrawerWidth(window.innerWidth * (defaultWidthPercent / 100));
    }
  }, [open, defaultWidthPercent]);
  const isResizing = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = anchor === 'right'
        ? window.innerWidth - e.clientX
        : e.clientX;
      const maxWidth = window.innerWidth * (maxWidthPercent / 100);
      setDrawerWidth(Math.min(maxWidth, Math.max(minWidth, newWidth)));
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [anchor, minWidth, maxWidthPercent]);

  const handleSide = anchor === 'right' ? { left: -6 } : { right: -6 };

  return (
    <Drawer
      anchor={anchor}
      open={open}
      onClose={onClose}
      sx={{ zIndex: 45 }}
      ModalProps={{
        disableAutoFocus: true,
        disableEnforceFocus: true,
      }}
      PaperProps={{
        sx: { width: { xs: '100%', md: `${drawerWidth}px` }, maxWidth: '100vw', overflow: 'visible' },
      }}
    >
      {/* Resize handle */}
      <Box
        onMouseDown={handleMouseDown}
        sx={{
          display: { xs: 'none', md: 'flex' },
          position: 'absolute',
          ...handleSide,
          top: 0,
          bottom: 0,
          width: 12,
          cursor: 'col-resize',
          zIndex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          className="resize-line"
          sx={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: '2px',
            transform: 'translateX(-50%)',
            bgcolor: 'grey.300',
          }}
        />
        <Box
          className="resize-grip"
          sx={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 20,
            height: 32,
            borderRadius: '4px',
            bgcolor: 'grey.200',
            border: '1px solid',
            borderColor: 'grey.300',
          }}
        >
          <DragIndicatorIcon sx={{ fontSize: 16, color: 'grey.600' }} />
        </Box>
      </Box>

      {children}
    </Drawer>
  );
}
