// routes/booking.routes.js
import { Router } from 'express';
import bookingController from '../controllers/booking.controller.js';

const router = Router();

// Standard single-seat booking endpoint
router.post('/create', bookingController.createBooking);

// New endpoint for booking multiple seats in one transaction
router.post('/multiple', bookingController.createMultipleBookings);

// Get user bookings
router.get('/user-bookings', bookingController.getUserBookings);

// Cancel booking
router.post('/:bookingId/cancel', bookingController.cancelBooking);

export default router;