import BookingService from '../services/booking.service.js';
import Seat from '../models/seat.model.js';

const bookingController = {
  async createBooking(req, res) {
    try {
      const { userId, departureStationId, arrivalStationId, seatId } = req.body;
      
      // Validate input
      if (!userId || !departureStationId || !arrivalStationId || !seatId) {
        return res.status(400).json({ message: 'All fields are required' });
      }
      
      // Use the transactional method to book the seat
      const booking = await Seat.bookSeatWithTransaction(
        userId, 
        departureStationId, 
        arrivalStationId, 
        seatId
      );
      
      res.status(201).json(booking);
    } catch (error) {
      console.error('Booking error:', error);
      
      // Send appropriate error message based on the error type
      if (error.message.includes('no longer available')) {
        return res.status(409).json({ 
          message: 'This seat was just booked by another user. Please select a different seat.'
        });
      }
      
      res.status(500).json({ message: error.message });
    }
  },
  
  async createMultipleBookings(req, res) {
    try {
      const { userId, departureStationId, arrivalStationId, seatIds } = req.body;
      
      // Validate input
      if (!userId || !departureStationId || !arrivalStationId || !seatIds || !seatIds.length) {
        return res.status(400).json({ message: 'All fields are required' });
      }
      
      // Use the booking service to create multiple bookings in a transaction
      const bookings = await BookingService.createMultipleBookings(
        userId,
        departureStationId,
        arrivalStationId,
        seatIds
      );
      
      res.status(201).json(bookings);
    } catch (error) {
      console.error('Multiple booking error:', error);
      
      if (error.message.includes('no longer available')) {
        return res.status(409).json({ 
          message: error.message
        });
      }
      
      res.status(500).json({ message: error.message });
    }
  },
  
  async getUserBookings(req, res) {
    try {
      const userId = req.query.userId || req.user?.id; // Get from query or authenticated user
      
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      
      const bookings = await BookingService.getUserBookings(userId);
      res.json(bookings);
    } catch (error) {
      console.error('Get bookings error:', error);
      res.status(500).json({ message: error.message });
    }
  },
  
  async cancelBooking(req, res) {
    try {
      const { bookingId } = req.params;
      const userId = req.body.userId || req.user?.id;
      
      if (!bookingId || !userId) {
        return res.status(400).json({ message: 'Booking ID and User ID are required' });
      }
      
      const updatedBooking = await BookingService.cancelBooking(bookingId, userId);
      
      res.json(updatedBooking);
    } catch (error) {
      console.error('Cancel booking error:', error);
      
      if (error.message.includes('not found') || error.message.includes('not authorized')) {
        return res.status(404).json({ message: error.message });
      }
      
      res.status(500).json({ message: error.message });
    }
  }
};

export default bookingController;