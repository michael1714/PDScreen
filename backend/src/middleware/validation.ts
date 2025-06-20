import { body, validationResult, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.type === 'field' ? err.path : 'unknown',
        message: err.msg,
        value: err.type === 'field' ? err.value : undefined
      }))
    });
  }
  next();
};

// Login validation
export const validateLogin: ValidationChain[] = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .trim()
    .escape()
];

// Registration validation
export const validateRegistration: ValidationChain[] = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number'),
  body('firstName')
    .isLength({ min: 2, max: 50 })
    .trim()
    .escape()
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .isLength({ min: 2, max: 50 })
    .trim()
    .escape()
    .withMessage('Last name must be between 2 and 50 characters'),
  body('accountType')
    .isIn(['personal', 'company'])
    .withMessage('Account type must be either personal or company'),
  body('jobTitle')
    .optional()
    .isLength({ min: 2, max: 100 })
    .trim()
    .escape()
    .withMessage('Job title must be between 2 and 100 characters'),
  body('department')
    .optional()
    .isLength({ min: 2, max: 100 })
    .trim()
    .escape()
    .withMessage('Department must be between 2 and 100 characters'),
  // Company-specific validation
  body('companyName')
    .if(body('accountType').equals('company'))
    .isLength({ min: 2, max: 100 })
    .trim()
    .escape()
    .withMessage('Company name is required and must be between 2 and 100 characters'),
  body('industry')
    .if(body('accountType').equals('company'))
    .optional()
    .isLength({ min: 2, max: 100 })
    .trim()
    .escape()
    .withMessage('Industry must be between 2 and 100 characters'),
  body('companySize')
    .if(body('accountType').equals('company'))
    .optional()
    .isLength({ min: 1, max: 50 })
    .trim()
    .escape()
    .withMessage('Company size must be between 1 and 50 characters'),
  body('website')
    .if(body('accountType').equals('company'))
    .optional()
    .isURL()
    .withMessage('Please provide a valid website URL'),
  body('phone')
    .if(body('accountType').equals('company'))
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number')
];

// File upload validation
export const validateFileUpload: ValidationChain[] = [
  body('title')
    .isLength({ min: 2, max: 200 })
    .trim()
    .escape()
    .withMessage('Title must be between 2 and 200 characters'),
  body('company_id')
    .isInt({ min: 1 })
    .withMessage('Valid company ID is required')
];

// Responsibility validation
export const validateResponsibility: ValidationChain[] = [
  body('responsibility_name')
    .isLength({ min: 2, max: 500 })
    .trim()
    .escape()
    .withMessage('Responsibility name must be between 2 and 500 characters'),
  body('responsibility_percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Responsibility percentage must be between 0 and 100'),
  body('LLM_Desc')
    .optional()
    .isLength({ max: 2000 })
    .trim()
    .escape()
    .withMessage('LLM description must be less than 2000 characters')
]; 