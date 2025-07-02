import express from 'express';
import { pool } from '../db/init';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import {
  getCompanyInfoBlocks,
  getCompanyInfoBlock,
  createCompanyInfoBlock,
  updateCompanyInfoBlock,
  deleteCompanyInfoBlock,
  getAppSetting
} from '../db/init';

const router = express.Router();

// Get dashboard data - requires authentication and filters by company
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const companyId = req.user.companyId;

        // Get total PDs uploaded
        const totalPDsResult = await pool.query(
            'SELECT COUNT(*) as count FROM position_descriptions WHERE company_id = $1',
            [companyId]
        );
        const totalPDs = parseInt(totalPDsResult.rows[0].count);

        // Get PDs uploaded this month (last 30 days)
        const thisMonthPDsResult = await pool.query(
            'SELECT COUNT(*) as count FROM position_descriptions WHERE company_id = $1 AND upload_date >= NOW() - INTERVAL \'30 days\'',
            [companyId]
        );
        const thisMonthPDs = parseInt(thisMonthPDsResult.rows[0].count);

        // Get departments covered
        const departmentsResult = await pool.query(
            'SELECT COUNT(DISTINCT department) as count FROM position_descriptions WHERE company_id = $1 AND department IS NOT NULL',
            [companyId]
        );
        const departmentsCovered = parseInt(departmentsResult.rows[0].count);

        // Get most active department
        const mostActiveDeptResult = await pool.query(
            `SELECT department, COUNT(*) as count 
             FROM position_descriptions 
             WHERE company_id = $1 AND department IS NOT NULL 
             GROUP BY department 
             ORDER BY count DESC 
             LIMIT 1`,
            [companyId]
        );
        const mostActiveDepartment = mostActiveDeptResult.rows.length > 0 ? mostActiveDeptResult.rows[0].department : 'N/A';

        // Get total responsibilities
        const totalResponsibilitiesResult = await pool.query(
            `SELECT COUNT(*) as count 
             FROM responsibilities r 
             JOIN position_descriptions pd ON r.pd_id = pd.id 
             WHERE pd.company_id = $1`,
            [companyId]
        );
        const totalResponsibilities = parseInt(totalResponsibilitiesResult.rows[0].count);

        // Get AI-automatable responsibilities (responsibilities with ai_automation_score > 0)
        const automatableResponsibilitiesResult = await pool.query(
            `SELECT COUNT(*) as count 
             FROM responsibilities r 
             JOIN position_descriptions pd ON r.pd_id = pd.id 
             WHERE pd.company_id = $1 AND r.ai_automation_score > 0`,
            [companyId]
        );
        const automatableResponsibilities = parseInt(automatableResponsibilitiesResult.rows[0].count);
        const automatablePercentage = totalResponsibilities > 0 ? Math.round((automatableResponsibilities / totalResponsibilities) * 100) : 0;

        // Get PDs with high AI potential (PDs with ai_automation_score_sum > 0)
        const highAIPotentialResult = await pool.query(
            'SELECT COUNT(*) as count FROM position_descriptions WHERE company_id = $1 AND ai_automation_score_sum > 0',
            [companyId]
        );
        const highAIPotential = parseInt(highAIPotentialResult.rows[0].count);
        const highAIPercentage = totalPDs > 0 ? Math.round((highAIPotential / totalPDs) * 100) : 0;

        // Get average AI automation score
        const avgAIScoreResult = await pool.query(
            'SELECT AVG(ai_automation_score_sum) as avg_score FROM position_descriptions WHERE company_id = $1 AND ai_automation_score_sum IS NOT NULL',
            [companyId]
        );
        const avgAIScore = avgAIScoreResult.rows[0].avg_score ? Math.round(parseFloat(avgAIScoreResult.rows[0].avg_score) * 100) : 0;

        // Get active HR users (total users in company)
        const activeUsersResult = await pool.query(
            'SELECT COUNT(*) as count FROM users WHERE company_id = $1',
            [companyId]
        );
        const activeUsers = parseInt(activeUsersResult.rows[0].count);

        // Get PDs pending review
        const pendingReviewResult = await pool.query(
            'SELECT COUNT(*) as count FROM position_descriptions WHERE company_id = $1 AND status = \'In Review\'',
            [companyId]
        );
        const pendingReview = parseInt(pendingReviewResult.rows[0].count);

        // Get PDs published
        const publishedResult = await pool.query(
            'SELECT COUNT(*) as count FROM position_descriptions WHERE company_id = $1 AND status = \'Published\'',
            [companyId]
        );
        const published = parseInt(publishedResult.rows[0].count);

        // Get top roles for AI automation (PDs with ai_automation_score_sum > 0, ordered by score)
        const topRolesResult = await pool.query(
            `SELECT title, ai_automation_score_sum 
             FROM position_descriptions 
             WHERE company_id = $1 AND ai_automation_score_sum > 0 
             ORDER BY ai_automation_score_sum DESC 
             LIMIT 5`,
            [companyId]
        );
        const topRoles = topRolesResult.rows.map(row => ({
            role: row.title,
            score: `${Math.round(parseFloat(row.ai_automation_score_sum) * 100)}%`
        }));

        // Get recent PD uploads
        const recentUploadsResult = await pool.query(
            `SELECT title, upload_date 
             FROM position_descriptions 
             WHERE company_id = $1 
             ORDER BY upload_date DESC 
             LIMIT 5`,
            [companyId]
        );
        const recentUploads = recentUploadsResult.rows.map(row => ({
            title: row.title,
            date: new Date(row.upload_date).toISOString().split('T')[0]
        }));

        res.json({
            totalPDs,
            thisMonthPDs,
            departmentsCovered,
            mostActiveDepartment,
            totalResponsibilities,
            automatableResponsibilities: `${automatableResponsibilities} (${automatablePercentage}%)`,
            highAIPotential: `${highAIPotential} (${highAIPercentage}%)`,
            avgAIScore: `${avgAIScore}%`,
            activeUsers,
            pendingReview,
            published,
            topRoles,
            recentUploads
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

// Get all company info blocks
router.get('/company-info-blocks', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const companyId = req.user.companyId;
    const blocks = await getCompanyInfoBlocks(companyId);
    res.json(blocks);
  } catch (error) {
    console.error('Error fetching company info blocks:', error);
    res.status(500).json({ error: 'Failed to fetch company info blocks' });
  }
});

