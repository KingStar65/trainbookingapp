import pool from '../db.config.js';
import LockManager from '../utils/lock-manager.js';

class BookingService {
    async createMultipleBookings(userId, departureStationId, arrivalStationId, seatIds) {
      let client;
      try {
       // Start transaction
        await client.query('BEGIN');
        // Try to acquire advisory locks on all seats
        const lockedSeatIds = await LockManager.acquireMultipleSeatLocks(
          seatIds, departureStationId, arrivalStationId, client
        );
        
        // If not all seats could be locked, fail early
        if (lockedSeatIds.length !== seatIds.length) {
          throw new Error('Unable to secure all selected seats. Some may have been booked by another user.');
        }
        
        // Check seat availability with FOR UPDATE to prevent race conditions
        for (const seatId of seatIds) {
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
          
          const { rows } = await client.query(availabilityQuery, [
            seatId, departureStationId, arrivalStationId
          ]);
          
          if (rows[0].is_booked) {
            throw new Error(`Seat ${seatId} is no longer available`);
          }
        }
        
        // All seats are available, create bookings
        const bookingInsertPromises = seatIds.map(seatId => {
          const insertQuery = `
            INSERT INTO bookings 
            (user_id, departure_station_id, arrival_station_id, seat_id, status, created_at) 
            VALUES ($1, $2, $3, $4, 'active', NOW()) 
            RETURNING *
          `;
          
          return client.query(insertQuery, [
            userId, departureStationId, arrivalStationId, seatId
          ]);
        });
        
        const bookingResults = await Promise.all(bookingInsertPromises);
        const bookings = bookingResults.map(result => result.rows[0]);
        
        // Commit the transaction
        await client.query('COMMIT');
        
        return bookings;
      } catch (error) {
        // Rollback in case of error
        if (client) {
          await client.query('ROLLBACK');
        }
        throw error;
      } finally {
        // Release the client back to the pool
        if (client) {
          client.release();
        }
      }
    }
    /**
     * Cancel a booking with proper transaction handling and locking
     */
    async cancelBooking(bookingId, userId) {
      let client;
      try {
        await client.query('BEGIN');
        // First check if the booking exists and belongs to the user
        const checkQuery = `
          SELECT * FROM bookings 
          WHERE id = $1 AND user_id = $2
          FOR UPDATE
        `;
        const checkResult = await client.query(checkQuery, [bookingId, userId]);
        if (checkResult.rows.length === 0) {
          throw new Error('Booking not found or you are not authorized to cancel it');
        }
        const booking = checkResult.rows[0];
        // Acquire an advisory lock on the seat to prevent race conditions
        const lockAcquired = await LockManager.acquireSeatLock(
          booking.seat_id, booking.departure_station_id, booking.arrival_station_id, client
        );
        if (!lockAcquired) {
          throw new Error('Unable to cancel booking at this time. Please try again.');
        }
        // Update booking status to cancelled
        const updateQuery = `
          UPDATE bookings 
          SET status = 'cancelled', updated_at = NOW() 
          WHERE id = $1 
          RETURNING *
        `;
        
        const updateResult = await client.query(updateQuery, [bookingId]);
        
        // Add to booking history
        const historyQuery = `
          INSERT INTO booking_history
          (booking_id, user_id, departure_station_id, arrival_station_id, seat_id, old_status, new_status)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        
        await client.query(historyQuery, [
          bookingId, 
          booking.user_id, 
          booking.departure_station_id, 
          booking.arrival_station_id,
          booking.seat_id,
          booking.status,
          'cancelled'
        ]);
        
        await client.query('COMMIT');
        
        return updateResult.rows[0];
      } catch (error) {
        if (client) {
          await client.query('ROLLBACK');
        }
        throw error;
      } finally {
        if (client) {
          client.release();
        }
      }
    }
    
    /**
     * Get all bookings for a user 
     */
    async getUserBookings(userId) {
      const query = `
        SELECT 
          b.*,
          d.station_name as departure_station,
          a.station_name as arrival_station,
          s.seat_number,
          s.car_number
        FROM bookings b
        JOIN stations d ON b.departure_station_id = d.id
        JOIN stations a ON b.arrival_station_id = a.id
        JOIN seats s ON b.seat_id = s.id
        WHERE b.user_id = $1
        ORDER BY b.created_at DESC
      `;
      
      const { rows } = await pool.query(query, [userId]);
      return rows;
    }
    
    /**
     * Get real-time seat availability with timeout for responsiveness
     */
    async getSeatAvailability(departureStationId, arrivalStationId) {
      try {
        // Use a query timeout to ensure responsiveness
        const { rows } = await pool.query(`
          SELECT 
            s.id, s.seat_number, s.car_number, s.status,
            NOT EXISTS (
              SELECT 1 FROM bookings b
              WHERE b.seat_id = s.id
              AND b.status = 'active'
              AND (
                (b.departure_station_id >= $1 AND b.departure_station_id < $2) OR
                (b.arrival_station_id > $1 AND b.arrival_station_id <= $2) OR
                (b.departure_station_id <= $1 AND b.arrival_station_id >= $2)
              )
            ) as is_available
          FROM seats s
          ORDER BY s.car_number, s.seat_number
        `, [departureStationId, arrivalStationId], { query_timeout: 5000 });
        
        return rows;
      } catch (error) {
        console.error('Error getting seat availability:', error);
        throw error;
      }
    }
  }

export default new BookingService();