import pool from '../db.config.js';
class LockManager {
  /**
   * Acquire an advisory lock for a specific seat booking
   * 
   * @param {number} seatId 
   * @param {number} departureStationId 
   * @param {number} arrivalStationId 
   * @param {object} client 
   * @returns {Promise<boolean>} 
   */
  static async acquireSeatLock(seatId, departureStationId, arrivalStationId, client) {
    try {
      const lockId = this.generateLockId(seatId, departureStationId, arrivalStationId);
      const { rows } = await client.query(`SELECT pg_try_advisory_xact_lock($1)`, [lockId]);
      
      return rows[0].pg_try_advisory_xact_lock;
    } catch (error) {
      console.error('Lock acquisition error:', error);
      return false;
    }
  }
  
  /**
   * Generate a numeric lock ID from seat and journey information
   * 
   * @param {number} seatId 
   * @param {number} departureStationId 
   * @param {number} arrivalStationId 
   * @returns {number} - A 32-bit integer to use as lock ID
   */
  static generateLockId(seatId, departureStationId, arrivalStationId) {
    // Simple hashing approach - can be improved if needed
    // This gives a numeric ID within PostgreSQL's advisory lock range
    const hash = (seatId * 100000) + (departureStationId * 1000) + arrivalStationId;
    return hash % 2147483647; // Keep within range of PostgreSQL integer
  }
  
  /**
   * Acquire locks for multiple seats in a single transaction
   * 
   * @param {Array<number>} seatIds - Array of seat IDs to lock
   * @param {number} departureStationId - Departure station ID
   * @param {number} arrivalStationId - Arrival station ID
   * @param {object} client - PostgreSQL client from the connection pool
   * @returns {Promise<Array<number>>} - Array of seat IDs for which locks were acquired
   */
  static async acquireMultipleSeatLocks(seatIds, departureStationId, arrivalStationId, client) {
    const lockedSeatIds = [];
    
    for (const seatId of seatIds) {
      const lockAcquired = await this.acquireSeatLock(
        seatId, departureStationId, arrivalStationId, client
      );
      
      if (lockAcquired) {
        lockedSeatIds.push(seatId);
      }
    }
    
    return lockedSeatIds;
  }
}

export default LockManager;