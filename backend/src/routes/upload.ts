import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { pool } from '../db/init';

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.doc', '.docx'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'));
        }
    }
});

// Upload endpoint
router.post('/', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { title } = req.body;
        const { filename, path: filePath, size } = req.file;

        const result = await pool.query(
            'INSERT INTO position_descriptions (title, file_name, file_path, file_size) VALUES ($1, $2, $3, $4) RETURNING *',
            [title, filename, filePath, size]
        );

        res.status(201).json({
            message: 'File uploaded successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

// Get all position descriptions
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM position_descriptions ORDER BY upload_date DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching position descriptions:', error);
        res.status(500).json({ error: 'Failed to fetch position descriptions' });
    }
});

// Download endpoint
router.get('/:id/download', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT file_path, file_name FROM position_descriptions WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }

        const { file_path, file_name } = result.rows[0];
        
        if (!fs.existsSync(file_path)) {
            return res.status(404).json({ error: 'File not found on server' });
        }

        res.download(file_path, file_name);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Failed to download file' });
    }
});

// Delete endpoint
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get file path before deleting
        const result = await pool.query(
            'SELECT file_path FROM position_descriptions WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }

        const { file_path } = result.rows[0];

        // Delete from database
        await pool.query('DELETE FROM position_descriptions WHERE id = $1', [id]);

        // Delete file from filesystem
        if (fs.existsSync(file_path)) {
            fs.unlinkSync(file_path);
        }

        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

// Get responsibilities for a PD
router.get('/:id/responsibilities', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT id, responsibility_name, responsibility_percentage, "LLM_Desc", is_llm_version, ai_automation_percentage, ai_automation_reason FROM responsibilities WHERE pd_id = $1 ORDER BY id',
            [id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching responsibilities:', error);
        res.status(500).json({ error: 'Failed to fetch responsibilities' });
    }
});

// Update responsibility percentage
router.put('/responsibility/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let { responsibility_percentage, responsibility_name, LLM_Desc, is_llm_version } = req.body;
        console.log('PUT /responsibility/:id body:', req.body); // Debug log
        // Defensive: coerce is_llm_version to boolean if present
        if (is_llm_version !== undefined) {
            if (typeof is_llm_version === 'string') {
                is_llm_version = is_llm_version === 'true' || is_llm_version === '1';
            } else {
                is_llm_version = !!is_llm_version;
            }
        }
        // Build dynamic SQL
        const fields = [];
        const values = [];
        let idx = 1;
        if (responsibility_percentage !== undefined) {
            fields.push(`responsibility_percentage = $${idx++}`);
            values.push(responsibility_percentage);
        }
        if (responsibility_name !== undefined) {
            fields.push(`responsibility_name = $${idx++}`);
            values.push(responsibility_name);
        }
        if (LLM_Desc !== undefined) {
            fields.push(`"LLM_Desc" = $${idx++}`);
            values.push(LLM_Desc);
        }
        if (is_llm_version !== undefined) {
            fields.push(`is_llm_version = $${idx++}`);
            values.push(is_llm_version);
        }
        if (fields.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }
        values.push(id);
        const sql = `UPDATE responsibilities SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
        const result = await pool.query(sql, values);
        res.json({ message: 'Responsibility updated successfully', data: result.rows[0] });
    } catch (error) {
        console.error('Error updating responsibility:', error);
        res.status(500).json({ error: 'Failed to update responsibility' });
    }
});

// Add new responsibility
router.post('/:id/responsibilities', async (req, res) => {
    try {
        const { id } = req.params;
        const { responsibility_name } = req.body;
        const result = await pool.query(
            'INSERT INTO responsibilities (pd_id, responsibility_name, responsibility_percentage) VALUES ($1, $2, 0) RETURNING *',
            [id, responsibility_name]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding responsibility:', error);
        res.status(500).json({ error: 'Failed to add responsibility' });
    }
});

// Delete a responsibility
router.delete('/responsibility/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM responsibilities WHERE id = $1', [id]);
        res.json({ message: 'Responsibility deleted successfully' });
    } catch (error) {
        console.error('Error deleting responsibility:', error);
        res.status(500).json({ error: 'Failed to delete responsibility' });
    }
});

export default router; 