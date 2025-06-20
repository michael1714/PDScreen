import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { pool } from '../db/init';
import { authenticateToken } from '../middleware/auth';
import { validateFileUpload, validateResponsibility, handleValidationErrors } from '../middleware/validation';

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
router.post('/', authenticateToken, upload.single('file'), validateFileUpload, handleValidationErrors, async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { title } = req.body;
        const { filename, path: filePath, size } = req.file;
        const companyId = req.user?.companyId;

        if (!companyId) {
            return res.status(400).json({ error: 'Company ID not found in token' });
        }

        const result = await pool.query(
            'INSERT INTO position_descriptions (title, file_name, file_path, file_size, company_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, filename, filePath, size, companyId]
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
router.get('/', authenticateToken, async (req: Request, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        
        if (!companyId) {
            return res.status(400).json({ error: 'Company ID not found in token' });
        }

        const result = await pool.query(
            'SELECT * FROM position_descriptions WHERE company_id = $1 ORDER BY upload_date DESC',
            [companyId]
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching position descriptions:', error);
        res.status(500).json({ error: 'Failed to fetch position descriptions' });
    }
});

// Download endpoint
router.get('/:id/download', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user?.companyId;
        
        if (!companyId) {
            return res.status(400).json({ error: 'Company ID not found in token' });
        }

        // Verify the position description belongs to the user's company
        const result = await pool.query(
            'SELECT file_path, file_name FROM position_descriptions WHERE id = $1 AND company_id = $2',
            [id, companyId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'File not found or access denied' });
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
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user?.companyId;
        
        if (!companyId) {
            return res.status(400).json({ error: 'Company ID not found in token' });
        }

        // Verify the position description belongs to the user's company
        const result = await pool.query(
            'SELECT file_path FROM position_descriptions WHERE id = $1 AND company_id = $2',
            [id, companyId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'File not found or access denied' });
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
router.get('/:id/responsibilities', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user?.companyId;
        
        if (!companyId) {
            return res.status(400).json({ error: 'Company ID not found in token' });
        }

        const result = await pool.query(`
            SELECT r.id, r.responsibility_name, r.responsibility_percentage, r."LLM_Desc", 
                   r.is_llm_version, r.ai_automation_percentage, r.ai_automation_reason 
            FROM responsibilities r
            JOIN position_descriptions pd ON r.pd_id = pd.id
            WHERE r.pd_id = $1 AND pd.company_id = $2
            ORDER BY r.id
        `, [id, companyId]);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching responsibilities:', error);
        res.status(500).json({ error: 'Failed to fetch responsibilities' });
    }
});

// Update responsibility percentage
router.put('/responsibility/:id', authenticateToken, validateResponsibility, handleValidationErrors, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user?.companyId;
        let { responsibility_percentage, responsibility_name, LLM_Desc, is_llm_version } = req.body;
        
        if (!companyId) {
            return res.status(400).json({ error: 'Company ID not found in token' });
        }

        console.log('PUT /responsibility/:id body:', req.body); // Debug log
        // Defensive: coerce is_llm_version to boolean if present
        if (is_llm_version !== undefined) {
            if (typeof is_llm_version === 'string') {
                is_llm_version = is_llm_version === 'true' || is_llm_version === '1';
            } else {
                is_llm_version = !!is_llm_version;
            }
        }
        
        // Verify the responsibility belongs to a position description from the user's company
        const verifyResult = await pool.query(`
            SELECT r.id FROM responsibilities r
            JOIN position_descriptions pd ON r.pd_id = pd.id
            WHERE r.id = $1 AND pd.company_id = $2
        `, [id, companyId]);
        
        if (verifyResult.rows.length === 0) {
            return res.status(404).json({ error: 'Responsibility not found or access denied' });
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
router.post('/:id/responsibilities', authenticateToken, validateResponsibility, handleValidationErrors, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user?.companyId;
        const { responsibility_name } = req.body;
        
        if (!companyId) {
            return res.status(400).json({ error: 'Company ID not found in token' });
        }

        // Verify the position description belongs to the user's company
        const verifyResult = await pool.query(
            'SELECT id FROM position_descriptions WHERE id = $1 AND company_id = $2',
            [id, companyId]
        );
        
        if (verifyResult.rows.length === 0) {
            return res.status(404).json({ error: 'Position description not found or access denied' });
        }
        
        const result = await pool.query(
            'INSERT INTO responsibilities (pd_id, responsibility_name, responsibility_percentage, company_id) VALUES ($1, $2, 0, $3) RETURNING *',
            [id, responsibility_name, companyId]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding responsibility:', error);
        res.status(500).json({ error: 'Failed to add responsibility' });
    }
});

export default router; 