import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Box, Divider, Collapse, IconButton
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import HomeIcon from '@mui/icons-material/Home';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import BuildIcon from '@mui/icons-material/Build';
import { useAuth } from '../contexts/AuthContext';
import { NavLink } from 'react-router-dom';
import { Typography } from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';

const drawerWidth = 220;

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [descOpen, setDescOpen] = React.useState(() => ['/upload', '/branding-wizard'].includes(location.pathname));

  // Show System Admin if user exists and has ID 1
  const showSystemAdmin = user && (
    user.id === 1 || 
    (user as any).id === 1 ||
    JSON.stringify(user).includes('"id":1') ||
    JSON.stringify(user).includes('"id":"1"')
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', background: '#f8fafc', borderRight: '1px solid #e0e0e0' },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <List>
          <ListItem button component={NavLink} to="/dashboard">
            <ListItemIcon>
              <BarChartIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton selected={location.pathname === '/list'} onClick={() => navigate('/list')} sx={{ pr: 0 }}>
              <ListItemIcon><DescriptionIcon /></ListItemIcon>
              <ListItemText primary="Position Descriptions" />
            </ListItemButton>
            <IconButton onClick={() => setDescOpen((prev) => !prev)} sx={{ ml: 0.5 }}>
              {descOpen ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </ListItem>
          <Collapse in={descOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItem disablePadding sx={{ pl: 4 }}>
                <ListItemButton 
                  selected={location.pathname === '/upload'} 
                  onClick={() => navigate('/upload')} 
                  sx={{ py: 0.5 }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}><AddIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Upload" primaryTypographyProps={{ fontSize: 14 }} />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding sx={{ pl: 4 }}>
                <ListItemButton 
                  selected={location.pathname === '/branding-wizard'} 
                  onClick={() => navigate('/branding-wizard')} 
                  sx={{ py: 0.5 }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}><AutoAwesomeIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Branding Wizard" primaryTypographyProps={{ fontSize: 14 }} />
                </ListItemButton>
              </ListItem>
            </List>
          </Collapse>
          <ListItem button component={NavLink} to="/company-details">
            <ListItemIcon>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary="Company Details" />
          </ListItem>
        </List>
        <Box sx={{ flexGrow: 1 }} />
        <Divider />
        <List>
          {showSystemAdmin && (
            <ListItem button component={NavLink} to="/system-admin">
              <ListItemIcon><BuildIcon /></ListItemIcon>
              <ListItemText primary="System Admin" />
            </ListItem>
          )}
          <ListItem button component={NavLink} to="/admin">
            <ListItemIcon><AdminPanelSettingsIcon /></ListItemIcon>
            <ListItemText primary="Admin" />
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={logout}>
              <ListItemIcon><LogoutIcon /></ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar; 