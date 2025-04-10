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
        client = await getClientWithTimeout(5000);
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

  
  }

export default new BookingService();