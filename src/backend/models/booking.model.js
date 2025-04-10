import pool from '../db.config.js'

const Booking = {
  async create(userId, departureStationId, arrivalStationId, seatId) {
    const query = `
      INSERT INTO bookings 
      (user_id, departure_station_id, arrival_station_id, seat_id, status) 
      VALUES ($1, $2, $3, $4, 'active') 
      RETURNING *`;
      
    const values = [userId, departureStationId, arrivalStationId, seatId];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },
  async bookSeatWithTransaction(userId, departureStationId, arrivalStationId, seatId) {
      const client = await pool.connect();
      try {
        // Start transaction
        await client.query('BEGIN');
        // First check if the seat is still available (with FOR UPDATE to lock the row)
        const availabilityQuery = `
          SELECT EXISTS (
            SELECT 1 FROM bookings
            WHERE seat_id = $1
            AND status = 'active'
            AND (
              (departure_station_id >= $2 AND departure_station_id < $3) OR
              (arrival_station_id > $2 AND arrival_station_id <= $3) OR
              (departure_station_id <= $2 AND arrival_station_id >= $3)
            )
            FOR UPDATE
          ) AS is_booked
        `;
        
        const availabilityResult = await client.query(availabilityQuery, [
          seatId, departureStationId, arrivalStationId
        ]);
        
        const isBooked = availabilityResult.rows[0].is_booked;
        
        if (isBooked) {
          throw new Error('Selected seat is no longer available');
        }
        
        // If the seat is available, proceed with booking
        const insertQuery = `
          INSERT INTO bookings 
          (user_id, departure_station_id, arrival_station_id, seat_id, status) 
          VALUES ($1, $2, $3, $4, 'active') 
          RETURNING *
        `;
        
        const insertResult = await client.query(insertQuery, [
          userId, departureStationId, arrivalStationId, seatId
        ]);
        
        // Commit the transaction
        await client.query('COMMIT');
        
        return insertResult.rows[0];
      } catch (error) {
        // Rollback in case of error
        await client.query('ROLLBACK');
        throw error;
      } finally {
        // Release the client back to the pool
        client.release();
      }
    },
  async findByUser(userId) {
    const query = `
      SELECT 
        b.*,
        d.station_name as departure_station,
        a.station_name as arrival_station,
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