import React from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton, InputBase, Avatar, Menu, MenuItem, Tooltip, Badge } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useAuth } from '../contexts/AuthContext';

const AppHeader: React.FC<{ pageTitle?: string }> = ({ pageTitle }) => {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [darkMode, setDarkMode] = React.useState(false);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  const handleLogout = () => {
    handleMenuClose();
    logout();
  };
  const handleThemeSwitch = () => {
    setDarkMode((prev) => !prev);
    // You can integrate this with your theme provider
  };

  return (
    <AppBar position="fixed" color="inherit" elevation={1} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, background: '#fff' }}>
      <Toolbar sx={{ minHeight: 64, display: 'flex', justifyContent: 'space-between' }}>
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 180 }}>
          <img src="/logo.png" alt="Logo" style={{ width: 100, height: 'auto', marginRight: 16, cursor: 'pointer', objectFit: 'contain' }} onClick={() => window.location.href = '/'} />
        </Box>
        {/* Page Title / Breadcrumbs */}
        <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'center', fontWeight: 500 }}>
          {pageTitle || 'Dashboard'}
        </Typography>
        {/* Search, Notifications, Theme Switch, User Avatar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Search */}
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', background: '#f1f3f4', borderRadius: 1, px: 1, mr: 1 }}>
            <SearchIcon sx={{ color: 'grey.600', mr: 1 }} />
            <InputBase placeholder="Search…" inputProps={{ 'aria-label': 'search' }} sx={{ width: 120 }} />
          </Box>
          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton color="inherit">
              <Badge badgeContent={0} color="primary">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          {/* Theme Switch */}
          <Tooltip title="Toggle light/dark mode">
            <IconButton color="inherit" onClick={handleThemeSwitch}>
              {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>
          {/* User Avatar/Profile */}
          <Tooltip title="Account settings">
            <IconButton onClick={handleProfileMenuOpen} sx={{ p: 0 }}>
              <Avatar>{user?.firstName?.[0] || '?'}</Avatar>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem disabled>{user?.firstName} {user?.lastName}</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader; 