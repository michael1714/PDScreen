import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Container, useTheme, useMediaQuery, IconButton, Drawer, List, ListItem, ListItemText, ListItemButton, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import React, { useState } from 'react';
import './App.css';
import PositionDescriptionUpload from './components/PositionDescriptionUpload';
import PositionDescriptionList from './components/PositionDescriptionList';
import LandingPage from './pages/LandingPage';

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Upload', path: '/upload' },
  { label: 'List', path: '/list' },
];

function Navigation() {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleDrawerToggle = () => setDrawerOpen(!drawerOpen);

  return (
    <AppBar position="fixed" elevation={4}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          PD Screen
        </Typography>
        {isMobile ? (
          <>
            <IconButton color="inherit" edge="end" onClick={handleDrawerToggle}>
              <MenuIcon />
            </IconButton>
            <Drawer anchor="right" open={drawerOpen} onClose={handleDrawerToggle}>
              <Box sx={{ width: 200 }} role="presentation" onClick={handleDrawerToggle}>
                <List>
                  {navLinks.map((link) => (
                    <ListItem disablePadding key={link.path}>
                      <ListItemButton
                        component={Link}
                        to={link.path}
                        selected={location.pathname === link.path}
                      >
                        <ListItemText primary={link.label} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Drawer>
          </>
        ) : (
          navLinks.map((link) => (
            <Button
              key={link.path}
              color={location.pathname === link.path ? 'secondary' : 'inherit'}
              component={Link}
              to={link.path}
              sx={{
                borderBottom: location.pathname === link.path ? '2px solid #fff' : 'none',
                borderRadius: 0,
                mx: 1,
              }}
            >
              {link.label}
            </Button>
          ))
        )}
      </Toolbar>
    </AppBar>
  );
}

function AppContent() {
  const location = useLocation();
  return (
    <div className="App">
      {location.pathname !== '/' && <Navigation />}
      <div className={`main-content${location.pathname === '/' ? ' landing' : ''}`}>
        {location.pathname === '/' ? (
          <LandingPage />
        ) : (
          <Container>
            <Routes>
              <Route path="/upload" element={<PositionDescriptionUpload />} />
              <Route path="/list" element={<PositionDescriptionList />} />
            </Routes>
          </Container>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App; 