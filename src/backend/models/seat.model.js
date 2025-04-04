import pool from '../db.config.js';

const Seat = {
  async getAllSeats() {
    const query = 'SELECT * FROM seats';
    const { rows } = await pool.query(query);
    return rows;
  },

  async updateSeatStatus(seatId, status) {
    const query = 'UPDATE seats SET status = $1 WHERE id = $2 RETURNING *';
    const { rows } = await pool.query(query, [status, seatId]);
    return rows[0];
  },
  
  async checkSeatAvailability(seatId, departureStationId, arrivalStationId) {
    // This query checks if the seat is booked for any journey that overlaps with the requested journey
    const query = `
      SELECT COUNT(*) AS booking_count
      FROM bookings
      WHERE seat_id = $1
      AND status = 'active'
      AND (
        -- Check if this booking overlaps with the requested journey
        -- Case 1: The existing booking's departure is within our journey
        (departure_station_id >= $2 AND departure_station_id < $3) OR
        
        -- Case 2: The existing booking's arrival is within our journey
        (arrival_station_id > $2 AND arrival_station_id <= $3) OR
        
        -- Case 3: The existing booking completely encompasses our journey
        (departure_station_id <= $2 AND arrival_station_id >= $3)
      )
    `;
    
    const { rows } = await pool.query(query, [seatId, departureStationId, arrivalStationId]);
    return parseInt(rows[0].booking_count) === 0; // Returns true if seat is available
  },
  
  async getAvailableSeats(departureStationId, arrivalStationId) {
    // This query returns all seats along with their availability status for the given journey
    const query = `
      SELECT s.*, 
        (CASE WHEN EXISTS (
          SELECT 1 FROM bookings b
          WHERE b.seat_id = s.id
          AND b.status = 'active'
          AND (
            -- Same overlap logic as in checkSeatAvailability
            (b.departure_station_id >= $1 AND b.departure_station_id < $2) OR
            (b.arrival_station_id > $1 AND b.arrival_station_id <= $2) OR
            (b.departure_station_id <= $1 AND b.arrival_station_id >= $2)
          )
        ) THEN false ELSE true END) AS is_available
      FROM seats s
      ORDER BY s.car_number, s.seat_number
    `;
    
    const { rows } = await pool.query(query, [departureStationId, arrivalStationId]);
    return rows;
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
  }
};

export default Seat;