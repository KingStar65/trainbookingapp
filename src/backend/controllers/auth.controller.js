import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import bcrypt from 'bcrypt';

const authController = {
  async login(req, res) {
    try {
      const { email, password } = req.body;
      // Checks if user exist
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(400).json({ message: 'User not found' });
      }
      // Compare passwords using bcrypt
      const passwordMatch = await bcrypt.compare(password, user.password_enc);
      if (!passwordMatch) {
        return res.status(400).json({ message: 'Invalid password' });
      }
      // Generate JWT using only the environment variable
      const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: error.message });
    }
  },

  async register(req, res) {
    try {
      const { username, email, password } = req.body;
      
      const newUser = await User.create(username, email, password);

      const token = jwt.sign(
        { id: newUser.id },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      res.status(201).json({
        message: 'Registration successful',
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle specific error cases
      if (error.message.includes('Username already taken')) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      if (error.message.includes('Email already registered')) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      
      res.status(500).json({ 
        message: 'Error occurred during registration. Please try again.' 
      });
    }
  }
};

export default authController;