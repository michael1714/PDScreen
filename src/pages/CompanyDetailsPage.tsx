import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Tooltip,
  Switch,
  FormControlLabel,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  DialogContentText,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { Editor } from '@tinymce/tinymce-react';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PreviewIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { SelectChangeEvent } from '@mui/material';

interface CompanyDetails {
  name: string;
  industry: string;
  company_size: string;
  website: string;
  address: string;
  phone: string;
  company_information: string;
  company_values: string;
  company_mission: string;
}

interface CompanyInfoBlock {
  id: number;
  title: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

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
      id={`company-tabpanel-${index}`}
      aria-labelledby={`company-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `company-tab-${index}`,
    'aria-controls': `company-tabpanel-${index}`,
  };
}

const companySizeOptions = [
  '1–10 employees',
  '11–50 employees', 
  '51–200 employees',
  '201–500 employees',
  '501–5,000+ employees'
];

const CompanyDetailsPage: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails>({
    name: '',
    industry: '',
    company_size: '',
    website: '',
    address: '',
    phone: '',
    company_information: '',
    company_values: '',
    company_mission: ''
  });
  const [editedCompanyDetails, setEditedCompanyDetails] = useState<CompanyDetails | null>(null);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [infoBlocks, setInfoBlocks] = useState<CompanyInfoBlock[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openPreview, setOpenPreview] = useState(false);
  const [editingBlock, setEditingBlock] = useState<CompanyInfoBlock | null>(null);
  const [previewBlock, setPreviewBlock] = useState<CompanyInfoBlock | null>(null);
  const [currentBlock, setCurrentBlock] = useState<Partial<CompanyInfoBlock>>({
    title: '',
    description: '',
    is_active: true
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editorApiKey, setEditorApiKey] = useState<string>('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [closeAction, setCloseAction] = useState<'close' | 'cancel' | null>(null);

  useEffect(() => {
    if (!user) {
      setError('User not authenticated');
      return;
    }
    fetchCompanyDetails();
    fetchInfoBlocks();
    const fetchApiKey = async () => {
      try {
        const apiKey = await api.getTinyMCEKey();
        setEditorApiKey(apiKey);
      } catch (error) {
        console.error('Error fetching TinyMCE API key:', error);
        setEditorApiKey('6lf0agkbeph8fv7wg6ime0ure2np0mw4fmon9peyceqgl0qp');
      }
    };

    fetchApiKey();
  }, [user]);

  const fetchCompanyDetails = async () => {
    try {
      setCompanyLoading(true);
      const response = await api.getCompanyDetails();
      setCompanyDetails({
        name: response.name || '',
        industry: response.industry || '',
        company_size: response.company_size || '',
        website: response.website || '',
        address: response.address || '',
        phone: response.phone || '',
        company_information: response.company_information || '',
        company_values: response.company_values || '',
        company_mission: response.company_mission || ''
      });
      setError(null);
    } catch (err) {
      setError('Failed to fetch company details');
      console.error('Error fetching company details:', err);
    } finally {
      setCompanyLoading(false);
    }
  };

  const handleEditCompanyDetails = () => {
    setEditedCompanyDetails({ ...companyDetails });
  };

  const handleCancelEdit = () => {
    setEditedCompanyDetails(null);
  };

  const handleSaveCompanyDetails = async () => {
    if (!editedCompanyDetails) return;

    try {
      setCompanyLoading(true);
      const response = await api.updateCompanyDetails(editedCompanyDetails);
      setCompanyDetails({
        name: response.name || '',
        industry: response.industry || '',
        company_size: response.company_size || '',
        website: response.website || '',
        address: response.address || '',
        phone: response.phone || '',
        company_information: response.company_information || '',
        company_values: response.company_values || '',
        company_mission: response.company_mission || ''
      });
      setEditedCompanyDetails(null);
      setSuccessMessage('Company details updated successfully');
      setError(null);
    } catch (err) {
      setError('Failed to update company details');
      console.error('Error updating company details:', err);
    } finally {
      setCompanyLoading(false);
    }
  };

  const handleTextFieldChange = (field: keyof CompanyDetails) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!editedCompanyDetails) return;
    
    setEditedCompanyDetails({
      ...editedCompanyDetails,
      [field]: event.target.value
    });
  };

  const handleSelectChange = (field: keyof CompanyDetails) => (
    event: SelectChangeEvent
  ) => {
    if (!editedCompanyDetails) return;
    
    setEditedCompanyDetails({
      ...editedCompanyDetails,
      [field]: event.target.value
    });
  };

  const fetchInfoBlocks = async () => {
    try {
      setLoading(true);
      const blocks = await api.getCompanyInfoBlocks();
      setInfoBlocks(blocks);
      setError(null);
    } catch (err) {
      setError('Failed to fetch company information blocks');
      console.error('Error fetching blocks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (block?: CompanyInfoBlock) => {
    if (block) {
      setEditingBlock(block);
      setCurrentBlock(block);
    } else {
      setEditingBlock(null);
      setCurrentBlock({
        title: '',
        description: '',
        is_active: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentBlock({ title: '', description: '', is_active: true });
    setEditingBlock(null);
    setError(null);
    setHasChanges(false);
    setCloseAction(null);
  };

  const handleOpenPreview = (block: CompanyInfoBlock) => {
    setPreviewBlock(block);
    setOpenPreview(true);
  };

  const handleClosePreview = () => {
    setOpenPreview(false);
    setPreviewBlock(null);
  };

  const handleSave = async () => {
    try {
      if (!currentBlock.title || !currentBlock.description) {
        setError('Title and description are required');
        return;
      }

      if (editingBlock) {
        await api.updateCompanyInfoBlock(editingBlock.id, {
          title: currentBlock.title,
          description: currentBlock.description,
          is_active: currentBlock.is_active
        });
        setSuccessMessage('Block updated successfully');
      } else {
        await api.createCompanyInfoBlock({
          title: currentBlock.title!,
          description: currentBlock.description!,
          is_active: currentBlock.is_active!
        });
        setSuccessMessage('Block created successfully');
      }
      
      handleCloseDialog();
      fetchInfoBlocks();
    } catch (err) {
      setError(editingBlock ? 'Failed to update block' : 'Failed to create block');
      console.error('Error saving block:', err);
    }
  };

  const handleDeleteBlock = async (id: number) => {
    try {
      await api.deleteCompanyInfoBlock(id);
      setInfoBlocks(blocks => blocks.filter(block => block.id !== id));
      setSuccessMessage('Block deleted successfully');
    } catch (err) {
      setError('Failed to delete block');
      console.error('Error deleting block:', err);
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      await api.updateCompanyInfoBlock(id, {
        is_active: !currentStatus
      });
      setSuccessMessage(`Block ${currentStatus ? 'disabled' : 'enabled'} successfully`);
      fetchInfoBlocks();
    } catch (err) {
      setError('Failed to update block status');
      console.error('Error updating block status:', err);
    }
  };

  const [editorConfig] = useState({
    height: 300,
    menubar: true,
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'help', 'wordcount'
    ],
    toolbar: 'undo redo | blocks | ' +
      'bold italic forecolor | alignleft aligncenter ' +
      'alignright alignjustify | bullist numlist outdent indent | ' +
      'removeformat | help',
    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
  });

  // Function to check if there are unsaved changes
  const checkForChanges = () => {
    if (!editingBlock) {
      return currentBlock.title?.trim() !== '' || currentBlock.description?.trim() !== '';
    }
    return (
      currentBlock.title !== infoBlocks.find(b => b.id === currentBlock.id)?.title ||
      currentBlock.description !== infoBlocks.find(b => b.id === currentBlock.id)?.description ||
      currentBlock.is_active !== infoBlocks.find(b => b.id === currentBlock.id)?.is_active
    );
  };

  // Handle block content changes
  const handleBlockChange = (changes: Partial<typeof currentBlock>) => {
    setCurrentBlock(prev => ({ ...prev, ...changes }));
    setHasChanges(true);
  };

  // Handle dialog close attempt
  const handleCloseAttempt = (action: 'close' | 'cancel') => {
    if (checkForChanges()) {
      setCloseAction(action);
      setConfirmDialogOpen(true);
    } else {
      handleCloseDialog();
    }
  };

  // Handle confirmation dialog response
  const handleConfirmResponse = (shouldSave: boolean) => {
    setConfirmDialogOpen(false);
    if (shouldSave) {
      handleSave();
    } else {
      handleCloseDialog();
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={600}>
          Company Details
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="company details tabs">
          <Tab label="General Information" {...a11yProps(0)} />
          <Tab label="Information Blocks" {...a11yProps(1)} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              General Information
            </Typography>
            {!editedCompanyDetails ? (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleEditCompanyDetails}
                disabled={companyLoading}
              >
                Edit Details
              </Button>
            ) : (
              <Box>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveCompanyDetails}
                  disabled={companyLoading}
                  sx={{ mr: 1 }}
                >
                  Save
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CloseIcon />}
                  onClick={handleCancelEdit}
                  disabled={companyLoading}
                >
                  Cancel
                </Button>
              </Box>
            )}
          </Box>
          {companyLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
              {successMessage && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
                  {successMessage}
                </Alert>
              )}
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    General Information
                  </Typography>
                </Grid>
                {editedCompanyDetails ? (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Client Name"
                        value={editedCompanyDetails.name}
                        onChange={handleTextFieldChange('name')}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Industry"
                        value={editedCompanyDetails.industry}
                        onChange={handleTextFieldChange('industry')}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel id="company-size-label">Company Size</InputLabel>
                        <Select
                          labelId="company-size-label"
                          value={editedCompanyDetails.company_size}
                          label="Company Size"
                          onChange={(e) => handleSelectChange('company_size')(e)}
                        >
                          {companySizeOptions.map((option) => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Website"
                        value={editedCompanyDetails.website}
                        onChange={handleTextFieldChange('website')}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Address"
                        value={editedCompanyDetails.address}
                        onChange={handleTextFieldChange('address')}
                        multiline
                        rows={2}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone"
                        value={editedCompanyDetails.phone}
                        onChange={handleTextFieldChange('phone')}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Company Information"
                        value={editedCompanyDetails.company_information}
                        onChange={handleTextFieldChange('company_information')}
                        multiline
                        rows={4}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Company Values"
                        value={editedCompanyDetails.company_values}
                        onChange={handleTextFieldChange('company_values')}
                        multiline
                        rows={4}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Company Mission"
                        value={editedCompanyDetails.company_mission}
                        onChange={handleTextFieldChange('company_mission')}
                        multiline
                        rows={4}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        <Button onClick={handleCancelEdit}>Cancel</Button>
                        <Button
                          variant="contained"
                          onClick={handleSaveCompanyDetails}
                          startIcon={<SaveIcon />}
                        >
                          Save Changes
                        </Button>
                      </Box>
                    </Grid>
                  </>
                ) : (
                  <>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1">
                        <strong>Client Name: </strong>{companyDetails.name}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1">
                        <strong>Industry: </strong>{companyDetails.industry}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1">
                        <strong>Company Size: </strong>{companyDetails.company_size}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1">
                        <strong>Website: </strong>{companyDetails.website}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1">
                        <strong>Address: </strong>{companyDetails.address}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1">
                        <strong>Phone: </strong>{companyDetails.phone}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body1" style={{ marginTop: '16px' }}>
                        <strong>Company Information: </strong>{companyDetails.company_information}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body1" style={{ marginTop: '16px' }}>
                        <strong>Company Values: </strong>{companyDetails.company_values}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body1" style={{ marginTop: '16px' }}>
                        <strong>Company Mission: </strong>{companyDetails.company_mission}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                        <Button
                          variant="contained"
                          onClick={handleEditCompanyDetails}
                          startIcon={<EditIcon />}
                        >
                          Edit Details
                        </Button>
                      </Box>
                    </Grid>
                  </>
                )}
              </Grid>
            </>
          )}
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Information Blocks
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              disabled={loading}
            >
              Add Block
            </Button>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
              {successMessage && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
                  {successMessage}
                </Alert>
              )}
              <List>
                {infoBlocks.map((block) => (
                  <React.Fragment key={block.id}>
                    <ListItem>
                      <ListItemText
                        primary={block.title}
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Chip
                              label={block.is_active ? 'Active' : 'Inactive'}
                              color={block.is_active ? 'success' : 'default'}
                              size="small"
                            />
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Preview">
                          <IconButton edge="end" aria-label="preview" onClick={() => handleOpenPreview(block)} sx={{ mr: 1 }}>
                            <PreviewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton edge="end" aria-label="edit" onClick={() => handleOpenDialog(block)} sx={{ mr: 1 }}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteBlock(block.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            </>
          )}
        </Box>
      </TabPanel>

      {/* Block Editor Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => handleCloseAttempt('close')}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingBlock ? 'Edit Information Block' : 'Add Information Block'}
          <IconButton
            aria-label="close"
            onClick={() => handleCloseAttempt('close')}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            type="text"
            fullWidth
            value={currentBlock.title}
            onChange={(e) => handleBlockChange({ title: e.target.value })}
            required
            error={!currentBlock.title && hasChanges}
            helperText={!currentBlock.title && hasChanges ? 'Title is required' : ''}
          />
          <Box sx={{ mt: 2 }}>
            <Editor
              apiKey={editorApiKey}
              value={currentBlock.description}
              init={editorConfig}
              onEditorChange={(content) => handleBlockChange({ description: content })}
            />
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={currentBlock.is_active}
                onChange={(e) => handleBlockChange({ is_active: e.target.checked })}
              />
            }
            label="Active"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleCloseAttempt('cancel')}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={!currentBlock.title || !currentBlock.description}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={openPreview}
        onClose={handleClosePreview}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {previewBlock?.title}
          <IconButton
            aria-label="close"
            onClick={handleClosePreview}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <div dangerouslySetInnerHTML={{ __html: previewBlock?.description || '' }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>Unsaved Changes</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have unsaved changes. Would you like to save them before closing?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleConfirmResponse(false)}>Discard</Button>
          <Button onClick={() => handleConfirmResponse(true)} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Message Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={() => setSuccessMessage(null)} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CompanyDetailsPage; 