import { Router } from 'express';
import seatController from '../controllers/seat.controller.js';

const router = Router();

router.get('/', seatController.getSeats);
router.get('/available', seatController.getAvailableSeats);
router.get('/check-availability', seatController.checkSeatAvailability);

export default router;