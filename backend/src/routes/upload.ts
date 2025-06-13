import express from 'express';
import multer from 'multer';
import path from 'path';
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

export default router; 