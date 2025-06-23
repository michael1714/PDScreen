import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import WelcomePage from './pages/WelcomePage';
import PasswordResetPage from './pages/PasswordResetPage';
import PositionDescriptionList from './components/PositionDescriptionList';
import PositionDescriptionUpload from './components/PositionDescriptionUpload';
import AdminPage from './components/AdminPage';
import ProtectedRoute from './components/ProtectedRoute';
import SessionWarning from './components/SessionWarning';
import Navigation from './components/Navigation';
import MainLayout from './components/MainLayout';
import './App.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const shouldShowNav = false;
  const isLandingTypePage = ['/', '/login', '/register', '/welcome'].includes(location.pathname);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      <div className={`main-content${isLandingTypePage ? ' landing' : ''}`}>
        <SessionWarning />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/reset" element={<PasswordResetPage />} />
          <Route 
            path="/list" 
            element={
              <ProtectedRoute>
                <MainLayout pageTitle="Position Descriptions">
                  <PositionDescriptionList />
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/upload" 
            element={
              <ProtectedRoute>
                <MainLayout pageTitle="Upload Position Description">
                  <PositionDescriptionUpload />
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <MainLayout pageTitle="Admin Dashboard">
                  <AdminPage />
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App; 