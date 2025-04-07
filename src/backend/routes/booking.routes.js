// routes/booking.routes.js
import { Router } from 'express';
import bookingController from '../controllers/booking.controller.js';
import authMiddleware from '../auth.middleware.js';

const router = Router();

// Standard single-seat booking endpoint
router.post('/create', bookingController.createBooking);

// New endpoint for booking multiple seats in one transaction
router.post('/multiple', bookingController.createMultipleBookings);

router.get('/user-bookings', authMiddleware, bookingController.getUserBookings);
router.post('/:bookingId/cancel', authMiddleware, bookingController.cancelBooking);

export default router;