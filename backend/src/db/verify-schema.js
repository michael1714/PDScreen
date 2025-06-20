const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/pdscreen'
});

async function verifySchema() {
  try {
    console.log('🔍 Verifying database schema...\n');

    // Check if companies table exists
    const companiesCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'companies'
      ORDER BY ordinal_position;
    `);

    console.log('📋 Companies table structure:');
    if (companiesCheck.rows.length > 0) {
      companiesCheck.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    } else {
      console.log('  ❌ Companies table not found!');
    }

    // Check if users table exists
    const usersCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    console.log('\n👥 Users table structure:');
    if (usersCheck.rows.length > 0) {
      usersCheck.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    } else {
      console.log('  ❌ Users table not found!');
    }

    // Check if position_descriptions has company_id column
    const pdCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'position_descriptions' AND column_name = 'company_id';
    `);

    console.log('\n📄 Position Descriptions company_id column:');
    if (pdCheck.rows.length > 0) {
      console.log(`  ✅ company_id column exists: ${pdCheck.rows[0].data_type}`);
    } else {
      console.log('  ❌ company_id column not found in position_descriptions!');
    }

    // Check foreign key constraints
    const fkCheck = await pool.query(`
      SELECT 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND (tc.table_name = 'users' OR tc.table_name = 'position_descriptions');
    `);

    console.log('\n🔗 Foreign Key Constraints:');
    if (fkCheck.rows.length > 0) {
      fkCheck.rows.forEach(fk => {
        console.log(`  ✅ ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    } else {
      console.log('  ❌ No foreign key constraints found!');
    }

    // Check indexes
    const indexCheck = await pool.query(`
      SELECT indexname, tablename, indexdef
      FROM pg_indexes
      WHERE tablename IN ('users', 'companies', 'position_descriptions')
      ORDER BY tablename, indexname;
    `);

    console.log('\n📊 Indexes:');
    if (indexCheck.rows.length > 0) {
      indexCheck.rows.forEach(idx => {
        console.log(`  ✅ ${idx.indexname} on ${idx.tablename}`);
      });
    } else {
      console.log('  ❌ No indexes found!');
    }

    // Check triggers
    const triggerCheck = await pool.query(`
      SELECT trigger_name, event_object_table, action_statement
      FROM information_schema.triggers
      WHERE event_object_table IN ('users', 'companies');
    `);

    console.log('\n⚡ Triggers:');
    if (triggerCheck.rows.length > 0) {
      triggerCheck.rows.forEach(trigger => {
        console.log(`  ✅ ${trigger.trigger_name} on ${trigger.event_object_table}`);
      });
    } else {
      console.log('  ❌ No triggers found!');
    }

    console.log('\n🎉 Schema verification complete!');

  } catch (error) {
    console.error('❌ Error verifying schema:', error.message);
  } finally {
    await pool.end();
  }
}

verifySchema(); 