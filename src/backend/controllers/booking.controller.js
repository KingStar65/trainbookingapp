import Booking from '../models/booking.model.js';
import Seat from '../models/seat.model.js';

const bookingController = {
  async createBooking(req, res) {
    try {
      const { userId, departureStationId, arrivalStationId, seatId, travelDate } = req.body;
      
      // Validate input
      if (!userId || !departureStationId || !arrivalStationId || !seatId || !travelDate) {
        return res.status(400).json({ message: 'All fields are required' });
      }
      
      // Check if seat is available for this journey
      const isAvailable = await Seat.checkSeatAvailability(
        seatId, 
        departureStationId, 
        arrivalStationId
      );
      
      if (!isAvailable) {
        return res.status(400).json({ 
          message: 'Selected seat is not available for this journey'
        });
      }
      
      // Create booking
      const booking = await Booking.create(
        userId,
        departureStationId,
        arrivalStationId,
        seatId,
        travelDate
      );
      
      res.status(201).json(booking);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  
  async getUserBookings(req, res) {
    try {
      const userId = req.query.userId || req.user?.id; // Get from query or authenticated user
      
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      
      const bookings = await Booking.findByUser(userId);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  
  async cancelBooking(req, res) {
    try {
      const { bookingId } = req.params;
      
      if (!bookingId) {
        return res.status(400).json({ message: 'Booking ID is required' });
      }
      
      const updatedBooking = await Booking.updateStatus(bookingId, 'cancelled');
      
      if (!updatedBooking) {
        return res.status(404).json({ message: 'Booking not found' });
      }
      
      res.json(updatedBooking);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

export default bookingController;