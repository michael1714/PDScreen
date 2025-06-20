import bcrypt from 'bcryptjs';
import { pool } from './init';

async function hashExistingPasswords() {
  try {
    console.log('Starting password hashing process...');
    
    // Get all users with plaintext passwords
    const result = await pool.query('SELECT id, password_hash FROM users');
    
    for (const user of result.rows) {
      // Check if password is already hashed (bcrypt hashes start with $2a$ or $2b$)
      if (!user.password_hash.startsWith('$2')) {
        console.log(`Hashing password for user ID: ${user.id}`);
        
        // Hash the plaintext password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(user.password_hash, saltRounds);
        
        // Update the user with the hashed password
        await pool.query(
          'UPDATE users SET password_hash = $1 WHERE id = $2',
          [hashedPassword, user.id]
        );
        
        console.log(`Password hashed for user ID: ${user.id}`);
      } else {
        console.log(`Password already hashed for user ID: ${user.id}`);
      }
    }
    
    console.log('Password hashing process completed!');
  } catch (error) {
    console.error('Error hashing passwords:', error);
  } finally {
    await pool.end();
  }
}

hashExistingPasswords(); 