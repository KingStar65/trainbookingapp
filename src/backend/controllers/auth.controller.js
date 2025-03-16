import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

const authController = {
  async login(req, res) {
    try {
      const { email, password } = req.body;
      console.log('Attempting login with:', { email, password });

      // Find user
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(400).json({ message: 'User not found' });
      }

      console.log('User found:', { 
        providedPassword: password,
        storedPassword: user.password_enc 
      });

      // Simple password check (for testing only)
      if (password !== user.password_enc) {  
        return res.status(400).json({ message: 'Invalid password' });
      }

      // Generate JWT
      const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'your_jwt_secret',
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
      console.log('Attempting registration with:', { username, email });

      // Create new user
      const newUser = await User.create(username, email, password);

      // Generate JWT
      const token = jwt.sign(
        { id: newUser.id },
        process.env.JWT_SECRET || 'your_jwt_secret',
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