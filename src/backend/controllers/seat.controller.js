import Seat from '../models/seat.model.js';

const seatController = {
  async getSeats(req, res) {
    try {
      const seats = await Seat.getAllSeats();
      res.json(seats);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  
  async getAvailableSeats(req, res) {
    try {
      const { departureStationId, arrivalStationId } = req.query;
      
      if (!departureStationId || !arrivalStationId) {
        return res.status(400).json({ message: 'Departure and arrival stations are required' });
      }
      
      const availableSeats = await Seat.getAvailableSeats(
        parseInt(departureStationId), 
        parseInt(arrivalStationId)
      );
      
      res.json(availableSeats);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  
  async checkSeatAvailability(req, res) {
    try {
      const { seatId, departureStationId, arrivalStationId } = req.query;
      
      if (!seatId || !departureStationId || !arrivalStationId) {
        return res.status(400).json({ 
          message: 'Seat ID, departure station and arrival station are required' 
        });
      }
      
      const isAvailable = await Seat.checkSeatAvailability(
        parseInt(seatId),
        parseInt(departureStationId),
        parseInt(arrivalStationId)
      );
      
      res.json({ seatId, isAvailable });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

export default seatController;