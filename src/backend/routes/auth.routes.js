import { Router } from 'express';
import authController from '../controllers/auth.controller.js';

const router = Router();

// Use the methods directly from the imported controller
router.post('/register', (req, res) => authController.register(req, res));
router.post('/login', (req, res) => authController.login(req, res));
export default router;