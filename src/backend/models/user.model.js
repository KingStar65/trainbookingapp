import pool from '../db.config.js';
import bcrypt from 'bcrypt';

const User = {
  async create(username, email, password) {
    try {
      // First check if username exists
      const checkUsername = 'SELECT * FROM users WHERE username = $1';
      const usernameResult = await pool.query(checkUsername, [username]);
      if (usernameResult.rows.length > 0) {
        throw new Error('Username already taken');
      }

      // Then check if email exists
      const checkEmail = 'SELECT * FROM users WHERE email = $1';
      const emailResult = await pool.query(checkEmail, [email]);
      if (emailResult.rows.length > 0) {
        throw new Error('Email already registered');
      }

      // Hash password before storing
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // If both checks pass, create the user with hashed password
      const insertQuery = `
        INSERT INTO users (username, email, password_enc) 
        VALUES ($1, $2, $3) 
        RETURNING id, username, email, created_at`;
      
      const values = [username, email, hashedPassword];
      const { rows } = await pool.query(insertQuery, values);
      
      return rows[0];
    } catch (error) {
      if (error.code === '23505') { // PostgreSQL unique violation error code
        if (error.constraint === 'users_username_key') {
          throw new Error('Username already taken');
        } else if (error.constraint === 'users_email_key') {
          throw new Error('Email already registered');
        }
      }
      throw new Error(`Registration failed: ${error.message}`);
    }
  },

  async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const { rows } = await pool.query(query, [email]);
    return rows[0];
  }
};

export default User;