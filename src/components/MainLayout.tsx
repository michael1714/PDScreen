import React from 'react';
import { Box, Toolbar, Paper, Breadcrumbs, Typography, Link as MuiLink } from '@mui/material';
import Sidebar from './Sidebar';
import AppHeader from './AppHeader';
import Footer from './Footer';

const drawerWidth = 220;

const MainLayout: React.FC<{ children: React.ReactNode, pageTitle?: string, toolbarContent?: React.ReactNode }> = ({ children, pageTitle, toolbarContent }) => {
  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, ml: `${drawerWidth}px`, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppHeader pageTitle={pageTitle} />
        <Toolbar sx={{ m: 0, ml: '30px' }}>
          <Breadcrumbs aria-label="breadcrumb">
            <MuiLink underline="hover" color="inherit" href="/list">
              Home
            </MuiLink>
            {pageTitle && <Typography color="text.primary">{pageTitle}</Typography>}
          </Breadcrumbs>
        </Toolbar>
        <Box sx={{ flexGrow: 1, p: 3 }}>
          <Paper elevation={2} sx={{ p: 4, border: '1px solid #e0e0e0', borderRadius: 3, minHeight: 400, background: '#fff', maxWidth: 1000, mx: 'auto' }}>
            {children}
          </Paper>
        </Box>
        <Footer />
      </Box>
    </Box>
  );
};

export default MainLayout; 