-- Security Audit Script for Company Isolation
-- Run this in pgAdmin to verify that PDs are properly isolated by company

-- 1. Check if all PDs have a company_id
SELECT 
    'PDs without company_id' as check_type,
    COUNT(*) as count
FROM position_descriptions 
WHERE company_id IS NULL

UNION ALL

-- 2. Check for orphaned PDs (company_id references non-existent company)
SELECT 
    'Orphaned PDs' as check_type,
    COUNT(*) as count
FROM position_descriptions pd
LEFT JOIN companies c ON pd.company_id = c.id
WHERE c.id IS NULL

UNION ALL

-- 3. Check for users without company_id
SELECT 
    'Users without company_id' as check_type,
    COUNT(*) as count
FROM users 
WHERE company_id IS NULL

UNION ALL

-- 4. Check for orphaned users
SELECT 
    'Orphaned users' as check_type,
    COUNT(*) as count
FROM users u
LEFT JOIN companies c ON u.company_id = c.id
WHERE c.id IS NULL;

-- 5. Show company distribution
SELECT 
    c.name as company_name,
    c.account_type,
    COUNT(pd.id) as pd_count,
    COUNT(u.id) as user_count
FROM companies c
LEFT JOIN position_descriptions pd ON c.id = pd.company_id
LEFT JOIN users u ON c.id = u.company_id
GROUP BY c.id, c.name, c.account_type
ORDER BY c.id;

-- 6. Check for any cross-company access patterns (should return 0 rows)
SELECT 
    'Cross-company responsibilities' as check_type,
    COUNT(*) as count
FROM responsibilities r
JOIN position_descriptions pd1 ON r.pd_id = pd1.id
JOIN position_descriptions pd2 ON r.pd_id = pd2.id
WHERE pd1.company_id != pd2.company_id;

-- 7. Verify foreign key constraints
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('position_descriptions', 'users', 'responsibilities')
ORDER BY tc.table_name, kcu.column_name; 