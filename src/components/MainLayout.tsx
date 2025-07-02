import React from 'react';
import { Box, Toolbar, Paper, Breadcrumbs, Typography, Link as MuiLink, Tabs, Tab } from '@mui/material';
import Sidebar from './Sidebar';
import AppHeader from './AppHeader';
import Footer from './Footer';

const drawerWidth = 220;

const MainLayout: React.FC<{
  children: React.ReactNode,
  pageTitle?: string,
  toolbarContent?: React.ReactNode,
  tabs?: React.ReactNode
}> = ({ children, pageTitle, toolbarContent, tabs }) => {
  return (
    <Box sx={{ minHeight: '100vh', background: '#fff' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, ml: `${drawerWidth}px`, minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
        <AppHeader pageTitle={pageTitle} />
        <Toolbar sx={{ m: 0, ml: '30px' }}>
          <Breadcrumbs aria-label="breadcrumb">
            <MuiLink underline="hover" color="inherit" href="/list">
              Home
            </MuiLink>
            {pageTitle && <Typography color="text.primary">{pageTitle}</Typography>}
          </Breadcrumbs>
        </Toolbar>
        {tabs}
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