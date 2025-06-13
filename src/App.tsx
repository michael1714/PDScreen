import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import './App.css';
import PositionDescriptionUpload from './components/PositionDescriptionUpload';
import PositionDescriptionList from './components/PositionDescriptionList';

function App() {
  return (
    <Router>
      <div className="App">
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              PD Screen
            </Typography>
            <Button color="inherit" component={Link} to="/">
              Upload
            </Button>
            <Button color="inherit" component={Link} to="/list">
              List
            </Button>
          </Toolbar>
        </AppBar>

        <Container>
          <Routes>
            <Route path="/" element={<PositionDescriptionUpload />} />
            <Route path="/list" element={<PositionDescriptionList />} />
          </Routes>
        </Container>
      </div>
    </Router>
  );
}

export default App; 