// Get a single company info block
router.get('/company-info-blocks/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const { id } = req.params;
    const companyId = req.user.companyId;
    const block = await getCompanyInfoBlock(parseInt(id), companyId);
    
    if (!block) {
      return res.status(404).json({ error: 'Company info block not found' });
    }
    
    res.json(block);
  } catch (error) {
    console.error('Error fetching company info block:', error);
    res.status(500).json({ error: 'Failed to fetch company info block' });
  }
});

// Create a new company info block
router.post('/company-info-blocks', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const { title, description, is_active } = req.body;
    
    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const companyId = req.user.companyId;
    const userId = req.user.id;
    
    const newBlock = await createCompanyInfoBlock(companyId, userId, {
      title,
      description,
      is_active: is_active ?? true
    });
    
    res.status(201).json(newBlock);
  } catch (error) {
    console.error('Error creating company info block:', error);
    res.status(500).json({ error: 'Failed to create company info block' });
  }
});

// Update a company info block
router.put('/company-info-blocks/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const { id } = req.params;
    const { title, description, is_active } = req.body;
    const companyId = req.user.companyId;
    const userId = req.user.id;
    
    // Check if at least one field is provided
    if (!title && description === undefined && is_active === undefined) {
      return res.status(400).json({ error: 'At least one field must be provided for update' });
    }
    
    const updatedBlock = await updateCompanyInfoBlock(parseInt(id), companyId, userId, {
      title,
      description,
      is_active
    });
    
    if (!updatedBlock) {
      return res.status(404).json({ error: 'Company info block not found' });
    }
    
    res.json(updatedBlock);
  } catch (error) {
    console.error('Error updating company info block:', error);
    res.status(500).json({ error: 'Failed to update company info block' });
  }
});

// Delete a company info block
router.delete('/company-info-blocks/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const { id } = req.params;
    const companyId = req.user.companyId;
    
    const deletedBlock = await deleteCompanyInfoBlock(parseInt(id), companyId);
    
    if (!deletedBlock) {
      return res.status(404).json({ error: 'Company info block not found' });
    }
    
    res.json({ message: 'Company info block deleted successfully' });
  } catch (error) {
    console.error('Error deleting company info block:', error);
    res.status(500).json({ error: 'Failed to delete company info block' });
  }
});

// Get TinyMCE API Key
router.get('/editor-config', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const apiKey = await getAppSetting('tinymce_api_key');
    if (!apiKey) {
      return res.status(500).json({ error: 'TinyMCE API key not configured' });
    }
    res.json({ apiKey });
  } catch (error) {
    console.error('Error fetching editor config:', error);
    res.status(500).json({ error: 'Failed to fetch editor configuration' });
  }
});

// Get TinyMCE API key from app_settings
router.get('/editor-key', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT value FROM public.app_settings WHERE id = 4'
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'API key not found' });
    }

    res.json({ value: result.rows[0].value });
  } catch (error) {
    console.error('Error fetching TinyMCE API key:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get company details
router.get('/company-details', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const companyId = req.user.companyId;
    const result = await pool.query(
      `SELECT name, industry, company_size, website, address, phone, 
              company_information, company_values, company_mission
       FROM companies 
       WHERE id = $1`,
      [companyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching company details:', error);
    res.status(500).json({ error: 'Failed to fetch company details' });
  }
});

// Update company details
router.put('/company-details', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const companyId = req.user.companyId;
    const {
      name,
      industry,
      company_size,
      website,
      address,
      phone,
      company_information,
      company_values,
      company_mission
    } = req.body;

    const result = await pool.query(
      `UPDATE companies 
       SET name = $1, 
           industry = $2, 
           company_size = $3, 
           website = $4, 
           address = $5, 
           phone = $6,
           company_information = $7,
           company_values = $8,
           company_mission = $9,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [
        name,
        industry,
        company_size,
        website,
        address,
        phone,
        company_information,
        company_values,
        company_mission,
        companyId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating company details:', error);
    res.status(500).json({ error: 'Failed to update company details' });
  }
});

export default router; 