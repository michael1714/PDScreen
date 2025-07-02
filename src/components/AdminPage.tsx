import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, IconButton, Tabs, Tab, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, Switch, Tooltip, Alert, CircularProgress } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

// User management interface
interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string | null;
  department: string | null;
  is_active: boolean;
  created_at: string;
}

interface Department {
  id: number;
  name: string;
  is_active: boolean;
}

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const loggedInUserId = user && ((user as any).userId || ((user as any).user && (user as any).user.id));
  const [tab, setTab] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '', 
    password: '',
    jobTitle: '',
    department: ''
  });
  const [addingUser, setAddingUser] = useState(false);
  const [confirmStatusDialog, setConfirmStatusDialog] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
  const [pendingStatus, setPendingStatus] = useState<boolean | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptLoading, setDeptLoading] = useState(true);
  const [deptError, setDeptError] = useState<string | null>(null);
  const [addDeptDialogOpen, setAddDeptDialogOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [processingDept, setProcessingDept] = useState(false);
  const [editDeptDialog, setEditDeptDialog] = useState<{ open: boolean; dept: Department | null }>({ open: false, dept: null });
  const [deleteDeptDialog, setDeleteDeptDialog] = useState<{ open: boolean; dept: Department | null }>({ open: false, dept: null });

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<User[]>('/admin/users');
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      setDeptLoading(true);
      const data = await apiService.getDepartments();
      setDepartments(data);
    } catch (err) {
      console.error('Error fetching departments:', err);
      setDeptError('Failed to load departments');
    } finally {
      setDeptLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.password) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setAddingUser(true);
      setError(null);
      
      await apiService.post('/admin/users', {
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        password: newUser.password,
        jobTitle: newUser.jobTitle || null,
        department: newUser.department || null
      });

      // Reset form and close dialog
      setNewUser({ 
        firstName: '', 
        lastName: '', 
        email: '',
        password: '',
        jobTitle: '',
        department: ''
      });
      setAddDialogOpen(false);
      
      // Refresh users list
      await fetchUsers();
    } catch (err: any) {
      console.error('Error adding user:', err);
      setError(err.response?.data?.error || 'Failed to add user');
    } finally {
      setAddingUser(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await apiService.delete(`/admin/users/${userId}`);
      await fetchUsers(); // Refresh the list
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user');
    }
  };

  const handleStatusToggle = (userId: number, currentStatus: boolean) => {
    const userToToggle = users.find(u => u.id === userId) || null;
    setConfirmStatusDialog({ open: true, user: userToToggle });
    setPendingStatus(!currentStatus);
  };

  const handleConfirmStatusChange = async () => {
    if (!confirmStatusDialog.user || pendingStatus === null) return;
    try {
      await apiService.put(`/admin/users/${confirmStatusDialog.user.id}/status`, {
        isActive: pendingStatus
      });
      await fetchUsers();
    } catch (err) {
      setError('Failed to update user status');
    } finally {
      setConfirmStatusDialog({ open: false, user: null });
      setPendingStatus(null);
    }
  };

  const handleCancelStatusChange = () => {
    setConfirmStatusDialog({ open: false, user: null });
    setPendingStatus(null);
  };

  const handleAddDepartment = async () => {
    if (!newDeptName.trim()) return;
    try {
      setProcessingDept(true);
      await apiService.createDepartment(newDeptName.trim());
      setNewDeptName('');
      setAddDeptDialogOpen(false);
      await fetchDepartments();
    } catch (err) {
      setDeptError('Failed to add department');
    } finally {
      setProcessingDept(false);
    }
  };

  const handleUpdateDepartment = async () => {
    if (!editDeptDialog.dept || !newDeptName.trim()) return;
    try {
      setProcessingDept(true);
      await apiService.updateDepartment(editDeptDialog.dept.id, newDeptName.trim());
      setEditDeptDialog({ open: false, dept: null });
      setNewDeptName('');
      await fetchDepartments();
    } catch (err) {
      setDeptError('Failed to update department');
    } finally {
      setProcessingDept(false);
    }
  };

  const handleDeleteDepartment = async () => {
    if (!deleteDeptDialog.dept) return;
    try {
      setProcessingDept(true);
      await apiService.deleteDepartment(deleteDeptDialog.dept.id);
      setDeleteDeptDialog({ open: false, dept: null });
      await fetchDepartments();
    } catch (err) {
      setDeptError('Failed to delete department');
    } finally {
      setProcessingDept(false);
    }
  };

  const adminTabs = (
    <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ background: '#f5f5f5', px: 3 }}>
      <Tab label="User Management" />
      <Tab label="Data Management" />
    </Tabs>
  );

  return (
    <>
      {adminTabs}
      {tab === 0 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" fontWeight={600}>Users</Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddDialogOpen(true)}>
              Add User
            </Button>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : (
            <Paper sx={{ width: '100%', borderRadius: 3, boxShadow: 2, background: '#fff' }}>
              <TableContainer sx={{ boxShadow: 'none' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Job Title</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((rowUser) => (
                      <TableRow key={rowUser.id}>
                        <TableCell>{`${rowUser.first_name} ${rowUser.last_name}`}</TableCell>
                        <TableCell>{rowUser.email}</TableCell>
                        <TableCell>{rowUser.job_title || '-'}</TableCell>
                        <TableCell>{rowUser.department || '-'}</TableCell>
                        <TableCell>
                          {loggedInUserId === rowUser.id 
                            ? null
                            : (
                              <Switch
                                checked={rowUser.is_active}
                                onChange={() => handleStatusToggle(rowUser.id, rowUser.is_active)}
                                color="primary"
                                inputProps={{ 'aria-label': 'user status' }}
                              />
                            )}
                          {rowUser.is_active ? 'Active' : 'Inactive'}
                        </TableCell>
                        <TableCell align="right">
                          {loggedInUserId !== rowUser.id && (
                            <Tooltip title="Delete">
                              <IconButton onClick={() => handleDeleteUser(rowUser.id)} size="small">
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Add User</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <TextField
                  label="First Name"
                  value={newUser.firstName}
                  onChange={e => setNewUser({ ...newUser, firstName: e.target.value })}
                  size="small"
                  fullWidth
                  required
                />
                <TextField
                  label="Last Name"
                  value={newUser.lastName}
                  onChange={e => setNewUser({ ...newUser, lastName: e.target.value })}
                  size="small"
                  fullWidth
                  required
                />
                <TextField
                  label="Email"
                  type="email"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  size="small"
                  fullWidth
                  required
                />
                <TextField
                  label="Password"
                  type="password"
                  value={newUser.password}
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                  size="small"
                  fullWidth
                  required
                />
                <TextField
                  label="Job Title"
                  value={newUser.jobTitle}
                  onChange={e => setNewUser({ ...newUser, jobTitle: e.target.value })}
                  size="small"
                  fullWidth
                />
                <TextField
                  label="Department"
                  value={newUser.department}
                  onChange={e => setNewUser({ ...newUser, department: e.target.value })}
                  size="small"
                  fullWidth
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setAddDialogOpen(false)} disabled={addingUser}>
                Cancel
              </Button>
              <Button 
                variant="contained"
                onClick={handleAddUser} 
                disabled={addingUser || !newUser.firstName || !newUser.lastName || !newUser.email || !newUser.password}
              >
                {addingUser ? <CircularProgress size={20} /> : 'Add User'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Confirmation Dialog for Status Change */}
          <Dialog open={confirmStatusDialog.open} onClose={handleCancelStatusChange}>
            <DialogTitle>Confirm Status Change</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to set this user as {pendingStatus ? 'Active' : 'Inactive'}?
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCancelStatusChange}>Cancel</Button>
              <Button variant="contained" color="primary" onClick={handleConfirmStatusChange}>Confirm</Button>
            </DialogActions>
          </Dialog>
        </>
      )}
      {tab === 1 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" fontWeight={600}>Departments</Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddDeptDialogOpen(true)}>
              Add Department
            </Button>
          </Box>
          {deptError && <Alert severity="error" sx={{ mb:2 }} onClose={() => setDeptError(null)}>{deptError}</Alert>}
          {deptLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px"><CircularProgress /></Box>
          ) : (
            <Paper sx={{ width: '100%', borderRadius:3, boxShadow:2 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {departments.map((dept) => (
                      <TableRow key={dept.id}>
                        <TableCell>{dept.name}</TableCell>
                        <TableCell>{dept.is_active ? 'Active' : 'Inactive'}</TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => { setEditDeptDialog({ open: true, dept }); setNewDeptName(dept.name); }}><EditIcon fontSize="small"/></IconButton>
                          <IconButton size="small" onClick={() => setDeleteDeptDialog({ open: true, dept })}><DeleteIcon fontSize="small"/></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {/* Add Department Dialog */}
          <Dialog open={addDeptDialogOpen} onClose={() => setAddDeptDialogOpen(false)} maxWidth="xs" fullWidth>
            <DialogTitle>Add Department</DialogTitle>
            <DialogContent>
              <TextField autoFocus label="Department Name" fullWidth value={newDeptName} onChange={(e)=>setNewDeptName(e.target.value)} />
            </DialogContent>
            <DialogActions>
              <Button onClick={()=>setAddDeptDialogOpen(false)}>Cancel</Button>
              <Button variant="contained" onClick={handleAddDepartment} disabled={processingDept || !newDeptName.trim()}>{processingDept ? <CircularProgress size={20}/> : 'Add'}</Button>
            </DialogActions>
          </Dialog>

          {/* Edit Department Dialog */}
          <Dialog open={editDeptDialog.open} onClose={()=>setEditDeptDialog({ open:false, dept:null })} maxWidth="xs" fullWidth>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogContent>
              <TextField autoFocus label="Department Name" fullWidth value={newDeptName} onChange={(e)=>setNewDeptName(e.target.value)} />
            </DialogContent>
            <DialogActions>
              <Button onClick={()=>setEditDeptDialog({ open:false, dept:null })}>Cancel</Button>
              <Button variant="contained" onClick={handleUpdateDepartment} disabled={processingDept || !newDeptName.trim()}>{processingDept ? <CircularProgress size={20}/> : 'Save'}</Button>
            </DialogActions>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={deleteDeptDialog.open} onClose={()=>setDeleteDeptDialog({ open:false, dept:null })} maxWidth="xs" fullWidth>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogContent>
              <Typography>Are you sure you want to delete the department "{deleteDeptDialog.dept?.name}"?</Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={()=>setDeleteDeptDialog({ open:false, dept:null })}>Cancel</Button>
              <Button color="error" variant="contained" onClick={handleDeleteDepartment} disabled={processingDept}>{processingDept ? <CircularProgress size={20}/> : 'Delete'}</Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </>
  );
};

export default AdminPage; 
