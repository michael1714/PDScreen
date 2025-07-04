import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { pool, initializeDatabase } from './db/init';
import uploadRouter from './routes/upload';
import authRouter from './routes/auth';
import dashboardRouter from './routes/dashboard';
import adminRouter from './routes/admin';
import systemAdminRouter from './routes/system-admin';
import fs from 'fs';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../../dist')));

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Initialize database
initializeDatabase().catch(console.error);

// API Routes
app.use('/api/upload', uploadRouter);
app.use('/api/auth', authRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/admin', adminRouter);
app.use('/api/system-admin', systemAdminRouter);

// Get content by key
app.get('/api/content/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const result = await pool.query(
      'SELECT value FROM content WHERE key = $1',
      [key]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    res.json({ value: result.rows[0].value });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Webhook endpoint with secret header validation
app.post('/webhook', async (req, res) => {
  // Debug logging
  console.log('Webhook received:');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  
  const secret = req.headers['x-webhook-secret'];
  if (secret !== process.env.WEBHOOK_SECRET) {
    console.log('Webhook secret mismatch. Expected:', process.env.WEBHOOK_SECRET, 'Received:', secret);
    return res.status(401).send('Unauthorized');
  }
  try {
    const { Row, LLMDesc, row, llmDesc, responsibilityId, description } = req.body;
    
    // Handle different possible field names from Make.com
    const responsibilityIdValue = Row || row || responsibilityId;
    const llmDescValue = LLMDesc || llmDesc || description;
    
    if (!responsibilityIdValue || !llmDescValue) {
      console.log('Missing required fields. Available fields:', Object.keys(req.body));
      return res.status(400).json({ 
        error: 'Missing responsibility ID or LLM description in request body',
        receivedFields: Object.keys(req.body)
      });
    }
    
    console.log('Updating responsibility ID:', responsibilityIdValue, 'with description:', llmDescValue);
    
    // Update the LLM_Desc field for the given responsibility id
    const result = await pool.query(
      'UPDATE responsibilities SET "LLM_Desc" = $1 WHERE id = $2 RETURNING *',
      [llmDescValue, responsibilityIdValue]
    );
    if (result.rowCount === 0) {
      console.log('Responsibility not found for ID:', responsibilityIdValue);
      return res.status(404).json({ error: 'Responsibility not found' });
    }
    
    console.log('Successfully updated responsibility:', result.rows[0]);
    res.json({ message: 'LLM_Desc updated successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Webhook upsert error:', error);
    res.status(500).json({ error: 'Failed to upsert LLM_Desc' });
  }
});

// Serve the React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 