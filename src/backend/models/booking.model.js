import pool from '../db.config.js'

const Booking = {
  async create(userId, departureStationId, arrivalStationId, seatId) {
    const query = `
      INSERT INTO bookings 
      (user_id, departure_station_id, arrival_station_id, seat_id) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *`;
      
    // Remove travelDate from values - it's not in the SQL query
    const values = [userId, departureStationId, arrivalStationId, seatId];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },
  
  async findByUser(userId) {
    const query = `
      SELECT 
        b.*,
        d.name as departure_station,
        a.name as arrival_station,
        s.seat_number
      FROM bookings b
      JOIN stations d ON b.departure_station_id = d.id
      JOIN stations a ON b.arrival_station_id = a.id
      JOIN seats s ON b.seat_id = s.id
      WHERE b.user_id = $1`;
    
    const { rows } = await pool.query(query, [userId]);
    return rows;
  },

  async updateStatus(bookingId, status) {
    const query = 'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *';
    const { rows } = await pool.query(query, [status, bookingId]);
    return rows[0];
  }
};

export default Booking;