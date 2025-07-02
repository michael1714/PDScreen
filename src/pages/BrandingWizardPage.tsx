import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import {
  Description as DescriptionIcon,
  Style as StyleIcon,
  Preview as PreviewIcon,
  CheckCircle as CheckCircleIcon,
  CloudDownload as CloudDownloadIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

interface PositionDescription {
  id: number;
  title: string;
  department: string;
  uploadDate: string;
}

interface BrandingTemplate {
  id: number;
  name: string;
  description: string;
  preview: string;
}

const steps = [
  'Select Position Description',
  'Choose Template',
  'Preview & Download',
  'Complete'
];

const BrandingWizardPage: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedPD, setSelectedPD] = useState<PositionDescription | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<BrandingTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  // Mock data - remove when integrating with backend
  const mockPDs: PositionDescription[] = [
    { id: 1, title: 'Software Engineer', department: 'Engineering', uploadDate: '2024-01-15' },
    { id: 2, title: 'Product Manager', department: 'Product', uploadDate: '2024-01-14' },
    { id: 3, title: 'UX Designer', department: 'Design', uploadDate: '2024-01-13' },
  ];

  const mockTemplates: BrandingTemplate[] = [
    { id: 1, name: 'Modern Corporate', description: 'Clean and professional design with modern typography', preview: '/path/to/preview1.jpg' },
    { id: 2, name: 'Creative Agency', description: 'Bold and innovative design for creative positions', preview: '/path/to/preview2.jpg' },
    { id: 3, name: 'Minimal Classic', description: 'Simple and elegant design that focuses on content', preview: '/path/to/preview3.jpg' },
  ];

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handlePDSelect = (pd: PositionDescription) => {
    setSelectedPD(pd);
  };

  const handleTemplateSelect = (template: BrandingTemplate) => {
    setSelectedTemplate(template);
  };

  const handlePreview = () => {
    setPreviewDialogOpen(true);
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      // Mock download delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      // Download logic will go here
      setLoading(false);
    } catch (err) {
      setError('Failed to download document');
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select a Position Description to Brand
            </Typography>
            <List>
              {mockPDs.map((pd) => (
                <React.Fragment key={pd.id}>
                  <ListItem>
                    <ListItemIcon>
                      <DescriptionIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={pd.title}
                      secondary={`${pd.department} • Uploaded on ${pd.uploadDate}`}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedPD?.id === pd.id}
                          onChange={() => handlePDSelect(pd)}
                        />
                      }
                      label=""
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Choose a Branding Template
            </Typography>
            <Grid container spacing={3}>
              {mockTemplates.map((template) => (
                <Grid item xs={12} md={4} key={template.id}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      border: selectedTemplate?.id === template.id ? 2 : 0,
                      borderColor: 'primary.main'
                    }}
                  >
                    <CardActionArea onClick={() => handleTemplateSelect(template)}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {template.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {template.description}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Preview and Download
            </Typography>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1">
                    Selected Position Description:
                  </Typography>
                  <Typography color="text.secondary">
                    {selectedPD?.title}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1">
                    Selected Template:
                  </Typography>
                  <Typography color="text.secondary">
                    {selectedTemplate?.name}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    startIcon={<PreviewIcon />}
                    onClick={handlePreview}
                    sx={{ mr: 2 }}
                  >
                    Preview
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} /> : <CloudDownloadIcon />}
                    onClick={handleDownload}
                    disabled={loading}
                  >
                    Download
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Branding Complete!
            </Typography>
            <Typography color="text.secondary">
              Your branded position description has been downloaded successfully.
            </Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom align="center" fontWeight={600}>
          Branding Wizard
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
          {activeStep !== 0 && activeStep !== 3 && (
            <Button onClick={handleBack} sx={{ mr: 1 }}>
              Back
            </Button>
          )}
          {activeStep !== 3 && (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={
                (activeStep === 0 && !selectedPD) ||
                (activeStep === 1 && !selectedTemplate) ||
                loading
              }
            >
              {activeStep === 2 ? 'Finish' : 'Next'}
            </Button>
          )}
        </Box>
      </Paper>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Preview
          <IconButton
            onClick={() => setPreviewDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {/* Preview content will go here */}
          <Box sx={{ height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">
              Preview will be displayed here
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
          <Button variant="contained" onClick={handleDownload} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Download'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BrandingWizardPage; 