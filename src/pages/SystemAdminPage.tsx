import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface AppSetting {
  id: number;
  key: string;
  value: string;
  is_encrypted: boolean;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  updated_by: number | null;
}

const SystemAdminPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<AppSetting>>({});
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newSetting, setNewSetting] = useState<Omit<AppSetting, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>>({
    key: '',
    value: '',
    is_encrypted: false
  });
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Security check - only user ID 1 can access this page
  useEffect(() => {
    const hasAccess = user && (
      user.id === 1 || 
      (user as any).id === 1 ||
      JSON.stringify(user).includes('"id":1') ||
      JSON.stringify(user).includes('"id":"1"')
    );

    if (!hasAccess) {
      navigate('/dashboard');
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await api.getSystemSettings();
      setSettings(data as AppSetting[]);
      setError(null);
    } catch (err) {
      setError('Failed to fetch system settings');
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEdit = (setting: AppSetting) => {
    setEditingId(setting.id);
    setEditForm({ ...setting });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = () => {
    setConfirmDialog({
      open: true,
      title: 'Confirm Changes',
      message: `Are you sure you want to update the setting "${editForm.key}"?`,
      onConfirm: async () => {
        try {
          await api.updateSystemSetting(editingId!, editForm);
          await fetchSettings();
          setEditingId(null);
          setEditForm({});
          setError(null);
        } catch (err) {
          setError('Failed to update setting');
          console.error('Error updating setting:', err);
        }
        setConfirmDialog({ ...confirmDialog, open: false });
      }
    });
  };

  const handleAddNew = () => {
    setConfirmDialog({
      open: true,
      title: 'Confirm New Setting',
      message: `Are you sure you want to add the new setting "${newSetting.key}"?`,
      onConfirm: async () => {
        try {
          await api.createSystemSetting(newSetting);
          await fetchSettings();
          setShowAddDialog(false);
          setNewSetting({
            key: '',
            value: '',
            is_encrypted: false
          });
          setError(null);
        } catch (err) {
          setError('Failed to create setting');
          console.error('Error creating setting:', err);
        }
        setConfirmDialog({ ...confirmDialog, open: false });
      }
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Security check - don't render anything if user doesn't have access
  const hasAccess = user && (
    user.id === 1 || 
    (user as any).id === 1 ||
    JSON.stringify(user).includes('"id":1') ||
    JSON.stringify(user).includes('"id":"1"')
  );

  if (!hasAccess) {
    return null;
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          System Administration
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="System Settings" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Application Settings</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowAddDialog(true)}
            >
              Add Setting
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Setting Name</TableCell>
                    <TableCell>Setting Value</TableCell>
                    <TableCell>Encryption</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Updated</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {settings.map((setting) => (
                    <TableRow key={setting.id}>
                      <TableCell>{setting.id}</TableCell>
                      <TableCell>
                        {editingId === setting.id ? (
                          <TextField
                            value={editForm.key || ''}
                            onChange={(e) => setEditForm({ ...editForm, key: e.target.value })}
                            size="small"
                            fullWidth
                          />
                        ) : (
                          setting.key
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === setting.id ? (
                          <TextField
                            value={editForm.value || ''}
                            onChange={(e) => setEditForm({ ...editForm, value: e.target.value })}
                            size="small"
                            fullWidth
                          />
                        ) : (
                          setting.value
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === setting.id ? (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => setEditForm({ ...editForm, is_encrypted: !editForm.is_encrypted })}
                            color={editForm.is_encrypted ? 'success' : 'error'}
                          >
                            {editForm.is_encrypted ? 'Encrypted' : 'Not Encrypted'}
                          </Button>
                        ) : (
                          <Chip
                            label={setting.is_encrypted ? 'Encrypted' : 'Not Encrypted'}
                            color={setting.is_encrypted ? 'success' : 'error'}
                            size="small"
                          />
                        )}
                      </TableCell>
                      <TableCell>{formatDate(setting.created_at)}</TableCell>
                      <TableCell>{formatDate(setting.updated_at)}</TableCell>
                      <TableCell>
                        {editingId === setting.id ? (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={handleSaveEdit}
                            >
                              <SaveIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="secondary"
                              onClick={handleCancelEdit}
                            >
                              <CancelIcon />
                            </IconButton>
                          </Box>
                        ) : (
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEdit(setting)}
                          >
                            <EditIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        {/* Add New Setting Dialog */}
        <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Add New Setting</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                label="Setting Name"
                value={newSetting.key}
                onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Setting Value"
                value={newSetting.value}
                onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
                fullWidth
                required
              />
              <Button
                variant="outlined"
                onClick={() => setNewSetting({ ...newSetting, is_encrypted: !newSetting.is_encrypted })}
                color={newSetting.is_encrypted ? 'success' : 'error'}
                sx={{ alignSelf: 'flex-start' }}
              >
                {newSetting.is_encrypted ? 'Encrypted' : 'Not Encrypted'}
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleAddNew} 
              variant="contained"
              disabled={!newSetting.key || !newSetting.value}
            >
              Add Setting
            </Button>
          </DialogActions>
        </Dialog>

        {/* Confirmation Dialog */}
        <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}>
          <DialogTitle>{confirmDialog.title}</DialogTitle>
          <DialogContent>
            <Typography>{confirmDialog.message}</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>Cancel</Button>
            <Button onClick={confirmDialog.onConfirm} variant="contained" color="primary">
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default SystemAdminPage;