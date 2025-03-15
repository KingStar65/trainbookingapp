// routes/booking.routes.js
import { Router } from 'express';
import bookingController from '../controllers/booking.controller.js';

const router = Router();

router.post('/create', bookingController.createBooking);
router.get('/user-bookings', bookingController.getUserBookings);

export default router;