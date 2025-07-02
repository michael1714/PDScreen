import React, { useState, useEffect } from 'react';
import { Box, Grid, Card, CardContent, Typography, Divider, List, ListItem, ListItemText, CircularProgress } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import GroupIcon from '@mui/icons-material/Group';
import InsightsIcon from '@mui/icons-material/Insights';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

interface DashboardData {
  totalPDs: number;
  thisMonthPDs: number;
  departmentsCovered: number;
  mostActiveDepartment: string;
  totalResponsibilities: number;
  automatableResponsibilities: string;
  highAIPotential: string;
  avgAIScore: string;
  activeUsers: number;
  pendingReview: number;
  published: number;
  topRoles: Array<{ role: string; score: string }>;
  recentUploads: Array<{ title: string; date: string }>;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const response = await apiService.get<DashboardData>('/dashboard');
        setDashboardData(response.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !dashboardData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography color="error">{error || 'Failed to load dashboard data'}</Typography>
      </Box>
    );
  }

  // Define which titles should be highlighted in red
  const redTitles = [
    'Departments Covered',
    'AI-Automatable Responsibilities',
    'PDs with High AI Potential',
    'PDs Pending Review',
    'PDs Published'
  ];

  const kpis = [
    {
      label: 'Total PDs Uploaded',
      value: dashboardData.totalPDs,
      icon: <DescriptionIcon color="primary" fontSize="large" />,
    },
    {
      label: 'PDs Uploaded This Month',
      value: dashboardData.thisMonthPDs,
      icon: <TrendingUpIcon color="success" fontSize="large" />,
    },
    {
      label: 'Departments Covered',
      value: dashboardData.departmentsCovered,
      icon: <BusinessIcon color="info" fontSize="large" />,
    },
    {
      label: 'Most Active Department',
      value: dashboardData.mostActiveDepartment,
      icon: <GroupIcon color="secondary" fontSize="large" />,
    },
    {
      label: 'Total Responsibilities',
      value: dashboardData.totalResponsibilities,
      icon: <ListAltIcon color="primary" fontSize="large" />,
    },
    {
      label: 'AI-Automatable Responsibilities',
      value: dashboardData.automatableResponsibilities,
      icon: <AutoAwesomeIcon color="warning" fontSize="large" />,
    },
    {
      label: 'PDs with High AI Potential',
      value: dashboardData.highAIPotential,
      icon: <InsightsIcon color="success" fontSize="large" />,
    },
    {
      label: 'Avg. AI Automation Score',
      value: dashboardData.avgAIScore,
      icon: <InsightsIcon color="primary" fontSize="large" />,
    },
    {
      label: 'Active Users',
      value: dashboardData.activeUsers,
      icon: <PersonIcon color="info" fontSize="large" />,
    },
    {
      label: 'PDs Pending Review',
      value: dashboardData.pendingReview,
      icon: <PendingActionsIcon color="error" fontSize="large" />,
    },
    {
      label: 'PDs Published',
      value: dashboardData.published,
      icon: <CheckCircleIcon color="success" fontSize="large" />,
    },
  ];

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4, p: 2 }}>
      <Grid container spacing={3}>
        {kpis.slice(0, 4).map((kpi) => (
          <Grid item xs={12} sm={6} md={3} key={kpi.label}>
            <Card sx={{ borderRadius: 3, boxShadow: 2, p: 2, minHeight: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', justifyContent: 'center', p: 0 }}>
                {kpi.icon}
                <Box sx={{ textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Box sx={{
                    height: 44,
                    width: '100%',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    mb: 0,
                  }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{
                      wordBreak: 'break-word',
                      fontSize: 15,
                      lineHeight: 1.2,
                      color: redTitles.includes(kpi.label) ? 'error.main' : 'text.secondary',
                      fontWeight: redTitles.includes(kpi.label) ? 600 : 400,
                    }}>
                      {kpi.label}
                    </Typography>
                  </Box>
                  <Typography variant="h5" fontWeight={600} sx={{ wordBreak: 'break-word', fontSize: kpi.label === 'Most Active Department' ? 20 : 24, mt: 0.5 }}>
                    {kpi.value}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {kpis.slice(4, 8).map((kpi) => (
          <Grid item xs={12} sm={6} md={3} key={kpi.label}>
            <Card sx={{ borderRadius: 3, boxShadow: 2, p: 2, minHeight: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', justifyContent: 'center', p: 0 }}>
                {kpi.icon}
                <Box sx={{ textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Box sx={{
                    height: 44,
                    width: '100%',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    mb: 0,
                  }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{
                      wordBreak: 'break-word',
                      fontSize: 15,
                      lineHeight: 1.2,
                      color: redTitles.includes(kpi.label) ? 'error.main' : 'text.secondary',
                      fontWeight: redTitles.includes(kpi.label) ? 600 : 400,
                    }}>
                      {kpi.label}
                    </Typography>
                  </Box>
                  <Typography variant="h5" fontWeight={600} sx={{ wordBreak: 'break-word', fontSize: 24, mt: 0.5 }}>
                    {kpi.value}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {kpis.slice(8).map((kpi) => (
          <Grid item xs={12} sm={6} md={4} key={kpi.label}>
            <Card sx={{ borderRadius: 3, boxShadow: 2, p: 2, minHeight: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', justifyContent: 'center', p: 0 }}>
                {kpi.icon}
                <Box sx={{ textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Box sx={{
                    height: 44,
                    width: '100%',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    mb: 0,
                  }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{
                      wordBreak: 'break-word',
                      fontSize: 15,
                      lineHeight: 1.2,
                      color: redTitles.includes(kpi.label) ? 'error.main' : 'text.secondary',
                      fontWeight: redTitles.includes(kpi.label) ? 600 : 400,
                    }}>
                      {kpi.label}
                    </Typography>
                  </Box>
                  <Typography variant="h5" fontWeight={600} sx={{ wordBreak: 'break-word', fontSize: 24, mt: 0.5 }}>
                    {kpi.value}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {/* Top Roles for AI Automation */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: 2, p: 2, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={1}>
                Top Roles for AI Automation
              </Typography>
              <List>
                {dashboardData.topRoles.map((role) => (
                  <ListItem key={role.role} disableGutters>
                    <ListItemText
                      primary={role.role}
                      secondary={`AI Automation Score: ${role.score}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        {/* Recent Uploads */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: 2, p: 2, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={1}>
                Recent PD Uploads
              </Typography>
              <List>
                {dashboardData.recentUploads.map((upload) => (
                  <ListItem key={upload.title + upload.date} disableGutters>
                    <ListItemText
                      primary={upload.title}
                      secondary={`Uploaded: ${upload.date}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 