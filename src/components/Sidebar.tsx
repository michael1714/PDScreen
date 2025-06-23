import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Box, Divider, Collapse, IconButton
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import AddIcon from '@mui/icons-material/Add';
import HomeIcon from '@mui/icons-material/Home';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 220;

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [descOpen, setDescOpen] = React.useState(true);

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
          <ListItem disablePadding>
            <ListItemButton selected={location.pathname === '/list'} onClick={() => navigate('/list')}>
              <ListItemIcon><HomeIcon /></ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton selected={location.pathname === '/admin'} onClick={() => navigate('/admin')}>
              <ListItemIcon><AdminPanelSettingsIcon /></ListItemIcon>
              <ListItemText primary="Admin" />
            </ListItemButton>
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
                <ListItemButton selected={location.pathname === '/upload'} onClick={() => navigate('/upload')}>
                  <ListItemIcon><AddIcon /></ListItemIcon>
                  <ListItemText primary="Upload" />
                </ListItemButton>
              </ListItem>
            </List>
          </Collapse>
        </List>
        <Box sx={{ flexGrow: 1 }} />
        <Divider />
        <List>
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