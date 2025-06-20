import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool, initializeDatabase } from './db/init';
import uploadRouter from './routes/upload';
import fs from 'fs';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Initialize database
initializeDatabase().catch(console.error);

// Routes
app.use('/api/upload', uploadRouter);

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
  const secret = req.headers['x-webhook-secret'];
  if (secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).send('Unauthorized');
  }
  try {
    const { Row, LLMDesc } = req.body;
    if (!Row || !LLMDesc) {
      return res.status(400).json({ error: 'Missing Row (id) or LLMDesc in request body' });
    }
    // Update the LLM_Desc field for the given responsibility id
    const result = await pool.query(
      'UPDATE responsibilities SET "LLM_Desc" = $1 WHERE id = $2 RETURNING *',
      [LLMDesc, Row]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Responsibility not found' });
    }
    res.json({ message: 'LLM_Desc updated successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Webhook upsert error:', error);
    res.status(500).json({ error: 'Failed to upsert LLM_Desc' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 