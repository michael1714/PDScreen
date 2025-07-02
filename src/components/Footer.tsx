import React from 'react';
import { Box, Typography, Link as MuiLink } from '@mui/material';

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        width: '100%',
        py: 2,
        px: 2,
        mt: 'auto',
        background: '#f8fafc',
        borderTop: '1px solid #e0e0e0',
        textAlign: 'center',
        fontSize: 14,
        color: 'text.secondary',
      }}
    >
      <Typography variant="body2" color="text.secondary">
        &copy; {new Date().getFullYear()} PDScreen. All rights reserved. &nbsp;|
        <MuiLink href="/" underline="hover" color="inherit" sx={{ mx: 1 }}>
          Home
        </MuiLink>
        |
        <MuiLink href="/about" underline="hover" color="inherit" sx={{ mx: 1 }}>
          About
        </MuiLink>
        |
        <MuiLink href="/privacy" underline="hover" color="inherit" sx={{ mx: 1 }}>
          Privacy
        </MuiLink>
      </Typography>
    </Box>
  );
};

export default Footer; 